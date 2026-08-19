import { memo, useMemo, useRef, useState, useEffect } from 'react';
import { Film, ImageOff } from 'lucide-react';
import type { PosterConfig, RatingType } from '@/types/poster';
import { ProgressiveImage } from '@/ui/ProgressiveImage';
import { FilmCorners } from '@/ui/primitives';
import { EditorProvider } from '@/builder/EditorContext';
import { generateCleanArtworkUrl, generateLogoUrl } from '@/builder/utils/url-generator';
import { calculateAutoPosition } from '@/builder/utils/positioning';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/builder/types';
import DraggableBadge from '@/builder/components/DraggableBadge';
import DraggableTitle from '@/builder/components/DraggableTitle';
import DraggableLogo from '@/builder/components/DraggableLogo';

interface LiveWalkthroughPreviewProps {
  config: PosterConfig;
  compact?: boolean;
}

const NOOP = () => {};

/**
 * Client-side poster rendering for the walkthrough: the poster is composited
 * in the browser from the clean artwork URL + the same badge/title/logo
 * components the builder canvas uses, so config changes reflect instantly
 * without a backend render round-trip.
 */
const PreviewBody = memo<LiveWalkthroughPreviewProps>(({ config, compact }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth - 24;
      const h = el.clientHeight - 24;
      const s = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT);
      setScale(Math.max(0.05, Math.min(1, s || 0.05)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const artworkUrl = useMemo(
    () => generateCleanArtworkUrl(config),
    [config.tmdbId, config.imdbId, config.source, config.mediaType, config.textless, config.ptype]
  );
  const logoUrl = useMemo(
    () => generateLogoUrl(config),
    [config.logo, config.tmdbId, config.imdbId, config.mediaType, config.logoSource]
  );

  const hasIds = Boolean(config.imdbId || config.tmdbId);

  const posterCssFilter = useMemo(() => {
    const parts: string[] = [];
    if (config.posterBlur > 0) parts.push(`blur(${config.posterBlur}px)`);
    if (config.grayscale) parts.push('grayscale(1)');
    return parts.join(' ') || 'none';
  }, [config.posterBlur, config.grayscale]);

  return (
    <div
      ref={containerRef}
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
      {hasIds && scale > 0 ? (
        <>
          {/* Poster rendered at logical canvas coords, scaled to fit */}
          <div
            style={{
              position: 'relative',
              width: CANVAS_WIDTH * scale,
              height: CANVAS_HEIGHT * scale,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <ProgressiveImage
                src={artworkUrl ?? undefined}
                alt="Poster preview"
                containerStyle={{
                  position: 'absolute',
                  inset: 0,
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                }}
                imageStyle={{
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                  objectFit: 'cover',
                  filter: posterCssFilter,
                }}
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
                    <span className="body-font" style={{ fontSize: 10 }}>
                      Poster not found
                    </span>
                  </div>
                }
              />

              {/* Minimal preset gradient overlay — matches backend's bottom-quarter SVG gradient */}
              {(config.uiPreset ?? 'b') === 'm' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: `linear-gradient(180deg, transparent 0%, transparent ${Math.round(
                      CANVAS_HEIGHT * 0.75
                    )}px, rgba(0,0,0,1) ${CANVAS_HEIGHT}px)`,
                  }}
                />
              )}

              {/* Badge overlays — demo values, same auto-positioning as the canvas */}
              {config.ratings.map((id: RatingType, index: number) => {
                const auto = calculateAutoPosition(id, index, config.ratings.length, config);
                const iCfg = config.items[id];
                const x = iCfg?.x !== undefined && isFinite(iCfg.x) ? iCfg.x : auto.x;
                const y = iCfg?.y !== undefined && isFinite(iCfg.y) ? iCfg.y : auto.y;
                return (
                  <DraggableBadge
                    key={id}
                    badgeId={id}
                    config={config}
                    x={x}
                    y={y}
                    canvasScale={1}
                    onDragMove={NOOP}
                    onDragEnd={NOOP}
                    isSelected={false}
                    onSelect={NOOP}
                    readOnly
                    zIndex={100 + index}
                  />
                );
              })}

              {config.titleEnabled && (
                <DraggableTitle
                  config={config}
                  canvasScale={1}
                  isSelected={false}
                  onSelect={NOOP}
                  onDragMove={NOOP}
                  onDragEnd={NOOP}
                  readOnly
                />
              )}

              {config.logo && (
                <DraggableLogo
                  config={config}
                  logoUrl={logoUrl}
                  canvasScale={1}
                  onDragEnd={NOOP}
                  readOnly
                />
              )}
            </div>
          </div>
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
  );
});

PreviewBody.displayName = 'WalkthroughPreviewBody';

const LiveWalkthroughPreview = memo<LiveWalkthroughPreviewProps>(({ config, compact }) => {
  return (
    <EditorProvider>
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
          className="syne-font"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--film-text-ghost)',
            padding: '10px 12px 4px',
          }}
        >
          Preview
        </div>

        <PreviewBody config={config} compact={compact} />

        {config.imdbId || config.tmdbId ? (
          <div style={{ padding: '0 12px 12px' }}>
            <div className="mono-font" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
              {config.imdbId || config.tmdbId}
            </div>
          </div>
        ) : null}
      </div>
    </EditorProvider>
  );
});

LiveWalkthroughPreview.displayName = 'LiveWalkthroughPreview';
export default LiveWalkthroughPreview;
