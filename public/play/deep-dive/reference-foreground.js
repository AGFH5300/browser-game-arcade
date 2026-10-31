/* Source-derived foreground snow layer from publicly delivered original renderer:
   26 particles per 304500px² of visible stage (capped at 2.4×), independent of
   the sea canvas, camera-parallax 1.15–1.60, 12px/s rise and sinusoidal drift. */
(() => {
 'use strict';
 const app=document.getElementById('app');if(!app)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let el=null,stage=null,ctx=null,raf=0,last=0,lastWorld=null,particles=[];
 const buildParticles=(w,h)=>{
   const scale=reduced.matches?0:document.documentElement.classList.contains('dd-low-power')?.4:1;
   const count=Math.round(26*scale*Math.min((w*h)/304500,2.4));
   particles=Array.from({length:count},()=>({
     x:Math.random()*w,y:Math.random()*h,
     par:1.15+.45*Math.random(),r:1+1.8*Math.random(),
     a:.18+.3*Math.random(),ph:9*Math.random()
   }));
 };
 function paint(now){
   if(!el?.isConnected||!ctx||!stage){raf=0;return}
   const low=document.documentElement.classList.contains('dd-low-power');
   const fps=reduced.matches?2:low?15:30;
   if(now-last<1000/fps-.5){raf=requestAnimationFrame(paint);return}
   const dt=last?Math.max(0,Math.min(.1,(now-last)/1000)):0;
   last=now;
   // Original ds-fore is clipped to the 1080px centred stage, unlike
   // the source sea canvas which covers the entire viewport.
   const stageWidth=Math.max(1,stage.clientWidth);
   const w=Math.min(1080,stageWidth),h=Math.max(1,stage.clientHeight);
   el.style.left=Math.max(0,(stageWidth-w)/2)+'px';
   el.style.width=w+'px';
   el.style.height=h+'px';
   const ratio=Math.min(devicePixelRatio||1,low?1:2,Math.sqrt((low?1500000:8300000)/(w*h)));
   const cw=Math.floor(w*ratio),ch=Math.floor(h*ratio);
   if(cw!==el.width||ch!==el.height){el.width=cw;el.height=ch;buildParticles(w,h)}
   const world=stage.querySelector('.dd-world');
   const worldY=world?.getBoundingClientRect().top??0;
   const shift=lastWorld===null?0:Math.max(-h,Math.min(h,worldY-lastWorld));
   lastWorld=worldY;
   ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
   for(const p of particles){
     p.y+=shift*p.par+12*dt;
     p.x+=13.2*Math.sin(.5*now/1000+p.ph)*dt;
     if(p.y>h+12)p.y-=h+24;if(p.y< -12)p.y+=h+24;
     if(p.x>w+12)p.x=-12;if(p.x< -12)p.x=w+12;
     ctx.fillStyle='rgba(220,235,255,'+p.a+')';
     ctx.fillRect(p.x,p.y,p.r,p.r);
   }
   raf=requestAnimationFrame(paint);
 }
 function mount(){
   const next=app.querySelector('.dd-game-screen .dd-stage');
   if(next===stage&&el?.isConnected)return;
   if(raf){cancelAnimationFrame(raf);raf=0}
   el?.remove();el=null;ctx=null;stage=null;lastWorld=null;last=0;particles=[];
   if(!next)return;
   stage=next;el=document.createElement('canvas');el.className='dd-reference-fore-canvas';
   el.setAttribute('aria-hidden','true');stage.append(el);
   ctx=el.getContext('2d',{alpha:true,desynchronized:true});
   if(ctx&&!document.hidden)raf=requestAnimationFrame(paint);
 }
 let pending=false;
 const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;mount()})});
 observer.observe(app,{childList:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}
   else if(el?.isConnected&&!raf){last=0;lastWorld=null;raf=requestAnimationFrame(paint)}});
 reduced.addEventListener?.('change',()=>{last=0;lastWorld=null;particles=[]});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.DeepDiveForeground={refresh:mount};
})();
