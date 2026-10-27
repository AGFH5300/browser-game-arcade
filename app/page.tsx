import Link from 'next/link';
import { ArrowRight, Gamepad2, Puzzle, Search, Sparkles } from 'lucide-react';
import { getTrustedPublisher } from '@/lib/embeds';
import { listGames } from '@/lib/db';
import { GameGrid } from '@/components/catalogue';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const games = await listGames();
  const classics = games.filter((game) => game.collections?.includes('classics'));
  const html5 = games.filter((game) => game.collections?.includes('html5_puzzles'));
  const featured = classics.filter((game) => game.featured).slice(0, 5);
  const popular = [...classics].filter((game) => game.playCount > 0).sort((a, b) => b.playCount - a.playCount).slice(0, 5);
  const recent = [...classics].sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()).slice(0, 5);
  const inSiteGames = games.filter((game) => !getTrustedPublisher(game.gameUrl)?.externalOnly).length;

  return (
    <main>
      <section className="home-intro" aria-labelledby="welcome-title">
        <div className="home-intro-copy">
          <p className="eyebrow">SIDEQUEST BROWSER ARCADE</p>
          <h1 id="welcome-title">Pick a game. Take a break.</h1>
          <p>Classic arcade favorites and quick HTML5 games, ready to play in your browser.</p>
        </div>
        <form action="/games" className="search home-search">
          <Search size={17} aria-hidden="true" />
          <input name="q" aria-label="Search games" placeholder="Search games..." />
          <button aria-label="Search games"><ArrowRight size={17} /></button>
        </form>
      </section>

      <div className="discovery-strip">
        <span><span className="status-dot" /> THE ARCADE IS OPEN</span>
        <p>{inSiteGames} browser games available · Free to play</p>
        <Link href="/games">Browse all games <ArrowRight size={15} /></Link>
      </div>

      {classics.length > 0 && <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">CLASSIC BROWSER ARCADE</p><h2><Gamepad2 size={21} /> Flash Library</h2></div>
          <Link className="text-link" href="/classics">View all classics <ArrowRight size={15} /></Link>
        </div>
        <GameGrid games={classics.slice(0, 10)} />
      </section>}

      {featured.length > 0 && <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">HAND-PICKED</p><h2><Sparkles size={20} /> Featured games</h2></div>
          <Link className="text-link" href="/classics">More featured games <ArrowRight size={15} /></Link>
        </div>
        <GameGrid games={featured} />
      </section>}

      {popular.length > 0 && <section className="section">
        <div className="section-heading"><h2>Popular classics</h2><Link className="text-link" href="/classics?sort=popular">Most played <ArrowRight size={15} /></Link></div>
        <GameGrid games={popular} />
      </section>}

      {recent.length > 0 && <section className="section">
        <div className="section-heading"><div><p className="eyebrow">NEW TO THE ARCADE</p><h2>Recently added</h2></div><Link className="text-link" href="/classics?sort=recent">View all <ArrowRight size={15} /></Link></div>
        <GameGrid games={recent} />
      </section>}

      {html5.length > 0 && <section className="section html5-section">
        <div className="section-heading">
          <div><p className="eyebrow">QUICK PLAY</p><h2><Puzzle size={20} /> HTML5 &amp; Puzzles</h2></div>
          <Link className="text-link" href="/html5">View all HTML5 games <ArrowRight size={15} /></Link>
        </div>
        <GameGrid games={html5.slice(0, 5)} />
      </section>}

      <section className="end-banner">
        <div><p className="eyebrow">YOUR NEXT SIDEQUEST</p><h2>Find your next favorite.</h2><p>Browse the full collection and jump straight into a game.</p></div>
        <Link className="btn primary" href="/games">Browse all games <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}
