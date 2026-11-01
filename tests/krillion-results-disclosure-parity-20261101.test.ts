import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const game=readFileSync(root+'game.js','utf8');
const css=readFileSync(root+'reference-results-disclosure-parity-20261101.css','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');
test('results headings reflect original two-part metadata layout',()=>{
 assert(game.includes('<h3><span>THE CATCH</span><small>TAP A ROUND FOR EVERY ANSWER</small></h3>'));
 assert(css.includes('.dd-done-catch h3 small'));
 assert(css.includes('.dd-done-catch h3::after{display:none!important'));
});
test('source results use a 350px mobile column, and a centered 1080px desktop overlay',()=>{
 assert(css.includes('width:calc(100% - 40px)!important'));
 assert(css.includes('width:min(1080px,100%)!important'));
 assert(css.includes('transform:translateX(-50%)!important'));
});
test('source round rows preserve original miss mark, dash, size and disclosure states',()=>{
 assert(game.includes('class="dd-catch-miss-icon"'));
 assert(game.includes('stroke-dasharray="2.8 4"'));
 assert(game.includes('<summary aria-expanded="false">'));
 assert(game.includes(":'\\u2014'"));
 assert(css.includes('min-height:44px!important'));
 assert(css.includes('padding:10px 0!important'));
 assert(css.includes('summary:focus-visible'));
});
test('only one round expands at once; answers remain searchable and tier-filterable',()=>{
 assert(game.includes("root.querySelectorAll('.dd-catch-row[open]')"));
 assert(game.includes('if(other!==row)'));
 assert(game.includes('other.open=false'));
 assert(game.includes("setAttribute('aria-expanded',String(row.open))"));
 assert(game.includes('if(row.open)renderCatchAnswers(row)'));
 assert(game.includes('dd-catch-search'));
 assert(game.includes('dd-catch-tier'));
});
test('results corrections load after previous overlays and preserve accessible scroll',()=>{
 const pos=html.indexOf('reference-results-disclosure-parity-20261101.css');
 assert(pos>html.indexOf('reference-results-and-descent-20261101.css'));
 assert(css.includes('overscroll-behavior:contain'));
 assert(!css.includes('outline:none'));
});
