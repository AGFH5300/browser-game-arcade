/* Underwater scene renderer built from publicly delivered Krillion client
 * geometry, depth palette, image bands and creature choreography. A standalone
 * sea layer prevents static CSS water bands from persisting below the surface.
 * Foreground effects, mascot and UI remain separate layers. */
(() => {
 'use strict';
 const root=document.getElementById('app');
 if(!root)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const COLORS=[[0,'#1d5580'],[150,'#123a5e'],[350,'#0b1526'],[800,'#081020'],
   [1400,'#050a14'],[2600,'#03070f'],[5200,'#02050b']];
 const assets=Object.fromEntries(['bg-sky','bg-top','bg-mid','bg-trench'].map(name=>{
   const img=new Image();img.src='./reference-assets/gen/optimized/v1/'+name+'.webp';return [name,img];
 }));
 const shade=(depth)=>{
   const d=Math.max(0,depth);
   for(let i=0;i<COLORS.length-1;i++){
     const [start,a]=COLORS[i],[end,b]=COLORS[i+1];
     if(d<=end){
       const k=(d-start)/(end-start);
       const hex=v=>[1,3,5].map(j=>parseInt(v.slice(j,j+2),16));
       const ca=hex(a),cb=hex(b);
       return ca.map((x,j)=>Math.round(x+(cb[j]-x)*k));
     }
   }
   return [2,5,11];
 };
 const rgba=(d,opacity=1)=>'rgba('+shade(d).join(',')+','+opacity+')';
 const rand=(lo,hi)=>lo+Math.random()*(hi-lo);
 let scene=null,stage=null,world=null,el=null,ctx=null,raf=0,last=0,oldY=null,particles=[],
   swimmers=Array.from({length:4},()=>({
     x:Math.random(),offset:rand(-180,180),speed:rand(14,34)*(Math.random()<.5?-1:1),
     size:rand(7,14),phase:rand(0,9)
   })),lastSize='',active=false;
 function reallocate(w,h,low){
   const scale=reduced.matches?0:low?.4:1;
   const count=Math.round(70*scale*Math.min((w*h)/304500,2.4));
   const key=w+':'+h+':'+count;
   if(lastSize===key)return;
   lastSize=key;particles=Array.from({length:count},()=>({
     x:rand(0,w),y:rand(0,h),par:rand(.35,.85),r:rand(.6,2),
     alpha:rand(.12,.37),phase:rand(0,9)
   }));
 }
 function fish(x,y,r,direction=1){
   ctx.fillStyle='rgba(4,9,18,.85)';
   ctx.beginPath();ctx.ellipse(x,y,r,.45*r,0,0,Math.PI*2);
   ctx.moveTo(x-direction*r,y);ctx.lineTo(x-direction*r*1.7,y-r*.5);
   ctx.lineTo(x-direction*r*1.7,y+r*.5);ctx.closePath();ctx.fill();
 }
 function picture(image,from,to,alpha,worldTop,w,h){
   if(!image.complete||!image.naturalWidth)return;
   const begin=worldTop+from*2,end=worldTop+to*2;
   if(end< -60||begin>h+60)return;
   const tileH=w*image.naturalHeight/image.naturalWidth;
   ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.rect(0,begin,w,end-begin);ctx.clip();
   const first=begin+Math.floor(Math.max(0,-begin)/tileH)*tileH;
   for(let y=first;y<Math.min(end,h);y+=tileH)ctx.drawImage(image,0,y,w,tileH+1);
   ctx.restore();
   if(begin>-150&&begin<h){
     const g=ctx.createLinearGradient(0,begin,0,begin+150);
     g.addColorStop(0,rgba(from,alpha));g.addColorStop(1,rgba(from,0));
     ctx.fillStyle=g;ctx.fillRect(0,begin,w,150);
   }
   if(end>0&&end<h+150){
     const g=ctx.createLinearGradient(0,end-150,0,end);
     g.addColorStop(0,rgba(to,0));g.addColorStop(1,rgba(to,alpha));
     ctx.fillStyle=g;ctx.fillRect(0,end-150,w,150);
   }
 }
 function marineLife(t,dt,top,depth,w,h){
   const yAt=d=>top+2*d;
   const seen=(d,margin)=>yAt(d)>-margin&&yAt(d)<h+margin;
   if(seen(85,80)){
     for(let i=0;i<9;i++){
       const x=((26*t+46*i+i*i*7)%(w+360))-180;
       fish(x,yAt(85)+12*Math.sin(2*t+i)+(i%3)*14,8);
     }
   }
   if(seen(800,120))for(let i=0;i<22;i++){
     const x=.12*w+.034*w*i,y=yAt(800)+22*Math.sin(.7*t+.55*i);
     const a=Math.max(.06,.25+.2*Math.sin(3*t+i));
     ctx.fillStyle='rgba(77,227,255,'+a+')';
     ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();
   }
   if(seen(980,80))for(let i=0;i<6;i++){
     const x=((14*t+110*i)%(w+200))-100;
     const y=yAt(980)+20*Math.sin(t+2*i)+8*i;
     fish(x,y,5,-1);
     ctx.fillStyle='rgba(232,241,255,'+(.25+.25*Math.sin(5*t+i))+')';
     ctx.fillRect(x-1,y-1,2,2);
   }
   if(seen(3800,160)){
     const y=yAt(3800);
     ctx.save();ctx.translate(.5*w,y);ctx.rotate(.06);
     ctx.fillStyle='rgba(4,9,18,.9)';ctx.fillRect(-110,-8,140,22);
     ctx.beginPath();ctx.moveTo(-110,-8);ctx.lineTo(-132,14);ctx.lineTo(-110,14);ctx.closePath();ctx.fill();
     for(let i=0;i<3;i++)ctx.fillRect(-92+34*i,-22,8,14);
     ctx.fillRect(58,-4,60,18);ctx.restore();
   }
   if(seen(4400,80))for(let i=0;i<8;i++){
     const x=(.13*i+.05)*w+14*Math.sin(.8*t+2*i);
     const y=yAt(4400)+18*Math.sin(1.3*t+i)+(i%3)*10;
     ctx.fillStyle='rgba(255,93,143,'+Math.max(0,.15+.2*Math.sin(4*t+3*i))+')';
     ctx.fillRect(x,y,2,2);
   }
   for(const s of swimmers){
     s.x+=s.speed*dt/w;
     if(s.x>1.05)s.x=-.05;if(s.x<-.05)s.x=1.05;
     const offsetDepth=depth+s.offset, y=yAt(offsetDepth)+10*Math.sin(t+s.phase);
     if(offsetDepth>20&&y>-30&&y<h+30)fish(s.x*w,y,s.size,Math.sign(s.speed));
   }
 }
 function draw(now){
   raf=0;if(!stage?.isConnected||!el?.isConnected||!ctx){stop();return}
   const low=document.documentElement.classList.contains('dd-low-power');
   const fps=reduced.matches?2:low?15:30;
   if(now-last<1000/fps-.5){raf=requestAnimationFrame(draw);return}
   const dt=last?Math.min(.1,Math.max(0,(now-last)/1000)):0;
   last=now;
   const w=stage.clientWidth,h=stage.clientHeight;
   if(w<20||h<20){raf=requestAnimationFrame(draw);return}
   const scale=Math.min(devicePixelRatio||1,low?1:2,Math.sqrt((low?1500000:8300000)/(w*h)));
   const cw=Math.round(w*scale),ch=Math.round(h*scale);
   if(el.width!==cw||el.height!==ch){el.width=cw;el.height=ch}
   reallocate(w,h,low);
   ctx.setTransform(scale,0,0,scale,0,0);
   ctx.clearRect(0,0,w,h);
   const stageBounds=stage.getBoundingClientRect();
   const top=(world?.getBoundingClientRect().top??0)-stageBounds.top;
   const depth=(h/2-top)/2;
   const t=reduced.matches?0:now/1000;
   const gradient=ctx.createLinearGradient(0,0,0,h);
   gradient.addColorStop(0,rgba(Math.max(0,depth-h/4)));
   gradient.addColorStop(.5,rgba(Math.max(0,depth)));
   gradient.addColorStop(1,rgba(Math.max(0,depth+h/4)));
   ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
   picture(assets['bg-top'],40,470,.45,top,w,h);
   picture(assets['bg-mid'],480,2620,.5,top,w,h);
   picture(assets['bg-trench'],2950,7060,.55,top,w,h);
   if(top>-40){
     const sky=assets['bg-sky'];
     if(sky.complete&&sky.naturalWidth){
       const imageH=w*sky.naturalHeight/sky.naturalWidth,y=top+6-imageH;
       if(y>0){ctx.fillStyle='#81cbe8';ctx.fillRect(0,0,w,y)}
       ctx.drawImage(sky,0,y,w,imageH);
     }else{
       const skyGradient=ctx.createLinearGradient(0,top-400,0,top);
       skyGradient.addColorStop(0,'#8fd0f0');skyGradient.addColorStop(1,'#d8f0ff');
       ctx.fillStyle=skyGradient;ctx.fillRect(0,0,w,Math.max(0,top));
     }
     const wave=x=>top+3*Math.sin(.02*x+1.6*t)+2.4*Math.sin(.011*x-t);
     ctx.beginPath();ctx.moveTo(0,top);
     for(let x=0;x<=w+8;x+=8)ctx.lineTo(x,wave(x));
     ctx.lineTo(w,top+30);ctx.lineTo(0,top+30);ctx.closePath();
     ctx.fillStyle=rgba(0);ctx.fill();
     ctx.beginPath();
     for(let x=0;x<=w+8;x+=8){if(x===0)ctx.moveTo(x,wave(x));else ctx.lineTo(x,wave(x))}
     ctx.strokeStyle='rgba(232,241,255,.6)';ctx.lineWidth=2;ctx.stroke();
   }
   // Original two fields are independent: 70 ocean particles and 26 foreground.
   const shift=oldY===null?0:(oldY-top);
   oldY=top;
   for(const snow of particles){
     snow.y-=shift*snow.par-7.2*dt;
     snow.x+=9*Math.sin(.6*t+snow.phase)*dt;
     if(snow.y>h+10)snow.y-=h+20;if(snow.y< -10)snow.y+=h+20;
     if(snow.x>w+10)snow.x=-10;if(snow.x< -10)snow.x=w+10;
     ctx.fillStyle='rgba(200,220,255,'+snow.alpha+')';
     ctx.fillRect(snow.x,snow.y,snow.r,snow.r);
   }
   marineLife(t,dt,top,depth,w,h);
   raf=requestAnimationFrame(draw);
 }
 function stop(){
   if(raf)cancelAnimationFrame(raf);raf=0;
   el?.remove();el=null;ctx=null;stage=null;world=null;scene=null;
   oldY=null;last=0;lastSize='';active=false;
 }
 function mount(){
   const next=root.querySelector('.dd-game-screen[data-world="ocean"] .dd-stage');
   if(next===stage&&el?.isConnected)return;
   stop();if(!next)return;
   stage=next;scene=next.closest('.dd-game-screen');world=next.querySelector('.dd-world');
   el=document.createElement('canvas');el.className='dd-source-ocean-canvas';
   el.setAttribute('aria-hidden','true');
   const sea=next.querySelector('.dd-game-sea');
   if(sea)sea.after(el);else next.prepend(el);
   ctx=el.getContext('2d',{alpha:false,desynchronized:true});
   active=true;if(ctx&&!document.hidden)raf=requestAnimationFrame(draw);
 }
 let pending=false;const watcher=new MutationObserver(()=>{
   if(pending)return;pending=true;queueMicrotask(()=>{pending=false;mount()});
 });
 watcher.observe(root,{childList:true,subtree:false});
 document.addEventListener('visibilitychange',()=>{
   if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}
   else if(ctx&&!raf){last=0;oldY=null;raf=requestAnimationFrame(draw)}
 });
 reduced.addEventListener?.('change',()=>{lastSize='';last=0});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
 window.DeepDiveOceanCanvas={refresh:mount,depth:()=>stage?(stage.clientHeight/2-(world?.getBoundingClientRect().top-stage.getBoundingClientRect().top))/2:null,
   get active(){return active},palette:shade};
})();
