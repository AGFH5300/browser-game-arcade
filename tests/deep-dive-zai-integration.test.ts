import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const game=readFileSync(root+'game.js','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');
const css=readFileSync(root+'reference-parity-2.css','utf8');
const manifest=JSON.parse(readFileSync(root+'reference-assets/manifest.json','utf8'));
const paths=new Set(manifest.files.map((x:{localPath:string})=>x.localPath));

test('Z.ai parity-2 stylesheet is loaded last, and the modified game uses a fresh cache key',()=>{
 assert(html.includes('./reference-parity-2.css?release=20261029p2fixed'));
 assert(html.includes('./game.js?parity=20261029p2fixed'));
 assert(html.indexOf('reference-dom-parity.css')<html.indexOf('reference-parity-2.css'));
});
test('HUD is explicitly recentered and countdown fuse remains inside answer-line',()=>{
 assert(css.includes('transform:translateX(-50%)!important'));
 assert(css.includes('width:min(720px,calc(100% - 32px))'));
 assert(css.includes('.dd-answer-line .dd-game-bar'));
 assert.match(game,/<button type="submit" class="dd-submit">DIVE<\/button>\s*<div class="countdown-bar dd-game-bar"/);
});
test('all referenced tier image paths exist; low tiers use a safe fallback',()=>{
 for(const id of ['schooler','rare','deepcut','krillion'])assert(paths.has('tiers/'+id+'.png'));
 for(const id of ['plankton','tooclever'])assert(!paths.has('tiers/'+id+'.png'));
 assert(game.includes("tier.id==='plankton'||tier.id==='tooclever'"));
 assert(game.includes('dd-tier-emoji'));
});
test('autocorrection pauses the clock, presents an observable correction, and prevents duplicate submit',()=>{
 assert(game.includes("if(!active||active.phase!=='question'||transitioning)return;"));
 assert(game.includes("transitioning=true;clearInterval(ticker);"));
 assert(game.includes('},650);'));
 assert(game.includes('const pending=active'));
 assert(game.includes('active===pending'));
});
test('original depth and result elements are wired into working gameplay',()=>{
 for(const text of ['const AMBIENT=','function depthFacts()','function gameOverlays()','dd-tierline','dd-chip','dd-landed','dd-summary-verdict','safe(verdict(r.score))','dd-hud-depth']){
   assert(game.includes(text),text);
 }
 assert(!game.includes('  function arcadeHud(){\n    depthCrank=false;'));
 assert(game.includes("depthCrank=false;\n      active.index++"));
 assert(game.includes('IN OPEN LOBBIES'));
});
