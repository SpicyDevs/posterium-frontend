import { memo, type CSSProperties } from 'react';

interface ShowcaseMediaFrameProps {
  src: string;
  alt: string;
  ratio?: '9 / 16' | '16 / 9';
  mobileFrame?: boolean;
}

const DEFAULT_DESKTOP_RATIO = '16 / 9';
const MOBILE_FRAME_RATIO = '9 / 16';
const MOBILE_IMAGE_OBJECT_POSITION = 'top center';

const baseFrameStyle: CSSProperties = {
  width: '100%',
  background: '#080807',
  overflow: 'hidden',
};

const ShowcaseMediaFrame = memo<ShowcaseMediaFrameProps>(({ src, alt, ratio, mobileFrame = false }) => {
  const finalRatio = mobileFrame ? MOBILE_FRAME_RATIO : (ratio ?? DEFAULT_DESKTOP_RATIO);

  if (!mobileFrame) {
    return (
      <div
        style={{
          ...baseFrameStyle,
          borderRadius: 8,
          border: '1px solid rgba(212,162,69,0.2)',
          aspectRatio: finalRatio,
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
          loading="lazy"
          decoding="async"
        />
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
      <div
        aria-hidden
        style={{
          width: '28%',
          height: 6,
          borderRadius: 999,
          margin: '0 auto 6%',
          background: 'rgba(212,162,69,0.52)',
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
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            objectPosition: MOBILE_IMAGE_OBJECT_POSITION,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
});

ShowcaseMediaFrame.displayName = 'ShowcaseMediaFrame';

export default ShowcaseMediaFrame;
