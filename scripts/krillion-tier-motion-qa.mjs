/* End-to-end animation checks across accepted answer rarity tiers.
 * Runs the independent game on a local static server with the published
 * 2026-11-01 archive used only as a deterministic browser fixture.
 * Never claims source pixel parity for an untested original frame.
 */
import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.KRILLION_CANDIDATE_URL||'http://127.0.0.1:8765';
const output=process.env.KRILLION_TIER_DIR||'/tmp/krillion-tier-motion';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const fixture=await (await (await browser.newPage()).request.get(base+'/play/deep-dive/recovered/archive/2026-11-01.json')).json();
const q=fixture.questions[0];
const targets=[10,30,60,85,100];
const map={10:'plankton',15:'tooclever',30:'schooler',60:'rare',85:'deepcut',100:'krillion'};
const results=[];
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const sheet={date,dayNumber:fixture.dayNumber,
 prompts:fixture.questions.map((p,i)=>({id:p.id||'p'+(i+1),text:p.text,answers:p.answers
  .filter(([a,score])=>map[score]).map(([a,score])=>({answer:a,tier:map[score],score,quip:''}))}))};
for(const width of [390,1440]){
 for(const points of targets){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const result={width,points,answer:q.answers.find(a=>a[1]===points)?.[0]||'',errors,frames:[]};
  try{
   if(!result.answer)throw Error('Fixture has no '+points+'-point answer');
   await page.route('**/api/deep-dive/public-daily',route=>route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify(sheet)
   }));
   await page.goto(base+'/play/deep-dive/index-public-art.html',{waitUntil:'domcontentloaded'});
   await page.locator('.dd-begin').waitFor({state:'visible',timeout:20000});
   await page.locator('.dd-begin').evaluate(el=>el.click());
   const input=page.locator('#answer-input');await input.waitFor({state:'visible',timeout:20000});
   await input.fill(result.answer);
   await page.locator('.dd-dive-btn').evaluate(el=>el.click());
   if(await page.locator('#answer-input').count()&&await page.locator('.dd-dive-btn').count())
     await page.locator('.dd-dive-btn').evaluate(el=>el.click());
   await page.locator('.dd-reveal-screen').waitFor({state:'visible',timeout:4000});
   const duration=await page.locator('.dd-reveal-screen').evaluate(el=>parseFloat(el.style.getPropertyValue('--reveal-ms'))||3400);
   result.duration=duration;
   const phaseStart=performance.now();
   const times=[100,450,Math.floor(duration*.45),Math.max(1500,duration-450)];
   for(const t of times){
    await page.waitForTimeout(Math.max(0,phaseStart+t-performance.now()));
    const rec=await page.evaluate(()=>{
     const chip=document.querySelector('.dd-chip'),prompt=document.querySelector('.dd-game-prompt');
     const fish=document.querySelector('.dd-game-fish');
     const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};
     const s=chip&&getComputedStyle(chip);
     const cb=box(chip),pb=box(prompt);
     const overlap=!!cb&&!!pb&&cb[0]<pb[0]+pb[2]&&cb[0]+cb[2]>pb[0]&&cb[1]<pb[1]+pb[3]&&cb[1]+cb[3]>pb[1];
     return {chip:cb,chipVisible:!!chip&&s.visibility!=='hidden'&&Number(s.opacity)>.05,
      prompt:pb,overlap,fish:box(fish),
      spotlight:!!document.querySelector('.dd-source-depth-spotlight'),
      effectCanvas:!!document.querySelector('.dd-source-tier-canvas'),
      phase:document.querySelector('.dd-game-screen')?.dataset.phase};
    });
    result.frames.push({t,...rec});
   }
   if(result.frames.some(f=>f.phase!=='feedback'))throw Error('Lost feedback phase');
   if(result.frames.some(f=>!f.chipVisible))throw Error('Accepted word disappeared mid-flight');
   if(result.frames.some(f=>f.overlap))throw Error('Prompt collided with descending answer');
   const distance=Math.max(...result.frames.map(f=>f.fish?.[0]||0))-Math.min(...result.frames.map(f=>f.fish?.[0]||0));
   result.fishTravelX=Math.round(distance);
   if(distance<40)throw Error('Shrimp remains frozen during the reveal');
   if(points===85&&!result.frames.some(f=>f.spotlight))throw Error('Deep Cut spotlight missing');
   if(!result.frames.some(f=>f.effectCanvas))throw Error('Tier particle layer missing');
   if(errors.length)throw Error('Browser JS errors: '+errors.join('|'));
   result.ok=true;
  }catch(e){result.ok=false;result.failure=String(e)}
  finally{results.push(result);console.log('TIER_MOTION',JSON.stringify(result));await page.close()}
 }
}
fs.writeFileSync(output+'/report.json',JSON.stringify(results,null,2));
await browser.close();
if(results.some(r=>!r.ok))process.exitCode=1;
