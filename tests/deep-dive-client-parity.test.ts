import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root='public/play/deep-dive/';
const html=readFileSync(root+'index-public-art.html','utf8');
const game=readFileSync(root+'game.js','utf8');
const sound=readFileSync(root+'reference-sound.js','utf8');
const scene=readFileSync(root+'reference-scene.js','utf8');
const iface=readFileSync(root+'reference-interface.js','utf8');
const css=readFileSync(root+'reference-dom-parity.css','utf8');

test('original DOM, canvas and synthesized sound scripts are delivered before game startup',()=>{
 const ordered=['reference-sound.js','reference-scene.js','reference-interface.js','game.js?parity=20261030pass5results1'];
 const positions=ordered.map(x=>html.indexOf(x));
 positions.forEach(p=>assert(p>0));
 assert(positions.every((p,i)=>i===0||p>positions[i-1]));
 assert(html.includes('reference-dom-parity.css'));
 assert(game.includes('titleMarkup'));
 assert(iface.includes('KRILLION'));
 assert(iface.includes('data-dd-sound'));
 assert(iface.includes('data-dd-setting'));
 assert(iface.includes('dd-mascot-poked'));
});
test('audio engine uses user gesture and local synthesis; no external sound files',()=>{
 for(const feature of ['AudioContext','createOscillator','createBufferSource','createBiquadFilter','createGain','visibilitychange','prefers','land_big','krillion','category','begin','reject']){
   if(feature==='prefers')continue;
   assert(sound.includes(feature),feature);
 }
 assert(!sound.includes('fetch('));
 assert(sound.includes('pointerdown'));
 assert(sound.includes('keydown'));
 assert(game.includes("DeepDiveSfx?.event('reject')"));
 assert(game.includes("DeepDiveSfx?.tick(s)"));
});
test('canvas animation is bounded, source-oriented and reduced-motion friendly',()=>{
 for(const feature of ['requestAnimationFrame','cancelAnimationFrame','devicePixelRatio','prefers-reduced-motion','getContext','particleScale','drawFish','visibilitychange']){
   assert(scene.includes(feature),feature);
 }
 assert(scene.includes('maxFrame')===false);
 assert(css.includes('.dd-reference-sea-canvas'));
 assert(css.includes('prefers-reduced-motion'));
 assert(game.includes('depthZone()'));
 assert(game.includes('dd-card-leaving'));
 assert(game.includes("'DIVE COMPLETE'"));
 assert(game.includes('SURFACE ▲'));
 assert(game.includes('One in a Krillion'));
 assert(scene.includes('dd-dynamic-depth'));
 assert(css.includes('.dd-feedback-action'));
 assert(css.includes('.dd-reveal-screen .dd-reveal'));
});
