import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import added from '../data/added-games.json';
import {getEmbedSandbox,isAllowedEmbedUrl} from '../lib/embeds';
import {gameSchema} from '../lib/validation';

const base='public/play/deep-dive/';
const canonical='/play/deep-dive/index-public-art.html';
const legacy=['/play/deep-dive/index.html','/play/deep-dive/index-arcade.html'];

test('retired handmade entrypoints have no standalone copies',()=>{
 for(const p of legacy)assert.equal(existsSync('public'+p),false,p);
 assert.equal(existsSync(base+'index-public-art.html'),true);
 const cfg=readFileSync('next.config.ts','utf8');
 for(const p of legacy)assert(cfg.includes("source:'"+p+"',destination:'"+canonical+"',permanent:true"),p);
});
test('only current Krillion recreation receives same-origin game sandbox',()=>{
 assert.equal(isAllowedEmbedUrl(canonical),true);
 assert(getEmbedSandbox(canonical).includes('allow-same-origin'));
 for(const p of legacy){
  assert.equal(isAllowedEmbedUrl(p),false,p);
  assert.equal(getEmbedSandbox(p).includes('allow-same-origin'),false,p);
 }
});
test('all publisher-reference scripts and original recovered assets are preserved',()=>{
 const html=readFileSync(base+'index-public-art.html','utf8');
 for(const part of ['reference-world.js','reference-scene.js','reference-interface.js','reference-sound.js','reference-themed-worlds.js','reference-results-parity.css','reference-art.css','party.js','game.js'])assert(html.includes(part),part);
 for(const p of ['reference-art/puffer.png','reference-art/sky.webp','reference-art/top.webp','recovered/2026-10-29.json','recovered/free-starters.json','questions.json'])assert(existsSync(base+p),p);
 assert(!html.includes('AN ORIGINAL SIDEQUEST GAME'));
});
test('the superseded handmade mascot is removed and replaced by recovered public image',()=>{
 assert.equal(existsSync(base+'puffer-pixel.svg'),false);
 const css=readFileSync(base+'pixel-ui.css','utf8');
 assert(!css.includes('puffer-pixel.svg'));
 assert(css.includes("reference-art/puffer.png"));
});
test('public arcade listing accurately describes the new reconstruction and remaining independent components',()=>{
 const game=added.find(x=>x.slug==='deep-dive');
 assert(game);
 assert.equal(game.gameUrl,canonical);
 assert.equal(gameSchema.safeParse(game).success,true);
 assert.match(game.description,/recreation of Krillion/);
 assert.match(game.description,/independent multiplayer service/);
 assert.match(game.licenseNotes,/user|owner.*reports/i);
 assert(!game.description.startsWith('An original Sidequest'));
});

test('gameplay stage remains viewport sized when all world children are absolute',()=>{
 const html=readFileSync(base+'index-public-art.html','utf8');
 const css=readFileSync(base+'reference-source-pages.css','utf8');
 assert.match(css,/\.dd-game-screen \.dd-stage\s*\{position:absolute;inset:0;width:100%;height:100%\}/);
 assert(html.includes('reference-source-pages.css?release=20261030stagefix1'));
 // Regression: relative layout collapses to 0px and clips answer feedback/HUD.
 assert(!/\.dd-game-screen \.dd-stage\s*\{position:relative\}/.test(css));
});
