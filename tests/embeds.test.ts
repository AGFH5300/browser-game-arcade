import test from 'node:test';
import assert from 'node:assert/strict';
import { getEmbedSandbox, getTrustedPublisher, isAllowedEmbedUrl } from '../lib/embeds';
import { gameSchema } from '../lib/validation';

const trustedUrls = [
  'https://y8.com/embed/slope',
  'https://y8.com/embed/moto_x3m_2',
  'https://y8.com/embed/moto_x3m_3',
  'https://play.famobi.com/moto-x3m',
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
