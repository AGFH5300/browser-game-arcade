import {copyFile,mkdir,readFile,rm,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const manifest=JSON.parse(await readFile(new URL('./catalogue-package-sources.json',import.meta.url),'utf8'));
const revision=manifest.revision;
const rawBase=manifest.rawBase;
const packageList=manifest.packages;
const packageLimit=manifest.packageLimitBytes;
const cacheRoot=path.resolve('.next/cache/sidequest-games',revision);
const outputRoot=path.resolve('public/play/archives');
const bridgePath=path.resolve('public/play/arcade-bridge.js');
const DOWNLOAD_CONCURRENCY=8;
const MAX_ATTEMPTS=4;

if(!/^[a-f0-9]{40}$/i.test(revision)||!rawBase.endsWith('/'+revision))throw new Error('Catalogue source revision must be a pinned Git hash');
if(!Array.isArray(packageList)||!packageList.length)throw new Error('No catalogue packages configured');
const actualBytes=packageList.reduce((sum,p)=>sum+p.files.reduce((n,f)=>n+f.size,0),0);
const actualFiles=packageList.reduce((sum,p)=>sum+p.files.length,0);
if(actualBytes!==manifest.totalBytes||actualFiles!==manifest.totalFiles)throw new Error('Catalogue manifest totals do not match its file lists');
if(actualBytes>=packageLimit)throw new Error(`Catalogue package payload ${actualBytes} exceeds its strict ${packageLimit}-byte limit`);

const safeSlug=value=>typeof value==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
function safeRelativePath(value){
  return typeof value==='string'&&value.length>0&&!path.posix.isAbsolute(value)&&!value.includes('\\')&&value.split('/').every(part=>part&&part!=='.'&&part!=='..');
}
function assertInside(root,target,label){
  const rel=path.relative(root,target);
  if(!rel||rel.startsWith('..'+path.sep)||rel==='..'||path.isAbsolute(rel))throw new Error(`Unsafe ${label} path: ${target}`);
}
const seenSlugs=new Set();
for(const game of packageList){
  if(!safeSlug(game.slug)||seenSlugs.has(game.slug))throw new Error(`Invalid or duplicate catalogue slug: ${game.slug}`);
  seenSlugs.add(game.slug);
  if(!game.ready||!game.sourcePath?.startsWith('play/'))throw new Error(`Package is not marked ready or has invalid source path: ${game.slug}`);
  if(!Array.isArray(game.files)||!game.files.some(f=>f.path===game.entry))throw new Error(`Missing entry page for ${game.slug}`);
  const seenFiles=new Set();
  for(const file of game.files){
    if(!safeRelativePath(file.path)||seenFiles.has(file.path)||!Number.isSafeInteger(file.size)||file.size<0||!/^[a-f0-9]{40}$/i.test(file.sha))throw new Error(`Invalid file metadata for ${game.slug}: ${file.path}`);
    seenFiles.add(file.path);
  }
  const packageBytes=game.files.reduce((n,f)=>n+f.size,0);
  if(packageBytes!==game.totalBytes||game.files.length!==game.totalFiles)throw new Error(`File totals mismatch for ${game.slug}`);
}
const gitBlobSha=data=>createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
function cachePathFor(game,file){
  const target=path.resolve(cacheRoot,game.slug,...file.path.split('/'));
  assertInside(cacheRoot,target,'cache');
  return target;
}
async function cacheMatches(target,file){
  try{
    const info=await stat(target);
    if(!info.isFile()||info.size!==file.size)return false;
    const bytes=await readFile(target);
    return gitBlobSha(bytes)===file.sha;
  }catch{return false}
}
function sourceUrlFor(game,file){
  const parts=[...game.sourcePath.split('/'),...file.path.split('/')].map(encodeURIComponent);
  return `${rawBase}/${parts.join('/')}`;
}
async function downloadOne(game,file){
  const cachePath=cachePathFor(game,file);
  if(await cacheMatches(cachePath,file))return;
  await mkdir(path.dirname(cachePath),{recursive:true});
  const url=sourceUrlFor(game,file);
  let lastError;
  for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
    try{
      const response=await fetch(url,{signal:AbortSignal.timeout(60000),headers:{'Accept':'application/octet-stream'}});
      if(!response.ok)throw new Error(`HTTP ${response.status} for ${url}`);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length!==file.size)throw new Error(`Size mismatch for ${game.slug}/${file.path}: expected ${file.size}, got ${bytes.length}`);
      const actualSha=gitBlobSha(bytes);
      if(actualSha!==file.sha)throw new Error(`Git blob SHA mismatch for ${game.slug}/${file.path}: expected ${file.sha}, got ${actualSha}`);
      await writeFile(cachePath,bytes);
      return;
    }catch(error){
      lastError=error;
      if(attempt<MAX_ATTEMPTS)await new Promise(resolve=>setTimeout(resolve,250*attempt));
    }
  }
  throw lastError;
}
async function runPool(items,limit,worker){
  let cursor=0;const errors=[];
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{
    while(cursor<items.length){
      const index=cursor++;
      try{await worker(items[index]);}
      catch(error){errors.push(error);return;}
    }
  }));
  if(errors.length)throw errors[0];
}
const jobs=packageList.flatMap(game=>game.files.map(file=>({game,file})));
await runPool(jobs,DOWNLOAD_CONCURRENCY,({game,file})=>downloadOne(game,file));
console.log(`Verified ${jobs.length} pinned source files (${actualBytes} bytes) across ${packageList.length} catalogue games.`);

