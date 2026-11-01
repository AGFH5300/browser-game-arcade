/* Comparison-only source-to-candidate geometry check.
 * Injects the PUBLIC source prompt as text into the candidate's *browser DOM*
 * so different daily question banks cannot produce false text-wrap failures.
 * It never changes game data and cannot establish pixel identity.
 * Env: KRILLION_PLAYWRIGHT_MODULE, KRILLION_CHROMIUM_EXECUTABLE,
 *      KRILLION_ORIGINAL_URL, KRILLION_CANDIDATE_URL, KRILLION_GEOMETRY_DIR. */
import fs from 'node:fs';
const {chromium}=await import(process.env.KRILLION_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({
 headless:true,
 ...(process.env.KRILLION_CHROMIUM_EXECUTABLE?
 {executablePath:process.env.KRILLION_CHROMIUM_EXECUTABLE}:{})
});
const output=process.env.KRILLION_GEOMETRY_DIR||'/tmp/krillion-equal-prompt';
fs.mkdirSync(output,{recursive:true});
const results=[];
const base=process.env.KRILLION_ORIGINAL_URL||'https://krillion.io';
const candidate=process.env.KRILLION_CANDIDATE_URL||'http://127.0.0.1:8918';
const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(x=>Math.round(x*100)/100)};
async function run(which,width,prompt){
 const p=await browser.newPage({viewport:{width,height:width===390?844:900},deviceScaleFactor:1});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 try{
  await p.goto(which==='original'?base+'/':candidate+'/play/deep-dive/index-public-art.html',
  {waitUntil:'domcontentloaded',timeout:30000});
  if(which==='original'){
   await p.locator('.ds-begin-btn').waitFor({state:'visible'});
   await p.waitForTimeout(1400);
   await p.locator('.ds-begin-btn').click({force:true});
   await p.locator('input[placeholder*="type one answer"]').waitFor({state:'visible',timeout:20000});
   prompt=await p.locator('.ds-card .prompt').first().innerText();
  }else{
   await p.locator('.deep-home[data-phase=intro]').waitFor({state:'attached',timeout:14000});
   await p.waitForTimeout(1000);
   await p.locator('[data-action=startDaily]').evaluate(e=>e.click());
   await p.locator('#answer-input').waitFor({state:'visible',timeout:16000});
   await p.locator('.dd-game-prompt .prompt').first().evaluate((e,v)=>{e.textContent=v},prompt);
  }
  await p.waitForTimeout(1200);
  const geometry=await p.evaluate(()=>{const r=e=>{
   if(!e)return null;
   const box=e.getBoundingClientRect();return [box.x,box.y,box.width,box.height].map(x=>Math.round(x*100)/100)};
   const s=which=>document.querySelector(which);
   const src=!!s('.ds-card');
   return{
    card:r(s(src?'.ds-card':'.dd-game-prompt')),
    text:r(s(src?'.ds-card .prompt':'.dd-game-prompt .prompt')),
    world:r(s(src?'.ds-world':'.dd-world')),
    backdrop:r(s(src?'.ds-sea':'.dd-source-ocean-canvas')),
    foreground:r(s(src?'.ds-fore':'.dd-reference-fore-canvas')),
    hud:r(s(src?'.ds-hud':'.dd-hud')),
    dock:r(s(src?'.ds-dock':'.dd-dock')),
    bodyScroll:[scrollX,scrollY],
    activeCanvas:[...document.querySelectorAll('canvas')].length,
    actualPrompt:s(src?'.ds-card .prompt':'.dd-game-prompt .prompt')?.textContent
   };
  });
  await p.screenshot({path:output+'/'+width+'-'+which+'.png'});
  return{width,which,prompt,geometry,errors:errs};
 }finally{await p.close()}
}
try{
 for(const width of [390,1440]){
  const source=await run('original',width);
  const replica=await run('replica',width,source.prompt);
  const a=source.geometry,b=replica.geometry;
  const delta={};
  for(const key of ['card','text','world','backdrop','foreground','hud','dock']){
   if(a[key]&&b[key])delta[key]=a[key].map((n,i)=>Math.round((b[key][i]-n)*100)/100);
  }
  const cardDimensionsMatch=delta.card&&Math.abs(delta.card[2])<=.1&&Math.abs(delta.card[3])<=.1;
  const noScroll=Math.abs(b.bodyScroll[1])<1;
  const result={width,prompt:source.prompt,cardDimensionsMatch,noScroll,
    source:source.geometry,candidate:replica.geometry,delta,errors:[...source.errors,...replica.errors]};
  results.push(result);
  console.log('EQUAL_PROMPT',width,
   'dimensionMatch',cardDimensionsMatch,'noScroll',noScroll,
   'cardDelta',JSON.stringify(delta.card),'worldDelta',JSON.stringify(delta.world),
   'errors',result.errors.length);
 }
 fs.writeFileSync(output+'/audit.json',JSON.stringify(results,null,2));
 if(results.some(r=>!r.cardDimensionsMatch||!r.noScroll||r.errors.length))process.exitCode=2;
}finally{await browser.close()}
