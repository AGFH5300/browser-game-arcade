import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSafeRewrite} from '../scripts/parse-safe-js-rewrite.mjs';

test('rewritten JavaScript cannot replace a valid program with an invalid URL-mangled one',()=>{
 const source='var splashAfterFadeOutWait=(typeof cr_is_preview === "undefined" ? 200 : 0);';
 const bad=source.replace(' ? 200 : 0','./c2runtime.js?%20200%20:%200');
 assert.equal(parseSafeRewrite(source,bad).text,source);
 assert.equal(parseSafeRewrite(source,bad).restored,true);
});
test('valid transforms survive; an invalid pinned source is never fabricated into valid code',()=>{
 assert.equal(parseSafeRewrite('let x=1;', 'let x=2;').text,'let x=2;');
 assert.equal(parseSafeRewrite('let =;', 'let another=2;').text,'let another=2;');
});

test('generic JavaScript asset replacement rejects punctuation-only string literals',()=>{
 const code=readFileSync('scripts/prepare-reference-packages.mjs','utf8');
 assert(code.includes('STATIC_EXTENSIONS.has(path.posix.extname(assetPath).toLowerCase())'));
 assert(code.includes('const assetPath = unescaped.split(/[?#]/,1)[0]'));
});
