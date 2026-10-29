import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('all Construct 2 files are protected from unsafe generic JS URL rewriting',()=>{
 const manifest=JSON.parse(readFileSync('scripts/reference-package-sources.json','utf8'));
 for(const slug of ['angry-heroes','eggy-car','ovo']){
  const pkg=manifest.packages.find((p:{slug:string})=>p.slug===slug);
  assert(pkg);
  assert(pkg.files.some((f:{path:string})=>f.path==='c2runtime.js'));
 }
 assert.doesNotThrow(()=>new vm.Script('var x=(typeof cr_is_preview === "undefined" ? 200 : 0);'));
 const code=readFileSync('scripts/prepare-reference-packages.mjs','utf8');
 assert(code.includes("file.path==='c2runtime.js'"));
 assert(!code.includes("pkg.slug==='ovo' && file.path==='c2runtime.js'"));
});
test('Subway Surfers removes forbidden document.domain before the game loads',()=>{
 const code=readFileSync('scripts/prepare-reference-packages.mjs','utf8');
 assert(code.includes("pkg.slug==='subway-surfers' && file.path===requiredEntryPath(pkg)"));
 assert(code.includes("if(text===before)throw new Error('Subway Surfers document.domain guard signature changed')"));
});

test('Ice Dodo safe browser namespace fallback does not tamper with SRI jQuery',()=>{
 const code=readFileSync('scripts/prepare-reference-packages.mjs','utf8');
 assert(code.includes("pkg.slug==='ice-dodo' && file.path===requiredEntryPath(pkg)"));
 assert(code.includes('window.chrome = window.chrome || {}'));
 assert(code.includes('STATIC_EXTENSIONS.has(path.posix.extname(assetPath).toLowerCase())'));
});
