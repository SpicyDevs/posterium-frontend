import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { API } from '@/lib/dashboard/constants';

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

const TOTAL = HERO_POSTERS.length;

function getPosterSrc(p: HeroPoster): string {
  return `${API}/${p.type}/${p.id}.svg?r=${p.r}&source=tmdb&blur=${p.blur}&alpha=${p.alpha}&rad=${p.rad}&${p.pos}`;
}

const POSTER_SRCS = HERO_POSTERS.map(getPosterSrc);
const CORNERS = ['tl', 'tr', 'bl', 'br'] as const;

const CORNER_STYLE = (c: (typeof CORNERS)[number]): React.CSSProperties => ({
  position: 'absolute',
  top: c.startsWith('t') ? 10 : 'auto',
  bottom: c.startsWith('b') ? 10 : 'auto',
  left: c.endsWith('l') ? 10 : 'auto',
  right: c.endsWith('r') ? 10 : 'auto',
  width: 14,
  height: 14,
  zIndex: 3,
  borderTop: c.startsWith('t') ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
  borderBottom: c.startsWith('b') ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
  borderLeft: c.endsWith('l') ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
  borderRight: c.endsWith('r') ? '1.5px solid rgba(196,124,46,0.45)' : 'none',
});

const CyclingPoster = memo(() => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  const loadedRef = useRef<Record<number, boolean>>({});
  const activeIdxRef = useRef(0);
  const transitioningRef = useRef(false);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const clearTransitionTimers = useCallback(() => {
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    swapTimerRef.current = null;
    settleTimerRef.current = null;
  }, []);

  const doTransition = useCallback(
    (next: number) => {
      if (next === activeIdxRef.current || transitioningRef.current || !loadedRef.current[next]) return;
      clearTransitionTimers();
      transitioningRef.current = true;
      setTransitioning(true);
      swapTimerRef.current = setTimeout(() => {
        setActiveIdx(next);
        settleTimerRef.current = setTimeout(() => {
          transitioningRef.current = false;
          setTransitioning(false);
        }, 360);
      }, 50);
    },
    [clearTransitionTimers]
  );

  const goTo = useCallback(
    (next: number) => {
      doTransition(next);
    },
    [doTransition]
  );

  const restartInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isVisibleRef.current || transitioningRef.current) return;
      goTo((activeIdxRef.current + 1) % TOTAL);
    }, 4500);
  }, [goTo]);

  useEffect(() => {
    if (!loaded[0]) return;
    restartInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTransitionTimers();
    };
  }, [clearTransitionTimers, loaded, restartInterval]);

  const handlePrev = useCallback(() => {
    goTo((activeIdxRef.current - 1 + TOTAL) % TOTAL);
    restartInterval();
  }, [goTo, restartInterval]);

  const handleNext = useCallback(() => {
    goTo((activeIdxRef.current + 1) % TOTAL);
    restartInterval();
  }, [goTo, restartInterval]);

  const handleDot = useCallback(
    (i: number) => {
      goTo(i);
      restartInterval();
    },
    [goTo, restartInterval]
  );

  const onLoad = useCallback(
    (i: number) => {
      if (loadedRef.current[i]) return;
      loadedRef.current = { ...loadedRef.current, [i]: true };
      setLoaded((p) => ({ ...p, [i]: true }));
    },
    []
  );

  useEffect(() => {
    imgRefs.current.forEach((img, i) => {
      if (img?.complete && img.naturalWidth > 0) onLoad(i);
    });
  }, [onLoad]);

  return (
    <div
      ref={sectionRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
    >
      <div
        style={{
          position: 'relative',
          width: 'clamp(200px,26vw,320px)',
          aspectRatio: '2/3',
          borderRadius: 6,
          overflow: 'hidden',
          background: '#111009',
          border: '1px solid rgba(196,124,46,0.18)',
          boxShadow:
            '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06), 0 0 60px rgba(196,124,46,0.08)',
        }}
      >
        {CORNERS.map((c) => (
          <div key={c} aria-hidden="true" style={CORNER_STYLE(c)} />
        ))}

        {HERO_POSTERS.map((p, i) => {
          return (
            <img
              key={p.id}
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
              src={POSTER_SRCS[i]}
              alt={`Custom ${p.type === 'movie' ? 'movie' : 'TV show'} poster for ${p.title} featuring live IMDb and Rotten Tomatoes rating badges`}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              decoding={i === 0 ? 'sync' : 'async'}
              onLoad={() => onLoad(i)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                opacity: i === activeIdx && loaded[i] ? 1 : 0,
                willChange: transitioning ? 'opacity' : 'auto',
                transition: 'opacity 0.35s ease',
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {!loaded[activeIdx] && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: 'linear-gradient(110deg,#151310 25%,#1e1b16 50%,#151310 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s linear infinite',
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            padding: '28px 12px 12px',
            background: 'linear-gradient(to top, rgba(7,7,6,0.9) 0%, transparent 100%)',
            opacity: transitioning ? 0 : 1,
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
            {HERO_POSTERS[activeIdx].title}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handlePrev}
          aria-label="Previous poster"
          style={{
            background: 'none',
            border: '1px solid rgba(196,124,46,0.22)',
            borderRadius: 3,
            cursor: 'pointer',
            color: 'rgba(196,124,46,0.5)',
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyItems: 'center',
            transition: 'border-color 0.18s, color 0.18s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(196,124,46,0.6)';
            el.style.color = 'var(--film-amber)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(196,124,46,0.22)';
            el.style.color = 'rgba(196,124,46,0.5)';
          }}
        >
          <ChevronLeft size={12} />
        </button>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {HERO_POSTERS.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDot(i)}
              aria-label={`Go to poster ${i + 1}`}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: 0,
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
          onClick={handleNext}
          aria-label="Next poster"
          style={{
            background: 'none',
            border: '1px solid rgba(196,124,46,0.22)',
            borderRadius: 3,
            cursor: 'pointer',
            color: 'rgba(196,124,46,0.5)',
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyItems: 'center',
            transition: 'border-color 0.18s, color 0.18s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(196,124,46,0.6)';
            el.style.color = 'var(--film-amber)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'rgba(196,124,46,0.22)';
            el.style.color = 'rgba(196,124,46,0.5)';
          }}
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
});
CyclingPoster.displayName = 'CyclingPoster';

const HERO_SECTION_STYLE: React.CSSProperties = {
  minHeight: '100dvh',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  background: 'var(--film-black)',
};
const AMBIENT_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  background:
    'radial-gradient(ellipse 55% 60% at 22% 50%, rgba(196,124,46,0.055) 0%, transparent 70%)',
};
const DOT_GRID_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  opacity: 0.18,
  backgroundImage: 'radial-gradient(rgba(196,124,46,0.15) 1px, transparent 1px)',
  backgroundSize: '36px 36px',
};
const AMBER_RULE_STYLE: React.CSSProperties = {
  width: 120,
  height: 1,
  background: 'linear-gradient(90deg, var(--film-amber), transparent)',
  margin: '24px 0 24px',
  opacity: 0.6,
};

const HeroSection = memo(() => (
  <section aria-label="Hero" style={HERO_SECTION_STYLE}>
    <div aria-hidden="true" style={AMBIENT_STYLE} />
    <div aria-hidden="true" style={DOT_GRID_STYLE} />

    <div
      className="hero-two-col"
      style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(64px,9vh,112px) clamp(40px,5vw,72px)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 'clamp(40px,6vw,80px)',
        alignItems: 'center',
      }}
    >
      <div>
        <h1
          className="h-a1 poster-font"
          style={{
            fontSize: 'clamp(88px,13vw,200px)',
            lineHeight: 0.84,
            letterSpacing: '0.03em',
            marginBottom: 0,
          }}
          aria-label="Posterium"
        >
          <span aria-hidden="true" style={{ color: 'var(--film-cream)', display: 'block' }}>
            POSTER
          </span>
          <span
            aria-hidden="true"
            style={{
              color: 'transparent',
              WebkitTextStroke: '2px var(--film-amber)',
              display: 'block',
            }}
          >
            IUM
          </span>
        </h1>

        <div className="h-a2" style={AMBER_RULE_STYLE} />

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
          <strong style={{ color: 'var(--film-cream)', fontWeight: 600 }}>Metacritic</strong>, and
          more — all from a single URL.
        </p>

        <div className="h-a3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="/build"
            title="Open Poster Builder"
            aria-label="Open Movie Poster Builder"
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
          </a>
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
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'rgba(196,124,46,0.28)';
              el.style.color = 'var(--film-cream)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = 'rgba(255,255,255,0.08)';
              el.style.color = 'var(--film-silver)';
            }}
          >
            Browse Showcase
          </a>
        </div>

        <div className="h-a4" style={{ display: 'flex', gap: 24, marginTop: 40 }}>
          {(
            [
              ['∞', 'Free API calls'],
              ['10+', 'Rating sources'],
              ['0', 'Auth required'],
            ] as const
          ).map(([val, label]) => (
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
                  color: 'var(--film-text-dim)',
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

      <div className="h-a5 hero-poster-right" aria-label="Poster showcase">
        <CyclingPoster />
      </div>
    </div>

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
