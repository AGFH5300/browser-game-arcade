// Version-pinned, hash-checked acquisition. Cache survives Vercel builds; visitors never fetch sources.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const manifest=JSON.parse(await readFile(new URL('./moto2-source.json',import.meta.url),'utf8'));
if(!/^[a-f0-9]{40}$/.test(manifest.revision))throw Error('Unpinned game source');
const root=path.resolve('public/play/archives/moto-x3m-2'),cache=path.resolve('.next/cache/sidequest-games',manifest.revision,'moto-x3m-2');
function hash(b){return createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex')}
async function valid(file,sha){try{const b=await readFile(file);return hash(b)===sha?b:null}catch{return null}}
let downloaded=0;
for(let i=0;i<manifest.files.length;i+=10)await Promise.all(manifest.files.slice(i,i+10).map(async f=>{
 if(f.path.includes('..')||path.isAbsolute(f.path)||f.size>20e6)throw Error('Unsafe manifest entry');
 const cached=path.join(cache,f.path),target=path.join(root,f.path);
 let bytes=await valid(cached,f.sha)||await valid(target,f.sha);
 if(!bytes){const r=await fetch(`https://raw.githubusercontent.com/${manifest.source}/${manifest.revision}/${manifest.sourcePath}/${f.path}`,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('Asset fetch failed '+f.path+' '+r.status);bytes=Buffer.from(await r.arrayBuffer());if(hash(bytes)!==f.sha)throw Error('Source hash mismatch '+f.path);downloaded++}
 await mkdir(path.dirname(cached),{recursive:true});await writeFile(cached,bytes);await mkdir(path.dirname(target),{recursive:true});await copyFile(cached,target);
}));
let html=await readFile(path.join(root,'index.html'),'utf8');
html=html.replace(/<script[^>]*src="(?:\/js\/main\.js|https:\/\/imasdk\.googleapis\.com[^"]*)"[^>]*><\/script>/g,'').replace(/<script[^>]*data-ad-client[^>]*>[\s\S]*?<\/script>/g,'').replace(/<script type="text\/javascript">[\s\S]*?<\/script>/g,'').replace(/<script[^>]*src="assets\/lib\/gameBreakBeta\.js"[^>]*><\/script>/g,'').replace('<head>','<head><script src="bridge.js"></script><script src="offline-adapter.js"></script>');
html=html.replace('</body>','<script>setTimeout(function(){document.getElementById("content").dispatchEvent(new Event("sdk_inited"));},0);</script></body>');
await writeFile(path.join(root,'index.html'),html);await copyFile('public/play/arcade-bridge.js',path.join(root,'bridge.js'));await copyFile('scripts/moto2-offline-adapter.js',path.join(root,'offline-adapter.js'));
await writeFile(path.join(root,'source-manifest.json'),JSON.stringify({...manifest,authorization:'Owner asserts content-use permission, 2026-10-27',modifications:['Removed third-party advertising/portal loaders','Local guest-mode adapter; online accounts/leaderboards unavailable','Local audio bridge']},null,2));
console.log(JSON.stringify({package:'moto-x3m-2',files:manifest.files.length,downloaded,cache:manifest.revision}));
