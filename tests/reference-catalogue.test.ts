import test from 'node:test';
import assert from 'node:assert/strict';
import reference from '../data/reference-games.json';
import inventory from '../docs/WATCHDOCUMENTARIES_INVENTORY.json';
import status from '../docs/V4_INTEGRATION_STATUS.json';
import originals from '../data/seed-games.json';
import {isAllowedEmbedUrl,getEmbedSandbox} from '../lib/embeds';
import {isSidequestArchive} from '../lib/game-archives';
import {gameSchema} from '../lib/validation';

test('all 128 reference titles have distinct published entries and recorded provenance',()=>{
 assert.equal(reference.length,128);assert.equal(new Set(reference.map(g=>g.slug)).size,128);
 assert.deepEqual(status.games.map(g=>g.title),inventory.games.map(g=>g.title));
 for(const game of reference){
  assert(gameSchema.safeParse(game).success,game.slug);
  assert(game.published&&game.thumbnail&&game.licenseNotes,game.slug);
  assert(game.tags.includes('user-qa-pending'),game.slug);
  assert(game.gameUrl.startsWith('/play/')||isAllowedEmbedUrl(game.gameUrl,''),game.slug);
  assert(!game.gameUrl.endsWith('.swf'),'Flash files must use a local Ruffle entrypoint');
 }
});
test('reference embeds receive permissions only at the exact reviewed entrypoint',()=>{
 for(const game of reference.filter(g=>!g.gameUrl.startsWith('/play/')&&!isSidequestArchive(g.gameUrl))){
  assert(getEmbedSandbox(game.gameUrl).includes('allow-same-origin'));
  for(const changed of [game.gameUrl+'?redirect=evil',game.gameUrl+'#other',game.gameUrl.replace('https://','https://user@')]){
   assert(!isAllowedEmbedUrl(changed,''),changed);
   assert(!getEmbedSandbox(changed).includes('allow-same-origin'),changed);
  }
 }
});
test('reference catalogue retains existing game identities and local licenses',()=>{
 for(const game of reference){const old=originals.find(g=>g.slug===game.slug);if(!old)continue;
  assert.equal(game.id,old.id,game.slug);
  if(old.gameUrl.startsWith('/play/')){assert.equal(game.gameUrl,old.gameUrl);assert.equal(game.license,old.license);}
 }
});

test('reference collection avoids known host-blocked iframe URLs',()=>{
 for(const game of reference){if(!game.gameUrl.startsWith('/'))assert.notEqual(new URL(game.gameUrl).hostname,'watchdocumentaries.com',game.slug);}
});
