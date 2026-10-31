import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';

type Entry={value:string;tier:number;aliases?:string[]};
type Question={answers:Entry[]};
const script=readFileSync('public/play/deep-dive/game.js','utf8');
const strict=script.match(/^  const strictNorm=.*;$/m)?.[0];
const start=script.indexOf('  // Source-observed /api/submit behavior');
const stop=script.indexOf('  function read(key)',start);
assert.ok(strict&&start>0&&stop>start,'extract the production matcher, not a mock');
const matcher=Function(strict+'\n'+script.slice(start,stop)+'\nreturn {findAnswer,prepareAnswerLookup,strictNorm,isExactAnswer,editDistance,answerProfile,profileWithinEdits};')() as {
 findAnswer:(q:Question,s:string)=>Entry|null;
 prepareAnswerLookup:(q:Question)=>unknown;
 strictNorm:(s:string)=>string;
 isExactAnswer:(q:Question,s:string,found:Entry)=>boolean;
 editDistance:(a:string,b:string,max:number)=>number;
 answerProfile:(value:string)=>Uint16Array;
 profileWithinEdits:(a:Uint16Array,b:Uint16Array,max:number)=>boolean;
};
const lookup=matcher.findAnswer;
assert.match(script,/q\.strictAnswerIndex\?\.get\(strictNorm\(answer\)\)\|\|findAnswer\(q,answer\)/,'matching must use strict titles before typo fallback');

test('case, aliases and length-dependent typos match the server-observed rules',()=>{
 const q:Question={answers:[
  {value:'France',tier:0,aliases:['French Republic']},
  {value:'Albert Einstein',tier:5},
  {value:'New Zealand',tier:2}
 ]};
 assert.equal(lookup(q,'FRANCE')?.value,'France');
 assert.equal(lookup(q,'french republic')?.value,'France');
 assert.equal(lookup(q,'frnace'),null,'short-name cutoff: two-edit transpositions are not accepted');
 assert.equal(lookup(q,'frace')?.value,'France');
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

test('live Krillion /api/submit correction cases from 31 Oct 2026',()=>{
 // Each case was observed directly against the official daily validator.
 // A correction is not a scored acceptance until the player confirms it.
 const cases:[
  string,string,string|undefined
 ][]=[
  ['Germany','Germnay',undefined],
  ['Germany','Gremany',undefined],
  ['Germany','Germny','Germany'],
  ['Carrot','carot','Carrot'],
  ['Carrot','carorrt',undefined],
  ['Carrot','Carrots','Carrot'],
  ['Carrot','carrote','Carrot'],
  ['Mosquito','Mosqiuto','Mosquito'],
  ['Mosquito','Mosqito','Mosquito'],
  ['Mandarin','Mandrain','Mandarin'],
  ['Persimmon','Persimomn','Persimmon'],
  ['Spider-Man','Spidre-Man','Spider-Man'],
  ['Spider-Man','Spdier-Man','Spider-Man'],
  ['Spider-Man','Spedr-Man','Spider-Man'],
  ['Butternut squash','butternut sqash','Butternut squash'],
  ['Butternut squash','butternut suqash','Butternut squash'],
  ['Papua New Guinea','Papua New Gunea','Papua New Guinea'],
  ['Vampire bat','Vampre bat','Vampire bat']
 ];
 for(const [canonical,typed,expected] of cases){
  const answer={value:canonical,tier:3};
  const actual=lookup({answers:[answer]},typed);
  assert.equal(actual?.value,expected,canonical+' / '+typed);
 }
});
test('official article/punctuation normalization is exact, but similarly spelled names still need confirmation',()=>{
 const germany={value:'Germany',tier:0};
 const q={answers:[germany]};
 assert.equal(lookup(q,'THE Germany'),germany);
 assert.equal(matcher.isExactAnswer(q,'THE Germany',germany),true);
 assert.equal(matcher.isExactAnswer(q,'Germny',germany),false);
 const carrot={value:'Carrot',tier:0};
 assert.equal(matcher.isExactAnswer({answers:[carrot]},'carrot!',carrot),true);
 const spider={value:'Spider-Man',tier:0};
 assert.equal(matcher.isExactAnswer({answers:[spider]},'Spider Man',spider),true);
 assert.equal(matcher.isExactAnswer({answers:[spider]},'Spiderman',spider),false);
 const predator={value:'Predator',tier:0},thePredator={value:'The Predator',tier:5};
 assert.equal(lookup({answers:[predator,thePredator]},'The Predator'),thePredator);
 assert.equal(matcher.isExactAnswer({answers:[predator,thePredator]},'The Predator',thePredator),true);
});

test('bounded Levenshtein and profile filter retain every true close spelling',()=>{
 const reference=(a:string,b:string)=>{
  let row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const next=[i];
   for(let j=1;j<=b.length;j++)
    next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));
   row=next;
  }
  return row[b.length];
 };
 let seed=0x5ade5;
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
 const alphabet='abcdes 123';
 for(let pair=0;pair<6000;pair++){
  const al=random()%46,bl=random()%46;
  let a='',b='';
  for(let i=0;i<al;i++)a+=alphabet[random()%alphabet.length];
  for(let i=0;i<bl;i++)b+=alphabet[random()%alphabet.length];
  const exact=reference(a,b);
  for(const limit of [1,2,3]){
   const got=matcher.editDistance(a,b,limit);
   assert.equal(got,Math.min(exact,limit+1),'banded mismatch '+JSON.stringify({a,b,limit,exact}));
   if(exact<=limit)
    assert.equal(matcher.profileWithinEdits(matcher.answerProfile(a),matcher.answerProfile(b),limit),true,
      'frequency filter false negative '+JSON.stringify({a,b,limit}));
  }
 }
});
test('duplicate alias collisions stay unresolved and never award an unrelated tier',()=>{
 const a={value:'Alpha',tier:0,aliases:['common name']};
 const b={value:'Beta',tier:5,aliases:['common name']};
 const q={answers:[a,b]};
 assert.equal(lookup(q,'common name'),null);
 assert.equal(lookup(q,'common nane'),null);
 assert.equal(lookup(q,'alpha'),a);
 assert.equal(lookup(q,'beta'),b);
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
 const variants=['Ruby Seeadragon','Rubby Seadragon','Ruby Seadragoo',
  'unrecognized animal nonsense','Threebanded sheepheadd',
  'Ruby Sea Draagon','Ruby Seadragonn','Very Unlikely Lorem Ispum'];
 const secondStart=performance.now();
 for(const typed of variants)lookup(q,typed);
 const unseenMs=performance.now()-secondStart;
 // After prewarm, different typos in a 32k-answer bank should not stall the
 // timer while repeatedly scanning and normalizing the full answer list.
 assert.ok(unseenMs<750,'8 unique typo lookups should stay under 750ms; took '+unseenMs.toFixed(1)+'ms');
 console.log('32k bank typo first='+firstMs.toFixed(1)+'ms repeat='+repeatMs.toFixed(1)+'ms eight-unseen='+unseenMs.toFixed(1)+'ms');
});
