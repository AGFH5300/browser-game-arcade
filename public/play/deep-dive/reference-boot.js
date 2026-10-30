/* Source-like loading state; hand off only after Deep Dive has rendered. */
(() => {
 'use strict';
 const boot=document.getElementById('dd-boot');
 const app=document.getElementById('app');
 if(!boot||!app)return;
 const launched=performance.now();
 let closed=false;
 const finish=()=>{
   if(closed)return;
   if(app.querySelector('.preload,[data-phase="boot"]'))return;
   if(!app.firstElementChild)return;
   closed=true;observer.disconnect();
   const remaining=Math.max(0,400-(performance.now()-launched));
   setTimeout(()=>{
     boot.dataset.complete='true';
     boot.setAttribute('aria-hidden','true');
     setTimeout(()=>boot.remove(),510);
   },remaining);
 };
 const observer=new MutationObserver(finish);
 observer.observe(app,{childList:true});
 if(document.readyState==='loading')
   document.addEventListener('DOMContentLoaded',finish,{once:true});
 else finish();
 setTimeout(()=>{
   if(!closed){
     const label=boot.querySelector('.dd-boot-message');
     if(label)label.textContent='descending… loading the dive';
   }
 },8000);
})();