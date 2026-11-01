import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(process.cwd()+'/package.json');
const sharp=require('sharp');
const {chromium}=await import(process.env.KRILLION_PLAYWRIGHT_MODULE||'playwright').catch(()=>{
 throw new Error('Install playwright or set KRILLION_PLAYWRIGHT_MODULE to a local playwright/index.mjs');
});
const exe=process.env.KRILLION_CHROMIUM_EXECUTABLE;
const browser=await chromium.launch({headless:true,...(exe?{executablePath:exe}:{})});
const out=process.env.KRILLION_AUDIT_DIR||'/tmp/kr-fixed-seed-matrix';fs.mkdirSync(out,{recursive:true});
const originalBase=process.env.KRILLION_ORIGINAL_URL||'https://krillion.io';
const localBase=process.env.KRILLION_CANDIDATE_URL||'https://browser-game-arcade-lz6sd28jy-dxbavg-7923s-projects.vercel.app';
const results=[];
async function run(site,screen,width){
 const p=await browser.newPage({viewport:{width,height:width===390?844:900},deviceScaleFactor:1});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(process.env.KRILLION_NO_SEED!=='1')await p.addInitScript(()=>{
  let x=0x71847513;
  Math.random=()=>{x|=0;x=x+0x6d2b79f5|0;let t=Math.imul(x^x>>>15,1|x);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296};
 });
 try{
  const original=site==='original';
  const url=original?originalBase+(screen==='party'?'/party':screen==='unlimited'?'/unlimited/classic':''):localBase+'/play/deep-dive/index-public-art.html';
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
  // The publisher embeds a consent wrapper outside the game. Ignore this
  // third-party overlay during comparisons; leave the game itself untouched.
  if(original)await p.addStyleTag({content:'.cmpwrapper{display:none!important;visibility:hidden!important}'});
  if(original){
   if(['menu','settings','wardrobe'].includes(screen)){
    await p.locator('.ds-begin-btn').waitFor({state:'visible',timeout:16000});
    await p.waitForTimeout(1500); // original client hydration before menu listeners
   }
   if(screen==='menu'){
    for(let tries=0;tries<3;tries++){
     await p.locator('button[aria-label="Open menu"]').click({force:true});
     const open=await p.locator('button[aria-label="Open menu"][aria-expanded="true"]').count();
     if(open>0)break;
     await p.waitForTimeout(950);
    }
    await p.locator('button[aria-label="Open menu"][aria-expanded="true"]').waitFor({state:'visible',timeout:8000});
   }
   if(screen==='settings')await p.getByRole('button',{name:'Open settings'}).click({force:true});
   if(screen==='wardrobe')await p.getByRole('button',{name:'Open wardrobe'}).click({force:true});
   if(screen==='account'||screen==='friends')await p.goto(originalBase+'/'+screen,{waitUntil:'domcontentloaded'});
  }else{
   await p.locator('.deep-home[data-phase=intro]').waitFor({state:'attached',timeout:23000});
   if(['party','unlimited','account','friends'].includes(screen)){
    await p.locator('.dd-nav-toggle summary').evaluate(e=>e.click());
    await p.locator('[data-menu-view="'+({unlimited:'endless'}[screen]||screen)+'"]').evaluate(e=>e.click());
   }
   if(screen==='menu'){
    await p.locator('.dd-nav-toggle summary').evaluate(e=>e.click());
    await p.locator('.dd-source-menu-panel[role=dialog]').waitFor({state:'visible',timeout:8000});
   }
   if(screen==='settings')await p.getByRole('button',{name:/settings/i}).first().evaluate(e=>e.click());
   if(screen==='wardrobe')await p.getByRole('button',{name:/wardrobe/i}).first().evaluate(e=>e.click());
  }
  // Compare settled screen states. Pausing all CSS animations at time=0
  // incorrectly hides both title glyphs and entrance-transition content.
  await p.waitForTimeout(2600);
  // Do not report a comparison of two different screens as visual parity.
  const text=await p.locator('body').innerText();
  if(screen==='menu'&&!text.includes('TRY CHAINLE'))throw new Error('MENU_NOT_OPEN');
  if(screen==='party'&&!/PUFFER PARTY|WHO.S PLAYING/.test(text))throw new Error('PARTY_NOT_OPEN');
  if(screen==='unlimited'&&!/ENDLESS DIVE/.test(text))throw new Error('UNLIMITED_NOT_OPEN');
  await p.evaluate(async()=>{
   await document.fonts.ready;
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
   if(!ctx)throw new Error('FONT_RENDERER_UNAVAILABLE');
   ctx.font='24px sans-serif';
   if(ctx.measureText('KRILLION').width<40)throw new Error('FONT_RENDERER_UNAVAILABLE');
  });
  const file=out+'/'+width+'-'+screen+'-'+site+'.png';
  await p.screenshot({path:file,timeout:20000});
  const data=await p.evaluate(()=>({
   body:document.body.innerText.slice(0,950),
   elements:[...document.querySelectorAll('h1,h2,h3,button,img,input,canvas')].filter(e=>{let r=e.getBoundingClientRect();return r.width>10&&r.height>10&&r.top<innerHeight}).slice(0,100).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{tag:e.tagName,cl:String(e.className).slice(0,60),text:e.children.length?'':e.textContent?.trim().slice(0,30),rect:[r.x,r.y,r.width,r.height].map(x=>Math.round(x)),animation:s.animationName,font:s.fontSize}}),
   animations:document.getAnimations().map(a=>({name:a.animationName||'',duration:a.effect?.getTiming()?.duration})).slice(0,40)}));
  return{ok:true,file,...data,errors};
 }catch(e){return{ok:false,error:String(e).slice(0,370),errors}}
 finally{await p.close()}
}
const scenarios=(process.env.KRILLION_SCENARIOS||'home,menu,settings,wardrobe,party,unlimited,account,friends').split(',');
const viewports=(process.env.KRILLION_VIEWPORTS||'1440,390').split(',').map(Number);
for(const width of viewports)for(const screen of scenarios){
 const orig=await run('original',screen,width),own=await run('replica',screen,width);
 let diff=null;
 if(orig.ok&&own.ok){
  const a=await sharp(orig.file).removeAlpha().raw().toBuffer();
  const b=await sharp(own.file).removeAlpha().raw().toBuffer();
  let sum=0,exact=0;for(let i=0;i<a.length;i+=3){let q=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);sum+=q;if(q===0)exact++}
  diff={mae:+(sum/a.length).toFixed(3),exactPercent:+(exact*300/a.length).toFixed(2)};
 }
 results.push({width,screen,orig,own,diff});fs.writeFileSync(out+'/audit.json',JSON.stringify(results,null,2));
 console.log('CHECK',width,screen,orig.ok,own.ok,JSON.stringify(diff),
  'errors',orig.errors.length,own.errors.length,'failure',!orig.ok?orig.error:!own.ok?own.error:'none');
}
await browser.close();
const bad=results.filter(x=>!x.orig.ok||!x.own.ok||!x.diff||x.diff.exactPercent!==100);
console.log('STRICT_PARITY',bad.length?'FAIL':'PASS','failed',bad.length,'of',results.length);
if(bad.length)process.exitCode=2;
