import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 parseSignal,ICE_SERVERS,MP_ORIGIN,iceCorsHeaders,requestedOrigin,GAME_VERSION
} from '../lib/polytrack-mp';

test('Sidequest private matchmaking accepts PolyTrack 0.6.3 WebRTC handshake packets',()=>{
 assert(parseSignal(JSON.stringify({type:'createInvite',version:GAME_VERSION,key:null}),'host'));
 assert(parseSignal(JSON.stringify({
   version:GAME_VERSION,inviteCode:'ABCDEFG',offer:'v=0\\r\\na=ice-ufrag:abc',
   nickname:'Player',carStyle:'base64-style',countryCode:'AE',mods:[]
 }),'join'));
 for(const type of ['acceptJoin','iceCandidate','declineJoin']){
   const packet={type,version:GAME_VERSION,session:'123e4567-e89b-12d3-a456-426614174000',
     answer:'v=0\\r\\na=fingerprint:sha-256',candidate:{candidate:'candidate:example'}};
   assert(parseSignal(JSON.stringify(packet),'host'),type);
 }
 assert(!parseSignal(JSON.stringify({type:'createInvite',version:'0.5.0'}),'host'));
 assert(!parseSignal('bad json','host'));
 assert(!parseSignal(JSON.stringify({type:'join',version:GAME_VERSION}),'join'));
 assert(!parseSignal('x'.repeat(40_000),'join'));
});
test('multiplayer REST and socket origin restriction uses exact isolated game origin',()=>{
 assert(requestedOrigin(MP_ORIGIN));
 assert.equal(iceCorsHeaders(MP_ORIGIN)?.['Access-Control-Allow-Origin'],MP_ORIGIN);
 for(const other of [null,'https://evil.example','https://browser-game-arcade.vercel.app','https://browser-game-arcade-dxbavg-7923s-projects.vercel.app.evil.example']){
   assert(!requestedOrigin(other));
   assert.equal(iceCorsHeaders(other),null);
 }
 assert.equal(ICE_SERVERS.length,1);
});
test('opt-in game client redirects only multiplayer and ICE URLs',()=>{
 const standard=readFileSync('public/play/archives/polytrack/main.bundle.js','utf8');
 const pilot=readFileSync('public/play/archives/polytrack/private-main.bundle.js','utf8');
 const markup=readFileSync('public/play/archives/polytrack/private-mp.html','utf8');
 assert(markup.includes('private-main.bundle.js'));
 assert(markup.includes('private-mp-layout.js'));
 assert(readFileSync('public/play/archives/polytrack/private-mp-layout.js','utf8').includes('Unofficial PolyModLoader mod by'));
 assert(!markup.includes('src="main.bundle.js"'));
 assert(standard.includes('https://vps.kodub.com/'));
 assert(pilot.includes('window.location.origin + "/api/polytrack-mp/"'));
 assert.equal((pilot.match(/window\.location\.origin \+ "\/api\/polytrack-mp\/"/g)||[]).length,3);
 assert(pilot.includes('"user?version=0.6.3&userToken="')); // User profile endpoint unchanged.
 assert(pilot.includes('"trackOfTheWeek?version=0.6.3"')); // No fake official data.
});
