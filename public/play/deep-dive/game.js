'use strict';
(function launchDeepDive(){
  const root=document.getElementById('app');
  const pearlNode=document.getElementById('head-pearls');
  const streakNode=document.getElementById('head-streak');
  const toastNode=document.getElementById('toast');
  const STORAGE='sidequest:deep-dive:player:v1';
  const ACTIVE='sidequest:deep-dive:active:v1';
  const TIERS=[
    {label:'Shoreline',score:10,color:'#a8cbd0',mark:'◌'},
    {label:'Brightwater',score:15,color:'#b6eb9a',mark:'◇'},
    {label:'The reef',score:30,color:'#8ee6d4',mark:'✦'},
    {label:'Blue twilight',score:60,color:'#96baff',mark:'◆'},
    {label:'The abyss',score:85,color:'#d2a3ff',mark:'✶'},
    {label:'New discovery',score:100,color:'#ffcf80',mark:'★'}
  ];
  const WORLDS=[
    ['Geography','◎','Across borders, rivers and mountains'],
    ['Wildlife','◈','Meet the extraordinary natural world'],
    ['Science','✳','From the smallest atom to the stars'],
    ['Arts','♫','Films, stories, paintings and music'],
    ['Food','◉','A curious taste for cultures'],
    ['Sports','◇','Games, competition and technique'],
    ['History','⌛','Civilizations, discoveries and empires'],
    ['Tech','⌘','Computers, inventions and networks'],
    ['Words','✎','The places that language takes us']
  ];
  const UNLOCK=[0,140,420,850,1400];
  const DEFAULT={version:1,pearls:0,streak:0,lastDaily:'',daily:{},worldRecords:{},endlessBest:0,history:[],runs:0};
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/\+/g,' plus ').replace(/#/g,' sharp ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim().replace(/^the /,'');
  const utc=()=>new Date().toISOString().slice(0,10);
  const format=(n)=>Number(n||0).toLocaleString('en-US');
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
  let profile={...DEFAULT,...(read(STORAGE)||{})};
  if(!profile.daily||typeof profile.daily!=='object')profile.daily={};
  if(!profile.worldRecords||typeof profile.worldRecords!=='object')profile.worldRecords={};
  if(!Array.isArray(profile.history))profile.history=[];
  let active=read(ACTIVE);
  let bank=[],byId=new Map(),themes=[];
  let currentView=window.DeepDiveParty?.preferred()?'party':'daily';
  let ticker=null,toastTimer=null,transitioning=false;
  function seed(text){let h=2166136261;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function shuffle(items,text){
    let s=seed(text)||0x123ab4d;
    const a=[...items];function random(){s+=0x6d2b79f5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }
  const todaysQuestions=()=>{
    const day=utc(),chosen=shuffle(themes,'daily-theme:'+day).slice(0,7);
    return chosen.map(theme=>shuffle(bank.filter(q=>q.theme===theme),'daily:'+day+':'+theme)[0].id);
  };
  function syncHead(){pearlNode.textContent=format(profile.pearls);streakNode.textContent=format(profile.streak);document.querySelectorAll('.nav-pill').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView))}
  function save(){write(STORAGE,profile);if(active)write(ACTIVE,active);else try{localStorage.removeItem(ACTIVE)}catch{}syncHead()}
  function notify(text){toastNode.textContent=text;toastNode.classList.add('shown');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastNode.classList.remove('shown'),2800)}
  function parts(){
    return TIERS.map(t=>`<div class="tier-pill" style="--tier:${t.color}"><i></i><strong>${safe(t.label)}</strong><span>+${t.score}</span><small>points</small></div>`).join('');
  }
  function button(action,label,secondary='',attr=''){
    return `<button class="btn ${secondary}" type="button" data-action="${action}" ${attr}>${label}</button>`;
  }
  function bubbles(){return '<div aria-hidden="true"><i class="bubble"></i><i class="bubble"></i><i class="bubble"></i></div>'}
  function dailyDone(){return profile.daily[utc()]||null}
  function oldActiveCheck(){
    if(!active)return;
    if(active.mode==='daily'&&active.day!==utc()){active=null;save();return}
    if(!Array.isArray(active.ids)||!active.ids.length||active.ids.some(id=>!byId.has(id))||!Number.isInteger(active.index)){
      active=null;save();return
    }
    if(active.index<0||active.index>=active.ids.length||!Array.isArray(active.results)){
      active=null;save();return
    }
  }
  function renderHome(){
    const complete=dailyDone(),resume=active?.mode==='daily',date=utc();
    const primaryLabel=resume?'↳ Continue today’s dive':complete?'✓ View today’s results':'↧ Begin today’s dive';
    const primaryAct=resume?'resume':complete?'dailyResults':'startDaily';
    const displayScore=complete?`${complete.score} <span style="font-size:13px;color:#a9d5c5">pts</span>`:'7 × 25s';
    return `<section class="page">
      <div class="home-hero"><div>
        <span class="eyebrow">THE DAILY DISCOVERY · ${safe(date)}</span>
        <h1 class="section-heading">Think beyond<br>the <em>obvious.</em></h1>
        <p class="lead">One good answer takes you somewhere. An answer no one thinks of takes you further. Find your rarest discoveries across seven daily prompts.</p>
        <div class="hero-actions">${button(primaryAct,primaryLabel,'primary')}${button('startEndless','↗ Try endless','ghost')}</div>
        <p class="helper">One shared set per UTC day <span class="divider-dot">•</span> No account needed <span class="divider-dot">•</span> Independently written questions</p>
        <div class="metric-strip"><div class="metric"><strong>07</strong><span>Prompts</span></div><div class="metric"><strong>25s</strong><span>Per answer</span></div><div class="metric"><strong>${displayScore}</strong><span>${complete?'Your score':'Your chance'}</span></div></div>
      </div><div class="ocean-display">${bubbles()}<div class="rays"></div><div class="diver-mark" aria-hidden="true">✦</div><div class="ocean-caption"><span>SCATTERED KNOWLEDGE · HIDDEN DEPTHS</span><strong>Discover more.</strong></div></div></div>
      <section class="band"><div class="band-heading"><h2>Six levels of discovery</h2><span>Correct answers score more as they become less expected</span></div><div class="tier-row">${parts()}</div></section>
      <div class="mode-grid">
        <div class="mode-card"><div class="card-icon">◈</div><h3>Today's dive</h3><span class="tagline">Same seven for everyone</span><p>Seven categories, 25 seconds each. A new shared selection appears at midnight UTC.</p>${button(primaryAct,complete?'See result':resume?'Continue run':'Start daily','small primary')}</div>
        <div class="mode-card"><div class="card-icon">∞</div><h3>Endless</h3><span class="tagline">Practice without limits</span><p>Up to 50 prompts per session. Three unanswered rounds end your run. Come back as often as you like.</p>${button('startEndless','Try endless','small primary')}</div>
        <div class="mode-card"><div class="card-icon">🐡</div><h3>Puffer Party</h3><span class="tagline">2–8 players · real rooms</span><p>Host a party, invite friends and pass the puffer with rare answers. The last explorer afloat wins!</p>${button('party','Play with friends','small primary')}</div>
        <div class="mode-card"><div class="card-icon">◉</div><h3>Curiosity worlds</h3><span class="tagline">Nine collections · five chapters each</span><p>Explore themed chapters. Earn pearls in every run to open deeper challenges.</p>${button('worlds','Explore worlds','small primary')}</div>
      </div>
    </section>`;
  }
  function renderWorlds(){
    return `<section class="page"><div class="page-title"><span class="eyebrow">THE ATLAS OF IDEAS</span><h1>Every subject has <em style="color:var(--aqua);font-style:normal">layers.</em></h1><p>Choose a collection, then a chapter. Finish chapters in order and earn pearls from your answers to reach the deeper chapters. All chapters are free to unlock through play.</p></div>
    <div class="surface-card"><div class="progress-top"><div><span class="side-label">Your available discoveries</span><div class="depth-score">${format(profile.pearls)} <span>pearls</span></div></div><div class="side-help">New chapters open as you play. Chapters 2–5 need ${UNLOCK.slice(1).map(format).join(', ')} pearls respectively, plus the preceding chapter in that collection.</div></div></div>
    <div class="worlds-grid">${WORLDS.map(([theme,icon,desc])=>`<article class="world-card"><div class="world-icon" aria-hidden="true">${icon}</div><h3>${safe(theme)}</h3><p>${safe(desc)}</p><div class="chapter-row">${Array.from({length:5},(_,i)=>{
      const key=theme+':'+i,finished=Number.isFinite(profile.worldRecords[key]),prior=i===0||Number.isFinite(profile.worldRecords[theme+':'+(i-1)]),open=profile.pearls>=UNLOCK[i]&&prior;
      return `<button type="button" class="chapter ${finished?'done':open?'':'locked'}" data-action="startWorld" data-world="${safe(theme)}" data-chapter="${i}" ${open?'':`disabled title="Earn ${UNLOCK[i]} pearls and complete the previous chapter"`} aria-label="${safe(theme)} chapter ${i+1} ${open?'open':'locked'}">${finished?'✓':open?i+1:'⌁'}</button>`
    }).join('')}</div></article>`).join('')}</div>
    </section>`;
  }
  function renderStats(){
    const hist=profile.history.slice(0,15),dailyDays=Object.keys(profile.daily).length,
    best=hist.reduce((m,r)=>Math.max(m,r.score||0),0),average=hist.length?Math.round(hist.reduce((s,r)=>s+(r.score||0),0)/hist.length):0;
    return `<section class="page"><div class="page-title"><span class="eyebrow">THE CAPTAIN'S LOGBOOK</span><h1>Your discoveries, <em style="color:var(--aqua);font-style:normal">remembered.</em></h1><p>Results and streaks are saved on this browser only. They do not sync to other devices and clearing browser storage will remove them.</p></div>
    <div class="stats-grid">
      <div class="surface-card"><span class="side-label">Total pearls</span><div class="depth-score">${format(profile.pearls)}</div></div>
      <div class="surface-card"><span class="side-label">Current daily streak</span><div class="depth-score">${format(profile.streak)} <span>days</span></div></div>
      <div class="surface-card"><span class="side-label">Daily dives</span><div class="depth-score">${format(dailyDays)}</div></div>
      <div class="surface-card"><span class="side-label">Best endless</span><div class="depth-score">${format(profile.endlessBest)}</div></div>
    </div>
    <div class="band-heading"><h2>Recent voyages</h2><span>${format(profile.runs)} completed · ${format(average)} average points from recent runs</span></div>
    <div class="history-list">${hist.length?hist.map(r=>`<div class="history-row"><div><strong>${safe(r.label)}</strong> <span>${safe(r.day)} · ${r.count} prompts</span></div><b>${format(r.score)} pts</b></div>`).join(''):'<div class="surface-card"><span class="helper">Your logbook is empty. Complete a dive to fill it.</span></div>'}</div>
    <div class="result-actions">${button('daily','Return to the surface','ghost')}${button('startEndless','Practice now','primary')}</div>
    </section>`;
  }
  function start(mode,world='',chapter=0){
    if(mode==='daily'&&dailyDone()){currentView='daily';render();return}
    const day=utc();
    let ids=[];
    if(mode==='daily')ids=todaysQuestions();
    if(mode==='endless')ids=shuffle(bank,'endless:'+day+':'+Date.now()).slice(0,50).map(q=>q.id);
    if(mode==='world'){
      if(!WORLDS.some(w=>w[0]===world)||!Number.isInteger(chapter)||chapter<0||chapter>4)return;
      if(profile.pearls<UNLOCK[chapter]||(chapter>0&&!Number.isFinite(profile.worldRecords[world+':'+(chapter-1)]))){notify('Complete the previous chapter and earn more pearls first.');return}
      ids=shuffle(bank.filter(q=>q.theme===world),world+':chapter:'+chapter).slice(0,7).map(q=>q.id);
    }
    if(!ids.length)return;
    active={mode,world,chapter,day,ids,index:0,phase:'question',deadline:Date.now()+25000,results:[],score:0,misses:0,startedAt:Date.now()};
    save();currentView=mode==='world'?'worlds':mode==='endless'?'endless':'daily';render();
  }
  function currentQ(){return byId.get(active.ids[active.index])}
  function currentTotal(){return active.ids.length}
  function frameHeading(){return active.mode==='daily'?'DAILY DISCOVERY':active.mode==='endless'?'THE ENDLESS EXPEDITION':safe(active.world.toUpperCase()+' · CHAPTER '+(active.chapter+1))}
  function renderQuestion(){
    const q=currentQ(),idx=active.index,n=currentTotal(),seconds=Math.max(0,Math.ceil((active.deadline-Date.now())/1000)),
    dots=active.ids.map((id,i)=>`<span class="${i<idx?'done':i===idx?'now':''}"></span>`).join('');
    return `<section class="page game-layout"><div class="question-card">
      <div class="progress-top"><span class="round-label">${frameHeading()}</span><span class="prompt-index">PROMPT ${idx+1} OF ${n}</span></div><div class="progress-dots">${dots}</div>
      <span class="eyebrow" style="display:block;margin-top:29px">${safe(q.theme)} · Open answer</span>
      <h1 class="question-copy">${safe(q.prompt)}</h1><div class="subprompt">Think of the less obvious correct answer. You can retry an unrecognized answer while time remains.</div>
      <form class="answer-form" id="answer-form" autocomplete="off">
        <label for="answer-input" class="answer-label">Your discovery</label>
        <div class="answer-line"><input id="answer-input" class="answer-field" maxlength="90" autocapitalize="sentences" spellcheck="false" autocomplete="off" placeholder="Type your answer…" aria-describedby="answer-feedback" required><button type="submit" class="btn primary">Submit ↗</button></div>
        <div class="feedback" role="status" id="answer-feedback" aria-live="polite"></div>
      </form>
      <div class="round-actions"><span class="round-note">The answer list is curated. Rarity is editorial, not a live count of player responses.</span>${button('pass','Pass for 0 points','small ghost')}</div>
      <div class="countdown-bar" aria-hidden="true"><span id="time-fill" style="width:${seconds*4}%"></span></div></div>
      <aside class="sidepanel"><div><span class="side-label">Your depth</span><div class="depth-score">−${format(active.score*10)}<span>m</span></div><div class="depth-rail"><span class="depth-point" style="--depth:${Math.min(92,active.score/(currentTotal()*100)*92)}%"></span></div></div><div><span class="side-label">Time remaining</span><div class="timer ${seconds<=7?'warn':''}" id="timer">◴ <strong id="seconds">${seconds}</strong>s</div><p class="side-help">Accepted answers earn <strong>10–100 points</strong>. Your current run has ${active.misses} missed ${active.misses===1?'prompt':'prompts'}.</p></div></aside>
    </section>`;
  }
  function renderReveal(){
    const last=active.results[active.results.length-1]||{points:0,answer:'',tier:null,reason:'No answer'};
    const tier=last.tier!==null&&last.tier!==undefined?TIERS[last.tier]:null;
    const title=tier?tier.label:last.reason==='Timeout'?'Time is up':last.reason==='Pass'?'No discovery this time':'Not accepted';
    const explain=tier?'That answer belongs to an editorial rarity band: it is a valid answer our original question bank recognizes.':'You can continue to the next prompt. Other accepted answers in our bank may score differently.';
    return `<section class="page game-layout"><div class="question-card"><div class="progress-top"><span class="round-label">${frameHeading()}</span><span class="prompt-index">PROMPT ${active.index+1} OF ${currentTotal()}</span></div>
    <div class="result-card" style="margin-top:33px;--tier:${tier?tier.color:'#90a3ab'}">
      <div class="result-symbol" aria-hidden="true">${tier?tier.mark:'×'}</div><span class="eyebrow">${tier?'ANSWER ACCEPTED':'ROUND COMPLETE'}</span>
      <h1 class="result-name">${safe(title)}</h1><p class="result-answer">${tier?`Your answer: <strong>${safe(last.answer)}</strong>`:safe(last.reason)}</p>
      <div class="result-points">${tier?'◈ Earned ':'◌ Earned '}<strong>+${last.points}</strong> points</div>
      <p class="result-explain">${safe(explain)}</p>
      ${button('next',active.index+1>=currentTotal()||active.mode==='endless'&&active.misses>=3?'See your results →':'Next discovery →','primary')}
    </div></div><aside class="sidepanel"><div><span class="side-label">Depth reached</span><div class="depth-score">−${format(active.score*10)} <span>m</span></div><div class="depth-rail"><span class="depth-point" style="--depth:${Math.min(92,active.score/(currentTotal()*100)*92)}%"></span></div></div><p class="side-help">Your score is based on our curated accepted-answer tiers—not guessed crowd percentages.</p></aside></section>`;
  }
  function conclude(){
    if(!active)return;
    const r={mode:active.mode,day:active.day,score:active.score,count:active.results.length,results:active.results.map(x=>({...x})),label:active.mode==='daily'?'Daily discovery':active.mode==='endless'?'Endless expedition':active.world+' · Chapter '+(active.chapter+1),world:active.world,chapter:active.chapter};
    if(active.mode==='daily'&&profile.daily[active.day]){active=null;save();currentView='daily';render();return}
    if(active.mode==='daily'){
      profile.daily[active.day]=r;
      const yesterday=new Date(Date.parse(active.day+'T00:00:00Z')-86400000).toISOString().slice(0,10);
      profile.streak=profile.lastDaily===yesterday?profile.streak+1:1;
      profile.lastDaily=active.day;
    }
    if(active.mode==='endless')profile.endlessBest=Math.max(profile.endlessBest,active.score);
    if(active.mode==='world'){
      const k=active.world+':'+active.chapter;
      profile.worldRecords[k]=Math.max(Number(profile.worldRecords[k]||0),active.score);
    }
    profile.pearls+=active.score;profile.runs=(profile.runs||0)+1;
    profile.history=[r,...profile.history].slice(0,50);
    active=null;save();currentView=r.mode==='daily'?'daily':r.mode==='world'?'worlds':'endless';renderSummary(r);
  }
  function roundEnd(record){
    if(!active||active.phase!=='question'||transitioning)return;
    transitioning=true;active.phase='reveal';
    active.results.push(record);active.score+=record.points;
    if(record.points===0)active.misses++;
    clearInterval(ticker);save();transitioning=false;render();
  }
  function pass(reason='Pass'){roundEnd({id:currentQ().id,answer:'',points:0,tier:null,reason})}
  function submit(form){
    if(!active||active.phase!=='question')return;
    if(Date.now()>=active.deadline){pass('Timeout');return}
    const input=form.querySelector('#answer-input');
    const answer=String(input?.value||'').trim().slice(0,90);
    if(!answer)return;
    const key=norm(answer),q=currentQ();
    const found=q.answers.find(a=>[a.value,...(a.aliases||[])].some(t=>norm(t)===key));
    if(!found){
      const feedback=document.getElementById('answer-feedback');
      feedback.textContent='Not recognized by this question’s curated answer list. Try another answer while time remains.';
      feedback.classList.remove('ok');
      input.select();return;
    }
    const tier=Math.max(0,Math.min(5,Number(found.tier)||0));
    roundEnd({id:q.id,answer:found.value,points:TIERS[tier].score,tier,reason:'Accepted'});
  }
  function next(){
    if(!active||active.phase!=='reveal')return;
    if(active.index+1>=active.ids.length||(active.mode==='endless'&&active.misses>=3)){conclude();return}
    active.index++;active.phase='question';active.deadline=Date.now()+25000;save();render();
  }
  function updateClock(){
    if(!active||active.phase!=='question')return;
    const remain=Math.max(0,active.deadline-Date.now()),s=Math.ceil(remain/1000);
    const el=document.getElementById('seconds'),bar=document.getElementById('time-fill'),timer=document.getElementById('timer');
    if(el)el.textContent=String(s);
    if(bar)bar.style.width=(remain/250)+'%';
    if(timer)timer.classList.toggle('warn',s<=7);
    if(remain<=0)pass('Timeout');
  }
  function resultDots(results){
    return results.map(r=>{
      const t=r.tier!==null&&r.tier!==undefined?TIERS[r.tier]:null;
      return `<div class="summary-dot" style="--tier:${t?t.color:'#536e7a'}" title="${safe(t?t.label:'Unanswered')}: ${r.points} points">${t?t.mark:'×'}</div>`
    }).join('');
  }
  function renderSummary(r){
    clearInterval(ticker);syncHead();
    const isDaily=r.mode==='daily',max=r.count*100;
    const text=`Deep Dive · ${r.label} · ${r.day}\n${r.score}/${max} points · ${format(r.score*10)}m of depth\n${r.results.map(x=>x.points?'◆':'◇').join('')}\nPlay on Sidequest`;
    root.innerHTML=`<section class="page"><div class="home-hero">
      <div><span class="eyebrow">THE END OF YOUR EXPEDITION</span>
      <h1 class="section-heading">What a <em>discovery.</em></h1>
      <p class="lead">${safe(r.label)} · ${safe(r.day)}</p>
      <div class="summary-score">−${format(r.score*10)}<span> m</span></div><p class="lead">You've earned <strong style="color:var(--sun)">${format(r.score)} points</strong> and the same number of pearls. ${isDaily?'Today’s shared challenge is complete. Your result is saved in this browser.':'Another voyage is always waiting.'}</p>
      <div class="summary-rounds" aria-label="Score by prompt">${resultDots(r.results)}</div>
      <div class="result-actions">${button('share','Copy your result','primary')}${button('daily','Return to surface','ghost')}${button('startEndless','Play endless','ghost')}</div>
      <p class="helper">Scoring uses original editorial rarity tiers, not live player popularity. Your progress stays on this device.</p>
      </div><div class="ocean-display">${bubbles()}<div class="diver-mark" aria-hidden="true">✶</div><div class="ocean-caption"><span>YOU REACHED</span><strong>${format(r.score)} points</strong></div></div>
      </div></section>`;
    root.dataset.share=text;
  }
  function render(){
    clearInterval(ticker);syncHead();oldActiveCheck();
    if(currentView==='party'){window.DeepDiveParty?.mount({root});return}else window.DeepDiveParty?.unmount();
    if(active&&((currentView==='daily'&&active.mode==='daily')||(currentView==='endless'&&active.mode==='endless')||(currentView==='worlds'&&active.mode==='world'))){
      root.innerHTML=active.phase==='question'?renderQuestion():renderReveal();
      if(active.phase==='question'){
        ticker=setInterval(updateClock,120);
        setTimeout(()=>{const input=document.getElementById('answer-input');if(input&&window.matchMedia('(pointer:fine)').matches)input.focus()},80);
        updateClock();
      }
    }else if(currentView==='worlds')root.innerHTML=renderWorlds();
    else if(currentView==='stats')root.innerHTML=renderStats();
    else if(currentView==='daily')root.innerHTML=renderHome();
    else if(currentView==='endless')root.innerHTML=`<section class="page"><div class="home-hero"><div><span class="eyebrow">ENDLESS EXPEDITION</span><h1 class="section-heading">How deep can <em>you go?</em></h1><p class="lead">Explore up to 50 independently written prompts. Three missed questions end the run, but your curiosity never has to.</p><div class="hero-actions">${button('startEndless','Begin an endless run','primary')}${button('daily','Back to daily','ghost')}</div><p class="helper">50 prompts maximum <span class="divider-dot">·</span> Three misses <span class="divider-dot">·</span> Unlimited attempts</p></div><div class="ocean-display">${bubbles()}<div class="diver-mark">∞</div><div class="ocean-caption"><span>YOUR RECORD</span><strong>${format(profile.endlessBest)} pts</strong></div></div></div></section>`;
    root.focus({preventScroll:true});
  }
  root.addEventListener('submit',e=>{if(e.target.id!=='answer-form')return;e.preventDefault();submit(e.target)});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button[data-action]');if(!b||b.disabled)return;
    switch(b.dataset.action){
      case 'startDaily':if(active?.mode==='daily'){currentView='daily';render()}else start('daily');break;
      case 'startEndless':if(active?.mode==='endless'){currentView='endless';render()}else start('endless');break;
      case 'startWorld':{
        const world=b.dataset.world,chapter=Number(b.dataset.chapter);
        if(active?.mode==='world'&&active.world===world&&active.chapter===chapter){currentView='worlds';render()}else start('world',world,chapter);break;
      }
      case 'resume':currentView=active?.mode==='daily'?'daily':currentView;render();break;
      case 'dailyResults':{const d=dailyDone();if(d)renderSummary(d);break}
      case 'pass':pass();break;
      case 'next':next();break;
      case 'daily':case 'endless':case 'worlds':case 'stats':case 'party':currentView=b.dataset.action;render();break;
      case 'share':{
        const value=root.dataset.share||'';
        if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>notify('Result copied. Share your discovery!')).catch(()=>notify('Clipboard is unavailable in this browser.'));
        else notify('Clipboard is unavailable in this browser.');
        break;
      }
    }
  });
  document.querySelectorAll('.nav-pill').forEach(b=>b.addEventListener('click',()=>{
    currentView=b.dataset.view;render();
  }));
  document.getElementById('home-link').addEventListener('click',e=>{e.preventDefault();currentView='daily';render()});
  fetch('./questions.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Question bank request failed: '+r.status);return r.json()}).then(data=>{
    if(!Array.isArray(data.questions)||data.questions.length<70)throw Error('Question bank incomplete');
    bank=data.questions;
    themes=Array.isArray(data.themes)?data.themes:WORLDS.map(w=>w[0]);
    byId=new Map(bank.map(q=>[q.id,q]));
    if(byId.size!==bank.length||themes.some(t=>bank.filter(q=>q.theme===t).length<7))throw Error('Incomplete question-bank themes');
    oldActiveCheck();render();
  }).catch(e=>{
    root.innerHTML=`<div class="notice" style="margin:35px 0"><strong>We couldn’t load the question bank.</strong><p>${safe(e.message)}</p><button class="btn" type="button" onclick="location.reload()">Try again</button></div>`;
  });
})();
