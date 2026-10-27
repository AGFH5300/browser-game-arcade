// Sidequest isolation adapter: no parent DOM access or persistent storage required.
window.arcadeStorage=(function(){var store={};return {getItem:function(k){return Object.prototype.hasOwnProperty.call(store,k)?store[k]:null},setItem:function(k,v){store[k]=String(v)},removeItem:function(k){delete store[k]},clear:function(){store={}}}})();
window.addEventListener('error',function(e){if(e.message)parent.postMessage({type:'sidequest:error',message:e.message},'*')});
window.addEventListener('load',function(){parent.postMessage({type:'sidequest:loaded'},'*')});
window.addEventListener('keydown',function(e){if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>=0 && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.preventDefault()});
