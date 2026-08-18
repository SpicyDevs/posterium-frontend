import { memo, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { ProgressiveImage } from '@/ui/ProgressiveImage';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';
import { DEFAULT_CONFIG } from '@/constants/badges';
import { parseUrlToConfig } from '@/builder/utils/url-parser';
import type { PosterConfig } from '@/types/poster';

interface ExamplePreset {
  id: string;
  title: string;
  description: string;
  query: string;
}

interface CommunityPresetsStepProps {
  presets: ExamplePreset[];
  onSelectPreset: (config: PosterConfig) => void;
}

const DEFAULT_IMDB = 'tt0468569';

const buildPreviewUrl = (query: string): string => {
  const q = query.startsWith('?') ? query.slice(1) : query;
  const params = new URLSearchParams(q);
  params.delete('ext');
  params.delete('extension');
  const clean = params.toString();
  return `${DEFAULT_API_BASE}/poster/${DEFAULT_IMDB}.webp${clean ? `?${clean}` : ''}`;
};

const buildConfigFromQuery = (query: string): PosterConfig => {
  const fullUrl = `${DEFAULT_API_BASE}/poster/${DEFAULT_IMDB}.png?${query.startsWith('?') ? query.slice(1) : query}`;
  return parseUrlToConfig(fullUrl);
};

const CommunityPresetsStep = memo<CommunityPresetsStepProps>(({ presets, onSelectPreset }) => {
  const items = useMemo(
    () =>
      presets.map((preset) => ({
        ...preset,
        previewUrl: buildPreviewUrl(preset.query),
      })),
    [presets]
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <h1
        className="poster-font"
        style={{
          fontSize: 32,
          fontWeight: 400,
          color: 'var(--film-cream)',
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        Community Presets
      </h1>
      <p
        className="body-font"
        style={{
          fontSize: 13,
          color: 'var(--film-text-dim)',
          marginTop: 8,
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        Pick a preset to pre-fill the poster configuration, then jump into the builder.
      </p>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(196,124,46,0.12) transparent',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 10,
          }}
        >
          {/* Start blank card */}
          <button
            type="button"
            onClick={() => onSelectPreset({ ...DEFAULT_CONFIG })}
            style={{
              aspectRatio: '2 / 3',
              borderRadius: 10,
              border: '2px dashed rgba(196,124,46,0.2)',
              background: 'rgba(14,13,11,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              color: 'var(--film-text-ghost)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(196,124,46,0.4)';
              e.currentTarget.style.background = 'rgba(196,124,46,0.06)';
              e.currentTarget.style.color = 'var(--film-amber)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(196,124,46,0.2)';
              e.currentTarget.style.background = 'rgba(14,13,11,0.5)';
              e.currentTarget.style.color = 'var(--film-text-ghost)';
            }}
          >
            <Plus size={24} />
            <span
              className="syne-font"
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}
            >
              Start Blank
            </span>
            <span className="body-font" style={{ fontSize: 9 }}>
              Default config
            </span>
          </button>

          {items.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(buildConfigFromQuery(preset.query))}
              style={{
                aspectRatio: '2 / 3',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid rgba(196,124,46,0.14)',
                background: 'rgba(14,13,11,0.72)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0,
                fontFamily: 'inherit',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(196,124,46,0.35)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(196,124,46,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(196,124,46,0.14)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ProgressiveImage
                src={preset.previewUrl}
                alt={preset.title}
                containerStyle={{ width: '100%', height: '100%' }}
                imageStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallback={
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--film-text-dim)',
                      fontSize: 10,
                    }}
                  >
                    Failed to load
                  </div>
                }
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 8,
                  background: 'linear-gradient(180deg, rgba(7,7,6,0) 40%, rgba(7,7,6,0.85) 100%)',
                }}
              >
                <span
                  className="syne-font"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--film-cream)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {preset.title}
                </span>
                <span
                  className="body-font"
                  style={{
                    fontSize: 8,
                    color: 'var(--film-text-dim)',
                    marginTop: 2,
                    lineHeight: 1.2,
                  }}
                >
                  {preset.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

CommunityPresetsStep.displayName = 'CommunityPresetsStep';
export default CommunityPresetsStep;
