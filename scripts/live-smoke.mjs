import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.SMOKE_URL||'https://browser-game-arcade-heicz69e7-dxbavg-7923s-projects.vercel.app';
console.log('Ready for admin test password on stdin (not logged).');
const password=await new Promise(resolve=>process.stdin.once('data',d=>{process.stdin.pause();resolve(d.toString().trim())}));
const origin=new URL(base).origin;let cookie='';const report=[];
async function request(path,{method='GET',body,auth=true,originHeader=origin}={}){const r=await fetch(base+path,{method,headers:{...(body instanceof FormData?{}:body?{'Content-Type':'application/json'}:{}),...(auth&&cookie?{Cookie:cookie}:{}),...(method!=='GET'&&originHeader?{Origin:originHeader}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});return r}
let id;
try{
 assert.equal((await request('/api/admin/games',{auth:false})).status,401);report.push('Unauthorized admin API denied');
 assert.equal((await request('/api/auth/login',{method:'POST',body:{username:'admin',password},originHeader:'https://invalid.example'})).status,403);report.push('Cross-origin login denied');
 const login=await request('/api/auth/login',{method:'POST',body:{username:'admin',password}});assert.equal(login.status,200);cookie=login.headers.get('set-cookie')?.split(';')[0]||'';assert(cookie);assert.match(login.headers.get('set-cookie'),/HttpOnly/i);report.push('Admin login + HttpOnly cookie');
 const games=await (await request('/api/admin/games')).json();assert(games.length>=26);report.push('Persistent catalogue read: '+games.length+' games');
 const seed=JSON.parse(await fs.readFile(new URL('../data/seed-games.json',import.meta.url),'utf8'))[0];
 const input={...seed,title:'QA temporary draft',slug:'sidequest-smoke-'+Date.now(),published:false,thumbnailId:seed.thumbnail};
 const create=await request('/api/admin/games',{method:'POST',body:input});assert.equal(create.status,201);id=(await create.json()).id;assert(id);report.push('Create draft');
 assert.equal((await request('/games/'+input.slug)).status,404);assert.equal((await request('/admin/preview/'+input.slug)).status,200);report.push('Draft private + authorized preview');
 input.title='QA updated draft';input.published=true;
 assert.equal((await request('/api/admin/games/'+id,{method:'PUT',body:input})).status,200);assert.equal((await request('/games/'+input.slug)).status,200);report.push('Edit + publish appears publicly');
 const fd=new FormData();fd.set('file',new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPQAAAABJRU5ErkJggg==','base64')],'qa.png',{type:'image/png'}));
 const upload=await request('/api/admin/thumbnails',{method:'POST',body:fd});assert.equal(upload.status,201);const image=await upload.json();const read=await request(image.url);assert.equal(read.status,200);assert.equal(read.headers.get('content-type'),'image/png');assert((await read.arrayBuffer()).byteLength>0);report.push('Thumbnail upload and persistent public retrieval');
 input.published=false;assert.equal((await request('/api/admin/games/'+id,{method:'PUT',body:input})).status,200);assert.equal((await request('/games/'+input.slug)).status,404);report.push('Unpublish removes public route');
 assert.equal((await request('/api/admin/games/'+id,{method:'DELETE'})).status,200);id=null;report.push('Delete temporary test game');
 assert.equal((await request('/api/auth/logout',{method:'POST'})).status,200);report.push('Logout');
 console.log(JSON.stringify({base,passed:report.length,checks:report},null,2));
}catch(e){console.error(JSON.stringify({passed:report,failed:e.message}));process.exitCode=1;}finally{if(id){await request('/api/admin/games/'+id,{method:'DELETE'}).catch(()=>{})}process.stdin.destroy()}
