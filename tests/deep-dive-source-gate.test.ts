import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const p=(x:string)=>readFileSync('public/play/deep-dive/'+x,'utf8');
test('source-like Friends and Account guests retain independent username-password sign in',()=>{
 const code=p('reference-social.js'),css=p('reference-source-social-gate-20261031.css');
 for(const v of ['YOUR DIVER’S LOGBOOK','Keep your dives together.','Bring your friends along.','expandLogin','ds-social-auth','password','application/json'])assert(code.includes(v),v);
 assert(css.includes('.ds-social-source-gate .ds-social-card'));
 assert(p('index-public-art.html').includes('reference-source-social-gate-20261031.css'));
});
test('Unlimited source animation and CTA position retain local 76-dive selection',()=>{
 const code=p('game.js'),css=p('reference-overlays-parity-20261031.css');
 assert(code.includes('Array.from({length:76}'));
 assert(code.includes('class="dd-home-mascot"'));
 assert(css.includes('[data-mode="endless"][data-phase="intro"] .dd-sea-center'));
 assert(css.includes('translateY(86px)'));
});
