// src/dashboard/components/HeroSection.tsx
// Two-column: left = wordmark + tagline + CTAs, right = static poster showcase grid.
// No floating fan posters. No QuickBuilder in hero (lives in footer).
import { memo, useState, useCallback } from 'react';
import { Link } from '../../Router';
import { ArrowRight } from 'lucide-react';
import { API } from '../constants';
import { FilmEdge } from './primitives';

// Predefined static poster set - fixed badge configs, no interaction.
// These call the API but with stable query strings (no user input).
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
    id: '155',
    type: 'movie',
    title: 'The Dark Knight',
    r: 'imdb,rt',
    pos: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '872585',
    type: 'movie',
    title: 'Oppenheimer',
    r: 'rt,meta',
    pos: 'rt_x=10&rt_y=12&meta_x=10&meta_y=86',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '238',
    type: 'movie',
    title: 'The Godfather',
    r: 'imdb',
    pos: 'imdb_x=10&imdb_y=12',
    blur: 7,
    alpha: 0.44,
    rad: 10,
  },
  {
    id: '680',
    type: 'movie',
    title: 'Pulp Fiction',
    r: 'imdb,rt,meta',
    pos: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86&meta_x=10&meta_y=160',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '27205',
    type: 'movie',
    title: 'Inception',
    r: 'imdb,rt',
    pos: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '278',
    type: 'movie',
    title: 'The Shawshank Redemption',
    r: 'imdb',
    pos: 'imdb_x=10&imdb_y=12',
    blur: 7,
    alpha: 0.44,
    rad: 10,
  },
];

const PosterCell = memo<{ poster: HeroPoster; eager?: boolean }>(
  ({ poster, eager = false }) => {
    const [loaded, setLoaded] = useState(false);
    const onLoad = useCallback(() => setLoaded(true), []);
    const src =
      `${API}/${poster.type}/${poster.id}.svg` +
      `?r=${poster.r}&source=tmdb` +
      `&blur=${poster.blur}&alpha=${poster.alpha}&rad=${poster.rad}` +
      `&${poster.pos}`;

    return (
      <div
        style={{
          position: 'relative',
          aspectRatio: '2/3',
          overflow: 'hidden',
          borderRadius: 4,
          background: '#111009',
          border: '1px solid rgba(196,124,46,0.14)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.72)',
        }}
      >
        {!loaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s linear infinite',
            }}
          />
        )}
        <img
          src={src}
          alt={poster.title}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={onLoad}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.45s ease',
          }}
        />
      </div>
    );
  }
);
PosterCell.displayName = 'PosterCell';

const HeroSection = memo(() => (
  <section
    aria-label="Hero"
    style={{
      minHeight: '100dvh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      paddingTop: 56,
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
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 55% 60% at 22% 50%, rgba(196,124,46,0.055) 0%, transparent 70%)',
      }}
    />

    {/* Dot grid */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.18,
        backgroundImage: 'radial-gradient(rgba(196,124,46,0.15) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }}
    />

    {/* Subtle flicker overlay */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'hero-flicker-subtle 22s ease-in-out infinite',
      }}
    />

    {/* Two-column content */}
    <div
      className="hero-two-col"
      style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(48px,8vh,100px) clamp(40px,5vw,72px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(40px,6vw,80px)',
        alignItems: 'center',
      }}
    >
      {/* ── LEFT: Text content ── */}
      <div>
        {/* Eyebrow */}
        <div
          className="h-a1"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(196,124,46,0.28)',
            background: 'rgba(196,124,46,0.055)',
            borderRadius: 3,
            padding: '5px 12px',
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--film-amber)',
              display: 'block',
              animation: 'amber-pulse 2.2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span
            className="syne-font"
            style={{
              color: 'var(--film-amber)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Free &amp; Open Source - No Account Required
          </span>
        </div>

        {/* Wordmark */}
        <h1
          className="h-a2 poster-font"
          style={{
            fontSize: 'clamp(72px,9vw,144px)',
            lineHeight: 0.86,
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
          className="h-a3"
          style={{
            width: 120,
            height: 1,
            background:
              'linear-gradient(90deg, var(--film-amber), transparent)',
            margin: '22px 0 22px',
            opacity: 0.6,
          }}
        />

        {/* Sub */}
        <p
          className="h-a3 syne-font"
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
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>
            Rotten Tomatoes
          </strong>
          ,{' '}
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Metacritic</strong>
          , and more - all from a single URL.
        </p>

        {/* CTAs */}
        <div
          className="h-a4"
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'var(--film-amber)',
              color: '#070706',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '12px 24px',
              borderRadius: 4,
            }}
          >
            Open Builder <ArrowRight size={12} />
          </Link>

          <a
            href="#reel"
            className="syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--film-silver)',
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '11px 20px',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(196,124,46,0.28)';
              (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLElement).style.color = 'var(--film-silver)';
            }}
          >
            Browse Showcase
          </a>
        </div>

        {/* Stats inline */}
        <div
          className="h-a4"
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 36,
          }}
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
                  fontSize: 28,
                  color: 'var(--film-amber)',
                  lineHeight: 1,
                  letterSpacing: '0.04em',
                }}
              >
                {val}
              </div>
              <div
                className="mono-font"
                style={{
                  fontSize: 8,
                  color: 'rgba(110,104,96,0.5)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Static poster showcase ── */}
      <div
        className="h-a5 hero-poster-grid"
        aria-label="Poster showcase"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'auto auto',
          gap: 8,
          alignItems: 'start',
        }}
      >
        {/* Tall left poster - spans 2 rows */}
        <div style={{ gridRow: 'span 2' }}>
          <PosterCell poster={HERO_POSTERS[0]} eager />
        </div>

        {/* Top right two */}
        <PosterCell poster={HERO_POSTERS[1]} eager />
        <PosterCell poster={HERO_POSTERS[2]} eager />

        {/* Bottom right two */}
        <PosterCell poster={HERO_POSTERS[3]} />
        <PosterCell poster={HERO_POSTERS[4]} />
      </div>
    </div>

    {/* Responsive: stack on mobile */}
    <style>{`
      @media (max-width: 820px) {
        .hero-two-col { grid-template-columns: 1fr !important; }
        .hero-poster-grid { display: none !important; }
      }
    `}</style>
  </section>
));

HeroSection.displayName = 'HeroSection';
export default HeroSection;