import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Snow Rider starts the packaged Unity build instead of leaving an empty game container',()=>{
 const source=readFileSync('scripts/prepare-extra-packages.mjs','utf8');
 assert(source.includes('async function transformSnowRider('));
 assert(source.includes('TemplateData/UnityProgress.js'));
 assert(source.includes('Build/UnityLoader.js'));
 assert(source.includes('UnityLoader.instantiate("gameContainer", "Build/SnowRider3D-gd-1.json"'));
 assert(source.includes('window.addEventListener("DOMContentLoaded"'));
 assert(source.includes('Snow Rider source bootstrap changed; inspect before patching.'));
 assert(source.includes('Snow Rider failed to start. Try restarting the game.'));
});
