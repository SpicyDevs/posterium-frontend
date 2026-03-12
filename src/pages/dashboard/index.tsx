// src/pages/dashboard/index.tsx
// ═══════════════════════════════════════════════════════════════════
// POSTERIUM — Cinematic Dashboard Redesign
// Aesthetic: Film Archive / Cinematheque — warm amber on near-black,
//            sprocket holes, grain, horizontal reel parallax
// Fonts: Bebas Neue (display), Syne (subheadings), DM Sans (body)
// ═══════════════════════════════════════════════════════════════════
import React, {
  useState, useEffect, useRef, useCallback, memo,
} from 'react';
import { Link } from '../../Router';
import {
  ArrowRight, Github, Star, Zap, Globe, MousePointer2,
   Layers, Film, Shield, RefreshCw, Image as ImageIcon,
  Copy, Check, ChevronDown, Menu, X,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────
const API = 'https://api.spicydevs.xyz';

const REEL_ITEMS = [
  { id: '155',    type: 'movie', title: 'The Dark Knight',       year: '2008', imdb: '9.0', rt: '94%', genre: 'Action Thriller'   },
  { id: '27205',  type: 'movie', title: 'Inception',             year: '2010', imdb: '8.8', rt: '87%', genre: 'Sci-Fi'             },
  { id: '872585', type: 'movie', title: 'Oppenheimer',           year: '2023', imdb: '8.4', rt: '93%', genre: 'Historical Drama'   },
  { id: '238',    type: 'movie', title: 'The Godfather',         year: '1972', imdb: '9.2', rt: '97%', genre: 'Crime Drama'        },
  { id: '634649', type: 'movie', title: 'No Way Home',           year: '2021', imdb: '8.2', rt: '90%', genre: 'Action'             },
  { id: '1396',   type: 'tv',    title: 'Breaking Bad',          year: '2008', imdb: '9.5', rt: '96%', genre: 'Drama'              },
  { id: '424',    type: 'movie', title: "Schindler's List",      year: '1993', imdb: '9.0', rt: '98%', genre: 'History'            },
  { id: '1399',   type: 'tv',    title: 'Game of Thrones',       year: '2011', imdb: '9.2', rt: '89%', genre: 'Fantasy'            },
  { id: '66732',  type: 'tv',    title: 'Stranger Things',       year: '2016', imdb: '8.7', rt: '92%', genre: 'Sci-Fi Horror'      },
  { id: '475557', type: 'movie', title: 'Joker',                 year: '2019', imdb: '8.4', rt: '69%', genre: 'Psychological'      },
  { id: '346698', type: 'movie', title: 'Barbie',                year: '2023', imdb: '6.9', rt: '88%', genre: 'Comedy Fantasy'     },
  { id: '315162', type: 'movie', title: 'Puss in Boots',         year: '2022', imdb: '7.9', rt: '95%', genre: 'Animation'          },
];

const STATS = [
  { value: '10+', label: 'Rating Sources' },
  { value: '4',   label: 'Export Formats' },
  { value: '∞',   label: 'Free API Calls' },
  { value: '0',   label: 'Account Required' },
];

const FEATURES = [
  { icon: <MousePointer2 size={18}/>, title: 'Drag-Drop Editor',     desc: 'Pixel-perfect badge positioning. Multi-select, group-move, undo/redo with full keyboard shortcuts.' },
  { icon: <Globe size={18}/>,         title: 'Multiple Sources',     desc: 'TMDB, Fanart.tv, Metahub, and IMDb poster sources — auto-selects the best available art.' },
  { icon: <Zap size={18}/>,           title: 'Instant API URL',      desc: 'One URL = one poster, complete with live rating badges baked in. Embed anywhere, no auth needed.' },
  { icon: <Layers size={18}/>,        title: 'Deep Customization',   desc: 'Glassmorphism blur, opacity, radius, shadow, border — globally or per-badge with full overrides.' },
  { icon: <Film size={18}/>,          title: 'Movies, TV & Anime',   desc: 'Full support for all media types including MAL and AniList score badges for anime titles.' },
  { icon: <ImageIcon size={18}/>,     title: 'Any Format',           desc: 'SVG for crystal clarity, PNG/JPG/WebP for universal compatibility across all platforms.' },
  { icon: <Shield size={18}/>,        title: 'Textless Posters',     desc: 'Strip title text from artwork for a clean minimal look — perfect for custom media servers.' },
  { icon: <RefreshCw size={18}/>,     title: 'Always Fresh',         desc: 'Live ratings from IMDb, RT, Metacritic, TMDB, Letterboxd, and more — always up to date.' },
];

const SAMPLE_URL = `${API}/movie/453395.png?r=imdb,rt,meta,tmdb&blur=8&alpha=0.45&rad=12&v=2&g_scale=1.000&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&meta_x=310&meta_y=160&tmdb_x=310&tmdb_y=230`;

const USE_CASES = [
  { icon: '🖥️', title: 'Plex & Jellyfin',       tags: ['Media Servers', 'Plex', 'Jellyfin'],   desc: 'Custom poster art for your self-hosted media server with embedded live ratings.' },
  { icon: '🤖', title: 'Discord Bots',           tags: ['Discord', 'Bots', 'Embeds'],           desc: 'Rich movie embeds with live scores for any Discord bot via a single image URL.' },
  { icon: '📋', title: 'Notion & Obsidian',      tags: ['Notion', 'Obsidian', 'Databases'],     desc: 'Embed live poster images in your watchlist databases and movie notes.' },
  { icon: '🌐', title: 'Personal Websites',      tags: ['Web', 'Blogs', 'Reviews'],             desc: 'Dynamic image source for movie blogs, portfolio sites, and review pages.' },
  { icon: '⚙️', title: 'Make / Zapier / n8n',   tags: ['Make', 'Zapier', 'Automation'],        desc: 'Auto-generate posters for new watchlist entries through no-code workflows.' },
  { icon: '🎨', title: 'Creative Projects',      tags: ['Print', 'Art', 'SVG', 'Design'],       desc: 'Print-quality vector posters at any scale with crisp SVG output.' },
];

// ─── Global Styles ────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --film-black:  #080808;
    --film-dark:   #0E0D0B;
    --film-mid:    #1A1814;
    --film-amber:  #C8933A;
    --film-gold:   #D4A843;
    --film-cream:  #F2EAD0;
    --film-white:  #FAFAF7;
    --film-silver: #7A756E;
    --film-red:    #B8281E;
    --film-border: rgba(200,147,58,0.18);
    --film-glow:   rgba(200,147,58,0.08);
  }

  .poster-font  { font-family: 'Bebas Neue', cursive; letter-spacing: 0.03em; }
  .syne-font    { font-family: 'Syne', sans-serif; }
  .body-font    { font-family: 'DM Sans', sans-serif; }
  .mono-font    { font-family: 'JetBrains Mono', monospace; }

  .grain-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 200;
    opacity: 0.028;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 200px 200px;
    animation: grain-shift 0.15s steps(1) infinite;
  }

  @keyframes grain-shift {
    0%  { transform: translate(0,0); }
    10% { transform: translate(-2%,-3%); }
    20% { transform: translate(3%,1%); }
    30% { transform: translate(-1%,4%); }
    40% { transform: translate(4%,-2%); }
    50% { transform: translate(-3%,3%); }
    60% { transform: translate(2%,-4%); }
    70% { transform: translate(-4%,2%); }
    80% { transform: translate(1%,-1%); }
    90% { transform: translate(3%,4%); }
  }

  @keyframes film-flicker {
    0%,100% { opacity:1; }
    92% { opacity:1; }
    93% { opacity:0.85; }
    94% { opacity:1; }
    97% { opacity:0.9; }
    98% { opacity:1; }
  }

  @keyframes scan-line {
    from { transform: translateY(-100%); }
    to   { transform: translateY(100vh); }
  }

  @keyframes reel-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes amber-pulse {
    0%,100% { box-shadow: 0 0 20px rgba(200,147,58,0.2); }
    50%      { box-shadow: 0 0 40px rgba(200,147,58,0.4); }
  }

  @keyframes hero-in {
    from { opacity:0; transform: translateY(40px); }
    to   { opacity:1; transform: translateY(0); }
  }

  @keyframes float-poster {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%     { transform: translateY(-18px) rotate(1deg); }
  }

  @keyframes float-poster-b {
    0%,100% { transform: translateY(-8px) rotate(0.5deg); }
    50%     { transform: translateY(10px) rotate(-0.5deg); }
  }

  @keyframes counter-down {
    0%   { opacity: 1; transform: scale(1.2); }
    80%  { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.8); }
  }

  @keyframes type-in {
    from { width: 0; opacity: 0; }
    to   { width: 100%; opacity: 1; }
  }

  @keyframes fade-up {
    from { opacity:0; transform: translateY(24px); }
    to   { opacity:1; transform: translateY(0); }
  }

  @keyframes slide-from-left {
    from { opacity:0; transform: translateX(-30px); }
    to   { opacity:1; transform: translateX(0); }
  }

  .hero-a1 { animation: hero-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
  .hero-a2 { animation: hero-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
  .hero-a3 { animation: hero-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
  .hero-a4 { animation: hero-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.55s both; }
  .hero-a5 { animation: hero-in 0.9s cubic-bezier(0.16,1,0.3,1) 0.7s both; }

  .in-view { animation: fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both; }

  .sprocket-hole {
    width: 22px; height: 16px;
    background: var(--film-black);
    border: 1.5px solid rgba(255,255,255,0.12);
    border-radius: 3px;
    flex-shrink: 0;
  }

  .film-frame {
    flex-shrink: 0;
    position: relative;
    cursor: default;
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .film-frame:hover { transform: scale(1.03) translateY(-6px); z-index: 2; }

  .amber-line {
    background: linear-gradient(90deg, transparent, var(--film-amber), transparent);
    height: 1px;
    opacity: 0.4;
  }

  .amber-tag {
    background: rgba(200,147,58,0.12);
    border: 1px solid rgba(200,147,58,0.3);
    color: var(--film-amber);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 3px;
  }

  .glow-cta {
    box-shadow: 0 0 30px rgba(200,147,58,0.25), 0 4px 20px rgba(0,0,0,0.5);
    transition: box-shadow 0.3s ease, transform 0.2s ease;
  }
  .glow-cta:hover {
    box-shadow: 0 0 50px rgba(200,147,58,0.45), 0 8px 32px rgba(0,0,0,0.6);
    transform: translateY(-1px);
  }

  .feature-card {
    background: var(--film-mid);
    border: 1px solid rgba(255,255,255,0.05);
    transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  }
  .feature-card:hover {
    border-color: var(--film-border);
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 20px rgba(200,147,58,0.06);
  }

  .code-block {
    background: #0B0A08;
    border: 1px solid rgba(200,147,58,0.15);
    border-radius: 12px;
  }

  .use-case-card:hover .use-case-icon {
    transform: scale(1.15) rotate(-5deg);
    transition: transform 0.3s ease;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--film-black); }
  ::-webkit-scrollbar-thumb { background: rgba(200,147,58,0.3); border-radius: 99px; }

  /* Mobile reel swipe */
  .mobile-reel {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .mobile-reel::-webkit-scrollbar { display: none; }
  .mobile-reel > * { scroll-snap-align: center; }

  /* Scan line effect on hover over poster */
  .poster-img-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(transparent 50%, rgba(0,0,0,0.03) 50%);
    background-size: 100% 4px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .film-frame:hover .poster-img-wrap::after { opacity: 1; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ─── Utility: Intersection observer hook ─────────────────────────
const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
};

// ─── Component: Sprocket Strip ────────────────────────────────────
const SprocketStrip = memo<{ count?: number }>(({ count = 30 }) => (
  <div className="flex items-center gap-[18px] px-[9px] py-[5px]" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="sprocket-hole" />
    ))}
  </div>
));
SprocketStrip.displayName = 'SprocketStrip';

// ─── Component: Film Perforation Side ────────────────────────────
const FilmEdge = memo<{ side: 'left' | 'right' }>(({ side }) => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      top: 0, bottom: 0,
      [side]: 0,
      width: 40,
      background: 'var(--film-dark)',
      borderRight: side === 'left' ? '1px solid rgba(255,255,255,0.06)' : 'none',
      borderLeft: side === 'right' ? '1px solid rgba(255,255,255,0.06)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      paddingTop: 8,
      zIndex: 5,
    }}
  >
    {Array.from({ length: 20 }).map((_, i) => (
      <div key={i} className="sprocket-hole" style={{ width: 18, height: 12 }} />
    ))}
  </div>
));
FilmEdge.displayName = 'FilmEdge';

