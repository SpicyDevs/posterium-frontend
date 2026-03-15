// src/dashboard/components/FilmReelSection/DesktopReel.tsx
// Collage reel: 3 rows of posters. Horizontal parallax on vertical scroll.
// All posters include IMDb rating badge. Amber tint + sepia filter applied
// to the poster wall for a unified film aesthetic.
// Rows sized so all approximately same total pixel width → uniform right edge.
import { memo, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { REEL_ITEMS } from '../../constants';
import { useScrollReel } from '../../hooks';
import { SprocketStrip } from '../primitives';
import { API } from '../../constants';

// ── Row configuration ──────────────────────────────────────────────
// Target pixel width: ~3600px for all rows so the right edge is uniform.
// Row 0 (h=234, w=156px): 24 items = 3744px
// Row 1 (h=180, w=120px): 31 items = 3720px  (≥ max row 0, so right edge safe)
// Row 2 (h=150, w=100px): 38 items = 3800px  (≥ max, so right edge safe)
// Track scrollWidth = max(3744, 3720, 3800) = 3800px.
// At max scroll rows 0 & 1 end 56px/80px before right: masked by 160px feather.
const ROW_CONFIGS = [
  { height: 234, count: 24 },
  { height: 180, count: 31 },
  { height: 150, count: 38 },
] as const;

// Badge configuration per row (all IMDb, different positions for variety)
const ROW_BADGE_PARAMS = [
  `r=imdb&source=tmdb&blur=6&alpha=0.36&rad=8&imdb_x=8&imdb_y=10`,
  `r=imdb&source=tmdb&blur=6&alpha=0.36&rad=8&imdb_x=8&imdb_y=10`,
  `r=imdb&source=tmdb&blur=6&alpha=0.36&rad=8&imdb_x=8&imdb_y=10`,
] as const;

function makeRow(count: number, offset: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...REEL_ITEMS[(i + offset) % REEL_ITEMS.length],
    _slot: i,
  }));
}

const ROWS = [
  makeRow(ROW_CONFIGS[0].count, 0),
  makeRow(ROW_CONFIGS[1].count, 8),   // offset so different movies lead each row
  makeRow(ROW_CONFIGS[2].count, 15),
];

// ── Individual poster cell ─────────────────────────────────────────
const CollagePoster = memo<{
  id: string;
  type: 'movie' | 'tv';
  title: string;
  width: number;
  height: number;
  badgeParams: string;
  eager?: boolean;
}>(({ id, type, title, width, height, badgeParams, eager = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => setErr(true), []);

  const src = `${API}/${type}/${id}.svg?${badgeParams}`;

  return (
    <div
      style={{
        width,
        height,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: '#0d0c0a',
        borderRight: '1px solid rgba(0,0,0,0.7)',
      }}
    >
      {!loaded && !err && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg,#111009 25%,#1a1712 50%,#111009 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s linear infinite',
          }}
        />
      )}
      {err && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.18,
          }}
        >
          <span style={{ fontSize: 20 }}>🎞</span>
        </div>
      )}
      <img
        src={src}
        alt={title}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover', display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.35s ease',
          filter: 'contrast(1.02)',
        }}
      />
    </div>
  );
});
CollagePoster.displayName = 'CollagePoster';

