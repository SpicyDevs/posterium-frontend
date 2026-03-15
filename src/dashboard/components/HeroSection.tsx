// src/dashboard/components/HeroSection.tsx
// Two-column: left = wordmark + tagline + CTAs, right = single auto-cycling poster.
// Poster cycles through HERO_POSTERS with fade transition every 4s.
// No eyebrow tag, larger POSTERIUM wordmark.
import { memo, useState, useCallback, useEffect } from 'react';
import { Link } from '../../Router';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { API } from '../constants';
import { FilmEdge } from './primitives';

interface HeroPoster {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  r: string;
  pos: string;
  blur: number;
  alpha: number;
  rad: number;
}

const HERO_POSTERS: HeroPoster[] = [
  {
    id: '155',      type: 'movie', title: 'The Dark Knight',
    r: 'imdb,rt',  pos: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86',
    blur: 8, alpha: 0.46, rad: 10,
  },
  {
    id: '872585',   type: 'movie', title: 'Oppenheimer',
    r: 'rt,meta',  pos: 'rt_x=10&rt_y=12&meta_x=10&meta_y=86',
    blur: 8, alpha: 0.46, rad: 10,
  },
  {
    id: '238',      type: 'movie', title: 'The Godfather',
    r: 'imdb',     pos: 'imdb_x=10&imdb_y=12',
    blur: 7, alpha: 0.44, rad: 10,
  },
  {
    id: '680',      type: 'movie', title: 'Pulp Fiction',
    r: 'imdb,rt,meta', pos: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86&meta_x=10&meta_y=160',
    blur: 8, alpha: 0.46, rad: 10,
  },
  {
    id: '27205',    type: 'movie', title: 'Inception',
    r: 'imdb,rt',  pos: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86',
    blur: 8, alpha: 0.46, rad: 10,
  },
  {
    id: '278',      type: 'movie', title: 'The Shawshank Redemption',
    r: 'imdb',     pos: 'imdb_x=10&imdb_y=12',
    blur: 7, alpha: 0.44, rad: 10,
  },
];

// Preload all poster srcs so transitions are instant after first load
function getPosterSrc(p: HeroPoster) {
  return (
    `${API}/${p.type}/${p.id}.svg` +
    `?r=${p.r}&source=tmdb&blur=${p.blur}&alpha=${p.alpha}&rad=${p.rad}&${p.pos}`
  );
}

