// src/builder/components/PreviewCanvas.tsx
//
// Loading fix — why the spinner sometimes got stuck:
//
//   OLD: useEffect(() => setIsImageLoading(true), [cleanPosterUrl])
//        + onLoad handler: if (src.includes(tmdbId)) setIsImageLoading(false)
//
//   Bug 1 (stale check): `config.tmdbId` inside the effect/handler captured
//   a stale closure value when the ID changed rapidly, so the includes() check
//   could silently fail and the spinner never cleared.
//
//   Bug 2 (cached-image race): React's useEffect runs AFTER the browser
//   commits the DOM. For cached SVGs the browser fires onLoad synchronously
//   during DOM insertion — before the effect that re-sets loading=true runs.
//   Sequence: render → DOM write (onLoad fires → loading=false) → effect runs
//   (loading=true again). The image had loaded but the spinner was stuck.
//
//   FIX: Replace the boolean `isImageLoading` + separate `useEffect` with a
//   single derived state: track the LAST URL that successfully loaded in a
//   `useState<string|null>`. Loading = loadedUrl !== currentUrl. No effect
//   needed; no includes() check; no race condition.

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { PosterConfig, RatingType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
import DraggableLogo  from './DraggableLogo';
import { calculateAutoPosition, DEFAULT_API_BASE, getScale } from '../utils';
import { ZoomIn, ZoomOut, SearchX, Loader2, AlertCircle } from 'lucide-react';
import { useEditor } from '../context/EditorContext';

interface Props {
  config:     PosterConfig;
  setConfig:  React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect:   (id: RatingType, multi: boolean) => void;
}

const PreviewCanvas: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const { viewOptions, mobileSheetMode, clearSelection, liveRatings } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Zoom / Pan ───────────────────────────────────────────────────────────
  const [autoScale, setAutoScale] = useState(1);
  const [zoom,      setZoom]      = useState(1);
  const [pan,       setPan]       = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const zoomFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panFadeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Image loading — race-condition-free ──────────────────────────────────
  // `loadedUrl`: the last URL whose onLoad (or onError) fired.
  // `imageError`: true after onError; cleared whenever URL changes.
  const [loadedUrl,   setLoadedUrl]   = useState<string | null>(null);
  const [imageError,  setImageError]  = useState(false);

  // ── Drag / hover state ───────────────────────────────────────────────────
  const [hoveredBadgeId, setHoveredBadgeId] = useState<RatingType | null>(null);
  const [dragSession,    setDragSession]    = useState<{ id: RatingType; dx: number; dy: number } | null>(null);

  // rAF throttle for drag-move updates
  const pendingDragRef = useRef<{ id: RatingType; dx: number; dy: number } | null>(null);
  const dragRafRef     = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    };
  }, []);

  // ── Fit canvas to container ──────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const pad = 40;
      const sx  = (containerRef.current.clientWidth  - pad) / CANVAS_WIDTH;
      const sy  = (containerRef.current.clientHeight - pad) / CANVAS_HEIGHT;
      setAutoScale(Math.min(sx, sy, 1));
    };
    resize();
    const obs = new ResizeObserver(resize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [mobileSheetMode]);

  // Prevent browser Ctrl+scroll zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, []);

  const currentScale = autoScale * zoom;

  const clampPan = (x: number, y: number) => ({
    x: Math.max(-CANVAS_WIDTH  / 3, Math.min(CANVAS_WIDTH  / 3, x)),
    y: Math.max(-CANVAS_HEIGHT / 3, Math.min(CANVAS_HEIGHT / 3, y)),
  });

  const setZoomAndFlash = (next: number) => {
    setZoom(Math.max(0.2, Math.min(next, 4)));
    setIsZooming(true);
    if (zoomFadeTimer.current) clearTimeout(zoomFadeTimer.current);
    zoomFadeTimer.current = setTimeout(() => setIsZooming(false), 800);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoomAndFlash(zoom * Math.exp(-e.deltaY * 0.004));
    } else {
      let dx = e.deltaX, dy = e.deltaY;
      if (e.shiftKey) { dx = e.deltaY || e.deltaX; dy = 0; }
      setIsPanning(true);
      setPan((p) => clampPan(p.x - dx * 0.85, p.y - dy * 0.85));
      if (panFadeTimer.current) clearTimeout(panFadeTimer.current);
      panFadeTimer.current = setTimeout(() => setIsPanning(false), 150);
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
      const dist  = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setZoomAndFlash(zoom * (dist / lastDist.current));
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
    lastPan.current  = null;
    setIsPanning(false);
  };

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  useEffect(() => {
    window.addEventListener('reset-canvas-view', resetView);
    return () => window.removeEventListener('reset-canvas-view', resetView);
  }, [resetView]);

  // ── Poster URL — covers every param that the SVG endpoint uses ───────────
  const cleanPosterUrl = useMemo(() => {
    const base   = `${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}.svg`;
    const params = new URLSearchParams();

    params.set('source', config.source);
    if (config.textless)                         params.set('textless', '1');
    if (config.ptype && config.ptype !== 'auto') params.set('ptype', config.ptype);
    if (config.posterBlur > 0)                   params.set('bg_blur', config.posterBlur.toString());
    if (config.grayscale)                        params.set('bw', '1');
    if (config.keys?.tmdb)                       params.set('tmdb_key', config.keys.tmdb);
    if (config.keys?.fanart)                     params.set('fanart_key', config.keys.fanart);

    return `${base}?${params.toString()}`;
  }, [
    config.tmdbId, config.source, config.mediaType,
    config.textless, config.ptype,
    config.posterBlur, config.grayscale,
    config.keys?.tmdb, config.keys?.fanart,
  ]);

  // Derived loading state — no useEffect, no race condition
  const isImageLoading = !imageError && loadedUrl !== cleanPosterUrl;

  // When the URL changes, clear any previous error so the new request gets a
  // fresh spinner. We don't reset loadedUrl here because we want to keep
  // showing the old poster while the new one loads (if the browser cached it
  // the new onLoad fires almost immediately anyway).
  useEffect(() => {
    setImageError(false);
  }, [cleanPosterUrl]);

  // ── Logo preview URL ──────────────────────────────────────────────────────
  const logoPreviewUrl = useMemo((): string | null => {
    if (!config.logo || !config.tmdbId) return null;
    const url = new URL(`${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}/logo`);
    if (config.logoSource) url.searchParams.set('source', config.logoSource);
    return url.toString();
  }, [config.logo, config.tmdbId, config.mediaType, config.logoSource]);

  // ── Logo drag ────────────────────────────────────────────────────────────
  const handleLogoDragEnd = useCallback(
    (dx: number, dy: number) => {
      setConfig((prev) => {
        const margin   = 0.3;
        const currentX =
          prev.logoX !== null && prev.logoX !== undefined
            ? prev.logoX
            : Math.round((CANVAS_WIDTH - prev.logoW) / 2);
        const newX = Math.round(Math.max(-(prev.logoW * margin), Math.min(currentX + dx, CANVAS_WIDTH  - prev.logoW  * (1 - margin))));
        const newY = Math.round(Math.max(-(prev.logoH * margin), Math.min(prev.logoY  + dy, CANVAS_HEIGHT - prev.logoH * (1 - margin))));
        return { ...prev, logoX: newX, logoY: newY };
      });
    },
    [setConfig]
  );

  // ── Badge drag (rAF-throttled) ───────────────────────────────────────────
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
      const newItems = { ...prev.items };
      (Object.keys(newItems) as RatingType[]).forEach((k) => { newItems[k] = { ...newItems[k] }; });

      // Materialise auto positions before applying delta so custom mode is consistent
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
        let sx = newItems[targetId].x;
        let sy = newItems[targetId].y;
        if (sx === undefined || sy === undefined) {
          const auto = calculateAutoPosition(targetId, prev.ratings.indexOf(targetId), prev.ratings.length, prev);
          sx = sx ?? auto.x;
          sy = sy ?? auto.y;
        }
        const s   = getScale(prev.size) * (newItems[targetId]?.scale ?? 1.0);
        const bW  = BASE_BADGE_W * s;
        const bH  = BASE_BADGE_H * s;
        const offX = bW * 0.4;
        const offY = bH * 0.4;
        newItems[targetId]!.x = Math.max(-offX, Math.min(sx + dx, CANVAS_WIDTH  - bW  + offX));
        newItems[targetId]!.y = Math.max(-offY, Math.min(sy + dy, CANVAS_HEIGHT - bH + offY));
      };

      if (selectedIds.has(id) && selectedIds.size > 1) selectedIds.forEach(applyDelta);
      else applyDelta(id);

      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

  // ── Badge overlap ────────────────────────────────────────────────────────
  const checkOverlap = (id1: RatingType, idx1: number, id2: RatingType, idx2: number) => {
    const getRect = (id: RatingType, idx: number) => {
      const cfg  = config.items[id];
      const auto = calculateAutoPosition(id, idx, config.ratings.length, config);
      const x    = cfg?.x ?? auto.x;
      const y    = cfg?.y ?? auto.y;
      const s    = getScale(config.size) * (cfg?.scale ?? 1.0);
      return { x, y, w: BASE_BADGE_W * s, h: BASE_BADGE_H * s };
    };
    const r1 = getRect(id1, idx1);
    const r2 = getRect(id2, idx2);
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  };

  // ── Zoom indicator opacity ────────────────────────────────────────────────
  const zoomOpacity = isZooming ? 1 : 0;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#18181b] touch-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}
    >
      {/* ── Zoom controls ─────────────────────────────────────────────────── */}
      <div
        className="absolute right-4 flex flex-col items-center gap-2 z-30 transition-all duration-500"
        style={{
          bottom:        mobileSheetMode === 'half' ? '55%' : 'calc(4.5rem + env(safe-area-inset-bottom))',
          opacity:       mobileSheetMode === 'full' ? 0 : 1,
          pointerEvents: mobileSheetMode === 'full' ? 'none' : 'auto',
        }}
      >
        {/* Percentage badge */}
        <div
          className="bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono text-zinc-400 pointer-events-none transition-opacity duration-300"
          style={{ opacity: zoomOpacity }}
        >
          {Math.round(zoom * 100)}%
        </div>

        {/* Zoom buttons */}
        <div className="flex flex-col items-center gap-1 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-full p-1.5 shadow-xl">
          <button
            onClick={() => setZoomAndFlash(zoom + 0.15)}
            className="p-2 text-zinc-400 hover:text-[#D4A245] rounded-full hover:bg-[#C47C2E]/10 active:scale-95 transition-all"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setZoomAndFlash(zoom - 0.15)}
            className="p-2 text-zinc-400 hover:text-[#D4A245] rounded-full hover:bg-[#C47C2E]/10 active:scale-95 transition-all"
          >
            <ZoomOut size={18} />
          </button>
          <div className="w-4 h-px bg-white/10 my-1" />
          <button
            onClick={resetView}
            className="p-2 text-zinc-400 hover:text-[#C47C2E] rounded-full hover:bg-[#C47C2E]/10 active:scale-95 transition-all"
            title="Fit to screen"
          >
            <SearchX size={18} />
          </button>
        </div>
      </div>

      {/* ── Poster canvas ─────────────────────────────────────────────────── */}
      <div
        style={{
          width:     CANVAS_WIDTH,
          height:    CANVAS_HEIGHT,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
          transition: isPanning ? 'none' : 'transform 0.2s cubic-bezier(0,0,0.2,1)',
        }}
        className="bg-[#0c0c0e] shadow-2xl relative shrink-0 ring-1 ring-white/10 will-change-transform"
        onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}
      >
        {/* Loading overlay — only shown while waiting for the new image */}
        {isImageLoading && (
          <div className="absolute inset-0 z-40 bg-zinc-900/70 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-opacity duration-300">
            <Loader2 className="animate-spin text-[#C47C2E]" size={40} />
          </div>
        )}

        {/* Error overlay */}
        {imageError && (
          <div className="absolute inset-0 z-40 bg-zinc-900/80 backdrop-blur flex flex-col items-center justify-center text-red-400 gap-2 pointer-events-none">
            <AlertCircle size={32} />
            <span className="text-xs font-mono">Failed to load poster</span>
          </div>
        )}

        {/* Grid overlay */}
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
              <div className="absolute top-2 left-2 text-[10px] text-red-500/50 font-mono uppercase">Safe Area</div>
            </div>
          </div>
        )}

        {/* Poster image
            Key = cleanPosterUrl forces an unmount+remount on URL change,
            which prevents stale onLoad events from old requests.
            onLoad / onError both set `loadedUrl = cleanPosterUrl`, which
            clears the `isImageLoading` derived state immediately with zero
            risk of the cached-image race condition. */}
        <img
          key={cleanPosterUrl}
          src={cleanPosterUrl}
          alt="Poster preview"
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500 ${
            isImageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => {
            // Unconditional — no stale-closure risk, no includes() check
            setLoadedUrl(cleanPosterUrl);
          }}
          onError={() => {
            setLoadedUrl(cleanPosterUrl); // stop spinner
            setImageError(true);
          }}
        />

        {/* Badge overlays */}
        {config.ratings.map((id: RatingType, index: number) => {
          const auto       = calculateAutoPosition(id, index, config.ratings.length, config);
          const itemConfig = config.items[id];
          let x = itemConfig?.x !== undefined ? itemConfig.x : auto.x;
          let y = itemConfig?.y !== undefined ? itemConfig.y : auto.y;
          if (!isFinite(x)) x = auto.x;
          if (!isFinite(y)) y = auto.y;

          // Overlap detection for the hovered badge
          let isObscuring = false;
          if (hoveredBadgeId && hoveredBadgeId !== id) {
            isObscuring = checkOverlap(id, index, hoveredBadgeId, config.ratings.indexOf(hoveredBadgeId));
          }

          // Live drag preview
          if (dragSession) {
            const isTarget = dragSession.id === id;
            const isGroup  = selectedIds.has(dragSession.id) && selectedIds.has(id);
            if (isTarget || isGroup) {
              const s    = getScale(config.size) * (itemConfig?.scale ?? 1.0);
              const bW   = BASE_BADGE_W * s;
              const bH   = BASE_BADGE_H * s;
              const offX = bW * 0.4;
              const offY = bH * 0.4;
              x = Math.max(-offX, Math.min(x + dragSession.dx, CANVAS_WIDTH  - bW  + offX));
              y = Math.max(-offY, Math.min(y + dragSession.dy, CANVAS_HEIGHT - bH + offY));
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