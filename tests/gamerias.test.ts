import test from 'node:test';
import assert from 'node:assert/strict';
import gamerias from '../data/gameria-games.json';
import source from '../scripts/gameria-package-sources.json';
import reference from '../data/reference-games.json';
import {gameSchema} from '../lib/validation';
import {isSidequestArchive} from '../lib/game-archives';

test('all fourteen classic Gamerias are distinct, with existing records reused and twelve pinned additions',()=>{
 const expected=['pizzeria','burgeria','taco-mia','freezeria','pancakeria','wingeria','hot-doggeria','cupcakeria','pastaria','donuteria','cheeseria','bakeria','sushiria','scooperia'].map(name=>`papas-${name}`).sort();
 const games=[...gamerias.reusedExistingRecords,...gamerias.newGames];
 assert.deepEqual(games.map(game=>game.slug).sort(),expected);
 assert.equal(gamerias.newGames.length,12);
 for(const game of gamerias.reusedExistingRecords){
  const original=reference.find(entry=>entry.slug===game.slug);
  assert(original);assert.equal(game.id,original.id);assert.equal(game.gameUrl,original.gameUrl);
 }
 for(const game of gamerias.newGames){
  assert(gameSchema.safeParse({...game,thumbnailId:game.thumbnail}).success,game.slug);
  assert(isSidequestArchive(game.gameUrl),game.slug);
  const pin=source.games.find(entry=>entry.slug===game.slug);
  assert(pin&&'packagePin' in pin,game.slug);assert(pin.packagePin,game.slug);
  assert.match(pin.packagePin.archive.sha256,/^[a-f0-9]{64}$/);
  assert(pin.packagePin.files.length>0);
 }
});
