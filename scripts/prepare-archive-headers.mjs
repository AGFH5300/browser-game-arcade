import {readFile,writeFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile(new URL('./reference-package-sources.json',import.meta.url),'utf8'));
const selected=JSON.parse(await readFile(new URL('./deployed-reference-packages.json',import.meta.url),'utf8'));
const headers=[];
for(const slug of selected){
 const pkg=manifest.packages.find(p=>p.slug===slug);
 if(!pkg?.ready)throw new Error(`Unpinned release package: ${slug}`);
 for(const file of pkg.files){
  const encoding=file.contentEncoding||'identity';
  if(!['identity','gzip','br','deflate'].includes(encoding))throw new Error(`Unsupported encoding ${slug}/${file.path}`);
  let type=file.contentType;
  if(/\.wasm(?:\.(?:br|gz|unityweb))?$/.test(file.path)||/\.wasm\.code\.unityweb$/.test(file.path))type='application/wasm';
  if(/\.(?:m?js)(?:\.(?:br|gz|unityweb))?$/.test(file.path)||/\.wasm\.framework\.unityweb$/.test(file.path))type='application/javascript';
  if(encoding==='identity'&&type===file.contentType)continue;
  headers.push({path:`/play/archives/${slug}/${file.path}`,contentType:type,contentEncoding:encoding});
 }
}
await writeFile(new URL('../lib/archive-content-headers.json',import.meta.url),JSON.stringify(headers,null,2)+'\n');
console.log(`Prepared ${headers.length} exact archive content headers.`);
