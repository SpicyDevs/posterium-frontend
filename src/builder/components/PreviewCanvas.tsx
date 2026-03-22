// src/builder/components/PreviewCanvas.tsx
//
// ── Loading fix (root cause analysis) ────────────────────────────────────────
//
// Previous attempts used derived state (`loadedUrl !== cleanPosterUrl`) but
// that still fails on hard refresh for one reason:
//
//   When the worker is cold (Render.com sleeping), the SVG request can take
//   20–30 s and end with NO response at all — a hard network timeout.
//   In that case NEITHER onLoad NOR onError fires on the <img> element in
//   some browsers (Chrome doesn't fire onError for a fetch that hangs then
//   is aborted by the browser after its own timeout). The spinner sticks
//   forever.
//
// FIX: Use an IMPERATIVE preload (`new Image()`) inside a useEffect.
//   • We control the abort lifecycle — cancel it when the URL changes.
//   • We install our own 25-second safety timeout; if neither load nor error
//     fires, we treat it as an error and stop the spinner.
//   • The visible <img> reads from browser cache (filled by the preload),
//     so it renders instantly with no second fetch.
//
// ── TMDB poster in left panel ─────────────────────────────────────────────────
//   LayerPanel fetches the .json endpoint which returns `poster.selected`.
//   That URL is pushed into EditorContext alongside liveRatings so
//   PreviewCanvas doesn't need to know about it.

import React, {
  useMemo, useRef, useEffect, useState, useCallback,
} from 'react';
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

const PRELOAD_TIMEOUT_MS = 25_000;

