import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('public/play/deep-dive/reference-party-play-mobile-geometry-20261101.css','utf8');
const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');

test('Puffer Party mobile PLAY NOW panel uses source-measured geometry',()=>{
 for(const token of [
  '@media(max-width:650px)',
  '.pp-play-panel{','min-height:263px!important',
  '.pp-panel-title{','top:-13px!important',
  '.pp-capacity-grid{','top:-21px!important',
  '.pp-capacity-hint{','top:93px!important',
  '.pp-play-buttons{','top:10px!important',
  '.pp-caption{','top:20px!important'
 ])assert(css.includes(token),token);
});

test('Party mobile geometry neither hides controls nor changes gameplay',()=>{
 assert(css.includes('.pp-view .pp-play-panel'));
 assert(!css.includes('display:none'));
 assert(!css.includes('pointer-events:none'));
 assert(!css.includes('.dd-game-screen'));
 const last=html.indexOf('reference-party-play-mobile-geometry-20261101.css');
 assert(last>html.indexOf('reference-home-mobile-geometry-20261101.css'));
 assert(last<html.indexOf('<script defer src='));
});
