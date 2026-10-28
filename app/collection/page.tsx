import Link from 'next/link';
import {Suspense} from 'react';
import {listGames} from '@/lib/db';
import {Catalogue} from '@/components/catalogue';
import reference from '@/docs/V4_INTEGRATION_STATUS.json';
export const dynamic='force-dynamic';
export const metadata={title:'The 128-Game Collection',description:'Explore the growing 128-game collection on Sidequest.',alternates:{canonical:'/collection'}};
export default async function Collection(){
 const slugs=new Set(reference.games.map(g=>g.slug));
 const games=(await listGames()).filter(g=>slugs.has(g.slug));
 return <main><div className="page-intro"><p className="eyebrow">THE COLLECTION</p><h1>{games.length} games. Plenty of sidequests<span className="brand-dot">.</span></h1><p>Browse the collection, from platformers and puzzles to racing and arcade classics. Some games use an external game host. Gameplay testing is pending your review.</p><p><Link href="/gamerias">Play Papa&apos;s Gamerias →</Link></p></div><Suspense fallback={<p>Loading catalogue…</p>}><Catalogue games={games}/></Suspense></main>;
}
