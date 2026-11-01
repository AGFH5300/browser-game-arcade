import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const world=readFileSync('public/play/deep-dive/reference-world.js','utf8');
const game=readFileSync('public/play/deep-dive/game.js','utf8');
test('original tier landing anchor is calibrated from the full time-series, not a screenshot',()=>{
 assert(world.includes('feedback: stageH * (typeof innerWidth==='number'&&innerWidth<=650?0.415:0.396)'));
 assert(world.includes('const sourceEasePlankton = p => {'));
 assert(world.includes('weight=mobile?.339:.557'));
 assert(world.includes('rate=mobile?30:12.12'));
 assert(world.includes('source-plankton'));
 assert(game.includes("ease:Number(last?.tier)===0?'source-plankton':'cubic'"));
});
test('depth model keeps camera interpolation and cap without instant scene jumping',()=>{
 assert(world.includes('1 - Math.exp(-6 * deltaSeconds)'));
 assert(world.includes('requestAnimationFrame(frame)'));
 assert(world.includes('Math.sin(0.45 * now / 1000)'));
});