const PreviewCanvas: React.FC<Props> = ({
  config, setConfig, selectedIds, onSelect,
}) => {
  const { viewOptions, mobileSheetMode, clearSelection, liveRatings } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Zoom / Pan ──────────────────────────────────────────────────────────────
  const [autoScale, setAutoScale] = useState(1);
  const [zoom,      setZoom]      = useState(1);
  const [pan,       setPan]       = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Image state ─────────────────────────────────────────────────────────────
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError,     setImageError]     = useState(false);

  // ── Drag / hover ────────────────────────────────────────────────────────────
  const [hoveredBadgeId, setHoveredBadgeId] = useState<RatingType | null>(null);
  const [dragSession,    setDragSession]    = useState<{
    id: RatingType; dx: number; dy: number;
  } | null>(null);
  const pendingDragRef = useRef<{ id: RatingType; dx: number; dy: number } | null>(null);
  const dragRafRef     = useRef<number | null>(null);

  useEffect(() => () => {
    if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
  }, []);

  // ── Fit canvas to container ─────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const pad = 32;
      setAutoScale(Math.min(
        (containerRef.current.clientWidth  - pad) / CANVAS_WIDTH,
        (containerRef.current.clientHeight - pad) / CANVAS_HEIGHT,
        1,
      ));
    };
    resize();
    const obs = new ResizeObserver(resize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [mobileSheetMode]);

  // Block browser Ctrl+scroll zoom on the canvas area
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, []);

  const currentScale = autoScale * zoom;
  const clampPan     = (x: number, y: number) => ({
    x: Math.max(-CANVAS_WIDTH  / 3, Math.min(CANVAS_WIDTH  / 3, x)),
    y: Math.max(-CANVAS_HEIGHT / 3, Math.min(CANVAS_HEIGHT / 3, y)),
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
      setPan((p) => clampPan(p.x - dx * 0.85, p.y - dy * 0.85));
      if (panTimer.current) clearTimeout(panTimer.current);
      panTimer.current = setTimeout(() => setIsPanning(false), 150);
    }
  };

  // Touch pinch-zoom + single-finger pan
  const lastDist = useRef<number | null>(null);
  const lastPan  = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
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
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setZoomFlash(zoom * (dist / lastDist.current));
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

  // ── Poster URL ───────────────────────────────────────────────────────────────
  const cleanPosterUrl = useMemo(() => {
    // Guard: don't build a URL if there's no ID to look up
    if (!config.tmdbId) return '';

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

  // ── Imperative preload ───────────────────────────────────────────────────────
  // Creates a detached Image() to drive loading state. This approach avoids:
  //   • Stale closure values in React event handlers
  //   • Cached-image race (onLoad before useEffect)
  //   • Hanging fetches that never resolve (protected by 25s timeout)
  useEffect(() => {
    if (!cleanPosterUrl) {
      setIsImageLoading(false);
      setImageError(false);
      return;
    }

    setIsImageLoading(true);
    setImageError(false);

    let cancelled = false;
    const img = new Image();
    let safetyTimer: ReturnType<typeof setTimeout>;

    const done = (error: boolean) => {
      if (cancelled) return;
      setIsImageLoading(false);
      if (error) setImageError(true);
    };

    img.onload  = () => done(false);
    img.onerror = () => done(true);
    img.src     = cleanPosterUrl;

    // Safety net: if network hangs and neither event fires, unblock the UI
    safetyTimer = setTimeout(() => done(true), PRELOAD_TIMEOUT_MS);

    return () => {
      cancelled         = true;
      clearTimeout(safetyTimer);
      img.onload  = null;
      img.onerror = null;
      // Abort the browser fetch by clearing the src
      img.src     = '';
    };
  }, [cleanPosterUrl]);

  // ── Logo preview URL ─────────────────────────────────────────────────────────
  const logoPreviewUrl = useMemo((): string | null => {
    if (!config.logo || !config.tmdbId) return null;
    const url = new URL(`${DEFAULT_API_BASE}/${config.mediaType}/${config.tmdbId}/logo`);
    if (config.logoSource) url.searchParams.set('source', config.logoSource);
    return url.toString();
  }, [config.logo, config.tmdbId, config.mediaType, config.logoSource]);

  // ── Logo drag ────────────────────────────────────────────────────────────────
  const handleLogoDragEnd = useCallback((dx: number, dy: number) => {
    setConfig((prev) => {
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

  // ── Badge drag (rAF-throttled) ───────────────────────────────────────────────
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

      if (prev.layout !== 'custom' || prev.preset !== 'custom') {
        prev.ratings.forEach((r, idx) => {
          const auto = calculateAutoPosition(r, idx, prev.ratings.length, prev);
          if (!newItems[r]) newItems[r] = { x: auto.x, y: auto.y };
          else { newItems[r]!.x = newItems[r]!.x ?? auto.x; newItems[r]!.y = newItems[r]!.y ?? auto.y; }
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
        const s   = getScale(prev.size) * (newItems[targetId]?.scale ?? 1.0);
        const bW  = BASE_BADGE_W * s;
        const bH  = BASE_BADGE_H * s;
        const offX = bW * 0.4, offY = bH * 0.4;
        newItems[targetId]!.x = Math.max(-offX, Math.min(sx + dx, CANVAS_WIDTH  - bW  + offX));
        newItems[targetId]!.y = Math.max(-offY, Math.min(sy + dy, CANVAS_HEIGHT - bH  + offY));
      };

      if (selectedIds.has(id) && selectedIds.size > 1) selectedIds.forEach(applyDelta);
      else applyDelta(id);

      return { ...prev, layout: 'custom', preset: 'custom', items: newItems };
    });
  };

  // ── Overlap detection ────────────────────────────────────────────────────────
  const checkOverlap = (id1: RatingType, idx1: number, id2: RatingType, idx2: number) => {
    const getRect = (id: RatingType, idx: number) => {
      const cfg  = config.items[id];
      const auto = calculateAutoPosition(id, idx, config.ratings.length, config);
      const x    = cfg?.x ?? auto.x;
      const y    = cfg?.y ?? auto.y;
      const s    = getScale(config.size) * (cfg?.scale ?? 1.0);
      return { x, y, w: BASE_BADGE_W * s, h: BASE_BADGE_H * s };
    };
    const r1 = getRect(id1, idx1), r2 = getRect(id2, idx2);
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#18181b] touch-none select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}
    >
      {/* ── Zoom controls ── */}
      <div
        className="absolute right-3 flex flex-col items-center gap-1.5 z-30 transition-all duration-300"
        style={{
          bottom:        mobileSheetMode === 'half' ? '58%' : 'calc(4rem + env(safe-area-inset-bottom, 0px))',
          opacity:       mobileSheetMode === 'full' ? 0 : 1,
          pointerEvents: mobileSheetMode === 'full' ? 'none' : 'auto',
        }}
      >
        {/* Zoom percentage */}
        <div
          className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-mono text-zinc-300 pointer-events-none transition-opacity duration-300"
          style={{ opacity: isZooming ? 1 : 0 }}
        >
          {Math.round(zoom * 100)}%
        </div>
        {/* Buttons */}
        <div className="flex flex-col items-center gap-0.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 shadow-2xl">
          {[
            { icon: <ZoomIn size={17} />,  action: () => setZoomFlash(zoom + 0.15) },
            { icon: <ZoomOut size={17} />, action: () => setZoomFlash(zoom - 0.15) },
          ].map((b, i) => (
            <button
              key={i}
              onClick={b.action}
              className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-[#D4A245] rounded-xl hover:bg-[#C47C2E]/10 active:scale-90 transition-all"
            >
              {b.icon}
            </button>
          ))}
          <div className="w-5 h-px bg-white/10 mx-auto my-0.5" />
          <button
            onClick={resetView}
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-[#C47C2E] rounded-xl hover:bg-[#C47C2E]/10 active:scale-90 transition-all"
            title="Fit to screen"
          >
            <SearchX size={15} />
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        style={{
          width:     CANVAS_WIDTH,
          height:    CANVAS_HEIGHT,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
          transition: isPanning ? 'none' : 'transform 0.18s cubic-bezier(0,0,0.2,1)',
        }}
        className="bg-[#0c0c0e] shadow-2xl relative shrink-0 ring-1 ring-white/8 will-change-transform"
        onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}
      >
        {/* Loading overlay */}
        {isImageLoading && cleanPosterUrl && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#C47C2E]" size={36} strokeWidth={2} />
              <span className="text-[10px] text-zinc-500 font-mono">loading poster…</span>
            </div>
          </div>
        )}

        {/* Error / empty state */}
        {(imageError || !cleanPosterUrl) && !isImageLoading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-zinc-900/70 pointer-events-none">
            <AlertCircle size={26} className="text-zinc-600" strokeWidth={1.5} />
            <span className="text-[11px] text-zinc-600 font-mono">
              {!cleanPosterUrl ? 'search for a title to preview' : 'failed to load poster'}
            </span>
          </div>
        )}

        {/* Grid / safe-area overlays */}
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

        {/* Poster image — browser reads from cache pre-filled by the imperative preload */}
        {cleanPosterUrl && (
          <img
            key={cleanPosterUrl}
            src={cleanPosterUrl}
            alt="Poster preview"
            className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500 ${
              isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            draggable={false}
          />
        )}

        {/* Badges */}
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
              const s   = getScale(config.size) * (itemConfig?.scale ?? 1.0);
              const bW  = BASE_BADGE_W * s, bH = BASE_BADGE_H * s;
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
              x={x}
              y={y}
              canvasScale={currentScale}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              isSelected={selectedIds.has(id)}
              onSelect={onSelect}
              isObscuring={isObscuring}
              onHoverChange={(hovered) => setHoveredBadgeId(hovered ? id : null)}
              liveRating={liveRatings[id]}
            />
          );
        })}

        {/* Logo */}
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