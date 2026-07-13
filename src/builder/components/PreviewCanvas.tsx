// src/builder/components/PreviewCanvas.tsx
//
// posterBlur and grayscale are applied via CSS `filter` on this preview <img>
// for instant slider feedback during editing, avoiding a backend round-trip
// while dragging. The real exported poster URL (see url-generator.ts) still
// sends these as `pb`/`gs` query params so the final rendered image matches.

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { PosterConfig, RatingType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from '../types';
import DraggableBadge from './DraggableBadge';
import DraggableTitle from './DraggableTitle';
import DraggableLogo from './DraggableLogo';
import { DEFAULT_API_BASE } from '../utils/constants';
import { calculateAutoPosition, getScale, snapToGridSize } from '../utils/positioning';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { useEditor } from '../EditorContext';
import clsx from 'clsx';

const SNAP_CENTER_TOLERANCE = 8;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onLogoContextMenu?: (e: React.MouseEvent) => void;
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
  onLogoContextMenu,
  isFullscreen = false,
  rightSidebarWidth = 0,
  toggleFullscreen,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  const {
    viewOptions,
    clearSelection,
    liveRatings,
    liveYear,
    selectedLogo,
    selectedTitle,
    selectedMinimalElements,
    handleLogoSelection,
    handleTitleSelection,
  } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  const [autoScale, setAutoScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredBadgeId, setHoveredBadgeId] = useState<RatingType | null>(null);
  const [dragSession, setDragSession] = useState<{ id: string; dx: number; dy: number } | null>(
    null
  );
  const [isDraggingMinimalText, setIsDraggingMinimalText] = useState(false);
  const minimalTextStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);
  const [draggingMinimalRatingIndex, setDraggingMinimalRatingIndex] = useState<number | null>(null);
  const [draggingMinimalYear, setDraggingMinimalYear] = useState(false);
  const minimalRatingStartRef = useRef<{ mouseX: number; mouseY: number } | null>(null);
  const minimalDragRafRef = useRef<number | null>(null);
  const minimalPendingOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  const hasLiveRatings = Object.keys(liveRatings).length > 0;
  const previewRatings = useMemo(() => {
    if (!hasLiveRatings || config.fallbackEnabled) return config.ratings;
    return config.ratings.filter((id) => {
      if (id === 'year') return true;
      const v = liveRatings[id];
      return typeof v === 'string' ? v.trim().length > 0 : v !== undefined && v !== null;
    });
  }, [config.ratings, config.fallbackEnabled, liveRatings, hasLiveRatings]);
  const applySnapGrid = useCallback(
    (n: number) => (viewOptions?.snapToGrid ? snapToGridSize(n) : n),
    [viewOptions?.snapToGrid]
  );

  // rAF throttle for drag move updates
  const pendingDragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    },
    []
  );

  const getBadgeSize = useCallback(
    (id: RatingType, itemCfg: PosterConfig['items'][RatingType], baseValue?: string) => {
      const scale = getScale(config.size) * (itemCfg?.scale ?? config.scale ?? 1.0);
      const h = BASE_BADGE_H * scale;
      const textSize = Math.max(8, itemCfg?.textSize ?? 28) * scale;
      const textLetterSpacing = (itemCfg?.textLetterSpacing ?? 0) * scale;
      if (id !== 'year') return { w: BASE_BADGE_W * scale, h };
      const raw = (baseValue ?? liveYear ?? '').trim();
      const measured = raw.length > 0 ? raw : '2026';
      const w = Math.max(
        BASE_BADGE_W * scale,
        Math.ceil(measured.length * (textSize * 0.62 + textLetterSpacing) + 28 * scale)
      );
      return { w, h };
    },
    [config.scale, config.size, liveYear]
  );

  const getBadgeRect = (id: RatingType, index: number) => {
    const itemConfig = config.items[id];
    const auto = calculateAutoPosition(
      id,
      index,
      previewRatings.length,
      { ...config, ratings: previewRatings }
    );
    const x = itemConfig?.x ?? auto.x;
    const y = itemConfig?.y ?? auto.y;
    const { w, h } = getBadgeSize(id, itemConfig);
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
  }, []);

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
  const clampPan = useCallback(
    (newX: number, newY: number) => {
      const container = containerRef.current;
      if (!container) return { x: newX, y: newY };
      const scaledW = CANVAS_WIDTH * currentScale;
      const scaledH = CANVAS_HEIGHT * currentScale;
      const extraX = Math.max(0, (scaledW - container.clientWidth) / 2) + 40;
      const extraY = Math.max(0, (scaledH - container.clientHeight) / 2) + 40;
      const limitX = Math.max(CANVAS_WIDTH / 3, extraX);
      const limitY = Math.max(CANVAS_HEIGHT / 3, extraY);
      return {
        x: Math.max(-limitX, Math.min(limitX, newX)),
        y: Math.max(-limitY, Math.min(limitY, newY)),
      };
    },
    [currentScale]
  );

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

  const previewImageUrl = cleanPosterUrl;

  const posterCssFilter = useMemo(() => {
    const parts: string[] = [];
    if (config.posterBlur > 0) parts.push(`blur(${config.posterBlur}px)`);
    if (config.grayscale) parts.push('grayscale(1)');
    return parts.join(' ') || 'none';
  }, [config.posterBlur, config.grayscale]);

  useEffect(() => {
    setIsImageLoading(true);
    setImageError(false);
  }, [previewImageUrl]);

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
    const snap = (n: number) => (viewOptions?.snapToGrid ? snapToGridSize(n) : n);
    setConfig((prev) => {
      const currentX =
        prev.logoX !== null && prev.logoX !== undefined
          ? prev.logoX
          : Math.round((CANVAS_WIDTH - prev.logoW) / 2);
      const currentY = prev.logoY;
      let nextX = snap(currentX + dx);
      let nextY = snap(currentY + dy);
      const centerX = nextX + prev.logoW / 2;
      const centerY = nextY + prev.logoH / 2;
      const middleX = CANVAS_WIDTH / 2;
      const middleY = CANVAS_HEIGHT / 2;
      if (Math.abs(centerX - middleX) <= SNAP_CENTER_TOLERANCE) nextX = middleX - prev.logoW / 2;
      if (Math.abs(centerY - middleY) <= SNAP_CENTER_TOLERANCE) nextY = middleY - prev.logoH / 2;
      return {
        ...prev,
        logoX: Math.round(
          Math.max(1 - prev.logoW, Math.min(nextX, CANVAS_WIDTH - 1))
        ),
        logoY: Math.round(
          Math.max(1 - prev.logoH, Math.min(nextY, CANVAS_HEIGHT - 1))
        ),
      };
    });
  };

  const handleMinimalTextDragEnd = useCallback(
    (dx: number, dy: number) => {
      setConfig((prev) => {
        const ti = prev.items?.title ?? {};
        const boxW = Math.max(120, ti.textBoxWidth ?? 450);
        const boxH = Math.max(36, (ti.textSize ?? 48) * 1.5);
        const nextX = Math.max(0, Math.min(CANVAS_WIDTH - boxW, Math.round((ti.x ?? 25) + dx)));
        const nextY = Math.max(boxH, Math.min(CANVAS_HEIGHT, Math.round((ti.y ?? 100) + dy)));
        return { ...prev, items: { ...prev.items, title: { ...ti, x: nextX, y: nextY } } };
      });
    },
    [setConfig]
  );

  const handleMinimalRatingDragEnd = useCallback(
    (_index: number, dx: number, dy: number) => {
      setConfig((prev) => {
        const items = { ...prev.items };
        const imdbItem = { ...(items.imdb ?? { x: 340, y: 20 }) };
        imdbItem.x = Math.max(0, Math.min(CANVAS_WIDTH - 140, Math.round((imdbItem.x ?? 340) + dx)));
        imdbItem.y = Math.max(0, Math.min(CANVAS_HEIGHT - 40, Math.round((imdbItem.y ?? 20) + dy)));
        items.imdb = imdbItem;
        return { ...prev, items };
      });
    },
    [setConfig]
  );

  const handleMinimalYearDragEnd = useCallback(
    (dx: number, dy: number) => {
      setConfig((prev) => {
        const items = { ...prev.items };
        const yearItem = { ...(items.year ?? { x: 25, y: 683 }) };
        yearItem.x = Math.max(0, Math.min(CANVAS_WIDTH - 120, Math.round((yearItem.x ?? 25) + dx)));
        yearItem.y = Math.max(0, Math.min(CANVAS_HEIGHT - 40, Math.round((yearItem.y ?? 683) + dy)));
        items.year = yearItem;
        return { ...prev, items };
      });
    },
    [setConfig]
  );

  useEffect(() => {
    if (
      !isDraggingMinimalText &&
      draggingMinimalRatingIndex === null &&
      !draggingMinimalYear
    )
      return;
    const onMM = (e: MouseEvent) => {
      if (isDraggingMinimalText && minimalTextStartRef.current) {
        minimalPendingOffsetRef.current = {
          dx: (e.clientX - minimalTextStartRef.current.mouseX) / currentScale,
          dy: (e.clientY - minimalTextStartRef.current.mouseY) / currentScale,
        };
      } else if (draggingMinimalRatingIndex !== null && minimalRatingStartRef.current) {
        minimalPendingOffsetRef.current = {
          dx: (e.clientX - minimalRatingStartRef.current.mouseX) / currentScale,
          dy: (e.clientY - minimalRatingStartRef.current.mouseY) / currentScale,
        };
      }
      if (minimalDragRafRef.current === null) {
        minimalDragRafRef.current = requestAnimationFrame(() => {
          minimalDragRafRef.current = null;
          if (!minimalPendingOffsetRef.current) return;
        });
      }
    };
    const onMU = (e: MouseEvent) => {
      if (isDraggingMinimalText && minimalTextStartRef.current) {
        const dx = (e.clientX - minimalTextStartRef.current.mouseX) / currentScale;
        const dy = (e.clientY - minimalTextStartRef.current.mouseY) / currentScale;
        handleMinimalTextDragEnd(dx, dy);
      }
      if (draggingMinimalRatingIndex !== null && minimalRatingStartRef.current) {
        const dx = (e.clientX - minimalRatingStartRef.current.mouseX) / currentScale;
        const dy = (e.clientY - minimalRatingStartRef.current.mouseY) / currentScale;
        handleMinimalRatingDragEnd(draggingMinimalRatingIndex, dx, dy);
      }
      if (draggingMinimalYear && minimalRatingStartRef.current) {
        const dx = (e.clientX - minimalRatingStartRef.current.mouseX) / currentScale;
        const dy = (e.clientY - minimalRatingStartRef.current.mouseY) / currentScale;
        handleMinimalYearDragEnd(dx, dy);
      }
      minimalTextStartRef.current = null;
      minimalRatingStartRef.current = null;
      setIsDraggingMinimalText(false);
      setDraggingMinimalRatingIndex(null);
      setDraggingMinimalYear(false);
    };
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mouseup', onMU);
    return () => {
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mouseup', onMU);
      if (minimalDragRafRef.current !== null) {
        cancelAnimationFrame(minimalDragRafRef.current);
        minimalDragRafRef.current = null;
      }
    };
  }, [
    isDraggingMinimalText,
    draggingMinimalRatingIndex,
    draggingMinimalYear,
    currentScale,
    handleMinimalTextDragEnd,
    handleMinimalRatingDragEnd,
    handleMinimalYearDragEnd,
  ]);

  const handleDragMove = useCallback((id: string, dx: number, dy: number) => {
    if (!isFinite(dx) || !isFinite(dy)) return;
    pendingDragRef.current = { id, dx, dy };
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (pendingDragRef.current) setDragSession(pendingDragRef.current);
      });
    }
  }, []);

  const handleDragEnd = (id: string, dx: number, dy: number) => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    pendingDragRef.current = null;
    setDragSession(null);
    if (dx === 0 && dy === 0) return;

    if (id === 'title') {
      setConfig((prev: PosterConfig) => {
        const snap = (n: number) => (viewOptions?.snapToGrid ? snapToGridSize(n) : n);
        const ti = { ...(prev.items.title ?? {}) };
        const startX = ti.x ?? 25;
        const startY = ti.y ?? 100;
        // Compute visual container width matching DraggableTitle's dynamicWidth
        const sizeScale = getScale(prev.size);
        const itemScale = ti.scale ?? prev.scale ?? 1.0;
        const displayScale = itemScale * sizeScale;
        const textSize = Math.max(8, (ti.textSize ?? 48) * displayScale);
        const textLetterSpacing = (ti.textLetterSpacing ?? 0) * displayScale;
        const approxCharPx = Math.max(1, textSize * 0.54 + Math.max(0, textLetterSpacing));
        const legacyFromPx =
          ti.textBoxWidth && ti.textBoxWidth > 120
            ? Math.max(4, Math.round((ti.textBoxWidth - 16 * displayScale) / approxCharPx))
            : undefined;
        const titleCharWidth = Math.max(4, Math.min(80, Math.round(ti.textCharWidth ?? legacyFromPx ?? 24)));
        const dynamicWidth = Math.max(120, Math.round(titleCharWidth * approxCharPx + 16 * displayScale));
        const boxW = Math.max(120, ti.textBoxWidth ?? dynamicWidth);
        // Content height estimate matching DraggableTitle
        const textLineHeight = ti.textLineHeight ?? 1.1;
        const titleCharHeight = Math.max(1, Math.min(12, Math.round(ti.textCharHeight ?? 1)));
        const estimatedHeight = Math.max(32, Math.ceil(titleCharHeight * textSize * textLineHeight + 16 * displayScale));
        const boxH = Math.max(36, estimatedHeight);
        ti.x = Math.max(1 - boxW, Math.min(snap(startX + dx), CANVAS_WIDTH - 1));
        ti.y = Math.max(1 - boxH, Math.min(snap(startY + dy), CANVAS_HEIGHT - 1));
        return { ...prev, items: { ...prev.items, title: ti }, layout: 'custom', preset: 'custom' };
      });
      return;
    }

    setConfig((prev: PosterConfig) => {
      const snap = (n: number) => (viewOptions?.snapToGrid ? snapToGridSize(n) : n);
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
        if (startX === undefined) startX = 0;
        if (startY === undefined) startY = 0;
        const baseScale = getScale(prev.size) * (prev.items?.[targetId]?.scale ?? prev.scale ?? 1.0);
        const badgeW = BASE_BADGE_W * baseScale;
        const badgeH = BASE_BADGE_H * baseScale;
        const clampedX = Math.max(1 - badgeW, Math.min(snap(startX + dx), CANVAS_WIDTH - 1));
        const clampedY = Math.max(1 - badgeH, Math.min(snap(startY + dy), CANVAS_HEIGHT - 1));
        newItems[targetId] = { ...newItems[targetId], x: clampedX, y: clampedY };
      };

      if (selectedIds.has(id as RatingType) && selectedIds.size > 1) {
        selectedIds.forEach(applyDelta);
      } else {
        applyDelta(id as RatingType);
      }

      return { ...prev, items: newItems, layout: 'custom', preset: 'custom' };
    });
  };

  const badgeSnapGuide = useMemo(() => {
    if (!dragSession || !viewOptions?.snapToGrid) return null;
    const tid = dragSession.id as RatingType;
    const index = previewRatings.indexOf(tid);
    if (index === -1) return null;

    const auto = calculateAutoPosition(
      tid,
      index,
      previewRatings.length,
      { ...config, ratings: previewRatings }
    );
    const iCfg = config.items[tid];
    let x = iCfg?.x !== undefined ? iCfg.x : auto.x;
    let y = iCfg?.y !== undefined ? iCfg.y : auto.y;
    if (!isFinite(x)) x = auto.x;
    if (!isFinite(y)) y = auto.y;

    const { w: bW, h: bH } = getBadgeSize(tid, iCfg);
    const nextX = Math.max(1 - bW, Math.min(applySnapGrid(x + dragSession.dx), CANVAS_WIDTH - 1));
    const nextY = Math.max(1 - bH, Math.min(applySnapGrid(y + dragSession.dy), CANVAS_HEIGHT - 1));
    const centerX = nextX + bW / 2;
    const centerY = nextY + bH / 2;
    const middleX = CANVAS_WIDTH / 2;
    const middleY = CANVAS_HEIGHT / 2;
    return {
      showVertical: Math.abs(centerX - middleX) <= SNAP_CENTER_TOLERANCE,
      showHorizontal: Math.abs(centerY - middleY) <= SNAP_CENTER_TOLERANCE,
      middleX,
      middleY,
    };
  }, [dragSession, viewOptions?.snapToGrid, config, applySnapGrid, previewRatings]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[#18181b] touch-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          clearSelection();
        }
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
        className="bg-[#0c0c0e] shadow-2xl relative shrink-0 ring-1 ring-white/10 group will-change-transform overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            clearSelection();
          }
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
        {badgeSnapGuide?.showVertical && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: badgeSnapGuide.middleX,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(196,124,46,0.8)',
              transform: 'translateX(-50%)',
            }}
          />
        )}
        {badgeSnapGuide?.showHorizontal && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              top: badgeSnapGuide.middleY,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(196,124,46,0.8)',
              transform: 'translateY(-50%)',
            }}
          />
        )}

        {/* Poster image — FIX: posterBlur/grayscale via CSS filter, not URL param */}
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

        {/* Minimal preset gradient overlay — matches backend's bottom-quarter SVG gradient */}
        {(config.uiPreset ?? 'b') === 'm' && (
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 0%, transparent ${Math.round(CANVAS_HEIGHT * 0.75)}px, rgba(0,0,0,1) ${CANVAS_HEIGHT}px)`,
            }}
          />
        )}

        {/* Badge overlays */}
        {previewRatings.map((id: RatingType, index: number) => {
            const auto = calculateAutoPosition(
              id,
              index,
              previewRatings.length,
              { ...config, ratings: previewRatings }
            );
            const iCfg = config.items[id];
            let x = iCfg?.x !== undefined ? iCfg.x : auto.x;
            let y = iCfg?.y !== undefined ? iCfg.y : auto.y;
            if (!isFinite(x)) x = auto.x;
            if (!isFinite(y)) y = auto.y;

            let isObscuring = false;
            if (hoveredBadgeId && hoveredBadgeId !== id) {
              const hoveredIdx = previewRatings.indexOf(hoveredBadgeId);
              if (hoveredIdx !== -1) isObscuring = checkOverlap(id, index, hoveredBadgeId, hoveredIdx);
            }

            if (dragSession) {
              const isTarget = dragSession.id === id;
              const isGroup = selectedIds.has(dragSession.id as RatingType) && selectedIds.has(id);
              if (isTarget || isGroup) {
                const { w: bW, h: bH } = getBadgeSize(id, iCfg);
                // Preview clamp: at least 1px inside poster
                let nextX = x + dragSession.dx;
                let nextY = y + dragSession.dy;
                if (viewOptions?.snapToGrid) {
                  const centerX = nextX + bW / 2;
                  const centerY = nextY + bH / 2;
                  const middleX = CANVAS_WIDTH / 2;
                  const middleY = CANVAS_HEIGHT / 2;
                  if (Math.abs(centerX - middleX) <= SNAP_CENTER_TOLERANCE)
                    nextX = middleX - bW / 2;
                  if (Math.abs(centerY - middleY) <= SNAP_CENTER_TOLERANCE)
                    nextY = middleY - bH / 2;
                }
                x = Math.max(1 - bW, Math.min(nextX, CANVAS_WIDTH - 1));
                y = Math.max(1 - bH, Math.min(nextY, CANVAS_HEIGHT - 1));
              }
            }

            // Uniform mode: compute shared font size across all badges
            const uniformSize = config.uniform && config.ratings.length > 0
              ? Math.min(...config.ratings.map(r => {
                  const it = config.items[r];
                  const v = liveRatings[r];
                  const val = v ?? '';
                  const hasIcon = it?.icon ?? config.icon ?? true;
                  const len = String(val).length;
                  if (hasIcon) { if (len > 8) return 17; if (len > 5) return 21; return 27; }
                  if (len > 8) return 18; if (len > 5) return 22; return 28;
                }))
              : null;

            return (
              <DraggableBadge
                key={id}
                badgeId={id}
                config={config}
                uniformFontSize={uniformSize}
                value={
                  id === 'year'
                    ? liveYear.replace(/\.0+$/, '')
                    : liveRatings[id]
                }
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
                zIndex={100 + index}
              />
            );
          })}

        {config.titleEnabled && (
          <DraggableTitle
            config={config}
            canvasScale={currentScale}
            isSelected={selectedTitle}
            onSelect={handleTitleSelection}
            onDragMove={(dx, dy) => handleDragMove('title', dx, dy)}
            onDragEnd={(dx, dy) => handleDragEnd('title', dx, dy)}
            onContextMenu={(e) => onContextMenu?.('title', e)}
            dragOffsetX={dragSession?.id === 'title' ? dragSession.dx : 0}
            dragOffsetY={dragSession?.id === 'title' ? dragSession.dy : 0}
          />
        )}

        {config.logo && (
          <DraggableLogo
            config={config}
            logoUrl={logoPreviewUrl}
            canvasScale={currentScale}
            onDragEnd={handleLogoDragEnd}
            isSelected={selectedLogo || selectedMinimalElements.has('minimal-logo')}
            onSelect={(multi) => handleLogoSelection(multi)}
            onContextMenu={onLogoContextMenu}
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
