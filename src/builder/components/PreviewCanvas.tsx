import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { PosterConfig, RatingType } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
} from '../types';
import DraggableBadge from './DraggableBadge';
import DraggableLogo from './DraggableLogo';
import { calculateAutoPosition, DEFAULT_API_BASE, getScale } from '../utils';
import { ZoomIn, ZoomOut, SearchX, Loader2, AlertCircle } from 'lucide-react';
import { useEditor } from '../context/EditorContext';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const { viewOptions, mobileSheetMode, clearSelection } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  const [autoScale, setAutoScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const zoomFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<RatingType | null>(null);
  const [dragSession, setDragSession] = useState<{ id: RatingType; dx: number; dy: number } | null>(
    null
  );

  // FIX: rAF throttle for drag move updates.
  //
  // Previously, handleDragMove called setDragSession on every mousemove event.
  // Modern mice fire 200-400 pointer events per second; each one triggered a
  // full React reconcile + all badge position calculations. This is the root
  // cause of sluggish drag performance.
  //
  // Solution: buffer the latest drag values in a ref, and only flush to React
  // state once per animation frame (~60fps). The visual result is identical —
  // the browser can only paint at ~60fps anyway — but the JS work drops from
  // 200-400 reconciles/sec to 60.
  const pendingDragRef = useRef<{ id: RatingType; dx: number; dy: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  // Cleanup pending rAF on unmount
  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, []);

  // --- Badge overlap detection ---
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

  // --- Fit-to-screen ---
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

  // --- Prevent browser zoom on Ctrl+scroll ---
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
      const rawDelta = -e.deltaY;
      const factor = Math.exp(rawDelta * ZOOM_SENSITIVITY);
      setZoom((z) => Math.max(0.2, Math.min(z * factor, 4)));
      setIsZooming(true);
      if (zoomFadeTimer.current) clearTimeout(zoomFadeTimer.current);
      zoomFadeTimer.current = setTimeout(() => setIsZooming(false), 800);
    } else {
      let dx = e.deltaX;
      let dy = e.deltaY;
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
    const handleResetEvent = () => resetView();
    window.addEventListener('reset-canvas-view', handleResetEvent);
    return () => window.removeEventListener('reset-canvas-view', handleResetEvent);
  }, []);

  // Poster image URL - SVG endpoint, no ratings/logo (those are React overlays).
  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.svg`;
    const params = new URLSearchParams();

    params.set('source', config.source);
    if (config.textless) params.set('textless', '1');
    if (config.ptype && config.ptype !== 'auto') params.set('ptype', config.ptype);
    params.set('_t', `${config.tmdbId}-${config.source}-${config.textless}-${config.ptype}`);

    return `${base}?${params.toString()}`;
  }, [config.tmdbId, config.source, config.mediaType, config.textless, config.ptype]);

  useEffect(() => {
    setIsImageLoading(true);
    setImageError(false);
  }, [cleanPosterUrl]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src.includes(config.tmdbId)) setIsImageLoading(false);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  const logoPreviewUrl = useMemo((): string | null => {
    if (!config.logo) return null;
    const id = config.tmdbId;
    if (!id) return null;

    const url = new URL(`${DEFAULT_API_BASE}/${config.mediaType}/${id}/logo`);
    if (config.logoSource) {
      url.searchParams.set('source', config.logoSource);
    }
    url.searchParams.set('_t', config.logoSource || 'auto');

    return url.toString();
  }, [config.logo, config.tmdbId, config.mediaType, config.logoSource]);

  const handleLogoDragEnd = (dx: number, dy: number) => {
    setConfig((prev) => {
      const currentX =
        prev.logoX !== null && prev.logoX !== undefined
          ? prev.logoX
          : Math.round((CANVAS_WIDTH - prev.logoW) / 2);
      const currentY = prev.logoY;

      const margin = 0.3;
      const newX = Math.round(
        Math.max(
          -(prev.logoW * margin),
          Math.min(currentX + dx, CANVAS_WIDTH - prev.logoW * (1 - margin))
        )
      );
      const newY = Math.round(
        Math.max(
          -(prev.logoH * margin),
          Math.min(currentY + dy, CANVAS_HEIGHT - prev.logoH * (1 - margin))
        )
      );
      return { ...prev, logoX: newX, logoY: newY };
    });
  };

  // FIX: rAF-throttled drag move handler.
  // Stores the latest drag values in a ref and schedules a single state update
  // per animation frame. Drops excess events without losing the final position.
  const handleDragMove = useCallback((id: RatingType, dx: number, dy: number) => {
    if (!isFinite(dx) || !isFinite(dy)) return;
    pendingDragRef.current = { id, dx, dy };
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (pendingDragRef.current) {
          setDragSession(pendingDragRef.current);
        }
      });
    }
  }, []);

  const handleDragEnd = (id: RatingType, dx: number, dy: number) => {
    // Cancel any pending rAF so we don't get a stale dragSession update after drop
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    pendingDragRef.current = null;
    setDragSession(null);

    if (dx === 0 && dy === 0) return;

    setConfig((prev: PosterConfig) => {
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
        const offsetX = selWidth * 0.4;
        const offsetY = selHeight * 0.4;

        const nx = Math.max(-offsetX, Math.min(startX + dx, CANVAS_WIDTH - selWidth + offsetX));
        const ny = Math.max(-offsetY, Math.min(startY + dy, CANVAS_HEIGHT - selHeight + offsetY));

        newItems[targetId]!.x = nx;
        newItems[targetId]!.y = ny;
      };

      if (selectedIds.has(id) && selectedIds.size > 1) {
        selectedIds.forEach(applyDelta);
      } else {
        applyDelta(id);
      }

      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

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
      {/* Zoom / Pan controls */}
      <div
        className="absolute right-4 lg:right-4 flex flex-col items-center gap-2 z-30 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)"
        style={{
          bottom: mobileSheetMode === 'half' ? '55%' : 'calc(4.5rem + env(safe-area-inset-bottom))',
          opacity: mobileSheetMode === 'full' ? 0 : 1,
          pointerEvents: mobileSheetMode === 'full' ? 'none' : 'auto',
        }}
      >
        <div
          className="bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono text-zinc-400 pointer-events-none transition-opacity duration-300"
          style={{ opacity: isZooming ? 1 : 0 }}
        >
          {Math.round(zoom * 100)}%
        </div>
        <div className="flex flex-col items-center gap-1 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full p-1.5 shadow-xl">
          <button
            onClick={() => {
              const next = Math.min(zoom + 0.15, 4);
              setZoom(next);
              setIsZooming(true);
              if (zoomFadeTimer.current) clearTimeout(zoomFadeTimer.current);
              zoomFadeTimer.current = setTimeout(() => setIsZooming(false), 800);
            }}
            className="p-2 text-zinc-400 hover:text-[#D4A245] rounded-full hover:bg-[#C47C2E]/10 active:scale-95 transition-all"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => {
              const next = Math.max(zoom - 0.15, 0.2);
              setZoom(next);
              setIsZooming(true);
              if (zoomFadeTimer.current) clearTimeout(zoomFadeTimer.current);
              zoomFadeTimer.current = setTimeout(() => setIsZooming(false), 800);
            }}
            className="p-2 text-zinc-400 hover:text-[#D4A245] rounded-full hover:bg-[#C47C2E]/10 active:scale-95 transition-all"
          >
            <ZoomOut size={18} />
          </button>
          <div className="w-4 h-px bg-white/10 my-1"></div>
          <button
            onClick={resetView}
            className="p-2 text-zinc-400 hover:text-[#C47C2E] rounded-full hover:bg-[#C47C2E]/10 active:scale-95 transition-all"
            title="Fit to Screen"
          >
            <SearchX size={18} />
          </button>
        </div>
      </div>

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
            <div className="absolute top-0 bottom-0 left-1/3 border-l border-white"></div>
            <div className="absolute top-0 bottom-0 left-2/3 border-l border-white"></div>
            <div className="absolute left-0 right-0 top-1/3 border-t border-white"></div>
            <div className="absolute left-0 right-0 top-2/3 border-t border-white"></div>
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

        {/* Poster image */}
        <img
          key={cleanPosterUrl}
          src={cleanPosterUrl}
          alt="Poster"
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-700 ${isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-[1.01]'}`}
          style={{ filter: `blur(${config.posterBlur}px) grayscale(${config.grayscale ? 1 : 0})` }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* React badge overlays */}
        {config.ratings.map((id: RatingType, index: number) => {
          const auto = calculateAutoPosition(id, index, config.ratings.length, config);
          const itemConfig = config.items[id];
          let x = itemConfig?.x !== undefined ? itemConfig.x : auto.x;
          let y = itemConfig?.y !== undefined ? itemConfig.y : auto.y;
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
              const selScale = getScale(config.size) * (itemConfig?.scale ?? 1.0);
              const bW = BASE_BADGE_W * selScale;
              const bH = BASE_BADGE_H * selScale;
              const offsetX = bW * 0.4;
              const offsetY = bH * 0.4;
              x = Math.max(-offsetX, Math.min(x + dragSession.dx, CANVAS_WIDTH - bW + offsetX));
              y = Math.max(-offsetY, Math.min(y + dragSession.dy, CANVAS_HEIGHT - bH + offsetY));
            }
          }

          return (
            <DraggableBadge
              key={id}
              badgeId={id}
              config={config}
              x={x}
              y={y}
              canvasScale={currentScale}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              isSelected={selectedIds.has(id)}
              onSelect={onSelect}
              isObscuring={isObscuring}
              onHoverChange={(isHovered) => setHoveredBadgeId(isHovered ? id : null)}
            />
          );
        })}

        {/* Logo overlay - rendered above badges, below nothing */}
        {config.logo && (
          <DraggableLogo
            config={config}
            logoUrl={logoPreviewUrl}
            canvasScale={currentScale}
            onDragEnd={handleLogoDragEnd}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewCanvas;