// ── Desktop Reel ──────────────────────────────────────────────────
const DesktopReel = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;
      const tw = track.scrollWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (tw <= vw) return;
      container.style.height = `${tw - vw + vh}px`;
    };

    recalc();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(recalc);
      if (trackRef.current) ro.observe(trackRef.current);
    }
    window.addEventListener('resize', recalc, { passive: true });
    const t1 = setTimeout(recalc, 300);
    const t2 = setTimeout(recalc, 1000);
    const t3 = setTimeout(recalc, 2500);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', recalc);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useScrollReel(containerRef, trackRef, progressFillRef);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          position: 'sticky', top: 0,
          height: '100dvh', overflow: 'hidden',
          background: 'var(--film-dark)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 48px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(196,124,46,0.08)',
          }}
        >
          <div>
            <div
              className="poster-font"
              style={{ fontSize: 20, color: 'var(--film-cream)', letterSpacing: '0.08em', lineHeight: 1 }}
            >
              THE REEL
            </div>
            <div
              className="syne-font"
              style={{
                fontSize: 8, color: 'var(--film-silver)',
                letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2,
              }}
            >
              Scroll to advance
            </div>
          </div>
          <span
            className="mono-font"
            style={{ fontSize: 8, color: 'rgba(122,117,110,0.35)', letterSpacing: '0.12em' }}
          >
            {REEL_ITEMS.length} titles · 3 tracks
          </span>
        </div>

        {/* Top sprocket */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* Poster wall */}
        <div
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center',
          }}
        >
          {/* Left feather — increased opacity */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 140,
              background: 'linear-gradient(to right, var(--film-dark) 0%, rgba(14,13,11,0.88) 60%, transparent 100%)',
              pointerEvents: 'none', zIndex: 2,
            }}
          />
          {/* Right feather — wider + higher opacity to mask row-end gaps */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: 200,
              background: 'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)',
              pointerEvents: 'none', zIndex: 2,
            }}
          />

          {/* Amber tint overlay on poster wall */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
              background: 'rgba(196,124,46,0.04)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Track */}
          <div
            ref={trackRef}
            style={{
              display: 'flex', flexDirection: 'column',
              willChange: 'transform', gap: 0,
            }}
          >
            {ROWS.map((row, rowIdx) => {
              const { height, count } = ROW_CONFIGS[rowIdx];
              const width = Math.round((height * 2) / 3);
              const badgeParams = ROW_BADGE_PARAMS[rowIdx];
              return (
                <div
                  key={rowIdx}
                  style={{
                    display: 'flex', flexDirection: 'row', gap: 0,
                    height, overflow: 'hidden',          // overflow:hidden clips row ends
                    borderBottom: rowIdx < ROWS.length - 1
                      ? '2px solid rgba(0,0,0,0.8)' : 'none',
                    // Muted, unified filter: sepia tone + slight desaturation
                    filter: 'sepia(0.18) saturate(0.72) brightness(0.9)',
                  }}
                >
                  {row.slice(0, count).map((item, idx) => (
                    <CollagePoster
                      key={`r${rowIdx}-${item.id}-${item._slot}`}
                      id={item.id}
                      type={item.type}
                      title={item.title}
                      width={width}
                      height={height}
                      badgeParams={badgeParams}
                      eager={rowIdx === 0 && idx < 6}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom sprocket */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderTop: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* Progress bar */}
        <div
          style={{
            flexShrink: 0, padding: '7px 48px',
            borderTop: '1px solid rgba(196,124,46,0.06)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <span
            className="mono-font"
            style={{
              fontSize: 7, color: 'rgba(122,117,110,0.35)',
              letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0,
            }}
          >
            Reel
          </span>
          <div
            style={{
              flex: 1, height: 1, background: 'rgba(255,255,255,0.04)',
              borderRadius: 99, overflow: 'hidden',
            }}
          >
            <div
              ref={progressFillRef}
              style={{
                height: '100%', width: '0%', borderRadius: 99,
                background: 'linear-gradient(90deg, var(--film-amber), #D4A245)',
                transition: 'none',
              }}
            />
          </div>
          <span
            className="mono-font"
            style={{ fontSize: 7, color: 'rgba(122,117,110,0.28)', flexShrink: 0, letterSpacing: '0.1em' }}
          >
            {ROW_CONFIGS[0].count + ROW_CONFIGS[1].count + ROW_CONFIGS[2].count} frames
          </span>
        </div>
      </div>
    </div>
  );
});

DesktopReel.displayName = 'DesktopReel';
export default DesktopReel;