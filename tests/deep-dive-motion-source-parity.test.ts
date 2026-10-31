import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const local=(p:string)=>readFileSync('public/play/deep-dive/'+p,'utf8');
const party=local('party.js');
const home=local('game.js');
const motion=local('reference-source-micro-motion-20261031.css');
const descent=local('reference-source-motion-20261031.css');
const world=local('reference-world.js');
const scene=local('reference-scene.js');

test('source title bob has eight independent, 180ms-staggered letters',()=>{
  for(let i=0;i<8;i++){
    const delay=(i*.18).toFixed(2)+'s';
    assert(party.includes('animation-delay:'+delay),delay);
    assert(motion.includes('span:nth-child('+(i+1)+')'));
  }
  assert(party.includes('aria-label="KRILLION"'));
  assert(motion.includes('animation-duration:3.2s!important'));
  assert(motion.includes('animation:ds-bob-l 3.2s ease-in-out infinite!important'));
  assert(motion.includes('ds-title-flicker 5s'));
});

test('source button and puffer micro-motion retain timings and hover shadows',()=>{
  assert(motion.includes('ds-btn-bob 1.9s cubic-bezier(.65,0,.35,1) infinite'));
  assert(motion.includes('ds-swim 2.6s cubic-bezier(.65,0,.35,1) infinite'));
  assert(motion.includes('0 0 34px #ff5d8f8c'));
  assert(motion.includes('.dd-party-btn{animation:none!important}'));
});

test('descent synchronizes tier animation, card exit and landing reveal',()=>{
  assert(home.includes('const SOURCE_TIER_MS=[3400,3000,3000,3400,4300,4600]'));
  assert(home.includes('active.revealStartedAt=Date.now()'));
  assert(home.includes('if(!active||active.phase!==\'feedback\'||transitioning||revealPending())return'));
  assert(descent.includes('dd-source-landing-appear'));
  assert(descent.includes('ds-card-gone 600ms ease-in 450ms'));
});

test('ocean renderer uses source frame caps and exponential camera follow',()=>{
  assert(scene.includes('low?15:30'));
  assert(scene.includes('low?1500000:8300000'));
  assert(world.includes('1 - Math.exp(-6 * deltaSeconds)'));
  assert(world.includes('sourceEaseSine'));
  assert(world.includes('Math.sin(0.45 * now / 1000)'));
});
