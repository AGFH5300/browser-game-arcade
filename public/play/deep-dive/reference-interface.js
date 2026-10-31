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
 const pixelIcon=(kind)=>{
  const wrap=(box,body)=>'<svg viewBox="'+box+'" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">'+body+'</svg>';
  if(kind==='sound')return wrap('0 0 20 16','<path d="M2 6h3l4-4v12l-4-4H2z"/><rect x="11" y="6" width="2" height="4"/><rect x="15" y="3" width="2" height="10"/>');
  if(kind==='silent')return wrap('0 0 20 16','<path d="M2 6h3l4-4v12l-4-4H2z"/><rect x="11" y="5" width="2" height="2"/><rect x="13" y="7" width="2" height="2"/><rect x="15" y="9" width="2" height="2"/><rect x="15" y="5" width="2" height="2"/><rect x="11" y="9" width="2" height="2"/>');
  if(kind==='settings')return wrap('0 0 20 20','<path fill-rule="evenodd" d="M6 4H14V6H16V14H14V16H6V14H4V6H6Z M8 1H12V4H8Z M8 16H12V19H8Z M1 8H4V12H1Z M16 8H19V12H16Z M3 3H6V6H3Z M14 3H17V6H14Z M3 14H6V17H3Z M14 14H17V17H14Z M8 8H12V12H8Z"/>');
  if(kind==='wardrobe')return wrap('0 0 20 20','<path fill-rule="evenodd" d="M4 3H8V5H4Z M12 3H16V5H12Z M2 5H18V9H2Z M5 9H15V17H5Z M9 5H11V7H9Z"/>');
  return wrap('0 0 20 20','<path d="M6 2h2v2h4V2h2v2h2v2h2v4h-4v8H6v-8H2V6h2V4h2z"/>');
 };
 const unlockedStreak=()=>{
  return Math.max(0,Number(window.DeepDiveSocial?.profile?.dailyStreak)||0)
 };
 const get=(key,def='')=>{try{return localStorage.getItem(prefKey+key)||def}catch{return def}};
 const put=(key,value)=>{try{localStorage.setItem(prefKey+key,value)}catch{}};
 // Legacy builds wrote camelCase while reading kebab-case. Migrate those values before mounting.
 const preferenceKeys={lowPower:'low-power',contrast:'contrast',clearRejected:'clear-rejected',answerCorrections:'answer-corrections'};
 const saved=(camel,fallback)=>{const key=preferenceKeys[camel];const canonical=get(key,'');
   return canonical!==''?canonical:get(camel,fallback);
 };
 const preferences={contrast:saved('contrast','0')==='1',lowPower:saved('lowPower','0')==='1',clearRejected:saved('clearRejected','0')==='1',answerCorrections:saved('answerCorrections','1')!=='0',character:get('character','krillion')};
 if(!characters.some(x=>x[0]===preferences.character))preferences.character='krillion';
 const settingRows=[
  ['lowPower','Low-power mode','Lighter graphics and fewer background animations.'],
  ['contrast','Colorblind mode','Brighter text and more separated tier colors.'],
  ['answerCorrections','Answer corrections','Preview corrected answers before scoring. Off accepts them immediately.'],
  ['clearRejected','Clear rejected entries','Empty the answer box after a failed attempt.'],
  ['shareLink','Share link','Add a Sidequest link under shared results.']
 ];
 preferences.shareLink=get('share-link','0')==='1';
 const settingsFields=()=>'<div class="dd-source-preference-list">'+
   settingRows.map(([name,label,description])=>'<label class="dd-source-preference">'+
     '<span class="dd-source-preference-copy"><strong>'+label+'</strong><small>'+description+'</small></span>'+
     '<span class="dd-source-switch"><input type="checkbox" data-dd-setting="'+name+'" aria-label="'+label+'"><span aria-hidden="true"></span></span></label>').join('')+
   '</div><section class="dd-source-settings-account"><p>ACCOUNT</p>'+
   '<button type="button" class="dd-source-settings-account-link" data-dd-my-account>MY KRILLION →</button>'+
   '<div class="dd-source-settings-restore"><span>Keep your progress across devices with a Sidequest account.</span>'+
   '<button type="button" data-dd-my-account>SIGN IN</button></div>'+
   '<div class="dd-source-settings-links"><span>PRIVACY</span><span>FAQ</span></div></section>';
 const wardrobeFields=()=>'<div class="dd-source-wardrobe-grid" role="group" aria-label="Dive buddy">'+
   characters.map(([id,label,image,unlock])=>{
     const locked=unlock>unlockedStreak();
     const chosen=preferences.character===id&&!locked;
     return '<button class="dd-source-wardrobe-key'+(chosen?' selected':'')+(locked?' locked':'')+'" type="button" data-dd-choose-character="'+id+'" aria-pressed="'+chosen+'" '+(locked?'disabled aria-label="'+label+' — unlocks at a '+unlock+'-day streak"':'')+'>'+
       '<img src="./reference-assets/tiers/'+(id==='krillion'?'krillion-halloween-2026.png':image)+'" alt="" loading="lazy">'+
       '<strong>'+label+'</strong>'+(unlock?'<small>'+unlock+'-day streak</small>':'')+'</button>';
   }).join('')+'</div>';
 const closeGlobalSettings=()=>{
   const overlay=document.getElementById('dd-global-settings');
   if(overlay){const was=overlay.dataset.ddKind;overlay.remove();app.querySelector(was==='wardrobe'?'[data-dd-open-wardrobe]':'[data-dd-open-settings]')?.focus({preventScroll:true})}
 };
 function openDialog(kind){
   if(document.getElementById('dd-global-settings'))closeGlobalSettings();
   const overlay=document.createElement('div');
   overlay.id='dd-global-settings';overlay.className='dd-global-settings dd-source-dialog-overlay';
   overlay.dataset.ddKind=kind;
   overlay.innerHTML='<div class="dd-global-settings-scrim" data-dd-close-settings></div>'+
     '<section class="dd-global-settings-dialog dd-source-dialog" role="dialog" aria-modal="true" aria-label="'+(kind==='wardrobe'?'Wardrobe':'Settings')+'" tabindex="-1">'+
     '<button type="button" class="dd-source-close" data-dd-close-settings aria-label="Close '+(kind==='wardrobe'?'wardrobe':'settings')+'">×</button>'+
     (kind==='wardrobe'?wardrobeFields():settingsFields())+'</section>';
   document.body.append(overlay);
   syncChecks();
   overlay.querySelector('[role=dialog]')?.focus({preventScroll:true});
 }
 function openSettings(){openDialog('settings')}
 function openWardrobe(){openDialog('wardrobe')}
 window.DeepDiveReference={
  titleMarkup(){return [...'KRILLION'].map((letter,i)=>'<span style="animation-delay:'+(i*.18).toFixed(2)+'s">'+letter+'</span>').join('')},
  preferences,
  get mascot(){return characters.find(x=>x[0]===preferences.character)||characters[0]},
  openSettings,
  openWardrobe
 };
 function apply(){
   document.documentElement.classList.toggle('dd-colorblind',preferences.contrast);
   document.documentElement.classList.toggle('dd-low-power',preferences.lowPower);
   const name=window.DeepDiveReference.mascot[2];
   app.style.setProperty('--dd-mascot-image',"url('./reference-assets/tiers/"+name+"')");
   const homeMascot=app.querySelector('.dd-home-mascot');
   if(homeMascot)homeMascot.src='./reference-assets/tiers/'+(preferences.character==='krillion'?'krillion-halloween-2026.png':name);
 }
 function syncChecks(){
   document.querySelectorAll('[data-dd-setting]').forEach(el=>{
     if(el.type==='checkbox')el.checked=Boolean(preferences[el.dataset.ddSetting]);
   });
   const select=document.querySelector('[data-dd-character]');
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
     tools.innerHTML='<button type="button" data-dd-sound title="Toggle sound" aria-label="Mute sound" aria-pressed="true">'+pixelIcon('sound')+'</button>'+
       '<button type="button" class="dd-source-settings-trigger" data-dd-open-settings aria-label="Open settings" title="Settings">'+pixelIcon('settings')+'</button>'+
       '<button type="button" class="dd-source-wardrobe-trigger" data-dd-open-wardrobe aria-label="Open wardrobe" title="Wardrobe">'+pixelIcon('wardrobe')+'</button>';
     scene.append(tools);
   }
   const mascot=scene.querySelector('.dd-game-fish');
   if(mascot){mascot.setAttribute('role','button');mascot.setAttribute('tabindex','0');mascot.setAttribute('aria-label','Tap your dive buddy');mascot.setAttribute('title','Tap your dive buddy')}
   const sound=app.querySelector('[data-dd-sound]');
   if(sound){const muted=window.DeepDiveSfx?.muted??false;sound.innerHTML=pixelIcon(muted?'silent':'sound');sound.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');sound.setAttribute('aria-pressed',String(!muted))}
   syncChecks();
   window.DeepDiveScene?.refresh?.();
 }
 document.addEventListener('change',e=>{
   const el=e.target.closest('[data-dd-setting], [data-dd-character]');if(!el)return;
   if(el.dataset.ddSetting){preferences[el.dataset.ddSetting]=el.checked;put(preferenceKeys[el.dataset.ddSetting]|| (el.dataset.ddSetting==='shareLink'?'share-link':el.dataset.ddSetting),el.checked?'1':'0')}
   if(el.dataset.ddCharacter!==undefined){preferences.character=el.value;put('character',el.value);window.DeepDiveSfx?.event('category')}
   apply();
 });
 app.addEventListener('click',e=>{
   if(e.target.closest('[data-dd-open-settings]')){openSettings();return}
   if(e.target.closest('[data-dd-open-wardrobe]')){openWardrobe();return}
   if(e.target.closest('[data-dd-logbook]')){
     app.closest('.app-shell')?.querySelector('.nav-pill[data-view="stats"]')?.click();
     return;
   }
   const buddy=e.target.closest('.dd-game-fish[role=button]');
   if(buddy){buddy.classList.remove('dd-mascot-poked');void buddy.offsetWidth;buddy.classList.add('dd-mascot-poked');window.DeepDiveSfx?.event('blub');}
 });
 document.addEventListener('click',e=>{
   if(e.target.closest('#dd-global-settings [data-dd-close-settings]')){closeGlobalSettings();return}
   const option=e.target.closest('[data-dd-choose-character]');
   if(option&&!option.disabled&&unlockedStreak()>=(characters.find(c=>c[0]===option.dataset.ddChooseCharacter)?.[3]||0)){
     preferences.character=option.dataset.ddChooseCharacter;
     put('character',preferences.character);apply();
     window.DeepDiveSfx?.event('category');
     closeGlobalSettings();return;
   }
   if(e.target.closest('[data-dd-my-account]')){
     closeGlobalSettings();document.querySelector('.nav-pill[data-view="account"]')?.click();return;
   }
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('dd-global-settings')){e.preventDefault();closeGlobalSettings()}});
 app.addEventListener('keydown',e=>{
   if((e.key==='Enter'||e.key===' ')&&e.target.matches('.dd-game-fish[role=button]')){e.preventDefault();e.target.click()}
 });
 const observer=new MutationObserver(()=>queueMicrotask(mount));
 observer.observe(app,{childList:true});
 window.DeepDiveSfx?.subscribe(()=>mount());
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();