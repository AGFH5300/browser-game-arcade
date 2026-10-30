import {NextRequest,NextResponse} from 'next/server';
import {getDb} from '@/lib/db';
import {accountFromRequest,SESSION_COOKIE,SESSION_DAYS,normalizeUsername,displayName,validUsername,
 hashPassword,verifyPassword,token,id,sha,sessionHash,makeSession,rateStatus,recordFailure,clearFailures,
 friendIds,privateProfile,validOrigin,nowNY,type SocialAccount} from '@/lib/deep-dive-social';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const ok=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
const fail=(error:string,status=400)=>ok({error},status);
const authCookie=(response:NextResponse,raw:string|null)=>{
 response.cookies.set(SESSION_COOKIE,raw||'',{
  httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/deep-dive',
  maxAge:raw?SESSION_DAYS*86400:0
 });return response;
};
const verifyPair=(a:string,b:string)=>friendIds(a,b);
const alias=(v:unknown)=>String(v||'').trim().slice(0,128);
const normalizeAnswer=(v:unknown)=>String(v||'').toLowerCase().normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/\+/g,' plus ')
 .replace(/#/g,' sharp ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim().replace(/^the /,'');
const socialFields='id,username,display_name,invite_token,share_answers,daily_streak,rating,rated_games,rated_wins,rated_losses';
export async function GET(req:NextRequest){
 try{
  const action=req.nextUrl.searchParams.get('action')||'me';
  const sql=getDb(),account=await accountFromRequest(req);
  if(action==='me')return ok({account:account?privateProfile(account):null});
  if(action==='invite'){
   const key=req.nextUrl.searchParams.get('token');
   if(!key||key.length>100)return fail('Invite not found',404);
   const rows=await sql.query('SELECT id,username,display_name FROM deep_dive_accounts WHERE invite_token=$1',[key]);
   const a=rows[0];return a?ok({invite:{username:a.username,displayName:a.display_name}}):fail('Invite expired',404);
  }
  if(!account)return fail('Sign in to view this section',401);
  if(action==='friends'){
   const rows=await sql.query(`SELECT f.state,f.requester,f.blocked_by,
     other.id,other.username,other.display_name,other.daily_streak,other.rating,other.rated_games
     FROM deep_dive_friendships f
     JOIN deep_dive_accounts other ON other.id=(CASE WHEN f.account_a=$1 THEN f.account_b ELSE f.account_a END)
     WHERE f.account_a=$1 OR f.account_b=$1 ORDER BY CASE WHEN f.state='pending' THEN 0 ELSE 1 END,other.username LIMIT 200`,[account.id]);
   return ok({friends:rows.map(row=>({id:row.id,username:row.username,displayName:row.display_name,
    status:row.state,requestedByMe:row.requester===account.id,blockedByMe:row.blocked_by===account.id,
    rating:Number(row.rating),dailyStreak:Number(row.daily_streak)}))});
  }
  if(action==='rankings'){
   const rows=await sql.query('SELECT username,display_name,rating,rated_games,rated_wins,rated_losses FROM deep_dive_accounts WHERE rated_games>0 ORDER BY rating DESC,rated_games DESC LIMIT 50');
   return ok({rankings:rows});
  }
  if(action==='leaderboard'){
   const day=req.nextUrl.searchParams.get('date')||nowNY();
   if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||day>nowNY())return fail('Invalid daily date');
   const self=await sql.query('SELECT account_id FROM deep_dive_daily_results WHERE account_id=$1 AND dive_date=$2 AND verified=true',[account.id,day]);
   if(!self.length)return ok({date:day,complete:false,standings:[]});
   const rows=await sql.query(`SELECT a.id,a.username,a.display_name,a.share_answers,s.points,s.results
    FROM deep_dive_accounts a JOIN deep_dive_daily_results s ON s.account_id=a.id AND s.dive_date=$2 AND s.verified=true
    WHERE a.id=$1 OR EXISTS(SELECT 1 FROM deep_dive_friendships f WHERE f.state='accepted' AND
      ((f.account_a=$1 AND f.account_b=a.id) OR (f.account_b=$1 AND f.account_a=a.id)))
    ORDER BY s.points DESC,a.username LIMIT 200`,[account.id,day]);
   return ok({date:day,complete:true,standings:rows.map(x=>({username:x.username,displayName:x.display_name,
    points:Number(x.points),answers:x.id===account.id||x.share_answers?x.results:null,
    me:x.id===account.id}))});
  }
  return fail('Unsupported view',404);
 }catch(e){
  console.error('Deep Dive social read',e instanceof Error?e.message:'unknown');
  return fail('Friends and accounts are temporarily unavailable',503);
 }
}
export async function POST(req:NextRequest){
 if(!validOrigin(req))return fail('Cross-site account action blocked',403);
 let action='';
 try{
  const body=await req.json() as Record<string,unknown>;
  action=String(body.action||'');
  const sql=getDb();
  if(action==='register'||action==='login'){
   const username=normalizeUsername(body.username),password=String(body.password||'');
   if(!validUsername(username))return fail('Username must be 3–18 lowercase letters, digits or underscores');
   if(password.length<10||password.length>128)return fail('Password must be 10–128 characters');
   const ip=req.headers.get('x-vercel-forwarded-for')?.split(',')[0]||req.headers.get('x-real-ip')||'unknown';
   const limiter=sha(username+'|'+ip+'|'+String(process.env.DATABASE_URL||'sidequest'));
   if(await rateStatus(limiter))return fail('Too many attempts. Try again in 15 minutes.',429);
   if(action==='register'){
    const name=displayName(body.displayName)||username;
    const encoded=await hashPassword(password),accountId=id(),invite=token();
    try{
     await sql.query('INSERT INTO deep_dive_accounts(id,username,display_name,password_hash,invite_token) VALUES ($1,$2,$3,$4,$5)',
      [accountId,username,name,encoded,invite]);
    }catch{return fail('That username is unavailable',409)}
    await clearFailures(limiter);
    const session=await makeSession(accountId);
    const rows=await sql.query('SELECT '+socialFields+' FROM deep_dive_accounts WHERE id=$1',[accountId]);
    return authCookie(ok({account:privateProfile(rows[0] as SocialAccount)},201),session);
   }
   const rows=await sql.query('SELECT * FROM deep_dive_accounts WHERE username=$1 LIMIT 1',[username]);
   const account=rows[0] as SocialAccount|undefined;
   // Keep the invalid-user timing work comparable to a real password check.
   const dummy='scrypt:v1:1234567890abcdef1234567890abcdef:'+('00'.repeat(64));
   const match=await verifyPassword(password,account?.password_hash||dummy);
   if(!account||!match){await recordFailure(limiter);return fail('Incorrect username or password',401)}
   await clearFailures(limiter);
   const session=await makeSession(account.id);
   return authCookie(ok({account:privateProfile(account)}),session);
  }
  const account=await accountFromRequest(req);
  if(action==='logout'){
   const raw=req.cookies.get(SESSION_COOKIE)?.value;
   if(raw)await sql.query('DELETE FROM deep_dive_sessions WHERE token_hash=$1',[sessionHash(raw)]);
   return authCookie(ok({account:null}),null);
  }
  if(!account)return fail('Sign in first',401);
  if(action==='privacy'){
   const share=body.shareAnswers===true;
   const rows=await sql.query('UPDATE deep_dive_accounts SET share_answers=$1 WHERE id=$2 RETURNING '+socialFields,[share,account.id]);
   return ok({account:privateProfile(rows[0] as SocialAccount)});
  }
  if(action==='rotateInvite'){
   const invite=token();
   const rows=await sql.query('UPDATE deep_dive_accounts SET invite_token=$1 WHERE id=$2 RETURNING '+socialFields,[invite,account.id]);
   return ok({account:privateProfile(rows[0] as SocialAccount)});
  }
  if(action==='friendAdd'){
   const lookup=alias(body.username).toLowerCase(),invite=alias(body.inviteToken);
   if(!lookup&&!invite)return fail('Enter a friend username or invite code');
   const rows=await sql.query('SELECT id FROM deep_dive_accounts WHERE username=$1 OR invite_token=$2 LIMIT 1',[lookup,invite]);
   const target=rows[0]?.id as string|undefined;
   if(!target)return fail('No account matches that invitation',404);
   if(target===account.id)return fail('You cannot add yourself');
   const [a,b]=verifyPair(account.id,target);
   const old=await sql.query('SELECT state,blocked_by FROM deep_dive_friendships WHERE account_a=$1 AND account_b=$2',[a,b]);
   if(old[0]?.state==='blocked')return fail('Friend request unavailable',403);
   if(old[0]?.state==='accepted')return ok({status:'accepted'});
   await sql.query(`INSERT INTO deep_dive_friendships(account_a,account_b,requester,state) VALUES ($1,$2,$3,'pending')
    ON CONFLICT(account_a,account_b) DO UPDATE SET requester=$3,state='pending',updated_at=now()
    WHERE deep_dive_friendships.state='pending'`,[a,b,account.id]);
   return ok({status:'pending'});
  }
  if(['friendAccept','friendRemove','friendBlock'].includes(action)){
   const target=String(body.friendId||'');
   if(!/^[0-9a-f-]{36}$/.test(target)||target===account.id)return fail('Invalid friend');
   const [a,b]=verifyPair(account.id,target);
   if(action==='friendAccept'){
    const rows=await sql.query(`UPDATE deep_dive_friendships SET state='accepted',updated_at=now()
      WHERE account_a=$1 AND account_b=$2 AND state='pending' AND requester<>$3 RETURNING state`,[a,b,account.id]);
    return rows.length?ok({status:'accepted'}):fail('No pending invitation',404);
   }
   if(action==='friendRemove'){
    await sql.query('DELETE FROM deep_dive_friendships WHERE account_a=$1 AND account_b=$2',[a,b]);
    return ok({status:'removed'});
   }
   const exists=await sql.query('SELECT id FROM deep_dive_accounts WHERE id=$1',[target]);
   if(!exists.length)return fail('Account not found',404);
   await sql.query(`INSERT INTO deep_dive_friendships(account_a,account_b,requester,state,blocked_by)
     VALUES ($1,$2,$3,'blocked',$3) ON CONFLICT(account_a,account_b)
     DO UPDATE SET state='blocked',blocked_by=$3,updated_at=now()`,[a,b,account.id]);
   return ok({status:'blocked'});
  }
  if(action==='syncDaily'){
   const date=String(body.date||''),results=body.results;
   if(date!==nowNY()||!Array.isArray(results)||results.length!==7)return fail('Only today’s complete seven-round daily can be verified');
   const sourceResponse=await fetch(new URL('/api/deep-dive/public-daily',req.url),{cache:'no-store',signal:AbortSignal.timeout(13000)});
   if(!sourceResponse.ok)return fail('Daily verification unavailable',503);
   const source=await sourceResponse.json() as {date:string;prompts:Array<{id:string;answers:Array<{answer:string;score:number}>}>};
   if(source.date!==date||source.prompts.length!==7)return fail('Daily source mismatch');
   let points=0;
   for(let i=0;i<7;i++){
    const entry=results[i] as Record<string,unknown>,prompt=source.prompts[i];
    if(String(entry.id||'')!=='recovered:'+date+':'+prompt.id)return fail('Prompt identity mismatch');
    const answer=normalizeAnswer(entry.answer),expected=answer?prompt.answers.find(x=>normalizeAnswer(x.answer)===answer):null;
    const awarded=expected?.score||0;
    if(Number(entry.points)!==awarded)return fail('Unverified daily result');
    points+=awarded;
   }
   const safeResults=results.map((x:Record<string,unknown>)=>({id:String(x.id),answer:String(x.answer||'').slice(0,256),points:Number(x.points)}));
   await sql.query(`INSERT INTO deep_dive_daily_results (account_id,dive_date,points,results,verified)
     VALUES ($1,$2,$3,$4::jsonb,true) ON CONFLICT(account_id,dive_date)
     DO UPDATE SET points=GREATEST(deep_dive_daily_results.points,EXCLUDED.points),
       results=CASE WHEN EXCLUDED.points>deep_dive_daily_results.points THEN EXCLUDED.results ELSE deep_dive_daily_results.results END,
       verified=true`,[account.id,date,points,JSON.stringify(safeResults)]);
   const dates=await sql.query('SELECT dive_date FROM deep_dive_daily_results WHERE account_id=$1 AND verified=true ORDER BY dive_date DESC LIMIT 366',[account.id]);
   let streak=0,check=new Date(date+'T12:00:00Z');
   if(dates.length&&new Date(String(dates[0].dive_date)).toISOString().slice(0,10)!==date)check=new Date(check.getTime()-86400000);
   const daySet=new Set(dates.map(x=>new Date(String(x.dive_date)).toISOString().slice(0,10)));
   while(streak<366&&daySet.has(check.toISOString().slice(0,10))){streak++;check=new Date(check.getTime()-86400000)}
   const rows=await sql.query('UPDATE deep_dive_accounts SET daily_streak=$1 WHERE id=$2 RETURNING '+socialFields,[streak,account.id]);
   return ok({verified:true,points,account:privateProfile(rows[0] as SocialAccount)});
  }
  return fail('Unsupported account action',404);
 }catch(e){
  console.error('Deep Dive social '+action,e instanceof Error?e.message:'unknown');
  return fail('Account action temporarily unavailable',503);
 }
}
