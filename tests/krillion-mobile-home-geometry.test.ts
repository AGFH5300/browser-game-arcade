import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('public/play/deep-dive/reference-home-mobile-geometry-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('the final mobile Daily homepage aligns source-measured controls',()=>{
 assert(css.includes('@media (max-width:650px)'));
 assert(css.includes('[data-phase="intro"][data-mode="daily"]'));
 assert(css.includes('translateY(-38px)'));
 assert(css.includes('width:334px!important'));
 assert(css.includes('height:31px!important'));
 assert(css.includes('grid-template-columns:104px 125px!important'));
 assert(css.includes('width:116px!important'));
 assert(css.includes('font-size:66.3px!important'));
 assert(css.includes('letter-spacing:.04em!important'));
 assert(css.includes('line-height:.9!important'));
 assert(css.includes('font-size:21.06px!important'));
 assert(css.includes('margin-top:6px!important'));
 assert(css.includes('font-size:15.6px!important'));
});

test('Unlimited has independently measured navigation and does not affect gameplay/Party',()=>{
 assert(css.includes('[data-mode="endless"]'));
 assert(css.includes('grid-template-columns:117px 102px 119px!important'));
 assert(css.includes('grid-auto-rows:52px!important'));
 assert(css.includes('translateY(72px)'));
 assert(css.includes('min-height:44px!important'));
 assert(!css.includes('.dd-game-screen'));
 assert(!css.includes('.pp-view'));
});

test('mobile geometry loads after prior homepage rules and canvas correction',()=>{
 const last=html.indexOf('reference-home-mobile-geometry-20261101.css');
 assert(last>html.indexOf('reference-pixel-parity-20261031.css'));
 assert(last>html.indexOf('reference-source-ocean-viewport-20261101.css'));
 assert(last<html.indexOf('<script defer src='));
});
