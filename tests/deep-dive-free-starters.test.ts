import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
type Question={id:string;text:string;answers:Array<[string,number]>;verified:boolean;answerSource?:string;answerPageSha256?:string};
const data=JSON.parse(readFileSync('public/play/deep-dive/recovered/free-starters.json','utf8')) as {
  modes:Record<string,{game:number;officialUrl:string;officialSha256:string;questions:Question[]}>;
};
test('publicly accessible first game prompts are captured for five free modes',()=>{
 const modes=['unlimited','movies','sports','geography','lexicon'];
 assert.deepEqual(Object.keys(data.modes),modes);
 assert.equal(modes.reduce((n,k)=>n+data.modes[k].questions.length,0),35);
 for(const key of modes){
  const m=data.modes[key];
  assert.equal(m.game,1);
  assert.equal(m.questions.length,7);
  assert(m.officialUrl.startsWith('https://krillion.io/api/'));
  assert.match(m.officialSha256,/^[a-f0-9]{64}$/);
  for(let i=0;i<7;i++){
   const q=m.questions[i];
   assert.equal(q.id,key+':1:r'+(i+1));
   assert(q.text.length>7);
  }
 }
});
test('verified public starter answer rows have exact score tiers and source citations',()=>{
 const scoreSet=new Set([10,15,30,60,85,100]);
 const expected:Record<string,[number,number]>={unlimited:[7,318],movies:[6,199],sports:[5,149],geography:[7,279],lexicon:[0,0]};
 for(const [mode,[expectedQuestions,expectedAnswers]] of Object.entries(expected)){
  const qs=data.modes[mode].questions;
  assert.equal(qs.filter(x=>x.verified).length,expectedQuestions);
  assert.equal(qs.reduce((n,x)=>n+x.answers.length,0),expectedAnswers);
  for(const q of qs){
   if(!q.verified){assert.equal(q.answers.length,0);continue}
   assert(q.answerSource?.startsWith('https://krillion-game.com/answers/'+mode+'/1/'));
   assert.match(q.answerPageSha256||'',/^[a-f0-9]{64}$/);
   assert(q.answers.length>0);
   for(const [name,score] of q.answers){
    assert(name.length>0);
    assert(scoreSet.has(score));
   }
  }
 }
});
test('real public animation source is wired to the game',()=>{
 const css=readFileSync('public/play/deep-dive/public-reference-motion.css','utf8');
 assert.equal((css.match(/@keyframes /g)||[]).length,67);
 const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
 const game=readFileSync('public/play/deep-dive/game.js','utf8');
 for(const name of ['ds-title-flicker','ds-score-slam','ds-swim','ds-card-in','ds-crt-zap','water-drift'])
   assert(css.includes('@keyframes '+name));
 assert.match(css,/Original files and SHA-256/);
 assert(html.includes('public-reference-motion.css?release=20261029a'));
 assert(html.includes('free-starter-modes.css?release=20261029a'));
 assert(html.includes('game.js?parity=20261030polish2'));
 assert(game.includes('loadFreeStarters'));
 assert(game.includes('startStarter'));
 assert(game.includes('renderFreeStarters'));
});
