import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/play/deep-dive/';
const entry=readFileSync(root+'reference-gameplay-mascot-entry-20261102.js','utf8');
const css=readFileSync(root+'reference-gameplay-mascot-entry-20261102.css','utf8');
const html=readFileSync(root+'index-public-art.html','utf8');

test('shrimp traverses source-observed entering track at both breakpoints',()=>{
 for(const s of ["translate:'50px -12px'","translate:'22px -26px'",
 "translate:'10px -2px'","translate:'7px -6px'","translate:'0px 0px'",
 "duration:950","MutationObserver","mounted=new WeakSet()"])assert(entry.includes(s),s);
 assert(entry.includes("prefers-reduced-motion: reduce"));
});
test('rest positions are calibrated and entry layer follows all other source styles',()=>{
 for(const x of ['margin-left:-2px!important','margin-top:-7px!important','margin-top:-2px!important'])assert(css.includes(x),x);
 assert(html.includes('reference-gameplay-mascot-entry-20261102.js'));
 assert(html.includes('reference-gameplay-mascot-entry-20261102.css'));
 assert(html.indexOf('reference-gameplay-mascot-entry-20261102.css')>html.indexOf('reference-mascot-boop-source-20261101.css'));
});
