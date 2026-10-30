import {NextRequest,NextResponse} from 'next/server';
import {randomInt} from 'node:crypto';
import {getDb} from '@/lib/db';
import {accountFromRequest,validOrigin} from '@/lib/deep-dive-social';
import {newRoom,joinRoom,applyAction,makeCode,type PartyQuestion} from '@/lib/deep-dive-party';
import bank from '../../../../public/play/deep-dive/questions.json';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const ok=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:{'Cache-Control':'no-store'}});
const fail=(s:string,n=400)=>ok({error:s},n);
const questions=new Map<string,PartyQuestion>((bank.questions as PartyQuestion[]).map(x=>[x.id,x]));
function shuffled(){
 const ids=[...questions.keys()];
 for(let i=ids.length-1;i>0;i--){const j=randomInt(i+1);[ids[i],ids[j]]=[ids[j],ids[i]]}
 return ids;
}
export async function GET(req:NextRequest){
 try{
  const user=await accountFromRequest(req);
  if(!user)return fail('Sign in to join rated matchmaking',401);
  const sql=getDb();
  const rows=await sql.query(`SELECT state,room_code,player_id,player_secret,desired_capacity,queued_at FROM deep_dive_matchmaking
    WHERE account_id=$1 LIMIT 1`,[user.id]);
  const row=rows[0];
  if(!row)return ok({status:'idle',rating:Number(user.rating)});
  if(row.state==='waiting'&&new Date(String(row.queued_at)).getTime()<Date.now()-180000){
   await sql.query('DELETE FROM deep_dive_matchmaking WHERE account_id=$1 AND state=\'waiting\'',[user.id]);
   return ok({status:'expired',rating:Number(user.rating)});
  }
  return ok({status:row.state,roomCode:row.room_code||undefined,
    playerId:row.state==='matched'?row.player_id:undefined,
    secret:row.state==='matched'?row.player_secret:undefined,
    rating:Number(user.rating)});
 }catch(e){console.error('Rated queue read',e instanceof Error?e.message:'unknown');return fail('Matchmaking temporarily unavailable',503)}
}
export async function POST(req:NextRequest){
 if(!validOrigin(req))return fail('Cross-site matchmaking action blocked',403);
 try{
  const user=await accountFromRequest(req);
  if(!user)return fail('Sign in to play rated',401);
  const body=await req.json() as {action?:string};
  const sql=getDb();
  if(body.action==='cancel'){
   await sql.query('DELETE FROM deep_dive_matchmaking WHERE account_id=$1 AND state=\'waiting\'',[user.id]);
   return ok({status:'idle'});
  }
  if(body.action!=='queue')return fail('Unsupported matchmaking action',404);
  // Only 1v1 ranked matches have a defined competitive rating. Other table sizes
  // remain available through unrated Quick Play/Host.
  await sql.query(`INSERT INTO deep_dive_matchmaking(account_id,desired_capacity,rated,state,updated_at)
    VALUES ($1,2,true,'waiting',now()) ON CONFLICT(account_id) DO UPDATE
    SET updated_at=now() WHERE deep_dive_matchmaking.state='waiting'`,[user.id]);
  const own=await sql.query('SELECT state,room_code,player_id,player_secret FROM deep_dive_matchmaking WHERE account_id=$1',[user.id]);
  if(own[0]?.state==='matched')return ok({status:'matched',roomCode:own[0].room_code,playerId:own[0].player_id,secret:own[0].player_secret});
  const candidates=await sql.query(`SELECT q.account_id,a.username,a.display_name,a.rating FROM deep_dive_matchmaking q
    JOIN deep_dive_accounts a ON a.id=q.account_id
    WHERE q.account_id<>$1 AND q.state='waiting' AND q.rated=true AND q.desired_capacity=2
      AND q.updated_at>now()-interval '3 minutes'
    ORDER BY ABS(a.rating-$2),q.queued_at LIMIT 4`,[user.id,Number(user.rating)]);
  for(const target of candidates){
   const code=makeCode(),now=Date.now();
   const host=newRoom(code,user.display_name,false,now,shuffled(),{maxMembers:2,minMembers:2,avatar:'krill',accountId:user.id});
   const guest=joinRoom(host.room,String(target.display_name).toLowerCase()===user.display_name.toLowerCase()?String(target.username):String(target.display_name),now+1,'krill',String(target.account_id));
   host.room.members.find(m=>m.id===guest.id)!.ready=true;
   host.room.rated=true;
   applyAction(host.room,host.id,host.secret,{type:'start'},now+2,questions);
   const matched=await sql.query(`WITH locked AS (
      SELECT account_id FROM deep_dive_matchmaking WHERE account_id IN ($1,$2) AND state='waiting'
      FOR UPDATE SKIP LOCKED
    ), pair AS (
      UPDATE deep_dive_matchmaking q SET state='matched',room_code=$3,updated_at=now(),
        player_id=CASE WHEN q.account_id=$1 THEN $4 ELSE $6 END,
        player_secret=CASE WHEN q.account_id=$1 THEN $5 ELSE $7 END
      WHERE q.account_id IN (SELECT account_id FROM locked) AND (SELECT count(*) FROM locked)=2
      RETURNING account_id
    ), created AS (
      INSERT INTO deep_dive_party_rooms(room_code,state,revision)
      SELECT $3,$8::jsonb,0 WHERE (SELECT count(*) FROM pair)=2
      ON CONFLICT(room_code) DO NOTHING RETURNING room_code
    ) SELECT room_code FROM created`,[
     user.id,String(target.account_id),code,host.id,host.secret,guest.id,guest.secret,JSON.stringify(host.room)
   ]);
   if(matched.length)return ok({status:'matched',roomCode:code,playerId:host.id,secret:host.secret});
  }
  return ok({status:'waiting',rating:Number(user.rating)});
 }catch(e){console.error('Rated queue join',e instanceof Error?e.message:'unknown');return fail('Matchmaking temporarily unavailable',503)}
}
