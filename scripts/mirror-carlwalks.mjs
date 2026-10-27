// Build-time game archive importer. The result is copied into the deployed
// Sidequest static files; no runtime request to CarlWalks is required for copied assets.
// This imports only game versions for which the website owner asserts usage permission.
// Stage two compact games first. Enable the larger archives in a separate tested commit.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,dirname,normalize,extname} from 'node:path';

const builds={
 'moto-x3m-2':'moto-x3m-2',
 'moto-x3m-3':'moto-x3m-3',
 'moto-x3m':'moto-x3m',
 'slope':'slope',
 'polytrack':'polytrack-0.3.1',
 'crossy-road':'crossy-road',
 'fnaf':'fnaf'
};
const active=(process.env.MIRROR_GAMES||'moto-x3m-2,moto-x3m-3').split(',').map(s=>s.trim()).filter(Boolean);
const existing=await readFile('scripts/carlwalks-network-manifest.json','utf8').then(JSON.parse).catch(()=>({games:{}}));
const assetRE=/^(?!https?:|\/\/|data:|javascript:|#|\?)[^?&#"'<>]*\.(?:html?|css|js(?:\.download)?|json|png|jpe?g|webp|svg|gif|mp3|ogg|wav|woff2?|ttf|otf|wasm|unityweb|data|mem|bin|bytes|txt|fnt|atlas|xml|map|bundle|glb|gltf)$/i;
const ROOT=join(process.cwd(),'public','play','archives');
const skipAnalytics=/^\/(?:cdn-cgi|beacon\.min\.js)|^(?:analytics|tracker|google-analytics)/i;
function normalizePath(raw,from='index.html'){
 try{
  const url=new URL(raw,'https://example.invalid/'+from);
  if(url.hostname!=='example.invalid')return null;
  const p=decodeURIComponent(url.pathname).replace(/^\/+/,'');
  const n=normalize(p);
  if(n.startsWith('..')||n.includes('\\')||!assetRE.test(n)||skipAnalytics.test(n))return null;
  return n;
 }catch{return null}
}
function refs(text,filename){
 const paths=new Set();
 const re=/(?:src|href)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^)"']+)["']?\s*\)|["']([A-Za-z0-9_ .%+-]+\/[^"'\\\s?<>]{2,180})["']/gi;
 for(const m of text.matchAll(re)){
  const p=normalizePath(m[1]||m[2]||m[3],filename);
  if(p)paths.add(p);
 }
 // Unity builds put asset names in JSON without directory prefixes.
 if(filename.endsWith('.json'))for(const m of text.matchAll(/["']([^"'\\\s?<>]{2,140}\.(?:unityweb|wasm|data|mem|js|json))["']/gi)){
  const p=normalizePath(m[1],filename);if(p)paths.add(p)
 }
 return [...paths];
}
function rename(path){return path.endsWith('.js.download')?path.slice(0,-'.download'.length):path}
function sanitize(text){
 // Remove Cloudflare-injected challenges and site trackers, never gameplay scripts.
 return text.replace(/<script[^>]*>[\s\S]*?__CF\$cv\$params[\s\S]*?<\/script>/gi,'')
  .replace(/<script[^>]+src=["'][^"']*(?:cdn-cgi\/challenge-platform|beacon\.min\.js|googletagmanager|google-analytics)[^"']*["'][^>]*><\/script>/gi,'')
  .replace(/([A-Za-z0-9._-]+\.js)\.download(?=["'])/g,'$1');
}
async function copy(name){
 const source=builds[name];if(!source)throw Error('Unexpected game '+name);
 const site='https://www.carlwalks.com/build_engine/root/'+encodeURIComponent(source)+'/';
 const pending=new Set(['index.html',...(existing.games?.[source]||[])]);
 const visited=new Set();let bytes=0,fail=[],saved=0;
 const folder=join(ROOT,name);
 while(pending.size){
  const batch=[...pending].slice(0,10);for(const file of batch)pending.delete(file);
  await Promise.all(batch.map(async file=>{
   const normalized=normalizePath(file);if(!normalized||visited.has(normalized))return;
   visited.add(normalized);if(visited.size>1500)throw Error(name+': >1500 assets');
   try{
    const u=new URL(normalized,site);
    const response=await fetch(u,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36','Accept':'text/html,application/json,application/javascript,image/avif,image/webp,*/*;q=0.8','Referer':'https://www.carlwalks.com/flash/'}});
    if(!response.ok)throw Error('HTTP '+response.status);
    const content=new Uint8Array(await response.arrayBuffer());
    if(content.byteLength>75_000_000)throw Error('single file too large');
    bytes+=content.byteLength;
    if(bytes>160_000_000)throw Error('game exceeds 160MB');
    const isText=/\.(?:html?|js(?:\.download)?|css|json|svg|txt|xml)$/i.test(normalized);
    let output=content;
    if(isText){
      const s=Buffer.from(content).toString('utf8');
      for(const ref of refs(s,normalized))if(!visited.has(ref))pending.add(ref);
      const fixed=sanitize(s);
      output=Buffer.from(fixed,'utf8');
    }
    const destination=join(folder,rename(normalized));
    await mkdir(dirname(destination),{recursive:true});
    await writeFile(destination,output);
    saved++;
   }catch(e){fail.push([normalized,String(e).slice(0,90)]);}
  }));
 }
 if(fail.some(([file])=>file==='index.html'))throw Error(name+': index failed '+JSON.stringify(fail));
 const summary={name,downloaded:saved,bytes,missing:fail.slice(0,30)};
 console.log('[mirror]',JSON.stringify(summary));
 await writeFile(join(folder,'archive-manifest.json'),JSON.stringify(summary,null,2));
}
for(const game of active)await copy(game);
