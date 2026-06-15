// src/components/dashboard/FilmReelSection/index.tsx
// Removed: animated movie name marquee above/below the reel strip
import { memo, useRef, useEffect, useState } from 'react';
import { API } from '@/lib/dashboard/constants';

const REEL_POSTERS = [
  { id: '155',    type: 'movie', r: 'imdb',     pos: 'imdb_x=14&imdb_y=14' },
  { id: '238',    type: 'movie', r: 'imdb,rt',  pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88' },
  { id: '680',    type: 'movie', r: 'rt,meta',  pos: 'rt_x=14&rt_y=14&meta_x=14&meta_y=88' },
  { id: '27205',  type: 'movie', r: 'imdb',     pos: 'imdb_x=310&imdb_y=14' },
  { id: '872585', type: 'movie', r: 'imdb,rt',  pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88' },
  { id: '157336', type: 'movie', r: 'rt',       pos: 'rt_x=310&rt_y=14' },
  { id: '1396',   type: 'tv',    r: 'imdb',     pos: 'imdb_x=14&imdb_y=14' },
  { id: '475557', type: 'movie', r: 'imdb,meta',pos: 'imdb_x=14&imdb_y=14&meta_x=14&meta_y=88' },
] as const;

// Duplicate for seamless loop
const REEL_ITEMS = [...REEL_POSTERS, ...REEL_POSTERS];

function buildSrc(p: (typeof REEL_POSTERS)[number]) {
  return `${API}/${p.type}/${p.id}.svg?r=${p.r}&source=tmdb&blur=7&alpha=0.43&rad=10&${p.pos}`;
}

// Static perforations on a film strip segment
const Perfs = memo<{ count?: number }>(({ count = 6 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', justifyContent: 'space-around', padding: '6px 0' }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} style={{
        width: 12, height: 16, borderRadius: 2,
        background: '#000',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
        flexShrink: 0,
      }} />
    ))}
  </div>
));
Perfs.displayName = 'Perfs';

const PosterCard = memo<{ p: (typeof REEL_ITEMS)[number]; index: number }>(({ p, index }) => {
  const [loaded, setLoaded] = useState(false);
  const src = buildSrc(p);
  return (
    <div style={{
      width: 'clamp(100px,12vw,152px)',
      aspectRatio: '2/3',
      flexShrink: 0,
      position: 'relative',
      borderRadius: 3,
      overflow: 'hidden',
      background: '#0f0e0c',
      border: '1px solid rgba(196,124,46,0.12)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
    }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(110deg,#13120f 25%,#1c1a16 50%,#13120f 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s linear infinite',
        }} />
      )}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading={index < 4 ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
    </div>
  );
});
PosterCard.displayName = 'PosterCard';

const FilmReelSection = memo(() => {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number | null>(null);
  const xRef     = useRef(0);
  const SPEED    = 0.6; // px per frame

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let paused = false;

    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    track.addEventListener('mouseenter', onEnter);
    track.addEventListener('mouseleave', onLeave);

    const tick = () => {
      if (!paused) {
        xRef.current -= SPEED;
        const halfW = track.scrollWidth / 2;
        if (Math.abs(xRef.current) >= halfW) xRef.current = 0;
        track.style.transform = `translateX(${xRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      track.removeEventListener('mouseenter', onEnter);
      track.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <section
      id="reel"
      aria-label="Poster showcase reel"
      style={{ background: 'var(--film-black)', padding: '0', overflow: 'hidden', position: 'relative' }}
    >
      {/* Edge fade masks */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
        background: 'linear-gradient(90deg, var(--film-black) 0%, transparent 8%, transparent 92%, var(--film-black) 100%)',
      }} />

      {/* Film strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(7,7,6,0.98)',
        borderTop: '1px solid rgba(196,124,46,0.08)',
        borderBottom: '1px solid rgba(196,124,46,0.08)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Left perforations */}
        <div className="film-perforation" aria-hidden="true" style={{
          width: 28, flexShrink: 0, background: 'rgba(0,0,0,0.6)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
          alignSelf: 'stretch', display: 'flex', alignItems: 'stretch',
        }}>
          <Perfs count={7} />
        </div>

        {/* Scrolling track */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', padding: '16px 0' }}>
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              gap: 14,
              width: 'max-content',
              willChange: 'transform',
            }}
          >
            {REEL_ITEMS.map((p, i) => (
              <PosterCard key={`${p.id}-${i}`} p={p} index={i} />
            ))}
          </div>
        </div>

        {/* Right perforations */}
        <div className="film-perforation" aria-hidden="true" style={{
          width: 28, flexShrink: 0, background: 'rgba(0,0,0,0.6)',
          borderLeft: '1px solid rgba(255,255,255,0.04)',
          alignSelf: 'stretch', display: 'flex', alignItems: 'stretch',
        }}>
          <Perfs count={7} />
        </div>
      </div>
    </section>
  );
});
FilmReelSection.displayName = 'FilmReelSection';
export default FilmReelSection;
