import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOURCE_TIERS,SOURCE_TIER_POINTS,validatePublicDaily} from '../lib/deep-dive-public-daily';

const reveal=JSON.parse(readFileSync('public/play/deep-dive/recovered/2026-10-29.json','utf8'));
const today={
 date:'2026-10-29',dayNumber:106,resetsAt:'2026-10-30T04:00:00.000Z',
 prompts:reveal.prompts.map((q:{id:string;text:string})=>({id:q.id,text:q.text}))
};
test('Official publicly revealed snapshot has exactly seven prompt sets and 16,727 scored accepted answers',()=>{
 const validated=validatePublicDaily(today,reveal);
 assert.equal(validated.source,'krillion-public-reveal');
 assert.equal(validated.date,'2026-10-29');
 assert.equal(validated.prompts.length,7);
 assert.equal(validated.prompts.reduce((s,q)=>s+q.answers.length,0),16727);
 assert.deepEqual(SOURCE_TIERS.map(x=>SOURCE_TIER_POINTS[x]),[10,15,30,60,85,100]);
 assert.equal(validated.prompts[0].answers[0].tier,'krillion');
 assert.equal(validated.prompts[0].answers[0].score,100);
 for(const p of validated.prompts){
  assert(p.answers.some(a=>a.score===100));
  assert(p.answers.some(a=>a.score===10));
 }
});
test('Rejects mismatched dates, modified scores, altered questions and incomplete sheets',()=>{
 assert.throws(()=>validatePublicDaily({...today,date:'2026-10-28'},reveal),/date/);
 assert.throws(()=>validatePublicDaily({...today,prompts:[...today.prompts.slice(1)]},reveal),/seven/);
 assert.throws(()=>validatePublicDaily({...today,prompts:[{...today.prompts[0],text:'tampered'},...today.prompts.slice(1)]},reveal),/Malformed/);
 const bad={...reveal,prompts:[{...reveal.prompts[0],answers:[{answer:'X',tier:'rare',score:100},...reveal.prompts[0].answers.slice(1)]},...reveal.prompts.slice(1)]};
 assert.throws(()=>validatePublicDaily(today,bad),/Malformed/);
});
