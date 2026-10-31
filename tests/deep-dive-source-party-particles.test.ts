import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(name:string)=>readFileSync('public/play/deep-dive/'+name,'utf8');

test('the original Party CRT, vignette and panel shading are separate layers',()=>{
 const css=src('reference-source-party-overlays-20261031.css');
 for(const x of ['rgba(2,4,10,.85)','opacity:.55','rgba(0,0,0,.18)',
 'opacity:.45','rgba(8,15,28,.84)','0 0 0 2px #060d1a',
 '0 0 0 4px #1b3050','font-size:50.7px','font-size:76px',
 'padding-top:18px','padding-top:16px','top:-84px'])
  assert(css.includes(x),x);
 assert(src('index-public-art.html').includes('reference-source-party-overlays-20261031.css'));
});

test('the original Party has distinct moving sea-snow and foreground bubble canvas layers',()=>{
 const js=src('reference-party-source-particles-20261031.js');
 const css=src('reference-party-source-particles-20261031.css');
 for(const x of ['small?4200:7000','Math.round(width*height',
 'rand(4,12)','rand(.12,.42)','Math.random()<.2?3:2','3*Math.sin(.5*time+p.ph)',
 '2*Math.round(p.x/2)','rand(.35,.9)','rand(-50,-26)','rand(2.5,4)',
 'pp-source-sea','pp-source-fore','MutationObserver','prefers-reduced-motion'])
  assert(js.includes(x),x);
 assert(js.includes('bubbles.push'));
 assert(js.includes('pp-source-zzz'));
 assert(js.includes('2*Math.sin(.72*time)+.8*Math.sin(1.45*time)'));
 assert(js.includes('fish.push'));
 assert(css.includes('z-index:2'));
 assert(css.includes('z-index:4'));
 assert(css.includes('z-index:9'));
 assert(src('index-public-art.html').includes('reference-party-source-particles-20261031.js'));
});

test('Party sleeping puffer has independently updated motion and timed z indicators',()=>{
 const js=src('reference-party-source-particles-20261031.js');
 const css=src('reference-party-source-particles-20261031.css');
 for(const x of ['2*Math.sin(.72*time)','Math.sin(1.45*time)',
  '-.1+.025*Math.sin(.72*time)',"phase<.33?'z':phase<.66?'z z':'z z z'",
  '.4+.5*Math.sin(phase*Math.PI)','pp-source-zzz','Math.round(.18*size)'])
  assert(js.includes(x),x);
 assert(css.includes('font:24px/36px'));
 assert(css.includes('letter-spacing:2.4px'));
});

test('selected Party capacity displays real source capacity caption in the appropriate mode',()=>{
 const html=src('party.js');
 assert(html.includes('pp-capacity-hint'));
 assert(html.includes('4 to 6 players'));
 assert(html.includes('8 to 10 players'));
 assert(html.includes('aria-live="polite"'));
});
