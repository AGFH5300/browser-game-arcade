'use strict';
(function launchDeepDive(){
  const root=document.getElementById('app');
  const pearlNode=document.getElementById('head-pearls');
  const streakNode=document.getElementById('head-streak');
  const toastNode=document.getElementById('toast');
  const STORAGE='sidequest:deep-dive:player:v1';
  const ACTIVE='sidequest:deep-dive:active:v1';
  const TIERS=[
    {id:'plankton',label:'Plankton',score:10,color:'#a8cbd0',mark:'🫧'},
    {id:'tooclever',label:'Too Clever',score:15,color:'#b6eb9a',mark:'🤡'},
    {id:'schooler',label:'Schooler',score:30,color:'#8ee6d4',mark:'🐟'},
    {id:'rare',label:'Rare',score:60,color:'#96baff',mark:'🦑'},
    {id:'deepcut',label:'Deep Cut',score:85,color:'#d2a3ff',mark:'🏮'},
    {id:'krillion',label:'One in a Krillion',score:100,color:'#ffcf80',mark:'🌟'}
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
  let bank=[],byId=new Map(),themes=[],sourceDaily=null,sourceError='';
  const dailyDate=()=>sourceDaily?.date||utc();
  const dailyKey=()=>sourceDaily?'source:'+sourceDaily.date:utc();

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
    if(sourceDaily)return [...sourceDaily.ids];
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
  function dailyDone(){return profile.daily[dailyKey()]||null}
  function oldActiveCheck(){
    if(!active)return;
    if(active.mode==='daily'&&active.day!==dailyDate()){active=null;save();return}
    if(active.mode==='daily'&&sourceDaily&&active.source!=='krillion-reveal'){active=null;save();return}
    if(!Array.isArray(active.ids)||!active.ids.length||active.ids.some(id=>!byId.has(id))||!Number.isInteger(active.index)){
      active=null;save();return
    }
    if(active.index<0||active.index>=active.ids.length||!Array.isArray(active.results)){
      active=null;save();return
    }
  }
  function oceanArt(){
    return `<div class="dd-cloud dd-cloud-a" aria-hidden="true"></div><div class="dd-cloud dd-cloud-b" aria-hidden="true"></div><div class="dd-sun" aria-hidden="true"></div>
      <svg class="dd-boat" viewBox="0 0 232 95" aria-hidden="true" style="image-rendering:pixelated"><g shape-rendering="crispEdges" fill="#08243d"><rect x="36" y="65" width="154" height="13"/><rect x="47" y="78" width="133" height="7"/><rect x="58" y="53" width="97" height="12"/><rect x="70" y="38" width="63" height="17"/><rect x="98" y="28" width="15" height="10"/><rect x="87" y="7" width="6" height="36"/><rect x="22" y="67" width="17" height="10"/><rect x="189" y="64" width="16" height="10"/><rect x="55" y="55" width="6" height="14"/></g><path d="M93 8h31v17H93z" fill="#ff527d" shape-rendering="crispEdges"/><path d="M124 8v17h-6V8" fill="#e93167" shape-rendering="crispEdges"/><g fill="#6df0f0" shape-rendering="crispEdges"><rect x="65" y="69" width="9" height="5"/><rect x="93" y="69" width="9" height="5"/><rect x="125" y="69" width="9" height="5"/><rect x="149" y="69" width="9" height="5"/></g></svg>
      <div class="dd-wave" aria-hidden="true"></div>`;
  }
  function oceanDecor(){
    return `<div class="dd-depth-ticks" aria-hidden="true"><span>000m</span><span>500m</span><span>1000m</span><span>1500m</span><span>2500m</span><span>4000m</span><span>7000m</span></div><div class="dd-fish dd-fish-a" aria-hidden="true">▰◂</div><div class="dd-fish dd-fish-b" aria-hidden="true">◂▰</div><div class="dd-fish dd-fish-c" aria-hidden="true">▰◂</div><div class="dd-bubbles" aria-hidden="true">°<br>°<br>·<br>°<br>·</div>`;
  }
  function renderHome(){
    const complete=dailyDone(),resume=active?.mode==='daily',date=dailyDate();
    const sourceLabel=sourceDaily?'PUBLIC DAILY #'+sourceDaily.dayNumber+' · '+format(sourceDaily.answerCount)+' PUBLISHER-SCORED ANSWERS':'INDEPENDENT SIDEQUEST DAILY';

    const primaryLabel=resume?'▼ CONTINUE DESCENT ▼':complete?'▼ VIEW DIVE RESULTS ▼':'▼ BEGIN DESCENT ▼';
    const primaryAct=resume?'resume':complete?'dailyResults':'startDaily';
    return `<section class="page deep-home">
      <div class="dd-sky">${oceanArt()}
        <div class="dd-title-group"><p class="dd-edition">A SIDEQUEST ORIGINAL · ${safe(date)}</p>
          <h1 class="dd-logo" aria-label="Deep Dive">DEEP <span>DIVE</span></h1>
          <p class="dd-subtitle">THE DAILY DIVE</p><p class="dd-tagline">7 prompts · 25 seconds each · unusual answers sink deeper</p>
        </div>
      </div>
      <div class="dd-sea">${oceanDecor()}
        <div class="dd-sea-center">
          <div class="dd-surface-label">◂ HOW DEEP CAN YOUR KNOWLEDGE GO? ▸</div>
          <details class="dd-rules"><summary>▸ HOW TO PLAY</summary><p>Seven prompts, twenty-five seconds per answer. Choose a correct but unusual answer to descend farther. Accepted responses earn 10–100 points; unrecognized answers can be retried until the timer ends. Every player receives the same daily questions.</p></details>
          <button type="button" class="dd-party-btn" data-action="party"><span class="dd-party-fish" aria-hidden="true">🐡</span><span>PUFFER PARTY <small>LIVE MULTIPLAYER · 2–8 EXPLORERS</small></span><span class="dd-party-arrow">›</span></button>
          <button type="button" class="dd-begin" data-action="${primaryAct}">${primaryLabel}</button>
          <div class="dd-mode-nav"><span class="dd-dive-number">DAILY · ${safe(date)}</span><button type="button" data-action="startEndless">ENDLESS ∞</button><button type="button" data-action="worlds">THEMED WORLDS</button><button type="button" data-action="stats">LOGBOOK ◷</button></div>
          <p class="dd-source-note">${safe(sourceLabel)}${!sourceDaily&&sourceError?" · "+safe(sourceError):""}</p>
          <div class="dd-sea-stats"><span>◈ ${format(profile.pearls)} PEARLS</span><span>✦ ${format(profile.streak)} DAY STREAK</span><span>${complete?format(complete.score)+' POINTS TODAY':'FREE DAILY DESCENT'}</span></div>
        </div>
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
    const day=mode==='daily'?dailyDate():utc();
    let ids=[];
    if(mode==='daily')ids=todaysQuestions();
    if(mode==='endless')ids=shuffle(bank,'endless:'+day+':'+Date.now()).slice(0,50).map(q=>q.id);
    if(mode==='world'){
      if(!WORLDS.some(w=>w[0]===world)||!Number.isInteger(chapter)||chapter<0||chapter>4)return;
      if(profile.pearls<UNLOCK[chapter]||(chapter>0&&!Number.isFinite(profile.worldRecords[world+':'+(chapter-1)]))){notify('Complete the previous chapter and earn more pearls first.');return}
      ids=shuffle(bank.filter(q=>q.theme===world),world+':chapter:'+chapter).slice(0,7).map(q=>q.id);
    }
    if(!ids.length)return;
    active={mode,world,chapter,source:mode==='daily'&&sourceDaily?'krillion-reveal':'sidequest',day,ids,index:0,phase:'question',deadline:Date.now()+25000,results:[],score:0,misses:0,startedAt:Date.now()};
    save();currentView=mode==='world'?'worlds':mode==='endless'?'endless':'daily';render();
  }
  function currentQ(){return byId.get(active.ids[active.index])}
  function currentTotal(){return active.ids.length}
  function frameHeading(){return active.mode==='daily'?'DAILY DISCOVERY':active.mode==='endless'?'THE ENDLESS EXPEDITION':safe(active.world.toUpperCase()+' · CHAPTER '+(active.chapter+1))}
  function arcadeHud(){
    const n=currentTotal(),idx=active.index;
    const dots=active.ids.map((id,i)=>{
      const prior=active.results[i],tier=prior?.tier;
      const color=prior&&tier!==null&&tier!==undefined?TIERS[tier].color:prior?'#284c6b':i===idx?'#ff5288':'#091b38';
      return `<i class="dd-hud-dot" style="--dot:${color}" title="Round ${i+1}"></i>`;
    }).join('');
    return `<div class="dd-hud"><div class="dd-hud-box"><span>DEPTH</span><strong>${format(active.score*10)}<small>m</small></strong></div>
      <div class="dd-hud-progress"><div class="dd-hud-dots">${dots}</div><small>PROMPT ${idx+1} OF ${n}</small></div>
      <div class="dd-hud-box dd-hud-score"><span>SCORE</span><strong>${format(active.score)}</strong></div></div>`;
  }
  function renderQuestion(){
    const q=currentQ(),seconds=Math.max(0,Math.ceil((active.deadline-Date.now())/1000));
    return `<section class="page deep-home dd-game-screen">
      <div class="dd-sky dd-game-sky">${oceanArt()}${arcadeHud()}</div>
      <div class="dd-sea dd-game-sea">${oceanDecor()}
        <div class="dd-game-prompt"><span class="dd-prompt-label">PROMPT ${active.index+1} OF ${currentTotal()} · ${safe(q.theme)}</span>
          <h1 class="dd-prompt-text">${safe(q.prompt)}</h1><p class="dd-prompt-hint">▼ RARER ANSWERS SINK DEEPER ▼</p>
        </div>
        <div class="dd-game-fish" aria-hidden="true"></div>
        <div class="dd-game-controls">
          <div class="dd-game-clock ${seconds<=7?'warn':''}" id="timer" aria-label="Time remaining"><strong id="seconds">${seconds}</strong></div>
          <form class="answer-form dd-answer-form" id="answer-form" autocomplete="off">
            <div class="dd-answer-line"><input id="answer-input" class="answer-field" maxlength="90" autocapitalize="sentences" spellcheck="false" autocomplete="off" placeholder="type one answer…" aria-label="Your answer" aria-describedby="answer-feedback" required><button type="submit" class="dd-submit">DIVE ↧</button></div>
            <div class="feedback" role="status" id="answer-feedback" aria-live="polite"></div>
          </form>
          <button class="dd-skip" type="button" data-action="pass">SKIP</button>
          <div class="countdown-bar dd-game-bar" aria-hidden="true"><span id="time-fill" style="width:${seconds*4}%"></span></div>
        </div>
      </div></section>`;
  }
  function renderReveal(){
    const last=active.results[active.results.length-1]||{points:0,answer:'',tier:null,reason:'No answer'};
    const tier=last.tier!==null&&last.tier!==undefined?TIERS[last.tier]:null;
    const title=tier?tier.label:last.reason==='Timeout'?'Time is up':last.reason==='Pass'?'No discovery this time':'Not accepted';
    const explain=tier?(last.quip||'Accepted answer · this question bank determines rarity.'):'No points for this round. The next discovery awaits.';
    return `<section class="page deep-home dd-game-screen dd-reveal-screen">
      <div class="dd-sky dd-game-sky">${oceanArt()}${arcadeHud()}</div>
      <div class="dd-sea dd-game-sea">${oceanDecor()}
        <div class="dd-reveal" style="--tier:${tier?tier.color:'#87b8d3'}">
          <div class="dd-reveal-spark">${tier?tier.mark:'×'}</div>
          <span class="dd-prompt-label">${tier?'ANSWER ACCEPTED':'ROUND COMPLETE'}</span>
          <h1 class="dd-reveal-title">${safe(title)}</h1>
          <p class="dd-reveal-answer">${tier?'↳ '+safe(last.answer):safe(last.reason)}</p>
          <p class="dd-reveal-score">+${last.points} <span>POINTS</span></p>
          <p class="dd-reveal-depth">▼ ${format(last.points*10)} METRES DESCENDED</p>
          <p class="dd-reveal-caption">${safe(explain)}</p>
          ${button('next',active.index+1>=currentTotal()||active.mode==='endless'&&active.misses>=3?'VIEW DIVE RESULTS →':'NEXT DESCENT →','primary')}
        </div>
      </div></section>`;
  }
  function conclude(){
    if(!active)return;
    const r={mode:active.mode,source:active.source,day:active.day,score:active.score,count:active.results.length,results:active.results.map(x=>({...x})),label:active.mode==='daily'?(active.source==='krillion-reveal'?'Public-source daily dive':'Daily discovery'):active.mode==='endless'?'Endless expedition':active.world+' · Chapter '+(active.chapter+1),world:active.world,chapter:active.chapter};
    const completedKey=active.source==='krillion-reveal'?'source:'+active.day:active.day;
    if(active.mode==='daily'&&profile.daily[completedKey]){active=null;save();currentView='daily';render();return}
    if(active.mode==='daily'){
      profile.daily[completedKey]=r;
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
    const found=q.answerIndex?.get(key)||q.answers.find(a=>[a.value,...(a.aliases||[])].some(t=>norm(t)===key));
    if(!found){
      const feedback=document.getElementById('answer-feedback');
      feedback.textContent='Not recognized by this question’s curated answer list. Try another answer while time remains.';
      feedback.classList.remove('ok');
      input.select();return;
    }
    const tier=Math.max(0,Math.min(5,Number(found.tier)||0));
    roundEnd({id:q.id,answer:found.value,points:TIERS[tier].score,tier,quip:found.quip||'',reason:'Accepted'});
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
      <p class="helper">${r.source==='krillion-reveal'?'Scores and result messages from the publisher’s public reveal; extra autocorrect aliases are not included.':'Independent Sidequest prompts with estimated rarity.'} Progress stays on this device.</p>
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
  function addPublicSheet(sheet){
    if(!sheet||!Array.isArray(sheet.prompts)||sheet.prompts.length!==7||typeof sheet.date!=='string')throw Error('Invalid source sheet');
    const ids=[],seen=new Set(),tierIds=TIERS.map(t=>t.id);let answerCount=0;
    for(const p of sheet.prompts){
      if(typeof p.id!=='string'||typeof p.text!=='string'||!Array.isArray(p.answers)||p.answers.length<10)throw Error('Incomplete source data');
      const id='recovered:'+sheet.date+':'+p.id;
      if(seen.has(id))throw Error('Duplicate prompt');seen.add(id);
      const answers=[],answerIndex=new Map();
      for(const a of p.answers){
        const tier=tierIds.indexOf(a.tier);
        if(tier<0||a.score!==TIERS[tier].score||typeof a.answer!=='string'||!a.answer)throw Error('Invalid tier data');
        const entry={value:a.answer,tier,aliases:[],quip:a.quip||'',source:'krillion-public-reveal'};
        answers.push(entry);
        const key=norm(entry.value);
        if(key&&!answerIndex.has(key))answerIndex.set(key,entry);
      }
      answerCount+=answers.length;ids.push(id);
      byId.set(id,{id,theme:'Daily',prompt:p.text,answers,answerIndex});
    }
    if(answerCount<100)throw Error('Source answer list incomplete');
    sourceDaily={date:sheet.date,ids,dayNumber:sheet.dayNumber||0,answerCount};
  }
  async function loadSourceDaily(){
    const nyDate=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const path=nyDate==='2026-10-29'?'./recovered/2026-10-29.json':'/api/deep-dive/public-daily';
    try{
      const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),9500);
      let response;
      try{response=await fetch(path,{signal:ctrl.signal,cache:nyDate==='2026-10-29'?'force-cache':'no-store'})}finally{clearTimeout(timeout)}
      if(!response.ok)throw Error('Publisher sheet HTTP '+response.status);
      const data=await response.json();
      if(nyDate==='2026-10-29'){data.source='krillion-public-reveal';data.dayNumber=106}
      if(data.date!==nyDate)throw Error('Source daily not yet updated');
      addPublicSheet(data);
    }catch(error){
      sourceError='Official source temporarily unavailable, independent practice still playable';
      console.warn('Deep Dive public daily unavailable:',error?.message||error);
    }
  }
  fetch('./questions.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Question bank request failed: '+r.status);return r.json()}).then(async data=>{
    if(!Array.isArray(data.questions)||data.questions.length<70)throw Error('Question bank incomplete');
    bank=data.questions;
    themes=Array.isArray(data.themes)?data.themes:WORLDS.map(w=>w[0]);
    byId=new Map(bank.map(q=>[q.id,q]));
    if(byId.size!==bank.length||themes.some(t=>bank.filter(q=>q.theme===t).length<7))throw Error('Incomplete question-bank themes');
    await loadSourceDaily();
    oldActiveCheck();render();
  }).catch(e=>{
    root.innerHTML=`<div class="notice" style="margin:35px 0"><strong>We couldn’t load the question bank.</strong><p>${safe(e.message)}</p><button class="btn" type="button" onclick="location.reload()">Try again</button></div>`;
  });
})();
