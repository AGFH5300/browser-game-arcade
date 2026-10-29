'use strict';
(function(){
const API='/api/deep-dive/party';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanCode=s=>String(s||'').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6);
const query=new URLSearchParams(location.search);
try{if(!query.get('party')&&parent!==window)query.set('party',new URLSearchParams(parent.location.search).get('party')||'')}catch{}
let code=cleanCode(query.get('party')),auth=null,room=null,root=null,timer=null,err='',rooms=[],busy=false,offset=0,name='Explorer',publicFlag=false,last='',sound=true;
try{name=sessionStorage.getItem('sidequest:party-name')||name}catch{}
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
 return room.members.map(p=>'<div class="pp-member"><div><b>'+esc(p.name)+'</b> <small>'+(p.id===room.hostId?'HOST':'')+'</small></div><strong>'+(room.phase==='lobby'?(p.ready?'READY':'WAITING'):'♥'.repeat(p.hearts)||'OUT')+'</strong><small>'+p.score+' pts</small></div>').join('');
}
function chat(){
 return '<div class="pp-chat">'+(room.messages.length?room.messages.map(m=>'<p><b>'+esc(m.name)+'</b> '+esc(m.text)+'</p>').join(''):'<p class="helper">No messages yet.</p>')+'</div>'+(canAct()?'<form id="pp-chat"><div class="answer-line"><input id="pp-message" class="answer-field" maxlength="180" placeholder="Message your crew"><button type="submit" class="btn small">Send</button></div></form>':'');
}
function home(){
 return '<section class="page"><div class="page-title"><span class="eyebrow">PUFFER PARTY · REAL MULTIPLAYER</span><h1>Pass the puffer.<br><em style="color:var(--aqua)">Stay afloat.</em></h1><p>Host a room or join friends. Take turns finding a rare answer before the puffer bursts. The last explorer with hearts wins.</p></div><div class="pp-layout"><div class="surface-card"><span class="tagline">YOUR EXPLORER</span><label class="answer-label" for="pp-name">Nickname</label><input id="pp-name" class="answer-field pp-wide" maxlength="24" value="'+esc(name)+'"><label class="pp-check"><input type="checkbox" id="pp-public" '+(publicFlag?'checked':'')+'> Show this room in public parties</label>'+btn('create','Host a party →','primary block')+'<div class="pp-divider">OR JOIN FRIENDS</div><label class="answer-label" for="pp-code">Invite code</label><div class="answer-line"><input id="pp-code" class="answer-field" maxlength="6" placeholder="ABC234" value="'+esc(code)+'">'+btn('join','Join room','primary')+'</div></div><div class="surface-card"><div class="band-heading"><h2>Public parties</h2>'+btn('refresh','↻ Refresh','small ghost')+'</div>'+(rooms.length?rooms.map(r=>'<div class="pp-member"><span>'+esc(r.host)+' · '+r.members+'/8 players</span><button type="button" class="btn small" data-party="pick" data-code="'+esc(r.code)+'">Join '+esc(r.code)+'</button></div>').join(''):'<p class="helper">No public rooms. Host one!</p>')+'<div class="pp-rules"><strong>Party rules</strong><p>2–8 players, three hearts each, 18 seconds per turn. A correct answer passes the puffer. No repeats within the question. Passing or timing out costs a heart. Every 120 rarity points earns a heart back, up to five. Last player afloat wins!</p></div></div></div></section>';
}
function lobby(){
 const host=room.hostId===auth?.id;
 return '<section class="page"><div class="page-title"><span class="eyebrow">YOUR PUFFER PARTY</span><h1>Get your crew <em style="color:var(--aqua)">ready.</em></h1><p>Invite up to eight players by sharing the code. Everyone plays from their own browser.</p></div><div class="pp-layout"><div class="surface-card"><span class="tagline">'+(room.publicRoom?'PUBLIC PARTY':'PRIVATE PARTY')+'</span><h2 class="pp-code">'+esc(room.code)+'</h2>'+btn('copy','Copy invite link','primary small')+'<div class="pp-members">'+people()+'</div>'+(canAct()?(host?'<button type="button" class="btn primary block" data-party="start" '+(room.members.length<2||room.members.some(m=>!m.ready)?'disabled':'')+'>Start party ('+room.members.length+' players)</button>':btn('ready',me()?.ready?'✓ Ready — change':'I am ready','primary block')):'<div class="notice">Join this room by entering your nickname.</div><div class="answer-line"><input id="pp-name" class="answer-field" maxlength="24" value="'+esc(name)+'">'+btn('join','Join','primary')+'</div>')+'<div class="pp-actions">'+btn('leave','Leave room','small ghost')+'</div></div><div class="surface-card"><span class="tagline">PARTY CHAT</span>'+chat()+'</div></div></section>';
}
function playing(){
 const turn=room.members.find(m=>m.id===room.turnId);
 return '<section class="page"><div class="pp-heading"><div><span class="eyebrow">PUFFER PARTY · ROUND '+(room.questionIndex+1)+'</span><h1 class="section-heading">'+esc(room.question?.prompt||'New question coming…')+'</h1><p class="helper">'+esc(room.question?.theme||'')+' · '+room.usedCount+' unique answers already played</p></div><div class="pp-count"><small>POPS IN</small><strong id="pp-clock">18</strong>s<div class="countdown-bar"><span id="pp-meter"></span></div></div></div><div class="pp-layout"><div class="question-card pp-round"><div class="pp-puffer" aria-hidden="true">🐡</div><span class="tagline">'+(myTurn()?'YOUR TURN':'PUFFER WITH '+esc(turn?.name||'THE CREW').toUpperCase())+'</span><p class="lead">'+(myTurn()?'Enter a correct answer not already used and pass before it bursts.':'Get your answer ready for when the puffer reaches you!')+'</p>'+(myTurn()?'<form id="pp-answer"><div class="answer-line"><input id="pp-answer-input" class="answer-field" maxlength="90" autocomplete="off" placeholder="Type your answer…"><button type="submit" class="btn primary">Pass it →</button></div></form>'+btn('pass','Pass and lose a heart','small ghost'):'<div class="notice">Waiting for '+esc(turn?.name||'the next player')+'.</div>')+'<div class="pp-feed">'+room.events.slice(-6).reverse().map(e=>'<p>'+esc(e.message)+'</p>').join('')+'</div></div><div><div class="surface-card"><span class="tagline">EXPLORERS</span>'+people()+'</div><div class="surface-card pp-chat-card"><span class="tagline">CREW CHAT</span>'+chat()+'<div class="pp-actions">'+btn('sound',sound?'Sound on':'Sound off','small ghost')+btn('leave','Leave room','small ghost')+'</div></div></div></div></section>';
}
function finished(){
 const winner=room.members.find(p=>p.id===room.winnerId)||room.members[0];
 return '<section class="page"><div class="home-hero"><div><span class="eyebrow">VOYAGE COMPLETE</span><h1 class="section-heading">'+esc(winner?.name||'The crew')+' <em>wins.</em></h1><p class="lead">The last one afloat is crowned the winner!</p>'+people()+'<div class="hero-actions">'+btn('leave','Return to rooms','primary')+'</div></div><div class="ocean-display"><div class="diver-mark">🐡</div><div class="ocean-caption"><span>LAST ONE FLOATING</span><strong>'+esc(winner?.name||'Winner')+'</strong></div></div></div></section>';
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
function onClick(e){
 const b=e.target.closest('[data-party]');if(!b)return;
 const a=b.dataset.party;
 if(a==='create'){name=document.getElementById('pp-name')?.value||name;publicFlag=Boolean(document.getElementById('pp-public')?.checked);sessionStorage.setItem('sidequest:party-name',name);act({type:'create',name,publicRoom:publicFlag})}
 if(a==='join'){
  name=document.getElementById('pp-name')?.value||name;code=cleanCode(document.getElementById('pp-code')?.value||code);
  if(code.length!==6){err='Enter a six-character room code.';render();return}
  sessionStorage.setItem('sidequest:party-name',name);act({type:'join',code,name});
 }
 if(a==='pick'){code=cleanCode(b.dataset.code);room=null;last='';restore();render();poll()}
 if(a==='ready')send('ready',{ready:!me()?.ready});
 if(a==='start')send('start');
 if(a==='pass')send('pass');
 if(a==='leave')leave();
 if(a==='refresh'){rooms=[];poll()}
 if(a==='sound'){sound=!sound;render()}
 if(a==='dismiss'){err='';render()}
 if(a==='copy'){navigator.clipboard?.writeText(location.origin+'/games/deep-dive?party='+code).then(()=>{err='Invite link copied!';render()}).catch(()=>{err='Share this code: '+code;render()})}
}
function onSubmit(e){
 if(e.target.id==='pp-answer'){e.preventDefault();send('answer',{answer:document.getElementById('pp-answer-input')?.value||''})}
 if(e.target.id==='pp-chat'){e.preventDefault();const text=document.getElementById('pp-message')?.value||'';if(text.trim())send('chat',{text})}
}
window.DeepDiveParty={
 preferred:()=>Boolean(code),
 mount({root:where}){
  if(root!==where){root=where;if(!root.dataset.partyWired){root.dataset.partyWired='1';root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit)}}
  render();poll();clearInterval(timer);timer=setInterval(()=>{clock();poll()},1500);
 },
 unmount(){clearInterval(timer);timer=null;root=null}
};
})();
