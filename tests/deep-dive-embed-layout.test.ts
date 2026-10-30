import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import added from '../data/added-games.json';
import {getEmbedSandbox,isAllowedEmbedUrl} from '../lib/embeds';

test('Deep Dive now uses a never-before-cached game entrypoint with versioned assets',()=>{
 const game=added.find(g=>g.slug==='deep-dive');
 assert(game);
 assert.equal(game.gameUrl,'/play/deep-dive/index-public-art.html');
 assert(isAllowedEmbedUrl(game.gameUrl));
 assert(getEmbedSandbox(game.gameUrl).includes('allow-same-origin'));
 assert(!isAllowedEmbedUrl('/play/deep-dive/not-allowed.html'));
 const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
 assert.match(html,/reference-art\.css\?ref=20261030fix1/);
 assert.match(html,/dd-nav-toggle/);
 assert.match(html,/pixel-ui\.css\?arcade=20261029d/);
 assert.match(html,/game\.js\?parity=20261030social1/);
 assert.match(html,/party\.js\?reef=20261030social1/);
 assert.match(html,/class="dd-logo"|src="\.\/game\.js/);
});
test('real Sidequest player does not clip Deep Dive into 16:9',()=>{
 const player=readFileSync('components/player.tsx','utf8');
 const css=readFileSync('app/globals.css','utf8');
 const skin=readFileSync('public/play/deep-dive/pixel-ui.css','utf8');
 assert(player.includes("game.slug==='deep-dive'?'player-stage player-stage-deep-dive':'player-stage'"));
 assert.match(css,/\.player-stage-deep-dive\{aspect-ratio:auto;min-height:720px/);
 assert.match(css,/\.player-stage-deep-dive\{aspect-ratio:auto;min-height:700px/);
 assert.match(skin,/\.dd-nav-toggle/);
 assert.match(skin,/\.dd-sea-center/);
 assert.match(skin,/max-height:950px/);
 assert.match(skin,/max-width:650px/);
});
