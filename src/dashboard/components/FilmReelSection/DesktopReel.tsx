// src/dashboard/components/FilmReelSection/DesktopReel.tsx
// Collage reel: 3 rows of posters at different heights, zero gap, zero float animation.
// Posters stuck together wall-to-wall. Horizontal parallax on vertical scroll via useScrollReel.
// Row heights: 230px / 178px / 148px → total 556px + overhead = fits 100dvh.
import { memo, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { REEL_ITEMS } from '../../constants';
import { useScrollReel } from '../../hooks';
import { SprocketStrip } from '../primitives';
import { API } from '../../constants';

// ── Row configuration ─────────────────────────────────────────────
// Each row: different height → different poster width (2:3 ratio).
// Poster counts chosen so all three rows reach ~3300px total width.
const ROW_CONFIGS = [
  { height: 234, count: 20 },   // width: 156px → total: 3120px
  { height: 180, count: 24 },   // width: 120px → total: 2880px  (pad with extra)
  { height: 150, count: 30 },   // width: 100px → total: 3000px
] as const;

// Build poster slots by cycling through REEL_ITEMS
function makeRow(count: number, offset: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...REEL_ITEMS[(i + offset) % REEL_ITEMS.length],
    _slot: i,
  }));
}

const ROWS = [
  makeRow(ROW_CONFIGS[0].count, 0),
  makeRow(ROW_CONFIGS[1].count, 7),
  makeRow(ROW_CONFIGS[2].count, 14),
];

// ── Individual poster cell ────────────────────────────────────────
const CollagePoster = memo<{
  id: string;
  type: 'movie' | 'tv';
  title: string;
  width: number;
  height: number;
  eager?: boolean;
}>(({ id, type, title, width, height, eager = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const onLoad = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => setErr(true), []);

  const src = `${API}/${type}/${id}.svg?source=tmdb`;

  return (
    <div
      style={{
        width,
        height,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: '#0d0c0a',
        // 1px hairline border separating posters, reads as film strip
        borderRight: '1px solid rgba(0,0,0,0.7)',
      }}
    >
      {!loaded && !err && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(110deg,#111009 25%,#1a1712 50%,#111009 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s linear infinite',
          }}
        />
      )}
      {err && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.35s ease',
          // Slight contrast boost for the wall feel
          filter: 'contrast(1.04) saturate(0.96)',
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

  // Direct DOM height management - zero re-render on recalc
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
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflow: 'hidden',
          background: 'var(--film-dark)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 48px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(196,124,46,0.08)',
          }}
        >
          <div>
            <div
              className="poster-font"
              style={{
                fontSize: 20,
                color: 'var(--film-cream)',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              THE REEL
            </div>
            <div
              className="syne-font"
              style={{
                fontSize: 8,
                color: 'var(--film-silver)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              Scroll to advance
            </div>
          </div>
          <span
            className="mono-font"
            style={{
              fontSize: 8,
              color: 'rgba(122,117,110,0.35)',
              letterSpacing: '0.12em',
            }}
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

        {/* Poster wall - 3 rows */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Edge feathers */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: 60,
              background: 'linear-gradient(to right, var(--film-dark), transparent)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 0, top: 0, bottom: 0,
              width: 60,
              background: 'linear-gradient(to left, var(--film-dark), transparent)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />

          {/* Track - all 3 rows inside, flex-column so scrollWidth = widest row */}
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              willChange: 'transform',
              gap: 0,
            }}
          >
            {ROWS.map((row, rowIdx) => {
              const { height, count } = ROW_CONFIGS[rowIdx];
              const width = Math.round((height * 2) / 3);
              return (
                <div
                  key={rowIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 0,
                    height,
                    // Thin horizontal separator between rows
                    borderBottom:
                      rowIdx < ROWS.length - 1
                        ? '2px solid rgba(0,0,0,0.8)'
                        : 'none',
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
            flexShrink: 0,
            padding: '7px 48px',
            borderTop: '1px solid rgba(196,124,46,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'rgba(122,117,110,0.35)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            Reel
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              ref={progressFillRef}
              style={{
                height: '100%',
                width: '0%',
                borderRadius: 99,
                background:
                  'linear-gradient(90deg, var(--film-amber), #D4A245)',
                transition: 'none',
              }}
            />
          </div>
          <span
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'rgba(122,117,110,0.28)',
              flexShrink: 0,
              letterSpacing: '0.1em',
            }}
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