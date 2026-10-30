/* Public-client layer parity: ds-fore is a foreground canvas separate
 * from the sea background. Particles are independently reconstructed;
 * density, exact seeds and frame timing are not claimed original. */
(() => {
 'use strict';
 const app=document.getElementById('app');
 if(!app)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const particles=Array.from({length:40},(_,i)=>({
  x:((i*37.173+8.1)%101)/101,y:((i*19.327+31)%103)/103,
  size:i%7===0?2:1,r:(i%6===0?2.2:0),seed:i*1.211,
  speed:4+i%8*1.9
 }));
 let el=null,stage=null,ctx=null,raf=0,last=0;
 function paint(now){
  if(!el||!el.isConnected||!ctx){raf=0;return}
  const fps=reduced.matches?6:document.documentElement.classList.contains('dd-low-power')?12:30;
  if(now-last<1000/fps-1){raf=requestAnimationFrame(paint);return}
  last=now;
  const w=Math.max(1,Math.floor(stage.clientWidth));
  const h=Math.max(1,Math.floor(stage.clientHeight));
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const pw=Math.round(w*dpr),ph=Math.round(h*dpr);
  if(pw!==el.width||ph!==el.height){el.width=pw;el.height=ph}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const z=stage.closest('[data-zone]')?.dataset.zone||'surface';
  const opacity=z==='abyss'?.24:z==='midnight'?.31:z==='deep'?.37:.28;
  const t=now/1000;
  for(const p of particles){
   const x=Math.round(p.x*w+Math.sin(t*.35+p.seed)*5);
   const y=Math.round((p.y*h-t*p.speed+h*8)%(h+5));
   ctx.fillStyle='rgba(155,211,235,'+(opacity+(p.size===2?.1:0))+')';
   ctx.fillRect(x,y,p.size,p.size);
   if(p.r&&y>h*.22){
    ctx.strokeStyle='rgba(117,197,231,'+(opacity*.6)+')';
    ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.stroke()
   }
  }
  raf=requestAnimationFrame(paint)
 }
 function mount(){
  const next=app.querySelector('.dd-game-screen .dd-stage');
  if(next===stage&&el?.isConnected)return;
  if(raf){cancelAnimationFrame(raf);raf=0}
  if(el)el.remove();
  el=null;ctx=null;stage=null;
  if(!next)return;
  stage=next;
  el=document.createElement('canvas');
  el.className='dd-reference-fore-canvas';
  el.setAttribute('aria-hidden','true');
  stage.append(el);
  ctx=el.getContext('2d',{alpha:true,desynchronized:true});
  if(ctx&&!document.hidden)raf=requestAnimationFrame(paint)
 }
 let pending=false;
 const obs=new MutationObserver(()=>{
  if(pending)return;
  pending=true;
  queueMicrotask(()=>{pending=false;mount()})
 });
 obs.observe(app,{childList:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(raf){cancelAnimationFrame(raf);raf=0}}
  else if(el?.isConnected&&!raf)raf=requestAnimationFrame(paint)
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
 window.DeepDiveForeground={refresh:mount};
})();
