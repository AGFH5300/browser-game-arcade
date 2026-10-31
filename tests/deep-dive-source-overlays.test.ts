import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync('public/play/deep-dive/reference-interface.js','utf8');
const css=readFileSync('public/play/deep-dive/reference-overlays-parity-20261031.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
test('source modal layout is linked and the original top-right order is restored',()=>{
 assert(html.includes('reference-overlays-parity-20261031.css'));
 const controls=code.slice(code.indexOf('tools.innerHTML='));
 assert(controls.indexOf('data-dd-sound title')<controls.indexOf('data-dd-open-settings'));
 assert(controls.indexOf('data-dd-open-settings')<controls.indexOf('data-dd-open-wardrobe'));
 assert(css.includes('width:430px!important'));
 assert(css.includes('height:720px!important'));
 assert(css.includes('top:70px!important'));
});
test('dedicated character wardrobe verifies server-backed streak instead of a mutable guest streak',()=>{
 assert(code.includes('window.DeepDiveSocial?.profile?.dailyStreak'));
 assert(code.includes('aria-label="Dive buddy"'));
 assert(code.includes('data-dd-choose-character'));
 assert(code.includes('unlockedStreak()>='));
 assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert(css.includes('.dd-source-wardrobe-key.locked'));
});
test('original settings switches and modal interactions remain functional',()=>{
 for(const field of ['lowPower','contrast','answerCorrections','clearRejected','shareLink']){
  assert(code.includes("'"+field+"'"));
 }
 for(const hook of ['[data-dd-close-settings]','[data-dd-my-account]','[data-dd-open-wardrobe]','[data-dd-open-settings]'])assert(code.includes(hook));
 assert(css.includes('.dd-source-switch:has(input:checked)'));
 assert(css.includes('.dd-game-screen:not(.dd-done-screen) .dd-reference-utility .dd-source-settings-trigger'));
});
