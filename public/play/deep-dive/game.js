'use strict';
(function launchDeepDive(){
  const root=document.getElementById('app');
  const pearlNode=document.getElementById('head-pearls');
  const streakNode=document.getElementById('head-streak');
  const toastNode=document.getElementById('toast');
  const STORAGE='sidequest:deep-dive:player:v1';
  const ACTIVE='sidequest:deep-dive:active:v1';
  const TIERS=[
    {id:'plankton',label:'Plankton',score:10,color:'#a8cbd0',mark:'🫧',icon:'',depth:.08,blurb:'The answer everyone blurts out.'},
    {id:'tooclever',label:'Too Clever',score:15,color:'#ff9f43',mark:'🤡',icon:'',depth:.18,blurb:'A famously obscure pick. Everyone reaches for it.'},
    {id:'schooler',label:'Schooler',score:30,color:'#8ee6d4',mark:'🐟',icon:'schooler.png',depth:.36,blurb:'Solid — swims with the school.'},
    {id:'rare',label:'Rare',score:60,color:'#96baff',mark:'🦑',icon:'rare.png',depth:.6,blurb:'Genuinely uncommon. Nice pull.'},
    {id:'deepcut',label:'Deep Cut',score:85,color:'#9d7bff',mark:'🏮',icon:'deepcut.png',depth:.82,blurb:'True obscurity. Few go this deep.'},
    /* Seasonal sprite observed serving live on 2026-10-29; the year-round
       krillion.png fallback also ships in reference-assets/tiers. */
    {id:'krillion',label:'One in a Krillion',score:100,color:'#ffd166',mark:'🌟',icon:'krillion-halloween-2026.png',depth:.97,blurb:'The designated gem. Trench floor.'}
  ];
  const AMBIENT=[
    [60,'light begins to fade','L'],[200,'most sunlight stops here','R'],
    [332,'deepest scuba dive ever — 332m','R'],[385,'sperm whales hunt below here','L'],
    [535,'emperor penguins dive this deep','R'],[660,'pressure: 67x the surface','L'],
    [800,'siphonophore drift zone','R'],[1040,'THE MIDNIGHT ZONE','L',1],
    [1240,'anglerfish territory','R'],[1550,'sperm whales duel giant squid here','L'],
    [1850,'giant squid territory','R'],[2150,'colossal squid eyes: football-sized','L'],
    [2500,'the water is 2°C and utterly black','R'],[3000,'THE ABYSSAL ZONE','L',1],
    [3800,'the Titanic rests here — 3,800m','R'],[4400,'cusk eels patrol the plain','L'],
    [4900,'the abyssal plain stretches out','R'],[5500,'deeper than most submarines survive','L'],
    [6000,'THE HADAL ZONE','R',1],[6500,'named for Hades. fitting.','L'],
    [7000,'the trench floor — a perfect dive ends here','R',1]
  ];
  /* Original "THE BEARING" bands recovered from the live end screen:
     0–150 / 151–250 / 251–350 / 351–449 / 450+ with their exact verdict copy. */
  const BEARING=[[0,150,'Plankton. Plenty of ocean left down there.'],[151,250,'Schooler. Swimming with the school.'],[251,350,'Rare. Below the thermocline. Nice.'],[351,449,'Deep cut. Seriously deep dive.'],[450,Infinity,'One in a krillion. Trench dweller. Absurd.']];
  const verdict=score=>(BEARING.find(v=>score>=v[0]&&score<=v[1])||BEARING[4])[2];
  /* Scroll-world math recovered from the original public client (pass 3):
     one 14,800px column, 2px per metre, each round spans 2,000px from the
     previous depth. reference-world.js carries the observed evidence. */
  const DW=window.DeepDiveWorld||{depthToY:m=>m*2-9,roundBase:m=>m*2,tierLineY:(m,s)=>m*2+s/100*2000,chipSpawnY:m=>m*2+180,missBannerY:m=>m*2+80,anchorsFor:h=>({answering:h*.23,feedback:h*.378,miss:h*.29,done:h*.51}),durationFor:d=>Math.min(5600,Math.max(1200,900+Math.abs(d)/500*1000)),WORLD_H:14800,FLOOR_TOP:14020};
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
  const DEFAULT={version:1,pearls:0,streak:0,lastDaily:'',daily:{},worldRecords:{},endlessBest:0,history:[],runs:0,ratings:{},tourSeen:0};
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/\+/g,' plus ').replace(/#/g,' sharp ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim().replace(/^the /,'');
  const utc=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const rating=score=>score>=450?'One in a Krillion':score>=351?'Deep cut':score>=251?'Rare':score>=151?'Schooler':'Plankton';
  const format=(n)=>Number(n||0).toLocaleString('en-US');
  // Conservative typo tolerance: a unique close match, never an ambiguous guess.
  function editDistance(a,b,max){
    if(Math.abs(a.length-b.length)>max)return max+1;
    let prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const next=[i];let minimum=next[0];
      for(let j=1;j<=b.length;j++){
        next[j]=Math.min(prev[j]+1,next[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        minimum=Math.min(minimum,next[j]);
      }
      if(minimum>max)return max+1;
      prev=next;
    }
    return prev[b.length];
  }
  function findAnswer(question,raw){
    const key=norm(raw);
    if(!key)return null;
    for(const answer of question.answers)
      if([answer.value,...(answer.aliases||[])].some(value=>norm(value)===key))return answer;
    if(key.length<5)return null;
    const limit=key.length>=10?2:1;
    let match=null,best=limit+1,ambiguous=false;
    for(const answer of question.answers){
      for(const value of [answer.value,...(answer.aliases||[])]){
        const candidate=norm(value),distance=editDistance(key,candidate,limit);
        if(distance<best){best=distance;match=answer;ambiguous=false}
        else if(distance===best&&match!==answer){ambiguous=true}
      }
    }
    return best<=limit&&!ambiguous?match:null;
  }
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
  let profile={...DEFAULT,...(read(STORAGE)||{})};
  if(!profile.daily||typeof profile.daily!=='object')profile.daily={};
  if(!profile.worldRecords||typeof profile.worldRecords!=='object')profile.worldRecords={};
  if(!Array.isArray(profile.history))profile.history=[];
  let active=read(ACTIVE);
  let bank=[],byId=new Map(),themes=[],sourceDaily=null,sourceError='';
  let starterModes={},starterModeError='';
  let archiveManifest=[], archiveCache=new Map(), archiveError='';
  const dailyDate=()=>sourceDaily?.date||utc();
  const dailyKey=()=>sourceDaily?'source:'+sourceDaily.date:utc();

  let currentView=window.DeepDiveParty?.preferred()?'party':'daily';
  let ticker=null,toastTimer=null,transitioning=false,depthCrank=false,mascotPose='',correction=null,rejectMsg='',lastPhase='',doneTick=null;
  function seed(text){let h=2166136261;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function shuffle(items,text){
    let s=seed(text)||0x123ab4d;
    const a=[...items];function random(){s+=0x6d2b79f5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }
  const todaysQuestions=(day=utc())=>{
    if(sourceDaily&&day===sourceDaily.date)return [...sourceDaily.ids];
    const chosen=shuffle(themes,'daily-theme:'+day).slice(0,7);
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
    /* Phase migration + mid-dive resume rules (pass 3):
       legacy 'question'/'reveal' saves move onto the preview/answering/feedback
       machine; an expired answering timer becomes a timeout feedback so a
       refresh can never freeze the dive. */
    if(active.phase==='question')active.phase='answering';
    if(active.phase==='reveal')active.phase='feedback';
    if(!['preview','answering','feedback'].includes(active.phase))active.phase='preview';
    if(active.phase==='preview'&&!Number.isFinite(active.previewEnds))active.previewEnds=Date.now()+3000;
    if(active.phase==='answering'&&!Number.isFinite(active.deadline))active.deadline=Date.now()+25000;
    if(active.phase==='answering'&&active.deadline<=Date.now()){
      active.results.push({id:active.ids[active.index],answer:'',points:0,tier:null,reason:'Timeout'});
      active.misses=(active.misses||0)+1;active.phase='feedback';save();
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
  function gameOverlays(){
    return `<div class="dd-vignette" aria-hidden="true"></div><div class="dd-crt" aria-hidden="true"></div><div class="dd-edge" aria-hidden="true"></div>`;
  }
  /* The original anchors every ambient fact inside the world column at
     worldY = metres*2-9 (all 21 verified live); they scroll past with the camera. */
  function worldFacts(){
    return AMBIENT.map(([d,text,side,major])=>{
      const L=side==='L';
      return `<div class="dd-amb ${side}${major?' major':''} show" style="--y:${DW.depthToY(d)}px">${L?'<span class="dash">──</span> '+safe(text)+' ':safe(text)+' <span class="dash">──</span>'}</div>`;
    }).join('');
  }
  /* The KRILLION title lives INSIDE the world at top:-336px, so it scrolls
     away as the camera descends — exactly like the original ds-surface. */
  function worldSurface(total){
    return `<div class="dd-surface" style="--y:-336px">
      <div class="dd-title">${window.DeepDiveReference?.titleMarkup?.()||'KRILLION'}</div>
      <div class="dd-tagline">THE DAILY DIVE</div>
      <div class="dd-subline">${total} prompts · 25 seconds each · rarer answers sink deeper</div>
    </div>`;
  }
  function tierTag(t){
    const icon=t.icon?`<img src="./reference-assets/tiers/${t.icon}" alt="" loading="lazy">`:`<i aria-hidden="true">${t.mark}</i>`;
    return `<span class="tag">${icon}${safe(t.label.toUpperCase())} · ${t.score}</span>`;
  }
  /* Round geometry: base = 2*metresBefore, tier lines at base + score/100*2000.
     Lines flash in with the original's 90ms stagger (0/90/180/270/360/450ms). */
  function metresSoFar(){return (active?.score||0)*10}
  function metresBeforeRound(i){let m=0;for(let k=0;k<i&&k<active.results.length;k++)m+=(active.results[k]?.points||0)*10;return m}
  function tierLineMarkup(prevM,t,lit,delay){
    const y=Math.round(DW.tierLineY(prevM,t.score));
    return `<div class="dd-tierline${lit?' lit':''}" style="--y:${y}px;--tc:var(--tier-${t.id});${lit?'transition-delay:'+delay+'ms;':''}">${tierTag(t)}</div>`;
  }
  function roundTierLines(prevM){
    return TIERS.map((t,i)=>tierLineMarkup(prevM,t,true,i*90)).join('');
  }
  const PRACTICE_THEMES={Geography:'atlas',Sports:'gauntlet',Arts:'hollywood',Words:'lexicon'};
  function worldForMode(){
    if(active?.mode==='starter')return STARTER_WORLDS[active.world]||'ocean';
    if(active?.mode==='world')return PRACTICE_THEMES[active.world]||'ocean';
    return 'ocean';
  }
  function themedConfig(id){
    return window.DeepDiveThemes?.config(id)||{height:DW.WORLD_H,floorTop:DW.FLOOR_TOP,scenery:[]};
  }
  function correctionPanel(c){
    return `<div class="dd-preview-pill dd-correction-panel"><span class="dd-correction-change"><span>“${safe(c.raw)}”</span><span class="dd-correction-arrow" aria-hidden="true"> → </span><span class="sr-only">corrects to </span><b>“${safe(c.canonical)}”</b></span><span class="dd-correction-hint">submit again to confirm · or edit</span></div>`;
  }
  function renderHome(){
    const complete=dailyDone(),resume=active?.mode==='daily',date=dailyDate();
    const sourceLabel=sourceDaily?'PUBLIC DAILY #'+sourceDaily.dayNumber+' · '+format(sourceDaily.answerCount)+' PUBLISHER-SCORED ANSWERS':'INDEPENDENT SIDEQUEST DAILY';

    const primaryLabel=resume?'▼ CONTINUE DESCENT ▼':complete?'▼ VIEW DIVE RESULTS ▼':'▼ BEGIN DESCENT ▼';
    const primaryAct=resume?'resume':complete?'dailyResults':'startDaily';
    return `<section class="page deep-home" data-phase="intro" data-world="ocean">
      <div class="dd-sky">${oceanArt()}
        <div class="dd-title-group"><p class="dd-edition">A SIDEQUEST ORIGINAL · ${safe(date)}</p>
          <h1 class="dd-logo" aria-label="Unofficial Krillion recreation">${window.DeepDiveReference?.titleMarkup?.()||"KRILLION"}</h1>
          <p class="dd-subtitle">THE DAILY DIVE</p><p class="dd-tagline">7 prompts · 25 seconds each · rarer answers sink deeper</p>
        </div>
      </div>
      <div class="dd-sea">${oceanDecor()}
        <div class="dd-sea-center">
          <div class="dd-surface-label">◂ HOW DEEP CAN YOUR KNOWLEDGE GO? ▸</div>
          <details class="dd-rules"><summary>▸ HOW TO PLAY</summary><p>Seven prompts, twenty-five seconds per answer. Choose a correct but unusual answer to descend farther. Accepted responses earn 10–100 points; unrecognized answers can be retried until the timer ends. Every player receives the same daily questions.</p></details>
          <button type="button" class="dd-party-btn" data-action="party"><span class="dd-party-tag">BETA · LIMITED TIME</span><span class="dd-party-fish" aria-hidden="true">🐡</span><span>PUFFER PARTY <small class="dd-party-live" id="dd-party-live"><b aria-hidden="true"></b>LIVE MULTIPLAYER · 2–16 PLAYERS</small></span><span class="dd-party-arrow">›</span></button>
          <button type="button" class="dd-begin" data-action="${primaryAct}">${primaryLabel}</button>
          <div class="dd-mode-nav"><span class="dd-dive-number">${sourceDaily?'DIVE #'+sourceDaily.dayNumber:'DAILY · '+safe(date)}</span><button type="button" data-action="archive">ARCHIVE ⟲</button><button type="button" data-action="worlds">THEMED PACKS</button><button type="button" data-action="startEndless">UNLIMITED ∞</button></div>
          <p class="dd-source-note">${safe(sourceLabel)}${!sourceDaily&&sourceError?" · "+safe(sourceError):""}</p>
          <div class="dd-sea-stats"><span>◈ ${format(profile.pearls)} PEARLS</span><span>✦ ${format(profile.streak)} DAY STREAK</span><span>${complete?format(complete.score)+' POINTS TODAY':'FREE DAILY DESCENT'}</span></div>
        </div>
      </div>
    </section>`;
  }
  /* Themed worlds: starter packs map onto the original's themed world variants
     (data-world drives scene tints; the floor image anchors each world). */
  const STARTER_WORLDS={unlimited:'ocean',movies:'hollywood',sports:'gauntlet',geography:'atlas',lexicon:'lexicon'};
  const WORLD_FLOORS={ocean:'./reference-assets/water-bg.webp',hollywood:'./reference-assets/gen/optimized/v1/hollywood/premiere.webp',gauntlet:'./reference-assets/gen/optimized/v1/gauntlet/podium.webp',atlas:'./reference-assets/gen/optimized/v1/bg-trench.webp',lexicon:'./reference-assets/gen/optimized/v1/lexicon/notebook.webp'};
  const FREE_PACKS=[
    ['unlimited','UNLIMITED CLASSIC','First publicly released seven-prompt run','classic.webp'],
    ['movies','AT THE MOVIES','Public starter questions on film','movies.webp'],
    ['sports','SPORTS','Public starter questions on sport','sports.webp'],
    ['geography','GEOGRAPHY','Public starter questions on geography','geography.webp'],
    ['lexicon','WORDS & LANGUAGE','Public prompts; no verified scored list','lexicon.webp']
  ];
  function renderFreeStarters(){
    const cards=FREE_PACKS.map(([mode,label,desc,art])=>{
      const sheet=starterModes[mode],qs=sheet?.questions||[];
      const playable=sheet?.ids?.length||0;
      const answerCount=qs.reduce((n,q)=>n+(q.answers?.length||0),0);
      return `<article class="dd-free-starter-card" style="--pack-art:url('./reference-assets/gen/optimized/v1/cards/${art}')">
        <div class="dd-free-pack-top"><span>PUBLIC STARTER</span><span>${playable}/7 VERIFIED</span></div>
        <h3>${safe(label)}</h3><p>${safe(desc)}</p>
        <small>${format(answerCount)} recorded answers · ${playable} verified prompts</small>
        ${mode==='unlimited'?'':`<details class="dd-public-chapters"><summary>30 CHAPTER SERIES · CHAPTER 1 RECOVERED</summary>
          <div class="dd-public-chapter-list" role="group" aria-label="${safe(label)} chapter index">
            ${Array.from({length:30},(_,i)=>`<button type="button" ${i===0&&playable?'data-action="startStarter" data-starter="'+safe(mode)+'"':'disabled'} title="${i===0?(playable?'Play recovered first chapter':'First chapter not fully verified'):'Chapter '+(i+1)+' answer data not recovered'}" aria-label="Chapter ${i+1} ${i===0&&playable?'playable':'not available'}">${i+1}</button>`).join('')}
          </div>
          <p>Original 30-chapter structure is publicly listed. Only the first chapter has recovered source-backed answers; remaining chapters are not available in this reconstruction.</p>
        </details>`}
        <button type="button" class="dd-free-pack-play" data-action="startStarter" data-starter="${mode}" ${playable?'':'disabled'}>
          ${playable?'PLAY RECOVERED ROUNDS →':'ANSWER DATA NOT VERIFIED'}
        </button></article>`;
    }).join('');
    return `<section class="dd-free-starters">
      <header class="dd-free-starters-heading"><span>RECOVERED PUBLIC MODES</span><h2>THEMED PACKS & UNLIMITED</h2>
        <p>Original publicly served starter prompts with independently indexed scored answers. Rounds with no validated answer list are not presented as playable. These modes are explicitly incomplete wherever fewer than seven scored prompts were recovered.</p>
        ${starterModeError?`<p>${safe(starterModeError)}</p>`:''}
      </header><div class="dd-free-starter-grid">${cards}</div>
    </section>`;
  }
  function renderWorlds(){
    return `<section class="page">${renderFreeStarters()}<div class="page-title"><span class="eyebrow">INDEPENDENT PRACTICE WORLDS</span><h1>Every subject has <em style="color:var(--aqua);font-style:normal">layers.</em></h1><p>Choose a collection, then a chapter. Finish chapters in order and earn pearls from your answers to reach the deeper chapters. All chapters are free to unlock through play.</p></div>
    <div class="surface-card"><div class="progress-top"><div><span class="side-label">Your available discoveries</span><div class="depth-score">${format(profile.pearls)} <span>pearls</span></div></div><div class="side-help">New chapters open as you play. Chapters 2–5 need ${UNLOCK.slice(1).map(format).join(', ')} pearls respectively, plus the preceding chapter in that collection.</div></div></div>
    <div class="worlds-grid">${WORLDS.map(([theme,icon,desc])=>`<article class="world-card"><div class="world-icon" aria-hidden="true">${icon}</div><h3>${safe(theme)}</h3><p>${safe(desc)}</p><div class="chapter-row">${Array.from({length:5},(_,i)=>{
      const key=theme+':'+i,finished=Number.isFinite(profile.worldRecords[key]),prior=i===0||Number.isFinite(profile.worldRecords[theme+':'+(i-1)]),open=profile.pearls>=UNLOCK[i]&&prior;
      return `<button type="button" class="chapter ${finished?'done':open?'':'locked'}" data-action="startWorld" data-world="${safe(theme)}" data-chapter="${i}" ${open?'':`disabled title="Earn ${UNLOCK[i]} pearls and complete the previous chapter"`} aria-label="${safe(theme)} chapter ${i+1} ${open?'open':'locked'}">${finished?'✓':open?i+1:'⌁'}</button>`
    }).join('')}</div></article>`).join('')}</div>
    </section>`;
  }
  function renderArchive(){
    if(!archiveManifest.length)
      return '<section class="page dd-archive"><div class="page-title"><span class="eyebrow">DAILY ARCHIVE</span><h1>Historical <em>dives.</em></h1><p>No verified historical snapshots loaded. '+safe(archiveError||'Please reload the game.')+'</p></div></section>';
    const groups=new Map();
    for(const rec of [...archiveManifest].reverse()){
      const month=rec.date.slice(0,7);
      if(!groups.has(month))groups.set(month,[]);
      groups.get(month).push(rec);
    }
    const months=[...groups].map(([month,dates])=>{
      const heading=new Date(month+'-01T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
      return '<section class="dd-archive-month"><h2>'+safe(heading)+' <small>'+dates.length+' dives</small></h2><div class="dd-archive-grid">'+
        dates.map(rec=>{
          const count=profile.history.filter(x=>x.mode==='archive'&&x.day===rec.date).length;
          return '<button type="button" class="dd-archive-date" data-action="startArchive" data-day="'+safe(rec.date)+'"><strong>#'+Number(rec.dayNumber)+'</strong><span>'+safe(rec.date)+'</span><small>'+Number(rec.acceptedAnswers).toLocaleString('en-US')+' answers'+(count?' · '+count+' played':'')+'</small></button>';
        }).join('')+'</div></section>';
    }).join('');
    return '<section class="page dd-archive"><div class="page-title"><span class="eyebrow">THE DAILY ARCHIVE</span><h1>Revisit past <em>dives.</em></h1><p>'+archiveManifest.length+' recovered historical dives · '+(archiveManifest.length*7)+' original prompts. Every archived answer has its recorded rarity score. Choose a date to practice. These are publicly published historical snapshots from an independent archive, not access to the publisher’s locked archive or private answer service.</p></div>'+months+'</section>';
  }
  async function loadArchiveManifest(){
    try{
      const response=await fetch('./recovered/archive/manifest.json',{cache:'force-cache'});
      if(!response.ok)throw Error('archive manifest HTTP '+response.status);
      const manifest=await response.json();
      if(!Array.isArray(manifest.dates)||manifest.dates.length<100)throw Error('archive collection incomplete');
      archiveManifest=manifest.dates.filter(r=>/^2026-\d{2}-\d{2}$/.test(r.date)&&r.prompts===7&&r.acceptedAnswers>0).map(r=>({...r,dayNumber:Math.round((Date.parse(r.date+'T12:00:00Z')-Date.parse('2026-07-16T12:00:00Z'))/86400000)+1}));
    }catch(e){archiveError='Archive data unavailable. '+(e?.message||'');console.warn(archiveError)}
  }
  async function loadArchiveSheet(day){
    if(archiveCache.has(day))return archiveCache.get(day);
    if(!archiveManifest.some(r=>r.date===day))throw Error('Date not in verified archive');
    const response=await fetch('./recovered/archive/'+encodeURIComponent(day)+'.json',{cache:'force-cache'});
    if(!response.ok)throw Error('Snapshot HTTP '+response.status);
    const data=await response.json();
    if(data.date!==day||!Array.isArray(data.questions)||data.questions.length!==7)throw Error('Invalid snapshot');
    const ids=[];
    for(const source of data.questions){
      if(!/^archive:2026-\d{2}-\d{2}:p[1-7]$/.test(source.id)||!Array.isArray(source.answers)||!source.answers.length)throw Error('Invalid archived question');
      const answers=[],answerIndex=new Map();
      for(const entry of source.answers){
        if(!Array.isArray(entry)||typeof entry[0]!=='string')continue;
        const tier=TIERS.findIndex(t=>t.score===entry[1]);
        if(tier<0)continue;
        const value={value:entry[0],tier,aliases:[],quip:'',source:'published-archive-snapshot'};
        answers.push(value);
        const key=norm(value.value);
        if(key&&!answerIndex.has(key))answerIndex.set(key,value);
      }
      if(!answers.length)throw Error('Empty archived answer set');
      byId.set(source.id,{id:source.id,theme:'Archive #'+data.dayNumber,prompt:source.text,answers,answerIndex});
      ids.push(source.id);
    }
    archiveCache.set(day,ids);
    return ids;
  }
  async function startHistorical(day){
    if(!archiveManifest.some(r=>r.date===day)){notify('That archived date is unavailable.');return}
    try{
      await loadArchiveSheet(day);
      start('archive','',0,day);
    }catch(e){notify('Archive could not load. Please retry.');console.error('Archive load error:',e)}
  }
  async function startArchiveEndless(){
    if(!archiveManifest.length){start('endless');return}
    try{
      const day=utc(),selection=shuffle(archiveManifest,day+':endless:'+Date.now()).slice(0,9);
      const ids=[];
      for(const row of selection)ids.push(...await loadArchiveSheet(row.date));
      if(ids.length<50)throw Error('Less than 50 archived prompts available');
      start('endless','',0,'',shuffle(ids,day+':prompts:'+Date.now()).slice(0,50));
    }catch(e){notify('Could not prepare 50-prompt challenge');console.error('Unlimited load error:',e)}
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
  function start(mode,world='',chapter=0,archiveDate='',forcedIds=[]){
    if(mode==='daily'&&dailyDone()){currentView='daily';render();return}
    const day=mode==='daily'?dailyDate():utc();
    let ids=[];
    if(mode==='daily')ids=todaysQuestions();
    if(mode==='archive'){
      ids=archiveCache.get(archiveDate)||[];
      if(ids.length!==7){notify('Load the historical snapshot first.');return}
    }
    if(mode==='starter')ids=forcedIds;
    if(mode==='endless')ids=forcedIds.length?forcedIds:shuffle(bank,'endless:'+day+':'+Date.now()).slice(0,7).map(q=>q.id);
    if(mode==='world'){
      if(!WORLDS.some(w=>w[0]===world)||!Number.isInteger(chapter)||chapter<0||chapter>4)return;
      if(profile.pearls<UNLOCK[chapter]||(chapter>0&&!Number.isFinite(profile.worldRecords[world+':'+(chapter-1)]))){notify('Complete the previous chapter and earn more pearls first.');return}
      ids=shuffle(bank.filter(q=>q.theme===world),world+':chapter:'+chapter).slice(0,7).map(q=>q.id);
    }
    if(!ids.length)return;
    depthCrank=false;mascotPose='';correction=null;rejectMsg='';
    window.DeepDiveSfx?.event('begin');
    /* Pass 3 phase machine: every round opens in preview (the original's
       3-second "descending · the clock starts in N" pill) before answering. */
    active={mode,world,chapter,source:mode==='starter'?'published-free-starter-index':mode==='archive'||(mode==='endless'&&forcedIds.length)?'published-archive-snapshot':mode==='daily'&&sourceDaily?'krillion-reveal':'sidequest',day:mode==='archive'?archiveDate:day,ids,index:0,phase:'preview',previewEnds:Date.now()+(profile.tourSeen?3000:5200),deadline:0,results:[],score:0,misses:0,startedAt:Date.now()};
    save();currentView=mode==='world'||mode==='starter'?'worlds':mode==='endless'?'endless':mode==='archive'?'archive':'daily';render();
  }
  function currentQ(){return byId.get(active.ids[active.index])}
  function currentTotal(){return active.ids.length}
  function frameHeading(){return active.mode==='daily'?'DAILY DISCOVERY':active.mode==='endless'?'THE ENDLESS EXPEDITION':safe(active.world.toUpperCase()+' · CHAPTER '+(active.chapter+1))}
  function depthZone(){
    const metres=(active?.score||0)*10;
    return metres>=4000?'abyss':metres>=1200?'midnight':metres>=300?'deep':'surface';
  }
  function arcadeHud(){
    const n=currentTotal();
    /* During feedback the original advances the dots and prompt counter to the
       UPCOMING round (observed live: feedback after round 2 shows "PROMPT 3 OF 7"). */
    const curIdx=active.phase==='feedback'?active.index+1:active.index;
    const done=active.phase==='feedback'&&(active.index+1>=n||(active.mode==='endless'&&active.misses>=3));
    const firstVisible=active.ids.length>14?Math.max(0,Math.min(curIdx-5,active.ids.length-14)):0;
    const visibleIds=active.ids.length>14?active.ids.slice(firstVisible,firstVisible+14):active.ids;
    const dots=visibleIds.map((id,offset)=>{
      const i=offset+firstVisible;
      const prior=active.results[i],tier=prior?.tier;
      const state=i<curIdx?'done':i===curIdx?'cur':'';
      const color=prior&&tier!==null&&tier!==undefined?TIERS[tier].color:prior?'#284c6b':i===curIdx?'#ff5288':'#091b38';
      return `<i class="dd-hud-dot${state?' '+state:''}" style="--dot:${color}" title="Round ${i+1}"></i>`;
    }).join('');
    return `<div class="dd-hud"><div class="dd-hud-box"><span>DEPTH</span><strong class="dd-hud-depth${depthCrank?' crank':''}">${format(active.score*10)}<small>m</small></strong></div>
      <div class="dd-hud-progress"><div class="dd-hud-dots">${dots}</div><small>${done?'DIVE COMPLETE':'PROMPT '+(curIdx+1)+' OF '+n}${active.mode==='endless'?' · '+Math.max(0,3-active.misses)+' LIVES':''}</small></div>
      <div class="dd-hud-box dd-hud-score"><span>SCORE</span><strong>${format(active.score)}</strong></div></div>`;
  }
  function dockMarkup(seconds){
    /* Original dock structure (ds-dock): sonar scope with a rotating sweep and
       the countdown digits inside it, input column with a scaleX fuse, and a
       DIVE button that stays disabled until text is entered. */
    return `<form class="answer-form dd-answer-form dd-dock" id="answer-form" autocomplete="off">
      <div class="dd-dock-inner">
        <div class="dd-sonar-wrap"><div class="dd-sonar-scope" id="timer" aria-label="Time remaining"><div class="dd-sweep" aria-hidden="true"></div></div><div class="dd-time-digits" id="seconds">${seconds}</div></div>
        <div class="dd-input-col"><input id="answer-input" class="answer-field dd-input" maxlength="256" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="send" placeholder="type one answer…" aria-label="Your answer" aria-describedby="answer-correction answer-feedback" ${correction?'':'required'} value="${correction?safe(correction.canonical):''}">
          <div class="dd-fuse" aria-hidden="true"><div class="dd-fuse-fill" id="time-fill" style="transform:scaleX(${(seconds/25).toFixed(4)})"></div></div></div>
        <button type="submit" class="dd-submit dd-dive-btn"${correction?'':' disabled'}>DIVE</button>
      </div>
      <button class="dd-skip" type="button" data-action="pass">SKIP</button>
      <div class="feedback" role="status" id="answer-feedback" aria-live="polite"></div>
    </form>`;
  }
  function renderDive(){
    const feedback=active.phase==='feedback',preview=active.phase==='preview';
    const q=currentQ();
    const round=active.index;
    const last=feedback?active.results[active.results.length-1]||{points:0,answer:'',tier:null,reason:'No answer'}:null;
    const tier=feedback&&last.tier!==null&&last.tier!==undefined?TIERS[last.tier]:null;
    const prevM=feedback?metresBeforeRound(round):metresSoFar();
    const baseY=Math.round(DW.roundBase(prevM));
    const seconds=Math.max(0,Math.ceil(((active.deadline||Date.now())-Date.now())/1000));
    const completed=feedback&&(active.index+1>=currentTotal()||(active.mode==='endless'&&active.misses>=3));
    const tc=tier?`var(--tier-${tier.id})`:'var(--tier-miss)';
    const lineY=tier?Math.round(DW.tierLineY(prevM,tier.score)):Math.round(DW.missBannerY(prevM));
    const spawnY=Math.round(DW.chipSpawnY(prevM));
    const chipText=tier?'\u201c'+safe(last.answer).toUpperCase()+'\u201d':last?(last.reason==='Timeout'?'NO ANSWER':'NOTHING LANDED'):'';
    const sub=tier?(last.quip||tier.blurb):last?(last.reason==='Timeout'?'the clock beat you to it.':'never made it onto the reef.'):'';
    const pillLeft=Math.max(0,Math.ceil(((active.previewEnds||Date.now())-Date.now())/1000));
    const worldId=worldForMode(),worldMeta=themedConfig(worldId);
    return `<section class="page deep-home dd-game-screen${feedback?' dd-reveal-screen':''}${active.mode==='starter'?' dd-free-starter-play':''}" data-phase="${active.phase}" data-world="${worldId}" data-world-height="${worldMeta.height}" data-pack="${active.mode==='starter'?safe(active.world):''}" data-zone="${depthZone()}">
      <div class="dd-stage">
        <div class="dd-sea dd-game-sea"></div>
        <div class="dd-world" style="--dd-world-height:${worldMeta.height}px">
          <div class="dd-world-surface-sky" aria-hidden="true"></div>
          ${worldSurface(currentTotal())}
          ${window.DeepDiveThemes?.scenery(worldId)||''}
          <img class="dd-floor" src="${WORLD_FLOORS[worldId]||WORLD_FLOORS.ocean}" alt="" loading="lazy" style="--y:${worldMeta.floorTop}px">
          ${worldFacts()}
          ${feedback&&tier?roundTierLines(prevM):''}
          <div class="dd-game-prompt dd-card" style="--y:${baseY}px;animation-delay:.45s"><span class="dd-prompt-label rnd">PROMPT ${round+1} OF ${currentTotal()}${active.mode==='daily'?'':(' · '+safe(q.theme))}</span>
            <h1 class="dd-prompt-text prompt">${safe(q.prompt)}</h1><p class="dd-prompt-hint hint">▼ rarer answers sink deeper ▼</p></div>
          ${feedback&&tier?`<div class="dd-chip${tier.score===100?' gold':''}" style="--cc:${tc};--y:${lineY}px" data-y="${lineY}" data-spawn="${spawnY}">${chipText}</div>`:''}
          ${feedback?`<div class="dd-landed${tier?'':' miss'}" style="--tc:${tc};top:${lineY}px">
            ${tier?(tier.id==='plankton'||tier.id==='tooclever'
              ?`<span class="icon dd-tier-emoji" aria-hidden="true">${safe(tier.mark)}</span>`
              :`<img class="icon" src="./reference-assets/tiers/${tier.id}.png" alt="" loading="lazy">`):''}
            <div class="tname">${tier?safe(tier.label.toUpperCase()):'NOTHING LANDED'}</div>
            <div class="tans">${tier?'\u201c'+safe(last.answer)+'\u201d':safe(last.reason==='Timeout'?'the clock beat you to it.':'no answer this round')}</div>
            <div class="tpts"><b>+${last.points} PTS</b> · sink ${format(last.points*10)}m</div>
            <div class="tsub">${safe(sub)}</div>
          </div>`:''}
        </div>
        ${gameOverlays()}
        <div class="dd-flash${feedback?' on':''}" aria-hidden="true"></div>
        ${arcadeHud()}
        <div class="dd-game-fish${mascotPose?' '+mascotPose:''}${feedback&&!tier?' sad':''}${tier&&tier.score===100?' gold':''}" title="a friend" aria-hidden="true"><span class="dd-blub">blub!</span></div>
      </div>
      ${preview?`<div class="dd-preview-pill">descending · the clock starts in <b>${pillLeft}</b>${!profile.tourSeen?' · rarer answers sink deeper':''}</div>`:''}
      <div class="dd-reject" id="dd-reject-line" role="status" aria-live="polite">${safe(rejectMsg)}</div>
      <div id="answer-correction" class="dd-correction" role="status" aria-live="polite" aria-atomic="true">${correction?correctionPanel(correction):''}</div>
      ${preview?'':dockMarkup(seconds)}
      ${feedback?`<div class="dd-next-wrap"><button type="button" class="dd-next-btn" data-action="next">${completed?'SURFACE ▲':'DESCEND ▼'}</button></div>`:''}
      </section>`;
  }
  function conclude(){
    if(!active)return;
    const r={mode:active.mode,source:active.source,day:active.day,score:active.score,count:active.results.length,results:active.results.map(x=>({...x})),label:active.mode==='daily'?(active.source==='krillion-reveal'?'Public-source daily dive':'Daily discovery'):active.mode==='endless'?'Endless expedition':active.mode==='archive'?'Archive · '+active.day:active.mode==='starter'?'Public '+active.world+' starter':active.world+' · Chapter '+(active.chapter+1),world:active.world,chapter:active.chapter};
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
    window.DeepDiveSfx?.event('surface');
    active=null;save();currentView=r.mode==='daily'?'daily':r.mode==='world'||r.mode==='starter'?'worlds':r.mode==='archive'?'archive':'endless';renderSummary(r);
  }
  function roundEnd(record){
    if(!active||active.phase!=='answering'||transitioning)return;
    transitioning=true;active.phase='feedback';
    active.results.push(record);active.score+=record.points;
    if(record.points===0)active.misses++;
    depthCrank=record.points>0;
    mascotPose=record.points===100?'celebrate':record.points===0?'faint':record.points>=60?(Math.random()<.5?'jet':'chomp'):'dart';
    correction=null;rejectMsg='';
    window.DeepDiveSfx?.event(record.points===0?'miss':record.points===100?'krillion':record.points>=85?'land_big':record.points>=60?'land_small':'tierline');
    if(record.points>0)window.DeepDiveSfx?.event('sink');
    clearInterval(ticker);save();transitioning=false;render();
  }
  function pass(reason='Pass'){roundEnd({id:currentQ().id,answer:'',points:0,tier:null,reason})}
  function syncDiveBtn(form){
    const input=form?.querySelector?.('#answer-input'),btn=form?.querySelector?.('.dd-dive-btn');
    if(input&&btn)btn.disabled=!String(input.value||'').trim();
  }
  function submit(form){
    if(!active||active.phase!=='answering'||transitioning)return;
    if(Date.now()>=active.deadline){pass('Timeout');return}
    const input=form.querySelector('#answer-input');
    const answer=String(input?.value||'').trim().slice(0,256);
    if(!answer)return;
    window.DeepDiveSfx?.event('submit_soft');
    const key=norm(answer),q=currentQ();
    const found=q.answerIndex?.get(key)||findAnswer(q,key);
    if(!found){
      rejectMsg='\u201c'+answer+'\u201d: no echo. try again';
      const line=document.getElementById('dd-reject-line');
      if(line){
        line.textContent=rejectMsg;
        line.classList.remove('dd-reject-shake');void line.offsetWidth;line.classList.add('dd-reject-shake');
      }
      const feedback=document.getElementById('answer-feedback');
      if(feedback)feedback.textContent='';
      window.DeepDiveSfx?.event('reject');
      if(window.DeepDiveReference?.preferences?.clearRejected)input.value='';
      else input.select();
      syncDiveBtn(form);
      return;
    }
    const corrected=!q.answerIndex?.has(key);
    const tier=Math.max(0,Math.min(5,Number(found.tier)||0));
    /* Original answer corrections are a TWO-STEP preview (settings copy:
       "Preview corrected answers before scoring. Off accepts them immediately."):
       the input is rewritten to the canonical answer and the player submits
       again to confirm — or edits. */
    if(corrected&&window.DeepDiveReference?.preferences?.answerCorrections!==false&&correction?.canonical!==found.value){
      correction={raw:answer,canonical:found.value};
      if(input){input.value=found.value;input.select()}
      const pill=document.getElementById('answer-correction');
      if(pill)pill.innerHTML=correctionPanel(correction);
      const feedback=document.getElementById('answer-feedback');
      if(feedback)feedback.textContent='';
      window.DeepDiveSfx?.event('category');
      syncDiveBtn(form);
      return;
    }
    rejectMsg='';correction=null;
    roundEnd({id:q.id,answer:found.value,points:TIERS[tier].score,tier,quip:found.quip||'',reason:'Accepted'});
  }
  function next(){
    if(!active||active.phase!=='feedback'||transitioning)return;
    transitioning=true;
    const card=root.querySelector('.dd-landed')||root.querySelector('.dd-landed-banner');
    const chip=root.querySelector('.dd-chip');
    const leave=()=>{
      transitioning=false;
      if(!active||active.phase!=='feedback')return;
      if(active.index+1>=active.ids.length||(active.mode==='endless'&&active.misses>=3)){conclude();return}
      window.DeepDiveSfx?.event('descend');
      depthCrank=false;
      active.index++;active.phase='preview';active.previewEnds=Date.now()+(profile.tourSeen?3000:5200);active.deadline=0;mascotPose='';correction=null;rejectMsg='';save();render();
    };
    if(!card||window.matchMedia('(prefers-reduced-motion: reduce)').matches){leave();return}
    card.classList.add('dd-card-leaving');
    if(chip)chip.classList.add('dd-chip-leaving');
    setTimeout(leave,280);
  }
  function updateClock(){
    if(!active)return;
    if(active.phase==='preview'){
      const remain=Math.max(0,active.previewEnds-Date.now());
      const b=document.querySelector('.dd-preview-pill b');
      if(b)b.textContent=String(Math.ceil(remain/1000));
      if(remain<=0){
        if(!profile.tourSeen)profile.tourSeen=1;
        active.phase='answering';active.deadline=Date.now()+25000;save();render();
      }
      return;
    }
    if(active.phase!=='answering')return;
    const remain=Math.max(0,active.deadline-Date.now()),s=Math.ceil(remain/1000);
    const el=document.getElementById('seconds'),bar=document.getElementById('time-fill'),timer=document.getElementById('timer');
    const screen=root.querySelector('.dd-game-screen');
    if(el)el.textContent=String(s);
    if(bar)bar.style.transform='scaleX('+(remain/25000).toFixed(4)+')';
    if(timer)timer.classList.toggle('warn',s<=7);
    if(screen){
      screen.classList.toggle('dd-hot',s<=7);
      screen.classList.toggle('dd-danger',s<=5);
      /* --dd-urgency ramps 0→1 across the 25s window (observed live as
         --ds-urgency) and drives the edge/digits/fuse intensity via CSS. */
      screen.style.setProperty('--dd-urgency',(1-remain/25000).toFixed(3));
    }
    window.DeepDiveSfx?.tick(s);
    if(remain<=0)pass('Timeout');
  }
  function resultDots(results){
    return results.map(r=>{
      const t=r.tier!==null&&r.tier!==undefined?TIERS[r.tier]:null;
      return `<div class="summary-dot" style="--tier:${t?t.color:'#536e7a'}" title="${safe(t?t.label:'Unanswered')}: ${r.points} points">${t?t.mark:'×'}</div>`
    }).join('');
  }
  function msToNextDaily(){
    /* Milliseconds until the next midnight in the publisher's daily timezone
       (America/New_York), matching the original's "NEXT DIVE IN hh:mm:ss". */
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());
      const [h,m,s]=parts.split(':').map(Number);
      const used=((h%24)*3600+m*60+s)*1000;
      return 86400000-used;
    }catch{return 86400000}
  }
  function startNextDiveTicker(){
    if(doneTick)clearInterval(doneTick);
    const paint=()=>{
      const el=document.getElementById('dd-next-dive');
      if(!el){if(doneTick){clearInterval(doneTick);doneTick=null}return}
      const ms=msToNextDaily();
      const h=String(Math.floor(ms/3600000)).padStart(2,'0'),m=String(Math.floor(ms/60000)%60).padStart(2,'0'),s=String(Math.floor(ms/1000)%60).padStart(2,'0');
      el.textContent=h+':'+m+':'+s;
    };
    paint();doneTick=setInterval(paint,1000);
  }
  function startDoneCamera(finalM){
    /* Done-phase surfacing: the camera glides from the final depth back toward
       the title, with a gold flash — the original's gold ds-flash + surfacing. */
    const world=root.querySelector('.dd-world'),stage=root.querySelector('.dd-stage');
    if(!world||!window.DeepDiveWorld?.camera)return;
    const h=stage?.getBoundingClientRect().height||root.querySelector('.dd-done-screen')?.getBoundingClientRect().height||700;
    const A=window.DeepDiveWorld.anchorsFor(h);
    const cam=window.DeepDiveWorld.camera;
    cam.attach(world,h);
    cam.snapTo(A.feedback-2*finalM);
    cam.goTo(A.done,{dur:3400});
  }
  function scoreTrail(results){
    const scores=results.map(x=>Math.max(0,Math.min(100,Number(x.points)||0)));
    if(!scores.length)return '';
    const unit=scores.length>1?436/(scores.length-1):0;
    const pts=scores.map((score,i)=>({x:22+i*unit,y:24+(100-score)*1.09,score}));
    const path=pts.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
    return `<div class="dd-score-trail" aria-label="Recorded score for each of your ${scores.length} answers">
      <div class="dd-score-trail-head"><span>YOUR DIVE LOG · DEEPER = RARER</span><span>${scores.length} ROUNDS</span></div>
      <svg viewBox="0 0 480 172" role="img" aria-label="Your answer rarity scores, displayed as points from 0 to 100">
        ${[24,78.5,133].map(y=>`<line class="dd-score-trail-grid" x1="12" x2="469" y1="${y}" y2="${y}"></line>`).join('')}
        <polyline class="dd-score-trail-line" points="${path}"></polyline>
        ${pts.map((p,i)=>`<circle class="dd-score-trail-marker" cx="${p.x}" cy="${p.y}" r="4"><title>Round ${i+1}: ${p.score} points</title></circle>
          <text class="dd-score-trail-point-label" x="${p.x}" y="${Math.max(12,p.y-10)}" text-anchor="middle">${p.score}</text>
          <text class="dd-score-trail-round" x="${p.x}" y="165" text-anchor="middle">${i+1}</text>`).join('')}
      </svg>
      <p class="dd-score-trail-note">Your recorded answers only · not a global percentile</p>
    </div>`;
  }
  function renderSummary(r){
    clearInterval(ticker);if(doneTick)clearInterval(doneTick);doneTick=null;syncHead();
    const isDaily=r.mode==='daily',max=r.count*100,finalM=Math.round(r.score*10);
    const diveNo=isDaily&&r.source==='krillion-reveal'&&sourceDaily?'DIVE #'+sourceDaily.dayNumber+' COMPLETE':isDaily?'DAILY DIVE COMPLETE':r.mode==='endless'?'ENDLESS DIVE COMPLETE':r.mode==='archive'?'ARCHIVE DIVE · '+safe(r.day).toUpperCase()+' COMPLETE':r.mode==='starter'?safe((r.world||'').toUpperCase())+' STARTER COMPLETE':safe(r.world.toUpperCase())+' · CHAPTER '+((r.chapter||0)+1)+' COMPLETE';
    const text=`Deep Dive · ${r.label} · ${r.day}\n${r.score}/${max} points · ${format(r.score*10)}m of depth\n${r.results.map(x=>x.points?'◆':'◇').join('')}\nPlay on Sidequest`;
    const bearingRow=b=>{
      const hit=r.score>=b[0]&&r.score<=b[1];
      return `<div class="dd-bearing-row${hit?' hit':''}"><b>${b[1]===Infinity?'450+':b[0]+'–'+b[1]}</b><span>${safe(b[2])}</span></div>`;
    };
    const catchRow=(res,i)=>{
      const t=res.tier!==null&&res.tier!==undefined?TIERS[res.tier]:null;
      const q=byId.get(res.id);
      return `<div class="dd-catch-row"><span class="n">${i+1}</span><div class="p"><small>${safe(q?.prompt||'')}</small><b>${t?'\u201c'+safe(res.answer)+'\u201d':'—'}</b></div><span class="pts" style="--tier:${t?t.color:'#536e7a'}">${t?t.mark+' +'+res.points:'+0'}</span></div>`;
    };
    const avg=profile.history.length?Math.round(profile.history.reduce((s,x)=>s+(x.score||0),0)/profile.history.length):0;
    const best=profile.history.reduce((m,x)=>Math.max(m,x.score||0),0);
    const rating=Number(profile.ratings?.[utc()]||0);
    const zone=finalM>=4000?'abyss':finalM>=1200?'midnight':finalM>=300?'deep':'surface';
    const doneWorld=r.mode==='starter'?STARTER_WORLDS[r.world]||'ocean':r.mode==='world'?PRACTICE_THEMES[r.world]||'ocean':'ocean';
    const doneConfig=themedConfig(doneWorld);
    root.innerHTML=`<section class="page deep-home dd-game-screen dd-done-screen" data-phase="done" data-world="${doneWorld}" data-zone="${zone}">
      <div class="dd-stage">
        <div class="dd-sea dd-game-sea"></div>
        <div class="dd-world" style="--dd-world-height:${doneConfig.height}px">
          <div class="dd-world-surface-sky" aria-hidden="true"></div>
          ${worldSurface(r.count)}
          ${window.DeepDiveThemes?.scenery(doneWorld)||''}
          <img class="dd-floor" src="${WORLD_FLOORS[doneWorld]||WORLD_FLOORS.ocean}" alt="" loading="lazy" style="--y:${doneConfig.floorTop}px">
          ${worldFacts()}
        </div>
        ${gameOverlays()}
        <div class="dd-flash gold on" aria-hidden="true"></div>
        <div class="dd-hud"><div class="dd-hud-box"><span>DEPTH</span><strong class="dd-hud-depth crank">${format(finalM)}<small>m</small></strong></div><div class="dd-hud-progress"><div class="dd-hud-dots">${r.results.map(x=>`<i class="dd-hud-dot done" style="--dot:${x.tier!==null&&x.tier!==undefined?TIERS[x.tier].color:'#284c6b'}"></i>`).join('')}</div><small>DIVE COMPLETE</small></div><div class="dd-hud-box dd-hud-score"><span>SCORE</span><strong>${format(r.score)}</strong></div></div>
        <div class="dd-game-fish gold" title="a friend" aria-hidden="true"><span class="dd-blub">blub!</span></div>
      </div>
      <div class="dd-done"><div class="dd-done-inner">
        <div class="dd-done-head"><span class="dd-done-krill">KRILLION</span><span class="dd-done-sub">${diveNo}</span></div>
        <div class="dd-done-score"><span class="big">${format(r.score)}</span><span class="m">−${format(finalM)}m</span></div>
        ${scoreTrail(r.results)}
        <div class="dd-done-bands"><h3>THE BEARING</h3>${BEARING.map(bearingRow).join('')}</div>
        <div class="dd-done-catch"><h3>THE CATCH · DEEPER = RARER</h3>${r.results.map(catchRow).join('')}</div>
        <div class="dd-done-log"><h3>LOGBOOK</h3><p>STREAK ${format(profile.streak)} · PLAYED ${format(profile.runs)} · AVG ${format(avg)} · BEST ${format(best)}</p><p class="dd-next-dive">NEXT DIVE IN <b id="dd-next-dive">--:--:--</b></p></div>
        <div class="result-actions">${button('share','COPY RESULT','primary')}${button('startEndless','KEEP DIVING ∞','ghost')}${button('archive','ARCHIVE ⟲','ghost')}${button('worlds','THEMED PACKS →','ghost')}</div>
        <div class="dd-done-rate"><h3>HOW WAS THAT DIVE? 1 = MEH · 5 = GREAT</h3><div class="dd-rate-row">${[1,2,3,4,5].map(n=>`<button type="button" class="dd-rate${rating>=n?' on':''}" data-action="rate" data-rating="${n}" aria-label="Rate ${n} out of 5">${n}</button>`).join('')}</div></div>
        <p class="helper">${r.source==='krillion-reveal'?'Scores and result messages from the publisher’s public reveal; extra autocorrect aliases are not included.':(r.source==='published-free-starter-index'?'Original free starter prompts with independently indexed scored responses; not the original live validator.':r.source==='published-archive-snapshot'?'Recorded answer scores from the independent historical snapshot. Scores and aliases may differ from the publisher’s present validator.':'Independent Sidequest prompts with estimated rarity.')} Progress stays on this device.</p>
      </div></div>
    </section>`;
    root.dataset.share=text;
    window.DeepDiveScene?.refresh?.();
    window.DeepDiveScene?.setDepth(r.score);
    startDoneCamera(finalM);
    startNextDiveTicker();
  }
  function hookWorldCamera(animate){
    /* Camera targets recovered live: answering anchor ≈23% of stage height,
       landing reveal ≈37.8%, miss reveal ≈29%; t = anchor − 2×depthM, with
       DeepDiveWorld's ease + idle drift doing the motion. */
    const stage=root.querySelector('.dd-stage'),world=root.querySelector('.dd-world');
    if(!world||!window.DeepDiveWorld?.camera)return;
    const h=stage?.getBoundingClientRect().height||root.querySelector('.dd-game-screen')?.getBoundingClientRect().height||700;
    const A=window.DeepDiveWorld.anchorsFor(h);
    const last=active.results[active.results.length-1];
    const landed=last&&last.points>0;
    const target=(active.phase==='feedback'?(landed?A.feedback:A.miss):A.answering)-2*metresSoFar();
    const cam=window.DeepDiveWorld.camera;
    cam.attach(world,h);
    if(!animate){cam.snapTo(target);return}
    if(active.phase==='preview'){cam.goTo(target,{dur:2900,hold:350});return}
    cam.goTo(target,{});
  }
  function hookChipSink(){
    /* The chip spawns 180px below the round base and sinks onto its tier line
       while the camera eases after it (observed live). */
    const chip=root.querySelector('.dd-chip');
    if(!chip)return;
    const spawn=Number(chip.dataset.spawn||0);
    const top=Number(chip.dataset.y||0)||parseFloat(getComputedStyle(chip).getPropertyValue('--y'))||0;
    chip.style.setProperty('--chip-drop',(spawn-top)+'px');
    requestAnimationFrame(()=>requestAnimationFrame(()=>chip.style.setProperty('--chip-drop','0px')));
  }
  function render(){
    clearInterval(ticker);if(doneTick)clearInterval(doneTick);doneTick=null;syncHead();oldActiveCheck();
    if(currentView==='party'){window.DeepDiveParty?.mount({root});lastPhase='';return}else window.DeepDiveParty?.unmount();
    if(active&&((currentView==='daily'&&active.mode==='daily')||(currentView==='endless'&&active.mode==='endless')||(currentView==='worlds'&&(active.mode==='world'||active.mode==='starter'))||(currentView==='archive'&&active.mode==='archive'))){
      const animate=lastPhase!==''&&lastPhase!==active.phase;
      try{
        root.innerHTML=renderDive();
      }catch(err){
        /* Never leave a dead screen mid-dive: surface the error and fall back
           to the intro so the player can restart. */
        console.error('renderDive failed',err);
        active=null;save();lastPhase='';currentView='daily';root.innerHTML=renderHome();
        window.DeepDiveScene?.refresh?.();
        return;
      }
      lastPhase=active.phase;
      if(active.phase==='preview'||active.phase==='answering'){
        ticker=setInterval(updateClock,120);
        if(active.phase==='answering')setTimeout(()=>{const input=document.getElementById('answer-input');if(input&&window.matchMedia('(pointer:fine)').matches)input.focus()},80);
        updateClock();
      }
      hookWorldCamera(animate);
      hookChipSink();
      if(active.phase==='feedback'){
        const last=active.results[active.results.length-1];
        if(last&&!last.points){
          const stage=root.querySelector('.dd-stage');
          if(stage){stage.classList.add('dd-stage-shake');setTimeout(()=>stage.classList.remove('dd-stage-shake'),700)}
        }
      }
    }else{
      lastPhase='';
      if(currentView==='worlds')root.innerHTML=renderWorlds();
      else if(currentView==='archive')root.innerHTML=renderArchive();
      else if(currentView==='stats')root.innerHTML=renderStats();
      else if(currentView==='daily')root.innerHTML=renderHome();
      else if(currentView==='endless')root.innerHTML=`<section class="page"><div class="home-hero"><div><span class="eyebrow">ENDLESS EXPEDITION</span><h1 class="section-heading">How deep can <em>you go?</em></h1><p class="lead">Each extended dive draws up to 50 published historical prompts. You have 25 seconds per answer and three lives. Every zero-point round costs a life.</p><div class="hero-actions">${button('startEndless','Begin an endless run','primary')}${button('daily','Back to daily','ghost')}</div><p class="helper">Up to 50 prompts per dive <span class="divider-dot">·</span> Three lives <span class="divider-dot">·</span> Unlimited attempts</p></div><div class="ocean-display">${bubbles()}<div class="diver-mark">∞</div><div class="ocean-caption"><span>YOUR RECORD</span><strong>${format(profile.endlessBest)} pts</strong></div></div></div></section>`;
    }
    window.DeepDiveScene?.refresh?.();
    window.DeepDiveScene?.setDepth(active?.score||0);
    root.focus({preventScroll:true});
  }
  root.addEventListener('submit',e=>{if(e.target.id!=='answer-form')return;e.preventDefault();submit(e.target)});
  root.addEventListener('input',e=>{if(e.target?.id==='answer-input')syncDiveBtn(e.target.closest('form'))});
  root.addEventListener('click',e=>{
    const b=e.target.closest('button[data-action]');if(!b||b.disabled)return;
    switch(b.dataset.action){
      case 'startDaily':if(active?.mode==='daily'){currentView='daily';render()}else start('daily');break;
      case 'startEndless':if(active?.mode==='endless'){currentView='endless';render()}else void startArchiveEndless();break;
      case 'startArchive':void startHistorical(b.dataset.day||'');break;
      case 'startStarter':startStarter(b.dataset.starter||'');break;
      case 'startWorld':{
        const world=b.dataset.world,chapter=Number(b.dataset.chapter);
        if(active?.mode==='world'&&active.world===world&&active.chapter===chapter){currentView='worlds';render()}else start('world',world,chapter);break;
      }
      case 'resume':currentView=active?.mode==='daily'?'daily':currentView;render();break;
      case 'dailyResults':{const d=dailyDone();if(d)renderSummary(d);break}
      case 'pass':pass();break;
      case 'next':next();break;
      case 'daily':case 'endless':case 'worlds':case 'archive':case 'stats':case 'party':currentView=b.dataset.action;render();break;
      case 'rate':{
        const n=Math.max(1,Math.min(5,Number(b.dataset.rating)||0));
        if(!profile.ratings||typeof profile.ratings!=='object')profile.ratings={};
        profile.ratings[utc()]=n;save();
        root.querySelectorAll('.dd-rate').forEach(x=>x.classList.toggle('on',Number(x.dataset.rating)<=n));
        notify('Thanks for rating this dive.');
        break;
      }
      case 'share':{
        const value=root.dataset.share||'';
        if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>notify('Result copied. Share your discovery!')).catch(()=>notify('Clipboard is unavailable in this browser.'));
        else notify('Clipboard is unavailable in this browser.');
        break;
      }
    }
  });
  document.querySelectorAll('.nav-pill').forEach(b=>b.addEventListener('click',()=>{
    document.querySelector('.dd-nav-toggle')?.removeAttribute('open');currentView=b.dataset.view;render();
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
  async function loadFreeStarters(){
    try{
      const response=await fetch('./recovered/free-starters.json',{cache:'force-cache'});
      if(!response.ok)throw Error('Starter index HTTP '+response.status);
      const data=await response.json();
      if(!data?.modes||typeof data.modes!=='object')throw Error('Missing starter data');
      const scoreIndex=new Map(TIERS.map((t,i)=>[t.score,i]));
      for(const [mode,sheet] of Object.entries(data.modes)){
        if(!FREE_PACKS.some(x=>x[0]===mode)||!Array.isArray(sheet.questions)||sheet.questions.length!==7)continue;
        const ids=[];
        for(const q of sheet.questions){
          if(!q.verified||!Array.isArray(q.answers)||!q.answers.length)continue;
          const answers=[],answerIndex=new Map();
          for(const record of q.answers){
            const tier=scoreIndex.get(record[1]);
            if(tier===undefined||typeof record[0]!=='string')continue;
            const entry={value:record[0],tier,aliases:[],quip:'',source:'independent-public-starter-index'};
            answers.push(entry);
            const key=norm(entry.value);
            if(key&&!answerIndex.has(key))answerIndex.set(key,entry);
          }
          if(!answers.length)continue;
          byId.set(q.id,{id:q.id,theme:mode.toUpperCase(),prompt:q.text,answers,answerIndex});
          ids.push(q.id);
        }
        starterModes[mode]={questions:sheet.questions,ids};
      }
    }catch(error){
      starterModeError='Verified public starter lists could not load.';
      console.warn('Source starters unavailable',error);
    }
  }
  function startStarter(mode){
    const sheet=starterModes[mode];
    if(!sheet||!sheet.ids?.length){notify('No validated scored starter rounds for this mode.');return}
    start('starter',mode,0,'',sheet.ids);
  }
  async function loadPartyLiveCount(){
    try{
      const response=await fetch('/api/deep-dive/party?list=1',{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      const playing=(data.rooms||[]).reduce((n,r)=>n+(r.members||0),0);
      const el=document.getElementById('dd-party-live');
      if(el&&playing>0)el.innerHTML='<b aria-hidden="true"></b>'+format(playing)+' IN OPEN LOBBIES';
    }catch{
      /* independent backend unreachable from a static context — keep default label */
    }
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
    await Promise.all([loadSourceDaily(),loadArchiveManifest(),loadFreeStarters()]);
    void loadPartyLiveCount();
    if(active&&['archive','endless'].includes(active.mode)){
      const days=[...new Set(active.ids.filter(id=>id.startsWith('archive:')).map(id=>id.split(':')[1]))];
      for(const d of days){
        try{await loadArchiveSheet(d)}catch(e){console.warn('Could not resume source-backed dive for',d,e)}
      }
    }
    oldActiveCheck();render();
  }).catch(e=>{
    root.innerHTML=`<div class="notice" style="margin:35px 0"><strong>We couldn’t load the question bank.</strong><p>${safe(e.message)}</p><button class="btn" type="button" onclick="location.reload()">Try again</button></div>`;
  });
})();
