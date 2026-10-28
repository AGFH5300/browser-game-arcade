import test from 'node:test';
import assert from 'node:assert/strict';
import {getTrustedPublisher} from '../lib/embeds';
import reference from '../data/reference-games.json';

test('Cookie Clicker opens officially instead of displaying a blocked iframe',()=>{
 const game=reference.find(g=>g.slug==='cookie-clicker');
 assert(game);
 const host=getTrustedPublisher(game.gameUrl);
 assert(host);
 assert.equal(host.externalOnly,true);
 assert.match(host.disclosure,/restricts cross-site embedding/);
 const mini=getTrustedPublisher('https://www.miniplay.com/embed/monkey-mart');
 assert(mini);
 assert.notEqual(mini.externalOnly,true);
});
