import {notFound} from 'next/navigation';
import {getGame} from '@/lib/db';
import {Player} from '@/components/player';
import {archiveOrigin,archivePaths} from '@/lib/game-archives';
export const dynamic='force-dynamic';
export default async function Preview({params}:{params:Promise<{slug:string}>}){
 if(process.env.VERCEL_ENV!=='preview')notFound();
 const {slug}=await params;if(slug!=='moto-x3m-2')notFound();
 const game=await getGame(slug);if(!game)notFound();
 return <main><div className="notice">Local package verification · Existing production record is unchanged.</div><Player game={{...game,gameUrl:archiveOrigin+archivePaths[0]}} preview/></main>;
}
