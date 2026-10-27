import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Header} from '../components/shell';
import {selectGames} from '../lib/catalogue';
import seed from '../data/seed-games.json';
import type {Game} from '../lib/types';

test('original 26 local games retain their URLs and puzzle discovery membership',()=>{
 const originals=seed.filter(g=>g.collections.includes('html5_puzzles'));
 assert.equal(originals.length,26);
 assert(originals.every(g=>g.gameUrl.startsWith('/play/')));
 const hextris=seed.filter(g=>g.slug==='hextris');
 assert.equal(hextris.length,1);
 assert.deepEqual(new Set(hextris[0].collections),new Set(['classics','html5_puzzles']));
});

test('collection discovery is independent of runtime and respects drafts',()=>{
 const candidates=seed.map(g=>({...g,published:true,playCount:0,likes:0})) as Game[];
 const classics=selectGames(candidates,{collection:'classics'});
 assert.equal(classics.total,9);
 assert(classics.games.some(g=>g.engine==='iframe'));
 assert(classics.games.some(g=>g.engine==='html5'));
 assert.equal(selectGames(candidates,{collection:'html5_puzzles'}).total,26);
 assert.equal(selectGames(candidates,{q:'Moto X3M'}).total,3);
});

test('main navigation exposes distinct collections and global search',()=>{
 const markup=renderToStaticMarkup(createElement(Header));
 assert(markup.includes('href="/classics"'));
 assert(markup.includes('href="/html5"'));
 assert(markup.includes('href="/games"'));
 assert(markup.indexOf('Flash Library')<markup.indexOf('HTML5 &amp; Puzzles'));
});

test('all nine CarlWalks titles use an in-page player instead of external Famobi/Y8',async()=>{
 const {Player}=await import('../components/player');
 const {playableClassic,classicGameEntrypoints}=await import('../lib/classic-sources');
 const {getTrustedPublisher}=await import('../lib/embeds');
 const classics=seed.filter(g=>g.collections.includes('classics'));
 assert.equal(classics.length,9);
 for(const game of classics){
   const resolved=playableClassic({...game,playCount:0,likes:0} as Game);
   if(classicGameEntrypoints[game.slug]){
     assert.equal(resolved.gameUrl,classicGameEntrypoints[game.slug]);
     assert.equal(getTrustedPublisher(resolved.gameUrl)?.externalOnly,undefined);
     assert(!resolved.gameUrl.includes('famobi.com'));
   }
   const markup=renderToStaticMarkup(createElement(Player,{game:resolved}));
   assert(!markup.includes('Play at Famobi'));
   assert(!markup.includes('Opens the official game in a new tab'));
 }
});
