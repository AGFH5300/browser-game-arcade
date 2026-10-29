import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const game=readFileSync('public/play/deep-dive/game.js','utf8');
const html=readFileSync('public/play/deep-dive/index.html','utf8');
const skin=readFileSync('public/play/deep-dive/pixel-ui.css','utf8');

test('Deep Dive has a pixel-art arcade home screen, not the old dashboard',()=>{
 assert.match(html,/pixel-ui\.css/);
 assert.match(game,/dd-sky/);
 assert.match(game,/dd-sea/);
 assert.match(game,/dd-logo/);
 assert.match(game,/dd-begin/);
 assert.match(game,/PUFFER PARTY/);
 assert.match(game,/dd-boat/);
 assert.match(game,/HOW TO PLAY/);
 assert.match(skin,/\.dd-logo\{/);
 assert.match(skin,/\.dd-depth-ticks/);
 assert.match(skin,/\.dd-game-fish/);
 assert.match(readFileSync('public/play/deep-dive/puffer-pixel.svg','utf8'),/^<svg/);
});
test('Game controls and multiplayer logic remain accessible after visual overhaul',()=>{
 assert.doesNotThrow(()=>new vm.Script(game));
 assert.match(game,/id="answer-form"/);
 assert.match(game,/id="answer-input"/);
 assert.match(game,/id="answer-feedback"/);
 assert.match(game,/id="seconds"/);
 assert.match(game,/id="time-fill"/);
 assert.match(game,/data-action="pass"/);
 assert.match(game,/dd-reveal/);
 assert.match(game,/id="timer"/);
 assert.match(game,/data-action="party"/);
 assert.match(game,/window\.DeepDiveParty/);
 assert.match(html,/party\.js/);
 assert.match(skin,/@media\(max-width:600px\)/);
});
