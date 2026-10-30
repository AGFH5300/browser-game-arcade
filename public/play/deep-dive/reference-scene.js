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
 const fish=[
  [.13,.28,15,.05],[.21,.36,11,-.08],[.28,.33,18,.08],[.36,.42,16,-.05],
  [.46,.39,14,.09],[.57,.21,19,-.03],[.66,.52,12,-.07],[.79,.38,21,.05],
  [.87,.25,13,.1],[.14,.67,13,.02],[.30,.77,18,.03],[.48,.71,14,-.04],
  [.65,.75,24,.05],[.77,.63,10,-.09],[.89,.83,16,.06],[.38,.58,23,.08],
  [.60,.88,15,.08],[.24,.87,12,-.05],[.11,.49,11,.05]
 ];
 const stars=Array.from({length:90},(_,i)=>({
  x:((i*71.872+Math.sin(i*123.31)*30)%100+100)%100/100,
  y:((i*41.345+Math.sin(i*43.11)*40)%100+100)%100/100,
  size:i%7===0?2:1,phase:i*1.647
 }));
 const bubbles=Array.from({length:24},(_,i)=>({
  x:((i*37.17)%99)/100,y:((i*57.29)%100)/100,r:i%4===0?2.3:1.2,speed:.018+(i%6)*.008
 }));
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
   // Floating ocean snow (same density change as the original low-power renderer).
   ctx.fillStyle='rgba(169,216,231,.28)';
   const particleScale=low?.4:1;
   for(const p of stars.slice(0,Math.ceil(stars.length*particleScale))){
     const x=p.x*w+Math.sin(time*.25+p.phase)*6;
     const y=((p.y*h+time*(4+(p.size*3))+depth*.08)%(h+15));
     ctx.fillRect(Math.round(x),Math.round(y),p.size,p.size);
   }
   if(game){
     // Source client's nine small fish migrate around the 85m marker;
     // positions follow the moving depth column rather than a fixed screen row.
     const yWorld=(game.querySelector('.dd-world')?.getBoundingClientRect().top??208)-rect.top;
     for(let i=0;i<9;i++){
       const x=((26*time+46*i+i*i*7)%(w+360)+(w+360))%(w+360)-180;
       const y=yWorld+170+12*Math.sin(2*time+i)+(i%3)*14;
       if(y>0&&y<h)drawFish(x,y,16,false);
     }
     // Secondary silhouettes at deeper levels retain parallax and bidirectional motion.
     fish.slice(9).forEach(([fx,fy,size,speed],i)=>{
       const drift=(time*speed*390)%w;
       const x=((fx*w+drift+w)%w),y=fy*h+Math.sin(time*.95+i)*3;
       drawFish(Math.round(x),Math.round(y),size,i%3===0);
     });
   }else{
     fish.forEach(([fx,fy,size,speed],i)=>{
       const drift=(time*speed*390)%w;
       const x=((fx*w+drift+w)%w),y=fy*h+Math.sin(time*.95+i)*3;
       drawFish(Math.round(x),Math.round(y),size,i%3===0);
     });
   }
   ctx.strokeStyle='rgba(84,172,205,.22)';
   bubbles.forEach((p,i)=>{
     const y=((p.y*h-time*p.speed*18+h*4)%(h+12));
     const x=p.x*w+Math.sin(time+i)*7;
     ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.stroke();
   });
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
   lastDraw=0;frame=requestAnimationFrame(render);
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