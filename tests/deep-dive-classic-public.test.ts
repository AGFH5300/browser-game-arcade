import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SOURCE_TIERS,SOURCE_TIER_POINTS} from '../lib/deep-dive-public-daily';

const archive=JSON.parse(readFileSync('public/play/deep-dive/recovered/unlimited-1.json','utf8')) as {rounds:{round:string;text:string;answers:{answer:string;tier:(typeof SOURCE_TIERS)[number];score:number;quip:string}[]}[]};

test('The original publicly revealed Unlimited Classic game 1 has 7 exact prompts and 6,337 scored answers',()=>{
 assert.equal(archive.rounds.length,7);
 assert.deepEqual(archive.rounds.map(x=>x.round),['r1','r2','r3','r4','r5','r6','r7']);
 assert.equal(archive.rounds.reduce((s,q)=>s+q.answers.length,0),6337);
 assert.equal(archive.rounds[0].text,'Name a noodle dish');
 const ramen=archive.rounds[0].answers.find(x=>x.answer==='Ramen');
 assert(ramen);assert.equal(ramen.tier,'plankton');assert.equal(ramen.score,10);
 const gem=archive.rounds[0].answers.find(x=>x.answer==='Banh canh');
 assert(gem);assert.equal(gem.tier,'krillion');assert.equal(gem.score,100);
 for(const q of archive.rounds){
  assert(q.answers.length>50);
  for(const a of q.answers){
   assert(a.answer&&a.answer.length<300);
   assert(SOURCE_TIERS.includes(a.tier));
   assert.equal(a.score,SOURCE_TIER_POINTS[a.tier]);
  }
 }
});
test('Classic #1 is a distinct source-backed mode; Endless/Worlds source and Puffer Party are retained',()=>{
 const script=readFileSync('public/play/deep-dive/game.js','utf8');
 const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
 assert.doesNotThrow(()=>new vm.Script(script));
 assert(script.includes("mode==='classic'"));
 assert(script.includes('startClassic'));
 assert(script.includes('loadSourceClassic'));
 assert(script.includes('unlimited-1.json'));
 assert(script.includes("sourceClassic={date:sheet.date,ids,answerCount}"));
 assert(script.includes("mode==='endless'"));
 assert(script.includes("mode==='world'"));
 assert(html.includes('party.js'));
});
