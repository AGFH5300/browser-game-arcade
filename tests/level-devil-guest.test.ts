import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Level Devil guest SDK resolves startup without trying to load inaccessible Poki core',async()=>{
 const modulePath='../scripts/portal-guest-adapters.mjs';
 const {LEVEL_DEVIL_POKI_GUEST}=await import(modulePath);
 assert.doesNotMatch(LEVEL_DEVIL_POKI_GUEST,/poki-sdk-core|game-cdn\.poki\.com/);
 const generator=readFileSync('scripts/prepare-reference-packages.mjs','utf8');
 assert.ok(generator.includes("pkg.slug==='level-devil' && file.path==='poki-sdk.js'"));
 assert.ok(generator.includes('text=LEVEL_DEVIL_POKI_GUEST'));
 let externalLoads=0;
 const window:{location:{href:string};PokiSDK?:Record<string,(...args:unknown[])=>unknown>}={
  location:{href:'https://sidequest.example/game'}
 };
 const document={createElement(){externalLoads++;throw Error('Unexpected external SDK');}};
 vm.runInNewContext(LEVEL_DEVIL_POKI_GUEST,{window,document,Promise});
 const sdk=window.PokiSDK!;
 assert.equal(await sdk.init(),true);
 assert.equal(await sdk.rewardedBreak(),false);
 assert.equal(await sdk.commercialBreak(),undefined);
 assert.equal(await sdk.getSharableURL(),'https://sidequest.example/game');
 assert.equal(sdk.gameLoadingFinished(),undefined);
 assert.equal(externalLoads,0);
});
