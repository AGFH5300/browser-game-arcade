import {readdir,stat,unlink} from 'node:fs/promises';
import path from 'node:path';
const roots=['.next/cache/sidequest-games','.next/cache/sidequest-reference-games','.next/cache/sidequest-covers'];
const files=[];
async function scan(dir){let entries;try{entries=await readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}
 for(const entry of entries){const file=path.join(dir,entry.name);if(entry.isDirectory())await scan(file);else if(entry.isFile())files.push({file,size:(await stat(file)).size});}
}
for(const root of roots)await scan(root);
let total=files.reduce((sum,file)=>sum+file.size,0),removed=0;
for(const file of files.sort((a,b)=>b.size-a.size)){if(total<=650*1024*1024)break;await unlink(file.file);total-=file.size;removed++;}
console.log(`Reproducible source cache retained: ${total} bytes; trimmed ${removed} files. Deployed assets untouched.`);
