/* Original-client source inspection: tier-specific canvas and swarm effects.
 * Independent recreation; no publisher server data or proprietary credentials.
 * Public runtime source e7/e9/te/tt/ej/eK and 2026-10-31 browser observations.
 */
(() => {
 'use strict';
 const REDUCED=matchMedia('(prefers-reduced-motion: reduce)');
 const COLORS={plankton:'#8fa3c4',tooclever:'#ff9f43',schooler:'#4de3ff',
   rare:'#ff5252',deepcut:'#9d7bff',krillion:'#ffd166',miss:'#3d4f6e'};
 const schoolerSprite=new Image();schoolerSprite.src='./reference-assets/tiers/schooler.png';
 const krillSprite=new Image();krillSprite.src='./reference-assets/tiers/krillion-halloween-2026.png';
 const TIER_SCORES=[10,15,30,60,85,100];
 const palettes={plankton:'143,163,196',tooclever:'255,159,67',
   schooler:'200,235,255',rare:'255,82,82',deepcut:'157,123,255',krillion:'255,209,102'};
 let screen=null,stage=null,canvas=null,ctx=null,raf=0,last=0,started=0,landed=false,
   tier='miss',duration=0,bubbles=[],sparks=[],rings=[],orbit=[],swarm=[],spotlight=null,
   flash=null,tierPoints=0,passed=new Set(),clickOrigin={x:0,y:0},doneTimer=0,cleanupTimer=0;
 const rng=(a,b)=>a+Math.random()*(b-a);
 const getOrigin=()=>{
   if(!stage)return clickOrigin;
   const o=stage.getBoundingClientRect();
   const e=stage.querySelector('.dd-chip')||stage.querySelector('.dd-landed')||stage.querySelector('.dd-game-fish');
   if(!e)return clickOrigin;
   const r=e.getBoundingClientRect();
   return {x:r.left-o.left+r.width/2,y:r.top-o.top+Math.min(r.height/2,20)};
 };
 function bubble(x,y,r,col){
   if(bubbles.length>90)return;
   bubbles.push({x:x+rng(-3,3),y,r,vy:rng(14,32),wob:rng(0,9),life:4,t:0,col:col||'200,235,255'});
 }
 function spark(x,y,color,n=16,scale=.7){
   for(let i=0;i<n&&sparks.length<260;i++){
     const theta=Math.random()*2*Math.PI,vel=rng(30,160)*scale,life=rng(.6,1.4);
     sparks.push({x,y,vx:Math.cos(theta)*vel,vy:Math.sin(theta)*vel/2,r:rng(1.5,4),
       t:0,life,color});
   }
 }
 function ring(x,y,n=10){
   for(let i=0;i<n&&rings.length<30;i++){
     const a=Math.random()*2*Math.PI,vel=rng(6,60);
     rings.push({x,y,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel/2,r:rng(12,44),t:0,life:rng(1.2,2.2)});
   }
 }
 function flashScreen(color,pulses=1,ms=200){
   if(!stage||REDUCED.matches)return;
   const node=document.createElement('div');node.className='dd-source-tier-flash';
   node.style.background=color;stage.append(node);
   const frames=[];
   for(let i=0;i<pulses;i++){
     let base=i*ms*2.1;frames.push({opacity:.42,offset:base/(ms*(pulses*2.1))});
     frames.push({opacity:0,offset:Math.min(1,(base+ms)/(ms*(pulses*2.1)))});
   }
   try{node.animate(frames,{duration:ms*pulses*2.1,fill:'forwards'}).finished.finally(()=>node.remove()).catch(()=>node.remove())}
   catch{node.remove()}
 }
 function sourceSwarm(){
   if(!stage||REDUCED.matches)return;
   const w=stage.clientWidth,h=stage.clientHeight;
   const n=w<700?8:11;
   for(let i=0;i<n;i++){
     const node=document.createElement('img');
     node.src='./reference-assets/tiers/schooler.png';node.alt='';
     node.className='dd-source-swarm-fish';
     stage.append(node);swarm.push(node);
     const odd=i%2===0,start=odd?-70:w+70,end=odd?w+70:-70;
     const y=.42*h+rng(-130,130),delay=110*i,time=rng(1300,2000);
     const left=odd?1:-1;
     const animation=node.animate([
       {transform:`translate(${start}px,${y}px) scaleX(${left})`},
       {transform:`translate(${(start+end)/2}px,${.42*h+rng(-30,30)}px) scaleX(${left}) rotate(${rng(-14,14)}deg)`,offset:.5},
       {transform:`translate(${end}px,${y+rng(-60,60)}px) scaleX(${left})`}
     ],{duration:time,delay,easing:'cubic-bezier(.45,.05,.55,.95)',fill:'both'});
     animation.finished.then(()=>node.remove()).catch(()=>node.remove());
   }
 }
 function addOrbit(){
   const n=stage?.clientWidth<700?14:20;
   orbit=Array.from({length:n},()=>({a:Math.random()*Math.PI*2,rad:rng(30,78),
     speed:rng(.7,2.2)*(Math.random()<.5?-1:1),ph:rng(0,9),size:rng(15,28)}));
 }
 function start(e){
   stop();
   tier=e.tier||'miss';tierPoints=Number(e.points||0);passed.clear();
   duration=Math.max(0,e.duration||3400);
   screen=document.querySelector('.dd-game-screen.dd-reveal-screen');
   stage=screen?.querySelector('.dd-stage');
   if(!stage)return;
   started=performance.now();last=started;landed=false;clickOrigin={x:stage.clientWidth/2,y:stage.clientHeight*.38};
   const tierLines=[...stage.querySelectorAll('.dd-tierline')];
   tierLines.forEach(line=>line.classList.remove('lit'));
   requestAnimationFrame(()=>tierLines.forEach(line=>line.classList.add('lit')));
   if(REDUCED.matches)return;
   stage.querySelector('.dd-chip')?.classList.add('dd-source-wiggle');
   canvas=document.createElement('canvas');canvas.className='dd-source-tier-canvas';
   canvas.setAttribute('aria-hidden','true');stage.append(canvas);
   ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
   if(tier==='miss'){flashScreen('rgba(61,79,110,.5)',1,200)}
   if(tier==='tooclever'){flashScreen('rgba(255,159,67,.7)',3,130);sourceSwarm();stage.classList.add('dd-source-shake')}
   if(tier==='rare'){flashScreen('rgba(255,82,82,.4)',1,220)}
   if(tier==='deepcut'){spotlight=document.createElement('div');spotlight.className='dd-source-depth-spotlight';stage.append(spotlight)}
   if(tier==='krillion'){flashScreen('rgba(255,209,102,.45)',1,180);addOrbit()}
   doneTimer=setTimeout(land,Math.max(0,duration));
   cleanupTimer=setTimeout(stop,Math.max(6500,duration+3600));
   if(ctx)raf=requestAnimationFrame(draw);
 }
 function land(){
   if(landed||!stage?.isConnected)return;
   landed=true;
   TIER_SCORES.forEach((score,i)=>{
     if(score>tierPoints||passed.has(score))return;
     passed.add(score);
     stage.querySelectorAll('.dd-tierline')[i]?.classList.add('passed');
     window.DeepDiveSfx?.event('tierline');
   });
   const p=getOrigin(),color=COLORS[tier]||COLORS.miss;
   // Make the accepted word and the landing banner exchange in the same
   // paint. The old separate timers could remove the word before the
   // pending class was cleared, briefly showing neither element.
   const chip=stage.querySelector('.dd-chip');
   const reveal=stage.closest('.dd-reveal-screen');
   reveal?.classList.remove('dd-reveal-pending');
   const next=reveal?.querySelector('.dd-next-btn');
   if(next){next.disabled=false;next.removeAttribute('aria-disabled')}
   if(chip){chip.style.setProperty('visibility','hidden','important');requestAnimationFrame(()=>chip.remove())}
   clickOrigin=p;
   switch(tier){
     case'plankton':spark(p.x,p.y,color,8,.4);break;
     case'tooclever':flashScreen('rgba(255,159,67,.6)',2,130);spark(p.x,p.y,color,18,.7);break;
     case'schooler':spark(p.x,p.y,color,22,.8);break;
     case'rare':ring(p.x,p.y,22);spark(p.x,p.y,color,26,.9);flashScreen('rgba(255,82,82,.45)',1,240);break;
     case'deepcut':spark(p.x,p.y,color,18,.7);if(spotlight)setTimeout(()=>spotlight?.remove(),2300);break;
     case'krillion':spark(p.x,p.y,'#ffd166',16,.7);flashScreen('rgba(255,209,102,.35)',1,220);
       setTimeout(()=>spark(p.x,p.y,'#ffd166',12,.65),1000);break;
   }
   if(tier!=='miss'){
     window.DeepDiveSfx?.event(tier==='krillion'?'krillion':tier==='plankton'||tier==='tooclever'?'land_small':'land_big');
   }
   window.dispatchEvent(new CustomEvent('deepdive:tier-landed',{detail:{tier}}));
 }
 function draw(now){
   if(!stage?.isConnected||!ctx){stop();return}
   const fps= document.documentElement.classList.contains('dd-low-power')?15:30;
   if(now-last<1000/fps-1){raf=requestAnimationFrame(draw);return}
   const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
   const w=stage.clientWidth,h=stage.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
   if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
   const t=(now-started)/1000,col=COLORS[tier]||COLORS.miss;
   const chip=stage.querySelector('.dd-chip.dd-source-wiggle');
   // A long, multiline prompt can extend into the accepted word's flight
   // path. Remove the outgoing prompt at first physical intersection,
   // instead of relying solely on an unrelated 1050ms timeout.
   const outgoing=stage.querySelector('.dd-game-prompt');
   if(chip&&outgoing){
     const cr=chip.getBoundingClientRect(),pr=outgoing.getBoundingClientRect();
     if(cr.top<pr.bottom+4&&cr.bottom>pr.top-4&&cr.left<pr.right&&cr.right>pr.left)
       outgoing.remove();
   }
   if(chip&&!landed){
     const progress=Math.max(0,Math.min(1,(now-started)/Math.max(1,duration)));
     const cubic=progress<.5?4*Math.pow(progress,3):1-Math.pow(-2*progress+2,3)/2;
     const ease=tier==='plankton'?-(Math.cos(Math.PI*progress)-1)/2:cubic;
     const spawn=Number(chip.dataset.spawn||0),top=Number(chip.dataset.y||0);
     const offset=(spawn-top)*(1-ease);
     let x=0,rotation=0;
     if(tier==='plankton'){x=36*Math.sin(7*progress)*(1-.25*progress);rotation=.55*x}
     else if(tier==='tooclever'){x=7*Math.sin(42*progress)+rng(-2,2);rotation=rng(-3,3)}
     else if(tier==='krillion'){x=Math.sin(24*progress)*(1-progress)*26;rotation=.5*x}
     else{x=Math.sin(16*progress)*(1-progress)*14;rotation=.4*x}
     chip.style.setProperty('--chip-drop',offset+'px','important');
     chip.style.setProperty('--chip-wiggle-x',x+'px');
     chip.style.setProperty('--chip-wiggle-rotate',rotation+'deg');
     TIER_SCORES.forEach((score,i)=>{
       if(score>tierPoints*ease||passed.has(score))return;
       passed.add(score);
       const line=stage.querySelectorAll('.dd-tierline')[i];
       line?.classList.add('passed');
       const r=line?.getBoundingClientRect(),st=stage.getBoundingClientRect();
       if(r)spark((r.left+r.right)/2-st.left,r.top-st.top,COLORS[tier]||'#4de3ff',7,.5);
       window.DeepDiveSfx?.event('tierline');
     });
   }
   const p=getOrigin();
   if(spotlight?.isConnected){
     spotlight.style.background=`radial-gradient(circle at ${p.x}px ${p.y}px,transparent 170px,rgba(2,4,10,.25) 310px,rgba(2,4,10,.68) 620px)`;
   }
   if(!landed){
     if(tier==='plankton'&&Math.random()<.25)bubble(p.x+rng(-30,30),p.y, rng(1.2,3),'143,163,196');
     else if(tier==='rare'&&Math.random()<.09)ring(p.x+rng(-20,20),p.y-10,3);
     else if(tier==='deepcut'){if(Math.random()<.3)bubble(p.x+rng(-20,20),p.y,rng(1,3));}
     else if(tier==='krillion'){if(Math.random()<.5)bubble(p.x+rng(-30,30),p.y,rng(1.5,3.5));}
     else if(tier!=='miss'&&Math.random()<.6)bubble(p.x+rng(-34,34),p.y+rng(-8,4),rng(1.5,4));
   }
   for(let i=bubbles.length-1;i>=0;i--){
     const b=bubbles[i];b.t+=dt;b.y-=b.vy*dt;b.x+=Math.sin(b.t*2+b.wob)*dt*9;
     const fade=Math.min(.45,Math.max(0,1-b.t/b.life)*.4);
     ctx.strokeStyle=`rgba(${b.col},${fade})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,2*Math.PI);ctx.stroke();
     if(b.t>b.life)bubbles.splice(i,1);
   }
   for(let i=sparks.length-1;i>=0;i--){
     const s=sparks[i];s.t+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
     const a=Math.max(0,1-s.t/s.life);
     ctx.globalAlpha=a;ctx.fillStyle=s.color;ctx.fillRect(s.x,s.y,s.r,s.r);ctx.globalAlpha=1;
     if(s.t>=s.life)sparks.splice(i,1);
   }
   for(let i=rings.length-1;i>=0;i--){
     const r=rings[i];r.t+=dt;r.x+=r.vx*dt;r.y+=r.vy*dt;
     r.vx*=1-1.6*dt;r.vy*=1-1.6*dt;
     const rad=r.r*(.4+r.t/r.life),alpha=Math.max(0,.55*(1-r.t/r.life));
     ctx.save();ctx.globalAlpha=alpha;
     const gradient=ctx.createRadialGradient(r.x,r.y,0,r.x,r.y,rad);
     gradient.addColorStop(0,'rgba(60,4,14,.95)');
     gradient.addColorStop(1,'rgba(20,0,6,0)');
     ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,2*Math.PI);ctx.fill();
     ctx.restore();
     if(r.t>=r.life)rings.splice(i,1);
   }
   if(tier==='schooler'&&!landed&&schoolerSprite.complete&&schoolerSprite.naturalWidth){
     const followers=[[-64,-26],[-88,10],[64,-18],[88,18],[-40,34],[44,38]];
     followers.forEach(([dx,dy],i)=>{
       ctx.save();ctx.translate(p.x+dx,p.y+dy+6*Math.sin(4*t+i));
       ctx.scale(dx>0?-1:1,1);ctx.drawImage(schoolerSprite,-16,-16,32,32);ctx.restore();
     });
   }
   if(tier==='krillion'&&orbit.length){
     const fade=landed?Math.max(0,1-(now-started-duration-1000)/1500):1;
     for(const o of orbit){
       const angle=o.a+t*o.speed,radius=o.rad*(landed?.62:1);
       const x=p.x+Math.cos(angle)*radius*1.12;
       const y=p.y+Math.sin(angle)*radius*.62+4*Math.sin(2.2*t+o.ph);
       ctx.save();ctx.globalAlpha=.92*fade;ctx.translate(x,y);
       ctx.scale(-Math.sin(angle)*o.speed>0?1:-1,1);
       if(krillSprite.complete&&krillSprite.naturalWidth)
         ctx.drawImage(krillSprite,-o.size/2,-o.size/2,o.size,o.size);
       else{ctx.fillStyle='#ffd166';ctx.fillRect(-o.size/7,-o.size/7,o.size/3,o.size/3)}
       ctx.restore();
     }
   }
   raf=requestAnimationFrame(draw);
 }
 function stop(){
   if(raf)cancelAnimationFrame(raf);raf=0;
   clearTimeout(doneTimer);clearTimeout(cleanupTimer);
   for(const node of swarm)node.remove();swarm=[];
   spotlight?.remove();spotlight=null;
   canvas?.remove();canvas=null;ctx=null;stage=null;screen=null;
   bubbles=[];sparks=[];rings=[];orbit=[];passed.clear();tierPoints=0;
 }
 window.addEventListener('deepdive:tier-plunge',e=>start(e.detail||{}));
 window.addEventListener('deepdive:tier-cleanup',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else if(ctx&&!raf)raf=requestAnimationFrame(draw)});
 window.DeepDiveTierEffects={start,land,stop};
})();
