// components/FilmReelSection/MobileReel.tsx
// Mobile horizontal swipe reel.
// Key fix: the swipe container is self-contained (overflow-x: auto).
// The parent root div must NOT have overflow-x: hidden, or it clips this.
// We wrap the strip in a native div with explicit overflowX to ensure
// no ancestor style leaks in and breaks the touch scroll.
import { memo } from 'react';
import { REEL_ITEMS, API } from '../../constants';
import { SprocketStrip } from '../primitives';

const MobileReel = memo(() => (
  <div style={{ background: 'var(--film-dark)' }}>
    {/* Header */}
    <div style={{ padding: '36px 22px 14px' }}>
      <div className="poster-font" style={{
        fontSize: 30, color: 'var(--film-cream)', letterSpacing: '0.06em',
      }}>
        THE REEL
      </div>
      <div className="syne-font" style={{
        fontSize: 10, color: 'var(--film-silver)',
        letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 3,
      }}>
        Swipe to browse
      </div>
    </div>

    {/* Top sprocket */}
    <div style={{
      background: 'rgba(255,255,255,0.018)',
      borderTop: '1px solid rgba(255,255,255,0.055)',
      borderBottom: '1px solid rgba(255,255,255,0.055)',
    }}>
      <SprocketStrip count={22} />
    </div>

    {/* Swipe strip — isolated scroll container */}
    <div
      role="list"
      aria-label="Film posters — swipe to browse"
      style={{
        // Explicit inline to defeat any ancestor overflow-x: hidden
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        display: 'flex',
        gap: 16,
        padding: '24px 20px 28px',
        touchAction: 'pan-x',
      } as React.CSSProperties}
    >
      {REEL_ITEMS.map(item => (
        <div
          key={item.id}
          role="listitem"
          style={{
            flexShrink: 0,
            width: 156,
            scrollSnapAlign: 'start',
          }}
        >
          {/* Poster */}
          <div style={{
            width: 156, height: 234,
            borderRadius: 4, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 14px 36px rgba(0,0,0,0.6)',
            marginBottom: 8, background: '#151310',
          }}>
            <img
              src={`${API}/${item.type}/${item.id}.svg?r=imdb,rt&source=tmdb&blur=6&alpha=0.42&rad=10&imdb_x=88&imdb_y=14&rt_x=88&rt_y=58`}
              alt={item.title}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Meta */}
          <div className="syne-font" style={{
            fontSize: 8, color: 'var(--film-amber)',
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.genre}
          </div>
          <div className="mono-font" style={{
            fontSize: 8, color: 'var(--film-silver)', marginTop: 2,
          }}>
            {item.year}
          </div>
        </div>
      ))}
    </div>

    {/* Bottom sprocket */}
    <div style={{
      background: 'rgba(255,255,255,0.018)',
      borderTop: '1px solid rgba(255,255,255,0.055)',
    }}>
      <SprocketStrip count={22} />
    </div>
  </div>
));

MobileReel.displayName = 'MobileReel';
export default MobileReel;