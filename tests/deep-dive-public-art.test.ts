import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {getEmbedSandbox,isAllowedEmbedUrl} from '../lib/embeds';
import added from '../data/added-games.json';

const game=added.find(x=>x.slug==='deep-dive');
const manifest=JSON.parse(readFileSync('public/play/deep-dive/reference-art/manifest.json','utf8')) as {source:string;files:{filename:string;sha256:string;size:number}[]};

test('Deep Dive includes exact public sprite bytes and source font',()=>{
 assert.equal(manifest.source,'https://krillion.io/');
 for(const filename of ['sky.webp','top.webp','mid.webp','trench.webp','puffer.png','VT323.woff2']){
  const f=manifest.files.find(x=>x.filename===filename);
  assert(f,'Missing asset '+filename);
  const bytes=readFileSync('public/play/deep-dive/reference-art/'+filename);
  assert.equal(bytes.length,f.size);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
 }
 const css=readFileSync('public/play/deep-dive/reference-art.css','utf8');
 assert(css.includes('./reference-art/sky.webp'));
 assert(css.includes('./reference-art/top.webp'));
 assert(css.includes('./reference-art/puffer.png'));
 assert(css.includes('ReferenceVT323'));
});

test('versioned exact-art player keeps own-origin multiplayer permissions without broadening host allowlist',()=>{
 assert(game);
 assert.equal(game.gameUrl,'/play/deep-dive/index-public-art.html');
 assert(isAllowedEmbedUrl(game.gameUrl));
 assert(getEmbedSandbox(game.gameUrl).includes('allow-same-origin'));
 assert(!getEmbedSandbox('/play/deep-dive/reference-art/secret.html').includes('allow-same-origin'));
 const html=readFileSync('public/play/deep-dive/index-public-art.html','utf8');
 assert(html.includes('reference-art.css?ref=20261030home1'));
 assert(html.includes('party.js?reef=20261030polish4'));
 assert(html.includes('game.js?parity=20261030polish2'));
});
