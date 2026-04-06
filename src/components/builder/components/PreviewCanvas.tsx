// src/builder/components/PreviewCanvas.tsx
//
// FEATURE: posterBlur and grayscale are now applied entirely on the frontend
// via CSS `filter` on the poster <img> element. They are NOT sent to the
// backend as bg_blur/gs parameters, so the backend does not need to re-process
// the image. This eliminates a round-trip fetch for those visual effects and
// makes the preview update instantly when sliders are dragged.
//
// The backend still ACCEPTS bg_blur and gs for non-builder use cases (direct
// API URL usage, Plex/Jellyfin). The builder just no longer sends them.
//
// The cleanPosterUrl therefore no longer includes bg_blur or bw/gs.

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { PosterConfig, RatingType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
import DraggableLogo from './DraggableLogo';
import { calculateAutoPosition, DEFAULT_API_BASE, generateApiUrl, getScale } from '../utils';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import clsx from 'clsx';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  onContextMenu?: (id: RatingType, e: React.MouseEvent) => void;
  isFullscreen?: boolean;
  rightSidebarWidth?: number;
  toggleFullscreen?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
}

const PreviewCanvas: React.FC<Props> = ({
  config,
  setConfig,
  selectedIds,
  onSelect,
  onContextMenu,
  isFullscreen = false,
  rightSidebarWidth = 0,
  toggleFullscreen,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const { viewOptions, mobileSheetMode, clearSelection, liveRatings } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  const [autoScale, setAutoScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<RatingType | null>(null);
  const [dragSession, setDragSession] = useState<{ id: RatingType; dx: number; dy: number } | null>(
    null
  );
  const snapToGrid = useCallback(
    (n: number) => (viewOptions?.snapToGrid ? Math.round(n / 10) * 10 : n),
    [viewOptions?.snapToGrid]
  );

  // rAF throttle for drag move updates
  const pendingDragRef = useRef<{ id: RatingType; dx: number; dy: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    },
    []
  );

  const getBadgeRect = (id: RatingType, index: number) => {
    const itemConfig = config.items[id];
    const auto = calculateAutoPosition(id, index, config.ratings.length, config);
    const x = itemConfig?.x ?? auto.x;
    const y = itemConfig?.y ?? auto.y;
    const scale = getScale(config.size) * (itemConfig?.scale ?? 1.0);
    const w = BASE_BADGE_W * scale;
    const h = BASE_BADGE_H * scale;
    return { x, y, w, h };
  };

  const checkOverlap = (id1: RatingType, idx1: number, id2: RatingType, idx2: number) => {
    const r1 = getBadgeRect(id1, idx1);
    const r2 = getBadgeRect(id2, idx2);
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  };

  const lastDist = useRef<number | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const padding = 40;
      const scaleX = (containerRef.current.clientWidth - padding) / CANVAS_WIDTH;
      const scaleY = (containerRef.current.clientHeight - padding) / CANVAS_HEIGHT;
      setAutoScale(Math.min(scaleX, scaleY, 1));
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [mobileSheetMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    container.addEventListener('wheel', preventBrowserZoom, { passive: false });
    return () => container.removeEventListener('wheel', preventBrowserZoom);
  }, []);

  const currentScale = autoScale * zoom;
  const isMinimalPreset = (config.uiPreset ?? 'b') === 'm';

  const clampPan = (newX: number, newY: number) => {
    const limitX = CANVAS_WIDTH / 3;
    const limitY = CANVAS_HEIGHT / 3;
    return {
      x: Math.max(-limitX, Math.min(limitX, newX)),
      y: Math.max(-limitY, Math.min(limitY, newY)),
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    const ZOOM_SENSITIVITY = 0.004;
    const PAN_DAMPING_FACTOR = 0.85;

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
      setZoom((z) => Math.max(0.2, Math.min(z * factor, 4)));
    } else {
      let dx = e.deltaX,
        dy = e.deltaY;
      if (e.shiftKey) {
        dx = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        dy = 0;
      }
      setIsPanning(true);
      setPan((p) => clampPan(p.x - dx * PAN_DAMPING_FACTOR, p.y - dy * PAN_DAMPING_FACTOR));
      if (panFadeTimer.current) clearTimeout(panFadeTimer.current);
      panFadeTimer.current = setTimeout(() => setIsPanning(false), 150);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      setIsPanning(true);
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastDist.current;
      setZoom((z) => Math.max(0.2, Math.min(z * delta, 4)));
      lastDist.current = dist;
    } else if (e.touches.length === 1 && lastPan.current && isPanning) {
      const dx = e.touches[0].clientX - lastPan.current.x;
      const dy = e.touches[0].clientY - lastPan.current.y;
      setPan((p) => clampPan(p.x + dx, p.y + dy));
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = null;
    lastPan.current = null;
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const h = () => resetView();
    window.addEventListener('reset-canvas-view', h);
    return () => window.removeEventListener('reset-canvas-view', h);
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail;
      setZoom((z) => Math.max(0.2, Math.min(z + delta, 4)));
    };
    window.addEventListener('canvas-zoom', h);
    return () => window.removeEventListener('canvas-zoom', h);
  }, []);

  const cleanPosterUrl = useMemo(() => {
    const id = config.imdbId || config.tmdbId;
    const type = config.imdbId ? 'poster' : config.mediaType;
    const base = `${DEFAULT_API_BASE}/${type}/${id}.svg`;
    const params = new URLSearchParams();
    params.set('source', config.source);
    if (config.textless) params.set('textless', '1');
    if (config.ptype && config.ptype !== 'auto') params.set('ptype', config.ptype);
    params.set('_t', `${id}-${config.source}-${config.textless}-${config.ptype}`);
    return `${base}?${params.toString()}`;
  }, [
    config.tmdbId,
    config.imdbId,
    config.source,
    config.mediaType,
    config.textless,
    config.ptype,
  ]);

  const minimalCompositeUrl = useMemo(() => {
    if (!isMinimalPreset) return '';
    try {
      return generateApiUrl(config, DEFAULT_API_BASE);
    } catch {
      return '';
    }
  }, [config, isMinimalPreset]);

  const hasMinimalUrlError = isMinimalPreset && !minimalCompositeUrl;
  const previewImageUrl = isMinimalPreset ? minimalCompositeUrl : cleanPosterUrl;

  const posterCssFilter = useMemo(() => {
    if (isMinimalPreset) return 'none';
    const parts: string[] = [];
    if (config.posterBlur > 0) parts.push(`blur(${config.posterBlur}px)`);
    if (config.grayscale) parts.push('grayscale(1)');
    return parts.join(' ') || 'none';
  }, [config.posterBlur, config.grayscale, isMinimalPreset]);

  useEffect(() => {
    setIsImageLoading(true);
    setImageError(false);
    if (hasMinimalUrlError) {
      setIsImageLoading(false);
      setImageError(true);
    }
  }, [previewImageUrl, hasMinimalUrlError]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const id = config.imdbId || config.tmdbId;
    if (id && e.currentTarget.src.includes(id)) setIsImageLoading(false);
  };
  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  const logoPreviewUrl = useMemo((): string | null => {
    if (!config.logo) return null;
    const id = config.imdbId || config.tmdbId;
    if (!id) return null;
    const type =
      config.mediaType === 'anime' ? 'anime' : config.mediaType === 'tv' ? 'tv' : 'movie';
    const url = new URL(`${DEFAULT_API_BASE}/${type}/${id}/logo`);
    if (config.logoSource) url.searchParams.set('source', config.logoSource);
    url.searchParams.set('_t', config.logoSource || 'auto');
    return url.toString();
  }, [config.logo, config.tmdbId, config.imdbId, config.mediaType, config.logoSource]);

  const handleLogoDragEnd = (dx: number, dy: number) => {
    const gridSize = 10;
    const snap = (n: number) => (viewOptions?.snapToGrid ? Math.round(n / gridSize) * gridSize : n);
    setConfig((prev) => {
      const currentX =
        prev.logoX !== null && prev.logoX !== undefined
          ? prev.logoX
          : Math.round((CANVAS_WIDTH - prev.logoW) / 2);
      const currentY = prev.logoY;
      const nextX = snap(currentX + dx);
      const nextY = snap(currentY + dy);
      return {
        ...prev,
        logoX: Math.round(Math.max(1 - prev.logoW, Math.min(nextX, CANVAS_WIDTH - 1))),
        logoY: Math.round(Math.max(1 - prev.logoH, Math.min(nextY, CANVAS_HEIGHT - 1))),
      };
    });
  };

  const handleDragMove = useCallback((id: RatingType, dx: number, dy: number) => {
    if (!isFinite(dx) || !isFinite(dy)) return;
    pendingDragRef.current = { id, dx, dy };
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (pendingDragRef.current) setDragSession(pendingDragRef.current);
      });
    }
  }, []);

  const handleDragEnd = (id: RatingType, dx: number, dy: number) => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    pendingDragRef.current = null;
    setDragSession(null);
    if (dx === 0 && dy === 0) return;

    setConfig((prev: PosterConfig) => {
      const gridSize = 10;
      const snap = (n: number) =>
        viewOptions?.snapToGrid ? Math.round(n / gridSize) * gridSize : n;
      const newItems = { ...prev.items };
      (Object.keys(newItems) as RatingType[]).forEach((k) => {
        newItems[k] = { ...newItems[k] };
      });

      if (prev.layout !== 'custom' || prev.preset !== 'custom') {
        prev.ratings.forEach((r, idx) => {
          const auto = calculateAutoPosition(r, idx, prev.ratings.length, prev);
          if (!newItems[r]) newItems[r] = { x: auto.x, y: auto.y };
          else {
            newItems[r]!.x = newItems[r]!.x ?? auto.x;
            newItems[r]!.y = newItems[r]!.y ?? auto.y;
          }
        });
      }

      const applyDelta = (targetId: RatingType) => {
        if (!newItems[targetId]) {
          const auto = calculateAutoPosition(
            targetId,
            prev.ratings.indexOf(targetId),
            prev.ratings.length,
            prev
          );
          newItems[targetId] = { x: auto.x, y: auto.y };
        }
        let startX = newItems[targetId].x;
        let startY = newItems[targetId].y;
        if (startX === undefined || startY === undefined) {
          const auto = calculateAutoPosition(
            targetId,
            prev.ratings.indexOf(targetId),
            prev.ratings.length,
            prev
          );
          startX = startX ?? auto.x;
          startY = startY ?? auto.y;
        }
        const selScale = getScale(prev.size) * (newItems[targetId]?.scale ?? 1.0);
        const selWidth = BASE_BADGE_W * selScale;
        const selHeight = BASE_BADGE_H * selScale;
        // Constrain so at least 1px of the badge remains inside the poster
        const nextX = snap(startX + dx);
        const nextY = snap(startY + dy);
        newItems[targetId]!.x = Math.max(1 - selWidth, Math.min(nextX, CANVAS_WIDTH - 1));
        newItems[targetId]!.y = Math.max(1 - selHeight, Math.min(nextY, CANVAS_HEIGHT - 1));
      };

      if (selectedIds.has(id) && selectedIds.size > 1) selectedIds.forEach(applyDelta);
      else applyDelta(id);

      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

  const badgeSnapGuide = useMemo(() => {
    if (!dragSession || !viewOptions?.snapToGrid || isMinimalPreset) return null;
    const targetId = dragSession.id;
    const index = config.ratings.indexOf(targetId);
    if (index === -1) return null;

    const auto = calculateAutoPosition(targetId, index, config.ratings.length, config);
    const iCfg = config.items[targetId];
    let x = iCfg?.x !== undefined ? iCfg.x : auto.x;
    let y = iCfg?.y !== undefined ? iCfg.y : auto.y;
    if (!isFinite(x)) x = auto.x;
    if (!isFinite(y)) y = auto.y;

    const selScale = getScale(config.size) * (iCfg?.scale ?? 1.0);
    const bW = BASE_BADGE_W * selScale;
    const bH = BASE_BADGE_H * selScale;
    const nextX = Math.max(1 - bW, Math.min(snapToGrid(x + dragSession.dx), CANVAS_WIDTH - 1));
    const nextY = Math.max(1 - bH, Math.min(snapToGrid(y + dragSession.dy), CANVAS_HEIGHT - 1));

    return {
      centerX: nextX + bW / 2,
      centerY: nextY + bH / 2,
    };
  }, [dragSession, viewOptions?.snapToGrid, isMinimalPreset, config, snapToGrid]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#18181b] touch-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget) clearSelection();
      }}
    >
      {/* Poster Canvas */}
      <div
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
          transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0,0,0.2,1)',
        }}
        className="bg-[#0c0c0e] shadow-2xl relative shrink-0 ring-1 ring-white/10 group will-change-transform"
        onClick={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
      >
        {isImageLoading && !imageError && (
          <div className="absolute inset-0 z-40 bg-zinc-900/80 backdrop-blur flex items-center justify-center pointer-events-none">
            <Loader2 className="animate-spin text-[#C47C2E]" size={40} />
          </div>
        )}
        {imageError && (
          <div className="absolute inset-0 z-40 bg-zinc-900/80 backdrop-blur flex flex-col items-center justify-center text-red-400 gap-2 pointer-events-none">
            <AlertCircle size={32} />
            <span className="text-xs font-mono">Failed to load</span>
          </div>
        )}

        {viewOptions?.showGrid && (
          <div className="absolute inset-0 z-30 pointer-events-none opacity-20">
            <div className="absolute top-0 bottom-0 left-1/3 border-l border-white" />
            <div className="absolute top-0 bottom-0 left-2/3 border-l border-white" />
            <div className="absolute left-0 right-0 top-1/3 border-t border-white" />
            <div className="absolute left-0 right-0 top-2/3 border-t border-white" />
          </div>
        )}
        {viewOptions?.showSafeArea && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div className="absolute inset-8 border border-red-500/30 border-dashed">
              <div className="absolute top-2 left-2 text-[10px] text-red-500/50 font-mono uppercase">
                Safe Area
              </div>
            </div>
          </div>
        )}
        {badgeSnapGuide && (
          <>
            <div
              className="absolute pointer-events-none z-30"
              style={{
                left: badgeSnapGuide.centerX,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'rgba(196,124,46,0.8)',
                transform: 'translateX(-50%)',
              }}
            />
            <div
              className="absolute pointer-events-none z-30"
              style={{
                top: badgeSnapGuide.centerY,
                left: 0,
                right: 0,
                height: 1,
                background: 'rgba(196,124,46,0.8)',
                transform: 'translateY(-50%)',
              }}
            />
          </>
        )}

        {/* Poster image — FIX: posterBlur/grayscale via CSS filter, not URL param */}
        {!hasMinimalUrlError && (
          <img
            key={previewImageUrl}
            src={previewImageUrl}
            alt="Poster"
            className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-700 ${
              isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-[1.01]'
            }`}
            style={{ filter: posterCssFilter }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Badge overlays */}
        {!isMinimalPreset &&
          config.ratings.map((id: RatingType, index: number) => {
            const auto = calculateAutoPosition(id, index, config.ratings.length, config);
            const iCfg = config.items[id];
            let x = iCfg?.x !== undefined ? iCfg.x : auto.x;
            let y = iCfg?.y !== undefined ? iCfg.y : auto.y;
            if (!isFinite(x)) x = auto.x;
            if (!isFinite(y)) y = auto.y;

            let isObscuring = false;
            if (hoveredBadgeId && hoveredBadgeId !== id) {
              const hoveredIdx = config.ratings.indexOf(hoveredBadgeId);
              isObscuring = checkOverlap(id, index, hoveredBadgeId, hoveredIdx);
            }

            if (dragSession) {
              const isTarget = dragSession.id === id;
              const isGroup = selectedIds.has(dragSession.id) && selectedIds.has(id);
              if (isTarget || isGroup) {
                const selScale = getScale(config.size) * (iCfg?.scale ?? 1.0);
                const bW = BASE_BADGE_W * selScale;
                const bH = BASE_BADGE_H * selScale;
                // Preview clamp: at least 1px inside poster
                x = Math.max(1 - bW, Math.min(snapToGrid(x + dragSession.dx), CANVAS_WIDTH - 1));
                y = Math.max(1 - bH, Math.min(snapToGrid(y + dragSession.dy), CANVAS_HEIGHT - 1));
              }
            }

            return (
              <DraggableBadge
                key={id}
                badgeId={id}
                config={config}
                value={liveRatings[id]}
                x={x}
                y={y}
                canvasScale={currentScale}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                isSelected={selectedIds.has(id)}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                isObscuring={isObscuring}
                onHoverChange={(hovered) => setHoveredBadgeId(hovered ? id : null)}
              />
            );
          })}

        {config.logo && (
          <DraggableLogo
            config={config}
            logoUrl={logoPreviewUrl}
            canvasScale={currentScale}
            onDragEnd={handleLogoDragEnd}
          />
        )}
      </div>

      {/* Vertical/Horizontal Zoom Overlay logic */}
      {toggleFullscreen && (
        <div
          className={clsx(
            'fixed z-40 flex rounded-xl select-none transition-all',
            isFullscreen
              ? 'bottom-5 right-5 flex-row items-center gap-1 p-1.5'
              : 'flex-col items-center gap-1 p-1.5'
          )}
          style={{
            background: 'rgba(14,13,11,0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(196,124,46,0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            ...(!isFullscreen
              ? {
                  right: rightSidebarWidth + 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }
              : {}),
          }}
        >
          {[
            { icon: <ZoomIn size={15} />, label: 'Zoom In', action: onZoomIn },
            { icon: <ZoomOut size={15} />, label: 'Zoom Out', action: onZoomOut },
            { icon: <Maximize2 size={14} />, label: 'Reset View', action: onResetView },
          ].map(({ icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
              style={{
                color: 'var(--film-text-dim)',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(196,124,46,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {icon}
            </button>
          ))}
          <div
            style={{
              width: isFullscreen ? 1 : 20,
              height: isFullscreen ? 20 : 1,
              background: 'rgba(255,255,255,0.08)',
              margin: isFullscreen ? '0 2px' : '2px 0',
            }}
          />
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (F or Esc)' : 'Enter Fullscreen (F)'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
            style={{
              color: isFullscreen ? 'rgba(196,124,46,0.7)' : 'var(--film-text-dim)',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-amber)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(196,124,46,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = isFullscreen
                ? 'rgba(196,124,46,0.7)'
                : 'var(--film-text-dim)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default PreviewCanvas;
