import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

test('archive cleanup removes only missing optional manifest and icon references',()=>{
  const root=mkdtempSync(join(tmpdir(),'sidequest-optional-assets-'));
  try{
    const game=join(root,'testgame');mkdirSync(game);
    const html=`<!doctype html><html><head><link rel="manifest" href="appmanifest.json"><link href="favicon.ico" rel="icon"><link rel="apple-touch-icon" href="icons/touch.png"><link rel="stylesheet" href="styles.css"><script src="missing-engine.js"></script></head><body></body></html>`;
    writeFileSync(join(game,'index.html'),html);
    writeFileSync(join(game,'favicon.ico'),'icon');
    execFileSync(process.execPath,[resolve('scripts/trim-missing-optional-link-tags.mjs'),root],{stdio:'pipe'});
    const result=readFileSync(join(game,'index.html'),'utf8');
    assert(!result.includes('appmanifest.json'));
    assert(!result.includes('icons/touch.png'));
    assert(result.includes('favicon.ico'));
    assert(result.includes('styles.css'));
    assert(result.includes('missing-engine.js')); // Real game failures must never be hidden.
  }finally{rmSync(root,{recursive:true,force:true})}
});
