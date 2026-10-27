import {notFound} from 'next/navigation';
import {Player} from '@/components/player';
import type {Game} from '@/lib/types';
import seed from '@/data/seed-games.json';

export const dynamic='force-dynamic';
export default async function GameVerification({params}:{params:Promise<{slug:string}>}){
 if(process.env.VERCEL_ENV!=='preview')notFound();
 const {slug}=await params;
 const game=seed.find(g=>g.slug===slug&&g.collections.includes('classics'));
 if(!game)notFound();
 return <main><div className="notice">Preview gameplay verification</div><Player game={{...game,playCount:0,likes:0} as Game} preview/></main>;
}
