// src/components/builder/index.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import clsx from 'clsx';
import type { PosterConfig, ExtensionType, ApiKeys, RatingType, BuilderMode } from './types';
import {
  DEFAULT_CONFIG,
  ALL_BADGES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
} from './types';
import { parseUrlToConfig, DEFAULT_API_BASE, calculateAutoPosition, getScale } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import LeftBuilderPanel from './components/panels/LeftBuilderPanel';
import RightInspectorPanel from './components/panels/RightInspectorPanel';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import TopToolbar from './components/layout/TopToolbar';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ResetDialog from './components/ResetDialogue';
import ImportDialog from './components/ImportDialogue';
import ExportPopover from './components/ExportPopover';
import { EditorProvider, useEditor } from './context/EditorContext';
import {
  ArrowDownToLine,
  ArrowUpToLine,
  CheckSquare,
  Contrast,
  Download,
  Eye,
  EyeOff,
  Grid3x3,
  Keyboard,
  Layers,
  PanelLeft,
  PanelRight,
  Maximize2,
  Minimize2,
  MousePointer2Off,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Type,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';
import ContextMenu, { type ContextMenuState, type LayerTargetId } from './components/ContextMenu';
import CommandPalette, { type PaletteCommand } from './components/CommandPalette';

const STORAGE_KEY = 'posterium_config_v2';
const MAX_QUERY_CONFIG_LENGTH = 12000; // Guard against oversized URL payloads/memory abuse in base64 config loading.

// ── Cookie helpers ────────────────────────────────────────────────────────────
const COOKIE_KEY = 'posterium_apikeys_v1';
const saveKeysToCookie = (keys: ApiKeys) => {
  try {
    const val = encodeURIComponent(JSON.stringify(keys));
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${val}; expires=${exp}; path=/; SameSite=Strict`;
  } catch {
    /* ignore */
  }
};
const loadKeysFromCookie = (): ApiKeys => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    if (!match) return {};
    return JSON.parse(decodeURIComponent(match[1])) || {};
  } catch {
    return {};
  }
};

// ── Zoom/Fullscreen Overlay ───────────────────────────────────────────────────
const ZoomOverlay = memo<{
  isFullscreen: boolean;
  rightSidebarWidth: number;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isMobile: boolean;
}>(
  ({
    isFullscreen,
    rightSidebarWidth,
    onToggleFullscreen,
    onZoomIn,
    onZoomOut,
    onResetView,
    isMobile,
  }) => (
    <div
      className={`fixed z-40 flex items-center gap-1 rounded-xl select-none ${isMobile ? 'flex-row' : 'flex-col'}`}
      style={{
        ...(isMobile
          ? { bottom: 76, right: 12 }
          : {
              top: '50%',
              transform: 'translateY(-50%)',
              right: isFullscreen ? 20 : rightSidebarWidth + 20,
              transition: 'right 0.3s cubic-bezier(0.16,1,0.3,1)',
            }),
        background: 'rgba(14,13,11,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(196,124,46,0.18)',
        padding: '6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
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
      {/* Divider — hidden on mobile */}
      {!isMobile && (
        <div
          style={{ width: 20, height: 1, background: 'rgba(255,255,255,0.08)', margin: '2px 0' }}
        />
      )}
      {/* Fullscreen toggle — desktop only */}
      {!isMobile && (
        <button
          onClick={onToggleFullscreen}
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
      )}
    </div>
  )
);
ZoomOverlay.displayName = 'ZoomOverlay';

// ── Studio layout ─────────────────────────────────────────────────────────────
const StudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  initialMode?: BuilderMode;
}> = ({
  config,
  setConfig,
  handleReset,
  baseUrl,
  handleLoadConfig,
  undo,
  redo,
  canUndo,
  canRedo,
  initialMode = 'advanced',
}) => {
  const {
    activeTab,
    mobileSheetMode,
    setMobileSheetMode,
    selectedIds,
    selectedLogo,
    selectedMinimalElements,
    handleSelection,
    handleLogoSelection,
    clearSelection,
    setBatchSelection,
    viewOptions,
    toggleViewOption,
  } = useEditor();

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [builderMode, setBuilderModeState] = useState<BuilderMode>(() => {
    try {
      return (
        (localStorage.getItem('posterium_builder_mode_v1') as BuilderMode | null) ?? initialMode
      );
    } catch {
      return initialMode;
    }
  });
  const setBuilderMode = useCallback((mode: BuilderMode) => {
    setBuilderModeState(mode);
    setLeftVisible(mode === 'advanced');
    setRightVisible(true);
    try {
      localStorage.setItem('posterium_builder_mode_v1', mode);
    } catch {
      /* ignore */
    }
  }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const importBtnRef = useRef<HTMLButtonElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handle = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    badgeId: null,
  });
  const openCtxMenu = useCallback((badgeId: LayerTargetId, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, badgeId });
  }, []);
  const closeCtxMenu = useCallback(() => setCtxMenu((s) => ({ ...s, visible: false })), []);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const selectedIdsRef = useRef(selectedIds);
  const selectedLogoRef = useRef(selectedLogo);
  const selectedMinimalElementsRef = useRef(selectedMinimalElements);
  const configRatingsRef = useRef(config.ratings);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  });
  useEffect(() => {
    selectedLogoRef.current = selectedLogo;
  });
  useEffect(() => {
    selectedMinimalElementsRef.current = selectedMinimalElements;
  });
  useEffect(() => {
    configRatingsRef.current = config.ratings;
  });

  const dispatchZoom = useCallback(
    (delta: number) => window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: delta })),
    []
  );
  const dispatchResetView = useCallback(
    () => window.dispatchEvent(new CustomEvent('reset-canvas-view')),
    []
  );
  const nudgeSelection = useCallback(
    (dx: number, dy: number) => {
      const activeBadges = Array.from(selectedIdsRef.current);
      const activeMinimal = Array.from(selectedMinimalElementsRef.current);
      const hasLogo = selectedLogoRef.current || activeMinimal.includes('minimal-logo');
      if (activeBadges.length === 0 && activeMinimal.length === 0 && !hasLogo) return;
      setConfig((prev) => {
        const next: PosterConfig = { ...prev, items: { ...prev.items } };
        if (activeBadges.length > 0) {
          activeBadges.forEach((id) => {
            const base = next.items[id] ?? {};
            const idx = next.ratings.indexOf(id);
            const auto = calculateAutoPosition(id, Math.max(0, idx), next.ratings.length, next);
            const currX = base.x ?? auto.x;
            const currY = base.y ?? auto.y;
            const scale = getScale(next.size) * (base.scale ?? next.scale ?? 1.0);
            const w = BASE_BADGE_W * scale;
            const h = BASE_BADGE_H * scale;
            next.items[id] = {
              ...base,
              x: Math.max(1 - w, Math.min(currX + dx, CANVAS_WIDTH - 1)),
              y: Math.max(1 - h, Math.min(currY + dy, CANVAS_HEIGHT - 1)),
            };
          });
          next.layout = 'custom';
          next.preset = 'custom';
        }
        if (hasLogo) {
          const currentX =
            next.logoX !== null && next.logoX !== undefined
              ? next.logoX
              : Math.round((CANVAS_WIDTH - next.logoW) / 2);
          next.logoX = Math.max(1 - next.logoW, Math.min(currentX + dx, CANVAS_WIDTH - 1));
          next.logoY = Math.max(1 - next.logoH, Math.min(next.logoY + dy, CANVAS_HEIGHT - 1));
        }
        if (activeMinimal.includes('minimal-title')) {
          const boxW = Math.max(120, next.minimalTitleWidth ?? 420);
          const boxH = Math.max(36, (next.minimalTextSize ?? 42) * 1.5);
          next.minimalTextX = Math.max(0, Math.min(CANVAS_WIDTH - boxW, next.minimalTextX + dx));
          const flow = next.minimalTitleFlow ?? 'up';
          next.minimalTextY =
            flow === 'up'
              ? Math.max(boxH, Math.min(CANVAS_HEIGHT, next.minimalTextY + dy))
              : Math.max(0, Math.min(CANVAS_HEIGHT - boxH, next.minimalTextY + dy));
        }
        if (activeMinimal.includes('minimal-year')) {
          next.minimalMetaX = Math.max(
            0,
            Math.min(CANVAS_WIDTH - 120, (next.minimalMetaX ?? 26) + dx)
          );
          next.minimalMetaY = Math.max(
            0,
            Math.min(CANVAS_HEIGHT - 40, (next.minimalMetaY ?? 672) + dy)
          );
        }
        if (activeMinimal.includes('minimal-duration')) {
          next.minimalDurationX = Math.max(
            0,
            Math.min(CANVAS_WIDTH - 120, (next.minimalDurationX ?? 90) + dx)
          );
          next.minimalDurationY = Math.max(
            0,
            Math.min(CANVAS_HEIGHT - 40, (next.minimalDurationY ?? 672) + dy)
          );
        }
        if (activeMinimal.some((id) => id.startsWith('minimal-rating-'))) {
          const list = [...(next.minimalRatings ?? [])];
          activeMinimal
            .filter((id) => id.startsWith('minimal-rating-'))
            .forEach((id) => {
              const idx = (() => {
                const parts = id.split('-');
                return Number(parts[parts.length - 1] ?? -1);
              })();
              if (!Number.isFinite(idx) || !list[idx]) return;
              list[idx] = {
                ...list[idx],
                x: Math.max(0, Math.min(CANVAS_WIDTH - 140, list[idx].x + dx)),
                y: Math.max(0, Math.min(CANVAS_HEIGHT - 40, list[idx].y + dy)),
              };
            });
          next.minimalRatings = list;
        }
        return next;
      });
    },
    [setConfig]
  );

  // Auto-open Edit panel on mobile when badge is tapped — DISABLED (drawer requires deliberate open)
  const handleSelectionOverride = useCallback(
    (id: RatingType, multi: boolean) => {
      handleSelection(id, multi);
    },
    [handleSelection]
  );

  const moveLayer = useCallback(
    (id: RatingType, direction: 'front' | 'forward' | 'back' | 'toback') => {
      setConfig((prev) => {
        const arr = [...prev.ratings];
        const idx = arr.indexOf(id);
        if (idx === -1) return prev;
        arr.splice(idx, 1);
        if (direction === 'front') arr.push(id);
        else if (direction === 'forward') arr.splice(Math.min(idx + 1, arr.length), 0, id);
        else if (direction === 'back') arr.splice(Math.max(idx - 1, 0), 0, id);
        else arr.unshift(id);
        return { ...prev, ratings: arr };
      });
    },
    [setConfig]
  );

  const hideBadge = useCallback(
    (id: RatingType) => {
      setConfig((prev) => ({ ...prev, ratings: prev.ratings.filter((r) => r !== id) }));
      clearSelection();
    },
    [setConfig, clearSelection]
  );

  const showAllBadges = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      ratings: ALL_BADGES.map((b) => b.id).filter(
        (id) => prev.ratings.includes(id) || !prev.ratings.includes(id)
      ),
    }));
  }, [setConfig]);

  const resetBadge = useCallback(
    (id: RatingType) => {
      setConfig((prev) => {
        const ni = { ...prev.items };
        delete ni[id];
        return { ...prev, items: ni };
      });
    },
    [setConfig]
  );

  const deleteBadge = useCallback(
    (id: RatingType) => {
      setConfig((prev) => ({ ...prev, ratings: prev.ratings.filter((r) => r !== id) }));
      clearSelection();
    },
    [setConfig, clearSelection]
  );
  const moveLogoLayer = useCallback(
    (direction: 'front' | 'forward' | 'back' | 'toback') => {
      setConfig((prev) => {
        const current = prev.logoZ ?? 90;
        if (direction === 'front') return { ...prev, logoZ: 220 };
        if (direction === 'toback') return { ...prev, logoZ: 1 };
        if (direction === 'forward') return { ...prev, logoZ: Math.min(220, current + 1) };
        return { ...prev, logoZ: Math.max(1, current - 1) };
      });
    },
    [setConfig]
  );
  const hideLayer = useCallback(
    (id: LayerTargetId) => {
      if (id === 'logo') {
        setConfig((prev) => ({ ...prev, logo: false }));
        clearSelection();
        return;
      }
      hideBadge(id);
    },
    [setConfig, clearSelection, hideBadge]
  );
  const resetLayer = useCallback(
    (id: LayerTargetId) => {
      if (id === 'logo') {
        setConfig((prev) => ({
          ...prev,
          logoX: DEFAULT_CONFIG.logoX,
          logoY: DEFAULT_CONFIG.logoY,
          logoW: DEFAULT_CONFIG.logoW,
          logoH: DEFAULT_CONFIG.logoH,
          logoOpacity: DEFAULT_CONFIG.logoOpacity,
          logoZ: DEFAULT_CONFIG.logoZ,
          logoShadow: DEFAULT_CONFIG.logoShadow,
          logoBgEnabled: DEFAULT_CONFIG.logoBgEnabled,
          logoBgColor: DEFAULT_CONFIG.logoBgColor,
          logoBgOpacity: DEFAULT_CONFIG.logoBgOpacity,
          logoBgRadius: DEFAULT_CONFIG.logoBgRadius,
          logoBgPadding: DEFAULT_CONFIG.logoBgPadding,
          logoBgBorderW: DEFAULT_CONFIG.logoBgBorderW,
          logoBgBorderC: DEFAULT_CONFIG.logoBgBorderC,
          logoBgShadow: DEFAULT_CONFIG.logoBgShadow,
        }));
        return;
      }
      resetBadge(id);
    },
    [setConfig, resetBadge]
  );
  const deleteLayer = useCallback(
    (id: LayerTargetId) => {
      if (id === 'logo') {
        setConfig((prev) => ({ ...prev, logo: false }));
        clearSelection();
        return;
      }
      deleteBadge(id);
    },
    [setConfig, clearSelection, deleteBadge]
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          return;
        }
        if (paletteOpen) {
          setPaletteOpen(false);
          return;
        }
        if (exportOpen) {
          setExportOpen(false);
          return;
        }
        if (isFullscreen) {
          setIsFullscreen(false);
          return;
        }
        if (selectedIds.size > 0 || selectedLogo) {
          clearSelection();
          return;
        }
        return;
      }
      if (mod && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (mod && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }
      if (inInput) return;
      if (
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight') &&
        (selectedIdsRef.current.size > 0 ||
          selectedLogoRef.current ||
          selectedMinimalElementsRef.current.size > 0)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') nudgeSelection(0, -step);
        else if (e.key === 'ArrowDown') nudgeSelection(0, step);
        else if (e.key === 'ArrowLeft') nudgeSelection(-step, 0);
        else if (e.key === 'ArrowRight') nudgeSelection(step, 0);
        return;
      }
      if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setBatchSelection(configRatingsRef.current);
        return;
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        clearSelection();
        return;
      }
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        (selectedIdsRef.current.size > 0 || selectedLogoRef.current)
      ) {
        e.preventDefault();
        const rm = new Set(selectedIdsRef.current);
        if (rm.size > 0) {
          setConfig((p) => ({ ...p, ratings: p.ratings.filter((r) => !rm.has(r)) }));
        }
        clearSelection();
        return;
      }
      if (selectedIdsRef.current.size > 0) {
        const sel = Array.from(selectedIdsRef.current);
        if (mod && e.shiftKey && e.key === ']') {
          e.preventDefault();
          sel.forEach((id) => moveLayer(id as RatingType, 'front'));
          return;
        }
        if (mod && e.shiftKey && e.key === '[') {
          e.preventDefault();
          sel.forEach((id) => moveLayer(id as RatingType, 'toback'));
          return;
        }
        if (mod && e.key === ']') {
          e.preventDefault();
          sel.forEach((id) => moveLayer(id as RatingType, 'forward'));
          return;
        }
        if (mod && e.key === '[') {
          e.preventDefault();
          sel.forEach((id) => moveLayer(id as RatingType, 'back'));
          return;
        }
        if (e.key.toLowerCase() === 'h' && !mod) {
          e.preventDefault();
          sel.forEach((id) => hideBadge(id as RatingType));
          return;
        }
      }
      if (e.key.toLowerCase() === 'f' && !mod && isDesktop) {
        e.preventDefault();
        setIsFullscreen((v) => !v);
        return;
      }
      if (e.key.toLowerCase() === 'g' && !mod) {
        e.preventDefault();
        toggleViewOption('showGrid');
        return;
      }
      if (e.key === "'" && !mod) {
        e.preventDefault();
        toggleViewOption('showSafeArea');
        return;
      }
      if (mod && e.key === '1') {
        e.preventDefault();
        dispatchResetView();
        return;
      }
      if (mod && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        dispatchZoom(0.25);
        return;
      }
      if (mod && e.key === '-') {
        e.preventDefault();
        dispatchZoom(-0.25);
        return;
      }
      if (e.key === '[' && !mod && !e.shiftKey) {
        e.preventDefault();
        setLeftVisible((v) => !v);
        return;
      }
      if (e.key === ']' && !mod && !e.shiftKey) {
        e.preventDefault();
        setRightVisible((v) => !v);
        return;
      }
      if (e.key === 'Tab' && !mod) {
        const ratings = configRatingsRef.current;
        if (ratings.length === 0) return;
        e.preventDefault();
        const selArr = Array.from(selectedIdsRef.current);
        const lastSel = selArr[selArr.length - 1];
        const idx = lastSel ? ratings.indexOf(lastSel) : -1;
        const next = ratings[(idx + (e.shiftKey ? -1 + ratings.length : 1)) % ratings.length];
        setBatchSelection([next]);
        return;
      }
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setConfig((p) => ({ ...p, posterBlur: p.posterBlur > 0 ? 0 : 8 }));
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    undo,
    redo,
    setConfig,
    clearSelection,
    setBatchSelection,
    moveLayer,
    hideBadge,
    toggleViewOption,
    dispatchZoom,
    dispatchResetView,
    nudgeSelection,
    isFullscreen,
    paletteOpen,
    shortcutsOpen,
    exportOpen,
    selectedIds,
    selectedLogo,
    selectedMinimalElements,
    isDesktop,
  ]);

  // ── Panel widths ──────────────────────────────────────────────────────────
  const [leftW, setLeftW] = useState(272);
  const [rightW, setRightW] = useState(272);

  const startResizeLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const sx = e.clientX,
        sw = leftW;
      const move = (m: MouseEvent) => setLeftW(Math.max(220, Math.min(sw + m.clientX - sx, 540)));
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.body.style.cursor = '';
        document.body.classList.remove('sidebar-resizing');
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.body.style.cursor = 'col-resize';
      document.body.classList.add('sidebar-resizing');
    },
    [leftW]
  );

  const startResizeRight = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const sx = e.clientX,
        sw = rightW;
      const move = (m: MouseEvent) =>
        setRightW(Math.max(248, Math.min(sw - (m.clientX - sx), 540)));
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.body.style.cursor = '';
        document.body.classList.remove('sidebar-resizing');
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.body.style.cursor = 'col-resize';
      document.body.classList.add('sidebar-resizing');
    },
    [rightW]
  );

  const handleExtensionChange = useCallback(
    (ext: ExtensionType) => {
      setConfig((prev) => ({ ...prev, extension: ext }));
    },
    [setConfig]
  );

  // ── Command palette commands ──────────────────────────────────────────────
  const paletteCommands: PaletteCommand[] = [
    {
      id: 'zoom-fit',
      label: 'Zoom to Fit',
      category: 'View & Canvas',
      icon: <Maximize2 size={13} />,
      shortcut: '⌘1',
      keywords: ['reset', 'fit', 'view'],
      action: dispatchResetView,
    },
    {
      id: 'zoom-in',
      label: 'Zoom In',
      category: 'View & Canvas',
      icon: <ZoomIn size={13} />,
      shortcut: '⌘+',
      action: () => dispatchZoom(0.25),
    },
    {
      id: 'zoom-out',
      label: 'Zoom Out',
      category: 'View & Canvas',
      icon: <ZoomOut size={13} />,
      shortcut: '⌘-',
      action: () => dispatchZoom(-0.25),
    },
    {
      id: 'fullscreen',
      label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Canvas',
      category: 'View & Canvas',
      icon: isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />,
      shortcut: 'F',
      action: toggleFullscreen,
    },
    {
      id: 'grid',
      label: `${viewOptions.showGrid ? 'Hide' : 'Show'} Grid Overlay`,
      category: 'View & Canvas',
      icon: <Grid3x3 size={13} />,
      shortcut: 'G',
      keywords: ['grid', 'lines'],
      action: () => toggleViewOption('showGrid'),
    },
    {
      id: 'safe-area',
      label: `${viewOptions.showSafeArea ? 'Hide' : 'Show'} Safe Area`,
      category: 'View & Canvas',
      icon: <ShieldCheck size={13} />,
      shortcut: "'",
      keywords: ['safe', 'area', 'zone'],
      action: () => toggleViewOption('showSafeArea'),
    },
    {
      id: 'sidebar-left',
      label: `${leftVisible ? 'Hide' : 'Show'} Left Sidebar`,
      category: 'View & Canvas',
      icon: <PanelLeft size={13} />,
      shortcut: '[',
      keywords: ['layers', 'source', 'panel'],
      action: () => setLeftVisible((v) => !v),
    },
    {
      id: 'sidebar-right',
      label: `${rightVisible ? 'Hide' : 'Show'} Right Sidebar`,
      category: 'View & Canvas',
      icon: <PanelRight size={13} />,
      shortcut: ']',
      keywords: ['inspector', 'panel'],
      action: () => setRightVisible((v) => !v),
    },
    {
      id: 'shortcuts-help',
      label: 'Show Keyboard Shortcuts',
      category: 'View & Canvas',
      icon: <Keyboard size={13} />,
      shortcut: '⌘/',
      keywords: ['help', 'keys', 'hotkeys'],
      action: () => setShortcutsOpen(true),
    },
    {
      id: 'select-all',
      label: 'Select All Badges',
      category: 'Layers & Selection',
      icon: <CheckSquare size={13} />,
      shortcut: '⌘A',
      action: () => setBatchSelection(config.ratings),
    },
    {
      id: 'deselect-all',
      label: 'Deselect All',
      category: 'Layers & Selection',
      icon: <MousePointer2Off size={13} />,
      shortcut: '⌘D',
      action: clearSelection,
    },
    {
      id: 'show-all',
      label: 'Show All Badges',
      category: 'Layers & Selection',
      icon: <Eye size={13} />,
      keywords: ['reveal', 'unhide'],
      action: showAllBadges,
    },
    {
      id: 'hide-sel',
      label: 'Hide Selected Badges',
      category: 'Layers & Selection',
      icon: <EyeOff size={13} />,
      shortcut: 'H',
      keywords: ['hide', 'selected'],
      action: () => Array.from(selectedIds).forEach((id) => hideBadge(id as RatingType)),
    },
    {
      id: 'layer-front',
      label: 'Bring to Front',
      category: 'Layers & Selection',
      icon: <ArrowUpToLine size={13} />,
      shortcut: '⌘⇧]',
      action: () => Array.from(selectedIds).forEach((id) => moveLayer(id as RatingType, 'front')),
    },
    {
      id: 'layer-back',
      label: 'Send to Back',
      category: 'Layers & Selection',
      icon: <ArrowDownToLine size={13} />,
      shortcut: '⌘⇧[',
      action: () => Array.from(selectedIds).forEach((id) => moveLayer(id as RatingType, 'toback')),
    },
    {
      id: 'delete-sel',
      label: 'Delete Selected Badges',
      category: 'Layers & Selection',
      icon: <Layers size={13} />,
      shortcut: 'Del',
      keywords: ['remove', 'delete'],
      action: () => {
        const rm = new Set(selectedIds);
        setConfig((p) => ({ ...p, ratings: p.ratings.filter((r) => !rm.has(r)) }));
        clearSelection();
      },
    },
    {
      id: 'grayscale',
      label: `${config.grayscale ? 'Remove' : 'Apply'} Grayscale`,
      category: 'Canvas Properties',
      icon: <Contrast size={13} />,
      keywords: ['grayscale', 'bw', 'black', 'white'],
      action: () => setConfig((p) => ({ ...p, grayscale: !p.grayscale })),
    },
    {
      id: 'blur-0',
      label: 'Remove Poster Blur',
      category: 'Canvas Properties',
      icon: <ScanLine size={13} />,
      keywords: ['blur', 'clear', 'sharp'],
      action: () => setConfig((p) => ({ ...p, posterBlur: 0 })),
    },
    {
      id: 'blur-8',
      label: 'Poster Blur: Medium (8px)',
      category: 'Canvas Properties',
      icon: <ScanLine size={13} />,
      keywords: ['blur', 'medium'],
      action: () => setConfig((p) => ({ ...p, posterBlur: 8 })),
    },
    {
      id: 'toggle-text',
      label: `${config.showText !== false ? 'Hide' : 'Show'} Rating Text`,
      category: 'Badges',
      icon: <Type size={13} />,
      keywords: ['text', 'numbers', 'rating', 'show', 'hide'],
      action: () => setConfig((p) => ({ ...p, showText: !(p.showText !== false) })),
    },
    {
      id: 'export-svg',
      label: 'Export as SVG',
      category: 'Export',
      icon: <Download size={13} />,
      action: () => {
        setConfig((p) => ({ ...p, extension: 'svg' }));
        setExportOpen(true);
      },
    },
    {
      id: 'export-png',
      label: 'Export as PNG',
      category: 'Export',
      icon: <Download size={13} />,
      action: () => {
        setConfig((p) => ({ ...p, extension: 'png' }));
        setExportOpen(true);
      },
    },
    {
      id: 'export-jpg',
      label: 'Export as JPG',
      category: 'Export',
      icon: <Download size={13} />,
      action: () => {
        setConfig((p) => ({ ...p, extension: 'jpg' }));
        setExportOpen(true);
      },
    },
    {
      id: 'reset',
      label: 'Reset All Settings',
      category: 'File',
      icon: <RotateCcw size={13} />,
      keywords: ['reset', 'clear', 'default'],
      action: () => setIsResetOpen(true),
    },
    {
      id: 'undo',
      label: 'Undo',
      category: 'File',
      icon: <Undo2 size={13} />,
      shortcut: '⌘Z',
      action: undo,
    },
    {
      id: 'redo',
      label: 'Redo',
      category: 'File',
      icon: <Redo2 size={13} />,
      shortcut: '⌘Y',
      action: redo,
    },
  ];

  const ctxBadgeSelected = ctxMenu.badgeId
    ? ctxMenu.badgeId === 'logo'
      ? selectedLogo
      : selectedIds.has(ctxMenu.badgeId)
    : false;

  return (
    <>
      <a
        href="#main-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium select-none"
        style={{ background: 'var(--film-amber)', color: '#070706' }}
      >
        Skip to canvas
      </a>

      <style>{`
        .builder-ui, .builder-ui * { user-select: none; -webkit-user-select: none; }
        .builder-ui input, .builder-ui textarea, .builder-ui [contenteditable] {
          user-select: text; -webkit-user-select: text;
        }
        .sidebar-transition { transition: width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease; }
        .sidebar-resizing .sidebar-transition { transition: opacity 0.2s ease !important; }
      `}</style>

      <div
        className="builder-ui flex flex-col overflow-hidden"
        style={{
          height: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <h1 className="sr-only">Posterium Poster Builder</h1>

        <ResetDialog
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          onConfirm={handleReset}
        />
        <ImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onLoad={handleLoadConfig}
          anchorRef={importBtnRef}
        />
        <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <ContextMenu
          state={ctxMenu}
          onClose={closeCtxMenu}
          isSelected={ctxBadgeSelected}
          onBringToFront={(id) => (id === 'logo' ? moveLogoLayer('front') : moveLayer(id, 'front'))}
          onBringForward={(id) =>
            id === 'logo' ? moveLogoLayer('forward') : moveLayer(id, 'forward')
          }
          onSendBackward={(id) => (id === 'logo' ? moveLogoLayer('back') : moveLayer(id, 'back'))}
          onSendToBack={(id) => (id === 'logo' ? moveLogoLayer('toback') : moveLayer(id, 'toback'))}
          onHide={hideLayer}
          onShowAll={showAllBadges}
          onSelect={(id) =>
            id === 'logo' ? handleLogoSelection(false) : handleSelectionOverride(id, false)
          }
          onDeselect={() => clearSelection()}
          onSelectAll={() => setBatchSelection(config.ratings)}
          onDeselectAll={clearSelection}
          onResetBadge={resetLayer}
          onDelete={deleteLayer}
        />
        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          commands={paletteCommands}
        />

        {/* Export popover */}
        <ExportPopover
          config={config}
          onLoadConfig={handleLoadConfig}
          baseUrl={baseUrl}
          onExtensionChange={handleExtensionChange}
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          anchorRef={exportBtnRef}
        />

        {/* ── HEADER ── */}
        {!isFullscreen && (
          <TopToolbar
            builderMode={builderMode}
            onBuilderModeChange={setBuilderMode}
            leftVisible={leftVisible}
            rightVisible={rightVisible}
            shortcutsOpen={shortcutsOpen}
            exportOpen={exportOpen}
            canUndo={canUndo}
            canRedo={canRedo}
            importBtnRef={importBtnRef}
            exportBtnRef={exportBtnRef}
            onToggleLeft={() => setLeftVisible((v) => !v)}
            onToggleRight={() => setRightVisible((v) => !v)}
            onOpenPalette={() => setPaletteOpen(true)}
            onToggleShortcuts={() => setShortcutsOpen((v) => !v)}
            onUndo={undo}
            onRedo={redo}
            onOpenImport={() => setIsImportOpen(true)}
            onToggleExport={() => setExportOpen((v) => !v)}
            onOpenReset={() => setIsResetOpen(true)}
          />
        )}

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden relative flex-col lg:flex-row">
          {/* Left sidebar */}
          {!isFullscreen && builderMode === 'advanced' && (
            <LeftBuilderPanel
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              onSelect={handleSelectionOverride}
              onResizeStart={startResizeLeft}
              visible={leftVisible}
              width={leftW}
            />
          )}

          {/* Canvas */}
          <main
            id="main-canvas"
            role="main"
            aria-label="Poster canvas"
            className="flex-1 relative overflow-hidden min-h-0"
            style={{ background: '#111113' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) clearSelection();
              if (mobileSheetMode !== 'hidden') setMobileSheetMode('hidden');
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Sidebar Canvas Toggles removed — now in navbar */}

            <PreviewCanvas
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              onSelect={handleSelectionOverride}
              onContextMenu={openCtxMenu}
              onLogoContextMenu={(e) => openCtxMenu('logo', e)}
            />
            {/* Film corner accents */}
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
              <div
                key={c}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: c.startsWith('t') ? 8 : 'auto',
                  bottom: c.startsWith('b') ? 8 : 'auto',
                  left: c.endsWith('l') ? 8 : 'auto',
                  right: c.endsWith('r') ? 8 : 'auto',
                  width: 12,
                  height: 12,
                  pointerEvents: 'none',
                  borderTop: c.startsWith('t') ? '1px solid rgba(196,124,46,0.18)' : 'none',
                  borderBottom: c.startsWith('b') ? '1px solid rgba(196,124,46,0.18)' : 'none',
                  borderLeft: c.endsWith('l') ? '1px solid rgba(196,124,46,0.18)' : 'none',
                  borderRight: c.endsWith('r') ? '1px solid rgba(196,124,46,0.18)' : 'none',
                }}
              />
            ))}
          </main>

          {/* Right sidebar */}
          {!isFullscreen && (
            <RightInspectorPanel
              config={config}
              setConfig={setConfig}
              onResizeStart={startResizeRight}
              visible={rightVisible}
              width={rightW}
            />
          )}

          {/* Mobile Panel (In-flow flex item) */}
          {!isFullscreen && (
            <div
              className={clsx(
                'lg:hidden flex flex-col shrink-0 w-full bg-[var(--film-dark)] transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden z-20',
                mobileSheetMode !== 'hidden'
                  ? 'h-[45dvh] border-t border-[rgba(196,124,46,0.15)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]'
                  : 'h-0 border-t-0'
              )}
            >
              {/* Swipe-down dismiss handle */}
              <div
                className="shrink-0 h-8 flex items-center justify-center bg-[rgba(255,255,255,0.01)] border-b border-[rgba(255,255,255,0.04)] active:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer select-none"
                onClick={() => setMobileSheetMode('hidden')}
                onTouchStart={(e) => {
                  const startY = e.touches[0].clientY;
                  const onMove = (ev: TouchEvent) => {
                    if (ev.touches[0].clientY - startY > 40) {
                      setMobileSheetMode('hidden');
                      window.removeEventListener('touchmove', onMove);
                    }
                  };
                  window.addEventListener('touchmove', onMove, { passive: true });
                  const cleanup = () => {
                    window.removeEventListener('touchmove', onMove);
                  };
                  window.addEventListener('touchend', cleanup, { once: true });
                }}
              >
                <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.2)]" />
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 custom-scrollbar pb-4">
                {(activeTab === 'source' || activeTab === 'layers' || activeTab === 'poster') && (
                  <LayerPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelectionOverride}
                  />
                )}
                {(activeTab === 'badges' || activeTab === 'selection') && (
                  <Inspector config={config} setConfig={setConfig} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile dock */}
        <MobileDock
          hasBadges={config.ratings.length > 0}
          hasLogo={config.logo}
          isMinimalPreset={(config.uiPreset ?? 'b') === 'm'}
          selectedCount={selectedIds.size + (selectedLogo ? 1 : 0)}
        />

        {/* Zoom + fullscreen overlay — always visible */}
        <ZoomOverlay
          isFullscreen={isFullscreen}
          rightSidebarWidth={isDesktop && rightVisible && !isFullscreen ? rightW : 0}
          onToggleFullscreen={toggleFullscreen}
          onZoomIn={() => dispatchZoom(0.25)}
          onZoomOut={() => dispatchZoom(-0.25)}
          onResetView={dispatchResetView}
          isMobile={!isDesktop}
        />
      </div>
    </>
  );
};

// ── Root app ──────────────────────────────────────────────────────────────────
const BuilderApp: React.FC<{ initialMode?: BuilderMode }> = ({ initialMode = 'advanced' }) => {
  const {
    state: config,
    setState: setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePosterHistory(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const cfg = saved ? (JSON.parse(saved) as PosterConfig) : DEFAULT_CONFIG;
      const cookieKeys = loadKeysFromCookie();
      if (cookieKeys && Object.keys(cookieKeys).some((k) => cookieKeys[k as keyof ApiKeys])) {
        return { ...cfg, keys: { ...cookieKeys, ...cfg.keys } };
      }
      return cfg;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (config.keys) {
      const hasAnyKey = Object.values(config.keys).some((v) => v && v.trim());
      if (hasAnyKey) saveKeysToCookie(config.keys);
    }
  }, [config.keys]);

  const handleLoadConfig = useCallback(
    (url: string) => {
      setConfig(parseUrlToConfig(url));
      try {
        setBaseUrl(new URL(url).origin);
      } catch {
        /* keep */
      }
    },
    [setConfig]
  );

  const handleReset = useCallback(() => {
    setConfig((current) => ({
      ...DEFAULT_CONFIG,
      mediaType: current.mediaType,
      tmdbId: current.tmdbId,
      imdbId: current.imdbId,
      source: current.source,
      ptype: current.ptype,
      textless: current.textless,
      keys: current.keys,
    }));
    window.dispatchEvent(new CustomEvent('reset-canvas-view'));
  }, [setConfig]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      handleLoadConfig(urlParam);
      return;
    }

    const configParam = params.get('config');
    if (!configParam) return;
    if (configParam.length > MAX_QUERY_CONFIG_LENGTH) return;

    try {
      const decoded = atob(decodeURIComponent(configParam));
      const parsed = JSON.parse(decoded) as Partial<PosterConfig>;
      if (!parsed || !Array.isArray(parsed.ratings)) return;

      setConfig({
        ...DEFAULT_CONFIG,
        ...parsed,
        items: parsed.items ?? {},
      } as PosterConfig);
    } catch {
      // ignore malformed config input
    }
  }, [handleLoadConfig, setConfig]);

  return (
    <EditorProvider>
      <StudioLayout
        config={config}
        setConfig={setConfig}
        handleReset={handleReset}
        baseUrl={baseUrl}
        handleLoadConfig={handleLoadConfig}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        initialMode={initialMode}
      />
    </EditorProvider>
  );
};

export default BuilderApp;
