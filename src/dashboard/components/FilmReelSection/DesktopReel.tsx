// src/dashboard/components/FilmReelSection/DesktopReel.tsx
// ─────────────────────────────────────────────────────────────────────
// PERFORMANCE NOTES
// ─────────────────
// Root cause of jank: the old code applied `filter: sepia(...) saturate(...)
// brightness(...)` to EACH of the 3 row <div>s that were children of the
// `willChange: transform` track element.  When a parent has willChange:transform
// the browser promotes it to a GPU layer.  Any CSS filter on a CHILD of that
// layer forces the browser to rasterize each child separately before compositing
// — defeating the entire point of the GPU layer.  3 row filters × up to 93
// images × every scroll frame = main-thread paint every frame.
//
// The fix is a single rule: apply the filter to the TRACK element itself
// (the same element that already has willChange:transform).  When filter and
// willChange:transform are on the SAME element the browser applies the filter
// as a cheap GPU post-process pass on the already-composited layer — zero
// per-element rasterization overhead.
//
// Additional wins:
//  • Removed `filter: contrast(1.02)` from CollagePoster images (imperceptible
//    at thumbnail scale; every img filter was a separate compositing subtask).
//  • Added `contain: 'paint layout'` to the poster-wall wrapper to prevent
//    layout/paint changes from propagating to ancestors.
//  • Eager images reduced to first row only (idx < 6 already was first-row only
//    but now explicit); everything else is lazy.
//  • Dropped the amber tint overlay (it was redundant with the sepia on the track).
// ─────────────────────────────────────────────────────────────────────
import { memo, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { REEL_ITEMS } from '../../constants';
import { useScrollReel } from '../../hooks';
import { SprocketStrip } from '../primitives';
import { API } from '../../constants';

// ── Row configuration ──────────────────────────────────────────────
const ROW_CONFIGS = [
  { height: 234, count: 24 },
  { height: 180, count: 31 },
  { height: 150, count: 38 },
] as const;

// Single shared badge params string — stable module-level reference
const BADGE_PARAMS = `r=imdb&source=tmdb&blur=6&alpha=0.36&rad=8&imdb_x=8&imdb_y=10`;

function makeRow(count: number, offset: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...REEL_ITEMS[(i + offset) % REEL_ITEMS.length],
    _slot: i,
  }));
}

const ROWS = [
  makeRow(ROW_CONFIGS[0].count, 0),
  makeRow(ROW_CONFIGS[1].count, 8),
  makeRow(ROW_CONFIGS[2].count, 15),
];

// ── Module-level stable style for poster containers ────────────────
// Defined here so they're not recreated inside render.
const POSTER_ERR_STYLE: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  opacity: 0.18,
};

// ── Individual poster cell ─────────────────────────────────────────
const CollagePoster = memo<{
  id: string;
  type: 'movie' | 'tv';
  title: string;
  width: number;
  height: number;
  eager?: boolean;
}>(({ id, type, title, width, height, eager = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr]       = useState(false);
  const onLoad  = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => setErr(true), []);

  const src = `${API}/${type}/${id}.png?${BADGE_PARAMS}`;

  return (
    <div
      style={{
        width, height,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: '#0d0c0a',
        borderRight: '1px solid rgba(0,0,0,0.7)',
        // contain prevents layout/paint from escaping this cell
        contain: 'paint layout',
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
        <div style={POSTER_ERR_STYLE}>
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
          // ↑ NO filter here. Contrast(1.02) was imperceptible and
          //   created 93 separate compositing subtasks per frame.
        }}
      />
    </div>
  );
});
CollagePoster.displayName = 'CollagePoster';

// ── Desktop Reel ──────────────────────────────────────────────────
const DesktopReel = memo(() => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const trackRef        = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const track     = trackRef.current;
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
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
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
        {/* ── Header ── */}
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
              style={{ fontSize: 8, color: 'var(--film-silver)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}
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

        {/* ── Top sprocket ── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* ── Poster wall ── */}
        <div
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center',
            // contain here prevents paint from the poster wall from
            // reaching the rest of the page on every scroll frame.
            contain: 'paint layout',
          }}
        >
          {/* Left feather */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 140, zIndex: 2, pointerEvents: 'none',
              background: 'linear-gradient(to right, var(--film-dark) 0%, rgba(14,13,11,0.88) 60%, transparent 100%)',
            }}
          />
          {/* Right feather */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: 200, zIndex: 2, pointerEvents: 'none',
              background: 'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)',
            }}
          />

          {/* ── THE FIX: filter on the track itself ───────────────────
              willChange:transform promotes the track to a GPU layer.
              When filter is on the SAME element as willChange:transform,
              the GPU applies the filter as a single post-process pass —
              cheap regardless of how many images are inside.

              OLD (broken): filter on 3 row divs INSIDE the track
                → browser rasterises each child separately per frame

              NEW (fixed): filter on the track element itself
                → one GPU pass on the already-composited layer
          ─────────────────────────────────────────────────────────── */}
          <div
            ref={trackRef}
            style={{
              display: 'flex', flexDirection: 'column',
              willChange: 'transform', gap: 0,
              // Single filter here — GPU post-process on the composited layer
              filter: 'sepia(0.18) saturate(0.72) brightness(0.9)',
            }}
          >
            {ROWS.map((row, rowIdx) => {
              const { height, count } = ROW_CONFIGS[rowIdx];
              const width = Math.round((height * 2) / 3);
              return (
                <div
                  key={rowIdx}
                  style={{
                    display: 'flex', flexDirection: 'row', gap: 0,
                    height, overflow: 'hidden',
                    borderBottom: rowIdx < ROWS.length - 1 ? '2px solid rgba(0,0,0,0.8)' : 'none',
                    // ↑ NO filter here. Filter moved to parent track element.
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
                      // Only first row's first 6 are eager; everything else lazy
                      eager={rowIdx === 0 && idx < 6}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom sprocket ── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderTop: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* ── Progress bar ── */}
        <div
          style={{
            flexShrink: 0, padding: '7px 48px',
            borderTop: '1px solid rgba(196,124,46,0.06)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <span
            className="mono-font"
            style={{ fontSize: 7, color: 'rgba(122,117,110,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0 }}
          >
            Reel
          </span>
          <div
            style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}
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