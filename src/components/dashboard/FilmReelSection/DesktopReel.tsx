import { memo, useRef, useEffect } from 'react';
import { REEL_ITEMS } from '@/lib/dashboard/constants';
import { useScrollReel } from '@/lib/dashboard/hooks/index';
import { SprocketStrip } from '../primitives';
import { API } from '@/lib/dashboard/constants';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';

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
      alt={`Textless ${type === 'movie' ? 'movie' : 'TV'} poster art for ${title} with custom rating overlays`}
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
  useEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      // READ phase
      const tw = track.scrollWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (tw <= vw) return;

      // WRITE phase batched
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
            style={{ fontSize: 8, color: 'var(--film-text-ghost)', letterSpacing: '0.12em' }}
          >
            {REEL_ITEMS.length} titles · 3 tracks
          </span>
        </div>

        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 140,
              zIndex: 2,
              pointerEvents: 'none',
              background:
                'linear-gradient(to right, var(--film-dark) 0%, rgba(14,13,11,0.88) 60%, transparent 100%)',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 200,
              zIndex: 2,
              pointerEvents: 'none',
              background:
                'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)',
            }}
          />

          <div style={{ filter: 'sepia(0.18) saturate(0.72) brightness(0.9)' }}>
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
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 0,
                      height,
                      overflow: 'hidden',
                      borderBottom: rowIdx < ROWS.length - 1 ? '2px solid rgba(0,0,0,0.8)' : 'none',
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
        </div>

        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderTop: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

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
              color: 'var(--film-text-ghost)',
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
                background: 'linear-gradient(90deg, var(--film-amber), #D4A245)',
                transition: 'none',
              }}
            />
          </div>
          <span
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'var(--film-text-ghost)',
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
