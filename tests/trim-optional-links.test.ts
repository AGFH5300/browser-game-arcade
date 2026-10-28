import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

test('archive cleanup removes only missing optional manifest and icon references',()=>{
  const root=mkdtempSync(join(tmpdir(),'sidequest-optional-assets-'));
  try{
    const game=join(root,'testgame');mkdirSync(game);
    const html=`<!doctype html><html><head><link rel="manifest" href="appmanifest.json"><link href="favicon.ico" rel="icon"><link rel="apple-touch-icon" href="icons/touch.png"><link rel="stylesheet" href="styles.css"><script src="missing-engine.js"></script></head><body></body></html>`;
    writeFileSync(join(game,'index.html'),html);
    writeFileSync(join(game,'favicon.ico'),'icon');
    writeFileSync(join(game,'source-manifest.json'),JSON.stringify({sourceEntrySha256:'preserved-source',artifactBytes:Buffer.byteLength(html),appliedChanges:[],files:[{path:'index.html',sha256:'old-artifact',sourceSha256:'unchanged-pinned-hash',sourceSize:123,size:Buffer.byteLength(html),appliedChanges:[]}]}));
    execFileSync(process.execPath,[resolve('scripts/trim-missing-optional-link-tags.mjs'),root],{stdio:'pipe'});
    const result=readFileSync(join(game,'index.html'),'utf8');
    assert(!result.includes('appmanifest.json'));
    assert(!result.includes('icons/touch.png'));
    assert(result.includes('favicon.ico'));
    assert(result.includes('styles.css'));
    assert(result.includes('missing-engine.js')); // Real game failures must never be hidden.
    const manifest=JSON.parse(readFileSync(join(game,'source-manifest.json'),'utf8'));
    assert.equal(manifest.files[0].sourceSha256,'unchanged-pinned-hash');
    assert.equal(manifest.sourceEntrySha256,'preserved-source');
    assert.equal(manifest.files[0].sha256,createHash('sha256').update(result).digest('hex'));
    assert.equal(manifest.files[0].size,Buffer.byteLength(result));
    assert.equal(manifest.artifactBytes,Buffer.byteLength(result));
  }finally{rmSync(root,{recursive:true,force:true})}
});
