import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('recovered dynamic game resources are precisely source-hash-pinned',()=>{
 const manifest=JSON.parse(readFileSync('scripts/reference-package-sources.json','utf8'));
 const expected=[
  ['ice-dodo','assets/skins/dodo.png'],
  ['ice-dodo','assets/skins/moon.png'],
  ['ice-dodo','assets/skins/tweet.png'],
  ['level-devil','assets/sfx/sound-741.mp3'],
  ['plant-vs-zombies','level/0.js'],
  ['big-shot-boxing','poki-sdk-core-v2.263.0.js']
 ];
 for(const [slug,path] of expected){
  const pkg=manifest.packages.find((p:{slug:string})=>p.slug===slug);
  assert(pkg,slug);
  const file=pkg.files.find((f:{path:string})=>f.path===path);
  assert(file,slug+'/'+path);
  assert.match(file.sourceSha256,/^[a-f0-9]{64}$/);
  assert(file.sourceSize>0);
  assert(file.url.startsWith('https://watchdocumentaries.com/wp-content/uploads/games/'));
  assert.equal(file.evidence,'runtime-browser-404-verified-source-2026-10-29');
 }
 for(const pkg of manifest.packages){
  assert.equal(pkg.totalFiles,pkg.files.length,pkg.slug+' totalFiles');
  assert.equal(pkg.totalSourceBytes,pkg.files.reduce((n:number,f:{sourceSize:number})=>n+f.sourceSize,0),pkg.slug+' bytes');
 }
});
