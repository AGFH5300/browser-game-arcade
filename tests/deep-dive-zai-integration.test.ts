import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const game=readFileSync(root+'game.js','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');
const css=readFileSync(root+'reference-parity-2.css','utf8');
const manifest=JSON.parse(readFileSync(root+'reference-assets/manifest.json','utf8'));
const paths=new Set(manifest.files.map((x:{localPath:string})=>x.localPath));

test('Z.ai parity stylesheets load in order and the modified game uses a fresh cache key',()=>{
 assert(html.includes('./reference-parity-2.css?release=20261029p2fixed'));
 assert(html.includes('./reference-pass3.css?release=20261030validated'));
 assert(html.includes('./game.js?parity=20261030pass3validated'));
 assert(html.indexOf('reference-dom-parity.css')<html.indexOf('reference-parity-2.css'));
 assert(html.indexOf('reference-parity-2.css')<html.indexOf('reference-pass3.css'));
});
test('HUD stays recentered and the countdown fuse lives in the input column',()=>{
 assert(css.includes('transform:translateX(-50%)!important'));
 assert(css.includes('width:min(720px,calc(100% - 32px))'));
 assert(css.includes('.dd-answer-line .dd-game-bar'));
 assert.match(game,/<div class="dd-fuse" aria-hidden="true"><div class="dd-fuse-fill" id="time-fill"/);
 assert.match(game,/<button type="submit" class="dd-submit dd-dive-btn"[^>]*>DIVE<\/button>/);
});
test('all referenced tier image paths exist; low tiers use a safe fallback',()=>{
 for(const id of ['schooler','rare','deepcut','krillion'])assert(paths.has('tiers/'+id+'.png'));
 for(const id of ['plankton','tooclever'])assert(!paths.has('tiers/'+id+'.png'));
 assert(game.includes("tier.id==='plankton'||tier.id==='tooclever'"));
 assert(game.includes('dd-tier-emoji'));
});
test('answer corrections preview before scoring and cannot double-bank',()=>{
 /* Pass 3: the original's two-step correction — the input is rewritten to the
    canonical answer, a pill asks the player to confirm or edit, and only a
    second submit scores. A repeat correction to the same canonical value can
    never re-enter the preview state. */
 assert(game.includes("correction={raw:answer,canonical:found.value}"));
 assert(game.includes("correction?.canonical!==found.value"));
 assert(game.includes('submit again to confirm \u00b7 or edit'));
 assert(game.includes("answerCorrections!==false"));
 assert(game.includes("active.phase==='answering'"));
});
test('original depth and result elements are wired into working gameplay',()=>{
 for(const text of ['const AMBIENT=','function worldFacts()','function gameOverlays()','dd-tierline','dd-chip','dd-landed','dd-bearing-row','dd-hud-depth','One in a krillion. Trench dweller. Absurd.']){
   assert(game.includes(text),text);
 }
 assert(!game.includes('  function arcadeHud(){\n    depthCrank=false;'));
 assert(game.includes("depthCrank=false;\n      active.index++"));
 assert(game.includes('IN OPEN LOBBIES'));
 assert(game.includes('const verdict=score=>'));
});
