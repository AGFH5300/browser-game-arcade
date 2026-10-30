import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const local=(p:string)=>readFileSync('public/play/deep-dive/'+p,'utf8');
const controls=local('reference-interface.js');
const party=local('party.js');
const menu=local('reference-source-navigation.js');
const game=local('game.js');
const route=readFileSync('app/api/deep-dive/party/route.ts','utf8');
const additions=JSON.parse(local('recovered/common-answer-supplements.json'));
const starters=JSON.parse(local('recovered/free-starters.json'));

test('regression: all edited client scripts remain valid JavaScript',()=>{
 for(const [name,src] of Object.entries({'controls':controls,'party':party,'menu':menu,'game':game}))
  assert.doesNotThrow(()=>new vm.Script(src),name);
});

test('preferences have canonical persistent keys and legacy migration',()=>{
 assert.match(controls,/lowPower:'low-power'/);
 assert.match(controls,/answerCorrections:'answer-corrections'/);
 assert.match(controls,/clearRejected:'clear-rejected'/);
 assert.match(controls,/saved\('lowPower','0'\)/);
 assert.match(controls,/saved\('answerCorrections','1'\)/);
 assert.match(controls,/preferenceKeys\[el\.dataset\.ddSetting\]/);
 assert(!controls.includes('put(el.dataset.ddSetting,'));
});

test('Settings can open on pages without the home utility, and closes accessibly',()=>{
 assert(menu.includes('window.DeepDiveReference?.openSettings?.()'));
 assert(controls.includes('openSettings(){')||controls.includes('  openSettings\n'));
 assert(controls.includes('dd-global-settings'));
 assert(controls.includes('syncChecks()'));
 assert(controls.includes('closeGlobalSettings()'));
 assert(controls.includes("e.key==='Escape'"));
 const css=local('reference-polish-20261030.css');
 assert(css.includes('.dd-global-settings-dialog'));
});

test('public Party checkbox is preserved when picking capacity or avatar',()=>{
 assert(party.includes("if(e.target?.id==='pp-public'){publicFlag=Boolean(e.target.checked)}"));
 assert(party.includes("root.addEventListener('change',onChange)"));
 assert(party.includes("rememberIdentity();publicFlag=Boolean(document.getElementById('pp-public')?.checked);selectedCapacity=n"));
});

test('anonymous avatar streaks are not trusted on the public server',()=>{
 assert(route.includes("allowedAvatar(body.avatar,account)"));
 assert(route.includes('requires a verified daily streak'));
 assert(route.includes(',403)'));
 assert(party.includes('needed>days?'));
});

test('duplicate nickname is a 409 conflict, not a 503 service outage',()=>{
 assert(route.includes("e.message.startsWith('That nickname is already in this room.')"));
 assert(route.includes('return error(e.message,409)'));
});

test('independent Unlimited supplements include common missing answers and are always explicitly estimated',()=>{
 assert.equal(additions.score,10);
 assert.equal(Object.keys(additions.questions).length,7);
 assert.equal(starters.modes.unlimited.questions.length,7);
 const checks:[string,string][]=[
  ['unlimited:1:r1','ramen'],['unlimited:1:r2','chimpanzee'],
  ['unlimited:1:r3','eleven'],['unlimited:1:r4','coffee'],
  ['unlimited:1:r5','merlot'],['unlimited:1:r6','oops'],
  ['unlimited:1:r7','japan']
 ];
 for(const [id,value] of checks)
  assert(additions.questions[id].some((s:string)=>s.toLowerCase()===value),id+': '+value);
 assert(game.includes("sidequest-common-supplement"));
 assert(game.includes("supplement?.score===10"));
 assert(game.includes('res.estimated'));
 assert(game.includes('Common supplementary answers score an explicitly estimated 10 points'));
});

test('reveal does not retain a stale editable answer dock',()=>{
 assert(game.includes("${preview||feedback?'':dockMarkup(seconds)}"));
 assert(game.includes("if(active.index+1>=active.ids.length"));
 assert(game.includes("if(!active||active.phase!=='feedback'||transitioning||revealPending())return;"));
 assert(game.includes(".dd-next-btn:not([disabled])")===false);
 assert(game.includes('active.revealStartedAt=Date.now()'));
 assert(game.includes('const SOURCE_TIER_MS=[3400,3000,3000,3400,4300,4600]'));
 assert(game.includes('if(revealPending())'));
 assert(game.includes('root.querySelector(\'.dd-reveal-pending .dd-game-prompt\')?.remove()'));
});
