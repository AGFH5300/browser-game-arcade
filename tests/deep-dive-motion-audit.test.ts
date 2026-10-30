import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(f:string)=>readFileSync('public/play/deep-dive/'+f,'utf8');
const css=read('reference-source-micro-motion-20261031.css');
const world=read('reference-pass3.css');
const phase=read('reference-source-motion-20261031.css');
test('title source motion has staggered letters on all three screens',()=>{
 assert(world.includes('ds-title-flicker 5s'));
 for(let n=1;n<=8;n++){
  assert(world.includes('.dd-title span:nth-child('+n+'){animation-delay:'+((n-1)*180)+'ms}'));
  assert(css.includes('.dd-logo span:nth-child('+n+')'));
  assert(css.includes('.pp-scene-brand span:nth-child('+n+')'));
 }
});
test('prompt and mascot motion uses observed source timing and assets',()=>{
 assert(phase.includes('ds-card-gone 600ms ease-in 450ms'));
 assert(css.includes('.pp-view .pp-hero-fish{animation:none!important}'));
 assert(css.includes('.pp-view .pp-foyer-left{transform:translateY(-25px)!important}'));
 assert(read('game.js').includes('previewEnds:Date.now()+3200'));
 assert(read('party.js').includes('/tiers/krillion-halloween-2026.png'));
});
