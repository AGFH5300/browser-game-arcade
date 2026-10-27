import { neon } from '@neondatabase/serverless';
import type { Game } from './types';
import seedGames from '../data/seed-games.json';

export const getDb = () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
};
const mapGame = (r: Record<string, unknown>): Game => ({
  id: String(r.id), title: String(r.title), slug: String(r.slug), description: String(r.description ?? ''),
  shortDescription: String(r.short_description ?? ''), thumbnail: r.thumbnail ? (String(r.thumbnail).startsWith('/') ? String(r.thumbnail) : `/api/thumbnails/${r.thumbnail}`) : null,
  categories: (r.categories as string[]) ?? [], collections: (r.collections as string[]) ?? [], tags: (r.tags as string[]) ?? [], developer: String(r.developer ?? ''),
  engine: r.engine as Game['engine'], gameUrl: String(r.game_url ?? ''), sourceUrl: String(r.source_url ?? ''),
  license: String(r.license ?? ''), licenseNotes: String(r.license_notes ?? ''), mobile: Boolean(r.mobile), controls: String(r.controls ?? ''),
  instructions: String(r.instructions ?? ''), featured: Boolean(r.featured), published: Boolean(r.published), displayOrder: Number(r.display_order ?? 0),
  createdAt: new Date(String(r.created_at)).toISOString(), updatedAt: new Date(String(r.updated_at)).toISOString(),
  publishedAt: r.published_at ? new Date(String(r.published_at)).toISOString() : null, playCount: Number(r.play_count ?? 0), likes: Number(r.likes ?? 0),
});
let fallbackWarned = false;
export async function listGames(includeDrafts = false): Promise<Game[]> {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is not configured');
    if (!fallbackWarned) { console.warn('DATABASE_URL is unset; using seed catalogue for local preview.'); fallbackWarned = true; }
    return (seedGames.map(g=>({...g,collections:g.collections??['html5_puzzles'],playCount:0,likes:0})) as Game[]).filter(g => includeDrafts || g.published);
  }
  const sql=getDb();
  const rows = includeDrafts ? await sql`SELECT g.*, COALESCE(m.play_count,0) AS play_count, COALESCE(m.likes,0) AS likes FROM games g LEFT JOIN game_metrics m ON m.game_id=g.id ORDER BY g.display_order,g.title` : await sql`SELECT g.*, COALESCE(m.play_count,0) AS play_count, COALESCE(m.likes,0) AS likes FROM games g LEFT JOIN game_metrics m ON m.game_id=g.id WHERE g.published=true ORDER BY g.display_order,g.title`;
  return rows.map(mapGame);
}
export async function getGame(slug: string, includeDrafts = false): Promise<Game | null> {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is not configured');
  if (!process.env.DATABASE_URL) return ((seedGames.map(g=>({...g,collections:g.collections??['html5_puzzles'],playCount:0,likes:0})) as Game[]).find(g => g.slug === slug && (includeDrafts || g.published)) ?? null);
  const sql=getDb(); const rows=includeDrafts ? await sql`SELECT g.*, COALESCE(m.play_count,0) AS play_count, COALESCE(m.likes,0) AS likes FROM games g LEFT JOIN game_metrics m ON m.game_id=g.id WHERE g.slug=${slug} LIMIT 1` : await sql`SELECT g.*, COALESCE(m.play_count,0) AS play_count, COALESCE(m.likes,0) AS likes FROM games g LEFT JOIN game_metrics m ON m.game_id=g.id WHERE g.slug=${slug} AND g.published=true LIMIT 1`;
  return rows[0] ? mapGame(rows[0] as Record<string,unknown>) : null;
}
