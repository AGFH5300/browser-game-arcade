import {randomBytes,randomUUID,createHash,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import type {NextRequest} from 'next/server';
import {getDb} from '@/lib/db';

const scrypt=promisify(scryptCallback);
export const SESSION_COOKIE='dd_sidequest_session';
export const SESSION_DAYS=30;
export const normalizeUsername=(value:unknown)=>String(value||'').trim().toLowerCase();
export const displayName=(value:unknown)=>String(value||'').trim().replace(/[<>\x00-\x1f]/g,'').slice(0,24);
export const validUsername=(value:string)=>/^[a-z0-9_]{3,18}$/.test(value);
export const token=()=>randomBytes(24).toString('base64url');
export const sha=(v:string)=>createHash('sha256').update(v).digest('hex');
export const hashPassword=async(value:string)=>{
  const salt=randomBytes(16).toString('hex');
  const digest=await scrypt(value,salt,64) as Buffer;
  return 'scrypt:v1:'+salt+':'+digest.toString('hex');
};
export const verifyPassword=async(value:string,stored:string)=>{
  const parts=stored.split(':');
  if(parts.length!==4||parts[0]!=='scrypt'||parts[1]!=='v1'||!/^[0-9a-f]{32}$/.test(parts[2])||!/^[0-9a-f]{128}$/.test(parts[3]))return false;
  const computed=await scrypt(value,parts[2],64) as Buffer;
  return timingSafeEqual(computed,Buffer.from(parts[3],'hex'));
};
export type SocialAccount={
 id:string;username:string;display_name:string;password_hash?:string;invite_token:string;
 share_answers:boolean;daily_streak:number;rating:number;rated_games:number;rated_wins:number;rated_losses:number;
};
export const publiclyVisible=(a:SocialAccount)=>({
 id:a.id,username:a.username,displayName:a.display_name,dailyStreak:Number(a.daily_streak)||0,
 rating:Number(a.rating)||1200,ratedGames:Number(a.rated_games)||0,
 ratedWins:Number(a.rated_wins)||0,ratedLosses:Number(a.rated_losses)||0
});
export const privateProfile=(a:SocialAccount)=>({...publiclyVisible(a),inviteToken:a.invite_token,shareAnswers:Boolean(a.share_answers)});
export const nowNY=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const sessionHash=(raw:string)=>sha(raw);
export async function accountFromRequest(req:NextRequest):Promise<SocialAccount|null>{
 const raw=req.cookies.get(SESSION_COOKIE)?.value;
 if(!raw||raw.length<36||raw.length>100)return null;
 const sql=getDb();
 const rows=await sql.query('SELECT a.* FROM deep_dive_sessions s JOIN deep_dive_accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.expires_at>now() LIMIT 1',[sessionHash(raw)]);
 return (rows[0] as SocialAccount|undefined)||null;
}
export function validOrigin(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin)return false;
 const actual=new URL(req.url);
 return origin===actual.origin;
}
export async function rateStatus(key:string){
 const sql=getDb();
 const rows=await sql.query('SELECT failures,locked_until FROM deep_dive_auth_limits WHERE identifier=$1',[key]);
 const item=rows[0] as {failures:number;locked_until:string|null}|undefined;
 return Boolean(item?.locked_until&&new Date(item.locked_until).getTime()>Date.now());
}
export async function recordFailure(key:string){
 const sql=getDb();
 await sql.query(`INSERT INTO deep_dive_auth_limits (identifier,failures,locked_until,updated_at)
 VALUES ($1,1,NULL,now()) ON CONFLICT (identifier) DO UPDATE SET
 failures=CASE WHEN deep_dive_auth_limits.updated_at<now()-interval '15 minutes' THEN 1 ELSE deep_dive_auth_limits.failures+1 END,
 locked_until=CASE WHEN deep_dive_auth_limits.updated_at>=now()-interval '15 minutes' AND deep_dive_auth_limits.failures>=4 THEN now()+interval '15 minutes' ELSE NULL END,updated_at=now()`,[key]);
}
export async function clearFailures(key:string){const sql=getDb();await sql.query('DELETE FROM deep_dive_auth_limits WHERE identifier=$1',[key]);}
export async function makeSession(accountId:string){
 const value=token();
 const sql=getDb();
 await sql.query('INSERT INTO deep_dive_sessions(token_hash,account_id,expires_at) VALUES ($1,$2,now()+interval \'30 days\')',[sessionHash(value),accountId]);
 return value;
}
export const friendIds=(a:string,b:string):[string,string]=>a<b?[a,b]:[b,a];
export const avatarStreak:{[name:string]:number}={krill:0,schooler:5,squid:14,angler:30,evil:45};
export const allowedAvatar=(avatar:unknown,account:SocialAccount|null)=>typeof avatar==='string'&&avatar in avatarStreak&&Number(account?.daily_streak||0)>=avatarStreak[avatar];
export const id=()=>randomUUID();
