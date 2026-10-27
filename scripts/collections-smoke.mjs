import assert from 'node:assert/strict';
import {createHmac,randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import seed from '../data/seed-games.json' with {type:'json'};
const base=process.env.SMOKE_URL;
if(!base||!process.env.SESSION_SECRET)throw Error('SMOKE_URL and SESSION_SECRET required');
const payload=Buffer.from(JSON.stringify({u:process.env.ADMIN_USERNAME||'admin',i:Date.now(),e:Date.now()+600000,n:randomBytes(12).toString('hex')})).toString('base64url');
const cookie='arcade_admin='+payload+'.'+createHmac('sha256',process.env.SESSION_SECRET).update(payload).digest('base64url');
const checks=[];let fixture;
async function req(path,method='GET',body,auth=true){return fetch(base+path,{method,headers:{...(auth?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...(method!=='GET'?{Origin:base}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)})}
try{
 assert.equal((await req('/api/admin/games','GET',null,false)).status,401);checks.push('Unauthorized API rejected');
 const before=await (await req('/api/admin/games')).json();assert.equal(before.filter(g=>g.collections.includes('html5_puzzles')).length,26);checks.push('Original 26 games retained; authenticated catalogue available');
 const hex=before.filter(g=>g.slug==='hextris');assert.equal(hex.length,1);assert.deepEqual(new Set(hex[0].collections),new Set(['classics','html5_puzzles']));checks.push('Single Hextris record in both collections');
 const input={...seed[0],slug:'qa-collections-'+Date.now(),title:'QA collection fixture',published:false,collections:['classics'],thumbnailId:seed[0].thumbnail};
 const created=await req('/api/admin/games','POST',input);assert.equal(created.status,201);fixture=(await created.json()).id;checks.push('Admin creates classified draft');
 assert.equal((await req('/games/'+input.slug)).status,404);checks.push('Draft stays private');
 input.collections=['classics','html5_puzzles'];assert.equal((await req('/api/admin/games/'+fixture,'PUT',input)).status,200);
 const updated=await (await req('/api/admin/games')).json();assert.deepEqual(updated.find(g=>g.id===fixture).collections,input.collections);checks.push('Admin persists dual collection assignment');
 const invalid=await req('/api/admin/games/'+fixture,'PUT',{...input,collections:['unrecognized']});assert.equal(invalid.status,400);checks.push('Unknown collection rejected');
 assert.equal((await req('/api/admin/games/'+fixture,'DELETE')).status,200);fixture=null;checks.push('Own disposable fixture removed');
 const after=await (await req('/api/admin/games')).json();assert.deepEqual(after.map(g=>g.id).sort(),before.map(g=>g.id).sort());checks.push('Every pre-existing game ID preserved');
 const report={base,passed:checks.length,checks};await writeFile(new URL('../docs/verification/collections-api.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(fixture)await req('/api/admin/games/'+fixture,'DELETE')}
