import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const motion=readFileSync(root+'reference-source-mascot-motion-20261031.js','utf8');
const home=readFileSync(root+'reference-home-daily-source-parity-20261101.css','utf8');
const script=readFileSync('scripts/krillion-motion-timeline-audit.mjs','utf8');

test('intro mascot uses one continuous time-based path and matched vertical calibration',()=>{
 assert(motion.includes('Math.exp(-2.6*dt)'));
 assert(motion.includes('6*Math.sin(1.7*time)'));
 assert(motion.includes('4*Math.sin(1.1*time)'));
 assert(motion.includes('(y-size+wave-3.7)'));
 assert(!motion.includes(String.raw`bob.\n   anchor.style.transform`));
});
test('source mobile begin button bob has time-sampled y alignment and shared timing',()=>{
 assert(home.includes('top:-4.3px'));
 assert(home.includes('top:-3.1px'));
});
test('original-vs-candidate animation timeline requires same source-backed daily question',()=>{
 assert(script.includes('KRILLION_TEST_LOCAL_DAILY'));
 assert(script.includes('recovered/archive/'));
 assert(script.includes('source-backed Daily question did not load'));
 assert(script.includes("result.postSubmission?.phase!=='feedback'"));
});
