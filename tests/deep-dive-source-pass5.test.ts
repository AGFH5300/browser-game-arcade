import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';

const base='public/play/deep-dive/';
const game=readFileSync(base+'game.js','utf8');
const html=readFileSync(base+'index-public-art.html','utf8');
const css=readFileSync(base+'reference-source-pages.css','utf8');
const artCss=readFileSync(base+'reference-art.css','utf8');
const domCss=readFileSync(base+'reference-dom-parity.css','utf8');
const menu=readFileSync(base+'reference-source-navigation.js','utf8');

test('public free homepage is source-style Daily with separate Endless Dive intro',()=>{
 assert.match(game,/function renderHome\(isEndless=false\)/);
 for(const text of ['THE ENDLESS DIVE','THE DAILY DIVE','dive after dive · rarer answers sink deeper','OPEN THE DIVE LOG','HOW TO PLAY'])
  assert(game.includes(text),text);
 assert(!game.includes('A SIDEQUEST ORIGINAL ·'));
 assert(html.includes('reference-source-pages.css?release=20261030stagefix1'));
});

test('centered source navigation modal keeps every available local route',()=>{
 for(const route of ['daily','endless','party','archive','worlds','account','friends'])
  assert(menu.includes('data-menu-view="'+route+'"'),route);
 assert(html.includes('data-view="archive" class="nav-pill"'));
 assert(menu.includes('keydown'));
 assert(menu.includes('Escape'));
 assert(menu.includes('MY KRILLION'));
 assert(menu.includes('<span>FRIENDS</span>'));
 assert(menu.includes('https://shop.krillion.io/'));
 assert(menu.includes('https://chainle.io/'));
 assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert(css.includes('place-items:center'));
 assert(css.includes('.dd-source-menu-panel'));
 assert(css.includes('.dd-source-menu-backdrop'));
});

