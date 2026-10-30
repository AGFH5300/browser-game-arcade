import {getDb} from '@/lib/db';
import type {PartyRoom} from '@/lib/deep-dive-party';

/** Settles a completed authenticated rated Party exactly once, using a single
 * atomic SQL CTE. Browser score claims never change Elo: only server room state
 * decides the winner. Unrated rooms do not affect player records.
 */
/** K=32, symmetric Elo updates. Draws are 0.5 and never award wins/losses. */
export const eloDeltas=(ratingA:number,ratingB:number,outcomeA:number):[number,number]=>{
 const a=Math.max(0,Number(ratingA)||1200),b=Math.max(0,Number(ratingB)||1200);
 const probability=1/(1+10**((b-a)/400));
 const delta=Math.round(32*(outcomeA-probability));
 return [delta,-delta];
};
export async function settleRatedRoom(room:PartyRoom){
 if(!room.rated||room.phase!=='finished'||room.members.length!==2)return;
 const [a,b]=room.members;
 if(!a.accountId||!b.accountId||a.accountId===b.accountId)return;
 const sql=getDb();
 const rows=await sql.query('SELECT id,rating FROM deep_dive_accounts WHERE id IN ($1,$2)',[a.accountId,b.accountId]);
 if(rows.length!==2)return;
 const ra=Number(rows.find(x=>x.id===a.accountId)?.rating||1200);
 const rb=Number(rows.find(x=>x.id===b.accountId)?.rating||1200);
 const scoreA=room.winnerId===a.id?1:room.winnerId===b.id?0:0.5;
 const [deltaA,deltaB]=eloDeltas(ra,rb,scoreA);
 // CTE claim gates both updates: retries and simultaneous pollers cannot
 // award the same match twice.
 await sql.query(`WITH claim AS (
    INSERT INTO deep_dive_rated_matches
      (room_code,account_a,account_b,score_a,score_b,delta_a,delta_b)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT(room_code) DO NOTHING
    RETURNING account_a,account_b,delta_a,delta_b
   )
   UPDATE deep_dive_accounts a SET rating=GREATEST(0,a.rating+
       CASE WHEN a.id=claim.account_a THEN claim.delta_a ELSE claim.delta_b END),
     rated_games=a.rated_games+1,
     rated_wins=a.rated_wins+CASE WHEN (a.id=claim.account_a AND $8=1) OR (a.id=claim.account_b AND $8=0) THEN 1 ELSE 0 END,
     rated_losses=a.rated_losses+CASE WHEN (a.id=claim.account_a AND $8=0) OR (a.id=claim.account_b AND $8=1) THEN 1 ELSE 0 END
   FROM claim WHERE a.id=claim.account_a OR a.id=claim.account_b`,[
    room.code,a.accountId,b.accountId,a.score,b.score,deltaA,deltaB,scoreA
   ]);
 // Clean up matched queue rows after a final result; the browser retains
 // its own private room credentials and can view the finished game.
 await sql.query('DELETE FROM deep_dive_matchmaking WHERE room_code=$1 AND state=\'matched\'',[room.code]);
}
