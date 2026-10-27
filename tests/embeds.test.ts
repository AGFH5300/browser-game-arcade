import test from 'node:test';
import assert from 'node:assert/strict';
import { getEmbedSandbox, getTrustedPublisher, isAllowedEmbedUrl } from '../lib/embeds';
import { gameSchema } from '../lib/validation';
import seed from '../data/seed-games.json';

const trustedUrls = [
  'https://y8.com/embed/slope',
  'https://y8.com/embed/moto_x3m_2',
  'https://y8.com/embed/moto_x3m_3',
  'https://play.famobi.com/moto-x3m/A1000-11',
];
const isolated = 'allow-scripts allow-pointer-lock';
const publisherPermissions = `${isolated} allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms`;
const base = {title:'Test',slug:'test-game',description:'',shortDescription:'',categories:[],collections:[],tags:[],developer:'',engine:'iframe',gameUrl:'',sourceUrl:'',license:'MIT',licenseNotes:'Reviewed license',mobile:true,controls:'',instructions:'',featured:false,published:true,displayOrder:0};

test('only the exact approved publisher URLs receive publisher sandbox permissions',()=>{
  for (const url of trustedUrls) {
    assert.ok(getTrustedPublisher(url));
    assert.equal(isAllowedEmbedUrl(url, ''), true);
    assert.equal(gameSchema.safeParse({...base,gameUrl:url}).success, true);
    assert.equal(getEmbedSandbox(url), publisherPermissions);
  }
});

test('untrusted host, path variants, query strings and fragments do not get publisher permissions',()=>{
  const variants = [
    'https://evil.example/embed/slope',
    'https://y8.com.evil.example/embed/slope',
    'https://y8.com/embed/other',
    'https://y8.com/embed/slope?next=https://evil.example',
    'https://y8.com/embed/slope#other',
    'https://play.famobi.com/moto-x3m?mode=evil',
    'http://y8.com/embed/slope',
  ];
  for (const url of variants) {
    assert.equal(getTrustedPublisher(url), null, url);
    assert.equal(isAllowedEmbedUrl(url, ''), false, url);
    assert.equal(getEmbedSandbox(url), isolated, url);
    assert.equal(gameSchema.safeParse({...base,gameUrl:url}).success, false, url);
  }
});

test('custom configured HTTPS hosts remain allowed but stay isolated',()=>{
  const url='https://games.example/embed/title?level=2';
  assert.equal(isAllowedEmbedUrl(url, 'games.example'), true);
  assert.equal(getEmbedSandbox(url), isolated);
  const previous=process.env.EMBED_ALLOWED_HOSTS;
  process.env.EMBED_ALLOWED_HOSTS='games.example';
  try { assert.equal(gameSchema.safeParse({...base,gameUrl:url}).success, true); } finally { if(previous===undefined) delete process.env.EMBED_ALLOWED_HOSTS; else process.env.EMBED_ALLOWED_HOSTS=previous; }
});

test('local game frames keep their opaque sandbox even when publisher URL host changes',()=>{
  assert.equal(getEmbedSandbox('/play/local/index.html'), isolated);
  assert.equal(getEmbedSandbox('https://y8.com/embed/slope'), publisherPermissions);
});

test('only exact CarlWalks standalone HTML5 engines may use the full publisher iframe sandbox',async()=>{
 const {classicGameEntrypoints,playableClassic}=await import('../lib/classic-sources');
 const entries=Object.entries(classicGameEntrypoints);
 assert.equal(entries.length,7);
 for(const [slug,url] of entries){
   assert.equal(isAllowedEmbedUrl(url,''),true,slug);
   assert.equal(getEmbedSandbox(url),publisherPermissions,slug);
   assert.equal(getTrustedPublisher(url)?.externalOnly,undefined,slug);
   assert.equal(gameSchema.safeParse({...base,slug,gameUrl:url}).success,true,slug);
 }
 for(const url of [
   'https://carlwalks.com/build_engine/root/moto-x3m/other.html',
   'https://evil.example/build_engine/root/moto-x3m/index.html',
   'http://carlwalks.com/build_engine/root/moto-x3m/index.html',
   'https://carlwalks.com/build_engine/root/moto-x3m/index.html?next=evil',
   'https://carlwalks.com/build_engine/root/moto-x3m/index.html#x',
 ])assert.equal(isAllowedEmbedUrl(url,''),false,url);
 const sample={...seed.find(g=>g.slug==='moto-x3m')!,gameUrl:'https://play.famobi.com/moto-x3m/A1000-11',tags:['publisher-embed'],playCount:0,likes:0} as import('../lib/types').Game;
 assert.equal(playableClassic(sample).gameUrl,classicGameEntrypoints['moto-x3m']);
 assert(!playableClassic(sample).tags.includes('publisher-embed'));
});
