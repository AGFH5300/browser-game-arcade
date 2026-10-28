// Remove only broken *optional* PWA/shortcut-icon links from the copied
// archive HTML. Never remove gameplay scripts, stylesheets, preloads or assets.
// Source hash verification is performed before these cosmetic output edits.
import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
const root=resolve(process.argv[2]??'public/play/archives');
let removed=0,files=0;
const found=[];
for(const dir of await readdir(root,{withFileTypes:true})){
  if(!dir.isDirectory())continue;
  const file=join(root,dir.name,'index.html');
  let html;try{html=await readFile(file,'utf8')}catch{continue}
  // A few self-contained builds are tens of MB. Don't copy strings needlessly
  // unless their document includes a conventional optional link.
  if(!/<link\b/i.test(html))continue;
  const matches=[...html.matchAll(/<link\b[^>]*>/gi)];
  let output=html;
  for(const [tag] of matches){
    const rel=tag.match(/\brel\s*=\s*(['"])(.*?)\1/i)?.[2]?.toLowerCase()??'';
    if(!/^(?:manifest|shortcut icon|icon|apple-touch-icon(?:-precomposed)?)$/.test(rel))continue;
    const href=tag.match(/\bhref\s*=\s*(['"])(.*?)\1/i)?.[2]??'';
    if(!href||/^(?:data:|https?:|\/\/)/i.test(href))continue;
    const pathOnly=href.split(/[?#]/,1)[0];
    let relative;
    try{relative=decodeURIComponent(pathOnly)}catch{continue}
    // This cleanup is restricted to paths within this game package.
    const local=resolve(dirname(file),relative);
    if(local!==resolve(root,dir.name)&&!local.startsWith(resolve(root,dir.name)+'/'))continue;
    let exists=false;try{exists=(await stat(local)).isFile()}catch{}
    if(!exists){output=output.replace(tag,'');removed++;found.push(dir.name+':'+relative)}
  }
  if(output!==html){await writeFile(file,output);files++}
}
console.log(JSON.stringify({trimmedOptionalLinks:removed,affectedGames:files,details:found.slice(0,40)}));
