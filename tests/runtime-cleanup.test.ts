import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NextRequest} from 'next/server';
import {proxy} from '../proxy';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {Player} from '../components/player';
import seed from '../data/seed-games.json';
import type {Game} from '../lib/types';

test('isolated archive host serves the shared game audio bridge without exposing APIs',()=>{
 const base='https://browser-game-arcade-dxbavg-7923s-projects.vercel.app';
 assert.notEqual(proxy(new NextRequest(base+'/play/arcade-bridge.js')).status,404);
 assert.notEqual(proxy(new NextRequest(base+'/play/archives/polytrack/index.html')).status,404);
 for(const path of ['/api/games','/admin','/package.json'])assert.equal(proxy(new NextRequest(base+path)).status,404);
});
test('PolyTrack loader uses local metadata and logo, no broken root request',()=>{
 const code=readFileSync('public/play/archives/polytrack/PolyModLoader.js','utf8');
 assert(code.includes('fetch("./pml-package.json"'));
 assert(code.includes('./images/pmllogo.svg'));
 assert(!code.includes('fetch("/package.json"'));
 const meta=JSON.parse(readFileSync('public/play/archives/polytrack/pml-package.json','utf8'));
 assert.equal(meta.gameVersion,'0.6.3');
});
test('player removes QA, keyboard and blank-frame instructional notices',()=>{
 const game=seed.find(g=>g.slug==='polytrack')!;
 const page=renderToStaticMarkup(createElement(Player,{game:{...game,playCount:0,likes:0} as Game}));
 for(const term of ['Gameplay testing pending','Click inside the game to focus keyboard controls','open the game directly','Use the game-specific mute button above'])assert(!page.includes(term),term);
 assert(!page.includes('allowfullscreen'));
});
