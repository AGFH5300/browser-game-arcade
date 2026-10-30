import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {PARTY_MAX_MEMBERS} from '../lib/deep-dive-party';

const root='public/play/deep-dive/';
const game=readFileSync(root+'game.js','utf8');
const world=readFileSync(root+'reference-world.js','utf8');
const iface=readFileSync(root+'reference-interface.js','utf8');
const css=readFileSync(root+'reference-pass3.css','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');

/* Minimal browser stub: the world module only touches these lazily. */
const sandbox:Record<string,unknown>={
  window:{},
  document:{documentElement:{classList:{contains(){return false},add(){},remove(){}}},querySelector(){return null},getElementById(){return null}},
  matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),
  performance:{now:()=>0},
  requestAnimationFrame:()=>0,
  cancelAnimationFrame:()=>{},
  setTimeout,clearTimeout
};
sandbox.window=sandbox;
const context=vm.createContext(sandbox);
vm.runInContext(world,context);
const W=(sandbox as {DeepDiveWorld:{
  WORLD_H:number;FLOOR_TOP:number;ROUND_PX:number;
  depthToY:(m:number)=>number;roundBase:(m:number)=>number;tierLineY:(m:number,score:number)=>number;
  chipSpawnY:(m:number)=>number;missBannerY:(m:number)=>number;
  anchorsFor:(h:number)=>Record<string,number>;durationFor:(d:number)=>number;
}}).DeepDiveWorld;

test('scroll-world geometry matches the original public client exactly',()=>{
  assert.ok(W,'reference-world.js must export DeepDiveWorld');
  assert.equal(W.WORLD_H,14800);
  assert.equal(W.FLOOR_TOP,14020);
  assert.equal(W.ROUND_PX,2000);
  // Ambient-fact anchors verified live on 2026-10-29: worldY = metres*2-9.
  assert.equal(W.depthToY(60),111);
  assert.equal(W.depthToY(332),655);
  assert.equal(W.depthToY(1040),2071);
  assert.equal(W.depthToY(7000),13991);
  // Round bases and tier lines: base+score/100*2000 (Duck -> 200px, Mauritius at 100m -> 2200px).
  assert.equal(W.roundBase(0),0);
  assert.equal(W.roundBase(100),200);
  assert.equal(W.tierLineY(0,10),200);
  assert.equal(W.tierLineY(0,30),600);
  assert.equal(W.tierLineY(100,100),2200);
  assert.equal(W.chipSpawnY(0),180);
  assert.equal(W.missBannerY(0),80);
  // Camera anchors measured at 1440x900: 207/340/260px ≈ 23%/37.8%/29% of stage height.
  const A=W.anchorsFor(900);
  assert.equal(Math.round(A.answering),207);
  assert.equal(Math.round(A.feedback),340);
  assert.equal(Math.round(A.miss),261);
  // Big descents ease for ~4.9s (900+d/500*1000) and small ones clamp to 1.2s.
  assert.equal(W.durationFor(2000),4900);
  assert.equal(W.durationFor(60),1200);
});

test('game drives the original phase machine preview -> answering -> feedback -> done',()=>{
  for(const feature of [
    "phase:'preview'",
    'previewEnds:Date.now()',
    "active.phase==='answering'",
    "active.phase==='feedback'",
    'the clock starts in',
    'descending \u00b7 the clock starts in',
    'data-phase="${active.phase}"',
    'data-world="${worldId}"',
    'SURFACE \u25b2',
    "'DIVE COMPLETE'",
    'dd-preview-pill',
    'tourSeen'
  ])assert(game.includes(feature),feature);
  // Refresh mid-answer can never freeze: expired timers convert to timeout feedback.
  assert(game.includes("active.phase==='answering'&&active.deadline<=Date.now()"));
  // Legacy saves migrate onto the new machine.
  assert(game.includes("active.phase==='question'"));
  assert(game.includes("active.phase==='reveal'"));
});

test('two-step answer corrections, reject copy and sonar dock match the original',()=>{
  for(const feature of [
    'submit again to confirm \u00b7 or edit',
    'no echo. try again',
    'answerCorrections!==false',
    'correction={raw:answer,canonical:found.value}',
    'dd-sonar-scope',
    'dd-sweep',
    'dd-time-digits',
    'dd-fuse-fill',
    'enterkeyhint="send"',
    'maxlength="256"',
    'syncDiveBtn',
    "--dd-urgency",
    'scaleX('
  ])assert(game.includes(feature),feature);
  // The correction preview is a Sidequest preference defaulting ON, like the original setting.
  assert(iface.includes("answerCorrections:get('answer-corrections')!=='0'"));
  assert(iface.includes('Answer corrections'));
  assert(iface.includes("unlocks at a "));
});

