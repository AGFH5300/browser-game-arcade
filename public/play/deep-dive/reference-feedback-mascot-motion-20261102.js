/* Time-sampled feedback mascot choreography.
 * Measured in paired publisher/Sidequest browser captures on 1 Nov 2026 at
 * 1440x900 and 390x844, t = 0, .25, .55, 1.05, 1.9, 3.3, 4.3 seconds.
 * Anchors use the game stage, not the page viewport. This recreates the
 * observed moving shrimp and removes the frozen feedback-position override.
 * Other tiers use the same normalized path until separately measured.
 */
(() => {
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 // x/y are stage-relative. Source rects sampled for a 10-point landing.
 const desktop=[
  [0,15.3,614.6,65.5],[250,446.9,381.5,83],[550,525.2,333.2,85],
  [1050,583,291.7,86],[1900,591.8,286.2,84.5],
  [3300,202.8,211,71.6],[4300,141.4,188.1,72.5]
 ];
 const mobile=[
  [0,14.1,586.3,68],[250,111,454.2,72.4],[550,174,361.2,79.6],
  [1050,213.3,305.5,84.4],[1900,221.7,290,86.4],
  [3300,161.2,246.7,78.2],[4300,35.9,193.1,73.5]
 ];
 let root=null,fish=null,stage=null,raf=0,started=0,ms=4300,steps=[],lastTime=0;
 const lerp=(a,b,t)=>a+(b-a)*t;
 function sample(anchors,time){
  if(time<=anchors[0][0])return anchors[0].slice(1);
  for(let i=1;i<anchors.length;i++){
   if(time>anchors[i][0])continue;
   const from=anchors[i-1],to=anchors[i];
   const p=(time-from[0])/(to[0]-from[0]);
   // Ease endpoints continuously; do not teleport between measured frames.
   const eased=p*p*(3-2*p);
   return [1,2,3].map(k=>lerp(from[k],to[k],eased));
  }
  return anchors.at(-1).slice(1);
 }
 function paint(now){
  raf=0;
  if(!fish?.isConnected||!stage?.isConnected||!fish.closest('.dd-reveal-screen')){
   stop();return;
  }
  const stageW=stage.clientWidth,stageH=stage.clientHeight;
  const mobileWeight=Math.max(0,Math.min(1,(1080-stageW)/(1080-390)));
  const elapsed=reduce.matches?ms:Math.max(0,now-started);
  const progress=sample(steps,elapsed);
  const srcD=sample(desktop,elapsed),srcM=sample(mobile,elapsed);
  // For intermediate widths, interpolate the two observed stage-relative
  // tracks, avoiding a discontinuity at CSS breakpoint widths.
  const x=lerp(srcD[0]/1080*stageW,srcM[0]/390*stageW,mobileWeight);
  const y=lerp(srcD[1]/810*stageH,srcM[1]/794*stageH,mobileWeight);
  const size=lerp(srcD[2],srcM[2],mobileWeight);
  // Inline !important is deliberate: previous tier CSS hard-coded the
  // feedback mascot to x=768 / x=179 and stopped it from travelling.
  for(const [prop,val] of [['left',x+'px'],['top',y+'px'],
   ['width',size+'px'],['height',size+'px']])
   fish.style.setProperty(prop,val,'important');
  fish.style.setProperty('margin-left','0px','important');
  fish.style.setProperty('margin-top','0px','important');
  fish.style.setProperty('animation','none','important');
  fish.style.setProperty('transform','none','important');
  lastTime=elapsed;
  if(elapsed<ms&&!reduce.matches)raf=requestAnimationFrame(paint);
 }
 function stop(){
  if(raf)cancelAnimationFrame(raf);
  raf=0;fish=null;stage=null;root=null;
 }
 function start(detail){
  stop();
  root=document.querySelector('.dd-game-screen.dd-reveal-screen');
  fish=root?.querySelector('.dd-game-fish')||null;
  stage=root?.querySelector('.dd-stage')||null;
  if(!root||!fish||!stage)return;
  const duration=Math.max(900,Number(detail?.duration)||3400);
  // Source timeline includes a short return-to-idle after the category lands.
  // Preserve the measured 4.3s track for the 3.4s Plankton category.
  const factor=Math.max(1,duration/3400);
  ms=Math.round(4300*factor);
  steps=(stage.clientWidth<=650?mobile:desktop).map(row=>[row[0]*factor,...row.slice(1)]);
  started=performance.now();
  raf=requestAnimationFrame(paint);
 }
 window.addEventListener('deepdive:tier-plunge',e=>start(e.detail||{}));
 window.addEventListener('deepdive:tier-cleanup',stop);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
  else if(fish?.isConnected&&!raf){started=performance.now()-lastTime;raf=requestAnimationFrame(paint);}
 });
 // Mid-reveal page restores need a tracked mascot too.
 if(document.querySelector('.dd-game-screen.dd-reveal-screen'))
  start({duration:Number(document.querySelector('.dd-game-screen.dd-reveal-screen')?.style.getPropertyValue('--reveal-ms').replace('ms',''))||3400});
 window.DeepDiveFeedbackMascotMotion={start,stop,sample};
})();
