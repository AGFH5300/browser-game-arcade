/* Original publicly delivered Krillion client: intro mascot interpolates from
 * (-120,300) to (0.72*stageWidth, stageHeight/2+195) with exp(-2.6*dt),
 * oscillates by 6*sin(1.7*time) and rotates 4*sin(1.1*time). The 2.6s
 * ds-swim sprite CSS animation operates independently on its inner image.
 *
 * Independent visual reconstruction; does not access publisher server state.
 */
(() => {
 'use strict';
 const app=document.getElementById('app');
 if(!app)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let image=null,anchor=null,raf=0,previous=0,x=-120,y=300,rotation=0,started=0;
 function stop(){
   if(raf)cancelAnimationFrame(raf);
   raf=0;previous=0;
   if(anchor?.isConnected&&anchor.parentNode)anchor.replaceWith(image);
   anchor=null;image=null;
 }
 function run(now){
   raf=0;
   if(!anchor?.isConnected||!app.querySelector('.deep-home[data-phase="intro"]')){stop();return}
   const dt=previous?Math.min(.08,Math.max(0,(now-previous)/1000)):1/60;
   previous=now;
   // Source stage at 1440x900 is x180,width1080,height810; at
   // 390x844 it is x0,width390,height794. The sea canvas itself is
   // full viewport, but the interactive mascot is anchored to the stage.
   const width=Math.min(innerWidth,1080);
   const left=(innerWidth-width)/2;
   const height=Math.max(1,innerHeight-(width<700?50:90));
   const targetX=width*.72;
   const targetY=height/2+195;
   const smoothing=1-Math.exp(-2.6*dt);
   if(reduced.matches){x=targetX;y=targetY;rotation=0}
   else{
     x+=(targetX-x)*smoothing;
     y+=(targetY-y)*smoothing;
     rotation+=(0-rotation)*smoothing;
   }
   const time=now/1000;
   const wave=reduced.matches?0:6*Math.sin(1.7*time);
   const angle=reduced.matches?0:4*Math.sin(1.1*time);
   const size=anchor.offsetWidth/2;
   // Six matched frames at both viewports showed the clone mascot 3–4px too low.\n   // Apply the measured consistent offset without changing its easing or bob.\n   anchor.style.transform='translate3d('+(left+x-size)+'px,'+(y-size+wave-3.7)+'px,0) rotate('+(rotation+angle)+'deg)';
   if(!document.hidden)raf=requestAnimationFrame(run);
 }
 function mount(){
   const next=app.querySelector('.deep-home[data-phase="intro"] .dd-home-mascot');
   if(!next){
     if(anchor||raf)stop();
     return;
   }
   if(next===image&&anchor?.isConnected)return;
   if(anchor||raf)stop();
   image=next;anchor=document.createElement('span');
   anchor.className='dd-source-mascot-anchor';
   image.before(anchor);anchor.append(image);
   x=-120;y=300;rotation=0;previous=0;started=performance.now();
   if(!document.hidden)raf=requestAnimationFrame(run);
 }
 let pending=false;
 const observer=new MutationObserver(()=>{
   if(pending)return;pending=true;
   queueMicrotask(()=>{pending=false;mount()});
 });
 observer.observe(app,{subtree:true,childList:true});
 document.addEventListener('visibilitychange',()=>{
   if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;previous=0}
   else if(anchor?.isConnected&&!raf)raf=requestAnimationFrame(run);
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
 window.DeepDiveSourceMascotMotion={refresh:mount};
})();
