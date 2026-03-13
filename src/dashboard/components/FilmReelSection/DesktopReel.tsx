// components/FilmReelSection/DesktopReel.tsx
// FIX: Container height managed via direct DOM write (useLayoutEffect),
// not React state — eliminates the 5500→correct-value re-render that caused
// the "black screen after reel" bug.
//
// Proof the math is exact:
//   containerH = trackScrollWidth - vw + vh
//   scrollable = containerH - vh = trackW - vw
//   At entry:  rect.top = 0            → progress = 0 → tx = 0          ✓
//   At exit:   rect.top = -(trackW-vw) → progress = 1 → tx = -(trackW-vw) ✓
//   Container bottom = viewport bottom at exit → no black screen         ✓
import { memo, useRef, useLayoutEffect } from 'react';
import { Film } from 'lucide-react';
import { REEL_ITEMS } from '../../constants';
import { useScrollReel } from '../../hooks';
import { SprocketStrip } from '../primitives';
import PosterFrame from '../PosterFrame';

const GAP = 48;

// Spinner glyph — film-reel optical illusion
const ReelSpinner = memo(() => (
  <div
    style={{
      width: 26, height: 26, borderRadius: '50%',
      border: '1.5px solid rgba(196,124,46,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'reel-spin 3.5s linear infinite',
      flexShrink: 0,
    }}
  >
    <div style={{
      width: 10, height: 10, borderRadius: '50%',
      border: '1px solid rgba(196,124,46,0.45)', position: 'relative',
    }}>
      {[0, 120, 240].map(deg => (
        <div
          key={deg}
          style={{
            position: 'absolute', width: 3, height: 3, borderRadius: '50%',
            background: 'var(--film-amber)', top: '50%', left: '50%',
            transform: `translateX(-50%) translateY(-50%) rotate(${deg}deg) translateY(-4px)`,
          }}
        />
      ))}
    </div>
  </div>
));
ReelSpinner.displayName = 'ReelSpinner';

const DesktopReel = memo(() => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const trackRef        = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  // ── Direct DOM height management ────────────────────────────────
  // useLayoutEffect: runs after DOM mutation, before browser paint.
  // Direct DOM write (no setState) → zero re-render flash, zero black screen.
  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      const track     = trackRef.current;
      if (!container || !track) return;
      const tw = track.scrollWidth;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (tw <= vw) return; // degenerate: track fits — nothing to scroll
      container.style.height = `${tw - vw + vh}px`;
    };

    recalc(); // synchronous before first paint

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(recalc);
      // Observe the track: fires when poster images load and expand scrollWidth
      if (trackRef.current) ro.observe(trackRef.current);
    }

    window.addEventListener('resize', recalc, { passive: true });

    // Belt-and-suspenders passes after async image / font settling
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
    // No height style here — set by useLayoutEffect above
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
        <div style={{
          flexShrink: 0,
          padding: '18px 56px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(196,124,46,0.09)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              border: '1.5px solid rgba(196,124,46,0.38)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Film size={15} color="var(--film-amber)" />
            </div>
            <div>
              <div className="poster-font" style={{
                fontSize: 26, color: 'var(--film-cream)',
                letterSpacing: '0.06em', lineHeight: 1,
              }}>
                THE REEL
              </div>
              <div className="syne-font" style={{
                fontSize: 9, color: 'var(--film-silver)',
                letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2,
              }}>
                Scroll to advance the film
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="syne-font" style={{
              fontSize: 9, color: 'var(--film-silver)',
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>
              {REEL_ITEMS.length}&nbsp;titles
            </span>
            <ReelSpinner />
          </div>
        </div>

        {/* ── Top sprocket ── */}
        <div style={{
          flexShrink: 0,
          background: 'rgba(255,255,255,0.018)',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
        }}>
          <SprocketStrip count={44} />
        </div>

        {/* ── Scrolling content area ── */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center',
        }}>
          {/* Centre axis reference line */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '12%', bottom: '12%',
            width: 1, left: '50%',
            background: 'linear-gradient(to bottom,transparent,rgba(196,124,46,0.07),transparent)',
            pointerEvents: 'none',
          }} />

          {/* Film track — translateX driven by useScrollReel via RAF */}
          <div
            ref={trackRef}
            style={{
              display: 'flex', gap: GAP,
              paddingLeft: 80, paddingRight: 80,
              alignItems: 'flex-end', paddingBottom: 36,
              willChange: 'transform',
            }}
          >
            {REEL_ITEMS.map((item, i) => (
              <PosterFrame key={item.id} item={item} index={i} totalCount={REEL_ITEMS.length} />
            ))}
          </div>

          {/* Edge feathers */}
          <div aria-hidden="true" style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 88,
            background: 'linear-gradient(to right,var(--film-dark),transparent)',
            pointerEvents: 'none',
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 88,
            background: 'linear-gradient(to left,var(--film-dark),transparent)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* ── Bottom sprocket ── */}
        <div style={{
          flexShrink: 0,
          background: 'rgba(255,255,255,0.018)',
          borderTop: '1px solid rgba(255,255,255,0.055)',
        }}>
          <SprocketStrip count={44} />
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          flexShrink: 0,
          padding: '7px 56px',
          borderTop: '1px solid rgba(196,124,46,0.07)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span className="syne-font" style={{
            fontSize: 8, color: 'var(--film-silver)',
            letterSpacing: '0.16em', textTransform: 'uppercase', flexShrink: 0,
          }}>
            Reel
          </span>
          <div style={{
            flex: 1, height: 1, background: 'rgba(255,255,255,0.05)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div
              ref={progressFillRef}
              style={{
                height: '100%', width: '0%', borderRadius: 99,
                background: 'linear-gradient(90deg,var(--film-amber),#D4A245)',
              }}
            />
          </div>
          <span className="mono-font" style={{
            fontSize: 8, color: 'rgba(122,117,110,0.4)', flexShrink: 0,
          }}>
            {REEL_ITEMS.length}fr
          </span>
        </div>
      </div>
    </div>
  );
});

DesktopReel.displayName = 'DesktopReel';
export default DesktopReel;