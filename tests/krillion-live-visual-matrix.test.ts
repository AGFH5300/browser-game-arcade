import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('visual parity audit uses stable environment and explicit screen checks',()=>{
 const code=readFileSync('scripts/krillion-live-visual-matrix.mjs','utf8');
 for(const token of [
  'KRILLION_PLAYWRIGHT_MODULE','KRILLION_CHROMIUM_EXECUTABLE',
  'KRILLION_CANDIDATE_URL','KRILLION_ORIGINAL_URL',
  'KRILLION_SCENARIOS','KRILLION_VIEWPORTS','KRILLION_NO_SEED',
  'aria-expanded="true"','MENU_NOT_OPEN','PARTY_NOT_OPEN',
  'UNLIMITED_NOT_OPEN','getAnimations()', 'FONT_RENDERER_UNAVAILABLE',
  'body:document.body.innerText','exactPercent','STRICT_PARITY'
 ])assert(code.includes(token),token);
 assert(code.includes("x.diff.exactPercent!==100"));
 assert(!code.includes('a.currentTime=0'));
 assert(code.includes('.cmpwrapper{display:none!important'));
 assert(code.includes('await p.waitForTimeout(2600)'));
 assert(!code.includes('/Users/altygupta/'));
 assert(!code.includes('http://127.0.0.1:8918'));
});

test('menu refinements preserve original source layout and keyboard focus',()=>{
 const css=readFileSync('public/play/deep-dive/reference-source-menu-fine-20261031.css','utf8');
 const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
 assert(html.includes('reference-source-menu-fine-20261031.css'));
 assert(css.includes('width:calc(100vw - 28px)'));
 assert(css.includes('52px!important'));
 assert(css.includes('34px!important'));
 assert(css.includes('margin-top:7px'));
 assert(css.includes('pointer-events:none'));
 assert(!css.includes('focus-visible'));
});
