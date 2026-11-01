/* Runtime visual-layer smoke audit for the public Deep Dive.
 * Uses real Chromium rendering, not the existence of CSS strings as proof.
 * Set KRILLION_TEST_URL to the candidate preview (or local server URL).
 */
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const target=process.env.KRILLION_TEST_URL||'https://browser-game-arcade.vercel.app/play/deep-dive/index-public-art.html';
const out=process.env.KRILLION_QA_OUTPUT||'/tmp/krillion-visible-layer-qa';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
let failed=false;
for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 const result={viewport:width,url:target,checks:{},errors};
 try{
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('.deep-home[data-phase="intro"]').waitFor({timeout:25000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(2100);
  result.checks.title=await page.locator('h1.dd-logo').innerText();
  if(result.checks.title.replace(/\s/g,'')!=='KRILLION')throw Error('Homepage brand missing letters');
  const intro=await page.evaluate(()=>{
   const mascot=document.querySelector('.dd-home-mascot');
   if(!mascot)return{exists:false};
   const bounds=mascot.getBoundingClientRect(),style=getComputedStyle(mascot);
   const src=mascot.getAttribute('src');
   return {exists:true,rect:[bounds.x,bounds.y,bounds.width,bounds.height],display:style.display,
     opacity:style.opacity,visibility:style.visibility,src,loaded:mascot.complete&&mascot.naturalWidth>0};
  });
  result.checks.homeMascot=intro;
  if(!intro.exists||!intro.loaded||intro.display==='none'||intro.visibility==='hidden'||Number(intro.opacity)<.1)
   throw Error('Homepage mascot is absent, hidden or broken');
  await page.screenshot({path:path.join(out,width+'-home.png')});
  await page.locator('.dd-begin').evaluate(el=>el.click());
  await page.locator('#answer-input').waitFor({state:'visible',timeout:25000});
  await page.waitForTimeout(500);
  const scene=await page.evaluate(()=>{
   const sea=document.querySelector('.dd-game-screen[data-world="ocean"]');
   const canvas=sea?.querySelector(':scope > .dd-source-ocean-canvas');
   const stage=sea?.querySelector(':scope > .dd-stage');
   const mascot=sea?.querySelector('.dd-game-fish');
   const oldSea=sea?.querySelector('.dd-game-sea');
   const image=getComputedStyle(mascot||document.body).backgroundImage;
   const fishRect=mascot?.getBoundingClientRect(),stageRect=stage?.getBoundingClientRect();
   const s=mascot&&getComputedStyle(mascot);
   let sample=[];
   if(canvas&&canvas.width>0&&canvas.height>0){
    const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    if(ctx)sample=[[.1,.1],[.5,.5],[.9,.9]].map(([x,y])=>Array.from(ctx.getImageData(Math.floor(w*x),Math.floor(h*y),1,1).data));
   }
   return{canvas:!!canvas,canvasSize:canvas?[canvas.width,canvas.height]:null,
    canvasDisplay:canvas?getComputedStyle(canvas).display:null,canvasZ:canvas?getComputedStyle(canvas).zIndex:null,
    seaOpacity:oldSea?getComputedStyle(oldSea).opacity:null,
    mascot:!!mascot,mascotRect:fishRect?[fishRect.x,fishRect.y,fishRect.width,fishRect.height]:null,
    stageRect:stageRect?[stageRect.x,stageRect.y,stageRect.width,stageRect.height]:null,
    mascotDisplay:s?.display,mascotVisibility:s?.visibility,mascotOpacity:s?.opacity,
    mascotBackground:image,samples:sample};
  });
  result.checks.gameplay=scene;
  if(!scene.canvas||!scene.canvasSize||scene.canvasSize.some(x=>x<100)||scene.canvasDisplay==='none')
   throw Error('Dynamic ocean canvas is not mounted/rendering');
  if(!scene.samples.length||scene.samples.every(x=>x.slice(0,3).every(c=>c===0)))
   throw Error('Dynamic ocean canvas is blank');
  if(scene.seaOpacity!=='0')throw Error('Legacy static sea may conceal dynamic ocean canvas');
  if(!scene.mascot||!scene.mascotRect||scene.mascotRect[2]<20||scene.mascotDisplay==='none'
    ||scene.mascotVisibility==='hidden'||Number(scene.mascotOpacity)<.1
    ||scene.mascotRect[0]+scene.mascotRect[2]<0||scene.mascotRect[0]>width)
   throw Error('Gameplay shrimp mascot is missing or offscreen');
  if(!/krillion/i.test(scene.mascotBackground))throw Error('Gameplay mascot background sprite not loaded');
  // A visible, nonblank canvas can still be a frozen screenshot.
  // Compare real pixel buffers across frames to require active ocean motion.
  const motionBefore=await page.evaluate(()=>{
   const bg=document.querySelector('.dd-source-ocean-canvas');
   const fg=document.querySelector('.dd-reference-fore-canvas');
   return {background:bg?.toDataURL('image/png')||null,
    foreground:fg?.toDataURL('image/png')||null,foregroundMounted:!!fg};
  });
  await page.waitForTimeout(620);
  const motionAfter=await page.evaluate(()=>{
   const bg=document.querySelector('.dd-source-ocean-canvas');
   const fg=document.querySelector('.dd-reference-fore-canvas');
   return {background:bg?.toDataURL('image/png')||null,foreground:fg?.toDataURL('image/png')||null};
  });
  result.checks.oceanMotion={
   backgroundChanged:!!motionBefore.background&&motionBefore.background!==motionAfter.background,
   foregroundMounted:motionBefore.foregroundMounted,
   foregroundChanged:!!motionBefore.foreground&&motionBefore.foreground!==motionAfter.foreground,
  };
  if(!result.checks.oceanMotion.backgroundChanged)
    throw Error('Ocean background canvas is rendered but not animating');
  if(result.checks.oceanMotion.foregroundMounted&&!result.checks.oceanMotion.foregroundChanged)
    throw Error('Ocean foreground canvas is frozen');
  await page.screenshot({path:path.join(out,width+'-gameplay.png')});
  await page.locator('.dd-game-fish').click({force:true,timeout:3000});
  const blub=page.locator('.dd-game-fish .dd-blub.show');
  await blub.waitFor({state:'visible',timeout:1200});
  result.checks.boop=await blub.innerText();
  if(result.checks.boop.trim()!=='blub!')throw Error('Shrimp boop speech missing');
  if(errors.length)throw Error(errors.length+' JavaScript exception(s)');
  result.ok=true;
 }catch(error){failed=true;result.ok=false;result.failure=String(error);}
 results.push(result);
 console.log(JSON.stringify(result));
 await page.close();
}
await browser.close();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));
if(failed)process.exitCode=1;
