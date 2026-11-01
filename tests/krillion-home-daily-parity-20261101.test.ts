import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const game=readFileSync(root+'game.js','utf8');
const css=readFileSync(root+'reference-home-daily-source-parity-20261101.css','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');

test('home Puffer Party uses source sprite image, label and no misleading emoji/arrow',()=>{
 assert(game.includes('class="dd-party-heading"'));
 assert(game.includes('class="dd-party-title">PUFFER PARTY'));
 assert(game.includes('reference-assets/gen/party/puffer-0.png'));
 assert(game.includes('data-action="party"'));
 assert(!game.includes('class="dd-party-arrow"'));
 assert(!game.includes('aria-hidden="true">🐡</span>'));
});
test('source measured mobile Party card and title sizes',()=>{
 for(const x of ['width:334px!important;height:59.109px!important','font-size:23.4px!important','line-height:35.1px!important','top:4.78px'])assert(css.includes(x),x);
});
test('desktop Party, Begin and nav geometry follow original measurements',()=>{
 for(const x of ['width:340px!important','height:66px!important','top:-3.1px','top:2px','font:28px/42px'])assert(css.includes(x),x);
});
test('ocean Daily interactive stage centers at 1080px on desktop without clipping full-viewport ocean',()=>{
 assert(css.includes('@media(min-width:1081px)'));
 assert(css.includes('width:1080px!important'));
 assert(css.includes('transform:translateX(-50%)!important'));
 assert(css.includes('.dd-game-screen[data-world="ocean"]>.dd-stage'));
 assert(css.includes('@media(prefers-reduced-motion:reduce)'));
});
test('new source-aligned rules take precedence over older layout corrections',()=>{
 const idx=html.indexOf('reference-home-daily-source-parity-20261101.css');
 assert(idx>html.indexOf('reference-home-mobile-geometry-20261101.css'));
 assert(idx>html.indexOf('reference-gameplay-mascot-geometry-20261101.css'));
 assert(idx>html.indexOf('reference-results-promos-source-20261101.css'));
});

test('strict screenshot audit excludes third-party shadow CMP and covers Daily gameplay',()=>{
 const audit=readFileSync('scripts/krillion-live-visual-matrix.mjs','utf8');
 assert(audit.includes("document.querySelector('#cmpwrapper')?.remove()"));
 assert(audit.includes("if(screen==='gameplay')"));
 assert(audit.includes('home,gameplay,menu,settings,wardrobe'));
 assert(audit.includes('exactPercent!==100'));
});
test('Puffer sprite remains flex-flow child with actual source letter tracking',()=>{
 assert(css.includes('position:relative!important'));
 assert(css.includes('letter-spacing:.14em!important'));
});
