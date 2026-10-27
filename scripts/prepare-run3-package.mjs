import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const m=JSON.parse(await readFile(new URL('./run3-source.json',import.meta.url),'utf8'));
const root=path.resolve('public/play/archives/run-3'),cache=path.resolve('.next/cache/sidequest-games',m.revision,'run-3');
const hash=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
async function valid(p,sha){try{const b=await readFile(p);return hash(b)===sha?b:null}catch{return null}}
let downloaded=0;
for(let i=0;i<m.files.length;i+=10)await Promise.all(m.files.slice(i,i+10).map(async f=>{
 if(f.path.includes('..')||path.isAbsolute(f.path)||f.size>20e6)throw Error('Unsafe file');
 const saved=path.join(cache,f.path),target=path.join(root,f.path);let bytes=await valid(saved,f.sha)||await valid(path.resolve('../run3-review',f.path),f.sha);
 if(!bytes){const url=`https://raw.githubusercontent.com/${m.source}/${m.revision}/${f.path.split('/').map(encodeURIComponent).join('/')}`;const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('Run3 asset '+r.status+' '+f.path);bytes=Buffer.from(await r.arrayBuffer());if(hash(bytes)!==f.sha)throw Error('Run3 source hash mismatch '+f.path);downloaded++}
 await mkdir(path.dirname(saved),{recursive:true});await writeFile(saved,bytes);await mkdir(path.dirname(target),{recursive:true});await copyFile(saved,target);
}));
let html=await readFile(path.join(root,'index.html'),'utf8');html=html.replace(/<script[^>]*src="https:\/\/s3\.amazonaws\.com\/production-assetsbucket-[^"]+"[^>]*><\/script>/g,'').replace('<head>','<head><script src="bridge.js"></script>');
await writeFile(path.join(root,'index.html'),html);await copyFile('public/play/arcade-bridge.js',path.join(root,'bridge.js'));
await writeFile(path.join(root,'source-manifest.json'),JSON.stringify({...m,game:'Run 3',authorization:'Owner asserts content-use authorization. Community-extracted source, not an official developer release.',modifications:['Local audio bridge','Removed additional unidentified remote post-start script'],manualGameplay:'Awaiting user testing'},null,2));
console.log(JSON.stringify({package:'run-3',files:m.files.length,downloaded,cache:m.revision}));
