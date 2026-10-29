/* Sidequest themed world renderer: public first-party visual assets and
 * independently controlled world geography. The original client has a 16,400px
 * themed column; only the first free starter is currently data-backed.
 * This does not claim recovery of unreleased/paid chapters or an original
 * background composition; arrangement approximates the observed world.
 */
(() => {
 'use strict';
 const prefix='./reference-assets/gen/optimized/v1/';
 const W={
  ocean:{height:14800,floorTop:14020,label:'OCEAN',color:'#4de3ff',scenery:[]},
  hollywood:{height:16400,floorTop:15620,label:'AT THE MOVIES',color:'#e7a1f0',
   scenery:[['hollywood/bg-far.webp',180,'far'],['hollywood/gate.webp',330,'gate'],
     ['hollywood/bg-mid-neon.webp',1550,'mid'],['hollywood/bg-mid-hills.webp',3300,'mid'],
     ['hollywood/bg-mid-b.webp',5650,'mid'],['hollywood/bg-mid-c.webp',8400,'mid'],
     ['hollywood/bg-mid-neon-b.webp',11400,'mid'],['hollywood/premiere.webp',14000,'floor-scene']]},
  gauntlet:{height:16400,floorTop:15620,label:'SPORTS',color:'#7af5ac',
   scenery:[['gauntlet/bowl-far.webp',170,'far'],['gauntlet/tunnel.webp',410,'gate'],
     ['gauntlet/floor-track.webp',1850,'mid'],['gauntlet/floor-pitch.webp',4050,'mid'],
     ['gauntlet/floor-clay.webp',6200,'mid'],['gauntlet/floor-pool.webp',8500,'mid'],
     ['gauntlet/floor-ice.webp',11200,'mid'],['gauntlet/podium.webp',13900,'floor-scene']]},
  atlas:{height:16400,floorTop:15620,label:'GEOGRAPHY',color:'#82d3ff',
   scenery:[['atlas/scene-alps.webp',160,'far'],['atlas/scene-canyon.webp',1750,'mid'],
     ['atlas/scene-antarctica.webp',3550,'mid'],['atlas/scene-greatwall.webp',5450,'mid'],
     ['atlas/scene-outback.webp',7400,'mid'],['atlas/scene-amazon.webp',9800,'mid'],
     ['atlas/scene-savanna.webp',12500,'mid']]},
  lexicon:{height:16400,floorTop:15620,label:'WORDS & LANGUAGE',color:'#f3c888',
   scenery:[['lexicon/desk-landscape.webp',120,'far'],['lexicon/notebook.webp',950,'gate'],
     ['lexicon/desk-portrait.webp',4300,'mid'],['lexicon/desk-landscape.webp',8700,'mid'],
     ['lexicon/notebook.webp',12400,'mid']]}
 };
 const safe=x=>String(x).replace(/[^a-z0-9_-]/gi,'');
 const config=id=>W[id]||W.ocean;
 const scenery=id=>{
   const world=config(id);
   return world.scenery.map(([asset,y,kind],i)=>
      '<img class="dd-world-setpiece dd-world-'+safe(kind)+'" src="'+prefix+asset+
      '" alt="" aria-hidden="true" loading="'+(i<2?'eager':'lazy')+
      '" decoding="async" style="--y:'+y+'px;--layer:'+i+'">'
   ).join('');
 };
 window.DeepDiveThemes={config,scenery,keys:Object.keys(W)};
})();
