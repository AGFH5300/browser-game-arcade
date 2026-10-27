import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isSidequestArchive,archiveOrigin,archivePaths} from '../lib/game-archives';
import {isAllowedEmbedUrl,getEmbedSandbox} from '../lib/embeds';
test('only the exact isolated Sidequest package URL receives archive permissions',()=>{
 const url=archiveOrigin+archivePaths[0];assert(isSidequestArchive(url));assert(isAllowedEmbedUrl(url,''));assert(getEmbedSandbox(url).includes('allow-same-origin'));
 for(const bad of [url+'?redirect=evil',url+'#x',url.replace('https:','http:'),url.replace('moto-x3m-2','other'),url.replace('browser-game-arcade-dxbavg-7923s-projects','evil')])assert(!isSidequestArchive(bad));
 assert(!getEmbedSandbox('/play/archives/moto-x3m-2/index.html').includes('allow-same-origin'));
});
test('package source is pinned, bounded and hashes every asset',()=>{
 const m=JSON.parse(readFileSync(new URL('../scripts/moto2-source.json',import.meta.url),'utf8'));assert.match(m.revision,/^[a-f0-9]{40}$/);assert.equal(m.files.length,139);assert(m.files.every((f:{path:string;sha:string})=>!f.path.includes('..')&&/^[a-f0-9]{40}$/.test(f.sha)));
});
