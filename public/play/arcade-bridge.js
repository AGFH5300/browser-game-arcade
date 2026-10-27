// Sidequest isolation adapter: no parent DOM access or persistent storage required.
window.arcadeStorage=(function(){var store={};return {getItem:function(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null},setItem:function(k,v){store[k]=String(v)},removeItem:function(k){delete store[k]},clear:function(){store={}}}})();
window.addEventListener('error',function(e){if(e.message)parent.postMessage({type:'sidequest:error',message:e.message},'*')});
window.addEventListener('load',function(){parent.postMessage({type:'sidequest:loaded'},'*')});
window.addEventListener('keydown',function(e){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>=0 && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.preventDefault()});

// Use the upstream puzzle resize API after its canvas is initialized.
(function(){var fitted=false;function fit(){var canvas=document.getElementById('puzzlecanvas');if(!canvas||!canvas.width||typeof Module==='undefined'||!Module.cwrap||typeof runtimeInitialized==='undefined'||!runtimeInitialized)return;try{var dpr=window.devicePixelRatio||1;Module.cwrap('resize_puzzle','void',['number','number'])(Math.max(160,Math.min(innerWidth-28,600))*dpr,Math.max(160,Math.min(innerHeight-115,600))*dpr);fitted=true}catch(e){}}window.addEventListener('load',function(){var canvas=document.getElementById('puzzlecanvas');if(!canvas)return;var obs=new MutationObserver(function(){if(!fitted){fit();if(fitted)obs.disconnect()}});obs.observe(canvas,{attributes:true});fit();});window.addEventListener('resize',function(){if(document.getElementById('puzzlecanvas'))fit()});})();

setTimeout(function(){var puzzle=document.getElementById('puzzle');if(puzzle&&puzzle.style.display==='none')parent.postMessage({type:'sidequest:error',message:'Puzzle initialization timed out'},'*')},12000);


// Game-local sound bridge. The portal cannot and does not control other browser tabs
// or third-party cross-origin game players. This code runs only inside hosted games.
(function(){
  var muted=false, media=new Set(), contexts=new Set();
  function report(type){try{parent.postMessage({type:type,muted:muted},'*')}catch(e){}}
  function setMute(value){
    muted=!!value;
    document.querySelectorAll('audio,video').forEach(function(el){media.add(el)});
    media.forEach(function(el){try{el.muted=muted}catch(e){}});
    contexts.forEach(function(ctx){
      try{var action=muted?'suspend':'resume';var result=ctx[action]();if(result&&result.catch)result.catch(function(){})}catch(e){}
    });
    report('sidequest:audio-state');
  }
  try{
    var originalPlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
      media.add(this);
      if(muted)this.muted=true;
      return originalPlay.apply(this,arguments);
    };
  }catch(e){}
  try{
    var NativeContext=window.AudioContext||window.webkitAudioContext;
    if(NativeContext){
      var WrappedContext=function(){
        var ctx=Reflect.construct(NativeContext,Array.prototype.slice.call(arguments));
        contexts.add(ctx);
        if(muted)ctx.suspend().catch(function(){});
        return ctx;
      };
      Object.setPrototypeOf(WrappedContext,NativeContext);
      WrappedContext.prototype=NativeContext.prototype;
      if(window.AudioContext)window.AudioContext=WrappedContext;
      if(window.webkitAudioContext)window.webkitAudioContext=WrappedContext;
    }
  }catch(e){}
  window.addEventListener('message',function(event){
    if(event.source!==parent||!event.data||event.data.type!=='sidequest:audio-set')return;
    setMute(event.data.muted);
  });
  window.addEventListener('load',function(){report('sidequest:audio-ready')});
})();
