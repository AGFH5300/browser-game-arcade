import { notFound,redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { getGame } from '@/lib/db';
import { Player } from '@/components/player';
export default async function Preview({params}:{params:Promise<{slug:string}>}){if(!(await isAdmin()))redirect('/admin');const {slug}=await params;const game=await getGame(slug,true);if(!game)notFound();return <main className="page-wrap"><div className="notice">Admin preview · This game is not necessarily published.</div><Player game={game} preview/></main>;}
