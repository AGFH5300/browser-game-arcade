/* Original-versus-recreation MOTION timeline audit.
 * Browser geometry is captured at relative timestamps, rather than treating
 * a single settled screenshot as proof of animation parity.
 */
import fs from 'node:fs';
import {chromium} from 'playwright';
const output=process.env.KRILLION_MOTION_DIR||'/tmp/krillion-motion-timeline';
fs.mkdirSync(output,{recursive:true});
const originalBase=process.env.KRILLION_ORIGINAL_URL||'https://krillion.io';
const candidateBase=process.env.KRILLION_CANDIDATE_URL||'http://127.0.0.1:8765';
const answer=process.env.KRILLION_AUDIT_ANSWER||'Selena Gomez';
const browser=await chromium.launch({headless:true});
const report=[];
async function geometry(page,site,phase){
 const keys=site==='original'?
  phase==='home'?{logo:'.ds-title',begin:'.ds-begin-btn',mascot:'.ds-mascot',stage:'.ds-stage',water:'.ds-sea'}:
  {mascot:'.ds-mascot',prompt:'.ds-card',chip:'.ds-chip',world:'.ds-world',dock:'.ds-dock',stage:'.ds-stage'}:
  phase==='home'?{logo:'.dd-logo',begin:'.dd-begin',mascot:'.dd-source-mascot-anchor',stage:'.dd-sea',water:'.dd-reference-sea-canvas'}:
  {mascot:'.dd-game-fish',prompt:'.dd-game-prompt',chip:'.dd-chip',world:'.dd-world',dock:'.dd-dock',stage:'.dd-stage'};
 return await page.evaluate(keys=>{
  const nodes={};
  for(const [key,selector] of Object.entries(keys)){
   const el=document.querySelector(selector);
   if(!el){nodes[key]=null;continue}
   const b=el.getBoundingClientRect(),s=getComputedStyle(el);
   nodes[key]={rect:[b.x,b.y,b.width,b.height].map(n=>+n.toFixed(2)),
    transform:s.transform,translate:s.translate,animation:s.animationName,
    duration:s.animationDuration,delay:s.animationDelay,timing:s.animationTimingFunction,
    opacity:s.opacity,display:s.display,visibility:s.visibility};
  }
  return nodes;
 },keys);
}
async function capture(page,site,width,phase,steps){
 const frames=[],last=performance.now();
 for(const [i,ms] of steps.entries()){
  if(i>0)await page.waitForTimeout(Math.max(0,last+ms-performance.now()));
  const nodes=await geometry(page,site,phase);
  frames.push({t:ms,elapsed:Math.round(performance.now()-last),nodes});
  if([0,550,1900,4300].includes(ms))await page.screenshot({path:output+'/'+width+'-'+site+'-'+phase+'-'+ms+'.png',animations:'allow'});
 }
 return frames;
}
async function run(site,width){
 const page=await browser.newPage({viewport:{width,height:width===390?844:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const result={site,width,errors};
 try{
  await page.addInitScript(()=>{
   let seed=0x71431b;
   Math.random=()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296};
  });
  if(site==='replica'&&process.env.KRILLION_TEST_LOCAL_DAILY!=='0'){
   // The CI static server has no Next.js API, so inject a source-tracked
   // published Daily snapshot solely inside the test browser. Otherwise
   // Sidequest silently selects an unrelated fallback question and no
   // animation comparison is meaningful.
   const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const snapshot=await page.request.get(candidateBase+'/play/deep-dive/recovered/archive/'+date+'.json');
   if(!snapshot.ok())throw Error('Source-tracked local daily snapshot is missing: '+date);
   const archive=await snapshot.json();
   const labels={10:'plankton',15:'tooclever',30:'schooler',60:'rare',85:'deepcut',100:'krillion'};
   const sheet={date,dayNumber:archive.dayNumber,prompts:archive.questions.map((q,i)=>({
    id:q.id||'p'+(i+1),text:q.text,
    answers:q.answers.filter(a=>labels[a[1]]).map(a=>({answer:a[0],tier:labels[a[1]],score:a[1],quip:''}))
   }))};
   if(sheet.prompts.length!==7)throw Error('Invalid local source-tracked published daily fixture');
   await page.route('**/api/deep-dive/public-daily',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify(sheet)
   }));
   result.dailyFixture={date,prompt:sheet.prompts[0].text,answerRows:sheet.prompts[0].answers.length};
  }
  await page.goto(site==='original'?originalBase:candidateBase+'/play/deep-dive/index-public-art.html',{waitUntil:'domcontentloaded',timeout:45000});
  const source=site==='original';
  const begin=page.locator(source?'.ds-begin-btn':'.dd-begin');
  await begin.waitFor({state:'visible',timeout:28000});
  if(source)await page.evaluate(()=>document.querySelector('#cmpwrapper')?.remove());
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(1200);
  result.home=await capture(page,site,width,'home',[0,250,550,950,1900,2600]);
  await begin.evaluate(e=>e.click());
  await page.locator(source?'.ds-input':'#answer-input').waitFor({state:'visible',timeout:23000});
  result.prompt=await page.locator(source?'.ds-card .prompt':'.dd-game-prompt .prompt').first().innerText();
  result.answering=await capture(page,site,width,'game',[0,250,550,950]);
  if(site==='replica'&&result.dailyFixture&&result.prompt!==result.dailyFixture.prompt)
   throw Error('Local source-backed Daily question did not load: '+result.prompt);
  const mascot=page.locator(source?'.ds-mascot':'.dd-game-fish');
  if(await mascot.count()&&await mascot.isVisible()){
   await mascot.first().evaluate(e=>e.click());
   result.poked=await capture(page,site,width,'game',[0,70,250,550,950]);
  }
  const input=page.locator(source?'.ds-input':'#answer-input').first();
  if(await input.isVisible()){
   await input.fill(answer);
   const submit=page.locator(source?'button:has-text("DIVE")':'.dd-dive-btn').first();
   if(await submit.count())await submit.evaluate(e=>e.click());
   if(!source&&await page.locator('.dd-correction-panel').count()){
    await submit.evaluate(e=>e.click());
   }
   result.postSubmission=await page.evaluate(()=>({
    phase:document.querySelector('.dd-game-screen')?.getAttribute('data-phase')||null,
    correction:document.querySelector('.dd-correction-panel')?.textContent?.slice(0,150)||null,
    reject:document.querySelector('.dd-reject')?.textContent?.slice(0,150)||null,
    prompt:document.querySelector('.dd-game-prompt .prompt')?.textContent||null
   }));
   if(site==='replica'&&result.postSubmission?.phase!=='feedback')
    throw Error('Accepted sourced test answer failed to enter feedback: '+JSON.stringify(result.postSubmission));
   result.reveal=await capture(page,site,width,'game',[0,250,550,1050,1900,3300,4300]);
   result.revealBody=(await page.locator('body').innerText()).slice(-500);
  }
  result.success=true;
 }catch(error){result.success=false;result.failure=String(error);}
 finally{await page.close()}
 return result;
}
for(const width of [1440,390]){
 for(const site of ['original','replica']){
  const rec=await run(site,width);report.push(rec);
  for(const phase of ['home','answering','poked','reveal']){
   const arr=rec[phase];if(!arr)continue;
   console.log('MOTION',width,site,phase,JSON.stringify(arr.map(frame=>({t:frame.t,
    ...Object.fromEntries(Object.entries(frame.nodes).filter(([k])=>['mascot','logo','begin','chip','prompt','world'].includes(k)).map(([k,n])=>[k,n?{r:n.rect,a:n.animation,d:n.duration}:null]))}))));
  }
  console.log('MOTION_RESULT',width,site,rec.success,rec.failure||'',rec.errors.join('|'),'PROMPT',rec.prompt,'POST',JSON.stringify(rec.postSubmission),'BODY',rec.revealBody?.slice(0,140));
 }
}
fs.writeFileSync(output+'/timeline.json',JSON.stringify(report,null,2));
await browser.close();
if(report.some(r=>!r.success))process.exitCode=1;
