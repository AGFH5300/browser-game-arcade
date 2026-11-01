import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const game=readFileSync(root+'game.js','utf8');
const effects=readFileSync(root+'reference-tier-effects-20261031.js','utf8');
const iface=readFileSync(root+'reference-interface.js','utf8');
const css=readFileSync(root+'reference-results-and-descent-20261101.css','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');

test('a descending accepted word remains until its banner becomes visible',()=>{
 assert(effects.includes("const chip=stage.querySelector('.dd-chip')"));
 assert(effects.includes("reveal?.classList.remove('dd-reveal-pending')"));
 assert(effects.includes("chip.style.visibility='hidden';requestAnimationFrame(()=>chip.remove())"));
 assert(css.includes('opacity:1!important;visibility:visible!important'));
 assert(css.includes('white-space:normal;overflow-wrap:anywhere'));
 assert(css.includes('width:max-content!important'),'short accepted answers must stay on one line');
});
test('deep-cut multiline prompt is removed on actual collision with the accepted word',()=>{
 assert(effects.includes("stage.querySelector('.dd-game-prompt')"));
 assert(effects.includes('chip.getBoundingClientRect()'));
 assert(effects.includes('outgoing.remove()'));
});
test('mascot click and keyboard input are owned by one controller only',()=>{
 assert(game.includes("target.classList.add('dd-mascot-poke')"));
 assert(game.includes("DeepDiveSfx?.event('blub')"));
 assert(!iface.includes("buddy.classList.add('dd-mascot-poked')"));
 assert(!iface.includes("e.target.click()"));
});
test('results show real local history and original-style post-dive discovery',()=>{
 assert(game.includes('if(values.length>=1)'));
 assert(game.includes('PERSONAL HISTORY'));
 assert(game.includes('dd-result-discovery'));
 assert(game.includes('dd-result-puffer'));
 assert(game.includes('PLAY PUFFER PARTY'));
 assert(game.includes('FRIENDS & RANKINGS'));
 assert(game.includes('data-action="party"'));
 assert(game.includes('data-action="stats"'));
 assert(!css.includes('display:none!important'));
});
test('source results stylesheet is loaded after old conflicting animation rules',()=>{
 const pos=html.indexOf('reference-results-and-descent-20261101.css');
 assert(pos>html.indexOf('reference-source-motion-20261031.css'));
 assert(pos>html.indexOf('reference-tier-effects-20261031.css'));
 assert(pos>html.indexOf('reference-mascot-boop-source-20261101.css'));
});
