import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root='public/play/deep-dive/';
const game=readFileSync(root+'game.js','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');
const themeCss=readFileSync(root+'reference-themed-worlds.css','utf8');
const resultCss=readFileSync(root+'reference-results-parity.css','utf8');
const moduleJs=readFileSync(root+'reference-themed-worlds.js','utf8');
const context:{window:Record<string,unknown>}={window:{}};
vm.runInNewContext(moduleJs,context);
const themes=context.window.DeepDiveThemes as {config:(id:string)=>{height:number;floorTop:number;scenery:unknown[]};scenery:(id:string)=>string};
const themed=['hollywood','gauntlet','atlas','lexicon'];

test('four original themed columns use 16,400px geometry and ocean remains 14,800px',()=>{
 assert.equal(themes.config('ocean').height,14800);
 assert.equal(themes.config('ocean').floorTop,14020);
 for(const theme of themed){
   assert.equal(themes.config(theme).height,16400,theme);
   assert.equal(themes.config(theme).floorTop,15620,theme);
   assert(themes.config(theme).scenery.length>=4,theme);
   assert(themeCss.includes('[data-world="'+theme+'"]'),theme);
 }
 assert(game.includes('--dd-world-height:'));
 assert(game.includes('data-world-height='));
});

test('every newly rendered themed scene is an existing recovered public asset',()=>{
 for(const theme of themed){
   const html=themes.scenery(theme);
   const images=[...html.matchAll(/src="([^"]+)"/g)].map(x=>x[1]);
   assert.equal(images.length,themes.config(theme).scenery.length);
   for(const image of images){
     assert(image.startsWith('./reference-assets/gen/optimized/v1/'));
     assert(existsSync(path.join(root,image)),image);
   }
   assert(!html.includes('onerror='));
 }
});

test('the themed chapter catalog shows 30 slots without inventing unrecovered questions',()=>{
 assert(game.includes('length:30'));
 assert(game.includes('30 CHAPTERS'));
 assert(game.includes('Chapter '+String(1))===false);
 assert(game.includes('other chapters are not represented as playable'));
 assert(game.includes('i===0&&playable'));
 assert(game.includes('PRACTICE_THEMES'));
});

test('the source-style result layout uses local answer scores and begins above the fold',()=>{
 assert(game.includes('function scoreTrail(results)'));
 assert(game.includes('Math.max(0,Math.min(100,Number(x.points)||0))'));
 assert(game.includes('scoreTrail(r.results)'));
 assert(game.includes('not a global percentile'));
 assert(resultCss.includes('padding:26px 10px 65px!important'));
 assert(resultCss.includes('.dd-world-surface-sky'));
 assert(resultCss.includes('dd-score-trail-line'));
 assert(!resultCss.includes('padding-top:46%'));
});

test('pass-4 additions load in correct order and guard reduced motion',()=>{
 for(const file of ['reference-themed-worlds.css','reference-results-parity.css','reference-themed-worlds.js']){
   assert(html.includes(file),file);
 }
 assert(html.indexOf('reference-pass3.css')<html.indexOf('reference-themed-worlds.css'));
 assert(html.indexOf('reference-themed-worlds.css')<html.indexOf('reference-results-parity.css'));
 assert(html.indexOf('reference-themed-worlds.js')<html.indexOf('game.js?parity=20261031bank2'));
 assert(themeCss.includes('prefers-reduced-motion'));
 assert(resultCss.includes('prefers-reduced-motion'));
});
