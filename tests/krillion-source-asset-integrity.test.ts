import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';

type Asset = {sourcePath:string;localPath:string;sha256:string;bytes:number};
type Manifest = {source:string;scope:string;observed:number;matched:number;assets:Asset[]};
const manifest=JSON.parse(readFileSync('data/krillion-public-assets-20261031.json','utf8')) as Manifest;
const base=resolve('public/play/deep-dive');

test('observed browser-served Krillion image and font files retain byte-identical SHA-256',()=>{
 assert.equal(manifest.source,'https://krillion.io');
 assert.match(manifest.scope,/not all possible states/i);
 assert.equal(manifest.observed,20);
 assert.equal(manifest.matched,20);
 assert.equal(manifest.assets.length,20);
 for(const asset of manifest.assets){
  const full=resolve(base,asset.localPath);
  assert(full.startsWith(base+sep),'no path escape: '+asset.localPath);
  assert(asset.sourcePath.startsWith('/'));
  assert.equal(statSync(full).size,asset.bytes,asset.localPath);
  assert.equal(createHash('sha256').update(readFileSync(full)).digest('hex'),asset.sha256,asset.localPath);
 }
});
