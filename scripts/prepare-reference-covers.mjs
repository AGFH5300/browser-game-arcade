import {createHash} from 'node:crypto';
import {mkdir,readFile,rename,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const INVENTORY_PATH=path.join(ROOT,'data/watchdocumentaries-inventory.json');
const MANIFEST_PATH=path.join(ROOT,'scripts/reference-cover-sources.json');
const OUTPUT_ROOT=path.join(ROOT,'public/covers/reference');
const OUTPUT_RELATIVE='public/covers/reference';
const MAX_BYTES=2*1024*1024;
const CONCURRENCY=8;
const USER_AGENT='Mozilla/5.0';

function slugFromPage(page){
  const url=new URL(page);
  const segment=url.pathname.split('/').filter(Boolean).at(-1);
  if(!segment)throw new Error(`Reference page has no slug: ${page}`);
  const slug=segment.replace(/-game$/,'').toLowerCase();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error(`Unsafe reference page slug: ${page}`);
  return slug;
}

function sourceRows(inventory){
  if(!Array.isArray(inventory.games)||inventory.games.length!==128)throw new Error('Expected exactly 128 games in data/watchdocumentaries-inventory.json');
  const seen=new Set();
  return inventory.games.map(game=>{
    if(typeof game.title!=='string'||typeof game.source_page!=='string'||typeof game.screenshot_source!=='string'){
      throw new Error(`Missing observed cover source fields for ${game.title??'unknown title'}`);
    }
    const source=new URL(game.screenshot_source);
    if(source.protocol!=='https:'||source.hostname!=='watchdocumentaries.com')throw new Error(`Unexpected screenshot source host: ${game.screenshot_source}`);
    const slug=slugFromPage(game.source_page);
    if(seen.has(slug))throw new Error(`Duplicate cover output slug: ${slug}`);
    seen.add(slug);
    return {
      title:game.title,
      sourcePage:game.source_page,
      sourceURL:source.href,
      slug,
      outputPath:`${OUTPUT_RELATIVE}/${slug}.jpg`,
      mimeType:null,
      sizeBytes:null,
      sha256:null,
      status:'pending'
    };
  });
}

async function readJson(file){
  return JSON.parse(await readFile(file,'utf8'));
}

function imageType(bytes){
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return {mimeType:'image/jpeg',extension:'jpg'};
  if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return {mimeType:'image/png',extension:'png'};
  throw new Error('Response bytes are not a JPEG or PNG image');
}

function safeOutputPath(relative){
  if(typeof relative!=='string'||!relative.startsWith(`${OUTPUT_RELATIVE}/`)||relative.includes('..')||relative.includes('\\')){
    throw new Error(`Unsafe cover output path: ${relative}`);
  }
  const target=path.resolve(ROOT,relative);
  const rel=path.relative(OUTPUT_ROOT,target);
  if(!rel||rel==='..'||rel.startsWith(`..${path.sep}`)||path.isAbsolute(rel))throw new Error(`Cover path escapes output root: ${relative}`);
  return target;
}

function sourceListMatches(manifest,rows){
  if(!Array.isArray(manifest.items)||manifest.items.length!==rows.length)return false;
  const byTitle=new Map(manifest.items.map(item=>[item.title,item]));
  return rows.every(row=>{
    const item=byTitle.get(row.title);
    return item&&item.sourcePage===row.sourcePage&&item.sourceURL===row.sourceURL&&item.slug===row.slug;
  });
}

async function download(row){
  const response=await fetch(row.sourceURL,{
    headers:{'User-Agent':USER_AGENT,'Accept':'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'},
    signal:AbortSignal.timeout(30000)
  });
  if(!response.ok)throw new Error(`HTTP ${response.status} fetching ${row.sourceURL}`);
  if(!response.url.startsWith('https://'))throw new Error(`Refusing non-HTTPS redirect for ${row.sourceURL}`);
  const length=Number(response.headers.get('content-length'));
  if(Number.isFinite(length)&&length>MAX_BYTES)throw new Error(`Cover exceeds ${MAX_BYTES} bytes: ${row.sourceURL} (${length})`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length===0||bytes.length>MAX_BYTES)throw new Error(`Invalid cover size ${bytes.length} bytes for ${row.sourceURL}; max is ${MAX_BYTES}`);
  const type=imageType(bytes);
  const headerType=(response.headers.get('content-type')??'').split(';')[0].trim().toLowerCase();
  if(headerType&&headerType!=='application/octet-stream'&&headerType!==type.mimeType){
    throw new Error(`Content-Type mismatch for ${row.sourceURL}: header ${headerType}, bytes ${type.mimeType}`);
  }
  return {
    row,
    bytes,
    mimeType:type.mimeType,
    outputPath:`${OUTPUT_RELATIVE}/${row.slug}.${type.extension}`,
    sha256:createHash('sha256').update(bytes).digest('hex')
  };
}

async function runPool(rows,limit,worker){
  let cursor=0;
  const results=new Array(rows.length);
  const errors=[];
  await Promise.all(Array.from({length:Math.min(limit,rows.length)},async()=>{
    while(cursor<rows.length){
      const index=cursor++;
      try{results[index]=await worker(rows[index]);}
      catch(error){errors.push(new Error(`${rows[index].title}: ${error.message}`));}
    }
  }));
  if(errors.length)throw new AggregateError(errors,`${errors.length} cover download(s) failed`);
  return results;
}

async function atomicWrite(file,bytes){
  await mkdir(path.dirname(file),{recursive:true});
  const temp=`${file}.${process.pid}.tmp`;
  await writeFile(temp,bytes);
  await rename(temp,file);
}

async function record(){
  const inventory=await readJson(INVENTORY_PATH);
  const rows=sourceRows(inventory);
  let old={items:[]};
  try{old=await readJson(MANIFEST_PATH);}catch(error){if(error.code!=='ENOENT')throw error;}
  const oldByTitle=new Map((old.items??[]).map(item=>[item.title,item]));
  const downloaded=await runPool(rows,CONCURRENCY,download);
  for(const item of downloaded){
    const prior=oldByTitle.get(item.row.title);
    if(prior?.sha256&&prior.sourceURL===item.row.sourceURL&&prior.sha256!==item.sha256){
      throw new Error(`Pinned cover changed for ${item.row.title}: expected ${prior.sha256}, received ${item.sha256}. Review the source before updating the pin.`);
    }
  }
  for(const item of downloaded){
    await atomicWrite(safeOutputPath(item.outputPath),item.bytes);
  }
  const recordedAt=new Date().toISOString();
  const items=downloaded.map(item=>({
    title:item.row.title,
    sourcePage:item.row.sourcePage,
    sourceURL:item.row.sourceURL,
    slug:item.row.slug,
    outputPath:item.outputPath,
    mimeType:item.mimeType,
    sizeBytes:item.bytes.length,
    sha256:item.sha256,
    recordedAt,
    status:'pinned'
  }));
  const manifest={
    schemaVersion:1,
    sourceInventory:'data/watchdocumentaries-inventory.json',
    observedAt:inventory.date,
    recordedAt,
    maxBytes:MAX_BYTES,
    total:items.length,
    items
  };
  await atomicWrite(MANIFEST_PATH,`${JSON.stringify(manifest,null,2)}\n`);
  console.log(`Recorded ${items.length} exact-source covers (${downloaded.reduce((sum,item)=>sum+item.bytes.length,0)} bytes); SHA-256 pins saved to scripts/reference-cover-sources.json.`);
}

async function verify(){
  const inventory=await readJson(INVENTORY_PATH);
  const rows=sourceRows(inventory);
  const manifest=await readJson(MANIFEST_PATH);
  if(!sourceListMatches(manifest,rows))throw new Error('Cover source manifest does not match the 128 URLs in data/watchdocumentaries-inventory.json');
  if(manifest.total!==128||manifest.items.some(item=>item.status!=='pinned'||!/^[a-f0-9]{64}$/.test(item.sha256??'')))throw new Error('Cover manifest does not contain 128 SHA-256-pinned entries');
  for(const item of manifest.items){
    if(item.sizeBytes<1||item.sizeBytes>MAX_BYTES)throw new Error(`Invalid recorded size for ${item.title}: ${item.sizeBytes}`);
    const file=safeOutputPath(item.outputPath);
    const info=await stat(file);
    if(!info.isFile()||info.size!==item.sizeBytes)throw new Error(`Cover size mismatch for ${item.title}`);
    const bytes=await readFile(file);
    const detected=imageType(bytes);
    const actual=createHash('sha256').update(bytes).digest('hex');
    if(detected.mimeType!==item.mimeType||actual!==item.sha256)throw new Error(`Cover bytes/hash mismatch for ${item.title}`);
  }
  console.log(`Verified ${manifest.items.length} local JPEG/PNG covers against recorded SHA-256 pins (max ${MAX_BYTES} bytes each).`);
}

async function prepare(){
  const rows=sourceRows(await readJson(INVENTORY_PATH));
  const manifest=await readJson(MANIFEST_PATH);
  if(!sourceListMatches(manifest,rows)||manifest.total!==128)throw new Error('Unexpected cover manifest');
  const cacheRoot=path.join(ROOT,'.next/cache/sidequest-covers');
  let fetched=0;
  await runPool(manifest.items,CONCURRENCY,async item=>{
    if(!/^[a-f0-9]{64}$/.test(item.sha256??''))throw new Error('Cover is not pinned');
    const cache=path.join(cacheRoot,item.sha256);
    const output=safeOutputPath(item.outputPath);
    let bytes;
    for(const file of [output,cache]){
      try{const candidate=await readFile(file);if(candidate.length===item.sizeBytes&&createHash('sha256').update(candidate).digest('hex')===item.sha256){bytes=candidate;break;}}catch{}
    }
    if(!bytes){
      const result=await download(item);
      if(result.sha256!==item.sha256||result.bytes.length!==item.sizeBytes)throw new Error('Pinned cover changed: '+item.title);
      bytes=result.bytes;fetched++;
    }
    await atomicWrite(cache,bytes);await atomicWrite(output,bytes);
  });
  console.log(JSON.stringify({covers:manifest.total,downloaded:fetched}));
}

const mode=process.argv[2];
if(mode==='--record')await record();
else if(mode==='--verify')await verify();
else if(!mode||mode==='--prepare')await prepare();
else{
  console.error('Usage: node scripts/prepare-reference-covers.mjs --record|--verify|--prepare');
  process.exitCode=2;
}
