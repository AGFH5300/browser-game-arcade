import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('public/play/deep-dive/reference-source-stage-and-daily-horizon-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
const harness=readFileSync('scripts/krillion-equal-prompt-geometry.mjs','utf8');

test('source answering dock is anchored to the real game stage',()=>{
 assert(css.includes('.page.deep-home.dd-game-screen[data-world="ocean"][data-phase="answering"] .dd-dock'));
 for(const rule of ['bottom:90px!important','bottom:50px!important','max-width:1080px!important','width:min(1080px,100%)!important','left:50%!important','transform:translateX(-50%)!important'])assert(css.includes(rule),rule);
 assert(css.includes('@media(max-width:650px)'));
 assert(!css.includes('position:fixed'));
});

test('mobile sky horizon fade affects Daily intro only, not Unlimited or game scenes',()=>{
 assert(css.includes('[data-phase="intro"][data-mode="daily"]'));
 assert(css.includes('dd-sky:not(.dd-game-sky)::after'));
 assert(css.includes('rgba(0,0,0,.28) 100%'));
 assert(css.includes('url("./reference-art/sky.webp")'));
 assert(!css.includes('[data-mode="endless"]'));
});

test('final source layout correction loads after previous gameplay styles',()=>{
 const last=html.indexOf('reference-source-stage-and-daily-horizon-20261101.css');
 assert(last>html.indexOf('reference-source-ocean-viewport-20261101.css'));
 assert(last>html.indexOf('reference-source-hud-dock-fine-20261031.css'));
 assert(last<html.indexOf('<script defer src='));
});

test('equal-text browser audit waits for original hydration before starting',()=>{
 assert(harness.includes('original\'s click handler attaches after hydration'));
 assert(harness.includes("p.locator('.ds-begin-btn').evaluate(e=>e.click())"));
 assert(harness.includes('p.locator(\'.ds-input[aria-label="Your answer"]\')'));
 assert(harness.includes('e.textContent=v'));
});
