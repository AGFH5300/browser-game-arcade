import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';

test('exact frame comparator passes only when every RGB channel matches',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'kr-frames-'));
 try{
  const file=(name:string)=>join(dir,name+'.png');
  for(const [name,color] of [['same1','#112233'],['same2','#112233'],['different','#112234']]){
   const buf=await sharp({create:{width:2,height:2,channels:4,background:color}}).png().toBuffer();
   writeFileSync(file(name),buf);
  }
  const run=(b:string,reportOnly=false)=>{
   const args=['scripts/krillion-compare-frames.mjs',file('same1'),file(b)];
   if(reportOnly)args.push('--report-only');
   const r=spawnSync('node',args,{encoding:'utf8'});
   return {status:r.status,result:JSON.parse(r.stdout)};
  };
  const identical=run('same2');
  assert.equal(identical.status,0);
  assert.equal(identical.result.verdict,'PASS');
  assert.equal(identical.result.strictPixelPerfect,true);
  assert.equal(identical.result.exactPixels,4);
  const different=run('different');
  assert.equal(different.status,2);
  assert.equal(different.result.verdict,'FAIL');
  assert.equal(different.result.strictPixelPerfect,false);
  assert.equal(different.result.changedChannels,4);
  const report=run('different',true);
  assert.equal(report.status,0);
  assert.equal(report.result.verdict,'FAIL');
 }finally{rmSync(dir,{recursive:true,force:true})}
});
