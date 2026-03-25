// src/components/builder/components/PreviewCanvas.tsx
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { PosterConfig, RatingType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
import DraggableLogo  from './DraggableLogo';
import { calculateAutoPosition, DEFAULT_API_BASE, getScale } from '../utils';
import { ZoomIn, ZoomOut, Maximize2, Loader2, AlertCircle } from 'lucide-react';
import { useEditor } from '../context/EditorContext';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  onContextMenu?: (id: RatingType, e: React.MouseEvent) => void;
  /** When true, hides the built-in zoom controls (fullscreen overlay provides its own) */
  isFullscreen?: boolean;
}

const PRELOAD_TIMEOUT_MS = 25_000;

const PreviewCanvas: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect, onContextMenu, isFullscreen = false }) => {
  const { viewOptions, mobileSheetMode, clearSelection, liveRatings } = useEditor();
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

  const posterSvgUrl = useMemo(() => {
    const id = config.imdbId || config.tmdbId;
    if (!id) return '';
    const pathSegment = config.imdbId
      ? `/poster/${config.imdbId}`
      : `/${config.mediaType}/${config.tmdbId}`;
    const u = new URL(`${DEFAULT_API_BASE}${pathSegment}.svg`);
    u.searchParams.set('source', config.source);
    if (config.ptype && config.ptype !== 'auto') u.searchParams.set('ptype', config.ptype);
    if (config.textless && !['metahub','imdb'].includes(config.source)) u.searchParams.set('textless', '1');
    if (config.posterBlur > 0) u.searchParams.set('bg_blur', config.posterBlur.toString());
    if (config.grayscale)      u.searchParams.set('bw', '1');
    return u.toString();
  }, [config.imdbId, config.tmdbId, config.mediaType, config.source, config.ptype, config.textless, config.posterBlur, config.grayscale]);

  useEffect(() => {
    if (!posterSvgUrl) { setIsImageLoading(false); setImageError(false); return; }
    setIsImageLoading(true); setImageError(false);
    let cancelled = false;
    const img = new Image();
    const safetyTimer = setTimeout(() => { if (!cancelled) { setIsImageLoading(false); setImageError(true); } }, PRELOAD_TIMEOUT_MS);
    img.onload  = () => { clearTimeout(safetyTimer); if (!cancelled) setIsImageLoading(false); };
    img.onerror = () => { clearTimeout(safetyTimer); if (!cancelled) { setIsImageLoading(false); setImageError(true); } };
    img.src = posterSvgUrl;
    return () => { cancelled = true; clearTimeout(safetyTimer); img.onload = null; img.onerror = null; img.src = ''; };
  }, [posterSvgUrl]);

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
    x: Math.max(-CANVAS_WIDTH / 2,  Math.min(CANVAS_WIDTH / 2,  x)),
    y: Math.max(-CANVAS_HEIGHT / 2, Math.min(CANVAS_HEIGHT / 2, y)),
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
    if (e.touches.length === 2)
      lastDist.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    else { setIsPanning(true); lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDist.current) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setZoomFlash(zoom * (dist / lastDist.current)); lastDist.current = dist;
    } else if (e.touches.length === 1 && lastPan.current && isPanning) {
      const dx = e.touches[0].clientX - lastPan.current.x, dy = e.touches[0].clientY - lastPan.current.y;
      setPan(p => clampPan(p.x + dx, p.y + dy)); lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const handleTouchEnd = () => { lastDist.current = null; lastPan.current = null; setIsPanning(false); };

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  useEffect(() => {
    const onReset = () => resetView();
    const onZoom  = (e: Event) => { const delta = (e as CustomEvent).detail as number; setZoomFlash(zoom + delta); };
    window.addEventListener('reset-canvas-view', onReset);
    window.addEventListener('canvas-zoom', onZoom);
    return () => {
      window.removeEventListener('reset-canvas-view', onReset);
      window.removeEventListener('canvas-zoom', onZoom);
    };
  }, [resetView, setZoomFlash, zoom]);

  const logoPreviewUrl = useMemo((): string | null => {
    if (!config.logo) return null;
    const id = config.imdbId || config.tmdbId;
    if (!id) return null;
    const u = new URL(`${DEFAULT_API_BASE}/${config.mediaType}/${id}/logo`);
    if (config.logoSource) u.searchParams.set('source', config.logoSource);
    return u.toString();
  }, [config.logo, config.tmdbId, config.imdbId, config.mediaType, config.logoSource]);

  const handleLogoDragEnd = useCallback((dx: number, dy: number) => {
    setConfig(prev => {
      const currentX = prev.logoX !== null && prev.logoX !== undefined
        ? prev.logoX : Math.round((CANVAS_WIDTH - prev.logoW) / 2);
      return {
        ...prev,
        // Clamp logo within canvas bounds
        logoX: Math.round(Math.max(0, Math.min(currentX + dx, CANVAS_WIDTH - prev.logoW))),
        logoY: Math.round(Math.max(0, Math.min(prev.logoY + dy, CANVAS_HEIGHT - prev.logoH))),
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
          else { newItems[r]!.x = newItems[r]!.x ?? auto.x; newItems[r]!.y = newItems[r]!.y ?? auto.y; }
        });
      }
      const applyDelta = (targetId: RatingType) => {
        const auto = calculateAutoPosition(targetId, prev.ratings.indexOf(targetId), prev.ratings.length, prev);
        if (!newItems[targetId]) newItems[targetId] = { x: auto.x, y: auto.y };
        const sx = newItems[targetId]!.x ?? auto.x;
        const sy = newItems[targetId]!.y ?? auto.y;
        const s  = getScale(prev.size) * (newItems[targetId]?.scale ?? 1.0);
        const bW = BASE_BADGE_W * s, bH = BASE_BADGE_H * s;
        newItems[targetId]!.x = Math.max(-bW + 1, Math.min(sx + dx, CANVAS_WIDTH - 1));
        newItems[targetId]!.y = Math.max(-bH + 1, Math.min(sy + dy, CANVAS_HEIGHT - 1));
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

  // Hide built-in zoom bar when fullscreen (fullscreen overlay provides its own)
  const showZoomControls = !isFullscreen;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden touch-none select-none"
      style={{ background: '#18181b' }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={e => { if (e.target === e.currentTarget) clearSelection(); }}
    >
      {/* Zoom controls — only shown when not in fullscreen */}
      {showZoomControls && (
        <div
          className="absolute right-3 flex flex-col items-center gap-1.5 z-30 transition-all duration-300"
          style={{
            bottom: mobileSheetMode === 'half' ? '58%' : 'calc(4rem + env(safe-area-inset-bottom, 0px))',
            opacity: mobileSheetMode === 'full' ? 0 : 1,
            pointerEvents: mobileSheetMode === 'full' ? 'none' : 'auto',
          }}
        >
          {/* Zoom % badge */}
          <div
            className="rounded-full px-2 py-0.5 text-[10px] font-mono pointer-events-none transition-opacity duration-300"
            style={{
              background: 'rgba(14,13,11,0.9)',
              border: '1px solid rgba(196,124,46,0.15)',
              color: 'var(--film-silver)',
              opacity: isZooming ? 1 : 0,
            }}
          >
            {Math.round(zoom * 100)}%
          </div>

          <div
            className="flex flex-col items-center gap-0.5 rounded-2xl p-1.5 shadow-xl"
            style={{ background: 'rgba(14,13,11,0.9)', border: '1px solid rgba(196,124,46,0.12)' }}
          >
            {[
              { icon: <ZoomIn size={17} />, action: () => setZoomFlash(zoom + 0.15), label: 'Zoom in' },
              { icon: <ZoomOut size={17} />, action: () => setZoomFlash(zoom - 0.15), label: 'Zoom out' },
            ].map((b, i) => (
              <button key={i} onClick={b.action} aria-label={b.label}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
                style={{ color: 'rgba(176,168,152,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget).style.color = '#D4A245'; (e.currentTarget).style.background = 'rgba(196,124,46,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(176,168,152,0.6)'; (e.currentTarget).style.background = 'transparent'; }}
              >
                {b.icon}
              </button>
            ))}
            <div className="w-5 h-px mx-auto my-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
            {/* Reset view icon — Maximize2 for consistency with fullscreen overlay */}
            <button onClick={resetView} title="Fit to screen (⌘1)"
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90"
              style={{ color: 'rgba(176,168,152,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget).style.color = 'var(--film-amber)'; (e.currentTarget).style.background = 'rgba(196,124,46,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(176,168,152,0.6)'; (e.currentTarget).style.background = 'transparent'; }}
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        style={{
          width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
          transition: isPanning ? 'none' : 'transform 0.18s cubic-bezier(0,0,0.2,1)',
          background: '#0c0c0e',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.8)',
        }}
        className="relative shrink-0 will-change-transform"
        onClick={e => { if (e.target === e.currentTarget) clearSelection(); }}
      >
        {isImageLoading && posterSvgUrl && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(9,9,11,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin" size={36} strokeWidth={2} style={{ color: 'var(--film-amber)' }} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(176,168,152,0.5)' }}>loading poster…</span>
            </div>
          </div>
        )}

        {(imageError || !posterSvgUrl) && !isImageLoading && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 pointer-events-none"
            style={{ background: 'rgba(9,9,11,0.7)' }}>
            <AlertCircle size={26} strokeWidth={1.5} style={{ color: 'rgba(140,130,112,0.4)' }} />
            <span className="text-[11px] font-mono" style={{ color: 'rgba(140,130,112,0.4)' }}>
              {!posterSvgUrl ? 'search for a title to preview' : 'failed to load poster'}
            </span>
          </div>
        )}

        {viewOptions?.showGrid && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div className="absolute top-0 bottom-0 left-1/3  border-l" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
            <div className="absolute top-0 bottom-0 left-2/3  border-l" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
            <div className="absolute left-0 right-0 top-1/3  border-t" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
            <div className="absolute left-0 right-0 top-2/3  border-t" style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
            <div className="absolute top-0 bottom-0 left-1/2  border-l" style={{ borderColor: 'rgba(196,124,46,0.25)' }} />
            <div className="absolute left-0 right-0 top-1/2  border-t" style={{ borderColor: 'rgba(196,124,46,0.25)' }} />
          </div>
        )}

        {viewOptions?.showSafeArea && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div className="absolute inset-8 border-2 border-dashed rounded-sm" style={{ borderColor: 'rgba(248,113,113,0.5)' }}>
              <div className="absolute top-1.5 left-2 text-[9px] font-mono uppercase tracking-wide rounded px-1"
                style={{ color: 'rgba(248,113,113,0.6)', background: 'rgba(0,0,0,0.5)' }}>
                Safe
              </div>
            </div>
          </div>
        )}

        {posterSvgUrl && (
          <img
            key={posterSvgUrl}
            src={posterSvgUrl}
            alt="Poster preview"
            className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-500 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
            draggable={false}
          />
        )}

        {config.ratings.map((id: RatingType, index: number) => {
          const auto       = calculateAutoPosition(id, index, config.ratings.length, config);
          const itemConfig = config.items[id];
          let x = itemConfig?.x !== undefined ? itemConfig.x : auto.x;
          let y = itemConfig?.y !== undefined ? itemConfig.y : auto.y;
          if (!isFinite(x)) x = auto.x;
          if (!isFinite(y)) y = auto.y;

          let isObscuring = false;
          if (hoveredBadgeId && hoveredBadgeId !== id)
            isObscuring = checkOverlap(id, index, hoveredBadgeId, config.ratings.indexOf(hoveredBadgeId));

          if (dragSession) {
            const isTarget = dragSession.id === id;
            const isGroup  = selectedIds.has(dragSession.id) && selectedIds.has(id);
            if (isTarget || isGroup) {
              const s  = getScale(config.size) * (itemConfig?.scale ?? 1.0);
              const bW = BASE_BADGE_W * s, bH = BASE_BADGE_H * s;
              x = Math.max(-bW + 1, Math.min(x + dragSession.dx, CANVAS_WIDTH - 1));
              y = Math.max(-bH + 1, Math.min(y + dragSession.dy, CANVAS_HEIGHT - 1));
            }
          }

          return (
            <DraggableBadge
              key={id}
              badgeId={id} config={config} x={x} y={y}
              canvasScale={currentScale}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              isSelected={selectedIds.has(id)}
              onSelect={onSelect}
              isObscuring={isObscuring}
              onHoverChange={hovered => setHoveredBadgeId(hovered ? id : null)}
              liveRating={liveRatings[id]}
              onContextMenu={onContextMenu}
            />
          );
        })}

        {config.logo && (
          <DraggableLogo
            config={config}
            logoUrl={logoPreviewUrl}
            canvasScale={currentScale}
            onDragEnd={handleLogoDragEnd}
            onLogoLoad={(w, h) => {
              if (w > 0 && h > 0) {
                setConfig(prev => ({ ...prev, logoH: Math.round(prev.logoW * (h / w)) }));
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewCanvas;
