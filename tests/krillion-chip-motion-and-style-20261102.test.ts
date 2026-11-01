import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const js=readFileSync(root+'reference-tier-effects-20261031.js','utf8');
const css=readFileSync(root+'reference-accepted-chip-source-20261102.css','utf8');
const game=readFileSync(root+'game.js','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');

test('outgoing card remains visible until text is genuinely intersected',()=>{
 assert(js.includes("outgoing.querySelector('.dd-prompt-text')"));
 assert(js.includes('overlapY>12'));
 assert(js.includes('outgoing.remove()'));
});
test('plankton accepted card uses subdued outline and mobile source width',()=>{
 assert(game.includes('data-reveal-tier='));
 assert(css.includes('data-reveal-tier="plankton"'));
 assert(css.includes('font-size:25px!important'));
 assert(css.includes('box-shadow:0 0 0 1px #8fa3c43d!important'));
 assert(html.includes('reference-accepted-chip-source-20261102.css'));
});
