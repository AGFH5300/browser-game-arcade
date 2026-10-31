import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(name:string)=>readFileSync('public/play/deep-dive/'+name,'utf8');
test('all six publisher outcome tiers and miss have source-specific particles and actions',()=>{
 const effects=src('reference-tier-effects-20261031.js');
 for(const tier of ['plankton','tooclever','schooler','rare','deepcut','krillion','miss'])
   assert(effects.includes(tier),tier);
 for(const action of ['sourceSwarm','addOrbit','flashScreen','spotlight','ring','bubble','spark','tier-landed'])
   assert(effects.includes(action),action);
 assert(effects.includes('w<700?8:11'));
 assert(effects.includes('stage?.clientWidth<700?14:20'));
 assert(effects.includes('krillion-halloween-2026.png'));
 assert(effects.includes('schoolerSprite'));
 assert(effects.includes('createRadialGradient'));
 assert(effects.includes('dd-source-wiggle'));
 assert(effects.includes('passed.add(score)'));
 assert(src('index-public-art.html').includes('reference-tier-effects-20261031.js'));
});
test('sink starts on answer acceptance, tier impact is timed to landing and score is delayed',()=>{
 const game=src('game.js'),effects=src('reference-tier-effects-20261031.js');
 assert(game.includes('deepdive:tier-plunge'));
 assert(game.includes('animateSourceDepth'));
 assert(game.includes('deepdive:tier-landed'));
 assert(game.includes("DeepDiveSfx?.event(record.points===0?'miss':'sink')"));
 assert(effects.includes("window.DeepDiveSfx?.event(tier==='krillion'?'krillion'"));
 assert(game.includes('SOURCE_TIER_MS'));
 assert(game.includes('--dd-depth-opacity'));
});
test('sea and foreground have independent source-like snow motion and power profiles',()=>{
 const sea=src('reference-scene.js'),fore=src('reference-foreground.js');
 assert(sea.includes('Math.round(70*particleScale'));
 assert(fore.includes('Math.round(26*scale'));
 assert(sea.includes('9*Math.sin(.6*time+p.ph)*dt'));
 assert(fore.includes('13.2*Math.sin(.5*now/1000+p.ph)*dt'));
 assert(sea.includes('oldWorldY'));
 assert(fore.includes('lastWorld'));
 assert(sea.includes('prefersReduced.matches?2:low?15:30'));
 assert(fore.includes('reduced.matches?2:low?15:30'));
});
