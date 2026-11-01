import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('public/play/deep-dive/reference-gameplay-mascot-geometry-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('original gameplay mascot mobile/desktop moving-frame bounds',()=>{
 for(const token of ['@media (min-width:651px)','@media (max-width:650px)','[data-phase="answering"] .dd-game-fish','top:616px!important','margin-left:-2px!important','margin-top:44px!important','width:64px!important','height:64px!important'])assert(css.includes(token),token);
});
test('mascot placement keeps poke, keyboard and other scenes unchanged',()=>{
 assert(!css.includes('pointer-events:none'));
 assert(!css.includes('animation:none'));
 assert(!css.includes('outline:none'));
 assert(!css.includes('.dd-reveal-screen'));
 assert(!css.includes('.dd-done-screen'));
 assert(!css.includes('pp-view'));
});
test('mascot source geometry loads after prior user interaction correction',()=>{
 const last=html.indexOf('reference-gameplay-mascot-geometry-20261101.css');
 assert(last>html.indexOf('reference-source-user-issues-20261101.css'));
 assert(last>html.indexOf('reference-input-submit-fuse-20261101.css'));
 assert(last<html.indexOf('<script defer src='));
});