function removeScriptsBySource(html,pattern,modifications,label){
  return html.replace(/<script\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1[^>]*>[\s\S]*?<\/script\s*>/gi,(tag,_quote,src)=>{
    if(!pattern.test(src))return tag;
    modifications.push(label??`Removed source script: ${src}`);
    return '';
  });
}
function sanitizeHtml(game,original){
  let html=original;
  const modifications=[];
  html=removeScriptsBySource(html,/^\/js\/main\.js(?:[?#].*)?$/i,modifications,'Removed source-site navigation script /js/main.js');
  html=removeScriptsBySource(html,/(?:imasdk\.googleapis\.com\/js\/sdkloader\/ima3\.js|googletagmanager\.com\/gtag\/js|pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js|api\.gamemonetize\.com\/sdk_mobile\.js)/i,modifications,'Removed known advertising/analytics script');
  if(game.slug==='crossy-road'){
    html=html.replace(/<script\b[^>]*\bsrc\s*=\s*(["'])poki-sdk\.js\1[^>]*>[\s\S]*?<\/script\s*>/i,()=>{
      modifications.push('Replaced the Poki SDK loader with a local no-network compatibility shim');
      return '<script src="./poki-sdk-compat.js"></script>';
    });
  }
  if(game.slug==='worlds-hardest-game'){
    html=removeScriptsBySource(html,/^(?:https?:)?\/\/www\.google\.com\/jsapi$/i,modifications,'Removed Google host integration script');
    html=html.replace(/<script\b[^>]*>(?:(?!<script\b)[\s\S])*?window\.parent\.maeExportApis_\s*\(\s*\)\s*;?[^<]*<\/script\s*>/i,()=>{
      modifications.push('Removed the source-host parent.maeExportApis_() shim');
      return '';
    });
  }
  if(game.slug==='bitlife-life-simulator'){
    html=html.replace(/<script\b(?![^>]*\bsrc\s*=)[^>]*>(?:(?!<script\b)[\s\S])*?api\.gamemonetize\.com\/sdk_mobile\.js(?:(?!<script\b)[\s\S])*?<\/script\s*>/i,()=>{
      modifications.push('Removed the inline GameMonetize ad SDK loader');
      return '';
    });
  }
  if(game.slug==='cut-the-rope'){
    html=html.replace(/<script\b[^>]*\bsrc\s*=\s*(["'])scripts\/detectmobilebrowser\.js\1[^>]*>[\s\S]*?<\/script\s*>/i,()=>{
      modifications.push('Removed dangling script reference scripts/detectmobilebrowser.js (not present in pinned tree)');
      return '';
    });
  }
  html=html.replace(/<script\b(?![^>]*\bsrc\s*=)[^>]*>(?:(?!<script\b)[\s\S])*?window\.dataLayer[\s\S]*?gtag\s*\(\s*["']config["'][\s\S]*?<\/script\s*>/gi,()=>{
    modifications.push('Removed inline Google Analytics configuration');
    return '';
  });
  if(!/<head\b[^>]*>/i.test(html))throw new Error(`Entry HTML has no head element: ${game.slug}`);
  html=html.replace(/<head\b[^>]*>/i,head=>`${head}\n<script src="./bridge.js"></script>`);
  return {html,modifications};
}
const POKI_COMPAT=`(function(){\n  var resolved=function(value){return Promise.resolve(value);};\n  var noop=function(){};\n  var sdk={\n    init:function(){return resolved(true);},\n    initWithVideoHB:function(){return resolved(true);},\n    rewardedBreak:function(){return resolved(false);},\n    commercialBreak:function(){return resolved(false);},\n    getLeaderboard:function(){return resolved({entries:[]});},\n    destroyAd:noop,customEvent:noop\n  };\n  ["disableProgrammatic","gameLoadingStart","gameLoadingFinished","gameInteractive","roundStart","roundEnd","muteAd"].forEach(function(name){sdk[name]=noop;});\n  ["setDebug","gameplayStart","gameplayStop","gameLoadingProgress","happyTime","setPlayerAge","togglePlayerAdvertisingConsent","toggleNonPersonalized","setConsentString","logError","sendHighscore","setDebugTouchOverlayController"].forEach(function(name){sdk[name]=noop;});\n  window.PokiSDK=new Proxy(sdk,{get:function(target,key){if(key in target)return target[key];return function(){return resolved(false);};}});\n})();\n`;
const bridge=await readFile(bridgePath);
if(!bridge.length)throw new Error('Arcade bridge is empty');
const summaries=[];
for(const game of packageList){
  const targetRoot=path.resolve(outputRoot,game.slug);
  assertInside(outputRoot,targetRoot,'output');
  try{
    const old=JSON.parse(await readFile(path.join(targetRoot,'source-manifest.json'),'utf8'));
    if(old.repository!==manifest.source||old.revision!==revision||old.slug!==game.slug)throw new Error(`Refusing to replace non-catalogue archive directory: ${targetRoot}`);
  }catch(error){
    if(error.code!=='ENOENT'&&error.code!=='ENOTDIR'&&!String(error.message).startsWith('Refusing to replace'))throw error;
    if(String(error.message).startsWith('Refusing to replace'))throw error;
    try{await stat(targetRoot);throw new Error(`Refusing to replace unmarked archive directory: ${targetRoot}`);}catch(statError){if(statError.code!=='ENOENT')throw statError;}
  }
  await rm(targetRoot,{recursive:true,force:true});
  await mkdir(targetRoot,{recursive:true});
  for(const file of game.files){
    const source=cachePathFor(game,file);
    const target=path.resolve(targetRoot,...file.path.split('/'));
    assertInside(targetRoot,target,'package');
    await mkdir(path.dirname(target),{recursive:true});
    await copyFile(source,target);
  }
  const entryFile=path.join(targetRoot,game.entry);
  const original=await readFile(entryFile,'utf8');
  await writeFile(path.join(targetRoot,'index.source.html.txt'),original);
  const {html,modifications}=sanitizeHtml(game,original);
  await writeFile(entryFile,html);
  await copyFile(bridgePath,path.join(targetRoot,'bridge.js'));
  if(game.slug==='crossy-road')await writeFile(path.join(targetRoot,'poki-sdk-compat.js'),POKI_COMPAT);
  const packageMetadata={
    title:game.title,
    slug:game.slug,
    reference:game.reference,
    repository:manifest.source,
    repositoryUrl:manifest.repositoryUrl,
    sourcePath:game.sourcePath,
    revision,
    sourceEntry:game.entry,
    sourceEntryGitBlobSha:game.files.find(file=>file.path===game.entry).sha,
    sourceFiles:game.totalFiles,
    sourceBytes:game.totalBytes,
    rootLicenseFound:manifest.rootLicenseFound,
    licenseNote:game.sourceLicenseStatus,
    retainedLicenseFiles:game.sourceLicenseFiles,
    authorizationNote:manifest.authorizationNote,
    omittedSourceFiles:game.omittedSourceFiles,
    appliedChanges:modifications,
    notes:game.notes,
    gameplayQa:'Not performed; pending user gameplay QA.'
  };
  await writeFile(path.join(targetRoot,'source-manifest.json'),JSON.stringify(packageMetadata,null,2)+'\n');
  summaries.push({slug:game.slug,files:game.totalFiles,bytes:game.totalBytes,changes:modifications});
}
console.log(JSON.stringify({packages:summaries,sourceFiles:actualFiles,sourceBytes:actualBytes,cache:cacheRoot,output:outputRoot},null,2));

