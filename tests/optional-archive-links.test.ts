import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
test('missing shared archive favicon is removed without touching core scripts or source hashes',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sidequest-icons-'));const game=join(dir,'game');
 try{
  mkdirSync(game);
  const html='<html><head><link rel="shortcut icon" href="../favicon.png"><link rel="stylesheet" href="../missing.css"><script src="../required.js"></script></head></html>';
  writeFileSync(join(game,'index.html'),html);
  const original='source-hash-remains-pinned';
  writeFileSync(join(game,'source-manifest.json'),JSON.stringify({
   referencePackageManifest:true,artifactBytes:Buffer.byteLength(html),
   files:[{path:'index.html',size:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex'),sourceSha256:original}]
  }));
  execFileSync(process.execPath,['scripts/trim-missing-optional-link-tags.mjs',dir],{cwd:resolve('.')});
  const result=readFileSync(join(game,'index.html'),'utf8');
  assert(!result.includes('favicon.png'));
  assert(result.includes('missing.css'));assert(result.includes('required.js'));
  const meta=JSON.parse(readFileSync(join(game,'source-manifest.json'),'utf8'));
  assert.equal(meta.files[0].sourceSha256,original);
  assert.equal(meta.artifactBytes,Buffer.byteLength(result));
 }finally{rmSync(dir,{force:true,recursive:true});}
});
