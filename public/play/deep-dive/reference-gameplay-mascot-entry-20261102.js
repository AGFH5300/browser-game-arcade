/* The publisher's shrimp swims into answering position rather than
 * appearing at its settled coordinates. Match sampled x/y offsets measured
 * during 0–950ms of round entry at both standard viewports.
 * Separate WAAPI translate from the continuously animated swim transform.
 */
(() => {
 'use strict';
 const root=document.getElementById('app');
 if(!root)return;
 const mounted=new WeakSet();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function mount(){
  const fish=root.querySelector('.dd-game-screen[data-world="ocean"][data-phase="answering"] .dd-game-fish');
  if(!fish||mounted.has(fish))return;
  mounted.add(fish);
  if(reduced.matches||typeof fish.animate!=='function')return;
  const mobile=innerWidth<=650;
  const frames=mobile?[
    {translate:'22px -26px',offset:0},
    {translate:'7px -6px',offset:.263},
    {translate:'2px 0px',offset:.579},
    {translate:'0px 0px',offset:1}
  ]:[
    {translate:'50px -12px',offset:0},
    {translate:'10px -2px',offset:.263},
    {translate:'2px 0px',offset:.579},
    {translate:'0px 0px',offset:1}
  ];
  fish.animate(frames,{duration:950,easing:'linear',fill:'none',composite:'replace'});
 }
 let pending=false;
 const observer=new MutationObserver(()=>{
  if(pending)return;
  pending=true;
  queueMicrotask(()=>{pending=false;mount()});
 });
 observer.observe(root,{subtree:true,childList:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
 window.DeepDiveMascotEntryMotion={mount};
})();
