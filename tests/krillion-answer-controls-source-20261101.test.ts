import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('public/play/deep-dive/reference-input-submit-fuse-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('answering controls restore intrinsic original DIVE width and input/fuse geometry',()=>{
 for(const token of ['[data-phase="answering"]','input#answer-input.dd-input:focus-visible','button.dd-dive-btn','flex:0 0 auto!important','min-width:auto!important','width:auto!important','height:51.5px!important','line-height:1.5!important','rgba(77,227,255,.65)']){
  assert(css.includes(token),token);
 }
});
test('source controls preserve input focus indication, and do not alter feedback or Party',()=>{
 assert(!css.includes('outline:none'));
 assert(!css.includes('pointer-events:none'));
 assert(!css.includes('display:none'));
 assert(!css.includes('dd-game-screen[data-phase="feedback"]'));
 assert(!css.includes('.pp-'));
});
test('precise answer-control correction loads after earlier game CSS',()=>{
 const last=html.indexOf('reference-input-submit-fuse-20261101.css');
 assert(last>html.indexOf('reference-source-stage-and-daily-horizon-20261101.css'));
 assert(last>html.indexOf('reference-settings-outer-frame-20261101.css'));
 assert(last<html.indexOf('<script defer src='));
});
