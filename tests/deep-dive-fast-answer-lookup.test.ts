import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

type Entry={value:string;tier:number;aliases?:string[]};
type Question={answers:Entry[]};
const script=readFileSync('public/play/deep-dive/game.js','utf8');
const strict=script.match(/^  const strictNorm=.*;$/m)?.[0];
const start=script.indexOf('  // Conservative typo tolerance:');
const stop=script.indexOf('  function read(key)',start);
assert.ok(strict&&start>0&&stop>start,'extract the production matcher, not a mock');
const matcher=Function(strict+'\n'+script.slice(start,stop)+'\nreturn {findAnswer,prepareAnswerLookup,strictNorm};')() as {
 findAnswer:(q:Question,s:string)=>Entry|null;
 prepareAnswerLookup:(q:Question)=>unknown;
 strictNorm:(s:string)=>string;
};
const lookup=matcher.findAnswer;
assert.match(script,/q\.strictAnswerIndex\?\.get\(strictNorm\(answer\)\)\|\|findAnswer\(q,answer\)/,'matching must use strict titles before typo fallback');

test('case and accents match; one-key typos and transpositions suggest only the canonical answer',()=>{
 const q:Question={answers:[
  {value:'France',tier:0,aliases:['French Republic']},
  {value:'Albert Einstein',tier:5},
  {value:'New Zealand',tier:2}
 ]};
 assert.equal(lookup(q,'FRANCE')?.value,'France');
 assert.equal(lookup(q,'french republic')?.value,'France');
 assert.equal(lookup(q,'frnace')?.value,'France');
 assert.equal(lookup(q,'Einstien')?.value,undefined,'do not match a bare surname against a longer full name');
 assert.equal(lookup(q,'Albert Einstien')?.value,'Albert Einstein');
 assert.equal(lookup(q,'new zealnd')?.value,'New Zealand');
 assert.equal(lookup(q,'') ,null);
 assert.equal(lookup(q,'n'),null);
 assert.equal(lookup(q,'frooongce'),null);
});

test('article-sensitive film titles preserve their distinct canonical answers and scores',()=>{
 const a={value:'Predator',tier:2},b={value:'The Predator',tier:5};
 const q={answers:[a,b]};
 assert.equal(lookup(q,'predator'),a);
 assert.equal(lookup(q,'the predator'),b);
 assert.equal(lookup(q,'the preddator'),b);
 assert.equal(lookup(q,'preddator'),a);
});

test('equally close separate answers must never be guessed',()=>{
 const q={answers:[{value:'stone',tier:0},{value:'stove',tier:5}]};
 assert.equal(lookup(q,'stome'),null);
 assert.equal(lookup(q,'stone')?.tier,0);
 assert.equal(lookup(q,'stove')?.tier,5);
});

test('aliases, accents, punctuation and leading articles keep their intended identities',()=>{
 const q:Question={answers:[
  {value:'Café au lait',tier:1,aliases:['Cafe au lait']},
  {value:'The Lion King',tier:5},{value:'Lion King',tier:3},
  {value:'AC/DC',tier:2}
 ]};
 assert.equal(lookup(q,'cafe au lait')?.tier,1);
 assert.equal(lookup(q,'lion king')?.tier,3);
 assert.equal(lookup(q,'the lion king')?.tier,5);
 assert.equal(lookup(q,'AC DC')?.tier,2);
});

test('a canonical title outranks a conflicting alias; ambiguous aliases never pick a random score',()=>{
 const primary={value:'The Predator',tier:5};
 const other={value:'Predator',tier:2,aliases:['The Predator']};
 const q={answers:[other,primary]};
 assert.equal(lookup(q,'The Predator'),primary);
 assert.equal(lookup(q,'Predator'),other);
 const ambiguous={answers:[{value:'France',tier:0,aliases:['Hexagon']},{value:'Belgium',tier:5,aliases:['Hexagon']}]};
 assert.equal(lookup(ambiguous,'Hexagon'),null);
});

test('real 32,255-answer pack: a mistyped valid answer remains quick and cached',()=>{
 const doc=JSON.parse(readFileSync('public/play/deep-dive/recovered/independent-bank/KR0545.json','utf8'));
 const q:Question={answers:doc.answers.map(([value,tier]:[string,number,string])=>({value,tier}))};
 assert.equal(q.answers.length,32255);
 const t0=performance.now();
 const found=lookup(q,'Ruby Seadragno');
 const firstMs=performance.now()-t0;
 assert.equal(found?.value,'Ruby Seadragon');
 const t1=performance.now();
 assert.equal(lookup(q,'Ruby Seadragno')?.value,'Ruby Seadragon');
 const repeatMs=performance.now()-t1;
 // Keep a generous, architecture-independent test ceiling; measured times
 // are also reported to permit tracking regressions on large packs.
 assert.ok(firstMs<2500,'first indexed typo lookup should stay below 2.5s, took '+firstMs.toFixed(1)+'ms');
 assert.ok(repeatMs<1000,'cached typo lookup should stay below 1s, took '+repeatMs.toFixed(1)+'ms');
 console.log('32k bank typo first='+firstMs.toFixed(1)+'ms repeat='+repeatMs.toFixed(1)+'ms');
});
