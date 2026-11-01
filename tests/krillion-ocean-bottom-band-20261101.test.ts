import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root='public/play/deep-dive/';
const css=readFileSync(root+'reference-ocean-bottom-band-20261101.css','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');

test('original underwater canvas respects desktop 90px and mobile 50px reserved bottom strip',()=>{
 assert(css.includes('clip-path:inset(0 0 90px 0)!important'));
 assert(css.includes('@media(max-width:650px)'));
 assert(css.includes('clip-path:inset(0 0 50px 0)!important'));
 assert(css.includes('background:#050c17!important'));
});
test('ocean mask does not resize canvas or alter world/camera motion',()=>{
 const rules=css.replace(/\/\*[\s\S]*?\*\//g,'');
 assert(!/(?:^|[;{])\s*(?:width|height|animation|transform)\s*:/m.test(rules));
 assert(css.includes('data-world="ocean"'));
 assert(css.includes(':not([data-phase="done"])'));
});
test('source ocean bottom band loads after previous full-viewport ocean and home styles',()=>{
 const marker='reference-ocean-bottom-band-20261101.css';
 assert(html.includes(marker));
 assert(html.indexOf(marker)>html.indexOf('reference-source-ocean-viewport-20261101.css'));
 assert(html.indexOf(marker)>html.indexOf('reference-home-daily-source-parity-20261101.css'));
});
