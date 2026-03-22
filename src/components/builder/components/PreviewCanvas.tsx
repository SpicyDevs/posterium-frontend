// src/components/builder/components/PreviewCanvas.tsx
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { PosterConfig, RatingType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
import DraggableLogo  from './DraggableLogo';
import { calculateAutoPosition, DEFAULT_API_BASE, getScale } from '../utils';
import { ZoomIn, ZoomOut, SearchX, Loader2, AlertCircle } from 'lucide-react';
import { useEditor } from '../context/EditorContext';

interface Props {
  config: PosterConfig; setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>; onSelect: (id: RatingType, multi: boolean) => void;
}

const PRELOAD_TIMEOUT_MS = 20_000;

/**
 * Build a direct TMDB image URL for the preview background.
 * This is faster than the SVG API endpoint and shows the raw poster
 * without any overlay badges — DraggableBadge components are overlaid on top.
 */
function buildDirectPosterUrl(config: PosterConfig): string {
  if (!config.tmdbId && !config.imdbId) return '';
  // If we have a direct TMDB ID (numeric), use TMDB's image CDN directly
  // The JSON endpoint will provide the actual URL; this is the fallback.
  if (config.tmdbId && /^\d+$/.test(config.tmdbId)) {
    // We can't know the poster_path without fetching — return empty to let
    // livePosterUrl (set by LayerPanel) take precedence.
    return '';
  }
  return '';
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const { viewOptions, mobileSheetMode, clearSelection, liveRatings, livePosterUrl } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1);
  const [zoom,      setZoom]      = useState(1);
  const [pan,       setPan]       = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError,     setImageError]     = useState(false);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<RatingType | null>(null);
  const [dragSession,    setDragSession]    = useState<{ id: RatingType; dx: number; dy: number } | null>(null);
  const pendingDragRef = useRef<{ id: RatingType; dx: number; dy: number } | null>(null);
  const dragRafRef     = useRef<number | null>(null);
  useEffect(() => () => { if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current); }, []);

  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const pad = 32;
      setAutoScale(Math.min(
        (containerRef.current.clientWidth  - pad) / CANVAS_WIDTH,
        (containerRef.current.clientHeight - pad) / CANVAS_HEIGHT,
        1
      ));
    };
    resize();
    const obs = new ResizeObserver(resize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [mobileSheetMode]);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const stop = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, []);

  const currentScale = autoScale * zoom;
  const clampPan = (x: number, y: number) => ({
    x: Math.max(-CANVAS_WIDTH/3,  Math.min(CANVAS_WIDTH/3,  x)),
    y: Math.max(-CANVAS_HEIGHT/3, Math.min(CANVAS_HEIGHT/3, y)),
  });

  const setZoomFlash = useCallback((next: number) => {
    setZoom(Math.max(0.2, Math.min(next, 4)));
    setIsZooming(true);
    if (zoomTimer.current) clearTimeout(zoomTimer.current);
    zoomTimer.current = setTimeout(() => setIsZooming(false), 800);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoomFlash(zoom * Math.exp(-e.deltaY * 0.004));
    } else {
      let dx = e.deltaX, dy = e.deltaY;
      if (e.shiftKey) { dx = e.deltaY || e.deltaX; dy = 0; }
      setIsPanning(true);
      setPan(p => clampPan(p.x - dx * 0.85, p.y - dy * 0.85));
      if (panTimer.current) clearTimeout(panTimer.current);
      panTimer.current = setTimeout(() => setIsPanning(false), 150);
    }
  };

  const lastDist = useRef<number | null>(null);
  const lastPan  = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else {
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
      setZoomFlash(zoom * (dist / lastDist.current));
      lastDist.current = dist;
    } else if (e.touches.length === 1 && lastPan.current && isPanning) {
      const dx = e.touches[0].clientX - lastPan.current.x;
      const dy = e.touches[0].clientY - lastPan.current.y;
      setPan(p => clampPan(p.x + dx, p.y + dy));
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const handleTouchEnd = () => { lastDist.current = null; lastPan.current = null; setIsPanning(false); };
  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);
  useEffect(() => {
    window.addEventListener('reset-canvas-view', resetView);
    return () => window.removeEventListener('reset-canvas-view', resetView);
  }, [resetView]);

  // ── Poster URL resolution ─────────────────────────────────────────────────
  // Prefer livePosterUrl (direct TMDB/source image) over the SVG API endpoint.
  // This avoids loading the overlay SVG for the background and correctly shows
  // just the poster — DraggableBadge components are rendered on top as overlays.
  const posterImageUrl = livePosterUrl || null;

  // Build the CSS filter string for posterBlur + grayscale applied in-browser,
  // matching what the SVG API does server-side via feGaussianBlur + feColorMatrix.
  const posterCssFilter = useMemo(() => {
    const parts: string[] = [];
    if (config.posterBlur > 0)  parts.push(`blur(${config.posterBlur}px)`);
    if (config.grayscale)       parts.push('grayscale(1)');
    return parts.length > 0 ? parts.join(' ') : undefined;
  }, [config.posterBlur, config.grayscale]);

  // Track image loading state for the direct poster URL
  useEffect(() => {
    if (!posterImageUrl) {
      setIsImageLoading(false);
      setImageError(false);
      return;
    }
    setIsImageLoading(true);
    setImageError(false);
    let cancelled = false;
    const img = new Image();
    const safetyTimer = setTimeout(() => {
      if (!cancelled) { setIsImageLoading(false); setImageError(true); }
    }, PRELOAD_TIMEOUT_MS);

    img.onload  = () => { clearTimeout(safetyTimer); if (!cancelled) setIsImageLoading(false); };
    img.onerror = () => { clearTimeout(safetyTimer); if (!cancelled) { setIsImageLoading(false); setImageError(true); } };
    img.src     = posterImageUrl;

    return () => { cancelled = true; clearTimeout(safetyTimer); img.onload = null; img.onerror = null; };
  }, [posterImageUrl]);

  // ── Logo preview URL ──────────────────────────────────────────────────────
  const logoPreviewUrl = useMemo((): string | null => {
    if (!config.logo) return null;
    // Use imdbId for /poster/ path, fall back to mediaType+tmdbId
    const idSegment = config.imdbId
      ? `/poster/${config.imdbId}`
      : `/${config.mediaType}/${config.tmdbId}`;
    if (!idSegment.includes('undefined') && (config.tmdbId || config.imdbId)) {
      const url = new URL(`${DEFAULT_API_BASE}${idSegment}/logo`);
      if (config.logoSource) url.searchParams.set('source', config.logoSource);
      return url.toString();
    }
    return null;
  }, [config.logo, config.tmdbId, config.imdbId, config.mediaType, config.logoSource]);

  const handleLogoDragEnd = useCallback((dx: number, dy: number) => {
    setConfig(prev => {
      const margin   = 0.3;
      const currentX = prev.logoX !== null && prev.logoX !== undefined
        ? prev.logoX
        : Math.round((CANVAS_WIDTH - prev.logoW) / 2);
      return {
        ...prev,
        logoX: Math.round(Math.max(-(prev.logoW * margin), Math.min(currentX + dx, CANVAS_WIDTH  - prev.logoW  * (1 - margin)))),
        logoY: Math.round(Math.max(-(prev.logoH * margin), Math.min(prev.logoY  + dy, CANVAS_HEIGHT - prev.logoH * (1 - margin)))),
      };
    });
  }, [setConfig]);

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
    if (dragRafRef.current !== null) { cancelAnimationFrame(dragRafRef.current); dragRafRef.current = null; }
    pendingDragRef.current = null; setDragSession(null);
    if (dx === 0 && dy === 0) return;
    setConfig((prev: PosterConfig) => {
      const newItems = { ...prev.items };
      (Object.keys(newItems) as RatingType[]).forEach(k => { newItems[k] = { ...newItems[k] }; });
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
          const auto = calculateAutoPosition(targetId, prev.ratings.indexOf(targetId), prev.ratings.length, prev);
          newItems[targetId] = { x: auto.x, y: auto.y };
        }
        let sx = newItems[targetId].x, sy = newItems[targetId].y;
        if (sx === undefined || sy === undefined) {
          const auto = calculateAutoPosition(targetId, prev.ratings.indexOf(targetId), prev.ratings.length, prev);
          sx = sx ?? auto.x; sy = sy ?? auto.y;
        }
        const s  = getScale(prev.size) * (newItems[targetId]?.scale ?? 1.0);
        const bW = BASE_BADGE_W * s, bH = BASE_BADGE_H * s;
        const offX = bW * 0.4, offY = bH * 0.4;
        newItems[targetId]!.x = Math.max(-offX, Math.min(sx + dx, CANVAS_WIDTH  - bW  + offX));
        newItems[targetId]!.y = Math.max(-offY, Math.min(sy + dy, CANVAS_HEIGHT - bH  + offY));
      };
      if (selectedIds.has(id) && selectedIds.size > 1) selectedIds.forEach(applyDelta);
      else applyDelta(id);
      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

  const checkOverlap = (id1: RatingType, idx1: number, id2: RatingType, idx2: number) => {
    const getRect = (id: RatingType, idx: number) => {
      const cfg  = config.items[id];
      const auto = calculateAutoPosition(id, idx, config.ratings.length, config);
      const x = cfg?.x ?? auto.x, y = cfg?.y ?? auto.y;
      const s = getScale(config.size) * (cfg?.scale ?? 1.0);
      return { x, y, w: BASE_BADGE_W * s, h: BASE_BADGE_H * s };
    };
    const r1 = getRect(id1, idx1), r2 = getRect(id2, idx2);
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  };

  const hasMedia = !!(config.tmdbId || config.imdbId);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#18181b] touch-none select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={e => { if (e.target === e.currentTarget) clearSelection(); }}
    >
      {/* Zoom controls */}
      <div
        className="absolute right-3 flex flex-col items-center gap-1.5 z-30 transition-all duration-300"
        style={{
          bottom: mobileSheetMode === 'half' ? '58%' : 'calc(4rem + env(safe-area-inset-bottom, 0px))',
          opacity: mobileSheetMode === 'full' ? 0 : 1,
          pointerEvents: mobileSheetMode === 'full' ? 'none' : 'auto',
        }}
      >
        <div
          className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono text-zinc-300 pointer-events-none transition-opacity duration-300"
          style={{ opacity: isZooming ? 1 : 0 }}
        >
          {Math.round(zoom * 100)}%
        </div>
        <div className="flex flex-col items-center gap-0.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 shadow-2xl">
          {([
            { icon: <ZoomIn size={17} />,  action: () => setZoomFlash(zoom + 0.15) },
            { icon: <ZoomOut size={17} />, action: () => setZoomFlash(zoom - 0.15) },
          ] as const).map((b, i) => (
            <button key={i} onClick={b.action} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-[#D4A245] rounded-xl hover:bg-[#C47C2E]/10 active:scale-90 transition-all">
              {b.icon}
            </button>
          ))}
          <div className="w-5 h-px bg-white/10 mx-auto my-0.5" />
          <button onClick={resetView} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-[#C47C2E] rounded-xl hover:bg-[#C47C2E]/10 active:scale-90 transition-all" title="Fit to screen">
            <SearchX size={15} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
          transition: isPanning ? 'none' : 'transform 0.18s cubic-bezier(0,0,0.2,1)',
        }}
        className="bg-[#0c0c0e] shadow-2xl relative shrink-0 ring-1 ring-white/8 will-change-transform"
        onClick={e => { if (e.target === e.currentTarget) clearSelection(); }}
      >
        {/* Loading overlay */}
        {isImageLoading && posterImageUrl && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#C47C2E]" size={36} strokeWidth={2} />
              <span className="text-[10px] text-zinc-500 font-mono">loading poster…</span>
            </div>
          </div>
        )}

        {/* Error / empty state */}
        {(imageError || !posterImageUrl) && !isImageLoading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-zinc-900/70 pointer-events-none">
            <AlertCircle size={26} className="text-zinc-600" strokeWidth={1.5} />
            <span className="text-[11px] text-zinc-600 font-mono">
              {!hasMedia ? 'search for a title to preview' : !posterImageUrl ? 'searching…' : 'failed to load poster'}
            </span>
          </div>
        )}

        {/* Overlay helpers */}
        {viewOptions?.showGrid && (
          <div className="absolute inset-0 z-30 pointer-events-none opacity-15">
            <div className="absolute top-0 bottom-0 left-1/3  border-l border-white" />
            <div className="absolute top-0 bottom-0 left-2/3  border-l border-white" />
            <div className="absolute left-0 right-0 top-1/3  border-t border-white" />
            <div className="absolute left-0 right-0 top-2/3  border-t border-white" />
          </div>
        )}
        {viewOptions?.showSafeArea && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div className="absolute inset-8 border border-red-500/30 border-dashed">
              <div className="absolute top-1.5 left-2 text-[9px] text-red-500/50 font-mono uppercase tracking-wide">Safe</div>
            </div>
          </div>
        )}

        {/* ── POSTER BACKGROUND ──────────────────────────────────────────────
            Using the direct poster URL (livePosterUrl) instead of the SVG API
            endpoint means no overlap with DraggableBadge overlay components.
            posterCssFilter applies blur/grayscale in-browser, matching the API's
            feGaussianBlur + feColorMatrix filters in the SVG renderer.          */}
        {posterImageUrl && (
          <img
            key={posterImageUrl}
            src={posterImageUrl}
            alt="Poster preview"
            className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            style={{ filter: posterCssFilter }}
            draggable={false}
          />
        )}

        {/* Badge overlays */}
        {config.ratings.map((id: RatingType, index: number) => {
          const auto       = calculateAutoPosition(id, index, config.ratings.length, config);
          const itemConfig = config.items[id];
          let x = itemConfig?.x !== undefined ? itemConfig.x : auto.x;
          let y = itemConfig?.y !== undefined ? itemConfig.y : auto.y;
          if (!isFinite(x)) x = auto.x;
          if (!isFinite(y)) y = auto.y;

          let isObscuring = false;
          if (hoveredBadgeId && hoveredBadgeId !== id) {
            isObscuring = checkOverlap(id, index, hoveredBadgeId, config.ratings.indexOf(hoveredBadgeId));
          }

          if (dragSession) {
            const isTarget = dragSession.id === id;
            const isGroup  = selectedIds.has(dragSession.id) && selectedIds.has(id);
            if (isTarget || isGroup) {
              const s  = getScale(config.size) * (itemConfig?.scale ?? 1.0);
              const bW = BASE_BADGE_W * s, bH = BASE_BADGE_H * s;
              const offX = bW * 0.4, offY = bH * 0.4;
              x = Math.max(-offX, Math.min(x + dragSession.dx, CANVAS_WIDTH  - bW  + offX));
              y = Math.max(-offY, Math.min(y + dragSession.dy, CANVAS_HEIGHT - bH  + offY));
            }
          }

          return (
            <DraggableBadge
              key={id}
              badgeId={id}
              config={config}
              x={x} y={y}
              canvasScale={currentScale}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              isSelected={selectedIds.has(id)}
              onSelect={onSelect}
              isObscuring={isObscuring}
              onHoverChange={hovered => setHoveredBadgeId(hovered ? id : null)}
              liveRating={liveRatings[id]}
            />
          );
        })}

        {/* Logo overlay */}
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