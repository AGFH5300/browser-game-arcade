'use strict';
(function(){
const API='/api/deep-dive/party';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanCode=s=>String(s||'').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6);
const query=new URLSearchParams(location.search);
try{if(!query.get('party')&&parent!==window)query.set('party',new URLSearchParams(parent.location.search).get('party')||'')}catch{}
let code=cleanCode(query.get('party')),auth=null,room=null,root=null,timer=null,err='',rooms=[],busy=false,offset=0,name='Explorer',publicFlag=false,last='',sound=true,selectedAvatar='krill',selectedCapacity=6;
const AVATARS=[['krill','KRILL',0,'/tiers/krillion.png'],['schooler','SCHOOLER',5,'/tiers/schooler.png'],['squid','SQUID',14,'/tiers/rare.png'],['angler','ANGLER',30,'/tiers/deepcut.png'],['evil','EVIL',45,'/tiers/evil-krill-white-v2.png']];
const ASSET='./reference-assets';
function avatarUrl(id){return ASSET+(AVATARS.find(a=>a[0]===id)||AVATARS[0])[3]}
function streak(){try{return Math.max(0,Number(JSON.parse(localStorage.getItem('sidequest:deep-dive:player:v1')||'{}').streak)||0)}catch{return 0}}
function choices(){const days=streak();return AVATARS.map(([id,label,needed])=>'<button type="button" class="pp-avatar-option '+(id===selectedAvatar?'active':'')+'" data-party="avatar" data-avatar="'+id+'" '+(needed>0?'disabled title="Verified accounts are required for this character"':'')+' aria-pressed="'+(id===selectedAvatar)+'"><img src="'+avatarUrl(id)+'" alt="" loading="lazy"><span>'+label+'</span>'+(needed>days?'<small>'+needed+'-day</small>':'<small>READY</small>')+'</button>').join('')}
function heading(subtitle){return '<header class="pp-scene-header"><button type="button" class="pp-sound-toggle" data-party="sound" title="Toggle game sounds">SOUND</button><h1 class="pp-scene-brand">KRILLION</h1><p class="pp-scene-name">PUFFER PARTY</p><p class="pp-scene-tagline">pass the puffer · don\'t let it pop on you</p><p class="pp-scene-desc">'+subtitle+'</p></header>'}
function rememberIdentity(){name=(document.getElementById('pp-name')?.value||name).trim().slice(0,24);try{sessionStorage.setItem('sidequest:party-name',name)}catch{}}
try{name=sessionStorage.getItem('sidequest:party-name')||name;const a=sessionStorage.getItem('sidequest:party-avatar');if(a==='krill')selectedAvatar=a;const cap=Number(sessionStorage.getItem('sidequest:party-capacity'));if([2,3,6,8].includes(cap))selectedCapacity=cap}catch{}
function restore(){try{auth=JSON.parse(sessionStorage.getItem('sidequest:party-auth:'+code)||'null')}catch{auth=null}}
if(code)restore();
const me=()=>room?.members.find(m=>m.id===auth?.id);
const myTurn=()=>room?.phase==='playing'&&room.turnId===auth?.id;
const canAct=()=>Boolean(auth?.id&&auth?.secret);
async function request(body,path=''){
 const r=await fetch(API+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});
 const data=await r.json();if(!r.ok)throw Error(data.error||'Game server error');return data;
}
const btn=(action,label,kind='')=>'<button type="button" class="btn '+kind+'" data-party="'+action+'">'+label+'</button>';
function people(){
 return room.members.map(p=>'<div class="pp-member"><img class="pp-avatar-mini" src="'+avatarUrl(p.avatar)+'" alt=""><div><b>'+esc(p.name)+'</b> <small>'+(p.id===room.hostId?'HOST':'')+'</small></div><strong>'+(room.phase==='lobby'?(p.ready?'READY':'WAITING'):'♥'.repeat(p.hearts)||'OUT')+'</strong><small>'+p.score+' pts</small></div>').join('');
}
function chat(){
 return '<div class="pp-chat">'+(room.messages.length?room.messages.map(m=>'<p><b>'+esc(m.name)+'</b> '+esc(m.text)+'</p>').join(''):'<p class="helper">No messages yet.</p>')+'</div>'+(canAct()?'<form id="pp-chat"><div class="answer-line"><input id="pp-message" class="answer-field" maxlength="180" placeholder="Message your crew"><button type="submit" class="btn small">Send</button></div></form>':'');
}
function home(){
 return `<section class="pp-arena">
  ${heading('Krillion’s multiplayer category game. Name a valid answer and pass the puffer before it pops. Play with friends or join a public room. Last one floating wins.')}
  <div class="pp-ocean-foyer">
   <div class="pp-foyer-left">
    <div class="pp-panel pp-identity-panel"><div class="pp-panel-title">WHO'S PLAYING <details><summary>HOW TO PLAY</summary><p>Each player starts with three hearts. Name an unused correct answer within 18 seconds to pass the puffer. Lose a heart if you pass or run out of time. Earn a bonus heart every 120 rarity points, up to five. Last one afloat wins.</p></details></div>
     <label for="pp-name" class="pp-panel-label">YOUR NAME</label><input id="pp-name" class="answer-field pp-wide" autocomplete="nickname" maxlength="24" placeholder="what the reef calls you" value="${esc(name)}">
     <div class="pp-avatar-grid" aria-label="Character selection">${choices()}</div><p class="pp-avatar-help">Only the Krill is available in anonymous rooms. Other characters require verified streaks (account sync is not available yet).</p>
    </div>
    <div class="pp-panel pp-play-panel"><div class="pp-panel-title">PLAY NOW <span>2–16 PLAYERS</span></div>
     <div class="pp-capacity-grid" role="group" aria-label="Preferred room size">${[[2,'1V1'],[3,'3S'],[6,'4–6'],[8,'8 PLAYERS']].map(([cap,label])=>`<button type="button" class="pp-capacity ${selectedCapacity===cap?'selected':''}" data-party="capacity" data-capacity="${cap}" aria-pressed="${selectedCapacity===cap}">${label}</button>`).join('')}</div>
     <div class="pp-play-buttons"><button type="button" class="pp-game-button pp-rated-unavailable" disabled aria-disabled="true" title="Ranked matchmaking is not yet available">▶ RATED ◀</button><button type="button" class="pp-game-button" data-party="quickplay">QUICK PLAY</button></div>
     <p class="pp-caption">RATED MATCHMAKING UNAVAILABLE · QUICK PLAY IS UNRATED</p>
    </div>
    <div class="pp-panel pp-host-panel"><div class="pp-panel-title">HOST</div>
     <button type="button" class="pp-game-button pp-host-btn" data-party="create">▼ HOST A ROOM ▼</button>
     <label class="pp-check"><input type="checkbox" id="pp-public" ${publicFlag?'checked':''}> PUBLIC · LISTED — anyone can join</label>
    </div>
    <div class="pp-panel pp-join-panel"><div class="pp-panel-title">JOIN BY CODE</div>
     <div class="pp-join-form"><input id="pp-code" class="answer-field" maxlength="6" placeholder="ROOM CODE" value="${esc(code)}" aria-label="Invite code"><button type="button" class="pp-game-button" data-party="join">JOIN ▸</button></div>
    </div>
   </div>
   <div class="pp-foyer-center"><img class="pp-hero-fish" src="${ASSET}/gen/party/puffer-sleep.png" alt="Sleeping pufferfish"><div class="pp-fish-shadow" aria-hidden="true"></div><div class="pp-reef-bubbles" aria-hidden="true">◦<br>°<br>◦</div></div>
   <aside class="pp-panel pp-public-panel"><div class="pp-panel-title">PUBLIC ROOMS <span>SHOWING ${rooms.length} <button type="button" class="pp-refresh" data-party="refresh" aria-label="Refresh public rooms">↻</button></span></div>
    <div class="pp-public-list">${rooms.length?rooms.map(r=>`<div class="pp-public-room"><strong>${esc(r.code)}</strong><div><b>${esc(r.host)}</b><small>${r.members}/${r.maxMembers||8} · IN THE LOBBY</small></div><button type="button" data-party="pick" data-code="${esc(r.code)}" ${r.members>=(r.maxMembers||8)?'disabled title="Room full"':''}>${r.members>=(r.maxMembers||8)?'FULL':'JOIN ▸'}</button></div>`).join(''):'<div class="pp-empty-rooms">No public rooms are waiting. Host one or use quick play to start a new table.</div>'}</div>
   </aside>
  </div></section>`;
}
function lobby(){
 const host=room.hostId===auth?.id;
  return '<section class="page pp-active-scene"><div class="page-title"><span class="eyebrow">YOUR PUFFER PARTY</span><h1>Get your crew <em style="color:var(--aqua)">ready.</em></h1><p>Invite up to '+(room.maxMembers||16)+' players by sharing the code. Everyone plays from their own browser.</p></div><div class="pp-layout"><div class="surface-card"><span class="tagline">'+(room.publicRoom?'PUBLIC PARTY':'PRIVATE PARTY')+'</span><h2 class="pp-code">'+esc(room.code)+'</h2>'+btn('copy','Copy invite link','primary small')+'<div class="pp-members">'+people()+'</div>'+(canAct()?(host?'<button type="button" class="btn primary block" data-party="start" '+(room.members.length<(room.minMembers||2)||room.members.some(m=>!m.ready)?'disabled':'')+'>Start party ('+room.members.length+' players)</button>':btn('ready',me()?.ready?'✓ Ready — change':'I am ready','primary block')):'<div class="notice">Join this room by entering your nickname.</div><div class="answer-line"><input id="pp-name" class="answer-field" maxlength="24" value="'+esc(name)+'">'+btn('join','Join','primary')+'</div>')+'<div class="pp-actions">'+btn('leave','Leave room','small ghost')+'</div></div><div class="surface-card"><span class="tagline">PARTY CHAT</span>'+chat()+'</div></div></section>';
}
function playing(){
 const turn=room.members.find(m=>m.id===room.turnId);
  return '<section class="page pp-active-scene"><div class="pp-heading"><div><span class="eyebrow">PUFFER PARTY · ROUND '+(room.questionIndex+1)+'</span><h1 class="section-heading">'+esc(room.question?.prompt||'New question coming…')+'</h1><p class="helper">'+esc(room.question?.theme||'')+' · '+room.usedCount+' unique answers already played</p></div><div class="pp-count"><small>POPS IN</small><strong id="pp-clock">18</strong>s<div class="countdown-bar"><span id="pp-meter"></span></div></div></div><div class="pp-layout"><div class="question-card pp-round"><div class="pp-puffer" aria-hidden="true">🐡</div><span class="tagline">'+(myTurn()?'YOUR TURN':'PUFFER WITH '+esc(turn?.name||'THE CREW').toUpperCase())+'</span><p class="lead">'+(myTurn()?'Enter a correct answer not already used and pass before it bursts.':'Get your answer ready for when the puffer reaches you!')+'</p>'+(myTurn()?'<form id="pp-answer"><div class="answer-line"><input id="pp-answer-input" class="answer-field" maxlength="90" autocomplete="off" placeholder="Type your answer…"><button type="submit" class="btn primary">Pass it →</button></div></form>'+btn('pass','Pass and lose a heart','small ghost'):'<div class="notice">Waiting for '+esc(turn?.name||'the next player')+'.</div>')+'<div class="pp-feed">'+room.events.slice(-6).reverse().map(e=>'<p>'+esc(e.message)+'</p>').join('')+'</div></div><div><div class="surface-card"><span class="tagline">EXPLORERS</span>'+people()+'</div><div class="surface-card pp-chat-card"><span class="tagline">CREW CHAT</span>'+chat()+'<div class="pp-actions">'+btn('sound',sound?'Sound on':'Sound off','small ghost')+btn('leave','Leave room','small ghost')+'</div></div></div></div></section>';
}
function finished(){
 const winner=room.members.find(p=>p.id===room.winnerId)||room.members[0];
  return '<section class="page pp-active-scene"><div class="home-hero"><div><span class="eyebrow">VOYAGE COMPLETE</span><h1 class="section-heading">'+esc(winner?.name||'The crew')+' <em>wins.</em></h1><p class="lead">The last one afloat is crowned the winner!</p>'+people()+'<div class="hero-actions">'+btn('leave','Return to rooms','primary')+'</div></div><div class="ocean-display"><div class="diver-mark">🐡</div><div class="ocean-caption"><span>LAST ONE FLOATING</span><strong>'+esc(winner?.name||'Winner')+'</strong></div></div></div></section>';
}
function clock(){
 const el=document.getElementById('pp-clock');if(!el||!room?.deadline)return;
 const t=Math.max(0,Math.ceil((room.deadline-Date.now()-offset)/1000));
 el.textContent=String(t);el.classList.toggle('danger',t<=5);
 const meter=document.getElementById('pp-meter');if(meter)meter.style.width=Math.min(100,t/18*100)+'%';
}
function render(){
 if(!root)return;
 const saved={};
 for(const id of ['pp-answer-input','pp-message','pp-name','pp-code']){const i=document.getElementById(id);if(i)saved[id]=i.value}
 root.innerHTML='<div class="pp-view">'+(err?'<div class="notice pp-error" role="alert">'+esc(err)+' '+btn('dismiss','Dismiss','small ghost')+'</div>':'')+(room?(room.phase==='playing'?playing():room.phase==='finished'?finished():lobby()):home())+'</div>';
 for(const [id,val] of Object.entries(saved)){const el=document.getElementById(id);if(el)el.value=val}
 clock();
}
function settle(data){
 const old=room;room=data.room;code=room.code;offset=Number(room.serverNow||Date.now())-Date.now();
 if(sound&&old&&old.turnId!==room.turnId&&room.turnId===auth?.id){try{const A=window.AudioContext||window.webkitAudioContext;const a=new A(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=490;o.start();o.stop(a.currentTime+.05);setTimeout(()=>a.close().catch(()=>{}),200)}catch{}}
 const sig=JSON.stringify([room.phase,room.questionIndex,room.turnId,room.deadline,room.members,room.messages.length,room.events.length]);
 if(last!==sig){last=sig;render()}clock();
}
async function poll(){
 if(!root||busy)return;
 try{if(code){const data=await request(null,'?code='+code);settle(data)}else{const data=await request(null,'?list=1');if(JSON.stringify(rooms)!==JSON.stringify(data.rooms)){rooms=data.rooms;render()}}}catch(e){if(!room){err=String(e.message||e);render()}}
}
async function act(body){
 if(busy)return;busy=true;err='';
 try{
  const data=await request(body);if(data.room)settle(data);
  if(data.playerId&&data.secret){auth={id:data.playerId,secret:data.secret};sessionStorage.setItem('sidequest:party-auth:'+data.room.code,JSON.stringify(auth))}
  render();
 }catch(e){err=String(e.message||e);render()}
 finally{busy=false}
}
function send(type,extra={}){
 if(!canAct()){err='Join the room first.';render();return}
 act({type,code,playerId:auth.id,secret:auth.secret,...extra});
}
async function leave(){
 if(canAct()&&room?.phase!=='finished')request({type:'leave',code,playerId:auth.id,secret:auth.secret}).catch(()=>{});
 try{sessionStorage.removeItem('sidequest:party-auth:'+code)}catch{}
 code='';room=null;auth=null;last='';rooms=[];err='';render();poll();
}
async function quickPlay(){
 if(busy)return;rememberIdentity();busy=true;err='';let selection=null;
 try{const data=await request(null,'?list=1');selection=(data.rooms||[]).find(r=>r.maxMembers===selectedCapacity&&r.members<r.maxMembers);}
 catch(e){err=String(e.message||e);render();busy=false;return}
 busy=false;code=selection?.code||'';if(selection){auth=null;room=null;last='';act({type:'join',code,name,avatar:selectedAvatar})}
 else act({type:'create',name,publicRoom:true,maxMembers:selectedCapacity,avatar:selectedAvatar});
}
function onClick(e){
 const b=e.target.closest('[data-party]');if(!b)return;
 const a=b.dataset.party;
 if(a==='avatar'){const next=b.dataset.avatar,locked=AVATARS.find(x=>x[0]===next);if(locked&&locked[2]===0){rememberIdentity();selectedAvatar=next;sessionStorage.setItem('sidequest:party-avatar',next);render()}}
 if(a==='capacity'){const n=Number(b.dataset.capacity);if([2,3,6,8].includes(n)){rememberIdentity();publicFlag=Boolean(document.getElementById('pp-public')?.checked);selectedCapacity=n;sessionStorage.setItem('sidequest:party-capacity',String(n));render()}}
 if(a==='quickplay')quickPlay();
 if(a==='create'||a==='createPublic'){rememberIdentity();publicFlag=a==='createPublic'||Boolean(document.getElementById('pp-public')?.checked);act({type:'create',name,publicRoom:publicFlag,maxMembers:selectedCapacity,avatar:selectedAvatar})}
 if(a==='join'){
  rememberIdentity();code=cleanCode(document.getElementById('pp-code')?.value||code);
  if(code.length!==6){err='Enter a six-character room code.';render();return}
  act({type:'join',code,name,avatar:selectedAvatar});
 }
 if(a==='pick'){rememberIdentity();code=cleanCode(b.dataset.code);room=null;last='';auth=null;act({type:'join',code,name,avatar:selectedAvatar})}
 if(a==='ready')send('ready',{ready:!me()?.ready});
 if(a==='start')send('start');
 if(a==='pass')send('pass');
 if(a==='leave')leave();
 if(a==='refresh'){rooms=[];poll()}
 if(a==='sound'){sound=!sound;render()}
 if(a==='dismiss'){err='';render()}
 if(a==='copy'){navigator.clipboard?.writeText(location.origin+'/games/deep-dive?party='+code).then(()=>{err='Invite link copied!';render()}).catch(()=>{err='Share this code: '+code;render()})}
}
function onChange(e){
 if(e.target?.id==='pp-public'){publicFlag=Boolean(e.target.checked)}
}
function onSubmit(e){
 if(e.target.id==='pp-answer'){e.preventDefault();send('answer',{answer:document.getElementById('pp-answer-input')?.value||''})}
 if(e.target.id==='pp-chat'){e.preventDefault();const text=document.getElementById('pp-message')?.value||'';if(text.trim())send('chat',{text})}
}
window.DeepDiveParty={
 preferred:()=>Boolean(code),
 mount({root:where}){
  if(root!==where){root=where;if(!root.dataset.partyWired){root.dataset.partyWired='1';root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);root.addEventListener('change',onChange)}}
  render();poll();clearInterval(timer);timer=setInterval(()=>{clock();poll()},1500);
 },
 unmount(){clearInterval(timer);timer=null;root=null}
};
})();