const CyclingPoster = memo(() => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fade, setFade] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const goTo = useCallback((next: number) => {
    setFade(true);
    setTimeout(() => {
      setActiveIdx(next);
      setFade(false);
    }, 320);
  }, []);

  const prev = useCallback(() => {
    goTo((activeIdx - 1 + HERO_POSTERS.length) % HERO_POSTERS.length);
  }, [activeIdx, goTo]);

  const next = useCallback(() => {
    goTo((activeIdx + 1) % HERO_POSTERS.length);
  }, [activeIdx, goTo]);

  // Auto-advance every 4.5s
  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => {
        const n = (i + 1) % HERO_POSTERS.length;
        setFade(true);
        setTimeout(() => setFade(false), 320);
        return n; // instant index change, opacity handles the transition
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const poster = HERO_POSTERS[activeIdx];
  const src = getPosterSrc(poster);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Poster frame */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(200px,26vw,320px)',
          aspectRatio: '2/3',
          borderRadius: 6,
          overflow: 'hidden',
          background: '#111009',
          border: '1px solid rgba(196,124,46,0.18)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06), 0 0 60px rgba(196,124,46,0.08)',
        }}
      >
        {/* Amber corner crop marks */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <div
            key={c}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top:    c.startsWith('t') ? 10 : 'auto',
              bottom: c.startsWith('b') ? 10 : 'auto',
              left:   c.endsWith('l')   ? 10 : 'auto',
              right:  c.endsWith('r')   ? 10 : 'auto',
              width: 14, height: 14, zIndex: 3,
              borderTop:    c.startsWith('t') ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
              borderBottom: c.startsWith('b') ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
              borderLeft:   c.endsWith('l')   ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
              borderRight:  c.endsWith('r')   ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
            }}
          />
        ))}

        {/* All poster images - cross-fade via opacity */}
        {HERO_POSTERS.map((p, i) => (
          <img
            key={p.id}
            src={getPosterSrc(p)}
            alt={p.title}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              opacity: i === activeIdx ? (fade ? 0 : 1) : 0,
              transition: 'opacity 0.35s ease',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Skeleton */}
        {!loaded[activeIdx] && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s linear infinite',
            }}
          />
        )}

        {/* Title label at bottom */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
            padding: '28px 12px 12px',
            background: 'linear-gradient(to top, rgba(7,7,6,0.9) 0%, transparent 100%)',
            opacity: fade ? 0 : 1,
            transition: 'opacity 0.25s ease',
          }}
        >
          <span
            className="mono-font"
            style={{
              fontSize: 8,
              color: 'rgba(196,124,46,0.65)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {poster.title}
          </span>
        </div>
      </div>

      {/* Controls: prev · dots · next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={prev}
          aria-label="Previous poster"
          style={{
            background: 'none', border: '1px solid rgba(196,124,46,0.22)',
            borderRadius: 3, cursor: 'pointer',
            color: 'rgba(196,124,46,0.5)',
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.18s, color 0.18s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.6)';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.22)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(196,124,46,0.5)';
          }}
        >
          <ChevronLeft size={12} />
        </button>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {HERO_POSTERS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to poster ${i + 1}`}
              style={{
                border: 'none', cursor: 'pointer', padding: 0,
                background: i === activeIdx ? 'var(--film-amber)' : 'rgba(196,124,46,0.25)',
                width: i === activeIdx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Next poster"
          style={{
            background: 'none', border: '1px solid rgba(196,124,46,0.22)',
            borderRadius: 3, cursor: 'pointer',
            color: 'rgba(196,124,46,0.5)',
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.18s, color 0.18s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.6)';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.22)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(196,124,46,0.5)';
          }}
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
});
CyclingPoster.displayName = 'CyclingPoster';

const HeroSection = memo(() => (
  <section
    aria-label="Hero"
    style={{
      minHeight: '100dvh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      background: 'var(--film-black)',
    }}
  >
    {/* Side perforations */}
    <FilmEdge side="left" />
    <FilmEdge side="right" />

    {/* Ambient glow */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 55% 60% at 22% 50%, rgba(196,124,46,0.055) 0%, transparent 70%)',
      }}
    />

    {/* Dot grid */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18,
        backgroundImage: 'radial-gradient(rgba(196,124,46,0.15) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}
    />

    {/* Subtle flicker overlay */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        animation: 'hero-flicker-subtle 22s ease-in-out infinite',
      }}
    />

    {/* Two-column content */}
    <div
      className="hero-two-col"
      style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(64px,9vh,112px) clamp(40px,5vw,72px)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 'clamp(40px,6vw,80px)',
        alignItems: 'center',
      }}
    >
      {/* ── LEFT: Text content ── */}
      <div>
        {/* Wordmark — larger, no eyebrow above */}
        <h1
          className="h-a1 poster-font"
          style={{
            fontSize: 'clamp(88px,13vw,200px)',
            lineHeight: 0.84,
            letterSpacing: '0.03em',
            marginBottom: 0,
          }}
        >
          <span style={{ color: 'var(--film-cream)', display: 'block' }}>POSTER</span>
          <span
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px var(--film-amber)',
              display: 'block',
            }}
          >
            IUM
          </span>
        </h1>

        {/* Amber rule */}
        <div
          className="h-a2"
          style={{
            width: 120, height: 1,
            background: 'linear-gradient(90deg, var(--film-amber), transparent)',
            margin: '24px 0 24px',
            opacity: 0.6,
          }}
        />

        {/* Sub */}
        <p
          className="h-a2 syne-font"
          style={{
            fontSize: 'clamp(13px,1.4vw,16px)',
            color: 'var(--film-silver)',
            fontWeight: 400,
            maxWidth: 480,
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        >
          Movie &amp; TV poster images with glassmorphism rating badges from{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>IMDb</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Rotten Tomatoes</strong>,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Metacritic</strong>
          , and more — all from a single URL.
        </p>

        {/* CTAs */}
        <div className="h-a3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'var(--film-amber)', color: '#070706',
              fontWeight: 700, fontSize: 11, letterSpacing: '0.09em',
              textTransform: 'uppercase', textDecoration: 'none',
              padding: '12px 24px', borderRadius: 4,
            }}
          >
            Open Builder <ArrowRight size={12} />
          </Link>

          <a
            href="#reel"
            className="syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--film-silver)', fontWeight: 600, fontSize: 11,
              letterSpacing: '0.09em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '11px 20px', borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.28)';
              (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
            }}
          >
            Browse Showcase
          </a>
        </div>

        {/* Stats */}
        <div
          className="h-a4"
          style={{ display: 'flex', gap: 24, marginTop: 40 }}
        >
          {[
            ['∞', 'Free API calls'],
            ['10+', 'Rating sources'],
            ['0', 'Auth required'],
          ].map(([val, label]) => (
            <div key={label}>
              <div
                className="poster-font"
                style={{
                  fontSize: 28, color: 'var(--film-amber)',
                  lineHeight: 1, letterSpacing: '0.04em',
                }}
              >
                {val}
              </div>
              <div
                className="mono-font"
                style={{
                  fontSize: 8, color: 'rgba(110,104,96,0.5)',
                  letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 3,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Single cycling poster ── */}
      <div
        className="h-a5 hero-poster-right"
        aria-label="Poster showcase"
      >
        <CyclingPoster />
      </div>
    </div>

    {/* Responsive overrides */}
    <style>{`
      @media (max-width: 820px) {
        .hero-two-col { grid-template-columns: 1fr !important; }
        .hero-poster-right { display: none !important; }
      }
    `}</style>
  </section>
));

HeroSection.displayName = 'HeroSection';
export default HeroSection;