// ─── Component: Film Poster Frame ─────────────────────────────────
const PosterFrame = memo<{
  item: typeof REEL_ITEMS[0];
  index: number;
}>(({ item, index }) => {
  const posterUrl = `${API}/${item.type}/${item.id}.svg?source=tmdb`;

  return (
    <div
      className="film-frame"
      style={{
        width: 240,
        animationName: index % 2 === 0 ? 'float-poster' : 'float-poster-b',
        animationDuration: `${3.8 + index * 0.3}s`,
        animationDelay: `${index * 0.2}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    >
      {/* Frame number tag */}
      <div style={{
        position: 'absolute', top: -24, left: 0,
        fontSize: 9, color: 'rgba(200,147,58,0.5)',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.1em',
      }}>
        {String(index + 1).padStart(2, '0')} / {String(REEL_ITEMS.length).padStart(2, '0')}
      </div>

      {/* Poster image */}
      <div
        className="poster-img-wrap"
        style={{
          width: 240,
          height: 360,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          background: '#1A1814',
          border: '2px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,147,58,0.1)',
        }}
      >
        <img
          src={posterUrl}
          alt={item.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Bottom fade overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 120,
          background: 'linear-gradient(to top, rgba(8,8,8,0.95) 0%, transparent 100%)',
        }} />
        {/* Meta overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            fontFamily: 'Syne, sans-serif',
            color: '#F2EAD0',
            lineHeight: 1.2,
            marginBottom: 6,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            {item.title}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(200,147,58,0.25)', border: '1px solid rgba(200,147,58,0.5)',
              color: '#D4A843', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              padding: '2px 6px', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace',
            }}>IMDb {item.imdb}</span>
            <span style={{
              background: 'rgba(184,40,30,0.2)', border: '1px solid rgba(184,40,30,0.4)',
              color: '#E05045', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              padding: '2px 6px', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace',
            }}>RT {item.rt}</span>
          </div>
        </div>
      </div>

      {/* Film metadata strip below */}
      <div style={{
        marginTop: 10,
        padding: '8px 6px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          fontSize: 11, color: 'var(--film-amber)',
          fontFamily: 'Syne, sans-serif', fontWeight: 600,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.genre}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--film-silver)',
          fontFamily: 'JetBrains Mono, monospace',
          marginTop: 2,
        }}>
          {item.year} · {item.type.toUpperCase()}
        </div>
      </div>
    </div>
  );
});
PosterFrame.displayName = 'PosterFrame';

// ─── Component: Navigation ────────────────────────────────────────
const Nav = memo(() => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 60,
        display: 'flex', alignItems: 'center',
        padding: '0 24px',
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(200,147,58,0.12)' : 'none',
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #C8933A, #D4A843)',
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(200,147,58,0.3)',
        }}>
          <Film size={15} color="#080808" strokeWidth={2.5} />
        </div>
        <span className="poster-font" style={{
          fontSize: 22, color: 'var(--film-cream)', letterSpacing: '0.06em',
        }}>
          POSTERIUM
        </span>
        <span style={{
          fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--film-amber)', letterSpacing: '0.15em',
          border: '1px solid rgba(200,147,58,0.3)',
          padding: '2px 6px', borderRadius: 2,
        }}>v2</span>
      </div>

      {/* Desktop nav links */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="nav-desktop-links">
        {[['Showcase', '#reel'], ['Features', '#features'], ['API', '#api'], ['Use Cases', '#use-cases']].map(([label, href]) => (
          <a key={label} href={href} className="syne-font" style={{
            color: 'var(--film-silver)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '6px 14px', borderRadius: 4,
            textDecoration: 'none',
            transition: 'color 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}>
            {label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <a
          href="https://github.com/xdaayush/freeposterapi"
          target="_blank" rel="noreferrer"
          className="syne-font"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--film-silver)', fontSize: 12, fontWeight: 600,
            textDecoration: 'none', padding: '7px 14px',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,147,58,0.3)';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
          }}
        >
          <Github size={13} /> GitHub
        </a>
        <Link
          to="/build"
          className="glow-cta syne-font"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--film-amber)',
            color: '#080808', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            textDecoration: 'none', padding: '7px 18px',
            borderRadius: 6,
          }}
        >
          Open Builder <ArrowRight size={12} />
        </Link>
        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{
            display: 'none', background: 'none', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--film-silver)', width: 36, height: 36,
            borderRadius: 6, cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
          }}
          className="nav-mobile-btn"
        >
          {menuOpen ? <X size={16}/> : <Menu size={16}/>}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(200,147,58,0.15)',
          padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {[['Showcase', '#reel'], ['Features', '#features'], ['API', '#api'], ['Use Cases', '#use-cases']].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}
              className="syne-font"
              style={{
                color: 'var(--film-silver)', fontSize: 13, fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '10px 12px', borderRadius: 6, textDecoration: 'none',
                background: 'rgba(255,255,255,0.02)',
                display: 'block',
              }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
});
Nav.displayName = 'Nav';

// ─── Component: Hero ──────────────────────────────────────────────
const HeroSection = memo(() => {
  const previewPosters = REEL_ITEMS.slice(0, 5);

  return (
    <section
      aria-label="Hero"
      style={{
        minHeight: '100dvh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: 80,
        paddingBottom: 60,
        background: 'var(--film-black)',
      }}
    >
      {/* Film edge perforations (desktop only) */}
      <FilmEdge side="left" />
      <FilmEdge side="right" />

      {/* Background radial glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(200,147,58,0.05) 0%, transparent 70%)',
      }}/>

      {/* Animated dot grid */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3,
        backgroundImage: 'radial-gradient(rgba(200,147,58,0.15) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}/>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 900, width: '100%',
        padding: '0 48px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Eyebrow */}
        <div className="hero-a1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(200,147,58,0.3)',
          background: 'rgba(200,147,58,0.06)',
          borderRadius: 4, padding: '5px 14px',
          marginBottom: 28,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--film-amber)',
            animation: 'amber-pulse 2s ease-in-out infinite',
            display: 'block',
          }}/>
          <span className="syne-font" style={{
            color: 'var(--film-amber)', fontSize: 10,
            fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            Free &amp; Open Source — No Account Required
          </span>
        </div>

        {/* Main title */}
        <h1 className="hero-a2 poster-font" style={{
          fontSize: 'clamp(72px, 14vw, 180px)',
          lineHeight: 0.9,
          color: 'var(--film-cream)',
          letterSpacing: '0.03em',
          marginBottom: 8,
          animation: 'film-flicker 12s ease-in-out infinite',
        }}>
          POSTER
          <span style={{
            color: 'transparent',
            WebkitTextStroke: '2px var(--film-amber)',
            display: 'inline',
          }}>IUM</span>
        </h1>

        {/* Amber rule */}
        <div className="hero-a3" style={{
          width: 180, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--film-amber), transparent)',
          marginBottom: 24, marginTop: 16,
        }}/>

        {/* Subheading */}
        <p className="hero-a3 syne-font" style={{
          fontSize: 'clamp(14px, 2.5vw, 20px)',
          color: 'var(--film-silver)',
          fontWeight: 400,
          maxWidth: 620,
          lineHeight: 1.65,
          marginBottom: 12,
        }}>
          Generate custom movie &amp; TV posters with glassmorphism rating badges from{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>IMDb</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Rotten Tomatoes</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Metacritic</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>TMDB</strong>, and more —
          all from a single API URL.
        </p>

        <p className="hero-a4 body-font" style={{
          fontSize: 13, color: 'rgba(122,117,110,0.8)', marginBottom: 40,
          letterSpacing: '0.01em',
        }}>
          Perfect for Plex · Jellyfin · Discord Bots · Notion · And anything with an image field.
        </p>

        {/* CTA buttons */}
        <div className="hero-a4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--film-amber)', color: '#080808',
              fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
              textTransform: 'uppercase', textDecoration: 'none',
              padding: '13px 28px', borderRadius: 6,
            }}
          >
            Open Free Builder
            <ArrowRight size={14} />
          </Link>
          <a
            href="#reel"
            className="syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--film-cream)', fontWeight: 600, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '13px 28px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,147,58,0.4)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(200,147,58,0.06)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            Watch the Reel
            <ChevronDown size={14} />
          </a>
        </div>

        {/* Floating poster showcase */}
        <div className="hero-a5" style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          gap: 'clamp(6px, 1.5vw, 16px)', width: '100%', maxWidth: 700,
        }}>
          {previewPosters.map((p, i) => {
            const isCenter = i === 2;
            const heights = [120, 160, 210, 160, 120];
            const widths = [80, 107, 140, 107, 80];
            const rotations = [-3, -1.5, 0, 1.5, 3];
            const delays = [0.8, 0.65, 0.5, 0.65, 0.8];
            return (
              <div
                key={p.id}
                style={{
                  width: widths[i], height: heights[i],
                  borderRadius: 6, overflow: 'hidden',
                  border: isCenter
                    ? '2px solid rgba(200,147,58,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: isCenter
                    ? '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(200,147,58,0.15)'
                    : '0 16px 48px rgba(0,0,0,0.7)',
                  transform: `rotate(${rotations[i]}deg)`,
                  flexShrink: 0,
                  position: 'relative',
                  animation: `${i % 2 === 0 ? 'float-poster' : 'float-poster-b'} ${3.5 + i * 0.4}s ease-in-out ${delays[i]}s infinite`,
                  zIndex: isCenter ? 5 : 3 - Math.abs(i - 2),
                }}
              >
                <img
                  src={`${API}/${p.type}/${p.id}.svg?source=tmdb`}
                  alt={p.title}
                  loading={isCenter ? 'eager' : 'lazy'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: 0.4,
      }}>
        <span className="syne-font" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--film-silver)', textTransform: 'uppercase' }}>
          Scroll
        </span>
        <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, var(--film-amber), transparent)', animation: 'hero-in 1.5s ease-in-out infinite alternate' }}/>
      </div>
    </section>
  );
});
HeroSection.displayName = 'HeroSection';

// ─── Component: Film Reel Section (The Star) ──────────────────────
const FilmReelSection = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef    = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);

  const updateTranslate = useCallback(() => {
    const container = containerRef.current;
    const track     = trackRef.current;
    const sticky    = stickyRef.current;
    if (!container || !track || !sticky) return;

    const containerTop   = container.getBoundingClientRect().top + window.scrollY;
    const scrolled       = window.scrollY - containerTop;
    const maxTranslate   = track.scrollWidth - window.innerWidth;
    const containerH     = container.offsetHeight - window.innerHeight;
    const progress       = Math.max(0, Math.min(1, scrolled / containerH));
    const translateX     = -(progress * maxTranslate);

    track.style.transform = `translateX(${translateX}px)`;

    // Progress indicator
    const pct = (progress * 100).toFixed(0);
    const indicator = sticky.querySelector<HTMLElement>('.reel-progress-fill');
    if (indicator) indicator.style.width = `${pct}%`;

    rafRef.current = 0;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateTranslate);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateTranslate();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateTranslate]);

  // Estimated track width for container height
  // Each frame: 240px wide + 48px gap ≈ 288px per item
  const FRAME_W = 288;
  const TRACK_W = REEL_ITEMS.length * FRAME_W + 200; // extra padding
  // Container extra height = TRACK_W - viewport width (approximate)
  const EXTRA_H = TRACK_W; // generous

  return (
    <section id="reel" aria-label="Film Reel Showcase">
      {/* Sticky horizontal reel */}
      <div
        ref={containerRef}
        style={{ height: `calc(100vh + ${EXTRA_H}px)`, position: 'relative' }}
      >
        <div
          ref={stickyRef}
          style={{
            position: 'sticky', top: 0, height: '100dvh',
            overflow: 'hidden',
            background: 'var(--film-dark)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Section header */}
          <div style={{
            flexShrink: 0, padding: '20px 60px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(200,147,58,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '2px solid rgba(200,147,58,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Film size={16} color="var(--film-amber)" />
              </div>
              <div>
                <div className="poster-font" style={{
                  fontSize: 28, color: 'var(--film-cream)', letterSpacing: '0.06em', lineHeight: 1,
                }}>
                  THE REEL
                </div>
                <div className="syne-font" style={{
                  fontSize: 10, color: 'var(--film-silver)',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                }}>
                  Scroll to advance the film
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="syne-font" style={{ fontSize: 10, color: 'var(--film-silver)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {REEL_ITEMS.length} titles
              </span>
              {/* Reel spinner icon */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '1.5px solid rgba(200,147,58,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'reel-spin 4s linear infinite',
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '1px solid rgba(200,147,58,0.5)',
                  position: 'relative',
                }}>
                  {[0, 120, 240].map(deg => (
                    <div key={deg} style={{
                      position: 'absolute', width: 3, height: 3,
                      borderRadius: '50%', background: 'var(--film-amber)',
                      top: '50%', left: '50%',
                      transform: `translateX(-50%) translateY(-50%) rotate(${deg}deg) translateY(-4px)`,
                    }}/>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top sprocket strip */}
          <div style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <SprocketStrip count={40} />
          </div>

          {/* Film content area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            {/* Amber vertical center line */}
            <div aria-hidden="true" style={{
              position: 'absolute', top: '10%', bottom: '10%',
              width: 1, left: '50%',
              background: 'linear-gradient(to bottom, transparent, rgba(200,147,58,0.08), transparent)',
              pointerEvents: 'none',
            }}/>

            {/* The scrolling track */}
            <div
              ref={trackRef}
              style={{
                display: 'flex',
                gap: 48,
                paddingLeft: 80,
                paddingRight: 80,
                willChange: 'transform',
                alignItems: 'flex-end',
                paddingBottom: 32,
              }}
            >
              {REEL_ITEMS.map((item, i) => (
                <PosterFrame key={item.id} item={item} index={i} />
              ))}
            </div>

            {/* Edge fade left */}
            <div aria-hidden="true" style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 80,
              background: 'linear-gradient(to right, var(--film-dark), transparent)',
              pointerEvents: 'none',
            }}/>
            {/* Edge fade right */}
            <div aria-hidden="true" style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
              background: 'linear-gradient(to left, var(--film-dark), transparent)',
              pointerEvents: 'none',
            }}/>
          </div>

          {/* Bottom sprocket strip */}
          <div style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.02)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <SprocketStrip count={40} />
          </div>

          {/* Progress bar */}
          <div style={{
            flexShrink: 0, padding: '8px 60px',
            borderTop: '1px solid rgba(200,147,58,0.08)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span className="syne-font" style={{ fontSize: 9, color: 'var(--film-silver)', letterSpacing: '0.14em', textTransform: 'uppercase', flexShrink: 0 }}>
              Reel Progress
            </span>
            <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div
                className="reel-progress-fill"
                style={{
                  height: '100%', width: '0%', borderRadius: 99,
                  background: 'linear-gradient(90deg, var(--film-amber), #D4A843)',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
            <span className="syne-font" style={{ fontSize: 9, color: 'var(--film-silver)', letterSpacing: '0.14em', flexShrink: 0 }}>
              {REEL_ITEMS.length} frames
            </span>
          </div>
        </div>
      </div>

      {/* Mobile fallback reel (shown on small screens via CSS) */}
      <div className="mobile-reel-section" style={{ background: 'var(--film-dark)' }}>
        <div style={{ padding: '40px 24px 16px' }}>
          <div className="poster-font" style={{ fontSize: 32, color: 'var(--film-cream)', letterSpacing: '0.06em' }}>THE REEL</div>
          <div className="syne-font" style={{ fontSize: 11, color: 'var(--film-silver)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>
            Swipe to browse
          </div>
        </div>
        {/* Sprocket */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <SprocketStrip count={20} />
        </div>
        {/* Swipeable posters */}
        <div className="mobile-reel" style={{ padding: '32px 0', display: 'flex', gap: 24, paddingLeft: 24, paddingRight: 24 }}>
          {REEL_ITEMS.map((item) => (
            <div
              key={item.id}
              style={{
                flexShrink: 0, width: 180,
              }}
            >
              <div style={{
                width: 180, height: 270, borderRadius: 4, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                marginBottom: 10, position: 'relative',
              }}>
                <img
                  src={`${API}/${item.type}/${item.id}.svg?source=tmdb`}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 90, background: 'linear-gradient(to top, rgba(8,8,8,0.95), transparent)',
                  padding: 10,
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                }}>
                  <div className="syne-font" style={{ fontSize: 11, fontWeight: 600, color: '#F2EAD0', lineHeight: 1.2, marginBottom: 4 }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ background: 'rgba(200,147,58,0.25)', border: '1px solid rgba(200,147,58,0.5)', color: '#D4A843', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.imdb}
                    </span>
                    <span style={{ background: 'rgba(184,40,30,0.2)', border: '1px solid rgba(184,40,30,0.4)', color: '#E05045', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.rt}
                    </span>
                  </div>
                </div>
              </div>
              <div className="syne-font" style={{ fontSize: 9, color: 'var(--film-amber)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{item.genre}</div>
              <div className="mono-font" style={{ fontSize: 9, color: 'var(--film-silver)', marginTop: 2 }}>{item.year}</div>
            </div>
          ))}
        </div>
        {/* Sprocket bottom */}
        <div style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <SprocketStrip count={20} />
        </div>
      </div>
    </section>
  );
});
FilmReelSection.displayName = 'FilmReelSection';

// ─── Component: Stats Bar ─────────────────────────────────────────
const StatsBar = memo(() => {
  const { ref, vis } = useInView(0.2);
  return (
    <section ref={ref} aria-label="Statistics" style={{
      background: 'var(--film-black)',
      borderTop: '1px solid rgba(200,147,58,0.1)',
      borderBottom: '1px solid rgba(200,147,58,0.1)',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
        {STATS.map((s, i) => (
          <div
            key={s.label}
            style={{
              textAlign: 'center', padding: '16px 24px',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(200,147,58,0.1)' : 'none',
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
            }}
          >
            <div className="poster-font" style={{
              fontSize: 'clamp(40px, 7vw, 72px)',
              color: 'var(--film-cream)', lineHeight: 1,
              textShadow: '0 0 40px rgba(200,147,58,0.15)',
            }}>
              {s.value}
            </div>
            <div className="syne-font" style={{
              fontSize: 11, color: 'var(--film-silver)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              marginTop: 6, fontWeight: 600,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
StatsBar.displayName = 'StatsBar';

// ─── Component: Features Grid ─────────────────────────────────────
const FeaturesSection = memo(() => {
  const { ref, vis } = useInView(0.1);
  return (
    <section id="features" ref={ref} aria-label="Features" style={{
      background: 'var(--film-dark)', padding: '96px 24px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center', marginBottom: 64,
          opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div className="amber-tag" style={{ display: 'inline-block', marginBottom: 16 }}>Built for Power Users</div>
          <h2 className="poster-font" style={{
            fontSize: 'clamp(40px, 7vw, 80px)',
            color: 'var(--film-cream)', lineHeight: 0.95, letterSpacing: '0.02em',
          }}>
            EVERYTHING<br/>
            <span style={{ color: 'var(--film-amber)' }}>YOU NEED</span>
          </h2>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feature-card"
              style={{
                padding: '24px 22px', borderRadius: 8,
                opacity: vis ? 1 : 0,
                transform: vis ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.6s ease ${i * 0.06}s, transform 0.6s ease ${i * 0.06}s, border-color 0.3s ease, box-shadow 0.3s ease`,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: 'rgba(200,147,58,0.1)',
                border: '1px solid rgba(200,147,58,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, color: 'var(--film-amber)',
              }}>
                {f.icon}
              </div>
              <h3 className="syne-font" style={{
                fontSize: 14, fontWeight: 700, color: 'var(--film-cream)',
                marginBottom: 8, letterSpacing: '0.02em',
              }}>
                {f.title}
              </h3>
              <p className="body-font" style={{
                fontSize: 12, color: 'var(--film-silver)', lineHeight: 1.65,
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
FeaturesSection.displayName = 'FeaturesSection';

// ─── Component: API Section ───────────────────────────────────────
const APISection = memo(() => {
  const [copied, setCopied] = useState(false);
  const { ref, vis } = useInView(0.1);

  const handleCopy = () => {
    navigator.clipboard.writeText(SAMPLE_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="api" ref={ref} aria-label="API Documentation" style={{
      background: 'var(--film-black)', padding: '96px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background text */}
      <div aria-hidden="true" className="poster-font" style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%) rotate(-12deg)',
        fontSize: 'clamp(120px, 25vw, 320px)',
        color: 'rgba(200,147,58,0.02)',
        letterSpacing: '0.05em', whiteSpace: 'nowrap',
        pointerEvents: 'none', userSelect: 'none',
        lineHeight: 1,
      }}>
        API
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{
          marginBottom: 56,
          opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div className="amber-tag" style={{ display: 'inline-block', marginBottom: 16 }}>Simple API</div>
          <h2 className="poster-font" style={{
            fontSize: 'clamp(40px, 7vw, 80px)',
            color: 'var(--film-cream)', lineHeight: 0.95, marginBottom: 16,
          }}>
            ONE URL.<br/>
            <span style={{ color: 'var(--film-amber)' }}>INFINITE POSTERS.</span>
          </h2>
          <p className="syne-font" style={{ fontSize: 14, color: 'var(--film-silver)', maxWidth: 480, lineHeight: 1.6 }}>
            No auth. No rate limits. No account. Just a URL that returns a poster image with live ratings baked in — ready to embed anywhere.
          </p>
        </div>

        {/* Code block */}
        <div
          className="code-block"
          style={{
            opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s',
          }}
        >
          {/* Terminal header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(200,147,58,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#C4372B','#C8933A','#3CA84A'].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }}/>
                ))}
              </div>
              <span className="mono-font" style={{ fontSize: 10, color: 'var(--film-silver)', marginLeft: 4 }}>
                GET /movie/453395.png
              </span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--film-silver)', fontSize: 10,
                fontFamily: 'Syne, sans-serif', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 4,
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(200,147,58,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
                (e.currentTarget as HTMLElement).style.background = 'none';
              }}
            >
              {copied ? <Check size={10} color="#3CA84A"/> : <Copy size={10}/>}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Code */}
          <div style={{ padding: '24px 28px', overflowX: 'auto' }}>
            <pre className="mono-font" style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              lineHeight: 2,
              margin: 0,
              whiteSpace: 'pre',
              color: '#7A756E',
            }}>
              <span style={{ color: '#818cf8' }}>https://api.spicydevs.xyz</span>
              <span style={{ color: '#C8933A' }}>/movie/453395.png</span>{'\n'}
              <span style={{ color: '#4A4840' }}>  ?</span><span style={{ color: '#D4A843' }}>r</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#3CA84A' }}>imdb,rt,meta,tmdb</span>{'\n'}
              <span style={{ color: '#4A4840' }}>  &</span><span style={{ color: '#D4A843' }}>source</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#3CA84A' }}>tmdb</span>{'\n'}
              <span style={{ color: '#4A4840' }}>  &</span><span style={{ color: '#D4A843' }}>blur</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#60a5fa' }}>8</span>{'  '}
              <span style={{ color: '#4A4840' }}>&</span><span style={{ color: '#D4A843' }}>alpha</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#60a5fa' }}>0.45</span>{'  '}
              <span style={{ color: '#4A4840' }}>&</span><span style={{ color: '#D4A843' }}>rad</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#60a5fa' }}>12</span>{'\n'}
              <span style={{ color: '#4A4840' }}>  &</span><span style={{ color: '#D4A843' }}>imdb_x</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#60a5fa' }}>310</span>{'  '}
              <span style={{ color: '#4A4840' }}>&</span><span style={{ color: '#D4A843' }}>imdb_y</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#60a5fa' }}>20</span>{'\n'}
              <span style={{ color: '#4A4840' }}>  &</span><span style={{ color: '#D4A843' }}>rt_x</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#60a5fa' }}>310</span>{'  '}
              <span style={{ color: '#4A4840' }}>&</span><span style={{ color: '#D4A843' }}>rt_y</span><span style={{ color: '#4A4840' }}>=</span><span style={{ color: '#60a5fa' }}>90</span>
            </pre>
          </div>

          {/* Response */}
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(200,147,58,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span className="syne-font" style={{
              background: 'rgba(60,168,74,0.15)', border: '1px solid rgba(60,168,74,0.3)',
              color: '#3CA84A', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
              padding: '3px 8px', borderRadius: 3,
            }}>200 OK</span>
            <span className="mono-font" style={{ fontSize: 10, color: 'var(--film-silver)' }}>
              Content-Type: image/png
            </span>
          </div>
        </div>

        {/* Parameter grid */}
        <div style={{
          marginTop: 20, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
          opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s',
        }}>
          {[
            { p: 'r',               d: 'Comma-separated badge IDs',    e: 'imdb,rt,meta,tmdb'    },
            { p: 'source',          d: 'Poster source',                e: 'tmdb | fanart | imdb' },
            { p: 'blur / alpha / rad', d: 'Badge glass style',         e: '8 / 0.4 / 12'         },
            { p: '{id}_x / {id}_y', d: 'Badge pixel position',         e: 'imdb_x=310'           },
            { p: 'g_scale',         d: 'Global badge scale',           e: '1.0'                  },
            { p: 'textless',        d: 'Strip title text from poster', e: '1'                    },
          ].map(p => (
            <div key={p.p} style={{
              background: 'var(--film-mid)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 6, padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <code className="mono-font" style={{ fontSize: 10, color: 'var(--film-amber)' }}>{p.p}</code>
              <span className="body-font" style={{ fontSize: 11, color: 'var(--film-silver)', lineHeight: 1.5 }}>{p.d}</span>
              <code className="mono-font" style={{ fontSize: 9, color: 'rgba(122,117,110,0.5)' }}>{p.e}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
APISection.displayName = 'APISection';

// ─── Component: Use Cases ─────────────────────────────────────────
const UseCasesSection = memo(() => {
  const { ref, vis } = useInView(0.1);
  return (
    <section id="use-cases" ref={ref} aria-label="Use Cases" style={{
      background: 'var(--film-dark)', padding: '96px 24px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          textAlign: 'center', marginBottom: 60,
          opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div className="amber-tag" style={{ display: 'inline-block', marginBottom: 16 }}>Where People Use It</div>
          <h2 className="poster-font" style={{
            fontSize: 'clamp(40px, 7vw, 80px)',
            color: 'var(--film-cream)', lineHeight: 0.95,
          }}>
            ENDLESS<br/>
            <span style={{ color: 'var(--film-amber)' }}>USE CASES</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {USE_CASES.map((uc, i) => (
            <div
              key={uc.title}
              className="feature-card use-case-card"
              style={{
                padding: '28px 24px', borderRadius: 8, cursor: 'default',
                opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.6s ease ${i * 0.07}s, transform 0.6s ease ${i * 0.07}s, border-color 0.3s, box-shadow 0.3s`,
              }}
            >
              <div
                className="use-case-icon"
                style={{
                  fontSize: 32, marginBottom: 16,
                  display: 'inline-block',
                  transition: 'transform 0.3s ease',
                }}
              >
                {uc.icon}
              </div>
              <h3 className="syne-font" style={{
                fontSize: 15, fontWeight: 700, color: 'var(--film-cream)', marginBottom: 8,
              }}>
                {uc.title}
              </h3>
              <p className="body-font" style={{ fontSize: 12, color: 'var(--film-silver)', lineHeight: 1.65, marginBottom: 16 }}>
                {uc.desc}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {uc.tags.map(t => (
                  <span key={t} style={{
                    fontSize: 9, fontFamily: 'Syne, sans-serif', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(122,117,110,0.7)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    padding: '3px 7px', borderRadius: 3,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
UseCasesSection.displayName = 'UseCasesSection';

// ─── Component: CTA Section ───────────────────────────────────────
const CTASection = memo(() => {
  const { ref, vis } = useInView(0.2);
  return (
    <section ref={ref} aria-label="Call to Action" style={{
      background: 'var(--film-black)', padding: '96px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Horizontal amber lines */}
      {[0, 1, 2].map(i => (
        <div key={i} aria-hidden="true" className="amber-line" style={{
          position: 'absolute',
          top: `${20 + i * 30}%`, left: 0, right: 0,
          opacity: 0.06,
        }}/>
      ))}

      <div style={{
        maxWidth: 700, margin: '0 auto', textAlign: 'center',
        position: 'relative', zIndex: 2,
        opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        {/* Film counter decoration */}
        <div aria-hidden="true" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, marginBottom: 40,
        }}>
          {['5', '4', '3', '2', '1'].map((n, i) => (
            <div key={n} style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '1.5px solid rgba(200,147,58,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0.15 + i * 0.17,
            }}>
              <span className="poster-font" style={{ fontSize: 18, color: 'var(--film-amber)' }}>{n}</span>
            </div>
          ))}
        </div>

        <h2 className="poster-font" style={{
          fontSize: 'clamp(52px, 12vw, 120px)',
          color: 'var(--film-cream)', lineHeight: 0.9,
          marginBottom: 24, letterSpacing: '0.02em',
        }}>
          READY<br/>
          TO BUILD?
        </h2>

        {/* Amber divider */}
        <div style={{
          width: 120, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--film-amber), transparent)',
          margin: '0 auto 28px',
        }}/>

        <p className="syne-font" style={{
          fontSize: 15, color: 'var(--film-silver)', lineHeight: 1.7,
          maxWidth: 420, margin: '0 auto 44px',
        }}>
          Design your perfect poster in the visual editor. No account required — drag, drop, and copy your API URL.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--film-amber)', color: '#080808',
              fontWeight: 700, fontSize: 13, letterSpacing: '0.1em',
              textTransform: 'uppercase', textDecoration: 'none',
              padding: '14px 32px', borderRadius: 6,
            }}
          >
            Open Free Builder
            <ArrowRight size={14} />
          </Link>
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank" rel="noreferrer"
            className="syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: 'var(--film-cream)', fontWeight: 600, fontSize: 13,
              letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
              padding: '14px 28px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,147,58,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            <Github size={14} /> Star on GitHub <Star size={11} color="var(--film-amber)" fill="var(--film-amber)" />
          </a>
        </div>
      </div>
    </section>
  );
});
CTASection.displayName = 'CTASection';

// ─── Component: Footer ────────────────────────────────────────────
const FooterSection = memo(() => (
  <footer style={{
    background: 'var(--film-dark)',
    borderTop: '1px solid rgba(200,147,58,0.1)',
    padding: '48px 24px 32px',
  }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 32, marginBottom: 40 }}>
        {[
          { heading: 'Product', links: [['Movie Poster Builder', '/build', true], ['API Docs', '#api', false], ['Badge Showcase', '#features', false]] },
          { heading: 'Use Cases', links: [['Plex & Jellyfin', '#use-cases', false], ['Discord Bots', '#use-cases', false], ['Notion', '#use-cases', false]] },
          { heading: 'Resources', links: [['GitHub', 'https://github.com/xdaayush/freeposterapi', false], ['SpicyDevs', 'https://spicydevs.xyz', false]] },
        ].map(group => (
          <div key={group.heading}>
            <div className="syne-font" style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(200,147,58,0.6)',
              letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16,
            }}>
              {group.heading}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.links.map(([label, href, internal]) => (
                internal ? (
                  <Link key={label as string} to={href as string} style={{
                    fontSize: 12, color: 'var(--film-silver)', textDecoration: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)'; }}>
                    {label}
                  </Link>
                ) : (
                  <a key={label as string} href={href as string}
                    target={(href as string).startsWith('http') ? '_blank' : undefined}
                    rel={(href as string).startsWith('http') ? 'noreferrer' : undefined}
                    style={{
                      fontSize: 12, color: 'var(--film-silver)', textDecoration: 'none',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)'; }}>
                    {label}
                  </a>
                )
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 4,
            background: 'linear-gradient(135deg, var(--film-amber), #D4A843)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Film size={11} color="#080808" strokeWidth={2.5}/>
          </div>
          <span className="syne-font" style={{ fontSize: 11, color: 'var(--film-silver)' }}>
            <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Posterium</strong>
            {' '}— by{' '}
            <a href="https://spicydevs.xyz" target="_blank" rel="noreferrer" style={{
              color: 'var(--film-amber)', textDecoration: 'none',
            }}>SpicyDevs</a>
          </span>
        </div>
        <span className="syne-font" style={{ fontSize: 10, color: 'rgba(122,117,110,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Open source · No account · Free forever
        </span>
      </div>
    </div>
  </footer>
));
FooterSection.displayName = 'FooterSection';

// ─── Main Responsive CSS ──────────────────────────────────────────
const RESPONSIVE_CSS = `
  /* Hide desktop reel on mobile, show mobile reel */
  .desktop-reel { display: block; }
  .mobile-reel-section { display: none; }

  @media (max-width: 768px) {
    .desktop-reel { display: none; }
    .mobile-reel-section { display: block; }
    .nav-desktop-links { display: none !important; }
    .nav-mobile-btn { display: flex !important; }
  }

  @media (min-width: 769px) {
    .nav-mobile-btn { display: none !important; }
  }

  /* Film edges only on wider screens */
  @media (max-width: 900px) {
    /* hide film edge perforations on smaller screens */
  }
`;

// ─── Main Dashboard Export ────────────────────────────────────────
const Dashboard: React.FC = () => {
  // Inject Google Fonts and responsive CSS
  useEffect(() => {
    if (!document.getElementById('posterium-fonts')) {
      const link = document.createElement('link');
      link.id = 'posterium-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <>
      {/* Global styles */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS + RESPONSIVE_CSS }} />

      {/* Film grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Skip nav */}
      <a href="#main-content" style={{
        position: 'absolute', left: -9999, top: 8, zIndex: 999,
        background: 'var(--film-amber)', color: '#080808',
        padding: '8px 16px', borderRadius: 4, fontFamily: 'Syne, sans-serif',
        fontWeight: 700, fontSize: 12, textDecoration: 'none',
      }}
      onFocus={e => { (e.currentTarget as HTMLElement).style.left = '8px'; }}
      onBlur={e => { (e.currentTarget as HTMLElement).style.left = '-9999px'; }}>
        Skip to main content
      </a>

      <div style={{
        minHeight: '100dvh',
        background: 'var(--film-black)',
        color: 'var(--film-cream)',
        fontFamily: 'DM Sans, sans-serif',
        overflowX: 'hidden',
      }}>
        <Nav />
        <main id="main-content">
          <HeroSection />
          {/* Desktop reel (horizontal scroll driven by vertical) */}
          <div className="desktop-reel">
            <FilmReelSection />
          </div>
          <StatsBar />
          <FeaturesSection />
          <APISection />
          <UseCasesSection />
          <CTASection />
        </main>
        <FooterSection />
      </div>
    </>
  );
};

export default Dashboard;