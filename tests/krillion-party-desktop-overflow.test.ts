import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('public/play/deep-dive/reference-party-desktop-overflow-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('desktop Party topbar fits the source reference world without horizontal overflow',()=>{
 assert(css.includes('@media (min-width:651px)'));
 assert(css.includes('.app-shell:has(.pp-view) > .topbar'));
 assert(css.includes('width:min(1070px,calc(100vw - 32px))!important'));
 assert(!css.includes('display:none'));
 assert(!css.includes('pointer-events:none'));
});

test('Party overflow rule loads after source and mobile geometry rules',()=>{
 const i=html.indexOf('reference-party-desktop-overflow-20261101.css');
 assert(i>html.indexOf('reference-party-play-mobile-geometry-20261101.css'));
 assert(i>html.indexOf('reference-source-ocean-viewport-20261101.css'));
 assert(i<html.indexOf('<script defer src='));
});
