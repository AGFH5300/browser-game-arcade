import type {Game} from './types';

// Independently inspected CarlWalks standalone game entrypoints (October 27, 2026).
// Fixed HTTPS URLs only: never proxy an arbitrary user-supplied URL.
// The owner has stated permission to use this selection in Sidequest.
// A cross-origin iframe may still depend on remote assets or network policy.
export const classicGameEntrypoints: Readonly<Record<string,string>>=Object.freeze({
  'polytrack':'https://carlwalks.com/build_engine/root/polytrack-0.3.1/index.html',
  'moto-x3m':'https://carlwalks.com/build_engine/root/moto-x3m/index.html',
  'slope':'https://carlwalks.com/build_engine/root/slope/index.html',
  'crossy-road':'https://carlwalks.com/build_engine/root/crossy-road/index.html',
  'fnaf':'https://carlwalks.com/build_engine/root/fnaf/index.html',
  'moto-x3m-2':'https://carlwalks.com/build_engine/root/moto-x3m-2/index.html',
  'moto-x3m-3':'https://carlwalks.com/build_engine/root/moto-x3m-3/index.html',
});

// Overrides outdated publisher landing pages without modifying game IDs,
// engagement counts or user-managed game metadata.
export function playableClassic(game:Game):Game{
  const target=classicGameEntrypoints[game.slug];
  if(!target||!game.collections.includes('classics'))return game;
  const noLongerNecessary=new Set(['publisher-embed','webgl']);
  // Slope and PolyTrack actually use WebGL. Moto X3M 2/3 use HTML5 canvas.
  if(game.slug==='slope'||game.slug==='polytrack')noLongerNecessary.delete('webgl');
  const tags=game.tags.filter(t=>!noLongerNecessary.has(t));
  return {...game,engine:'iframe',gameUrl:target,tags,sourceUrl:`https://www.carlwalks.com/flash/${game.slug==='moto-x3m-2'?'moto-x3m2':game.slug==='moto-x3m-3'?'moto-x3m3':game.slug}/`,license:'Owner-authorized standalone browser build',licenseNotes:'The owner confirms permission to use this CarlWalks-hosted game build in Sidequest. Technical reliability and cross-origin audio control remain independently testable.'};
}
