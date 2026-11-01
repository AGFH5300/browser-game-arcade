/* Independent recreation of publicly delivered Party background FX.
   Original client uses two canvases, a sea snow field and a foreground
   bubble field, both independent of its sleeping puffer sprite.
   Values match browser-delivered public Party runtime: 78/185 snow
   particles for 390x844 / 1440x900, velocity 4-12px/s, alpha .12-.42,
   x drift 3*sin(.5*time+phase), bubble spawn .35-.9 seconds.
*/
(() => {
 'use strict';
 const app=document.getElementById('app');
 if(!app)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const rand=(a,b)=>a+(b-a)*Math.random();
 let root=null,sea=null,foreground=null,sleepText=null,seaCtx=null,frontCtx=null,raf=0,last=0,started=0,
  lastSize='',snow=[],fish=[],bubbles=[],nextBubble=0;
 function clear(){
  if(raf)cancelAnimationFrame(raf);
  raf=0;last=0;lastSize='';
  sea?.remove();foreground?.remove();sleepText?.remove();
  root=sea=foreground=sleepText=seaCtx=frontCtx=null;started=0;
  snow=[];fish=[];bubbles=[];
 }
 function power(){
  const low=document.documentElement.classList.contains('dd-low-power');
  return reduced.matches?0:low?.4:1;
 }
 function rebuild(width,height){
  const scale=power();
  const small=width<1100;
  const count=Math.round(width*height/(small?4200:7000)*scale);
  const size=width+'x'+height+'@'+count;
  if(lastSize===size)return;
  lastSize=size;
  snow=Array.from({length:count},()=>({
   x:Math.random()*width,y:Math.random()*height,v:rand(4,12),
   a:rand(.12,.42),s:Math.random()<.2?3:2,ph:9*Math.random()
  }));
 }
 function ellipseFish(ctx,x,y,s,direction){
  ctx.beginPath();ctx.ellipse(x,y,s,.42*s,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(x-direction*s*.8,y);
  ctx.lineTo(x-direction*s*1.6,y-.5*s);
  ctx.lineTo(x-direction*s*1.6,y+.5*s);
  ctx.closePath();ctx.fill();
 }
 function tick(now){
  raf=0;
  if(!root?.isConnected||!sea?.isConnected||!frontCtx){clear();return}
  const low=document.documentElement.classList.contains('dd-low-power');
  const fps=reduced.matches?2:low?15:60;
  if(last&&now-last<1000/fps-.5){raf=requestAnimationFrame(tick);return}
  const dt=last?Math.min(.10,(now-last)/1000):1/60;
  last=now;
  const width=root.clientWidth,height=root.clientHeight;
  if(width<20||height<20){raf=requestAnimationFrame(tick);return}
  rebuild(width,height);
  const dpr=Math.min(devicePixelRatio||1,low?1:2);
  for(const [canvas,ctx] of [[sea,seaCtx],[foreground,frontCtx]]){
   const cw=Math.round(width*dpr),ch=Math.round(height*dpr);
   if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}
   ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.clearRect(0,0,width,height);
  }
  if(!started)started=now;
  const time=(now-started)/1000;
  const hero=root.querySelector('.pp-hero-fish');
  if(hero){
    // Original sleeping puffer has separate motion from every sprite frame:
    // y = 2*sin(.72*t)+.8*sin(1.45*t), target rotation
    // -.1+.025*sin(.72*t) radians, scale ~0.90.
    const bob=2*Math.sin(.72*time)+.8*Math.sin(1.45*time);
    const angle=-.1+.025*Math.sin(.72*time);
    const sx=.90*(1+.012*Math.sin(1.45*time));
    const sy=.90*(1+.025*Math.sin(1.45*time));
    hero.style.transform='translateY('+bob.toFixed(3)+'px) rotate('+angle.toFixed(3)+'rad) scale('+sx.toFixed(3)+','+sy.toFixed(3)+')';
    if(sleepText){
      const r=hero.getBoundingClientRect();
      const centerX=r.left+r.width/2,centerY=r.top+r.height/2;
      const phase=(.45*time)%1;
      const size=width<700?104:167;
      sleepText.textContent=phase<.33?'z':phase<.66?'z z':'z z z';
      sleepText.style.left=centerX.toFixed(1)+'px';
      sleepText.style.top=centerY.toFixed(1)+'px';
      sleepText.style.transform='translate('+Math.round(.18*size)+'px,'+Math.round(-.32*size-14*phase)+'px)';
      sleepText.style.opacity=String(.4+.5*Math.sin(phase*Math.PI));
    }
  }
  for(const p of snow){
   p.y+=p.v*dt;p.x+=3*Math.sin(.5*time+p.ph)*dt;
   if(p.y>height+4){p.y=-4;p.x=Math.random()*width}
   seaCtx.fillStyle='rgba(200,220,255,'+p.a+')';
   seaCtx.fillRect(2*Math.round(p.x/2),2*Math.round(p.y/2),p.s,p.s);
  }
  const small=width<1100;
  const usable=Math.min(height,(small?754:810))-24;
  if(usable>24&&power()&&fish.length<2&&Math.random()<.08*dt){
   const right=Math.random()<.5,size=rand(9,15)*(small?1:1.3);
   fish.push({x:right?-30:width+30,y:rand(24,usable),
    v:rand(10,22)*(right?1:-1),sz:size,ph:9*Math.random(),n:Math.random()<.4?3:1});
  }
  seaCtx.fillStyle='rgba(6,16,32,.55)';
  for(let i=fish.length-1;i>=0;i--){
   const f=fish[i];
   f.x+=f.v*dt;
   if(f.y<24||f.y>usable||f.x< -60||f.x>width+60){fish.splice(i,1);continue}
   for(let k=0;k<f.n;k++){
    const dir=Math.sign(f.v),x=Math.round(f.x-dir*k*f.sz*1.8),
     y=Math.round(f.y+3*Math.sin(1.4*time+f.ph+k)+5*k);
    ellipseFish(seaCtx,x,y,f.sz,dir);
   }
  }
  if(power()){
   nextBubble-=dt;
   if(nextBubble<=0){
    nextBubble=rand(.35,.9);
    const cx=width/2,cy=small?Math.round(214*Math.min(height/844,1)+14):height/2,
     rx=small?120:220,ry=small?70:120,angle=rand(0,Math.PI*2);
    bubbles.push({x:cx+Math.cos(angle)*rx*rand(.9,1.3),
     y:cy+Math.sin(angle)*ry*rand(.9,1.2)+10,vx:rand(-8,8),
     vy:rand(-50,-26),r:rand(1.4,3),ph:9*Math.random(),
     drag:1.4,a:.45,life:0,max:rand(2.5,4)});
   }
  }
  for(let i=bubbles.length-1;i>=0;i--){
   const p=bubbles[i];p.life+=dt;
   if(p.life>p.max){bubbles.splice(i,1);continue}
   p.vx*=Math.exp(-p.drag*dt);
   p.vy+=( -38-p.vy)*(1-Math.exp(-1.2*dt));
   p.x+=(p.vx+6*Math.sin(4*p.life+p.ph))*dt;
   p.y+=p.vy*dt;
   const elapsed=p.life/p.max,alpha=p.a*(elapsed>.75?(1-elapsed)/.25:1);
   frontCtx.lineWidth=1.5;
   frontCtx.strokeStyle='rgba(200,235,255,'+alpha.toFixed(3)+')';
   frontCtx.beginPath();frontCtx.arc(p.x,p.y,p.r,0,Math.PI*2);frontCtx.stroke();
   if(p.r>3){
    frontCtx.fillStyle='rgba(232,246,255,'+(.7*alpha).toFixed(3)+')';
    frontCtx.fillRect(Math.round(p.x-.4*p.r),Math.round(p.y-.5*p.r),1.5,1.5);
   }
  }
  if(!document.hidden)raf=requestAnimationFrame(tick);
 }
 function mount(){
  const next=app.querySelector('.pp-view:has(.pp-arena)');
  if(next===root&&sea?.isConnected)return;
  if(root||raf)clear();
  if(!next)return;
  root=next;
  sea=document.createElement('canvas');foreground=document.createElement('canvas');
  sea.className='pp-source-sea';foreground.className='pp-source-fore';
  sea.setAttribute('aria-hidden','true');foreground.setAttribute('aria-hidden','true');
  root.prepend(foreground);root.prepend(sea);
  const heroGroup=root.querySelector('.pp-foyer-center');
  if(heroGroup){
    sleepText=document.createElement('span');
    sleepText.className='pp-source-zzz';
    sleepText.setAttribute('aria-hidden','true');
    heroGroup.append(sleepText);
  }
  seaCtx=sea.getContext('2d',{alpha:true,desynchronized:true});
  frontCtx=foreground.getContext('2d',{alpha:true,desynchronized:true});
  if(seaCtx&&frontCtx&&!document.hidden)raf=requestAnimationFrame(tick);
 }
 let pending=false;
 const obs=new MutationObserver(()=>{
  if(pending)return;pending=true;queueMicrotask(()=>{pending=false;mount()});
 });
 obs.observe(app,{subtree:true,childList:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0}
  else if(root?.isConnected&&!raf)raf=requestAnimationFrame(tick);
 });
 reduced.addEventListener?.('change',()=>{lastSize=''});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.DeepDivePartySourceFX={refresh:mount,get count(){return snow.length},get bubbles(){return bubbles.length}};
})();
