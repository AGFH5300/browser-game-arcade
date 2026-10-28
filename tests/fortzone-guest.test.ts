import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Fortzone local guest bridge starts without network, payments or advertising',async()=>{
 const modulePath='../scripts/portal-guest-adapters.mjs';
 const {FORTZONE_GAMEPUSH_GUEST}=await import(modulePath);
 assert.doesNotMatch(FORTZONE_GAMEPUSH_GUEST,/https?:\/\//);
 const generator=readFileSync('scripts/prepare-reference-packages.mjs','utf8');
 assert.match(generator,/pkg.slug==='fortzone-battle-royale'/);
 assert.ok(generator.includes('TemplateData/gp_bundle/gamepush.js'));
 const captured:{gp?:Record<string,unknown>}={};
 const window={onGPInit:(api:Record<string,unknown>)=>{captured.gp=api;}};
 const document={createElement:()=>{throw new Error('Unexpected network SDK injection');}};
 vm.runInNewContext(FORTZONE_GAMEPUSH_GUEST,{window,document,Promise});
 assert.ok(captured.gp);
 const api=captured.gp! as {player:{ready:Promise<boolean>;isLoggedIn:boolean};ads:{showPreloader:()=>Promise<boolean>;showRewardedVideo:()=>Promise<boolean>};payments:{isAvailable:boolean};gameStart:()=>Promise<boolean>};
 assert.equal(await api.player.ready,true);
 assert.equal(await api.ads.showPreloader(),false);
 assert.equal(await api.ads.showRewardedVideo(),false);
 assert.equal(api.payments.isAvailable,false);
 assert.equal(api.player.isLoggedIn,false);
 assert.equal(await api.gameStart(),true);
});
