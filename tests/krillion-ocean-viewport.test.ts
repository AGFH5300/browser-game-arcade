import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
const css=readFileSync('public/play/deep-dive/reference-source-ocean-viewport-20261101.css','utf8');
const renderer=readFileSync('public/play/deep-dive/reference-source-ocean-canvas-20261031.js','utf8');
const hud=readFileSync('public/play/deep-dive/reference-source-hud-dock-fine-20261031.css','utf8');

test('the ocean canvas is attached outside the clipping game stage',()=>{
 assert(renderer.includes('scene.insertBefore(el,next);'));
 assert(!renderer.includes('sea.after(el)'));
 assert(renderer.includes('const w=scene.clientWidth,h=scene.clientHeight;'));
 assert(renderer.includes('const top=(world?.getBoundingClientRect().top??0)-stageBounds.top;'));
 assert(css.includes('>.dd-source-ocean-canvas{'));
 assert(css.includes('height:100%!important;'));
 assert(css.includes('pointer-events:none!important;'));
});

test('ocean extends to viewport but interactive stage retains its previous height',()=>{
 assert(css.includes('height:100svh!important;'));
 assert(css.includes('height:calc(100svh - 90px)!important;'));
 assert(css.includes('@media(max-width:650px)'));
 assert(css.includes('height:calc(100svh - 50px)!important;'));
 assert(css.includes('>.dd-stage{'));
 assert(css.includes('overflow:hidden!important;'));
 assert(hud.includes('width:100vw!important'));
});

test('viewport correction loads after the old stage-height rules',()=>{
 const last=html.indexOf('reference-source-ocean-viewport-20261101.css');
 assert(last>-1);
 assert(last>html.indexOf('reference-source-hud-dock-fine-20261031.css'));
 assert(last>html.indexOf('reference-source-user-issues-20261101.css'));
 assert(last<html.indexOf('<script defer src='));
});
