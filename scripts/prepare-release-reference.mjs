import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const selected=JSON.parse(await readFile(new URL('./deployed-reference-packages.json',import.meta.url),'utf8'));
const source=JSON.parse(await readFile(new URL('./reference-package-sources.json',import.meta.url),'utf8'));
const batches=[];let batch=[],bytes=0;
for(const slug of selected){
 const pkg=source.packages.find(p=>p.slug===slug);
 if(!pkg?.ready)throw new Error(`Release package is not pinned: ${slug}`);
 if(batch.length&&(batch.length>=8||bytes+pkg.totalSourceBytes>160000000)){batches.push(batch);batch=[];bytes=0;}
 batch.push(slug);bytes+=pkg.totalSourceBytes;
}
if(batch.length)batches.push(batch);
for(let i=0;i<batches.length;i++){
 console.log(`Preparing release batch ${i+1}/${batches.length}: ${batches[i].join(',')}`);
 execFileSync(process.execPath,['scripts/prepare-reference-packages.mjs','--build-selected',batches[i].join(',')],{cwd:root,stdio:'inherit'});
}
