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
});

test('other modes and game scenes do not inherit the Daily positioning override',()=>{
 assert(!css.includes('[data-mode="endless"]'));
 assert(!css.includes('.dd-game-screen'));
 assert(!css.includes('.pp-view'));
});

test('mobile geometry loads after prior homepage rules and canvas correction',()=>{
 const last=html.indexOf('reference-home-mobile-geometry-20261101.css');
 assert(last>html.indexOf('reference-pixel-parity-20261031.css'));
 assert(last>html.indexOf('reference-source-ocean-viewport-20261101.css'));
 assert(last<html.indexOf('<script defer src='));
});
