// src/components/dashboard/FilmReelSection/DesktopReel.tsx
import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { REEL_ITEMS } from '@/lib/dashboard/constants';
import { useScrollReel } from '@/lib/dashboard/hooks/index';
import { SprocketStrip } from '../primitives';
import { API } from '@/lib/dashboard/constants';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { generateMasonryLayout } from '@/lib/masonryLayout';
import { usePausedWhenOffscreen } from '@/lib/hooks/usePausedWhenOffscreen';

const BADGE_PARAMS = `r=imdb&source=tmdb&blur=6&alpha=0.36&rad=8&imdb_x=8&imdb_y=10`;
const COL_WIDTH_CAP = 280; // px — max column width per spec

const ERR_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.18,
};

const CollagePoster = memo<{
  id: string;
  type: 'movie' | 'tv';
  title: string;
  width: number;
  height: number;
  eager?: boolean;
}>(({ id, type, title, width, height, eager = false }) => {
  const src = `${API}/${type}/${id}.webp?${BADGE_PARAMS}`;
  return (
    <ProgressiveImage
      src={src}
      alt={`${title} poster with rating overlays`}
      containerStyle={{
        width,
        height,
        flexShrink: 0,
        background: '#0d0c0a',
        borderRight: '1px solid rgba(0,0,0,0.7)',
      }}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : 'auto'}
      decoding="async"
      fallback={
        <div style={ERR_STYLE}>
          <span style={{ fontSize: 20 }}>🎞</span>
        </div>
      }
    />
  );
});
CollagePoster.displayName = 'CollagePoster';

const DesktopReel = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Offscreen pause — stop scroll calc when not visible
  const { ref: visRef, isVisible } = usePausedWhenOffscreen({ rootMargin: '200px' });

  // ── Masonry layout generation ──────────────────────────────────────────────
  // Recalculate when viewport height changes (debounced 120ms).
  // stripHeight = viewportHeight - 92px (header 48px + two sprocket strips ~44px)
  const [stripHeight, setStripHeight] = useState(() =>
    typeof window !== 'undefined' ? Math.max(300, window.innerHeight - 92) : 540
  );

  const recalcHeight = useCallback(() => {
    const h = Math.max(300, window.innerHeight - 92);
    setStripHeight(h);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(recalcHeight, 120);
    };
    window.addEventListener('resize', debounced, { passive: true });
    return () => {
      window.removeEventListener('resize', debounced);
      if (timer) clearTimeout(timer);
    };
  }, [recalcHeight]);

  // deterministic masonry columns (seed = 42 for stability)
  const columns = generateMasonryLayout({
    items: REEL_ITEMS,
    containerHeight: stripHeight,
    colWidthCap: COL_WIDTH_CAP,
    seed: 42,
  });

  // ── Sticky scroll height ───────────────────────────────────────────────────
  useEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;
      const tw = track.scrollWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (tw <= vw) return;
      requestAnimationFrame(() => {
        container.style.height = `${tw - vw + vh}px`;
      });
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
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', recalc);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [columns]); // re-run when column layout changes

  useScrollReel(containerRef, trackRef, progressFillRef);

  const totalFrames = columns.reduce((acc, col) => acc + col.slots.length, 0);

  return (
    <div
      ref={(el) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (visRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      style={{ position: 'relative' }}
    >
      <div
        ref={sectionRef}
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
        {/* Header bar */}
        <div
          style={{
            flexShrink: 0,
            padding: 'clamp(10px, 1.5vh, 14px) clamp(16px, 3vw, 48px) clamp(8px, 1.2vh, 12px)',
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
                fontSize: 'clamp(14px, 1.5vw, 20px)',
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
            style={{ fontSize: 8, color: 'var(--film-text-ghost)', letterSpacing: '0.12em' }}
          >
            {REEL_ITEMS.length} titles · {columns.length} tracks
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

        {/* Masonry film strip */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Left fade */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 140, zIndex: 2,
              pointerEvents: 'none',
              background: 'linear-gradient(to right, var(--film-dark) 0%, rgba(14,13,11,0.88) 60%, transparent 100%)',
            }}
          />
          {/* Right fade */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, zIndex: 2,
              pointerEvents: 'none',
              background: 'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)',
            }}
          />

          <div style={{ filter: 'sepia(0.18) saturate(0.72) brightness(0.9)' }}>
            <div
              ref={trackRef}
              style={{ display: 'flex', flexDirection: 'column', willChange: 'transform', gap: 0 }}
            >
              {columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 0,
                    height: col.height,
                    overflow: 'hidden',
                    borderBottom: colIdx < columns.length - 1 ? '2px solid rgba(0,0,0,0.8)' : 'none',
                  }}
                >
                  {col.slots.map((slot, slotIdx) => (
                    <CollagePoster
                      key={`c${colIdx}-${slot.id}-${slotIdx}`}
                      id={slot.id}
                      type={slot.type}
                      title={slot.title}
                      width={slot.width}
                      height={col.height}
                      eager={colIdx === 0 && slotIdx < 6}
                    />
                  ))}
                </div>
              ))}
            </div>
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

        {/* Progress footer */}
        <div
          style={{
            flexShrink: 0,
            padding: 'clamp(4px,0.8vh,7px) clamp(16px,3vw,48px)',
            borderTop: '1px solid rgba(196,124,46,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            className="mono-font"
            style={{ fontSize: 7, color: 'var(--film-text-ghost)', letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0 }}
          >
            Reel
          </span>
          <div
            style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}
          >
            <div
              ref={progressFillRef}
              style={{ height: '100%', width: '0%', borderRadius: 99, background: 'linear-gradient(90deg, var(--film-amber), #D4A245)', transition: 'none' }}
            />
          </div>
          <span
            className="mono-font"
            style={{ fontSize: 7, color: 'var(--film-text-ghost)', flexShrink: 0, letterSpacing: '0.1em' }}
          >
            {totalFrames} frames
          </span>
        </div>
      </div>
    </div>
  );
});

DesktopReel.displayName = 'DesktopReel';
export default DesktopReel;
