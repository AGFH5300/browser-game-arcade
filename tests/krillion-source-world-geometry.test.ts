import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('public/play/deep-dive/reference-source-hud-dock-fine-20261031.css','utf8');
const fish=readFileSync('public/play/deep-dive/reference-source-ocean-canvas-20261031.js','utf8');
const fore=readFileSync('public/play/deep-dive/reference-foreground.js','utf8');
const audit=readFileSync('scripts/krillion-equal-prompt-geometry.mjs','utf8');

test('the active ocean game is fixed and cannot scroll after answer autofocus',()=>{
 assert(css.includes('body:has(.dd-game-screen[data-world="ocean"]:not([data-phase="done"]))'));
 assert(css.includes('overflow:hidden!important'));
 assert(css.includes('.page.deep-home.dd-game-screen[data-world="ocean"]:not([data-phase="done"])'));
 assert(css.includes('position:fixed!important'));
 assert(css.includes('width:100vw!important'));
});

test('the world and foreground use the source maximum 1080px horizontal coordinates',()=>{
 assert(css.includes('.dd-world{'));
 assert(css.includes('width:1080px!important'));
 assert(css.includes('left:calc(50% - 540px)!important'));
 assert(css.includes('right:15px!important'));
 assert(fish.includes('const worldWidth=Math.min(1080,w)'));
 assert(fish.includes('ctx.translate(worldInset,0)'));
 assert(fish.includes('marineLife(t,dt,top,depth,worldWidth,h)'));
 assert(fore.includes('const w=Math.min(1080,stageWidth)'));
 assert(fore.includes('el.style.left=Math.max(0,(stageWidth-w)/2)'));
});

test('source prompt is anchored directly to its depth and has normal tracking',()=>{
 assert(css.includes('top:var(--y,0px)!important'));
 assert(css.includes('letter-spacing:normal!important'));
 assert(css.includes('animation:none!important'));
});

test('comparison harness uses equal text without editing saved question banks',()=>{
 assert(audit.includes('KRILLION_PLAYWRIGHT_MODULE'));
 assert(audit.includes('KRILLION_CANDIDATE_URL'));
 assert(audit.includes("e.textContent=v"));
 assert(audit.includes('cardDimensionsMatch'));
 assert(audit.includes('noScroll'));
 assert(!audit.includes('/Users/'));
});

test('pixel-cut source card has no rectangular glow and initial lore stays hidden',()=>{
 assert(css.includes('.dd-world .dd-game-prompt{'));
 assert(css.includes('clip-path:polygon('));
 assert(css.includes('[data-zone="surface"]:not([data-phase="done"]) .dd-amb'));
 assert(css.includes('display:none!important'));
});
