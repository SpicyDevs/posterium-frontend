// src/dashboard/components/FilmReelSection/DesktopReel.tsx
// ─────────────────────────────────────────────────────────────────────
// REEL PERFORMANCE — DEFINITIVE FIX
// ──────────────────────────────────
// The jank comes from how browsers composite CSS filter + transform.
//
// WRONG (two previous attempts):
//   Attempt 1: filter on 3 row divs inside the track
//     → 3 × filter pass per frame on composited children = expensive
//   Attempt 2: filter + willChange:transform on the SAME element
//     → Chrome must apply the filter BEFORE compositing, which means
//       it has to rasterize the entire track content first.
//       On complex content (93 images) this is a main-thread paint.
//
// CORRECT (this version):
//   OUTER div: filter only — no willChange, no transform.
//   INNER div (trackRef): willChange:transform + transform only — no filter.
//
//   Why this works:
//   1. trackRef is promoted to a GPU compositor layer (willChange:transform).
//      Its content (93 images) is rasterized ONCE and uploaded to VRAM.
//   2. On each scroll frame, the JS writes translate3d to trackRef.
//      The GPU just multiplies the transform matrix — NO rasterization.
//   3. The outer div with filter receives the already-composited GPU texture
//      of the track layer and applies the sepia/saturate/brightness as a
//      GPU shader post-process — also no rasterization.
//
//   The outer div itself does NOT have willChange, so it does not create
//   its own compositor layer.  It uses the normal compositing path, which
//   means its filter is applied during the final "flatten" step — one cheap
//   GPU texture operation per frame.
//
// Additional improvements:
//  • contain: 'paint layout' removed from individual poster cells
//    (was creating 93 stacking contexts and actually slowing compositing)
//  • overflow: hidden on cells is sufficient paint containment
//  • Amber tint overlay removed (redundant with sepia on outer wrapper)
// ─────────────────────────────────────────────────────────────────────
import { memo, useRef, useLayoutEffect, useEffect, useState, useCallback } from 'react';
import { REEL_ITEMS } from '../../constants';
import { useScrollReel } from '../../hooks';
import { SprocketStrip } from '../primitives';
import { API } from '../../constants';

const ROW_CONFIGS = [
  { height: 234, count: 24 },
  { height: 180, count: 31 },
  { height: 150, count: 38 },
] as const;

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

// Module-level stable style object
const ERR_STYLE: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  opacity: 0.18,
};

// ── CollagePoster ─────────────────────────────────────────────────
const CollagePoster = memo<{
  id: string; type: 'movie' | 'tv'; title: string;
  width: number; height: number; eager?: boolean;
}>(({ id, type, title, width, height, eager = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr]       = useState(false);
  const imgRef  = useRef<HTMLImageElement>(null);
  const onLoad  = useCallback(() => setLoaded(true), []);
  const onError = useCallback(() => setErr(true), []);

  // Handle already-cached images: onLoad won't fire if the browser
  // completed loading before React attached the handler (e.g. on page reload).
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth > 0) onLoad();
      else onError();
    }
  }, [onLoad, onError]);

  const src = `${API}/${type}/${id}.webp?${BADGE_PARAMS}`;

  return (
    <div
      style={{
        width, height, flexShrink: 0, position: 'relative',
        overflow: 'hidden',             // paint containment without stacking context overhead
        background: '#0d0c0a',
        borderRight: '1px solid rgba(0,0,0,0.7)',
        // NO contain: paint layout — that creates 93 stacking contexts and
        // prevents the browser from batching compositing efficiently.
      }}
    >
      {!loaded && !err && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(110deg,#111009 25%,#1a1712 50%,#111009 75%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.8s linear infinite',
        }} />
      )}
      {err && <div style={ERR_STYLE}><span style={{ fontSize: 20 }}>🎞</span></div>}
      <img
        ref={imgRef}
        src={src} alt={title}
        loading={eager ? 'eager' : 'lazy'} decoding="async"
        onLoad={onLoad} onError={onError}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          opacity: loaded ? 1 : 0, transition: 'opacity 0.35s ease',
          // NO individual filter here — sepia is applied by the outer wrapper
          // at GPU post-process time, not per-image.
        }}
      />
    </div>
  );
});
CollagePoster.displayName = 'CollagePoster';

// ── DesktopReel ───────────────────────────────────────────────────
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
      <div style={{
        position: 'sticky', top: 0, height: '100dvh', overflow: 'hidden',
        background: 'var(--film-dark)', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '14px 48px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(196,124,46,0.08)' }}>
          <div>
            <div className="poster-font" style={{ fontSize: 20, color: 'var(--film-cream)', letterSpacing: '0.08em', lineHeight: 1 }}>THE REEL</div>
            <div className="syne-font" style={{ fontSize: 8, color: 'var(--film-silver)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}>Scroll to advance</div>
          </div>
          <span className="mono-font" style={{ fontSize: 8, color: 'var(--film-text-ghost)', letterSpacing: '0.12em' }}>
            {REEL_ITEMS.length} titles · 3 tracks
          </span>
        </div>

        {/* Top sprocket */}
        <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.045)' }}>
          <SprocketStrip count={48} />
        </div>

        {/* Poster wall */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          {/* Left feather */}
          <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 140, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to right, var(--film-dark) 0%, rgba(14,13,11,0.88) 60%, transparent 100%)' }} />
          {/* Right feather */}
          <div aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)' }} />

          {/*
            ── OUTER wrapper: FILTER only — no willChange, no transform ──
            The GPU applies sepia/saturate/brightness as a shader on the
            already-composited texture from the inner layer.  One GPU pass
            per frame regardless of how many images are inside.
          */}
          <div style={{ filter: 'sepia(0.18) saturate(0.72) brightness(0.9)' }}>
            {/*
              ── INNER wrapper (trackRef): willChange:transform only — no filter ──
              Promoted to GPU compositor layer.  93 images rasterized ONCE.
              On each scroll frame: GPU matrix multiply only — no repaint.
            */}
            <div
              ref={trackRef}
              style={{ display: 'flex', flexDirection: 'column', willChange: 'transform', gap: 0 }}
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
                      // NO filter on rows — moved to outer wrapper
                    }}
                  >
                    {row.slice(0, count).map((item, idx) => (
                      <CollagePoster
                        key={`r${rowIdx}-${item.id}-${item._slot}`}
                        id={item.id} type={item.type} title={item.title}
                        width={width} height={height}
                        eager={rowIdx === 0 && idx < 6}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom sprocket */}
        <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.045)' }}>
          <SprocketStrip count={48} />
        </div>

        {/* Progress bar */}
        <div style={{ flexShrink: 0, padding: '7px 48px', borderTop: '1px solid rgba(196,124,46,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono-font" style={{ fontSize: 7, color: 'var(--film-text-ghost)', letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0 }}>Reel</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
            <div ref={progressFillRef} style={{ height: '100%', width: '0%', borderRadius: 99, background: 'linear-gradient(90deg, var(--film-amber), #D4A245)', transition: 'none' }} />
          </div>
          <span className="mono-font" style={{ fontSize: 7, color: 'var(--film-text-ghost)', flexShrink: 0, letterSpacing: '0.1em' }}>
            {ROW_CONFIGS[0].count + ROW_CONFIGS[1].count + ROW_CONFIGS[2].count} frames
          </span>
        </div>
      </div>
    </div>
  );
});

DesktopReel.displayName = 'DesktopReel';
export default DesktopReel;