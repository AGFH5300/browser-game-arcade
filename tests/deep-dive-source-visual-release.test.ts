import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const file=(name:string)=>readFileSync('public/play/deep-dive/'+name,'utf8');

test('source-measured Party geometry and original reef crops are final CSS overrides',()=>{
 const css=file('reference-party-final-geometry-20261031.css');
 const html=file('index-public-art.html');
 assert(html.includes('reference-party-final-geometry-20261031.css'));
 assert(html.indexOf('reference-party-final-geometry-20261031.css')>html.indexOf('reference-party-layout-20261031.css'));
 for(const token of ['translateY(6px)','translateY(31px)','translateY(-32px)',
   'center -190px','center -158px','105vw auto','auto 108svh',
   'reef-d-clean.png','reef-m-clean.png','left:5px!important','width:44px!important',
   'font-size:22px!important','font-size:18px!important'])
   assert(css.includes(token),token);
 assert(css.includes('.pp-sound-toggle{display:none!important}'));
});

test('source swimming mascot target uses the centered 1080px stage, not full desktop width',()=>{
 const js=file('reference-source-mascot-motion-20261031.js');
 const css=file('reference-source-mascot-motion-20261031.css');
 for(const token of ['Math.min(innerWidth,1080)','(innerWidth-width)/2',
   'innerHeight-(width<700?50:90)','width*.72','-120','y=300',
   'Math.exp(-2.6*dt)','6*Math.sin(1.7*time)','4*Math.sin(1.1*time)',
   'requestAnimationFrame(run)','MutationObserver','prefers-reduced-motion'])
   assert(js.includes(token),token);
 assert(css.includes('.dd-source-mascot-anchor'));
 assert(css.includes('width:64px!important;height:64px!important'));
 assert(file('index-public-art.html').includes('reference-source-mascot-motion-20261031.js'));
});

test('motion only attaches to the intro and unmounts when gameplay begins',()=>{
 const js=file('reference-source-mascot-motion-20261031.js');
 assert(js.includes('.deep-home[data-phase="intro"] .dd-home-mascot'));
 assert(js.includes('if(next===image&&anchor?.isConnected)return'));
 assert(js.includes('if(anchor||raf)stop()'));
 assert(js.includes('if(!anchor?.isConnected||!app.querySelector('));
 assert(js.includes("document.addEventListener('visibilitychange'"));
 assert(file('game.js').includes('dd-home-mascot'));
 assert(file('party.js').includes('data-party="capacity"'));
});