test('world markup renders inside one 14,800px column with world-anchored elements',()=>{
  for(const feature of [
    'class="dd-world" style="--dd-world-height:',
    'worldSurface(',
    'worldFacts()',
    'dd-floor',
    'DW.roundBase(prevM)',
    'roundTierLines(prevM)',
    'data-spawn="${spawnY}"',
    'metresBeforeRound(',
    'WORLD_FLOORS',
    'hookWorldCamera',
    'hookChipSink',
    'dd-stage-shake',
    'dd-blub',
    'krillion-halloween-2026.png',
    "'--chip-drop'"
  ])assert(game.includes(feature),feature);
  assert.doesNotThrow(()=>new vm.Script(game));
  assert.doesNotThrow(()=>new vm.Script(world));
  assert.doesNotThrow(()=>new vm.Script(iface));
});

test('pass-3 stylesheet delivers the world, sonar and done screen without fixed-position seams',()=>{
  assert(css.includes('height:14800px'));
  assert(css.includes('@keyframes dd-sweep-spin'));
  assert(css.includes('animation:dd-sweep-spin 2.4s linear infinite'));
  assert(css.includes('.dd-hot .dd-sweep{animation-duration:.7s}'));
  assert(css.includes('.dd-game-screen[data-phase="answering"] .dd-dock{transform:none}'));
  assert(css.includes('transform:translateY(120%)'));
  assert(css.includes('dd-flash-fire'));
  assert(css.includes('rgba(255,209,102,.35)'));
  assert(css.includes('.dd-done{'));
  assert(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert(css.includes('[data-world="hollywood"]'));
  // The world column must never contain fixed-position elements (pass-2 seam bug guard).
  const worldRule=css.match(/\.dd-game-screen \.dd-world\{[^}]*\}/)?.[0]||'';
  assert(worldRule.includes('height:14800px'));
  assert(!worldRule.includes('position:fixed'));
  assert(!/position:fixed[^}]*14800/.test(css));
});

test('end screen carries the original bearing bands, catch list, logbook and rating',()=>{
  for(const feature of [
    'THE BEARING',
    'Plankton. Plenty of ocean left down there.',
    'Rare. Below the thermocline. Nice.',
    'Trench dweller. Absurd.',
    "'450+'",
    'THE CATCH \u00b7 TAP A ROUND FOR EVERY ANSWER',
    'NEXT DIVE IN',
    'HOW WAS THAT DIVE? 1 = MEH \u00b7 5 = GREAT',
    'data-action="rate"',
    'KEEP DIVING \u221e',
    'ARCHIVE \u27f2',
    'DIVE #',
    'msToNextDaily',
    'startDoneCamera',
    'America/New_York'
  ])assert(game.includes(feature),feature);
});

test('wardrobe streak gates and Puffer Party capacity match the original',()=>{
  // The Krill 0 · Schooler 5 · Rare Squid 14 · Deep Cut Angler 30 · Evil Krill 45.
  for(const id of ['krillion','schooler','rare','deepcut','evil-krill']){
    assert(iface.includes("['"+id+"','"),id);
  }
  assert(iface.includes("'krillion.png',0]"));
  assert(iface.includes("'schooler.png',5]"));
  assert(iface.includes("'rare.png',14]"));
  assert(iface.includes("'deepcut.png',30]"));
  assert(iface.includes("'evil-krill-white-v2.png',45]"));
  // The game supports 2–16 players; the homepage does not show an unverified live count.
  assert(!game.includes('2\u201316 PLAYERS'));
  assert(readFileSync(root+'party.js','utf8').includes('2\u201316 PLAYERS'));
  assert.equal(PARTY_MAX_MEMBERS,16);
});

test('pass-3 assets load last and in the right order',()=>{
  assert(html.includes('./reference-pass3.css?release=20261030validated'));
  assert(html.includes('./reference-world.js?version=20261030b'));
  assert(html.includes('./game.js?parity=20261030pass5home1'));
  assert(html.indexOf('reference-parity-2.css')<html.indexOf('reference-pass3.css'));
  assert(html.indexOf('reference-parity-2.css')<html.indexOf('reference-pass3.css')&&html.indexOf('reference-pass3.css')<html.indexOf('</head>'));
  assert(html.indexOf('reference-world.js')<html.indexOf('game.js?parity=20261030pass5home1'));
  assert(html.indexOf('reference-interface.js')<html.indexOf('reference-world.js'));
  assert(html.includes('data-phase="boot"'));
});


test("first-round surface sky is world-anchored and game title does not obscure HUD",()=>{
  assert(game.includes('class="dd-world-surface-sky"'));
  assert(css.includes('.dd-world-surface-sky{'));
  assert(css.includes('top:-23svh;height:23svh'));
  assert(css.includes('reference-art/sky.webp'));
  assert(css.includes('.dd-world .dd-surface{visibility:hidden}'));
});
