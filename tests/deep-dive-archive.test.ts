import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

const directory='public/play/deep-dive/recovered/archive';
const manifest=JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8')) as {
  importedDates:number;prompts:number;acceptedAnswerRows:number;
  failures:Array<{date:string;error:string}>;dates:Array<{date:string;prompts:number;acceptedAnswers:number}>;
};
const scores=new Set([10,15,30,60,85,100]);

test('all 105 archived days and 735 public historical questions are included',()=>{
  assert.equal(manifest.importedDates,105);
  assert.equal(manifest.prompts,735);
  assert.equal(manifest.acceptedAnswerRows,499704);
  assert.deepEqual(manifest.failures,[]);
  assert.equal(manifest.dates.length,105);
  assert.equal(new Set(manifest.dates.map(x=>x.date)).size,105);
  assert.equal(manifest.dates[0].date,'2026-07-16');
  assert.equal(manifest.dates.at(-1)?.date,'2026-10-28');
  assert.equal(readdirSync(directory).filter(x=>/^2026-\d{2}-\d{2}\.json$/.test(x)).length,105);
});

test('every archived answer has a public-source score on the six-tier scale',()=>{
  let prompts=0,answers=0;
  for(const record of manifest.dates){
    const sheet=JSON.parse(readFileSync(join(directory,record.date+'.json'),'utf8')) as {
      date:string;source:string;sourceSha256:string;questions:Array<{id:string;text:string;answers:Array<[string,number]>}>;
    };
    assert.equal(sheet.date,record.date);
    assert(sheet.source.startsWith('https://krilliongame.com/krillion-answers/'+record.date+'/'));
    assert.match(sheet.sourceSha256,/^[0-9a-f]{64}$/);
    assert.equal(sheet.questions.length,7);
    const ids=new Set<string>();
    let dayAnswers=0;
    for(const q of sheet.questions){
      assert.match(q.id,new RegExp('^archive:'+record.date+':p[1-7]$'));
      assert(!ids.has(q.id));ids.add(q.id);
      assert(q.text.length>8);
      assert(q.answers.length>0);
      for(const [text,score] of q.answers){
        assert(typeof text==='string'&&text.trim().length>0);
        assert(scores.has(score));
        dayAnswers++;
      }
      prompts++;
    }
    assert.equal(dayAnswers,record.acceptedAnswers);
    answers+=dayAnswers;
  }
  assert.equal(prompts,735);
  assert.equal(answers,499704);
});

test('active site loads archive and visual animation sheet',()=>{
  const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
  const game=readFileSync('public/play/deep-dive/game.js','utf8');
  const css=readFileSync('public/play/deep-dive/fidelity.css','utf8');
  assert(html.includes('./fidelity.css?release=20261029a'));
  assert(html.includes('./game.js?parity=20261030fix1'));
  for(const feature of ['loadArchiveManifest','loadArchiveSheet','startHistorical','startArchiveEndless'])
    assert(game.includes(feature));
  assert(game.includes('active.misses>=3'));
  assert(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert(css.includes('dd-fish-float'));
});
