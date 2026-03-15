// src/dashboard/components/FilmReelSection/MobileReel.tsx
// Mobile horizontal-swipe reel with IMDb badges.
// Sepia+amber filter applied for unified film aesthetic.
import { memo } from 'react';
import { REEL_ITEMS, API } from '../../constants';
import { SprocketStrip } from '../primitives';

const MobileReel = memo(() => (
  <div style={{ background: 'var(--film-dark)', overflow: 'hidden' }}>
    {/* Header */}
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

    {/* Swipe strip */}
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
          // Muted sepia/amber tint matching desktop reel
          filter: 'sepia(0.18) saturate(0.72) brightness(0.9)',
        } as React.CSSProperties
      }
    >
      {REEL_ITEMS.map((item, idx) => (
        <div key={item.id} role="listitem" style={{ flexShrink: 0, width: 148 }}>
          {/* Frame counter */}
          <div
            className="mono-font"
            style={{
              fontSize: 7, color: 'rgba(196,124,46,0.38)',
              letterSpacing: '0.1em', marginBottom: 5, paddingLeft: 2,
            }}
          >
            {String(idx + 1).padStart(2, '0')}/{String(REEL_ITEMS.length).padStart(2, '0')}
          </div>

          {/* Poster with IMDb badge */}
          <div
            style={{
              width: 148, height: 222,
              borderRadius: 4, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              marginBottom: 8, background: '#151310', position: 'relative',
            }}
          >
            <img
              src={`${API}/${item.type}/${item.id}.svg?r=imdb&source=tmdb&blur=6&alpha=0.36&rad=8&imdb_x=8&imdb_y=10`}
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
              fontSize: 8, color: 'var(--film-amber)', letterSpacing: '0.1em',
              textTransform: 'uppercase', fontWeight: 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2,
            }}
          >
            {item.genre}
          </div>
          <div className="mono-font" style={{ fontSize: 8, color: 'var(--film-silver)' }}>
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