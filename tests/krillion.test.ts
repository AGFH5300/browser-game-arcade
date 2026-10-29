import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import addedGames from '../data/added-games.json';
import referenceGames from '../data/reference-games.json';
import {isAllowedEmbedUrl,getTrustedPublisher,getEmbedSandbox} from '../lib/embeds';
import {gameSchema} from '../lib/validation';
import {selectGames} from '../lib/catalogue';
import type {Game} from '../lib/types';

test('Krillion is a unique published game in both Sidequest game collections',()=>{
 const game=addedGames.find(g=>g.slug==='krillion');
 assert(game);
 assert.equal(referenceGames.length,128);
 assert(!referenceGames.some(g=>g.slug===game.slug));
 assert.equal(gameSchema.safeParse(game).success,true);
 assert.deepEqual(game.collections,['html5_puzzles','classics']);
 assert.equal(game.gameUrl,'https://krillion.io/');
 assert.equal(game.mobile,true);
 assert.equal(selectGames([{...game,playCount:0,likes:0} as Game],{q:'krillion'}).total,1);
 assert.equal(selectGames([{...game,playCount:0,likes:0} as Game],{collection:'html5_puzzles'}).total,1);
});
test('original Krillion opens in a separate tab; no blocked cross-site iframe',async()=>{
 const game=addedGames[0];
 assert.equal(isAllowedEmbedUrl(game.gameUrl,''),true);
 assert.equal(getTrustedPublisher(game.gameUrl)?.externalOnly,true);
 assert.equal(getTrustedPublisher(game.gameUrl)?.name,'Krillion');
 assert(!isAllowedEmbedUrl('https://krillion.io/?untrusted=1',''));
 assert(!getEmbedSandbox('https://krillion.io/?untrusted=1').includes('allow-same-origin'));
 const {Player}=await import('../components/player');
 const markup=renderToStaticMarkup(createElement(Player,{game:{...game,playCount:0,likes:0} as Game}));
 assert(markup.includes('Play at Krillion'));
 assert(markup.includes('target="_blank"'));
 assert(!markup.includes('<iframe'));
});
