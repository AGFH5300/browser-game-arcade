/* Animated canvas sea: public-client drawing behavior reconstructed for Sidequest.
 * Source reference: Krillion browser bundle createWorldRenderer/sea canvas, 2026-10-29.
 * The water art and sprite resources are the captured, original public assets.
 */
(() => {
 'use strict';
 const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
 const app=document.getElementById('app');
 if(!app)return;
 let canvas=null,sea=null,ctx=null,frame=0,time=0,lastDraw=0,offs=0;
 const stars=[];
 const swimmers=Array.from({length:4},()=>({x:Math.random(),offset:-180+360*Math.random(),
   sp:(14+20*Math.random())*(Math.random()<.5?-1:1),size:7+7*Math.random(),ph:9*Math.random()}));
 let oldWorldY=null,oldTick=0,oldScale='';
 const sourceParticles=(w,h,low)=>{
   const particleScale=prefersReduced.matches?0:low?.4:1;
   const count=Math.round(70*particleScale*Math.min((w*h)/304500,2.4));
   const config=w+':'+h+':'+count;
   if(config===oldScale)return;
   oldScale=config;stars.length=0;
   for(let i=0;i<count;i++)stars.push({x:Math.random()*w,y:Math.random()*h,
     par:.35+.5*Math.random(),r:.6+1.4*Math.random(),a:.12+.25*Math.random(),ph:9*Math.random()});
 };
 /* Public Krillion client paints dark ellipse silhouettes with triangular
    tails, rather than the rectangular fish used in the initial reconstruction. */
 const drawFish=(x,y,size,reverse)=>{
   const radius=Math.max(4,Math.round(size*.52)),direction=reverse?-1:1;
   ctx.fillStyle='rgba(4,9,18,0.85)';
   ctx.beginPath();
   ctx.ellipse(x,y,radius,radius*.45,0,0,Math.PI*2);
   ctx.moveTo(x-direction*radius,y);
   ctx.lineTo(x-direction*radius*1.7,y-radius*.5);
   ctx.lineTo(x-direction*radius*1.7,y+radius*.5);
   ctx.closePath();ctx.fill();
 };
 const render=(now)=>{
   if(!canvas||!sea?.isConnected||!ctx){frame=0;return}
   const low=app.closest('html')?.classList.contains('dd-low-power');
   const fps=prefersReduced.matches?2:low?15:30;
   if(now-lastDraw<1000/fps-1){frame=requestAnimationFrame(render);return}
   lastDraw=now;time=prefersReduced.matches?0:now*.001;
   const rect=sea.getBoundingClientRect(),w=rect.width,h=rect.height;
   if(w<10||h<10){frame=requestAnimationFrame(render);return}
   const dpr=Math.min(devicePixelRatio||1,low?1:2,Math.sqrt((low?1500000:8300000)/(w*h)));
   const cw=Math.round(w*dpr),ch=Math.round(h*dpr);
   if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}
   ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.clearRect(0,0,w,h);
   // Recreate the layered surface line, watery cyan tint and silhouette motion.
   const gradient=ctx.createLinearGradient(0,0,0,h);
   gradient.addColorStop(0,'rgba(14,95,134,.13)');
   gradient.addColorStop(.20,'rgba(6,54,86,.12)');
   gradient.addColorStop(1,'rgba(0,8,19,.08)');
   ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
   const depth=Number(sea.dataset.depth||0);
   const game=sea.closest('.dd-game-screen[data-world="ocean"]');
   if(game){
     const surface=game.querySelector('.dd-world')?.getBoundingClientRect();
     const relativeY=(surface?.top??208)-rect.top;
     const waveY=x=>relativeY+3*Math.sin(.02*x+1.6*time)+2.4*Math.sin(.011*x-time);
     ctx.fillStyle='#1a527a';ctx.beginPath();ctx.moveTo(0,relativeY);
     for(let x=0;x<=w+8;x+=8)ctx.lineTo(x,waveY(x));
     // During a descent the surface can rise above the initial 23vh sky/sea seam.
     // Fill the entire exposed seam, otherwise a pale horizontal gap remains.
     const seamBottom=Math.max(relativeY+30,Math.round(h*.235)+5);
     ctx.lineTo(w,seamBottom);ctx.lineTo(0,seamBottom);ctx.closePath();ctx.fill();
     ctx.beginPath();
     for(let x=0;x<=w+8;x+=8){if(x===0)ctx.moveTo(x,waveY(x));else ctx.lineTo(x,waveY(x))}
     ctx.strokeStyle='rgba(232,241,255,.6)';ctx.lineWidth=2;ctx.stroke();
   }else if(!sea.closest('.dd-reveal-screen')){
     ctx.fillStyle='#287ba084';ctx.beginPath();ctx.moveTo(0,0);
     for(let x=0;x<=w+8;x+=8){const y=1.8*Math.sin(x*.012+time*.44)+1.2*Math.sin(x*.031-time*.57)+2;ctx.lineTo(x,y)}
     ctx.lineTo(w,0);ctx.closePath();ctx.fill();
     ctx.strokeStyle='rgba(93,207,228,.32)';ctx.lineWidth=1;ctx.stroke();
   }
   // Original sea canvas is a distinct 70-particle snow layer, with camera-
   // relative parallax. Impact bubbles and ink rings are painted separately.
   sourceParticles(w,h,low);
   const world=sea.closest('.dd-game-screen')?.querySelector('.dd-world');
   const worldTop=world?.getBoundingClientRect().top??null;
   const shift=worldTop===null||oldWorldY===null?0:Math.max(-h,Math.min(h,worldTop-oldWorldY));
   oldWorldY=worldTop;
   const dt=oldTick?Math.min(.1,Math.max(0,(now-oldTick)/1000)):0;oldTick=now;
   for(const p of stars){
     p.y+=shift*p.par+7.2*dt;
     p.x+=9*Math.sin(.6*time+p.ph)*dt;
     if(p.y>h+10)p.y-=h+20;if(p.y< -10)p.y+=h+20;
     if(p.x>w+10)p.x=-10;if(p.x< -10)p.x=w+10;
     ctx.fillStyle='rgba(200,220,255,'+p.a+')';
     ctx.fillRect(p.x,p.y,p.r,p.r);
   }
   if(game){
     // Only the source 85m school should populate the shallow ocean. Formerly
     // there were 19 arbitrary fish positioned throughout every water zone.
     const top=(game.querySelector('.dd-world')?.getBoundingClientRect().top??0)-rect.top;
     const focusY=top+2*85;
     if(focusY>-80&&focusY<h+80){
       for(let i=0;i<9;i++){
         const x=((26*time+46*i+i*i*7)%(w+360))-180;
         const y=focusY+12*Math.sin(2*time+i)+(i%3)*14;
         drawFish(x,y,16,false);
       }
     }
     // Original also has four slowly moving, depth-relative silhouettes.
     for(const swimmer of swimmers){
       const y=top+2*depth+swimmer.offset+10*Math.sin(time+swimmer.ph);
       swimmer.x+=swimmer.sp*dt/w;
       if(swimmer.x>1.08)swimmer.x=-.08;if(swimmer.x<-.08)swimmer.x=1.08;
       if(depth>20&&y>-30&&y<h+30)drawFish(swimmer.x*w,y,swimmer.size,swimmer.sp<0);
     }
   }else{
     // Intro sea shows an 85m school rather than fixed full-screen fish loops.
     const y0=h*.43;
     for(let i=0;i<9;i++){
       const x=((26*time+46*i+i*i*7)%(w+360))-180;
       drawFish(x,y0+12*Math.sin(2*time+i)+(i%3)*14,16,false);
     }
   }
   // Thin silhouettes of reef shadows at extreme depths.
   if(depth>150){
     const shade=Math.min(.28,(depth-150)/1600*.24);
     ctx.fillStyle='rgba(0,5,14,'+shade+')';
     ctx.fillRect(0,h*.77,w,h*.23);
   }
   frame=requestAnimationFrame(render);
 };
 const refresh=()=>{
   const target=app.querySelector('.deep-home.dd-game-screen:not([data-zone="surface"])')||app.querySelector('.deep-home .dd-sea');
   if(!target){if(canvas)canvas.remove();canvas=null;sea=null;ctx=null;if(frame)cancelAnimationFrame(frame);frame=0;return}
   if(target===sea&&canvas?.isConnected)return;
   if(canvas)canvas.remove();if(frame)cancelAnimationFrame(frame);
   sea=target;canvas=document.createElement('canvas');
   canvas.className='dd-reference-sea-canvas';
   canvas.setAttribute('aria-hidden','true');
   sea.insertBefore(canvas,sea.firstChild);
   ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
   lastDraw=0;oldTick=0;oldWorldY=null;oldScale='';frame=requestAnimationFrame(render);
 };
 window.DeepDiveScene={refresh,setDepth(points){
   const metres=Math.max(0,Math.round((Number(points)||0)*10));
   if(sea)sea.dataset.depth=String(metres);
   const rail=app.querySelector('.dd-game-screen .dd-depth-ticks');
   if(!rail||metres<100)return;
   rail.classList.add('dd-dynamic-depth');
   const upper=Math.max(0,metres-100),lower=metres+100;
   rail.innerHTML='<span class="dd-depth-offset" style="top:22%">−'+upper.toLocaleString('en-US')+'m</span>'+
     '<span class="dd-depth-offset" style="top:66%">−'+lower.toLocaleString('en-US')+'m</span>'+
     '<span class="dd-depth-you" style="top:44%">YOU ◀</span>';
 }};
 prefersReduced.addEventListener?.('change',()=>{lastDraw=0});
 document.addEventListener('visibilitychange',()=>{
   if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0}
   else if(canvas?.isConnected&&!frame)frame=requestAnimationFrame(render);
 });
})();