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

  // Container height formula:
  //   wrapperH = (trackScrollWidth - viewportWidth) + viewportHeight
  // Proof: scrollable = wrapperH - vh = trackW - vw
  //        progress @ end = (trackW - vw) / (trackW - vw) = 1
  //        translateX @ end = -(trackW - vw) ✓  — track reaches its final frame
  //
  // Uses ResizeObserver on the track so the state updates immediately when
  // poster images load (which increases track.scrollWidth). The useScrollReel
  // hook's own ResizeObserver on the container then re-triggers compute
  // with the newly correct scrollable distance — no setTimeout needed.
  const [wrapperH, setWrapperH] = useState(5500);

  useEffect(() => {
    const recalc = () => {
      const track = trackRef.current;
      if (!track) return;
      const h = Math.max(
        window.innerHeight * 1.5,
        track.scrollWidth - window.innerWidth + window.innerHeight,
      );
      setWrapperH(h);
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(recalc);
      if (trackRef.current) ro.observe(trackRef.current);
    }

    recalc();
    window.addEventListener('resize', recalc, { passive: true });
    // Safety re-calc after images settle
    const t = setTimeout(recalc, 1400);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', recalc);
      clearTimeout(t);
    };
  }, []);

  useScrollReel(containerRef, trackRef, progressFillRef);

  const GAP = 48;

  return (
    <div
      ref={containerRef}
      style={{ height: wrapperH, position: 'relative' }}
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
        {/* Section header */}
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

        {/* Scroll content area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Centre axis line */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '12%',
              bottom: '12%',
              width: 1,
              left: '50%',
              background:
                'linear-gradient(to bottom,transparent,rgba(196,124,46,0.07),transparent)',
              pointerEvents: 'none',
            }}
          />

          {/* Film strip track — translateX driven by useScrollReel */}
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
              // Do NOT set initial transform here — useScrollReel sets it via RAF
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

          {/* Edge fades */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 88,
              background: 'linear-gradient(to right,var(--film-dark),transparent)',
              pointerEvents: 'none',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 88,
              background: 'linear-gradient(to left,var(--film-dark),transparent)',
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
              fontSize: 8, color: 'var(--film-silver)',
              letterSpacing: '0.16em', textTransform: 'uppercase', flexShrink: 0,
            }}
          >
            Reel
          </span>
          <div
            style={{
              flex: 1, height: 1, background: 'rgba(255,255,255,0.05)',
              borderRadius: 99, overflow: 'hidden',
            }}
          >
            <div
              ref={progressFillRef}
              style={{
                height: '100%', width: '0%', borderRadius: 99,
                background: 'linear-gradient(90deg,var(--film-amber),#D4A245)',
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
          fontSize: 10, color: 'var(--film-silver)',
          letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 3,
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

    <div
      className="mobile-swipe"
      role="list"
      aria-label="Film posters"
      style={{ paddingLeft: 20, paddingRight: 20 }}
    >
      {REEL_ITEMS.map(item => (
        <div key={item.id} role="listitem" style={{ flexShrink: 0, width: 160 }}>
          <div
            style={{
              width: 160, height: 240, borderRadius: 4, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 14px 36px rgba(0,0,0,0.6)',
              marginBottom: 9, position: 'relative', background: '#151310',
            }}
          >
            {/* Use API with badge params so mobile shows real output */}
            <img
              src={`${API}/${item.type}/${item.id}.svg?r=imdb,rt&source=tmdb&blur=6&alpha=0.42&rad=10&imdb_x=88&imdb_y=14&rt_x=88&rt_y=58`}
              alt={item.title}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div
            className="syne-font"
            style={{
              fontSize: 8, color: 'var(--film-amber)',
              letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {item.genre}
          </div>
          <div className="mono-font" style={{ fontSize: 8, color: 'var(--film-silver)', marginTop: 2 }}>
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

// ── Reel spinner ──────────────────────────────────────────────────
const ReelSpinner = memo(() => (
  <div
    style={{
      width: 26, height: 26, borderRadius: '50%',
      border: '1.5px solid rgba(196,124,46,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'reel-spin 3.5s linear infinite',
    }}
  >
    <div
      style={{
        width: 10, height: 10, borderRadius: '50%',
        border: '1px solid rgba(196,124,46,0.45)', position: 'relative',
      }}
    >
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

// ── Public export ─────────────────────────────────────────────────
const FilmReelSection = memo(() => (
  <section id="reel" aria-label="Film Reel Showcase">
    <div className="desktop-reel-section"><DesktopReel /></div>
    <div className="mobile-reel-section"><MobileReel /></div>
  </section>
));
FilmReelSection.displayName = 'FilmReelSection';

export default FilmReelSection;