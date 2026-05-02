// src/components/installation/ShowcaseMediaFrame.tsx
import { memo, useState, type CSSProperties } from 'react';
import { SkeletonCard } from '@/components/shared/Skeleton';

interface ShowcaseMediaFrameProps {
  src: string;
  alt: string;
  ratio?: '9 / 16' | '16 / 9';
  mobileFrame?: boolean;
  /** Eager-load the first visible image to avoid LCP penalty */
  eager?: boolean;
}

const DEFAULT_DESKTOP_RATIO = '16 / 9';
const MOBILE_FRAME_RATIO = '9 / 16';
const MOBILE_IMAGE_OBJECT_POSITION = 'top center';

const baseFrameStyle: CSSProperties = {
  width: '100%',
  background: '#080807',
  overflow: 'hidden',
};

const SHIMMER_STYLE: CSSProperties = {
  background: 'linear-gradient(110deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.6s linear infinite',
  position: 'absolute',
  inset: 0,
};

const ShowcaseMediaFrame = memo<ShowcaseMediaFrameProps>(
  ({ src, alt, ratio, mobileFrame = false, eager = false }) => {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const finalRatio = mobileFrame ? MOBILE_FRAME_RATIO : (ratio ?? DEFAULT_DESKTOP_RATIO);

    const imgStyle: CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'block',
      objectFit: 'cover',
      objectPosition: mobileFrame ? MOBILE_IMAGE_OBJECT_POSITION : 'center',
      opacity: loaded ? 1 : 0,
      transition: 'opacity 0.3s ease',
    };

    const imgEl = (
      <>
        {/* Skeleton shimmer while loading */}
        {!loaded && !failed && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, ...SHIMMER_STYLE }} />
        )}
        {/* Failed fallback */}
        {failed && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
              background: '#0d0c0a', color: 'rgba(196,124,46,0.4)', fontSize: 28,
            }}
          >
            🎞
          </div>
        )}
        <img
          src={src}
          alt={alt}
          style={imgStyle}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </>
    );

    if (!mobileFrame) {
      return (
        <div
          style={{
            ...baseFrameStyle,
            position: 'relative',
            borderRadius: 8,
            border: '1px solid rgba(212,162,69,0.2)',
            aspectRatio: finalRatio,
          }}
        >
          {imgEl}
        </div>
      );
    }

    return (
      <div
        style={{
          ...baseFrameStyle,
          borderRadius: 24,
          border: '2px solid rgba(212,162,69,0.5)',
          padding: '8% 4% 6%',
          aspectRatio: finalRatio,
          boxShadow: 'inset 0 0 0 1px rgba(212,162,69,0.14)',
        }}
      >
        {/* Phone notch */}
        <div
          aria-hidden
          style={{
            width: '28%', height: 6, borderRadius: 999,
            margin: '0 auto 6%', background: 'rgba(212,162,69,0.52)',
          }}
        />
        <div
          style={{
            width: '100%',
            aspectRatio: finalRatio,
            borderRadius: 16,
            border: '1px solid rgba(212,162,69,0.24)',
            overflow: 'hidden',
            background: '#11100d',
            position: 'relative',
          }}
        >
          {imgEl}
        </div>
      </div>
    );
  }
);

ShowcaseMediaFrame.displayName = 'ShowcaseMediaFrame';
export default ShowcaseMediaFrame;
