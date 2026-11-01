import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const css=readFileSync(root+'reference-ocean-seamless-overlay-20261102.css','utf8');
const game=readFileSync(root+'game.js','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');
const qa=readFileSync('scripts/krillion-visible-layer-qa.mjs','utf8');

test('single viewport-wide ocean vignette/CRT sits below stage UI',()=>{
 assert(game.includes('dd-viewport-overlays'));
 assert(css.includes('> .dd-stage > .dd-vignette'));
 assert(css.includes('> .dd-stage > .dd-crt'));
 assert(css.includes('width:100%!important'));
 assert(css.includes('z-index:0!important'));
 assert(css.includes('bottom:90px'));
 assert(css.includes('bottom:50px'));
 assert(html.includes('reference-ocean-seamless-overlay-20261102.css'));
});
test('Chromium compares actual desktop pixels on both stage seams',()=>{
 assert(qa.includes('result.checks.stageSeam'));
 assert(qa.includes('[[179,181],[1259,1261]]'));
 assert(qa.includes('if(meanDelta>5)'));
});
