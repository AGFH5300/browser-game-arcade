import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const motion=readFileSync('public/play/deep-dive/reference-feedback-mascot-motion-20261102.js','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('feedback shrimp has measured 7-frame movement path at both viewport sizes',()=>{
 for(const row of ['[250,446.9,381.5,83]','[1900,591.8,286.2,84.5]',
   '[3300,202.8,211,71.6]','[250,111,454.2,72.4]','[1900,221.7,290,86.4]',
   '[4300,35.9,193.1,73.5]'])assert(motion.includes(row),row);
 assert(motion.includes('sample(desktop,normalized),srcM=sample(mobile,normalized)'));
 assert(motion.includes("fish.style.setProperty(prop,val,'important')"));
 assert(motion.includes("fish.style.setProperty('animation','none','important')"));
 assert(html.includes('reference-feedback-mascot-motion-20261102.js'));
});
test('motion is frame-based, viewport-scaled and disposes on navigation',()=>{
 assert(motion.includes("requestAnimationFrame(paint)"));
 assert(motion.includes("addEventListener('deepdive:tier-plunge'"));
 assert(motion.includes("addEventListener('deepdive:tier-cleanup'"));
 assert(motion.includes('mobileWeight'));
 assert(motion.includes('duration/3400'));
 assert(motion.includes('reduce.matches'));
});
