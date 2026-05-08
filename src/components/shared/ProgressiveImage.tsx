import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useAnimation } from '@/lib/a11y/useAnimation';

interface ProgressiveImageProps {
  src?: string;
  alt: string;
  containerStyle?: CSSProperties;
  imageStyle?: CSSProperties;
  skeletonStyle?: CSSProperties;
  fallback?: ReactNode;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
}

const DEFAULT_SKELETON_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(110deg,#111009 25%,#1a1712 50%,#111009 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.8s linear infinite',
};

export const ProgressiveImage = memo<ProgressiveImageProps>(
  ({
    src,
    alt,
    containerStyle,
    imageStyle,
    skeletonStyle,
    fallback,
    loading = 'lazy',
    decoding = 'async',
    fetchPriority = 'auto',
    onLoad,
    onError,
  }) => {
    const { shouldAnimate } = useAnimation();
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleLoad = useCallback(() => {
      setLoaded(true);
      setErrored(false);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setErrored(true);
      onError?.();
    }, [onError]);

    useEffect(() => {
      setLoaded(false);
      setErrored(false);
    }, [src]);

    useEffect(() => {
      const img = imgRef.current;
      if (!img?.complete) return;
      if (img.naturalWidth > 0) handleLoad();
      else handleError();
    }, [handleError, handleLoad, src]);

    return (
      <div style={{ position: 'relative', overflow: 'hidden', ...containerStyle }}>
        {!loaded && !errored && src && (
          <div
            style={
              skeletonStyle
                ? {
                    ...DEFAULT_SKELETON_STYLE,
                    ...(shouldAnimate ? {} : { animation: 'none', background: '#151310' }),
                    ...skeletonStyle,
                  }
                : {
                    ...DEFAULT_SKELETON_STYLE,
                    ...(shouldAnimate ? {} : { animation: 'none', background: '#151310' }),
                  }
            }
          />
        )}
        {errored && fallback}
        {src && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading={loading}
            decoding={decoding}
            fetchPriority={fetchPriority}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: loaded ? 1 : 0,
              transition: shouldAnimate ? 'opacity 0.35s ease' : 'none',
              ...imageStyle,
            }}
          />
        )}
      </div>
    );
  }
);

ProgressiveImage.displayName = 'ProgressiveImage';
