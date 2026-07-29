import { memo, useMemo } from 'react';
import { Film, ImageOff } from 'lucide-react';
import type { PosterConfig } from '@/types/poster';
import { ProgressiveImage } from '@/ui/ProgressiveImage';
import { FilmCorners } from '@/ui/primitives';
import { generateApiUrl } from '@/builder/utils/url-generator';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';

interface LiveWalkthroughPreviewProps {
  config: PosterConfig;
  compact?: boolean;
}

const LiveWalkthroughPreview = memo<LiveWalkthroughPreviewProps>(({ config, compact }) => {
  const posterUrl = useMemo(() => {
    if (!config.imdbId && !config.tmdbId) return '';
    try {
      return generateApiUrl({ ...config, extension: 'webp' }, DEFAULT_API_BASE);
    } catch {
      return '';
    }
  }, [config]);

  const hasIds = Boolean(config.imdbId || config.tmdbId);

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(196,124,46,0.14)',
        background: 'rgba(14,13,11,0.72)',
        height: compact ? 'auto' : '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--film-text-ghost)',
          padding: '10px 12px 4px',
          fontFamily: 'Syne, sans-serif',
        }}
      >
        Preview
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: compact ? 180 : 0,
          margin: '0 12px 12px',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'rgba(7,7,6,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {posterUrl && hasIds ? (
          <>
            <ProgressiveImage
              src={posterUrl}
              alt="Poster preview"
              containerStyle={{ width: '100%', height: '100%' }}
              imageStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
              fallback={
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    color: 'var(--film-text-ghost)',
                  }}
                >
                  <ImageOff size={24} />
                  <span className="body-font" style={{ fontSize: 10 }}>Poster not found</span>
                </div>
              }
            />
            <FilmCorners />
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--film-text-ghost)',
              padding: 24,
              textAlign: 'center',
            }}
          >
            <Film size={28} />
            <span className="body-font" style={{ fontSize: 10, lineHeight: 1.4 }}>
              Search for a movie or TV show to preview
            </span>
          </div>
        )}
      </div>

      {config.imdbId || config.tmdbId ? (
        <div style={{ padding: '0 12px 12px' }}>
          <div
            className="mono-font"
            style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
          >
            {config.imdbId || config.tmdbId}
          </div>
        </div>
      ) : null}
    </div>
  );
});

LiveWalkthroughPreview.displayName = 'LiveWalkthroughPreview';
export default LiveWalkthroughPreview;
