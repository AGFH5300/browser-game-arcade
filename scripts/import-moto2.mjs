// Import authorized source game files into this deployment, never proxy them at gameplay time.
// This is a staged self-hosting experiment for Moto X3M 2 only.
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const repo='brunoiscool2/unblockedgames';
const rev='main';
const source='play/motox3m2';
const destination=path.join(process.cwd(),'public/play/archives/moto-x3m-2');
const api='https://api.github.com/repos/'+repo;
const apiHeaders={'Accept':'application/vnd.github+json','User-Agent':'Sidequest-archival-build/1.0'};
const getJSON=async url=>{
  const res=await fetch(url,{headers:apiHeaders,signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw Error('Source inventory failed '+res.status+' '+url);
  return res.json();
};
const top=await getJSON(api+'/contents/'+source+'?ref='+rev);
const files=[];
for(const item of top){
  if(item.type==='file')files.push({relative:item.name,size:item.size});
  else if(item.type==='dir'){
    const tree=await getJSON(api+'/git/trees/'+item.sha+'?recursive=1');
    for(const file of tree.tree||[])if(file.type==='blob')files.push({relative:item.name+'/'+file.path,size:file.size});
  }
}
if(files.length<80)throw Error('Incomplete game archive: only '+files.length+' assets');
console.log('[local-archive] manifest',files.length,'files,',Math.round(files.reduce((n,f)=>n+(f.size||0),0)/1e6),'MB');
let failures=[];
for(let offset=0;offset<files.length;offset+=14){
  await Promise.all(files.slice(offset,offset+14).map(async file=>{
    try{
      if(file.size>20_000_000)throw Error('large file exceeds configured bound');
      const url='https://raw.githubusercontent.com/'+repo+'/'+rev+'/'+source+'/'+file.relative.split('/').map(encodeURIComponent).join('/');
      let response=await fetch(url,{signal:AbortSignal.timeout(24000)});
      if(!response.ok)throw Error('HTTP '+response.status);
      let bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.byteLength>20_000_000)throw Error('unexpected file size');
      if(file.relative==='index.html'){
        let html=bytes.toString('utf8');
        html=html.replace(/<script[^>]*src="https:\/\/imasdk\.googleapis\.com[^"]+"[^>]*><\/script>/gi,'');
        html=html.replace(/<script[^>]*data-ad-client[^>]*>[\s\S]*?<\/script>/gi,'');
        html=html.replace(/<script[^>]*src="\/js\/main\.js"[^>]*><\/script>/gi,'');
        html=html.replace(/\/\/ Load the JS SDK[\s\S]*?\}\)\(document,\s*"script",\s*"id-jssdk"\);/,'// Third-party ad SDK intentionally not loaded in Sidequest.');
        html=html.replace('<head>','<head><script src="/play/arcade-bridge.js"></script>');
        bytes=Buffer.from(html);
      }
      const target=path.join(destination,file.relative);
      if(!target.startsWith(destination+path.sep))throw Error('unsafe destination');
      await mkdir(path.dirname(target),{recursive:true});
      await writeFile(target,bytes);
    }catch(error){failures.push({file:file.relative,error:String(error).slice(0,115)})}
  }));
}
if(failures.length)throw Error('Game archive incomplete: '+JSON.stringify(failures.slice(0,6))+'; count='+failures.length);
await writeFile(path.join(destination,'source-manifest.json'),JSON.stringify({
  game:'Moto X3M 2',source:'https://github.com/'+repo+'/tree/'+rev+'/'+source,
  imported:'2026-10-27',count:files.length,developer:'MadPuffers',
  note:'Game files hosted locally in Sidequest. Owner confirms distribution authorization.'
},null,2));
console.log('[local-archive] success',files.length,'files');
