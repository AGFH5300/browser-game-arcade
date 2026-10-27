import type { Game } from './types';
export const categories=['Action','Adventure','Arcade','Racing','Puzzle','Platformer','Sports','Strategy','Simulation','Multiplayer','Casual','Retro','Classic','HTML5','Flash Archive'];
export type Filters={q?:string;category?:string;sort?:string;page?:number;collection?:string};
export function selectGames(games:Game[],f:Filters){
 const q=(f.q||'').trim().toLowerCase();
 const filtered=games.filter(g=>g.published&&(!f.category||g.categories.includes(f.category))&&(!q||[g.title,g.developer,...g.categories,...g.tags].join(' ').toLowerCase().includes(q)));
 filtered.sort((a,b)=>f.sort==='az'?a.title.localeCompare(b.title):f.sort==='za'?b.title.localeCompare(a.title):['popular','played'].includes(f.sort||'')?b.playCount-a.playCount||a.title.localeCompare(b.title):f.sort==='liked'?b.likes-a.likes||a.title.localeCompare(b.title):new Date(b.publishedAt||b.createdAt).getTime()-new Date(a.publishedAt||a.createdAt).getTime()||a.displayOrder-b.displayOrder);
 const page=Math.max(1,Math.min(Math.ceil(filtered.length/20)||1,Math.floor(Number.isFinite(f.page)?f.page!:1)));
 return {games:filtered.slice((page-1)*20,page*20),total:filtered.length,page,pages:Math.ceil(filtered.length/20)};
}
