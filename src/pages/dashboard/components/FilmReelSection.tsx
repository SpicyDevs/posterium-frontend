// src/pages/dashboard/components/FilmReelSection.tsx
import { memo, useRef, useEffect, useState } from 'react';
import { Film } from 'lucide-react';
import { REEL_ITEMS, API } from '../constants';
import { useScrollReel } from '../hooks';
import { SprocketStrip } from './primitives';
import PosterFrame from './PosterFrame';

// ── Desktop Reel ──────────────────────────────────────────────────
const DesktopReel = memo(() => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const trackRef        = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  useScrollReel(containerRef, trackRef, progressFillRef);

  // Track width estimate: each frame is ~(frameW + gap). Heights vary so we
  // use an average. Bug fix: original hardcoded 288px per frame regardless of
  // actual widths, causing the container to either be too short (reel cuts off
  // before reaching the last poster) or too long (scroll dead zone at end).
  // We compute a reasonable estimate up front; the actual geometry is handled
  // by the hook via live DOM reads.
  const AVG_FRAME_W = 240; // approximate average across HEIGHT_VARIANCE ratios
  const GAP         = 48;
  const PAD         = 160; // paddingLeft + paddingRight on track
  const TRACK_EST   = REEL_ITEMS.length * (AVG_FRAME_W + GAP) + PAD;

  // Extra vertical scroll space. A conservative formula: track width + 30% of
  // viewport height to ensure the last poster is fully reachable.
  // Bug: original used TRACK_W as EXTRA_H directly, ignoring viewport width,
  // meaning on wide screens there was a large dead-scroll zone at the bottom.
  const [extraH, setExtraH] = useState(TRACK_EST);

  useEffect(() => {
    const recalc = () => {
      const track = trackRef.current;
      if (!track) return;
      const needed = Math.max(0, track.scrollWidth - window.innerWidth);
      setExtraH(needed + 80); // small buffer
    };

    // Recalculate once images have loaded and layout is stable
    const t = setTimeout(recalc, 600);
    window.addEventListener('resize', recalc, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', recalc);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: `calc(100vh + ${extraH}px)`, position: 'relative' }}
    >
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
        {/* Section header bar */}
        <div
          style={{
            flexShrink: 0,
            padding: '18px 56px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(196,124,46,0.09)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1.5px solid rgba(196,124,46,0.38)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Film size={15} color="var(--film-amber)" />
            </div>
            <div>
              <div
                className="poster-font"
                style={{
                  fontSize: 26,
                  color: 'var(--film-cream)',
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                }}
              >
                THE REEL
              </div>
              <div
                className="syne-font"
                style={{
                  fontSize: 9,
                  color: 'var(--film-silver)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Scroll to advance the film
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              className="syne-font"
              style={{
                fontSize: 9,
                color: 'var(--film-silver)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {REEL_ITEMS.length}&nbsp;titles
            </span>
            <ReelSpinner />
          </div>
        </div>

        {/* Top sprocket */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.018)',
            borderBottom: '1px solid rgba(255,255,255,0.055)',
          }}
        >
          <SprocketStrip count={44} />
        </div>

        {/* Scrolling content area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Faint centre axis */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '12%',
              bottom: '12%',
              width: 1,
              left: '50%',
              background:
                'linear-gradient(to bottom, transparent, rgba(196,124,46,0.07), transparent)',
              pointerEvents: 'none',
            }}
          />

          {/* The film strip track */}
          <div
            ref={trackRef}
            style={{
              display: 'flex',
              gap: GAP,
              paddingLeft: 80,
              paddingRight: 80,
              willChange: 'transform',
              alignItems: 'flex-end',
              paddingBottom: 36,
            }}
          >
            {REEL_ITEMS.map((item, i) => (
              <PosterFrame
                key={item.id}
                item={item}
                index={i}
                totalCount={REEL_ITEMS.length}
              />
            ))}
          </div>

          {/* Edge gradient fades */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 88,
              background: 'linear-gradient(to right, var(--film-dark), transparent)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 88,
              background: 'linear-gradient(to left, var(--film-dark), transparent)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Bottom sprocket */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.018)',
            borderTop: '1px solid rgba(255,255,255,0.055)',
          }}
        >
          <SprocketStrip count={44} />
        </div>

        {/* Progress bar */}
        <div
          style={{
            flexShrink: 0,
            padding: '7px 56px',
            borderTop: '1px solid rgba(196,124,46,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            className="syne-font"
            style={{
              fontSize: 8,
              color: 'var(--film-silver)',
              letterSpacing: '0.16em',
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
              background: 'rgba(255,255,255,0.05)',
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
                // no transition here — updated every RAF frame, transition would lag
              }}
            />
          </div>
          <span
            className="mono-font"
            style={{ fontSize: 8, color: 'rgba(122,117,110,0.4)', flexShrink: 0 }}
          >
            {REEL_ITEMS.length}fr
          </span>
        </div>
      </div>
    </div>
  );
});
DesktopReel.displayName = 'DesktopReel';

// ── Mobile swipe reel ─────────────────────────────────────────────
const MobileReel = memo(() => (
  <div style={{ background: 'var(--film-dark)' }}>
    <div style={{ padding: '36px 22px 14px' }}>
      <div
        className="poster-font"
        style={{ fontSize: 30, color: 'var(--film-cream)', letterSpacing: '0.06em' }}
      >
        THE REEL
      </div>
      <div
        className="syne-font"
        style={{
          fontSize: 10,
          color: 'var(--film-silver)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginTop: 3,
        }}
      >
        Swipe to browse
      </div>
    </div>

    <div
      style={{
        background: 'rgba(255,255,255,0.018)',
        borderTop: '1px solid rgba(255,255,255,0.055)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      <SprocketStrip count={22} />
    </div>

    {/* Swipeable strip */}
    <div
      className="mobile-swipe"
      role="list"
      aria-label="Film posters"
      style={{ paddingLeft: 20, paddingRight: 20 }}
    >
      {REEL_ITEMS.map(item => (
        <div
          key={item.id}
          role="listitem"
          style={{ flexShrink: 0, width: 160 }}
        >
          <div
            style={{
              width: 160,
              height: 240,
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 14px 36px rgba(0,0,0,0.6)',
              marginBottom: 9,
              position: 'relative',
              background: '#151310',
            }}
          >
            <img
              src={`${API}/${item.type}/${item.id}.svg?source=tmdb`}
              alt={item.title}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 86,
                background:
                  'linear-gradient(to top, rgba(7,7,6,0.96), transparent)',
                padding: '8px 8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <div
                className="syne-font"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#F0E6CC',
                  lineHeight: 1.2,
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.title}
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                <span
                  className="mono-font"
                  style={{
                    background: 'rgba(196,124,46,0.22)',
                    border: '1px solid rgba(196,124,46,0.45)',
                    color: '#D4A245',
                    fontSize: 7,
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 2,
                  }}
                >
                  {item.imdb}
                </span>
                <span
                  className="mono-font"
                  style={{
                    background: 'rgba(168,32,24,0.18)',
                    border: '1px solid rgba(168,32,24,0.36)',
                    color: '#DC4040',
                    fontSize: 7,
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 2,
                  }}
                >
                  {item.rt}
                </span>
              </div>
            </div>
          </div>
          <div
            className="syne-font"
            style={{
              fontSize: 8,
              color: 'var(--film-amber)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.genre}
          </div>
          <div
            className="mono-font"
            style={{ fontSize: 8, color: 'var(--film-silver)', marginTop: 2 }}
          >
            {item.year}
          </div>
        </div>
      ))}
    </div>

    <div
      style={{
        background: 'rgba(255,255,255,0.018)',
        borderTop: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      <SprocketStrip count={22} />
    </div>
  </div>
));
MobileReel.displayName = 'MobileReel';

// ── Animated reel spinner icon ────────────────────────────────────
const ReelSpinner = memo(() => (
  <div
    style={{
      width: 26,
      height: 26,
      borderRadius: '50%',
      border: '1.5px solid rgba(196,124,46,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'reel-spin 3.5s linear infinite',
    }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        border: '1px solid rgba(196,124,46,0.45)',
        position: 'relative',
      }}
    >
      {[0, 120, 240].map(deg => (
        <div
          key={deg}
          style={{
            position: 'absolute',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'var(--film-amber)',
            top: '50%',
            left: '50%',
            transform: `translateX(-50%) translateY(-50%) rotate(${deg}deg) translateY(-4px)`,
          }}
        />
      ))}
    </div>
  </div>
));
ReelSpinner.displayName = 'ReelSpinner';

// ── Public export: wraps both with CSS show/hide ──────────────────
const FilmReelSection = memo(() => (
  <section id="reel" aria-label="Film Reel Showcase">
    <div className="desktop-reel-section">
      <DesktopReel />
    </div>
    <div className="mobile-reel-section">
      <MobileReel />
    </div>
  </section>
));
FilmReelSection.displayName = 'FilmReelSection';

export default FilmReelSection;