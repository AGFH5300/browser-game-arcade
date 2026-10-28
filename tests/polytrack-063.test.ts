import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isSidequestArchive} from '../lib/game-archives';
import {gameSchema} from '../lib/validation';
import reference from '../data/reference-games.json';
import seed from '../data/seed-games.json';
import archivePaths from '../lib/archive-paths.json';

test('PolyTrack 0.6.3 is a complete pinned local game, not an outdated external iframe',()=>{
 const game=reference.find(g=>g.slug==='polytrack');
 const old=seed.find(g=>g.slug==='polytrack');
 assert(game&&old);
 assert.equal(game.id,old.id);
 assert.equal(game.gameUrl,old.gameUrl);
 assert(isSidequestArchive(game.gameUrl));
 assert(archivePaths.includes('/play/archives/polytrack/index.html'));
 assert.equal(gameSchema.safeParse(game).success,true);
 const folder='public/play/archives/polytrack/';
 const manifest=JSON.parse(readFileSync(folder+'source-manifest.json','utf8'));
 assert.equal(manifest.version,'0.6.3');
 assert.equal(manifest.sourceRevision,'aea33b2b2593beaa5cfb657bcd0c81a39a46f464');
 for(const file of ['index.html','main.bundle.js','simulation_worker.bundle.js','error_screen.bundle.js','PolyModLoader.js','polytrack_physics.wasm','LICENSE.md']){
  assert(existsSync(folder+file),file);
 }
 const main=readFileSync(folder+'main.bundle.js');
 assert(main.toString('utf8').includes('0.6.3'));
 assert.equal(createHash('sha256').update(main).digest('hex'),manifest.sha256MainBundle);
 const entry=readFileSync(folder+'index.html','utf8');
 assert(entry.includes('../../arcade-bridge.js'));
 assert(entry.includes('window.polytrackModConfiguration'));
 assert(entry.includes('main.bundle.js'));
 assert(entry.includes('menu-layout.js'));
 const layout=readFileSync(folder+'menu-layout.js','utf8');
 assert(layout.includes('sidequest-polytrack-info'));
 assert(layout.includes('Unofficial PolyModLoader mod by'));
 assert(layout.includes('Never relocate sibling menu buttons'));

 assert(manifest.assetCount>500);
});
