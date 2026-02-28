import React, { useMemo, useRef, useEffect, useState } from 'react';
import { PosterConfig, RatingType, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
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
  const [imageError, setImageError] = useState(false); // New Error State
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<RatingType | null>(null);

  // -- GEOMETRY CALCULATION FOR HOVER OVERLAPPING --
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
    // Standard AABB (Axis-Aligned Bounding Box) Collision
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  };

  // -- GESTURE STATE --
  const lastDist = useRef<number | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);

  // 1. Initial Fit-to-Screen Logic
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
  // --- Stop Browser Page Zoom on Ctrl+Scroll ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // We must use a native event listener with { passive: false }
    // because React's synthetic onWheel is passive by default.
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Stops the browser page from zooming
      }
    };

    container.addEventListener('wheel', preventBrowserZoom, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventBrowserZoom);
    };
  }, []);

  const currentScale = autoScale * zoom;

  // --- NEW: Helper to keep pan within boundaries ---
  const clampPan = (newX: number, newY: number) => {
    // Allows panning up to the canvas's own width/height.
    // You can divide this (e.g., CANVAS_WIDTH / 1.5) to make it stricter.
    const limitX = CANVAS_WIDTH / 3;
    const limitY = CANVAS_HEIGHT / 3;
    return {
      x: Math.max(-limitX, Math.min(limitX, newX)),
      y: Math.max(-limitY, Math.min(limitY, newY)),
    };
  };
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zooming
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.2, Math.min(z * delta, 4)));
    } else {
      // Panning
      let dx = e.deltaX;
      let dy = e.deltaY;

      // If Shift is held, convert vertical scrolling (deltaY) into horizontal panning
      if (e.shiftKey) {
        // Browsers sometimes automatically swap deltaY to deltaX when Shift is held.
        // This handles both native browser behavior and manual swapping.
        dx = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        dy = 0;
      }

      setPan((p) => clampPan(p.x - dx, p.y - dy));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDist.current = dist;
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

      // <-- Updated to use clampPan -->
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

    // Cleanup listener on unmount
    return () => window.removeEventListener('reset-canvas-view', handleResetEvent);
  }, []);

