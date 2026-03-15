// src/pages/dashboard/components/PosterFrame.tsx
import { memo, useState, useCallback } from 'react';
import { ReelItem, API } from '../constants';

interface PosterFrameProps {
  item: ReelItem;
  index: number;
  totalCount: number;
}

// Animate variations - irregular to look hand-crafted
const FLOAT_VARIANTS: Array<{ anim: string; dur: number; delay: number; rotate: number }> = [
  { anim: 'float-a', dur: 4.2, delay: 0.0, rotate: -1.2 },
  { anim: 'float-b', dur: 3.8, delay: 0.5, rotate: 0.8 },
  { anim: 'float-c', dur: 5.1, delay: 0.2, rotate: -0.4 },
  { anim: 'float-a', dur: 4.6, delay: 0.9, rotate: 1.1 },
  { anim: 'float-b', dur: 3.5, delay: 0.3, rotate: -0.7 },
  { anim: 'float-c', dur: 4.9, delay: 0.7, rotate: 0.3 },
];

// Poster frame heights vary for visual rhythm - not all the same height
const HEIGHT_VARIANCE: Record<number, number> = {
  0: 370,
  1: 350,
  2: 390,
  3: 360,
  4: 380,
  5: 345,
  6: 375,
  7: 355,
  8: 395,
  9: 365,
  10: 372,
  11: 348,
};

const PosterFrame = memo<PosterFrameProps>(({ item, index, totalCount }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const posterUrl = `${API}/${item.type}/${item.id}.svg?source=tmdb`;
  // Fallback: try plain TMDB poster path pattern as a png if svg fails
  const fallbackUrl = `https://image.tmdb.org/t/p/w342/${item.id}.jpg`;

  const onLoad = useCallback(() => setImgLoaded(true), []);
  const onError = useCallback(() => {
    if (!imgError) setImgError(true);
  }, [imgError]);

  const variant = FLOAT_VARIANTS[index % FLOAT_VARIANTS.length];
  const frameH = HEIGHT_VARIANCE[index] ?? 360;
  const frameW = Math.round(frameH * (2 / 3)); // ~2:3 poster aspect

  return (
    <div
      className="film-frame-wrap"
      style={{
        width: frameW,
        flexShrink: 0,
        position: 'relative',
        paddingTop: 28, // space for frame number above
        animationName: variant.anim,
        animationDuration: `${variant.dur + index * 0.18}s`,
        animationDelay: `${variant.delay}s`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
      }}
    >
      {/* Frame counter - film-leader style */}
      <div
        style={{
          position: 'absolute',
          top: 4,
          left: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          className="mono-font"
          style={{
            fontSize: 8,
            color: 'rgba(196,124,46,0.45)',
            letterSpacing: '0.1em',
          }}
        >
          {String(index + 1).padStart(2, '0')}/{String(totalCount).padStart(2, '0')}
        </span>
        <span
          style={{
            width: 18,
            height: 1,
            background: 'rgba(196,124,46,0.2)',
            display: 'inline-block',
          }}
        />
      </div>

      {/* Poster image container */}
      <div
        style={{
          width: frameW,
          height: frameH,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          background: '#151310',
          border: '1.5px solid rgba(255,255,255,0.07)',
          boxShadow: '0 28px 64px rgba(0,0,0,0.72), 0 0 0 1px rgba(196,124,46,0.08)',
        }}
      >
        {/* Skeleton shimmer - shown until image loads */}
        {!imgLoaded && !imgError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(
                110deg,
                #151310 25%,
                #1e1b16 50%,
                #151310 75%
              )`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s linear infinite',
            }}
          />
        )}

        {/* Error fallback */}
        {imgError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 28, opacity: 0.3 }}>🎞</span>
            <span
              className="mono-font"
              style={{ fontSize: 9, color: 'rgba(122,117,110,0.5)', letterSpacing: '0.1em' }}
            >
              NO PRINT
            </span>
          </div>
        )}

        <img
          src={imgError ? fallbackUrl : posterUrl}
          alt={item.title}
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={onLoad}
          onError={onError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Bottom fade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 130,
            background:
              'linear-gradient(to top, rgba(7,7,6,0.97) 0%, rgba(7,7,6,0.3) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Hover detail overlay - revealed by CSS .poster-detail-overlay */}
        <div className="poster-detail-overlay">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(7,7,6,0.55)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div
              className="mono-font"
              style={{
                fontSize: 9,
                color: 'rgba(196,124,46,0.7)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {item.director}
            </div>
            <div
              className="body-font"
              style={{
                fontSize: 11,
                color: 'rgba(240,230,204,0.8)',
                fontStyle: 'italic',
                maxWidth: frameW - 24,
                lineHeight: 1.5,
                padding: '0 12px',
              }}
            >
              "{item.tagline}"
            </div>
          </div>
        </div>

        {/* Metadata strip */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '10px 10px 12px',
          }}
        >
          <div
            className="syne-font"
            style={{
              fontSize: Math.max(10, Math.min(13, frameW / 20)),
              fontWeight: 600,
              color: '#F0E6CC',
              lineHeight: 1.2,
              marginBottom: 7,
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.title}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <span
              className="mono-font"
              style={{
                background: 'rgba(196,124,46,0.22)',
                border: '1px solid rgba(196,124,46,0.48)',
                color: '#D4A245',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '2px 6px',
                borderRadius: 2,
              }}
            >
              IMDb {item.imdb}
            </span>
            <span
              className="mono-font"
              style={{
                background: 'rgba(168,32,24,0.18)',
                border: '1px solid rgba(168,32,24,0.38)',
                color: '#DC4040',
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: '0.1em',
                padding: '2px 6px',
                borderRadius: 2,
              }}
            >
              RT {item.rt}
            </span>
            {item.meta && (
              <span
                className="mono-font"
                style={{
                  background: 'rgba(60,100,200,0.12)',
                  border: '1px solid rgba(60,100,200,0.25)',
                  color: '#8aaaee',
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '2px 6px',
                  borderRadius: 2,
                }}
              >
                M {item.meta}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Film metadata strip below poster */}
      <div
        style={{
          marginTop: 8,
          padding: '7px 4px 2px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          className="syne-font"
          style={{
            fontSize: 10,
            color: 'var(--film-amber)',
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.genre}
        </div>
        <div
          className="mono-font"
          style={{
            fontSize: 9,
            color: 'var(--film-silver)',
            marginTop: 2,
          }}
        >
          {item.year} · {item.type.toUpperCase()}
        </div>
      </div>
    </div>
  );
});

PosterFrame.displayName = 'PosterFrame';
export default PosterFrame;