test('homepage uses a bottom-aligned proportional sky, left-aligned controls and a 2px-per-metre intro ruler',()=>{
 const start=game.indexOf('  function oceanDecor(){');
 const end=game.indexOf('  function gameOverlays(){',start);
 const markup=vm.runInNewContext(game.slice(start,end)+'\noceanDecor;')();
 assert.match(markup,/top:0px/);
 assert.match(markup,/top:200px[^>]*>-100m</);
 assert.match(markup,/top:400px[^>]*>-200m</);
 assert.equal((markup.match(/class="dd-depth-tick major/g)||[]).length,71);
 assert.match(artCss,/background-position:center bottom!important;background-size:100% auto!important/);
 assert.match(domCss,/height:55svh!important/);
 assert.match(domCss,/height:45svh!important/);
 assert.match(css,/width:min\(600px,calc\(100% - 32px\)\)/);
 assert(!game.includes('dd-party-live'),'home has no fabricated live player count');
 assert.match(game,/complete\?'▼ VIEW DIVE RESULTS ▼':'▼ BEGIN DESCENT ▼'/,'existing completion state remains data-driven');
});

test('the original four free themed pack cards, original images and coming soon music remain',()=>{
 for(const [mode,asset] of [
  ['lexicon','lexicon.webp'],['movies','movies.webp'],['sports','sports.webp'],['geography','geography.webp']
 ]) {
  assert(game.includes("['"+mode+"'"));
  assert(existsSync(base+'reference-assets/gen/optimized/v1/cards/'+asset));
 }
 for(const label of ['FREE FOR NOW · BETA','NOW SHOWING','GAME ON','PASSPORT READY','COMING SOON','MUSIC'])
  assert(game.includes(label));
 assert(game.includes('30 CHAPTERS'));
 assert(game.includes('other chapters are not represented as playable'));
});

test('source-style free Unlimited is seven rounds with original timer rather than handmade 50-round lives',()=>{
 assert(game.includes('function startPublicUnlimited()'));
 assert(game.includes("start('endless','',0,'',ids)"));
 assert(game.includes("startPublicUnlimited();break"));
 assert(game.includes("active.ids.length>7&&active.misses>=3"));
 assert(game.includes("active.ids.length>7?' · '"));
});

test('historical Archive records best local score and preserves published answers',()=>{
 assert(game.includes('const played=profile.history.filter('));
 assert(game.includes('BEST '));
 assert(game.includes('function loadArchiveSheet(day)'));
 assert(game.includes('published-archive-snapshot'));
});

test('source-like results contain honest local-only distribution, vertical dive log and surfaced scene',()=>{
 assert(game.includes('function localResultCurve(r)'));
 assert(game.includes('SAVED LOCAL RUNS'));
 assert(game.includes('Player distribution unavailable'));
 assert(!game.includes('Illustrative shape only'));
 assert(game.includes('function scoreTrail(results)'));
 assert(game.includes('dd-score-trail-stem'));
 assert(game.includes('dd-result-surface-decor'));
 assert(game.includes('dd-result-ghost'));
 assert(css.includes('.dd-personal-distribution'));
 assert(css.includes('.dd-result-surface-decor'));
 assert(css.includes('@keyframes dd-result-curve-in'));
});

test('correction preview is editable, requires a second submission and only scores validated answers',()=>{
 assert(game.includes('const corrected=!exactWritten'));
 assert(game.includes('if(corrected&&window.DeepDiveReference?.preferences?.answerCorrections!==false'));
 assert(game.includes('correction={raw:answer,canonical:found.value}'));
 assert(game.includes('if(correction&&strictNorm(input.value)!==strictNorm(correction.canonical))'));
 assert(game.includes("Math.max(0,Math.min(5,Number(found.tier)||0))"));
 assert(game.includes("key.length>=18?3:key.length>=10?2:1"));
});

test('a separate foreground canvas uses the observed layer structure and supports reduced motion',()=>{
 const foreground=readFileSync(base+'reference-foreground.js','utf8');
 assert(html.includes('reference-foreground.js?release=20261030pass5a'));
 assert(foreground.includes('dd-reference-fore-canvas'));
 assert(foreground.includes('prefers-reduced-motion'));
 assert(foreground.includes('visibilitychange'));
 assert(foreground.includes('aria-hidden'));
 assert(css.includes('.dd-reference-fore-canvas'));
});

test('stale legacy Discovery result is prevented by a versioned no-cache player iframe',()=>{
 const player=readFileSync('components/player.tsx','utf8');
 const config=readFileSync('next.config.ts','utf8');
 assert(player.includes("game.slug==='deep-dive'&&game.gameUrl==='/play/deep-dive/index-public-art.html'"));
 assert(player.includes('release=20261030social1'));
 assert(config.includes("source:'/play/deep-dive/index-public-art.html'"));
 assert(config.includes("value:'no-cache, no-store, must-revalidate'"));
 assert(!game.includes('COPY YOUR RESULT'));
 assert(!game.includes('RETURN TO SURFACE'));
});
test('new result page does not claim invented worldwide player percentiles',()=>{
 assert(game.includes('function localResultCurve(r)'));
 assert(game.includes('Player distribution unavailable'));
 assert(!game.includes('Krillion player percentile unavailable'));
 assert(!game.includes('BETTER THAN 92%'));
});
test('local result curve shows no invented shape below five runs and plots finite saved history above five',()=>{
 const start=game.indexOf('  function localResultCurve(r){');
 const end=game.indexOf('  function scoreTrail(results){',start);
 assert(start>=0&&end>start,'localResultCurve source is extractable');
 const curveSource=game.slice(start,end)+'\nlocalResultCurve;';
 const render=(history:{mode:string;count:number;score:number}[])=>vm.runInNewContext(curveSource,{profile:{history}})({mode:'daily',count:7,score:350});
 const sparse=render([{mode:'daily',count:7,score:120},{mode:'daily',count:7,score:NaN}]);
 assert.match(sparse,/viewBox="0 0 480 157"/);
 assert.match(sparse,/Player distribution unavailable/);
 assert(!/class="dd-personal-curve"/.test(sparse),'no curve is drawn for fewer than five valid runs');
 assert.match(sparse,/<line x1="[\d.]+" x2="[\d.]+"/,'score marker remains visible');
 const history=Array.from({length:6},(_,i)=>({mode:'daily',count:7,score:100+i*80}));
 const full=render(history);
 assert.match(full,/DISTRIBUTION OF 6 SAVED LOCAL RUNS/);
 assert.match(full,/class="dd-personal-curve" d="M[\d.,L ]+"/);
 assert(!/NaN|Infinity/.test(full),'rendered chart coordinates are finite');
 assert(!/percentile/i.test(full),'local history is not presented as a global percentile');
});
test('unique typo correction handles transposed letters, preserves explicit confirmation',()=>{
 assert(game.includes('if(prev2&&i>1&&j>1'));
 assert(game.includes('prev2[j-2]+1'));
 assert(game.includes('correction={raw:answer,canonical:found.value}'));
 assert(game.includes("const limit=key.length>=18?3:key.length>=10?2:1"));
});

test('free Unlimited advances game IDs and resumes archived seven-question runs',()=>{
 assert(game.includes('unlimitedGameId:1'));
 assert(game.includes('profile.unlimitedGameId=Math.max('));
 assert(game.includes('sidequest-unlimited-days:'));
 assert(game.includes('sidequest-unlimited-rounds:'));
 assert(game.includes('active.unlimitedGameId=gameId'));
 assert(game.includes("active?.mode==='endless'?'endless'"));
});

test('Daily how-to reflects the original public six-line instructions',()=>{
 for(const line of ['7 PROMPTS A DAY. SAME FOR EVERYONE.','25 SECONDS TO NAME ONE THING.',
  'RARE ANSWERS SCORE BIG. OBVIOUS ONES FLOAT.','THE PICK THAT FEELS CLEVER? THE SCHOOL THOUGHT OF IT TOO.',
  'EVERY POINT SINKS YOU 10 METRES. 700 IS THE TRENCH.','ONE DIVE PER DAY. NO SECOND CHANCES.'])
  assert(game.includes(line),line);
 assert(css.includes('.dd-source-howto'));
});
