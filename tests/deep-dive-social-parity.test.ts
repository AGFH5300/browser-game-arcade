import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {hashPassword,verifyPassword,normalizeUsername,validUsername,friendIds,allowedAvatar,validOrigin,token,sessionHash,type SocialAccount} from '../lib/deep-dive-social';
import {eloDeltas} from '../lib/deep-dive-rated';
import {newRoom,joinRoom,publicRoom,type PartyQuestion} from '../lib/deep-dive-party';

test('usernames validate and password hashes remain salted/non-reversible',async()=>{
 assert.equal(normalizeUsername('  Ansh_123 '),'ansh_123');
 assert(validUsername('ansh_123'));
 for(const s of ['aa','a-b','a@b','.dot','01234567890123456789'])assert(!validUsername(s),s);
 const one=await hashPassword('safe_test_passphrase_2026');
 const two=await hashPassword('safe_test_passphrase_2026');
 assert.notEqual(one,two);
 assert(!one.includes('safe_test_passphrase_2026'));
 assert(await verifyPassword('safe_test_passphrase_2026',one));
 assert(!(await verifyPassword('wrong_password',one)));
 assert(!(await verifyPassword('anything','invalid')));
});
test('sessions are salted random identifiers, hashed before database storage',()=>{
 const first=token(),second=token();
 assert.notEqual(first,second);assert.notEqual(sessionHash(first),first);
 assert.match(sessionHash(first),/^[0-9a-f]{64}$/);
});
test('same-origin protects state mutation',()=>{
 const good=new NextRequest('https://browser-game-arcade.vercel.app/api/deep-dive/social',{headers:{origin:'https://browser-game-arcade.vercel.app'}});
 const bad=new NextRequest('https://browser-game-arcade.vercel.app/api/deep-dive/social',{headers:{origin:'https://untrusted.example'}});
 assert(validOrigin(good));assert(!validOrigin(bad));
});
test('friend ordering is canonical and avatar locks require verified server account streak',()=>{
 assert.deepEqual(friendIds('1','2'),['1','2']);
 assert.deepEqual(friendIds('2','1'),['1','2']);
 const account={daily_streak:14} as SocialAccount;
 assert(allowedAvatar('krill',null));
 assert(!allowedAvatar('schooler',null));
 assert(allowedAvatar('squid',account));
 assert(!allowedAvatar('evil',account));
 assert(!allowedAvatar('unknown',account));
});
test('rated Elo is symmetric, stable and favors underdogs',()=>{
 assert.deepEqual(eloDeltas(1200,1200,1),[16,-16]);
 assert.deepEqual(eloDeltas(1200,1200,.5),[0,0]);
 assert.deepEqual(eloDeltas(1200,1200,0),[-16,16]);
 assert(eloDeltas(1000,1500,1)[0]>16);
});
test('public Party data never leaks account ID, passwords or membership secrets',()=>{
 const id='abc0000-test-account-id',other='xyz0000-test-account-id';
 const h=newRoom('ABCDEF','First',false,100,[ 'q1' ],{accountId:id,avatar:'krill',maxMembers:2,minMembers:2});
 const guest=joinRoom(h.room,'Second',101,'krill',other);
 h.room.rated=true;
 const pub=publicRoom(h.room,new Map<string,PartyQuestion>());
 assert.equal(pub.rated,true);
 const out=JSON.stringify(pub);
 for(const secret of [id,other,h.secret,h.id,guest.secret,guest.id]){if(secret===h.id||secret===guest.id)continue;assert(!out.includes(secret))}
 assert(!out.includes('accountId'));
});
test('social client scripts parse and interactive feature hooks exist',()=>{
 for(const p of ['reference-social.js','party.js','reference-boot.js']){
  assert.doesNotThrow(()=>new vm.Script(readFileSync('public/play/deep-dive/'+p,'utf8')),p);
 }
 const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
 assert(html.includes('reference-social.js'));
 assert(html.includes('data-view="friends"'));
 assert(html.includes('data-view="account"'));
 const game=readFileSync('public/play/deep-dive/game.js','utf8');
 assert(game.includes('selectEndless'));
 assert(game.includes("window.DeepDiveSocial?.syncDaily?.(r)"));
 const sound=readFileSync('public/play/deep-dive/reference-sound.js','utf8');
 assert(sound.includes('createOscillator'), 'Krillion uses original synthesized Web Audio, not prerecorded samples');
});
