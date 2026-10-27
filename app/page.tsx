import Link from 'next/link';
import {ArrowRight,Search,Sparkles,Gamepad2,Zap,MousePointer2,ShieldCheck,Puzzle} from 'lucide-react';
import {getTrustedPublisher} from '@/lib/embeds';
import {listGames} from '@/lib/db';
import {GameGrid} from '@/components/catalogue';
export const dynamic='force-dynamic';

export default async function Home(){
 const games=await listGames();
 const classics=games.filter(g=>g.collections?.includes('classics'));
 const html5=games.filter(g=>g.collections?.includes('html5_puzzles'));
 const featured=classics.filter(g=>g.featured).slice(0,5);
 const heroGame=featured[0]||classics[0]||games.find(g=>g.featured)||games[0];
 const popular=[...classics].filter(g=>g.playCount>0).sort((a,b)=>b.playCount-a.playCount).slice(0,5);
 const recent=[...classics].sort((a,b)=>new Date(b.publishedAt||b.createdAt).getTime()-new Date(a.publishedAt||a.createdAt).getTime()).slice(0,5);
 return <main>
  <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="status-dot"/> YOUR FIVE-MINUTE ESCAPE</p><h1>One more game.<br/><span>Then back to reality.</span></h1><p className="hero-description">Big adventures. Little breaks. Discover classic browser games<br className="desktop"/> and jump straight into the good part.</p><form action="/games" className="search hero-search"><Search size={20}/><input name="q" aria-label="Find your next game" placeholder="Find your next obsession..."/><button aria-label="Search games"><ArrowRight size={20}/></button></form><div className="hero-facts"><span><Zap size={14}/> Instant play</span><span><MousePointer2 size={14}/> No downloads</span><span><ShieldCheck size={14}/> No sign-up</span></div>{heroGame&&<Link className="btn primary hero-play" href={`/games/${heroGame.slug}`}>Play {heroGame.title} <ArrowRight size={16}/></Link>}</div><div className="hero-visual hero-feature" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/>{heroGame?.thumbnail?<img className="hero-feature-cover" src={heroGame.thumbnail} alt=""/>:<div className="hero-feature-fallback"><Gamepad2 size={68}/></div>}<div className="hero-token token-top">{heroGame?.title||'PLAY SOMETHING GREAT'}</div><div className="hero-token token-bottom"><Gamepad2 size={16}/> SMALL GAMES, BIG ENERGY</div><span className="spark spark-one">✦</span><span className="spark spark-two">✳</span></div></section>
  <div className="discovery-strip"><span><span className="status-dot"/> THE ARCADE IS OPEN</span><p>{games.filter(g=>!getTrustedPublisher(g.gameUrl)?.externalOnly).length} in-site games · Curated for your next break</p><Link href="/classics">Play the classics <ArrowRight size={16}/></Link></div>
  {classics.length>0&&<section className="section"><div className="section-heading"><div><p className="eyebrow">THE CLASSICS</p><h2><Gamepad2 size={23}/> Flash Library</h2></div><Link className="text-link" href="/classics">Explore the full library <ArrowRight size={17}/></Link></div><GameGrid games={classics.slice(0,10)}/></section>}
  {classics.length>0&&<section className="section"><div className="section-heading"><div><p className="eyebrow">GOOD PLACE TO START</p><h2><Sparkles size={23}/> Featured picks</h2></div><Link className="text-link" href="/classics">Explore the Flash Library <ArrowRight size={17}/></Link></div><GameGrid games={featured.length?featured:classics.slice(0,5)}/></section>}
  {popular.length>0&&<section className="section"><div className="section-heading"><h2>Popular classics</h2><Link className="text-link" href="/classics?sort=popular">Most played <ArrowRight size={17}/></Link></div><GameGrid games={popular}/></section>}
  {recent.length>0&&<section className="section"><div className="section-heading"><div><p className="eyebrow">FRESH IN THE LIBRARY</p><h2>Recently added classics</h2></div><Link className="text-link" href="/classics?sort=recent">View the library <ArrowRight size={17}/></Link></div><GameGrid games={recent}/></section>}
  {html5.length>0&&<section className="section html5-section"><div className="section-heading"><div><p className="eyebrow">MODERN GAMES & BRAIN TEASERS</p><h2><Puzzle size={22}/> HTML5 &amp; Puzzles</h2></div><Link className="text-link" href="/html5">Explore HTML5 &amp; Puzzles <ArrowRight size={17}/></Link></div><GameGrid games={html5.slice(0,5)}/></section>}
  <section className="end-banner"><span className="banner-icon"><Puzzle size={42}/></span><div><p className="eyebrow">YOUR NEXT SIDEQUEST IS WAITING</p><h2>Good games. Zero commitment.</h2><p>Stay for a minute. Stay for a new personal best.</p></div><div className="banner-actions"><Link className="btn primary" href="/games">Browse all games <ArrowRight size={18}/></Link><Link className="text-link" href="/categories">Browse categories <ArrowRight size={16}/></Link></div></section>
 </main>
}
