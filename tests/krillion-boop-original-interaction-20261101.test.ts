import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('public/play/deep-dive/reference-mascot-boop-source-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('default mascot poke floats and nudges, rather than rolling blub text',()=>{
 for(const x of ['@keyframes dd-source-mascot-boop-drift','translate:20px -28px','dd-mascot-poked','dd-mascot-poke','ds-swim 2.6s','dd-source-mascot-boop-drift 900ms'])assert(css.includes(x),x);
 assert(!css.includes('animation:ds-roll'));
});
test('source pink blub geometry, font and reduced-motion behavior',()=>{
 for(const x of ['left:44px!important','top:-22px!important','color:#ff5d8f!important','font:18px/27px','rgba(255,93,143,.7)','transition:none!important','@media(prefers-reduced-motion:reduce)','translate:none!important'])assert(css.includes(x),x);
 assert(!css.includes('pointer-events:none'));
});
test('observed boop correction takes precedence over legacy spinning rules',()=>{
 const i=html.indexOf('reference-mascot-boop-source-20261101.css');
 assert(i>html.indexOf('reference-source-user-issues-20261101.css'));
 assert(i>html.indexOf('reference-gameplay-mascot-geometry-20261101.css'));
 assert(i<html.indexOf('<script defer src='));
});
