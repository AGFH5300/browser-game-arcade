import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=(name:string)=>readFileSync('public/play/deep-dive/'+name,'utf8');

test('source-depth ocean canvas uses actual ocean image bands and original continuous stops',()=>{
 const ocean=file('reference-source-ocean-canvas-20261031.js');
 for(const value of ['#1d5580','#123a5e','#0b1526','#081020','#050a14','#03070f','#02050b'])
   assert(ocean.includes(value),value);
 for(const img of ['bg-sky','bg-top','bg-mid','bg-trench'])
   assert(ocean.includes(img),img);
 for(const token of ['picture(assets[','createLinearGradient','marineLife(t,dt,top,depth,w,h)',
   'Math.round(70*scale','requestAnimationFrame','Math.sqrt((low?1500000:8300000)/(w*h))'])
   assert(ocean.includes(token),token);
 assert(file('index-public-art.html').includes('reference-source-ocean-canvas-20261031.js'));
 assert(file('index-public-art.html').includes('reference-source-ocean-canvas-20261031.css'));
});

test('source-depth renderer and old overlay never draw the same ocean game simultaneously',()=>{
 const legacy=file('reference-scene.js'),ocean=file('reference-source-ocean-canvas-20261031.js');
 assert(legacy.includes("app.querySelector('.deep-home[data-phase=\"intro\"] .dd-sea')"));
 assert(legacy.includes("app.querySelector('.dd-game-screen:not([data-world=\"ocean\"]) .dd-game-sea')"));
 assert(!legacy.includes("app.querySelector('.deep-home.dd-game-screen:not([data-zone=\"surface\"])')"));
 assert(ocean.includes("root.querySelector('.dd-game-screen[data-world=\"ocean\"] .dd-stage')"));
 assert(ocean.includes('if(next===stage&&el?.isConnected)return'));
 assert(ocean.includes('el?.remove()'));
 assert(ocean.includes("document.addEventListener('visibilitychange'"));
});

test('all documented depth-specific sea animals move with camera world depth',()=>{
 const ocean=file('reference-source-ocean-canvas-20261031.js');
 for(const depth of [85,800,980,3800,4400])
   assert(ocean.includes('seen('+depth+','),String(depth));
 assert(ocean.includes('s.x+=s.speed*dt/w'));
 assert(ocean.includes('depth+s.offset'));
 assert(ocean.includes('9*Math.sin(.6*t+snow.phase)*dt'));
 assert(ocean.includes('drawImage(image,0,y,w,tileH+1)'));
});
