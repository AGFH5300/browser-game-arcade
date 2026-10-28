import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('scripts/reference-package-sources.json','utf8'));
const bySlug=new Map(manifest.packages.map((x:{slug:string})=>[x.slug,x]));
const get=(s:string)=>bySlug.get(s) as {files:Array<{path:string,required:boolean,sourceSha256:string,sourceSize:number}>,totalSourceBytes:number,totalFiles:number};
test('critical page-one runtime files are pinned, required and integrity checked',()=>{
 const required:{[slug:string]:string[]}={
  'crazy-cattle-3d':['index.pck'],
  'eaglercraft':['assets.epk'],
  'granny':['StreamingAssets/Audio/Audio/_Done/ButtonClick_MP3.mp3','StreamingAssets/Audio/Audio/_Done/Menu_MP3.mp3'],
  'granny-2':['StreamingAssets/aa/settings.json','StreamingAssets/aa/catalog.json','StreamingAssets/aa/WebGL/defaultlocalgroup_scenes_all_f11cbd6bc591e66331593f2581376106.bundle'],
  'traffic-jam-3d':['TemplateData/gears.gif'],
  'a-small-world-cup':['media/goal_uaaah.m4a','media/song_menu_drum.m4a'],
  'geometry-dash-hyper-wave':['html5game/snd_click.ogg','html5game/snd_lvl_1.ogg']
 };
 for(const [slug,paths] of Object.entries(required)){
  const pkg=get(slug);assert(pkg,slug);
  for(const path of paths){const file=pkg.files.find(x=>x.path===path);assert(file,slug+': '+path);assert(file.required);assert.match(file.sourceSha256,/^[a-f0-9]{64}$/);assert(file.sourceSize>100)}
  assert.equal(pkg.files.length,pkg.totalFiles);assert.equal(pkg.files.reduce((n,x)=>n+x.sourceSize,0),pkg.totalSourceBytes);
 }
});
test('page-one transforms target broken Unity loader roots and keep Construct 2 parser intact',()=>{
 const code=readFileSync('scripts/prepare-reference-packages.mjs','utf8');
 assert(code.includes("pkg.slug==='ovo' && file.path==='c2runtime.js'"));
 assert(code.includes("['rocket-league','subway-surfers'].includes(pkg.slug)"));
 assert(code.includes("pkg.slug==='granny'"));
 assert(code.includes("if (name==='data' && tagName!=='object') return full;"));
});
