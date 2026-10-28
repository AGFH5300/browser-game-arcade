import {Suspense} from 'react';
import Link from 'next/link';
import {listGames} from '@/lib/db';
import {Catalogue} from '@/components/catalogue';
import sources from '@/scripts/gameria-package-sources.json';

export const dynamic='force-dynamic';
export const metadata={title:"Papa's Gamerias",description:"Play the 14 classic browser Papa's Gamerias, from Pizzeria to Scooperia.",alternates:{canonical:'/gamerias'}};
const slugs=new Set(sources.games.map(game=>game.slug));

export default async function Gamerias(){
 const games=(await listGames()).filter(game=>slugs.has(game.slug));
 return <main><div className="page-intro"><p className="eyebrow">FLIPLINE CLASSICS</p><h1>Papa&apos;s Gamerias<span className="brand-dot">.</span></h1><p>Take orders, cook, decorate and serve your way through the 14 classic browser Gamerias. Gameplay, sound and saved progress are pending your browser checks.</p><p><Link href="/collection">Explore the 128-game collection →</Link></p></div><Suspense fallback={<p>Loading Gamerias…</p>}><Catalogue games={games}/></Suspense></main>;
}
