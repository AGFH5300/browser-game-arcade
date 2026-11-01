import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('public/play/deep-dive/reference-mascot-boop-source-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
test('source poke only animates speech; shrimp body does not jump or spin',()=>{
 assert(css.includes('dd-mascot-poked'));
 assert(css.includes('dd-mascot-poke'));
 assert(css.includes('ds-swim 2.6s'));
 assert(css.includes('translate:none!important'));
 assert(!css.includes('animation:ds-roll'));
 assert(!css.includes('translate:20px -28px'));
});
test('pink blub rise retains original placement and reduced-motion support',()=>{
 for(const x of ['left:44px!important','top:-22px!important','color:#ff5d8f!important','font:18px/27px','rgba(255,93,143,.7)','animation:ds-blub-up 1s','transition:none!important','@media(prefers-reduced-motion:reduce)'])assert(css.includes(x),x);
});
test('corrective boop CSS is loaded after legacy gold spinning effect',()=>{
 const i=html.indexOf('reference-mascot-boop-source-20261101.css');
 assert(i>html.indexOf('reference-source-user-issues-20261101.css'));
 assert(i>html.indexOf('reference-gameplay-mascot-geometry-20261101.css'));
 assert(i<html.indexOf('<script defer src='));
});
