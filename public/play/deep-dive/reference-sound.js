/* Synthesized effects ported from publicly delivered Krillion browser client;
 * local, gesture-activated Web Audio. No sound files, accounts or network access.
 * Original public chunk: /_next/static/chunks/1klevf566y93_.js (2026-10-29).
 */
(() => {
 'use strict';
 const KEY='sidequest:deep-dive:sound', listeners=new Set();
 let ctx=null,master=null,lastTick=-1;
 let muted=false;
 try{muted=localStorage.getItem(KEY)==='off'}catch{}
 const sync=()=>{
   document.querySelectorAll('[data-dd-sound]').forEach(el=>{
     el.setAttribute('aria-pressed',String(!muted));
     el.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');
     el.title=muted?'Unmute sound':'Mute sound';
     el.textContent=muted?'◀×':'◀♫';
   });
   if(master)master.gain.value=muted?0:.75;
   for(const fn of listeners)fn(!muted);
 };
 const unlock=()=>{
   if(!ctx){
     const Constructor=window.AudioContext||window.webkitAudioContext;
     if(!Constructor)return false;
     try{ctx=new Constructor();master=ctx.createGain();master.gain.value=muted?0:.75;master.connect(ctx.destination)}catch{return false}
   }
   if(ctx.state==='suspended')void ctx.resume().catch(()=>{});
   return true;
 };
 const envelope=(gain,start,attack,peak,decay)=>{
   gain.gain.setValueAtTime(.0001,start);
   gain.gain.linearRampToValueAtTime(Math.max(.0001,peak),start+attack);
   gain.gain.exponentialRampToValueAtTime(.0001,start+attack+decay);
 };
 const tone=({type='sine',f0=440,f1,dur=.2,a=.005,peak=.3,lp,delay=0})=>{
   if(!ctx||!master||ctx.state!=='running'||muted)return;
   const at=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
   osc.type=type;osc.frequency.setValueAtTime(f0,at);
   if(f1!==undefined)osc.frequency.exponentialRampToValueAtTime(Math.max(1,f1),at+dur);
   envelope(gain,at,a,peak,dur);
   if(lp){const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=lp;osc.connect(filter);filter.connect(gain)}
   else osc.connect(gain);
   gain.connect(master);
   osc.start(at);osc.stop(at+dur+a+.05);
 };
 const noise=({dur=.3,lp=1200,hp,peak=.25,a=.003,delay=0,sweepTo})=>{
   if(!ctx||!master||ctx.state!=='running'||muted)return;
   const at=ctx.currentTime+delay,length=Math.ceil(ctx.sampleRate*(dur+.1));
   const buffer=ctx.createBuffer(1,length,ctx.sampleRate),samples=buffer.getChannelData(0);
   for(let i=0;i<length;i++)samples[i]=Math.random()*2-1;
   const source=ctx.createBufferSource(),low=ctx.createBiquadFilter(),gain=ctx.createGain();
   source.buffer=buffer;low.type='lowpass';low.frequency.setValueAtTime(lp,at);
   if(sweepTo)low.frequency.exponentialRampToValueAtTime(Math.max(1,sweepTo),at+dur);
   source.connect(low);let last=low;
   if(hp){const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=hp;last.connect(high);last=high}
   envelope(gain,at,a,peak,dur);last.connect(gain);gain.connect(master);
   source.start(at);source.stop(at+dur+.1);
 };
 const arp=(notes,{type='triangle',step=.12,dur=.5,peak=.16,lp}={})=>notes.forEach((f0,i)=>tone({type,f0,dur,peak,lp,delay:i*step}));
 const event=(id)=>{
   if(muted||!ctx||ctx.state!=='running')return;
   switch(id){
     case 'submit':case 'submit_soft':tone({f0:1150,dur:.16,a:.003,peak:id==='submit_soft'?.04:.16});break;
     case 'reject':noise({dur:.22,lp:420,peak:.2});tone({f0:150,f1:62,dur:.36,peak:.22,lp:700});break;
     case 'tierline':tone({type:'triangle',f0:780,f1:1560,dur:.07,peak:.13,lp:2500});break;
     case 'sink':tone({f0:1150,dur:.7,a:.01,peak:.1});noise({dur:1.3,lp:1400,sweepTo:180,peak:.16});tone({f0:300,f1:60,dur:1.3,peak:.1});break;
     case 'land_small':tone({f0:140,f1:70,dur:.25,peak:.28,lp:600});noise({dur:.14,lp:500,peak:.1});break;
     case 'land_big':tone({f0:80,f1:45,dur:.6,peak:.38});noise({dur:.7,lp:900,sweepTo:200,peak:.18,delay:.02});tone({type:'triangle',f0:523,dur:.4,peak:.09,delay:.15});break;
     case 'spare':arp([523.25,783.99],{type:'sine',step:.09,dur:.22,peak:.1});break;
     case 'category':noise({dur:.35,lp:900,sweepTo:4200,hp:400,peak:.07});tone({type:'triangle',f0:988,dur:.32,a:.004,peak:.13,lp:4000,delay:.12});tone({type:'triangle',f0:1319,dur:.55,a:.004,peak:.13,lp:4000,delay:.24});break;
     case 'krillion':tone({f0:60,f1:40,dur:1.2,peak:.34});arp([784,988,1175,1568],{step:.13,dur:.7,peak:.15,lp:3000});noise({dur:1.4,lp:2500,hp:1200,peak:.05,delay:.3});break;
     case 'miss':tone({f0:220,f1:52,dur:.7,peak:.24});noise({dur:.5,lp:400,peak:.14,delay:.05});break;
     case 'tick':tone({f0:880,dur:.07,peak:.16});tone({f0:880,dur:.05,peak:.06,delay:.12});break;
     case 'surface':noise({dur:1.6,lp:300,sweepTo:3000,peak:.16});tone({f0:80,f1:600,dur:1.5,peak:.08});break;
     case 'blub':{const factor=.85+.45*Math.random();tone({f0:260*factor,f1:720*factor,dur:.13,peak:.22,lp:2200});noise({dur:.05,lp:1800,hp:700,peak:.05});break}
     case 'descend':case 'begin':noise({dur:1.1,lp:2000,sweepTo:240,peak:.15});tone({f0:110,f1:48,dur:1.2,peak:.32});tone({type:'triangle',f0:784,dur:.5,peak:.12,lp:3000});tone({type:'triangle',f0:523,dur:.75,peak:.12,lp:3000,delay:.22});break;
   }
 };
 const setMuted=(value)=>{
   muted=Boolean(value);
   try{localStorage.setItem(KEY,muted?'off':'on')}catch{}
   sync();if(!muted)unlock();
 };
 const toggle=()=>setMuted(!muted);
 document.addEventListener('pointerdown',()=>{if(!muted)unlock()},{capture:true,passive:true});
 document.addEventListener('keydown',()=>{if(!muted)unlock()},{capture:true,passive:true});
 document.addEventListener('click',e=>{
   const button=e.target.closest('[data-dd-sound]');
   if(button){e.preventDefault();toggle()}
 });
 document.addEventListener('visibilitychange',()=>{if(ctx){if(document.hidden)void ctx.suspend().catch(()=>{});else if(!muted)void ctx.resume().catch(()=>{})}});
 window.DeepDiveSfx={
   event,unlock,toggle,setMuted,
   get muted(){return muted},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},
   tick(seconds){if(seconds<=5&&seconds>0&&seconds!==lastTick){lastTick=seconds;event('tick')}}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();