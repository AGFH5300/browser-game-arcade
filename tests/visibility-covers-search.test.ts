import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Header} from '../components/shell';
import {Advertising} from '../components/advertising';
import {getDisplayCover,originalCovers} from '../lib/carlwalks-covers';
import {GET} from '../app/api/original-covers/[slug]/route';
import seed from '../data/seed-games.json';

test('sitewide search is directly visible, functional and uses a GET /games form',()=>{
  const html=renderToStaticMarkup(createElement(Header));
  assert.equal((html.match(/action="\/games"/g)||[]).length,2);
  assert(html.includes('name="q"'));
  assert(html.includes('placeholder="Search games..."'));
  assert(html.includes('placeholder="Search all games..."'));
});

test('no placeholder advertising is rendered on public pages',()=>{
  for(const position of ['left','right','bottom'] as const){
    const html=renderToStaticMarkup(createElement(Advertising,{position}));
    assert.equal(html,'');
  }
});

test('all nine official CarlWalks thumbnails are mapped to exact images',()=>{
  assert.equal(Object.keys(originalCovers).length,9);
  for(const game of seed.filter(g=>g.collections.includes('classics'))){
    assert(originalCovers[game.slug],game.slug);
    assert.equal(getDisplayCover(game.slug,game.thumbnail),`/api/original-covers/${game.slug}`);
    assert(originalCovers[game.slug].url.startsWith('https://www.carlwalks.com/gallery_gen/'));
  }
  assert.equal(getDisplayCover('some-unrelated-puzzle','/covers/old.svg'),'/covers/old.svg');
});

test('original screenshot proxy does not allow arbitrary slug or arbitrary URLs',async()=>{
  const response=await GET(new Request('http://localhost/api/original-covers/evil'),{params:Promise.resolve({slug:'evil'})});
  assert.equal(response.status,404);
});
