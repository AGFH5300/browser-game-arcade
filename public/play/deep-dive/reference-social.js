/* Independent Sidequest account, Friends, and rating client. No original account tokens or APIs. */
(() => {
 'use strict';
 const root=document.getElementById('app');if(!root)return;
 const API='/api/deep-dive/social';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const query=new URLSearchParams(location.search);
 try{if(!query.get('friend')&&parent!==window)query.set('friend',new URLSearchParams(parent.location.search).get('friend')||'')}catch{}
 let profile=null,friends=[],standings=null,rankings=[],view='friends',mounted=false,loginMode='login',loginExpanded=false,loading=false,error='',message='',initialFriend=String(query.get('friend')||'').slice(0,128),wired=false;
 // Profile getters stay live after login, not a snapshot taken during script evaluation.
 const request=async(action,body=null)=>{
  const url=API+(body?'':'?action='+encodeURIComponent(action));
  const response=await fetch(url,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify({action,...body}):undefined});
  const type=response.headers.get('content-type')||'';
  if(!type.includes('application/json'))throw Error('Sidequest account service is unavailable in this environment.');
  const data=await response.json();if(!response.ok)throw Error(data.error||'Account service is temporarily unavailable');return data;
 };
 const button=(act,txt,cls='')=>'<button type="button" class="ds-social-button '+cls+'" data-social="'+act+'">'+txt+'</button>';
 const warning=()=>error?'<div class="ds-social-notice" role="alert">'+esc(error)+'</div>':message?'<div class="ds-social-notice success" role="status">'+esc(message)+'</div>':'';
 const login=()=>{
   const friendsView=view==='friends';
   let device={};try{device=JSON.parse(localStorage.getItem('sidequest:deep-dive:player:v1')||'{}')}catch{}
   const pageTitle=friendsView?'Friends':'My Krillion';
   const eyebrow=friendsView?'BETTER WITH COMPANY':'YOUR DIVER’S LOGBOOK';
   const heading=friendsView?'Bring your friends along.':'Keep your dives together.';
   const detail=friendsView
     ?'Sign in to add friends and compare daily scores and answers. Your private leaderboard is just you and your friends.'
     :'Sign in to save your streaks, scores, and completed games. Free for every diver.';
   const form=loginExpanded?'<div class="ds-social-switch">'+button('loginMode','SIGN IN',loginMode==='login'?'selected':'')+button('registerMode','CREATE ACCOUNT',loginMode==='register'?'selected':'')+'</div>'+
      '<form id="ds-social-auth"><label>USERNAME<input name="username" autocomplete="username" minlength="3" maxlength="18" pattern="[A-Za-z0-9_]{3,18}" required placeholder="your_diver_name"></label>'+
      (loginMode==='register'?'<label>DISPLAY NAME<input name="displayName" autocomplete="nickname" maxlength="24" placeholder="Your diver name"></label>':'')+
      '<label>PASSWORD<input name="password" type="password" autocomplete="'+(loginMode==='register'?'new-password':'current-password')+'" minlength="10" maxlength="128" required></label>'+
      '<button type="submit" class="ds-social-button primary" '+(loading?'disabled':'')+'>'+(loginMode==='register'?'CREATE ACCOUNT':'SIGN IN')+'</button></form>'
      :button('expandLogin','CONTINUE WITH SIDEQUEST','primary ds-social-expand');
   return '<section class="ds-social-page ds-social-gate ds-social-source-gate ds-social-view-'+(friendsView?'friends':'account')+'"><header><span>KRILLION</span><small>'+eyebrow+'</small><h1>'+pageTitle+'</h1>'+
      (!friendsView?'<p>Your dives. One history. Every device.</p>':'')+'</header>'+
      '<div class="ds-social-card ds-social-identity"><h2>'+heading+'</h2><p>'+detail+'</p>'+form+
      '<p class="ds-social-disclaimer">'+(friendsView?'Sign in before inviting your friends.':'Sidequest accounts are independent of original Krillion. We keep your saved progress on your account, and do not require purchases.')+'</p></div>'+
      (!friendsView?'<div class="ds-social-card ds-social-friend-teaser"><h2>Dive with your friends.</h2><p>Invite friends and compare daily scores after you finish.</p>'+button('viewFriends','FRIENDS LEADERBOARD →','muted')+'</div>'+
      '<section class="ds-social-device"><h2>ON THIS DEVICE</h2><div><span>CURRENT STREAK <b>'+Number(device.streak||0)+'</b></span><span>BEST DIVE <b>'+Number(device.endlessBest||0)+'</b></span><span>COMPLETED DIVES <b>'+Number(device.runs||0)+'</b></span></div></section>':'')+
      warning()+'</section>';
 };
 const leaderboard=()=>'<div class="ds-social-card"><h2>FRIENDS DAILY BOARD</h2>'+
   (!standings?.complete?'<p>Complete today’s Daily Dive to unlock your friends’ scores without spoilers.</p>':
    standings.standings?.length?'<ol class="ds-social-standing">'+standings.standings.map((s,i)=>'<li><strong>'+(i+1)+'. '+esc(s.displayName)+'</strong><span>'+s.points+' PTS'+(s.me?' · YOU':'')+'</span></li>').join('')+'</ol>':'<p>No friends have finished today’s dive yet.</p>')+'</div>';
 const friendRows=()=>'<div class="ds-social-card"><h2>YOUR FRIENDS</h2>'+
  (!friends.length?'<p>No friends added yet. Invite someone with your link or their username.</p>':
  '<ul class="ds-social-friends">'+friends.map(f=>'<li><div><strong>'+esc(f.displayName)+'</strong><small>@'+esc(f.username)+' · '+esc(f.status.toUpperCase())+'</small></div>'+
  (f.status==='pending'&&!f.requestedByMe?button('accept:'+f.id,'ACCEPT'):'')+
  (f.status==='accepted'?'<small>RATING '+f.rating+'</small>':'')+
  button('remove:'+f.id,f.status==='pending'?'CANCEL':'REMOVE')+
  (!f.blockedByMe?button('block:'+f.id,'BLOCK','muted'):'')+'</li>').join('')+'</ul>')+'</div>';
 const rankingRows=()=>'<div class="ds-social-card"><h2>RATED PARTY RANKINGS</h2>'+
  (!rankings.length?'<p>No finished rated games have been recorded yet.</p>':
    '<ol class="ds-social-standing">'+rankings.map((a,i)=>'<li><strong>'+(i+1)+'. '+esc(a.display_name||a.username)+'</strong><span>'+a.rating+' ELO · '+a.rated_games+' GAMES</span></li>').join('')+'</ol>')+'</div>';
 const signedIn=()=>{
  const url=location.origin+'/games/deep-dive?friend='+encodeURIComponent(profile.inviteToken);
  return '<section class="ds-social-page"><header><span>KRILLION</span><small>'+ (view==='friends'?'BETTER WITH COMPANY':'MY KRILLION') +'</small><h1>'+(view==='friends'?'Friends':'My Krillion')+'</h1><p>Signed in as @'+esc(profile.username)+'</p></header>'+
   '<div class="ds-social-tabs">'+button('viewFriends','FRIENDS',view==='friends'?'selected':'')+button('viewAccount','MY KRILLION',view==='account'?'selected':'')+'</div>'+
   warning()+
   (view==='friends'?'<div class="ds-social-grid"><div><div class="ds-social-card"><h2>INVITE A FRIEND</h2><p>Only people you add can appear in your private Friends leaderboard.</p>'+
    '<label>YOUR INVITATION LINK<input readonly id="ds-social-invite" value="'+esc(url)+'"></label>'+button('copyInvite','COPY LINK')+' '+button('rotateInvite','REPLACE LINK','muted')+
    '<form id="ds-social-add"><label>FRIEND USERNAME OR INVITE CODE<input name="friend" maxlength="128" value="'+esc(initialFriend)+'" placeholder="username or invitation token"></label><button class="ds-social-button" type="submit">SEND FRIEND REQUEST</button></form></div>'+friendRows()+'</div><div>'+leaderboard()+rankingRows()+'</div></div>':
    '<div class="ds-social-grid"><div class="ds-social-card"><h2>YOUR DIVER</h2><p>DAILY STREAK <b>'+profile.dailyStreak+'</b> · RATING <b>'+profile.rating+'</b> · RATED GAMES <b>'+profile.ratedGames+'</b></p><h3>CHARACTER UNLOCKS</h3>'+
    '<ul class="ds-social-unlocks">'+[['KRILL',0],['SCHOOLER',5],['SQUID',14],['ANGLER',30],['EVIL',45]].map(([name,days])=>'<li>'+name+' <b>'+(profile.dailyStreak>=days?'UNLOCKED':days+'-DAY STREAK')+'</b></li>').join('')+'</ul>'+
    '<p>Streaks are based on daily results verified against the published daily answer data. Playing without signing in still works, but does not unlock account characters.</p></div>'+
    '<div class="ds-social-card"><h2>PRIVACY</h2><label class="ds-social-checkbox"><input id="ds-social-share" type="checkbox" '+(profile.shareAnswers?'checked':'')+'> SHARE MY DAILY ANSWERS WITH FRIENDS</label><p>Friends can see your score only after finishing their own Daily Dive. Your password and account history are never shared.</p>'+
    button('logout','SIGN OUT','muted')+'</div></div>')+'</section>';
 };
 const paint=()=>{if(!mounted||!root||!['account','friends'].includes(document.querySelector('.nav-pill.active')?.dataset.view))return;root.innerHTML=profile?signedIn():login()};
 const refresh=async()=>{
  try{const data=await request('me');profile=data.account||null;error='';if(profile){const [f,l,r]=await Promise.allSettled([request('friends'),request('leaderboard'),request('rankings')]);friends=f.status==='fulfilled'?f.value.friends:[];standings=l.status==='fulfilled'?l.value:null;rankings=r.status==='fulfilled'?r.value.rankings:[]}
  }catch(e){error=e.message||'Account service is unavailable'}finally{paint();document.dispatchEvent(new CustomEvent('deepdive:account-updated'))}
  return profile;
 };
 const post=async(action,fields)=>{
  loading=true;error='';message='';paint();
  try{const out=await request(action,fields);if(out.account)profile=out.account;else if(action==='logout')profile=null;
   message=action==='register'?'Account created. Welcome to Sidequest.':action==='login'?'Signed in.':action==='logout'?'Signed out.':'Updated successfully.';
   await refresh();
   if(action==='friendAdd')initialFriend='';
  }catch(e){error=e.message||'Something went wrong'}finally{loading=false;paint()}
 };
 const clicks=async e=>{
  const b=e.target.closest('[data-social]');if(!b)return;
  const action=b.dataset.social;
  if(action==='expandLogin'){loginExpanded=true;error='';paint();return}
  if(action==='loginMode'||action==='registerMode'){loginMode=action==='loginMode'?'login':'register';error='';paint();return}
  if(action==='viewFriends'||action==='viewAccount'){
   const destination=action==='viewFriends'?'friends':'account';
   document.querySelector('.nav-pill[data-view="'+destination+'"]')?.click();
   return;
  }
  if(action==='copyInvite'){const el=document.getElementById('ds-social-invite');try{await navigator.clipboard.writeText(el.value);message='Invite link copied'}catch{el.select();message='Select and copy the invitation link'}paint();return}
  if(action==='rotateInvite'){if(confirm('Replace your current invite link? Old links will no longer work.'))void post('rotateInvite',{});return}
  if(action==='logout'){void post('logout',{});return}
  for(const [prefix,command] of [['accept:','friendAccept'],['remove:','friendRemove'],['block:','friendBlock']]){
   if(action.startsWith(prefix)){if(command==='friendBlock'&&!confirm('Block this player?'))return;void post(command,{friendId:action.slice(prefix.length)});return}
  }
 };
 const submits=e=>{
  if(!['ds-social-auth','ds-social-add'].includes(e.target.id))return;e.preventDefault();
  const data=new FormData(e.target);
  if(e.target.id==='ds-social-auth')void post(loginMode,{username:data.get('username'),password:data.get('password'),displayName:data.get('displayName')});
  if(e.target.id==='ds-social-add'){const v=String(data.get('friend')||'').trim();void post('friendAdd',{username:v,inviteToken:v})}
 };
 root.addEventListener('click',clicks);root.addEventListener('submit',submits);
 root.addEventListener('change',e=>{if(e.target?.id==='ds-social-share')void post('privacy',{shareAnswers:e.target.checked})});
 const syncDaily=async result=>{
  if(!profile||result?.mode!=='daily'||result?.source!=='krillion-reveal')return;
  try{
   const out=await request('syncDaily',{date:result.day,results:result.results});
   if(out.account){profile=out.account;document.dispatchEvent(new CustomEvent('deepdive:account-updated'))}
  }catch(e){console.warn('Daily account sync unavailable',e?.message||e)}
 };
 const mount=({root:where,view:nextView})=>{
  if(where!==root)return;
  const resolvedView=nextView==='account'?'account':'friends';
  if(view!==resolvedView)loginExpanded=false;
  view=resolvedView;mounted=true;error='';message='';
  paint();void refresh();
 };
 window.DeepDiveSocial={get profile(){return profile},mount,refresh,syncDaily};
 void refresh();
})();
