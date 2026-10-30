import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const game=readFileSync('public/play/deep-dive/game.js','utf8');
const sourceCss=readFileSync('public/play/deep-dive/reference-source-pages.css','utf8');
const parityCss=readFileSync('public/play/deep-dive/reference-results-parity.css','utf8');
type CatchNode={innerHTML:string;value:string;textContent:string;hidden:boolean};
type CatchNodes=Record<string,CatchNode>;
const catchNodes=():CatchNodes=>({
 '.dd-catch-answers ul':{innerHTML:'',value:'',textContent:'',hidden:false},
 '.dd-catch-search':{innerHTML:'',value:'',textContent:'',hidden:false},
 '.dd-catch-tier':{innerHTML:'',value:'',textContent:'',hidden:false},
 '.dd-catch-recovered-count':{innerHTML:'',value:'',textContent:'',hidden:false},
 '.dd-catch-shown':{innerHTML:'',value:'',textContent:'',hidden:false}
});

test('result actions follow bearing and precede expandable recovered catch answers',()=>{
 const bearing=game.indexOf('<div class="dd-done-bands"><h3>THE BEARING</h3>');
 const actions=game.indexOf('<div class="result-actions"><div class="dd-result-primary-actions">',bearing);
 const catchStart=game.indexOf('<div class="dd-done-catch"><h3>THE CATCH · TAP A ROUND FOR EVERY ANSWER</h3>',actions);
 assert(bearing>=0&&actions>bearing&&catchStart>actions,'actions sit between bearing and catch');
 assert.match(game,/const catchRow=\(res,i\)=>\{/);
 assert.match(game,/<details class="dd-catch-row" data-question-id="\$\{safe\(res\.id\)\}"><summary>/);
 assert.match(game,/RECOVERED \+ INDEPENDENT COMMON ANSWERS/);
 assert.match(game,/RECOVERED ANSWERS/);
 assert.match(game,/\[\.\.\.q\.answers\]\.sort\(\(a,b\)=>b\.tier-a\.tier\|\|a\.value\.localeCompare\(b\.value\)\)/);
 assert.match(game,/const icon=t=>t\.id==='plankton'\?'plankton\.png':t\.icon/);
 assert.match(game,/class="dd-catch-search" type="search"/);
 assert.match(game,/class="dd-catch-tier" aria-label="Filter recovered answers by tier"/);
 assert.match(game,/\.addEventListener\('toggle',[\s\S]*renderCatchAnswers\(row\)/);
 assert.match(game,/KEEP DIVING ∞/);
 assert.match(game,/COPY RESULT/);
});

test('score trail uses tier images for answered rounds and an x for unanswered rounds',()=>{
 const start=game.indexOf('  function scoreTrail(results){');
 const end=game.indexOf('  function renderSummary(r){',start);
 const context={TIERS:[{id:'plankton',color:'#a8cbd0'},{id:'rare',color:'#96baff'}]};
 const scoreTrail=vm.runInNewContext(game.slice(start,end)+'\nscoreTrail;',context);
 const svg=scoreTrail([{points:10,tier:0},{points:0,tier:null}]);
 assert.match(svg,/href="\.\/reference-assets\/tiers\/plankton\.png"/);
 assert.match(svg,/class="dd-score-trail-marker dd-score-trail-miss"[^>]*>×/);
 assert.match(svg,/viewBox="0 0 480 269"/);
});

test('opening a catch row renders real answer scores and quips, with scoped search and tier filtering',()=>{
 const start=game.indexOf('  function renderCatchAnswers(row){');
 const end=game.indexOf('  function hookWorldCamera',start);
 const tiers=[
  {id:'plankton',label:'Plankton',score:10,mark:'🫧',icon:''},
  {id:'tooclever',label:'Too Clever',score:15,mark:'🤡',icon:''},
  {id:'schooler',label:'Schooler',score:30,mark:'🐟',icon:'schooler.png'},
  {id:'rare',label:'Rare',score:60,mark:'🦑',icon:'rare.png'},
  {id:'deepcut',label:'Deep Cut',score:85,mark:'🏮',icon:'deepcut.png'},
  {id:'krillion',label:'One in a Krillion',score:100,mark:'🌟',icon:'krillion.png'}
 ];
 const norm=(value:unknown)=>String(value).toLowerCase().replace(/[^a-z0-9]/g,'');
 const safe=(value:unknown)=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const fixture={id:'question-1',answers:[
  {value:'Zebra',tier:0,quip:'Ocean clue'},
  {value:'Alpha',tier:5,quip:'<reef>'},
  {value:'Aardvark',tier:5,quip:''}
 ]};
 const row=(open=true)=>{
  const nodes=catchNodes();
  return {open,dataset:{questionId:'question-1'},classList:{contains:(name:string)=>name==='dd-catch-row'},querySelector:(selector:string)=>nodes[selector],nodes};
 };
 const context={byId:new Map([[fixture.id,fixture]]),TIERS:tiers,norm,safe};
 const render=vm.runInNewContext(game.slice(start,end)+'\nrenderCatchAnswers;',context);
 const closed=row(false);render(closed);assert.equal(closed.nodes['.dd-catch-answers ul'].innerHTML,'');
 const target=row();render(target);
 let html=target.nodes['.dd-catch-answers ul'].innerHTML;
 assert.match(html,/Aardvark/);assert.match(html,/Alpha/);assert.match(html,/Zebra/);
 assert.match(html,/<strong>100<\/strong>/);assert.match(html,/<strong>10<\/strong>/);
 assert.match(html,/&lt;reef&gt;/);assert.match(html,/Ocean clue/);
 assert.equal(target.nodes['.dd-catch-recovered-count'].textContent,'RECOVERED ANSWERS · 3');
 target.nodes['.dd-catch-search'].value='ocean';render(target);
 html=target.nodes['.dd-catch-answers ul'].innerHTML;
 assert.match(html,/Zebra/);assert.doesNotMatch(html,/Alpha|Aardvark/);
 target.nodes['.dd-catch-search'].value='';target.nodes['.dd-catch-tier'].value='5';render(target);
 html=target.nodes['.dd-catch-answers ul'].innerHTML;
 assert.match(html,/Alpha/);assert.doesNotMatch(html,/Zebra/);
});

test('catch and bearing row renderers place tier art, result points, and lazy controls in the source order',()=>{
 const renderStart=game.indexOf('  function renderSummary(r){');
 const start=game.indexOf('    const icon=t=>t.id===',renderStart);
 const end=game.indexOf('    const avg=',start);
 const tiers=[
  {id:'plankton',label:'Plankton',score:10,color:'#a8cbd0',mark:'🫧',icon:''},
  {id:'tooclever',label:'Too Clever',score:15,color:'#ff9f43',mark:'🤡',icon:''},
  {id:'schooler',label:'Schooler',score:30,color:'#8ee6d4',mark:'🐟',icon:'schooler.png'},
  {id:'rare',label:'Rare',score:60,color:'#96baff',mark:'🦑',icon:'rare.png'},
  {id:'deepcut',label:'Deep Cut',score:85,color:'#9d7bff',mark:'🏮',icon:'deepcut.png'},
  {id:'krillion',label:'One in a Krillion',score:100,color:'#ffd166',mark:'🌟',icon:'krillion.png'}
 ];
 const bands=[[0,150,'Plankton'],[151,250,'Schooler'],[251,350,'Rare'],[351,449,'Deep cut'],[450,Infinity,'Krillion']];
 const safe=(value:unknown)=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const context={r:{score:120},BEARING:bands,TIERS:tiers,byId:new Map([['q',{prompt:'Name a sea animal?',answers:[{value:'Whale',tier:0,quip:'Large mammal'}]}]]),safe};
 const rows=vm.runInNewContext(game.slice(start,end)+'\n[bearingRow,catchRow];',context);
 const bearing=rows[0](bands[0]),catchHtml=rows[1]({id:'q',tier:0,answer:'Whale',points:10},0);
 assert.match(bearing,/<img class="dd-tier-icon"[^>]*><b>0–150<\/b><span>Plankton<\/span>/);
 assert.match(catchHtml,/<summary><span class="n">1<\/span><img class="dd-tier-icon"[^>]*><span class="p">/);
 assert.match(catchHtml,/\+10<\/span><i class="dd-catch-expand"/);
 assert.match(catchHtml,/class="dd-catch-search" type="search"/);
 assert.match(catchHtml,/class="dd-catch-tier"/);
 assert.match(catchHtml,/RECOVERED ANSWERS · 1/);
 assert.match(catchHtml,/<ul><\/ul>/,'answer options are populated only after opening the row');
});

test('answer list caps DOM output at 100 while reporting actual match and recovered totals',()=>{
 const start=game.indexOf('  function renderCatchAnswers(row){');
 const end=game.indexOf('  function hookWorldCamera',start);
 const tiers=[{id:'plankton',label:'Plankton',score:10,mark:'🫧',icon:''}];
 const answers=Array.from({length:137},(_,i)=>({value:'Answer '+i,tier:0}));
 const nodes=catchNodes();
 const row={open:true,dataset:{questionId:'large'},classList:{contains:()=>true},querySelector:(selector:string)=>nodes[selector]};
 const render=vm.runInNewContext(game.slice(start,end)+'\nrenderCatchAnswers;',{byId:new Map([['large',{answers}]]),TIERS:tiers,norm:(value:unknown)=>String(value).toLowerCase().replace(/[^a-z0-9]/g,''),safe:(value:unknown)=>String(value)});
 render(row);
 assert.equal((nodes['.dd-catch-answers ul'].innerHTML.match(/<li>/g)||[]).length,100);
 assert.equal(nodes['.dd-catch-recovered-count'].textContent,'RECOVERED ANSWERS · 137');
 assert.equal(nodes['.dd-catch-shown'].textContent,'SHOWING 100 OF 137 MATCHING ANSWERS');
 assert.equal(nodes['.dd-catch-shown'].hidden,false);
});

test('source result styling keeps measured layout and stacked primary actions',()=>{
 assert.match(sourceCss,/width:min\(448px,calc\(100% - 20px\)\)/);
 assert.match(sourceCss,/font-size:27px!important;line-height:27px!important/);
 assert.match(sourceCss,/font-size:80px!important;line-height:80px!important/);
 assert.match(sourceCss,/\.dd-result-primary-actions\{display:grid;grid-template-columns:1fr;/);
 assert.match(sourceCss,/\[data-action="share"\].*background:#ff5d8f/s);
 assert.match(sourceCss,/\[data-action="startEndless"\].*background:#4de3ff/s);
 assert.match(sourceCss,/\.dd-catch-row \.p small[\s\S]*white-space:nowrap/);
 assert.match(sourceCss,/\.dd-catch-answers\{max-height:230px;overflow:auto/);
 assert.match(parityCss,/\.dd-score-trail-marker/);
});
