/* Public-browser reference parity controls for the independent Deep Dive player.
   Original public UI: hamburger, sound, settings, logbook; per-letter title wobble;
   mascot interactions and local, explicitly user-controlled preferences. */
(() => {
 'use strict';
 const app=document.getElementById('app'); if(!app)return;
 const prefKey='sidequest:deep-dive:';
 const characters=[
  /* Wardrobe parity: the original's MASCOT_CHARACTERS unlock by daily streak
     (observed live: The Krill · Schooler 5-day · Rare Squid 14-day ·
     Deep Cut Angler 30-day · Evil Krill 45-day). */
  ['krillion','The Krill','krillion.png',0],
  ['schooler','Schooler','schooler.png',5],
  ['rare','Rare Squid','rare.png',14],
  ['deepcut','Deep Cut Angler','deepcut.png',30],
  ['evil-krill','Evil Krill','evil-krill-white-v2.png',45]
 ];
 const unlockedStreak=()=>{
  try{return Number(JSON.parse(localStorage.getItem('sidequest:deep-dive:player:v1')||'{}').streak||0)}catch{return 0}
 };
 const get=(key,def='')=>{try{return localStorage.getItem(prefKey+key)||def}catch{return def}};
 const put=(key,value)=>{try{localStorage.setItem(prefKey+key,value)}catch{}};
 const preferences={contrast:get('contrast')==='1',lowPower:get('low-power')==='1',clearRejected:get('clear-rejected')==='1',answerCorrections:get('answer-corrections')!=='0',character:get('character','krillion')};
 if(!characters.some(x=>x[0]===preferences.character))preferences.character='krillion';
 window.DeepDiveReference={
  titleMarkup(){return [...'KRILLION'].map((letter,i)=>'<span style="animation-delay:'+(i*.18).toFixed(2)+'s">'+letter+'</span>').join('')},
  preferences,
  get mascot(){return characters.find(x=>x[0]===preferences.character)||characters[0]}
 };
 function apply(){
   document.documentElement.classList.toggle('dd-colorblind',preferences.contrast);
   document.documentElement.classList.toggle('dd-low-power',preferences.lowPower);
   const name=window.DeepDiveReference.mascot[2];
   app.style.setProperty('--dd-mascot-image',"url('./reference-assets/tiers/"+name+"')");
 }
 function syncChecks(){
   app.querySelectorAll('[data-dd-setting]').forEach(el=>{
     if(el.type==='checkbox')el.checked=Boolean(preferences[el.dataset.ddSetting]);
   });
   const select=app.querySelector('[data-dd-character]');
   if(select){
     const streak=unlockedStreak();
     [...select.options].forEach(opt=>{
       const c=characters.find(x=>x[0]===opt.value);
       if(!c)return;
       const locked=streak<(c[3]||0);
       opt.disabled=locked;
       opt.textContent=c[1]+(locked?' — unlocks at a '+(c[3]||0)+'-day streak':'');
     });
     const current=characters.find(x=>x[0]===preferences.character);
     if(current&&unlockedStreak()<(current[3]||0)){preferences.character='krillion';put('character','krillion');apply()}
     select.value=preferences.character;
   }
 }
 function mount(){
   apply();
   const scene=app.querySelector('.deep-home');
   if(!scene)return;
   if(!scene.querySelector('.dd-reference-utility')){
     const tools=document.createElement('div');
     tools.className='dd-reference-utility';
     tools.innerHTML='<button type="button" data-dd-sound title="Toggle sound" aria-label="Mute sound" aria-pressed="true">◀♫</button>'+
      '<details class="dd-reference-preferences"><summary title="Settings" aria-label="Settings">⚙</summary>'+
      '<div class="dd-reference-settings-panel"><strong>GAME SETTINGS</strong>'+
      '<label><input type="checkbox" data-dd-setting="lowPower"> Low-power mode</label>'+
      '<label><input type="checkbox" data-dd-setting="contrast"> Colorblind mode</label>'+
      '<label><input type="checkbox" data-dd-setting="answerCorrections"> Answer corrections</label>'+
      '<label><input type="checkbox" data-dd-setting="clearRejected"> Clear rejected entries</label>'+
      '<label>Choose a dive buddy<select data-dd-character>'+
      characters.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('')+
      '</select></label></div></details>'+
      '<button type="button" data-dd-logbook title="Logbook" aria-label="Open logbook">▣</button>';
     scene.append(tools);
   }
   const mascot=scene.querySelector('.dd-game-fish');
   if(mascot){mascot.setAttribute('role','button');mascot.setAttribute('tabindex','0');mascot.setAttribute('aria-label','Tap your dive buddy');mascot.setAttribute('title','Tap your dive buddy')}
   const sound=app.querySelector('[data-dd-sound]');
   if(sound){const muted=window.DeepDiveSfx?.muted??false;sound.textContent=muted?'◀×':'◀♫';sound.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');sound.setAttribute('aria-pressed',String(!muted))}
   syncChecks();
   window.DeepDiveScene?.refresh?.();
 }
 app.addEventListener('change',e=>{
   const el=e.target.closest('[data-dd-setting], [data-dd-character]');if(!el)return;
   if(el.dataset.ddSetting){preferences[el.dataset.ddSetting]=el.checked;put(el.dataset.ddSetting,el.checked?'1':'0')}
   if(el.dataset.ddCharacter!==undefined){preferences.character=el.value;put('character',el.value);window.DeepDiveSfx?.event('category')}
   apply();
 });
 app.addEventListener('click',e=>{
   if(e.target.closest('[data-dd-logbook]')){
     app.closest('.app-shell')?.querySelector('.nav-pill[data-view="stats"]')?.click();
     return;
   }
   const buddy=e.target.closest('.dd-game-fish[role=button]');
   if(buddy){buddy.classList.remove('dd-mascot-poked');void buddy.offsetWidth;buddy.classList.add('dd-mascot-poked');window.DeepDiveSfx?.event('blub');}
 });
 app.addEventListener('keydown',e=>{
   if((e.key==='Enter'||e.key===' ')&&e.target.matches('.dd-game-fish[role=button]')){e.preventDefault();e.target.click()}
 });
 const observer=new MutationObserver(()=>queueMicrotask(mount));
 observer.observe(app,{childList:true});
 window.DeepDiveSfx?.subscribe(()=>mount());
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();