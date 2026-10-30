import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const file=(name:string)=>readFileSync(root+name,'utf8');

test('source-style loading screen hands off on real app render, not a fixed timeout',()=>{
 const html=file('index-public-art.html'),boot=file('reference-boot.js'),polish=file('reference-polish-20261030.css');
 assert(html.includes('id="dd-boot"'));
 assert(html.includes('descending…'));
 assert(html.includes('reference-boot.js?release=20261030polish1'));
 assert(html.includes('reference-polish-20261030.css?release=20261030social1'));
 assert(boot.includes("observer.observe(app,{childList:true})"));
 assert(boot.includes("app.querySelector('.preload,[data-phase=\"boot\"]')"));
 assert(polish.includes('@media(prefers-reduced-motion:reduce)'));
});
test('surface and source-like icons remain animated and functional',()=>{
 const polish=file('reference-polish-20261030.css'),controls=file('reference-interface.js');
 for(const feature of ['dd-water-current','dd-sky-swell','dd-letter-float','.dd-utility-merch'])
   assert(polish.includes(feature),feature);
 for(const x of ["pixelIcon('sound')","pixelIcon('settings')","pixelIcon('merch')",'https://shop.krillion.io/'])
   assert(controls.includes(x),x);
 assert(controls.includes("sound.innerHTML=pixelIcon(muted?'silent':'sound')"));
});
test('Party uses source brand but keeps separate multiplayer backend and room controls',()=>{
 const party=file('party.js'),css=file('reference-polish-20261030.css');
 assert(party.includes('class="pp-scene-brand" aria-label="KRILLION"'));
 assert(party.includes('animation-delay:1.26s'));
 assert((party.match(/aria-hidden="true" style="animation-delay:/g)||[]).length>=8);
 for(const action of ['quickplay','createPublic','create','join','capacity','avatar'])
   assert(party.includes('data-party="'+action+'"')||party.includes("a==='"+action+"'"),action);
 assert(party.includes("const API='/api/deep-dive/party'"));
 assert(css.includes('.pp-view .pp-ocean-foyer'));
});
test('Archive retains verified source snapshots and adopts the ocean UI',()=>{
 const game=file('game.js'),css=file('reference-polish-20261030.css');
 for(const marker of ['class="dd-archive-brand"','class="dd-archive-content"','data-action="startArchive"','BEST ','loadArchiveSheet(day)'])
   assert(game.includes(marker),marker);
 for(const marker of ['.dd-archive.page','.dd-archive-hero','.dd-archive-month','.dd-archive-date'])
   assert(css.includes(marker),marker);
});
test('new visuals do not re-introduce zero-height Unlimited stage',()=>{
 const polish=file('reference-polish-20261030.css');
 const source=file('reference-source-pages.css');
 assert(!polish.includes('.dd-game-screen .dd-stage'));
 assert(source.includes('.dd-game-screen .dd-stage{position:absolute;inset:0;width:100%;height:100%}'));
});