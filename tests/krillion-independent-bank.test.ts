import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('public/play/deep-dive/recovered/independent-bank');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
function normalize(s:string){
 return s.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'')
   .replace(/&/g,' and ').replace(/\+/g,' plus ').replace(/#/g,' sharp ')
   .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
test('independent bank has exactly 952 explicitly non-publisher practice questions',()=>{
 assert.equal(manifest.questions.length,952);
 assert.equal(manifest.questionCount,952);
 assert.equal(manifest.answerCount,561107);
 assert.equal(manifest.source,'sidequest-independently-recovered-practice');
 assert.equal(manifest.originalPublisherAcceptanceVerified,false);
 assert.equal(manifest.allScoresEmpiricallyCalibrated,false);
 assert.equal(new Set(manifest.questions.map((q:{id:string})=>q.id)).size,952);
});
test('all independent packs retain six tiers and per-answer provenance without ambiguous matching',()=>{
 let n=0;
 const provenances=new Set(['historical','community','free','gbif','editorial',
  'publisher','ai','reference','geo','lexicon']);
 for(const q of manifest.questions as Array<{id:string;file:string;answerCount:number;question:string}>){
  assert.match(q.id,/^KR\d{4}$/);
  assert.equal(q.file,q.id+'.json');
  const pack=JSON.parse(fs.readFileSync(path.join(root,q.file),'utf8'));
  assert.equal(pack.id,q.id);
  assert.equal(pack.prompt,q.question);
  assert.equal(pack.source,manifest.source);
  assert.equal(pack.originalPublisherAcceptanceVerified,false);
  assert.equal(pack.allScoresEmpiricallyCalibrated,false);
  assert.equal(pack.answers.length,q.answerCount);
  const seen=new Set<string>();
  for(const row of pack.answers as [string,number,string][]){
   assert.equal(row.length,3);
   assert.equal(typeof row[0],'string');
   assert(Number.isInteger(row[1])&&row[1]>=0&&row[1]<=5);
   assert(provenances.has(row[2]));
   const key=normalize(row[0]);
   assert(key);
   assert(!seen.has(key),'duplicate '+q.id+' '+row[0]);
   seen.add(key);
  }
  n+=pack.answers.length;
 }
 assert.equal(n,manifest.answerCount);
});
test('independent Unlimited dive numbering covers all 952 questions exactly once per cycle',()=>{
 const n=manifest.questions.length,cycleSize=Math.ceil(n/7);
 assert.equal(cycleSize,136);
 let count=0;
 for(let gameId=5;gameId<5+cycleSize;gameId++){
  const indexStart:number=((gameId-5)%cycleSize)*7;
  assert.equal(manifest.questions.slice(indexStart,indexStart+7).length,7);
  count+=7;
 }
 assert.equal(count,952);
});
test('mixed provenance is visibly disclosed and independent scores flagged as estimates',()=>{
 const game=fs.readFileSync('public/play/deep-dive/game.js','utf8');
 assert.match(game,/loadIndependentPracticeUnlimited\(gameId\)/);
 assert.match(game,/gameId>=5/);
 assert.match(game,/originalPublisherAcceptanceVerified!==false/);
 assert.match(game,/allScoresEmpiricallyCalibrated!==false/);
 assert.match(game,/sidequest-recovered-estimated/);
 assert.match(game,/INDEPENDENT PRACTICE · ORIGINAL ACCEPTANCE \/ RARITY NOT VERIFIED/);
});
test('strict matching keeps distinct films and character names with different scores',()=>{
 const examples:[string,string,string][]=[['KR0934','Predator','The Predator'],['KR0837','Suicide Squad','The Suicide Squad'],['KR0745','Dume','Dum-E']];
 for(const [id,left,right] of examples){
  const p=JSON.parse(fs.readFileSync(path.join(root,id+'.json'),'utf8'));
  const a=p.answers.find((r:[string,number,string])=>r[0]===left);
  const b=p.answers.find((r:[string,number,string])=>r[0]===right);
  assert(a&&b,id+' both distinct entries present');
  assert.notEqual(a[1],b[1],id+' independent stored scores remain distinct');
  assert.notEqual(normalize(left),normalize(right),id+' strict normalized names differ');
 }
});
