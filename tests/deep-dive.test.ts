import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import added from '../data/added-games.json';
import {gameSchema} from '../lib/validation';
import {getEmbedSandbox,isAllowedEmbedUrl} from '../lib/embeds';
import {selectGames} from '../lib/catalogue';
import type {Game} from '../lib/types';
import {
 newRoom,joinRoom,applyAction,expireTurn,publicRoom,normalizePartyAnswer,
 type PartyQuestion
} from '../lib/deep-dive-party';

const game=added.find(x=>x.slug==='deep-dive');
const questions=JSON.parse(readFileSync('public/play/deep-dive/questions.json','utf8'));
const normalize=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\+/g,' plus ').replace(/#/g,' sharp ').replace(/[^a-z0-9]+/g,' ').trim();
const questionMap=new Map<string,PartyQuestion>(questions.questions.map((q:PartyQuestion)=>[q.id,q]));

test('Deep Dive is registered as a native in-frame Sidequest original',()=>{
 assert(game);assert.equal(gameSchema.safeParse(game).success,true);
 assert.equal(game.engine,'html5');
 assert.equal(game.gameUrl,'/play/deep-dive/index-public-art.html');
 assert(isAllowedEmbedUrl(game.gameUrl));
 assert(getEmbedSandbox(game.gameUrl).includes('allow-same-origin'));
 assert.equal(game.published,true);
 assert.equal(isAllowedEmbedUrl(game.gameUrl),true);
 assert(getEmbedSandbox(game.gameUrl).includes('allow-same-origin'),'local multiplayer requires access to the own-origin API');
 assert(!getEmbedSandbox('/play/deep-dive/unknown.html').includes('allow-same-origin'));
 assert.equal(selectGames([{...game,playCount:0,likes:0} as Game],{q:'Deep Dive'}).total,1);
 assert.match(readFileSync('public'+game.thumbnail,'utf8'),/^<svg/);
});

test('the original question bank has 90 prompts and 1,000+ distinct answer entries',()=>{
 assert.equal(questions.questions.length,90);
 assert.equal(questions.themes.length,9);
 assert(questions.notes.includes('not real-time'));
 const ids=new Set<string>();
 for(const q of questions.questions){
  assert(!ids.has(q.id));ids.add(q.id);
  assert(q.prompt.length>=13&&!q.prompt.includes('Krillion'),q.id);
  assert(questions.themes.includes(q.theme));
  assert(q.answers.length>=4,q.id);
  const used=new Set<string>();
  for(const a of q.answers){
   assert(Number.isInteger(a.tier)&&a.tier>=0&&a.tier<=5,q.id);
   for(const v of [a.value,...(a.aliases||[])]){
    const key=normalize(v);
    assert(key.length>0);
    assert(!used.has(key),'Duplicate alias in '+q.id+': '+v);
    used.add(key);
   }
  }
 }
 for(const theme of questions.themes)
  assert.equal(questions.questions.filter((q:PartyQuestion)=>q.theme===theme).length,10);
 assert(questions.questions.reduce((sum:number,q:PartyQuestion)=>sum+q.answers.length,0)>=1000);
});

test('solo game and original multiplayer scripts parse and have complete mode controls',()=>{
 for(const file of ['game.js','party.js']){
  const source=readFileSync('public/play/deep-dive/'+file,'utf8');
  assert.doesNotThrow(()=>new vm.Script(source));
 }
 const source=readFileSync('public/play/deep-dive/game.js','utf8');
 assert(source.includes('sidequest:deep-dive:player:v1'));
 assert(source.includes('Date.now()+25000'));
 assert(source.includes('active.misses>=3'));
 assert(source.includes('profile.worldRecords'));
 assert(source.includes('profile.pearls+=active.score'));
 assert(source.includes("currentView==='party'"));
 const html=readFileSync('public/play/deep-dive/index.html','utf8');
 assert(html.includes('party.js')&&html.includes('game.js')&&html.includes('Puffer Party'));
});

test('party has separate credentials and no token disclosure in public response',()=>{
 const now=Date.now(),qids=questions.questions.map((q:PartyQuestion)=>q.id);
 const {room,id,secret}=newRoom('ABCDEF','Host',true,now,qids);
 const second=joinRoom(room,'Guest',now+1);
 const pub=JSON.stringify(publicRoom(room,questionMap));
 assert(!pub.includes(secret));assert(!pub.includes(second.secret));
 assert.equal(room.members.length,2);
 assert.equal(room.members[0].ready,true);
 assert.equal(room.members[1].ready,false);
 assert.equal(publicRoom(room,questionMap).phase,'lobby');
 assert.throws(()=>joinRoom(room,'host',now+2),/already/);
 assert.throws(()=>joinRoom(room,'A',now+2),/Nickname/);
 assert.notEqual(id,second.id);
});

test('party enforces ready states, answer validation, no repeats, turn rotation and heart rewards',()=>{
 const now=100000,qids=questions.questions.map((q:PartyQuestion)=>q.id);
 const {room,id,secret}=newRoom('ABCDEF','Host',false,now,qids);
 const guest=joinRoom(room,'Guest',now);
 assert.throws(()=>applyAction(room,id,secret,{type:'start'},now+1,questionMap),/ready/);
 applyAction(room,guest.id,guest.secret,{type:'ready',ready:true},now+2,questionMap);
 applyAction(room,id,secret,{type:'start'},now+3,questionMap);
 assert.equal(room.phase,'playing');assert.equal(room.turnId,id);
 const q=questionMap.get(room.questionIds[0]);assert(q);
 const first=q.answers[0],alias=first.aliases?.[0]||first.value;
 assert.equal(normalizePartyAnswer(first.value),normalizePartyAnswer(first.value.toUpperCase()));
 assert.throws(()=>applyAction(room,id,secret,{type:'answer',answer:'arbitrary wrong answer'},now+4,questionMap),/Unrecognized/);
 applyAction(room,id,secret,{type:'answer',answer:alias},now+5,questionMap);
 assert.equal(room.turnId,guest.id);
 assert(room.members[0].score>0);
 assert.throws(()=>applyAction(room,guest.id,guest.secret,{type:'answer',answer:first.value},now+6,questionMap),/already/);
 applyAction(room,guest.id,guest.secret,{type:'pass'},now+7,questionMap);
 assert.equal(room.members[1].hearts,2);
 assert.equal(room.questionIndex,1);
 // Two turn timeouts cost hearts without relying on the browser clock.
 assert(expireTurn(room,now+18010));
 assert(room.members.some(x=>x.hearts<3));
});

test('the server rejects unauthorized players and accepts chat without exposing secrets',()=>{
 const now=Date.now(),qids=questions.questions.map((q:PartyQuestion)=>q.id);
 const {room,id,secret}=newRoom('ABCDEF','First',true,now,qids);
 assert.throws(()=>applyAction(room,id,'invalid',{type:'ready',ready:true},now,questionMap),/member/);
 applyAction(room,id,secret,{type:'chat',text:'hello'},now+2000,questionMap);
 assert.equal(room.messages[0].text,'hello');
 assert.throws(()=>applyAction(room,id,secret,{type:'chat',text:'too fast'},now+2500,questionMap),/quickly/);
});
