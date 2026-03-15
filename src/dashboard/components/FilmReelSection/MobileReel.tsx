// components/FilmReelSection/MobileReel.tsx
// FIX: The previous version used overflowX:'auto' which some browsers
// de-optimise when a sibling/ancestor has position:sticky or overflow:hidden.
// This version:
//   1. Uses overflowX:'scroll' (always enables scroll container, no browser guess)
//   2. Removes touchAction:'pan-x' - was preventing natural scroll-direction
//      detection; the browser handles it correctly without the hint when the
//      container is a proper scroll box.
//   3. Removes scrollSnapType to avoid iOS treating snap as "not scrollable yet"
//      on first touch - can be re-added after testing.
//   4. Adds overscrollBehaviorX:'contain' to stop the swipe from leaking into
//      the page vertical scroll when the track is at its start/end.
import { memo } from 'react';
import { REEL_ITEMS, API } from '../../constants';
import { SprocketStrip } from '../primitives';

const MobileReel = memo(() => (
  <div style={{ background: 'var(--film-dark)', overflow: 'hidden' }}>
    {/* Header */}
    <div style={{ padding: '36px 22px 14px' }}>
      <div
        className="poster-font"
        style={{
          fontSize: 30,
          color: 'var(--film-cream)',
          letterSpacing: '0.06em',
        }}
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
        Swipe to browse · {REEL_ITEMS.length} titles
      </div>
    </div>

    {/* Top sprocket */}
    <div
      style={{
        background: 'rgba(255,255,255,0.018)',
        borderTop: '1px solid rgba(255,255,255,0.055)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      <SprocketStrip count={22} />
    </div>

    {/* ── Swipe strip ── */}
    {/*
      KEY: overflow-x:scroll (not auto) creates a scroll container unconditionally.
      Removing touchAction lets the browser handle gesture routing.
      overscrollBehaviorX:contain prevents the bounce from leaking to parent scroll.
    */}
    <div
      role="list"
      aria-label="Film posters - swipe to browse"
      style={
        {
          overflowX: 'scroll',
          overflowY: 'hidden',
          overscrollBehaviorX: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          gap: 14,
          padding: '22px 20px 26px',
          // No touchAction override - browser handles swipe gesture natively
        } as React.CSSProperties
      }
    >
      {REEL_ITEMS.map((item, idx) => (
        <div key={item.id} role="listitem" style={{ flexShrink: 0, width: 148 }}>
          {/* Frame counter */}
          <div
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'rgba(196,124,46,0.38)',
              letterSpacing: '0.1em',
              marginBottom: 5,
              paddingLeft: 2,
            }}
          >
            {String(idx + 1).padStart(2, '0')}/{String(REEL_ITEMS.length).padStart(2, '0')}
          </div>

          {/* Poster */}
          <div
            style={{
              width: 148,
              height: 222,
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              marginBottom: 8,
              background: '#151310',
              position: 'relative',
            }}
          >
            <img
              src={`${API}/${item.type}/${item.id}.svg?r=imdb,rt&source=tmdb&blur=6&alpha=0.42&rad=10&imdb_x=84&imdb_y=14&rt_x=84&rt_y=58`}
              alt={item.title}
              loading={idx < 3 ? 'eager' : 'lazy'}
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Meta */}
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
              marginBottom: 2,
            }}
          >
            {item.genre}
          </div>
          <div
            className="mono-font"
            style={{
              fontSize: 8,
              color: 'var(--film-silver)',
            }}
          >
            {item.year}
          </div>
        </div>
      ))}
    </div>

    {/* Bottom sprocket */}
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
export default MobileReel;
