import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('public/play/deep-dive/reference-settings-outer-frame-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('Settings modal uses source borderless frame and avoids browser focus outline',()=>{
 assert(css.includes('.dd-global-settings-dialog.dd-source-dialog[role="dialog"]'));
 assert(css.includes('border:0!important'));
 assert(css.includes('.dd-global-settings-dialog.dd-source-dialog[role="dialog"]:focus-visible'));
 assert(css.includes('outline:none!important'));
});

test('no global focus suppression leaks to interactive controls',()=>{
 assert(!css.includes('*:focus'));
 assert(!css.includes('button:focus'));
 assert(!css.includes('input:focus'));
 assert(!css.includes('pointer-events:none'));
 assert(!css.includes('display:none'));
});

test('Settings border correction loads last',()=>{
 const i=html.indexOf('reference-settings-outer-frame-20261101.css');
 assert(i>html.indexOf('reference-source-stage-and-daily-horizon-20261101.css'));
 assert(i>html.indexOf('reference-overlays-parity-20261031.css'));
 assert(i<html.indexOf('<script defer src='));
});
