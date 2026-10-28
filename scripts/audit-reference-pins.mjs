// Audit source pin completeness without downloading any game assets.
// Use --repair-derived-totals only to reconcile the aggregate sum already
// implied by individually pinned SHA-256 file records. Never invent hashes.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const file=resolve('scripts/reference-package-sources.json');
const manifest=JSON.parse(await readFile(file,'utf8'));
const repair=process.argv.includes('--repair-derived-totals');
const problem=[];
let corrected=0,pinned=0,ready=0,fullyReady=0;
for(const p of manifest.packages??[]){
  if(!p.ready)continue;
  ready++;
  const files=p.files??[];
  const paths=new Set();
  let valid=true;
  for(const f of files){
    if(typeof f.path!=='string'||paths.has(f.path)||f.path.includes('..')||
       !Number.isSafeInteger(f.sourceSize)||f.sourceSize<0||
       !/^[0-9a-f]{64}$/i.test(f.sourceSha256??''))valid=false;
    paths.add(f.path);
  }
  const sum=files.reduce((n,f)=>n+(f.sourceSize||0),0);
  const hasEntry=paths.has(p.entryPath||'index.html');
  const countMatches=p.totalFiles===files.length;
  if(!valid||!hasEntry||!countMatches){
    problem.push({slug:p.slug,type:'invalid-pins-or-entry',valid,hasEntry,countMatches});
    continue;
  }
  pinned++;
  if(sum!==p.totalSourceBytes){
    problem.push({slug:p.slug,type:'derived-total-mismatch',previous:p.totalSourceBytes,actual:sum});
    if(repair){p.totalSourceBytes=sum;corrected++}
  }else fullyReady++;
}
if(repair && corrected){
  manifest.totalFiles=manifest.packages.reduce((n,p)=>n+(p.files?.length??0),0);
  manifest.totalBytes=manifest.packages.reduce((n,p)=>n+(p.totalSourceBytes??0),0);
  await writeFile(file,JSON.stringify(manifest,null,2)+'\n');
}
const result={
  inventory:manifest.packages.length,
  readyFlags:ready,
  validIndividualPins:pinned,
  alreadyInternallyConsistent:fullyReady,
  derivedTotalsRepaired:corrected,
  incomplete:manifest.packages.filter(p=>!p.ready).map(p=>p.slug),
  problems:problem
};
console.log(JSON.stringify(result,null,2));
if(problem.some(p=>p.type==='invalid-pins-or-entry'))process.exitCode=1;
else if(problem.length&&!repair)process.exitCode=2;
