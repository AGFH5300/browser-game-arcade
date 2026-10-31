import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('public/play/deep-dive/reference-source-hud-dock-fine-20261031.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('the source depth and score HUD pods use the original staircase clip geometry',()=>{
 const points=['0 10px','5px 5px','10px 0','calc(100% - 10px) 5px',
 '100% calc(100% - 10px)','10px 100%','0 calc(100% - 10px)'];
 for(const point of points)assert(css.includes(point),point);
 assert(css.includes('clip-path:polygon('));
 assert(css.includes('.dd-hud .dd-hud-box'));
 assert(html.includes('reference-source-hud-dock-fine-20261031.css'));
});

test('mobile answer field position uses the original source 58px sonar instead of the legacy 48px',()=>{
 assert(css.includes('@media(max-width:650px)'));
 assert(css.includes('.dd-sonar-wrap'));
 assert(css.includes('width:58px!important;height:58px!important'));
});

test('source stage is fixed without the invented 300ms entire-page entrance',()=>{
 assert(css.includes('.page.deep-home.dd-game-screen[data-world="ocean"]'));
 assert(css.includes('animation:none!important'));
 assert(css.includes('transform:none!important'));
 assert(css.includes('height:calc(100svh - 90px)!important'));
 assert(css.includes('height:calc(100svh - 50px)!important'));
 assert(css.includes('[data-phase="answering"] .dd-dock'));
 assert(css.includes('bottom:0!important'));
});

test('source responsive prompt typography preserves varying question length',()=>{
 assert(css.includes('font-size:31.2px!important'));
 assert(css.includes('font-size:14px!important'));
 assert(css.includes('font-size:13px!important'));
 assert(css.includes('line-height:1.5!important'));
 assert(!css.includes('min-height:148px'));
});

test('gameplay mobile button/dot/boat source animation inventory matches',()=>{
 assert(css.includes('animation:ds-dot-pulse 1.4s'));
 assert(css.includes('animation:ds-sweep-spin 2.4s'));
 assert(css.includes('.dd-world-surface-boat .dd-boat'));
 assert(css.includes('animation:none!important'));
});
