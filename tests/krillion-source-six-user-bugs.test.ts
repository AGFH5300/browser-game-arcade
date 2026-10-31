import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const game=readFileSync('public/play/deep-dive/game.js','utf8');
const css=readFileSync('public/play/deep-dive/reference-source-user-issues-20261101.css','utf8');
const sourceMotion=readFileSync('public/play/deep-dive/reference-source-motion-20261031.css','utf8');
const tiers=readFileSync('public/play/deep-dive/reference-tier-effects-20261031.js','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('original dive has no extra SVG boat in world surface',()=>{
 assert(!game.includes('dd-world-surface-boat'));
});
test('accepted answer remains visible until actual tier landing',()=>{
 assert(sourceMotion.includes('.dd-chip.dd-source-wiggle'));
 assert(sourceMotion.includes('opacity:1!important'));
 assert(sourceMotion.includes('animation:none!important'));
 assert(tiers.includes("stage.querySelector('.dd-chip')?.remove()"));
});
test('timer fuse uses original below-input location',()=>{
 assert(css.includes('bottom:-8px!important'));
 assert(css.includes('height:4px!important'));
});
test('shrimp is accessible and reacts with source roll and blub',()=>{
 assert(game.includes('aria-label="Poke the shrimp mascot"'));
 assert(game.includes("target.classList.add('dd-mascot-poke')"));
 assert(game.includes("window.DeepDiveSfx?.event('blub')"));
 assert(game.includes("e.key==='Enter'||e.key===' '"));
 assert(css.includes('animation:ds-roll 900ms'));
 assert(css.includes('animation:ds-blub-up 1s'));
});
test('skip or timeout never retains the old question with missed result',()=>{
 assert(game.includes('!tier||!revealPending()'));
 assert(game.includes("root.querySelector('.dd-reveal-screen .dd-game-prompt')?.remove()"));
});
test('deep-cut spotlight leaves larger area visible at less restrictive opacity',()=>{
 assert(tiers.includes('transparent 170px'));
 assert(tiers.includes('rgba(2,4,10,.25) 310px'));
 assert(tiers.includes('rgba(2,4,10,.68) 620px'));
 assert(html.includes('reference-source-user-issues-20261101.css'));
});
