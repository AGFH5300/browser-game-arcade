import {Suspense} from 'react';
import {listGames} from '@/lib/db';
import {Catalogue} from '@/components/catalogue';

export const dynamic='force-dynamic';
export const metadata={title:'HTML5 & Puzzles',description:'Browse modern HTML5 games and thoughtful puzzle games you can play in your browser.',alternates:{canonical:'/html5'}};

export default async function Html5Puzzles(){const games=await listGames();return <main><div className="page-intro"><p className="eyebrow">MODERN GAMES & BRAIN TEASERS</p><h1>HTML5 &amp; Puzzles<span className="brand-dot">.</span></h1><p>Quick to load, satisfying to solve, and ready whenever you are.</p></div><Suspense fallback={<p>Loading catalogue…</p>}><Catalogue games={games} collection="html5_puzzles"/></Suspense></main>}
