import {Suspense} from 'react';
import {listGames} from '@/lib/db';
import {Catalogue} from '@/components/catalogue';

export const dynamic='force-dynamic';
export const metadata={title:'Flash Library',description:'Play classic browser games in the Sidequest Flash Library.',alternates:{canonical:'/classics'}};

export default async function Classics(){const games=await listGames();return <main><div className="page-intro"><p className="eyebrow">THE CLASSICS COLLECTION</p><h1>Flash Library<span className="brand-dot">.</span></h1><p>Beloved browser classics and arcade favorites, ready to play.</p></div><Suspense fallback={<p>Loading catalogue…</p>}><Catalogue games={games} collection="classics"/></Suspense></main>}
