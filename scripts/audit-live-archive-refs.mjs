// Read-only, bounded live smoke check for published Sidequest game assets.
// HTML entrypoint and literal first-level references only; not gameplay QA.
// Run: node scripts/audit-live-archive-refs.mjs --out docs/verification/LIVE_ARCHIVE_ASSETS.json
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const outFlag=args.indexOf('--out');
const out=outFlag<0?null:args[outFlag+1];
const maxConcurrency=10;
const isHtml=(body)=>/^\s*(?:<!doctype\s+html|<html\b)/i.test(body);
function normalize(raw,base){
  if(!raw || /^(?:data:|blob:|javascript:|about:|#)/i.test(raw))return null;
  try{
    const candidate=new URL(raw,base),origin=new URL(base);
    if(candidate.origin!==origin.origin||!candidate.pathname.startsWith('/play/'))return null;
    if(candidate.pathname.endsWith('/'))return null;
    candidate.hash='';return candidate.href;
  }catch{return null;}
}
function refs(html,base){
  const active=html.replace(/<!--[\s\S]*?-->/g,'');
  const matches=[...active.matchAll(/<(script|link|img|source|audio|video|iframe)\b([^>]*)>/gi)];
  const found=new Map();
  for(const match of matches){
    const tag=match[1].toLowerCase(),attrs=match[2];
    const u=/(?:\bsrc|\bhref|\bposter)\s*=\s*(["'])(.*?)\1/i.exec(attrs)?.[2];
    const url=normalize(u,base);
    if(!url)continue;
    const rel=/\brel\s*=\s*(["'])(.*?)\1/i.exec(attrs)?.[2]?.toLowerCase()||'';
    const critical=tag==='script'||tag==='iframe'||(tag==='link'&&/\bstylesheet\b/.test(rel));
    const classification=critical?'blocker':'warning';
    if(!found.has(url)||classification==='blocker') found.set(url,{url,classification,tag,rel});
  }
  return [...found.values()];
}
async function request(url,bodyLimit=0) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(url,{method:bodyLimit?'GET':'HEAD',redirect:'follow',signal:controller.signal});
    const result={status:response.status,type:response.headers.get('content-type')||''};
    if(bodyLimit&&response.ok){
      let size=0,parts=[];
      const reader=response.body?.getReader();
      if(reader){
        while(size<bodyLimit){
          const {done,value}=await reader.read();
          if(done)break;
          const remaining=Math.min(value.length,bodyLimit-size);
          parts.push(value.subarray(0,remaining));size+=remaining;
          if(remaining<value.length)break;
        }
        await reader.cancel().catch(()=>{});
      }
      result.body=new TextDecoder().decode(Buffer.concat(parts));
    }else await response.body?.cancel().catch(()=>{});
    return result;
  }catch(e){return {status:0,type:'',error:String(e).slice(0,160)};}
  finally{clearTimeout(timer);}
}
async function batch(entries,worker,max=maxConcurrency){
  let index=0;const results=Array(entries.length);
  await Promise.all(Array.from({length:Math.min(max,entries.length)},async()=>{
    while(index<entries.length){const i=index++;results[i]=await worker(entries[i]);}
  }));
  return results;
}
if(args.includes('--self-check')){
  const sample='<html><head><script src="./game.js"></script><link rel="shortcut icon" href="../favicon.png"><link rel="stylesheet" href="./style.css"><!--<script src="./unused.js"></script>--></head></html>';
  const x=refs(sample,'https://example.com/play/archives/demo/index.html');
  if(x.length!==3||x.filter(v=>v.classification==='blocker').length!==2||x.filter(v=>v.classification==='warning').length!==1)throw Error('HTML classification regression');
  console.log(JSON.stringify({selfCheck:'passed',refs:x.length}));process.exit(0);
}
const inventory=JSON.parse(await readFile(path.join(root,'data/reference-games.json'),'utf8'));
const gameria=JSON.parse(await readFile(path.join(root,'data/gameria-games.json'),'utf8'));
const gamerias=[...(gameria.newGames||[])];
const games=[...inventory,...gamerias].filter(g=>typeof g.gameUrl==='string'&&g.gameUrl.startsWith('https://browser-game-arcade-dxbavg-7923s-projects.vercel.app/play/archives/'));
const unique=[...new Map(games.map(g=>[g.gameUrl,g])).values()];
const entries=await batch(unique,async game=>{
  const r=await request(game.gameUrl,300000);
  return {slug:game.slug||game.title,url:game.gameUrl,status:r.status,error:r.error||null,
    contentType:r.type,html:r.body||''};
});
const entryErrors=entries.filter(e=>e.status!==200||(!/html/.test(e.contentType)&&!isHtml(e.html))).map(({slug,url,status,error,contentType})=>({slug,url,status,error,contentType}));
const lookup=new Map();
for(const entry of entries.filter(e=>e.status===200&&e.html)){
  for(const ref of refs(entry.html,entry.url)){
    const existing=lookup.get(ref.url);
    if(existing){existing.games.push(entry.slug);if(ref.classification==='blocker')existing.classification='blocker';}
    else lookup.set(ref.url,{...ref,games:[entry.slug]});
  }
}
const checks=await batch([...lookup.values()],async ref=>{
  const result=await request(ref.url);
  return {...ref,status:result.status,contentType:result.type,error:result.error||null};
});
const failures=checks.filter(e=>e.status!==200);
const report={
  createdAt:new Date().toISOString(),
  scope:'All unique local WatchDocumentaries reference games and Flipline Gameria records; entry HTML and first-level local URLs.',
  limitations:'Does not execute gameplay, check audio, WebGL, cross-device multiplayer, asset hashes, dynamic JS imports or runtime service availability. The build-time packaged runtime audit checks hashes and known engine dependencies separately.',
  entryPages:entries.length,entryErrors,
  assetReferences:checks.length,successfulAssetReferences:checks.length-failures.length,
  failures,blockerCount:failures.filter(e=>e.classification==='blocker').length,
  warningCount:failures.filter(e=>e.classification==='warning').length
};
if(out){const dest=path.resolve(root,out);if(!dest.startsWith(root+path.sep))throw Error('Report must remain inside repository');await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({entryPages:report.entryPages,entryErrors:entryErrors.length,assetReferences:report.assetReferences,
  successfulAssetReferences:report.successfulAssetReferences,blockers:report.blockerCount,warnings:report.warningCount,failures:failures.map(x=>({games:x.games,url:x.url,status:x.status}))},null,2));
if(entryErrors.length||report.blockerCount)process.exitCode=1;