const handlePositionChange = (id: RatingType, newX: number, newY: number) => {
    setConfig((prev: PosterConfig) => {
      const newItems = { ...prev.items };
      if (prev.layout !== 'custom' || prev.preset !== 'custom') {
        prev.ratings.forEach((r, idx) => {
          const auto = calculateAutoPosition(r, idx, prev.ratings.length, prev);
          if (!newItems[r]) newItems[r] = { x: auto.x, y: auto.y };
          else {
            if (newItems[r]!.x === undefined) newItems[r]!.x = auto.x;
            if (newItems[r]!.y === undefined) newItems[r]!.y = auto.y;
          }
        });
      }

      let oldX = newItems[id]?.x;
      let oldY = newItems[id]?.y;
      if (oldX === undefined || oldY === undefined) {
        const auto = calculateAutoPosition(id, prev.ratings.indexOf(id), prev.ratings.length, prev);
        oldX = oldX ?? auto.x;
        oldY = oldY ?? auto.y;
      }
      const dx = newX - oldX;
      const dy = newY - oldY;

      if (selectedIds.has(id) && selectedIds.size > 1) {
        selectedIds.forEach((selId) => {
          let sx = newItems[selId]?.x;
          let sy = newItems[selId]?.y;
          if (sx === undefined || sy === undefined) {
            const auto = calculateAutoPosition(selId, prev.ratings.indexOf(selId), prev.ratings.length, prev);
            sx = sx ?? auto.x;
            sy = sy ?? auto.y;
          }
          
          const selScale = getScale(prev.size) * (newItems[selId]?.scale ?? 1.0);
          const selWidth = BASE_BADGE_W * selScale;
          const selHeight = BASE_BADGE_H * selScale;
          
          const bX = selWidth * 0.8;
          const bY = selHeight * 0.8;

          let nx = sx + dx;
          let ny = sy + dy;
          nx = Math.max(-bX, Math.min(nx, CANVAS_WIDTH - selWidth + bX));
          ny = Math.max(-bY, Math.min(ny, CANVAS_HEIGHT - selHeight + bY));

          newItems[selId] = { ...newItems[selId], x: nx, y: ny };
        });
      } else {
        newItems[id] = { ...newItems[id], x: newX, y: newY };
      }

      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

  const cleanPosterUrl = useMemo(() => {
    const base = `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.${config.extension}`;
    const params = new URLSearchParams();

    // Explicitly set source even if it is TMDB to ensure unique URL signature
    params.set('source', config.source);

    if (config.textless) params.set('textless', '1');
    if (config.ptype && config.ptype !== 'auto') params.set('ptype', config.ptype);

    // Cache Buster: Uses Date.now() to ensure fresh fetch when these dependencies change.
    params.set('_t', Date.now().toString());
    params.set('v', '2');

    return `${base}?${params.toString()}`;
  }, [
    config.tmdbId,
    config.source,
    config.mediaType,
    config.extension,
    config.textless,
    config.ptype,
  ]);
  // Reset loading/error state when URL changes
  useEffect(() => {
    setIsImageLoading(true);
    setImageError(false);
  }, [cleanPosterUrl]);

  // SMART LOAD HANDLER: Only disable loading if the loaded URL matches the current one.
  // This prevents race conditions where an old request finishes after a new one started.
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src === cleanPosterUrl || e.currentTarget.src.includes(cleanPosterUrl)) {
      setIsImageLoading(false);
    }
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
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
{/* Mobile Floating Action Bar */}
      <div
        className="absolute right-4 lg:right-4 flex flex-col items-center gap-2 z-30 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)"
        style={{
          bottom: mobileSheetMode === 'half' ? '55%' : 'calc(4.5rem + env(safe-area-inset-bottom))',
          opacity: mobileSheetMode === 'full' ? 0 : 1,
          pointerEvents: mobileSheetMode === 'full' ? 'none' : 'auto',
        }}
      >
        {isPanning && (
          <div className="bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full mb-2 pointer-events-none">
            Panning
          </div>
        )}

        <div className="flex flex-col items-center gap-1 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full p-1.5 shadow-xl">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.1, 4))}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-transform"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.1, 0.2))}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-transform"
          >
            <ZoomOut size={18} />
          </button>
          
          {/* Divider updated to be always horizontal */}
          <div className="w-4 h-px bg-white/10 my-1"></div>
          
          <button
            onClick={resetView}
            className="p-2 text-zinc-400 hover:text-red-400 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
            title="Fit to Screen"
          >
            <SearchX size={18} />
          </button>
        </div>
      </div>

    {/* The Poster Canvas Container */}
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
            <Loader2 className="animate-spin text-indigo-500" size={40} />
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

        <img
          key={cleanPosterUrl} // Forces React to recreate the img element on URL change, preventing ghosting
          src={cleanPosterUrl}
          alt="Poster"
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-all duration-700 ${isImageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-[1.01]'}`}
          style={{
            filter: `blur(${config.posterBlur}px) grayscale(${config.grayscale ? 1 : 0})`,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {config.ratings.map((id: RatingType, index: number) => {
          const auto = calculateAutoPosition(id, index, config.ratings.length, config);
          const itemConfig = config.items[id];
          const hasManual = itemConfig?.x !== undefined && itemConfig?.y !== undefined;

          // Check if this badge is IN FRONT OF the hovered badge AND overlapping it
        let isObscuring = false;
          if (hoveredBadgeId && hoveredBadgeId !== id) {
            const hoveredIdx = config.ratings.indexOf(hoveredBadgeId);
            isObscuring = checkOverlap(id, index, hoveredBadgeId, hoveredIdx);
          }
          return (
            <DraggableBadge
              key={id}
              badgeId={id}
              config={config}
              x={hasManual ? itemConfig!.x! : auto.x}
              y={hasManual ? itemConfig!.y! : auto.y}
              canvasScale={currentScale}
              onPositionChange={handlePositionChange}
              isSelected={selectedIds.has(id)}
              onSelect={onSelect}
              isObscuring={isObscuring}
              onHoverChange={(isHovered) => setHoveredBadgeId(isHovered ? id : null)}
            />
          );
        })}
            </div>
    </div>
  );
};

export default PreviewCanvas;
