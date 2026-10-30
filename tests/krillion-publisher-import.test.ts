import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('public/play/deep-dive/recovered/publisher-verified');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
test('only 14 publisher-revealed question lists are staged',()=>{
 assert.equal(manifest.questions.length,14);
 assert.equal(manifest.source,'krillion-public-publisher-reveal');
 assert.equal(manifest.importPolicy,'publisher_status_only');
 assert.equal(manifest.provisionalAnswersIncluded,false);
 assert.deepEqual(manifest.questions.map((q:{id:string})=>q.id).sort(),
   [...new Set(manifest.questions.map((q:{id:string})=>q.id))].sort());
});
test('all imported answers preserve six publisher tiers and exclude candidate sources',()=>{
 let n=0;
 for(const item of manifest.questions as Array<{id:string;file:string;answerCount:number;question:string;status:string}>){
  assert.match(item.id,/^KR\d{4}$/);
  assert.equal(item.status,'publisher');
  assert.equal(item.file,item.id+'.json');
  const data=JSON.parse(fs.readFileSync(path.join(root,item.file),'utf8'));
  assert.equal(data.id,item.id);
  assert.equal(data.prompt,item.question);
  assert.equal(data.answers.length,item.answerCount);
  const seen=new Set<string>();
  for(const answer of data.answers){
   assert(answer.value.length>=2);
   assert(Number.isInteger(answer.tier)&&answer.tier>=0&&answer.tier<=5);
   assert.equal(answer.source,'krillion-public-publisher-reveal');
   const key=answer.value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
   assert(!seen.has(key),item.id+' '+answer.value);
   seen.add(key);
  }
  n+=data.answers.length;
 }
 assert.equal(n,48095);
});
test('conflicting original scores are excluded from playable import',()=>{
 const conflicts=JSON.parse(fs.readFileSync(path.join(root,'source-score-conflicts.json'),'utf8'));
 assert.equal(conflicts.length,3);
 const disputed=JSON.parse(fs.readFileSync(path.join(root,'KR0745.json'),'utf8'));
 assert(!disputed.answers.some((a:{value:string})=>a.value==='Dum-E'));
});
test('game only activates the publisher source in Unlimited 3-4 and retains original independent packs',()=>{
 const source=fs.readFileSync('public/play/deep-dive/game.js','utf8');
 assert.match(source,/loadPublisherVerifiedUnlimited\(gameId\)/);
 assert.match(source,/gameId===3\|\|gameId===4/);
 assert.match(source,/provisionalAnswersIncluded!==false/);
 assert.match(source,/published-free-starter-index/);
 assert.match(source,/\.\/questions\.json/);
});
