import assert from 'node:assert/strict';
const base='https://browser-game-arcade.vercel.app';
console.log('Ready for initial administrator password on stdin (not logged).');
const password=await new Promise(resolve=>process.stdin.once('data',d=>{process.stdin.pause();resolve(d.toString().trim())}));
try{
 const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password}),signal:AbortSignal.timeout(25000)});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
 const games=await fetch(base+'/api/admin/games',{headers:{Cookie:cookie},signal:AbortSignal.timeout(25000)});assert.equal(games.status,200);assert.equal((await games.json()).length,26);
 const inbox=await fetch(base+'/admin/messages',{headers:{Cookie:cookie},signal:AbortSignal.timeout(25000)});assert.equal(inbox.status,200);assert((await inbox.text()).includes('Automated launch verification'));
 const out=await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:cookie,Origin:base},signal:AbortSignal.timeout(25000)});assert.equal(out.status,200);
 console.log('PASS: production login, 26 database games, protected contact inbox and logout.');process.exit(0);
}catch(e){console.error('FAIL:',e.message);process.exit(1)}
