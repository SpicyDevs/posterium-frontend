// src/components/builder/index.tsx
import React, { Suspense, lazy, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PosterConfig, ExtensionType, ApiKeys, RatingType } from './types';
import {
  DEFAULT_CONFIG,
  ALL_BADGES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
} from './types';
import { parseUrlToConfig } from './utils/url-parser';
import { DEFAULT_API_BASE } from './utils/constants';
import { calculateAutoPosition, getScale } from './utils/positioning';
import {
  BUILDER_STORAGE_KEY,
  MAX_QUERY_CONFIG_LENGTH,
  loadKeysFromCookie,
  saveKeysToCookie,
} from './systems/storage/builderStorage';
import PreviewCanvas from './components/PreviewCanvas';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import AdvancedPanelNav, { type BuilderPanelId } from './components/navigation/AdvancedPanelNav';
import ModeToggle, { type BuilderMode } from './components/navigation/ModeToggle';
import {
  SourcePanel,
  LayersPanel,
  PosterPanel,
  BadgesPanel,
  SelectionPanel,
} from './components/panels';
import ToolbarBtn from './components/toolbar/ToolbarButton';
import ZoomOverlay from './components/canvas/ZoomOverlay';
import { EditorProvider, useEditor } from './context/EditorContext';
import {
  RotateCcw,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  X,
  PanelLeft,
  PanelRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  ShieldCheck,
  Eye,
  EyeOff,
  Layers,
  Film,
  Monitor,
  Sliders,
  MousePointer2,
  CheckSquare,
  MousePointer2Off,
  Download,
  Contrast,
  ArrowUpToLine,
  ArrowDownToLine,
  ScanLine,
  Keyboard,
  Type,
  ChevronDown,
  Search,
} from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';
import { useMobileBottomSheet } from './hooks/useMobileBottomSheet';
import type { ContextMenuState, LayerTargetId } from './components/ContextMenu';
import type { PaletteCommand } from './components/CommandPalette';

const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal'));
const ResetDialog = lazy(() => import('./components/ResetDialogue'));
const ImportDialog = lazy(() => import('./components/ImportDialogue'));
const ExportPopover = lazy(() => import('./components/ExportPopover'));
const ContextMenu = lazy(() => import('./components/ContextMenu'));
const CommandPalette = lazy(() => import('./components/CommandPalette'));

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
  initialMode = 'simple',
}) => {
  const {
    activeTab,
    setActiveTab,
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

  const [builderMode, setBuilderMode] = useState<BuilderMode>(initialMode);
  const [advancedPanel, setAdvancedPanel] = useState<BuilderPanelId>('source');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const importBtnRef = useRef<HTMLButtonElement>(null);
  // Two physical Export buttons exist in the DOM at once (desktop header +
  // mobile toolbar) — only one is visible at a time via CSS (`lg:hidden` /
  // `hidden lg:flex`), but both stay mounted. Using a single shared ref for
  // both meant `.current` always ended up pointing at whichever button
  // rendered last (the mobile one), which is display:none on desktop and
  // therefore reports a zero-size rect at (0,0) — causing the export popover
  // to appear pinned to the top-left corner instead of under the visible
  // button. Give each button its own ref and resolve to whichever is
  // actually visible when the popover needs to position itself.
  const exportBtnRefDesktop = useRef<HTMLButtonElement>(null);
  const exportBtnRefMobile = useRef<HTMLButtonElement>(null);
  const exportBtnRef = useMemo<React.RefObject<HTMLButtonElement | null>>(
    () => ({
      get current() {
        const desktopEl = exportBtnRefDesktop.current;
        if (desktopEl && desktopEl.offsetParent !== null) return desktopEl;
        return exportBtnRefMobile.current;
      },
    }),
    []
  );
  const mobileRootRef = useRef<HTMLDivElement>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<'source' | 'canvas' | 'badges'>('source');

  const {
    bottomPanelOpen, setBottomPanelOpen,
    isDragging: isDraggingBottomPanel, setIsDragging: setIsDraggingBottomPanel,
    open: openBottomPanelSheet,
    close: closeBottomPanel,
    beginDrag: beginBottomPanelDrag,
    moveDrag: moveBottomPanelDrag,
    endDrag: endBottomPanelDrag,
    setHeight: setMobileBottomHeight,
    getSnapPoints: getBottomSnapPoints,
  } = useMobileBottomSheet(mobileRootRef);
  void setBottomPanelOpen;
  void setIsDraggingBottomPanel;
  void setMobileBottomHeight;
  void getBottomSnapPoints;

  const openBottomPanel = useCallback(
    (tab: 'source' | 'canvas' | 'badges') => {
      setBottomPanelTab(tab);
      openBottomPanelSheet();
    },
    [openBottomPanelSheet]
  );
  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

  useEffect(() => {
    if (['source', 'layers', 'poster', 'badges', 'selection'].includes(activeTab)) {
      setAdvancedPanel(activeTab as BuilderPanelId);
    }
  }, [activeTab]);

  const switchAdvancedPanel = useCallback(
    (panel: BuilderPanelId) => {
      setAdvancedPanel(panel);
      setActiveTab(panel);
    },
    [setActiveTab]
  );

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
              const idx = Number(id.split('-').pop() ?? -1);
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

  const handleSelectionOverride = useCallback(
    (id: RatingType, multi: boolean) => {
      handleSelection(id, multi);
      if (!isDesktop) setRightPanelOpen(true);
    },
    [handleSelection, isDesktop]
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

  const advancedDetailLevel = builderMode === 'advanced' ? 'advanced' : 'simple';
  const sharedPanelProps = {
    config,
    setConfig,
    selectedIds,
    onSelect: handleSelectionOverride,
    detailLevel: advancedDetailLevel as 'simple' | 'advanced',
  };
  const sharedInspectorProps = {
    config,
    setConfig,
    selectedIds,
    selectedLogo,
    selectedMinimalElements,
    detailLevel: advancedDetailLevel as 'simple' | 'advanced',
  };

  const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0) + selectedMinimalElements.size;
  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) return 'SELECT';
    if (selectedCount > 1) return `${selectedCount} LAYERS`;
    if (selectedLogo) return 'LOGO';
    const minimal = [...selectedMinimalElements][0];
    if (minimal)
      return minimal
        .replace(/^minimal-/, '')
        .replace(/-/g, ' ')
        .toUpperCase();
    const badgeId = [...selectedIds][0];
    return (
      ALL_BADGES.find((badge) => badge.id === badgeId)?.label.toUpperCase() ?? badgeId.toUpperCase()
    );
  }, [selectedCount, selectedIds, selectedLogo, selectedMinimalElements]);

  const renderAdvancedPanel = () => {
    switch (advancedPanel) {
      case 'source':
        return <SourcePanel {...sharedPanelProps} chrome={false} />;
      case 'layers':
        return <LayersPanel {...sharedPanelProps} chrome={false} />;
      case 'poster':
        return <PosterPanel {...sharedPanelProps} chrome={false} />;
      case 'badges':
        return <BadgesPanel {...sharedInspectorProps} />;
      case 'selection':
        return <SelectionPanel {...sharedInspectorProps} />;
      default:
        return null;
    }
  };

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

        {(isResetOpen ||
          isImportOpen ||
          shortcutsOpen ||
          ctxMenu.visible ||
          paletteOpen ||
          exportOpen) && (
          <Suspense fallback={null}>
            {isResetOpen && (
              <ResetDialog
                isOpen={isResetOpen}
                onClose={() => setIsResetOpen(false)}
                onConfirm={handleReset}
              />
            )}
            {isImportOpen && (
              <ImportDialog
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onLoad={handleLoadConfig}
                anchorRef={importBtnRef}
              />
            )}
            {shortcutsOpen && (
              <KeyboardShortcutsModal
                isOpen={shortcutsOpen}
                onClose={() => setShortcutsOpen(false)}
              />
            )}
            {ctxMenu.visible && (
              <ContextMenu
                state={ctxMenu}
                onClose={closeCtxMenu}
                isSelected={ctxBadgeSelected}
                onBringToFront={(id) =>
                  id === 'logo' ? moveLogoLayer('front') : moveLayer(id, 'front')
                }
                onBringForward={(id) =>
                  id === 'logo' ? moveLogoLayer('forward') : moveLayer(id, 'forward')
                }
                onSendBackward={(id) =>
                  id === 'logo' ? moveLogoLayer('back') : moveLayer(id, 'back')
                }
                onSendToBack={(id) =>
                  id === 'logo' ? moveLogoLayer('toback') : moveLayer(id, 'toback')
                }
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
            )}
            {paletteOpen && (
              <CommandPalette
                isOpen={paletteOpen}
                onClose={() => setPaletteOpen(false)}
                commands={paletteCommands}
              />
            )}

            {exportOpen && (
              <ExportPopover
                config={config}
                onLoadConfig={handleLoadConfig}
                baseUrl={baseUrl}
                onExtensionChange={handleExtensionChange}
                isOpen={exportOpen}
                onClose={() => setExportOpen(false)}
                anchorRef={exportBtnRef}
              />
            )}
          </Suspense>
        )}

        {/* ── HEADER ── */}
        {!isFullscreen && (
          <header
            className="hidden lg:flex h-12 shrink-0 items-center z-30 relative"
            style={{
              background: 'rgba(7,7,6,0.97)',
              borderBottom: '1px solid rgba(196,124,46,0.08)',
            }}
          >
            {/* Ambient gradient rule */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(196,124,46,0.15), transparent)',
              }}
              aria-hidden="true"
            />

            {/* Left Header Area */}
            <div className="flex items-center px-2 sm:px-3 shrink-0 gap-1 overflow-hidden max-lg:!w-auto">
              {/* Wordmark */}
              <a
                href="/"
                className="flex items-center"
                style={{ textDecoration: 'none', flexShrink: 0 }}
              >
                <span
                  className="poster-font select-none hidden sm:block"
                  style={{
                    fontSize: 18,
                    color: 'var(--film-cream)',
                    letterSpacing: '0.12em',
                    lineHeight: 'normal',
                  }}
                >
                  POSTERIUM
                </span>
                <span
                  className="poster-font select-none sm:hidden"
                  style={{
                    fontSize: 14,
                    color: 'var(--film-amber)',
                    letterSpacing: '0.12em',
                    lineHeight: 'normal',
                  }}
                >
                  P
                </span>
              </a>
              <ModeToggle mode={builderMode} onChange={setBuilderMode} />
              <button
                onClick={() => setPaletteOpen(true)}
                title="Search commands (⌘K)"
                className="hidden max-[750px]:flex items-center gap-2 h-8 w-[250px] max-[600px]:w-[100px] px-3 rounded-md transition-all pointer-events-auto"
                style={{
                  color: 'var(--film-text-dim)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <Search size={12} className="shrink-0" />
                <span className="text-[11px] syne-font whitespace-nowrap">Search…</span>
              </button>
              <ToolbarBtn
                onClick={() => setShortcutsOpen((v) => !v)}
                label="Keyboard Shortcuts (⌘/)"
                active={shortcutsOpen}
                hideOnMobile
              >
                <Keyboard size={14} />
              </ToolbarBtn>
            </div>

            {/* Central area: sidebar toggles flank the command palette search */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center gap-2 pointer-events-none px-1 sm:px-2">
              {/* Left sidebar toggle - desktop only */}
              <button
                onClick={() => setLeftVisible(!leftVisible)}
                title={`${leftVisible ? 'Hide' : 'Show'} Layers ([)`}
                className="shrink-0 w-8 h-8 rounded-lg items-center justify-center transition-all hidden lg:flex pointer-events-auto"
                style={{
                  color: leftVisible ? 'var(--film-amber)' : 'var(--film-text-dim)',
                  border: '1px solid transparent',
                  background: leftVisible ? 'rgba(196,124,46,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(196,124,46,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = leftVisible
                    ? 'rgba(196,124,46,0.08)'
                    : 'transparent';
                }}
              >
                <PanelLeft size={14} />
              </button>

              {/* Full search bar - sm and above */}
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden min-[751px]:flex items-center gap-2 px-3 h-8 w-full max-w-[480px] max-[900px]:max-w-[380px] max-[800px]:max-w-[300px] rounded-md transition-colors pointer-events-auto"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--film-text-dim)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <Search size={13} className="shrink-0" />
                <span className="text-[11px] syne-font text-left flex-1 min-w-0 truncate">
                  Search commands...
                </span>
                <kbd
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-white/5 shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  ⌘K
                </kbd>
              </button>

              {/* Right sidebar toggle - desktop only */}
              <button
                onClick={() => setRightVisible(!rightVisible)}
                title={`${rightVisible ? 'Hide' : 'Show'} Inspector (])`}
                className="shrink-0 w-8 h-8 rounded-lg items-center justify-center transition-all hidden lg:flex pointer-events-auto"
                style={{
                  color: rightVisible ? 'var(--film-amber)' : 'var(--film-text-dim)',
                  border: '1px solid transparent',
                  background: rightVisible ? 'rgba(196,124,46,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(196,124,46,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = rightVisible
                    ? 'rgba(196,124,46,0.08)'
                    : 'transparent';
                }}
              >
                <PanelRight size={14} />
              </button>
            </div>

            {/* Right Header Area */}
            <div className="ml-auto flex items-center justify-end px-2 sm:px-3 shrink-0 gap-0.5 sm:gap-1 max-lg:!w-auto">
              <div
                className="w-px h-4 mx-1 hidden lg:block"
                style={{ background: 'rgba(196,124,46,0.12)' }}
                aria-hidden="true"
              />

              {/* History */}
              <ToolbarBtn onClick={undo} disabled={!canUndo} label="Undo (⌘Z)">
                <Undo2 size={14} />
              </ToolbarBtn>
              <ToolbarBtn onClick={redo} disabled={!canRedo} label="Redo (⌘Y)">
                <Redo2 size={14} />
              </ToolbarBtn>

              <div
                className="w-px h-4 mx-1 hidden lg:block"
                style={{ background: 'rgba(196,124,46,0.12)' }}
                aria-hidden="true"
              />

              {/* Import */}
              <button
                ref={importBtnRef}
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-md transition-colors syne-font hidden sm:flex"
                style={{ color: 'var(--film-text-dim)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
                }}
              >
                <Download size={13} className="rotate-180" />
                <span className="text-[11px] font-medium uppercase tracking-wider max-[1300px]:hidden">
                  Import
                </span>
              </button>

              {/* Export CTA */}
              <button
                ref={exportBtnRefDesktop}
                onClick={() => setExportOpen((v) => !v)}
                className="flex items-center gap-1.5 h-8 px-2 sm:px-3 rounded-lg ml-1 syne-font transition-all active:scale-95"
                style={{
                  background: exportOpen ? 'rgba(196,124,46,0.9)' : 'var(--film-amber)',
                  color: '#070706',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  boxShadow: exportOpen ? 'none' : '0 0 16px rgba(196,124,46,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!exportOpen) (e.currentTarget as HTMLElement).style.background = '#d4a245';
                }}
                onMouseLeave={(e) => {
                  if (!exportOpen)
                    (e.currentTarget as HTMLElement).style.background = 'var(--film-amber)';
                }}
              >
                <Download size={12} />
                <span className="max-[1300px]:hidden">Export</span>
                <ChevronDown
                  className="max-[1300px]:hidden"
                  size={10}
                  style={{
                    transform: exportOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>

              <div
                className="w-px h-4 mx-1 hidden lg:block"
                style={{ background: 'rgba(196,124,46,0.12)' }}
                aria-hidden="true"
              />

              {/* Reset - permanently placed at top right */}
              <button
                onClick={() => setIsResetOpen(true)}
                className="flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-md transition-colors syne-font text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
              >
                <RotateCcw size={13} />
                <span className="text-[11px] font-bold uppercase tracking-wider hidden min-[1401px]:inline">
                  Reset
                </span>
              </button>
            </div>
          </header>
        )}

        {/* ── MOBILE BUILDER ── */}
        {!isFullscreen && (
          <div
            ref={mobileRootRef}
            className="lg:hidden"
            style={{
              position: 'fixed',
              inset: 0,
              height: '100dvh',
              width: '100vw',
              background: 'var(--film-black)',
              overflow: 'hidden',
              '--bph': '0px',
            } as React.CSSProperties}
          >
            {/* ── TOP HEADER BAR ── */}
            {/* Height: 48px. Dark near-black background matching desktop header. */}
            {/* Left: POSTERIUM wordmark + mode label. Center: context title. Right: action buttons. */}
            <header
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 48,
                zIndex: 40,
                background: 'rgba(7,7,6,0.97)',
                borderBottom: '1px solid rgba(196,124,46,0.1)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 0,
              }}
            >
              {/* Ambient gradient rule on header bottom — matches desktop header exactly */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.15), transparent)',
                  pointerEvents: 'none',
                }}
              />

              {/* LEFT: Wordmark */}
              {/* Uses poster-font exactly like desktop. "POSTERIUM" in cream at 16px tracking 0.12em */}
              <a
                href="/"
                style={{
                  textDecoration: 'none',
                  flexShrink: 0,
                  marginRight: 8,
                }}
              >
                <span
                  className="poster-font"
                  style={{
                    fontSize: 16,
                    color: 'var(--film-cream)',
                    letterSpacing: '0.12em',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  POSTERIUM
                </span>
              </a>

              {/* Separator — thin amber vertical rule */}
              <div
                aria-hidden="true"
                style={{
                  width: 1,
                  height: 16,
                  background: 'rgba(196,124,46,0.2)',
                  flexShrink: 0,
                  marginRight: 8,
                }}
              />

              {/* CENTER: Context label — expands to fill remaining space */}
              {/* Shows which panel is active or "BUILDER" when canvas is in focus */}
              {/* Uses Syne font, 9px, bold, tracking 0.1em, dimmed amber color */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  className="syne-font"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: leftPanelOpen || rightPanelOpen || bottomPanelOpen
                      ? 'rgba(196,124,46,0.8)'
                      : 'rgba(240,230,204,0.4)',
                  }}
                >
                  {leftPanelOpen
                    ? 'Layers'
                    : rightPanelOpen
                    ? selectedCount > 0
                      ? selectedLabel
                      : 'Inspector'
                    : bottomPanelOpen
                    ? bottomPanelTab === 'source'
                      ? 'Source'
                      : bottomPanelTab === 'canvas'
                      ? 'Canvas'
                      : 'Badges'
                    : 'Builder'}
                </span>
              </div>

              {/* RIGHT: Action buttons — 32×32 each, gap 4px */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {/* Undo */}
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: canUndo ? 'rgba(240,230,204,0.65)' : 'rgba(140,130,112,0.2)',
                    cursor: canUndo ? 'pointer' : 'default',
                    transition: 'color 0.15s, background 0.15s',
                  }}
                >
                  <Undo2 size={14} />
                </button>

                {/* Redo */}
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  aria-label="Redo"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: canRedo ? 'rgba(240,230,204,0.65)' : 'rgba(140,130,112,0.2)',
                    cursor: canRedo ? 'pointer' : 'default',
                    transition: 'color 0.15s, background 0.15s',
                  }}
                >
                  <Redo2 size={14} />
                </button>

                {/* Thin separator */}
                <div
                  aria-hidden="true"
                  style={{ width: 1, height: 16, background: 'rgba(196,124,46,0.12)', margin: '0 2px' }}
                />

                {/* Export CTA — amber filled, matches desktop export button style */}
                <button
                  ref={exportBtnRefMobile}
                  onClick={() => setExportOpen((v) => !v)}
                  aria-label="Export poster"
                  style={{
                    height: 32,
                    paddingInline: 12,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    background: exportOpen ? 'rgba(196,124,46,0.85)' : 'var(--film-amber)',
                    color: '#070706',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Download size={13} />
                  <span
                    className="syne-font"
                    style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}
                  >
                    EXPORT
                  </span>
                </button>
              </div>
            </header>

            {/* ── CANVAS ── */}
            {/* Top: 48px (header). Bottom: 56px (nav) + safe-area + var(--bph) (bottom sheet). */}
            {/* Transition on bottom must match the bottom sheet transition duration exactly: 0.32s. */}
            <main
              id="main-canvas"
              aria-label="Poster canvas"
              style={{
                position: 'absolute',
                top: 48,
                left: 0,
                right: 0,
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + var(--bph, 0px))',
                background: '#111113',
                overflow: 'hidden',
                transition: isDraggingBottomPanel
                  ? 'none'
                  : 'bottom 0.32s cubic-bezier(0.16,1,0.3,1)',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) clearSelection();
              }}
            >
              <PreviewCanvas
                config={config}
                setConfig={setConfig}
                selectedIds={selectedIds}
                onSelect={handleSelectionOverride}
                onContextMenu={openCtxMenu}
                onLogoContextMenu={(e) => openCtxMenu('logo', e)}
              />

              {/* Film corner accents — 12×12px, z-index 10 so they render above canvas but below panels */}
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
                    zIndex: 10,
                    borderTop: c.startsWith('t') ? '1px solid rgba(196,124,46,0.22)' : 'none',
                    borderBottom: c.startsWith('b') ? '1px solid rgba(196,124,46,0.22)' : 'none',
                    borderLeft: c.endsWith('l') ? '1px solid rgba(196,124,46,0.22)' : 'none',
                    borderRight: c.endsWith('r') ? '1px solid rgba(196,124,46,0.22)' : 'none',
                  }}
                />
              ))}

              {/* Zoom overlay for mobile — bottom-right corner inside canvas */}
              {/* Stacked vertically: ZoomIn, ZoomOut, ResetView. No fullscreen toggle on mobile. */}
              {/* z-index: 20, positioned 12px from bottom and right of canvas area */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 14,
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: 4,
                  borderRadius: 12,
                  background: 'rgba(14,13,11,0.88)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(196,124,46,0.18)',
                }}
              >
                {[
                  { icon: <ZoomIn size={14} />, label: 'Zoom in', action: () => dispatchZoom(0.25) },
                  { icon: <ZoomOut size={14} />, label: 'Zoom out', action: () => dispatchZoom(-0.25) },
                  { icon: <RotateCcw size={13} />, label: 'Reset view', action: dispatchResetView },
                ].map(({ icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    aria-label={label}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(140,130,112,0.7)',
                      cursor: 'pointer',
                    }}
                    onTouchStart={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--film-amber)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,124,46,0.1)';
                    }}
                    onTouchEnd={(e) => {
                      setTimeout(() => {
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(140,130,112,0.7)';
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }, 120);
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </main>

            {/* ── LEFT EDGE HANDLE (Layers toggle) ── */}
            {/* Width: 22px. Height: 64px. Centered vertically at 50%. Rounded right corners only. */}
            {/* z-index: 30 (above canvas, below drawers). */}
            <button
              aria-label={leftPanelOpen ? 'Close layers panel' : 'Open layers panel'}
              aria-expanded={leftPanelOpen}
              onClick={() => setLeftPanelOpen((v) => !v)}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30,
                width: 22,
                height: 64,
                borderRadius: '0 10px 10px 0',
                background: leftPanelOpen
                  ? 'rgba(196,124,46,0.18)'
                  : 'rgba(10,9,8,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(196,124,46,0.22)',
                borderLeft: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: leftPanelOpen ? 'var(--film-amber)' : 'rgba(196,124,46,0.5)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {leftPanelOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            </button>

            {/* ── RIGHT EDGE HANDLE (Selection/Inspector toggle) ── */}
            {/* Identical geometry to left handle but mirrored. Rounded left corners only. */}
            <button
              aria-label={rightPanelOpen ? 'Close inspector panel' : 'Open inspector panel'}
              aria-expanded={rightPanelOpen}
              onClick={() => setRightPanelOpen((v) => !v)}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30,
                width: 22,
                height: 64,
                borderRadius: '10px 0 0 10px',
                background: rightPanelOpen
                  ? 'rgba(196,124,46,0.18)'
                  : 'rgba(10,9,8,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(196,124,46,0.22)',
                borderRight: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: rightPanelOpen ? 'var(--film-amber)' : 'rgba(196,124,46,0.5)',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {rightPanelOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            {/* ── SELECTION CHIP ── */}
            {/* Appears below the right edge handle when something is selected. */}
            {/* Only visible (opacity 1, pointer-events auto) when selectedCount > 0. */}
            {/* Tapping it opens the right inspector drawer. */}
            <button
              aria-label="Open inspector for selected layers"
              onClick={() => { if (selectedCount > 0) setRightPanelOpen(true); }}
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(50% + 44px)',
                zIndex: 30,
                height: 30,
                minWidth: 56,
                maxWidth: 110,
                borderRadius: '14px 0 0 14px',
                background: selectedCount > 0
                  ? 'rgba(196,124,46,0.16)'
                  : 'rgba(196,124,46,0.07)',
                border: `1px solid ${selectedCount > 0 ? 'rgba(196,124,46,0.38)' : 'rgba(196,124,46,0.18)'}`,
                borderRight: 'none',
                paddingInline: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Syne, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: selectedCount > 0 ? 'var(--film-amber)' : 'rgba(140,130,112,0.35)',
                cursor: selectedCount > 0 ? 'pointer' : 'default',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                opacity: selectedCount > 0 ? 1 : 0.5,
                pointerEvents: selectedCount > 0 ? 'auto' : 'none',
                transition: 'opacity 0.2s, background 0.15s, border-color 0.15s',
              }}
            >
              {selectedLabel}
            </button>

            {/* ── LEFT PANEL DRAWER BACKDROP ── */}
            {/* Covers entire screen when drawer is open. Clicking closes the drawer. */}
            {/* Use visibility instead of conditional render to avoid re-mount. */}
            <div
              aria-hidden="true"
              onClick={() => setLeftPanelOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 24,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(2px)',
                opacity: leftPanelOpen ? 1 : 0,
                visibility: leftPanelOpen ? 'visible' : 'hidden',
                transition: 'opacity 0.28s ease, visibility 0.28s',
                pointerEvents: leftPanelOpen ? 'auto' : 'none',
              }}
            />

            {/* ── LEFT PANEL DRAWER ── */}
            {/* Width: min(280px, 85vw). Slides in from left. */}
            {/* Top: 48px (below header). Bottom: 56px (above nav) + safe-area-inset-bottom. */}
            {/* Content: LayersPanel with hideTabs=true (no internal tab bar, takes full height). */}
            {/* CRITICAL: Use visibility:hidden NOT display:none so the panel stays mounted. */}
            <aside
              aria-label="Layers panel"
              aria-hidden={!leftPanelOpen}
              style={{
                position: 'absolute',
                top: 48,
                left: 0,
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                width: 'min(280px, 85vw)',
                zIndex: 25,
                background: 'var(--film-dark)',
                borderRight: '1px solid rgba(196,124,46,0.18)',
                boxShadow: '4px 0 40px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                transform: leftPanelOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                visibility: leftPanelOpen ? 'visible' : 'hidden',
              }}
            >
              {/* Right-edge inner glow for left drawer — matches SidebarLayout's cyber-path aesthetic */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: 40,
                  background: 'linear-gradient(to left, rgba(196,124,46,0.03), transparent)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
              {/* Drawer header — matches desktop sidebar header style exactly */}
              {/* Height: 44px. Icon + title on left, close button on right. */}
              <div
                style={{
                  height: 44,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px 0 14px',
                  borderBottom: '1px solid rgba(196,124,46,0.08)',
                  background: 'var(--film-mid)',
                  gap: 8,
                }}
              >
                <Layers size={13} style={{ color: 'var(--film-amber)', flexShrink: 0 }} />
                <span
                  className="syne-font"
                  style={{
                    flex: 1,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--film-cream)',
                  }}
                >
                  Layers
                </span>
                {/* Close button — minimum 36×36 tap target */}
                <button
                  onClick={() => setLeftPanelOpen(false)}
                  aria-label="Close layers panel"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(140,130,112,0.5)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onTouchStart={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,124,46,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--film-amber)';
                  }}
                  onTouchEnd={(e) => {
                    setTimeout(() => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(140,130,112,0.5)';
                    }, 150);
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Content — fills remaining height, scrollable */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                }}
              >
                <LayersPanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  onSelect={handleSelectionOverride}
                  chrome={false}
                  detailLevel="simple"
                />
              </div>
            </aside>

            {/* ── RIGHT PANEL DRAWER BACKDROP ── */}
            <div
              aria-hidden="true"
              onClick={() => setRightPanelOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 24,
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(2px)',
                opacity: rightPanelOpen ? 1 : 0,
                visibility: rightPanelOpen ? 'visible' : 'hidden',
                transition: 'opacity 0.28s ease, visibility 0.28s',
                pointerEvents: rightPanelOpen ? 'auto' : 'none',
              }}
            />

            {/* ── RIGHT PANEL DRAWER ── */}
            {/* Identical geometry to left drawer but slides from right. */}
            {/* Content: SelectionPanel when items selected, BadgesPanel when nothing selected. */}
            {/* CRITICAL: Use visibility:hidden, not display:none, to keep panel mounted. */}
            <aside
              aria-label="Inspector panel"
              aria-hidden={!rightPanelOpen}
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                width: 'min(280px, 85vw)',
                zIndex: 25,
                background: 'var(--film-dark)',
                borderLeft: '1px solid rgba(196,124,46,0.18)',
                boxShadow: '-4px 0 40px rgba(0,0,0,0.7)',
                display: 'flex',
                flexDirection: 'column',
                transform: rightPanelOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                visibility: rightPanelOpen ? 'visible' : 'hidden',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: 40,
                  background: 'linear-gradient(to right, rgba(196,124,46,0.03), transparent)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
              {/* Drawer header */}
              <div
                style={{
                  height: 44,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px 0 14px',
                  borderBottom: '1px solid rgba(196,124,46,0.08)',
                  background: 'var(--film-mid)',
                  gap: 8,
                }}
              >
                <MousePointer2 size={13} style={{ color: 'var(--film-amber)', flexShrink: 0 }} />
                <span
                  className="syne-font"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--film-cream)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedCount === 0 ? 'Inspector' : selectedLabel}
                </span>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  aria-label="Close inspector panel"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(140,130,112,0.5)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onTouchStart={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(196,124,46,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--film-amber)';
                  }}
                  onTouchEnd={(e) => {
                    setTimeout(() => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(140,130,112,0.5)';
                    }, 150);
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                }}
              >
                {selectedCount > 0 ? (
                  <SelectionPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    selectedLogo={selectedLogo}
                    selectedMinimalElements={selectedMinimalElements}
                    detailLevel="simple"
                  />
                ) : (
                  <BadgesPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    selectedLogo={selectedLogo}
                    selectedMinimalElements={selectedMinimalElements}
                    detailLevel="simple"
                  />
                )}
              </div>
            </aside>

            {/* ── BOTTOM SHEET PANEL ── */}
            {/* Position: above the bottom nav bar (56px + safe area). */}
            {/* Height: driven by CSS var --bph. Snaps to 200px / ~48vh / ~88vh. */}
            {/* Contains: drag handle, tab bar, scrollable content. */}
            {/* IMPORTANT: All three tab contents must be rendered simultaneously with */}
            {/* display:none to avoid remounting and re-running effects on tab switch. */}
            <section
              aria-label="Editor panels"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                zIndex: 35,
                height: 'var(--bph, 0px)',
                background: 'var(--film-dark)',
                borderTop: '1px solid rgba(196,124,46,0.2)',
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.7)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transform: bottomPanelOpen ? 'translateY(0)' : 'translateY(100%)',
                opacity: bottomPanelOpen ? 1 : 0,
                pointerEvents: bottomPanelOpen ? 'auto' : 'none',
                transition: isDraggingBottomPanel
                  ? 'none'
                  : 'transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease',
              }}
            >
              {/* Ambient gradient at top edge — visual depth cue */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.25), transparent)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />

              {/* DRAG HANDLE ZONE */}
              {/* Height: 28px. Centered pill handle. Touch events initiate drag. */}
              {/* Dragging upward increases panel height, downward decreases. */}
              <div
                onTouchStart={(e) => {
                  e.preventDefault();
                  beginBottomPanelDrag(e.touches[0].clientY, bottomPanelOpen);
                }}
                onTouchMove={(e) => {
                  if (!isDraggingBottomPanel) return;
                  e.preventDefault();
                  moveBottomPanelDrag(e.touches[0].clientY);
                }}
                onTouchEnd={() => endBottomPanelDrag()}
                style={{
                  height: 28,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: 8,
                  cursor: 'ns-resize',
                  touchAction: 'none',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Pill */}
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: isDraggingBottomPanel
                      ? 'rgba(196,124,46,0.6)'
                      : 'rgba(255,255,255,0.18)',
                    transition: 'background 0.15s',
                  }}
                />
              </div>

              {/* TAB BAR */}
              {/* Height: 40px. Three tabs. Active tab has bottom amber border 2px. */}
              {/* Uses Syne font, 9px, bold, 0.1em tracking. Matches desktop PanelTabs aesthetic. */}
              <div
                style={{
                  height: 40,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'stretch',
                  borderBottom: '1px solid rgba(196,124,46,0.08)',
                  background: 'var(--film-mid)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Close button — right of tab bar */}
                {/* Width: 44px to meet minimum tap target. Chevron down icon. */}
                <button
                  onClick={closeBottomPanel}
                  aria-label="Close editor panel"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(140,130,112,0.45)',
                    cursor: 'pointer',
                    zIndex: 1,
                  }}
                >
                  <ChevronDown size={14} />
                </button>

                {/* Tab buttons — three equal-width buttons filling remaining space (minus 44px for close) */}
                {(
                  [
                    { id: 'source', label: 'Source' },
                    { id: 'canvas', label: 'Canvas' },
                    { id: 'badges', label: 'Badges' },
                  ] as const
                ).map(({ id, label }) => {
                  const active = bottomPanelTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setBottomPanelTab(id)}
                      style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: active
                          ? '2px solid var(--film-amber)'
                          : '2px solid transparent',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: active
                          ? 'var(--film-cream)'
                          : 'rgba(140,130,112,0.45)',
                        cursor: 'pointer',
                        transition: 'color 0.15s, border-bottom-color 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* CONTENT AREA */}
              {/* All three panels are mounted simultaneously. Only one is visible via display. */}
              {/* This eliminates remounting, re-running effects, and scroll position loss on tab switch. */}
              {/* Each content div has its own overflow-y:auto with touch scrolling. */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  position: 'relative',
                }}
              >
                {/* SOURCE TAB CONTENT */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    display: bottomPanelTab === 'source' ? 'block' : 'none',
                    paddingBottom: 24,
                  }}
                >
                  <SourcePanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelectionOverride}
                    chrome={false}
                    detailLevel="simple"
                  />
                </div>

                {/* CANVAS TAB CONTENT */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    display: bottomPanelTab === 'canvas' ? 'block' : 'none',
                    paddingBottom: 24,
                  }}
                >
                  <PosterPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelectionOverride}
                    chrome={false}
                    detailLevel="simple"
                  />
                </div>

                {/* BADGES TAB CONTENT */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    display: bottomPanelTab === 'badges' ? 'block' : 'none',
                    paddingBottom: 24,
                  }}
                >
                  <BadgesPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    selectedLogo={selectedLogo}
                    selectedMinimalElements={selectedMinimalElements}
                    detailLevel="simple"
                  />
                </div>
              </div>
            </section>

            {/* ── BOTTOM NAVIGATION BAR ── */}
            {/* Height: 56px. Three tab buttons filling equal width. */}
            {/* Active indicator: 2px amber line at TOP of bar (not the tab bottom border). */}
            {/* The indicator is a single absolutely-positioned div that translates X. */}
            {/* This avoids percentage-based left calculations that break with safe-area. */}
            <nav
              aria-label="Editor navigation"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                zIndex: 40,
                background: 'rgba(7,7,6,0.97)',
                backdropFilter: 'blur(24px)',
                borderTop: '1px solid rgba(196,124,46,0.12)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.18), transparent)',
                  pointerEvents: 'none',
                }}
              />
              {/* Active indicator bar — 28px wide, 2px tall, translates X based on active tab */}
              {/* Tab indices: source=0, canvas=1, badges=2. Each tab is 1/3 of nav width. */}
              {/* Indicator centered within its tab: left = (tabIndex * 33.333%) + (33.333% - 28px) / 2 */}
              {/* Use transform: translateX for GPU-accelerated animation instead of left: */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 'calc(33.333% * var(--active-tab-index, 0) + (33.333% - 28px) / 2)',
                  width: 28,
                  height: 2,
                  background: bottomPanelOpen ? 'var(--film-amber)' : 'transparent',
                  borderRadius: '0 0 2px 2px',
                  transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), background 0.15s',
                  '--active-tab-index': bottomPanelTab === 'source'
                    ? 0
                    : bottomPanelTab === 'canvas'
                    ? 1
                    : 2,
                } as React.CSSProperties}
              />

              {/* Invisible drag zone at top of nav bar — dragging up from here opens/expands the bottom sheet */}
              <div
                style={{
                  position: 'absolute',
                  top: -16,
                  left: 0,
                  right: 0,
                  height: 24,
                  zIndex: 1,
                  cursor: 'ns-resize',
                  touchAction: 'none',
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  beginBottomPanelDrag(e.touches[0].clientY, bottomPanelOpen);
                }}
                onTouchMove={(e) => {
                  if (!isDraggingBottomPanel) return;
                  e.preventDefault();
                  moveBottomPanelDrag(e.touches[0].clientY);
                }}
                onTouchEnd={() => endBottomPanelDrag()}
              />

              {/* Nav buttons row — fills the 56px of the nav (excluding safe-area padding at bottom) */}
              <div style={{ flex: 1, display: 'flex' }}>
                {(
                  [
                    { id: 'source', label: 'Source', Icon: Film },
                    { id: 'canvas', label: 'Canvas', Icon: Monitor },
                    { id: 'badges', label: 'Badges', Icon: Sliders },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const active = bottomPanelOpen && bottomPanelTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => active ? closeBottomPanel() : openBottomPanel(id)}
                      aria-label={`${label} panel`}
                      aria-pressed={active}
                      style={{
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        background: 'transparent',
                        border: 'none',
                        color: active ? 'var(--film-amber)' : 'rgba(140,130,112,0.45)',
                        cursor: 'pointer',
                        transition: 'color 0.15s',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Icon size={20} />
                      <span
                        className="syne-font"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          lineHeight: 1,
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        )}


        {/* ── BODY ── */}
        <div className="hidden lg:flex flex-1 overflow-hidden relative flex-row">
          {/* Left sidebar */}
          {!isFullscreen && (
            <aside
              aria-label="Layer panel"
              className="hidden lg:flex flex-col z-20 relative shrink-0 sidebar-transition"
              style={{
                width: leftVisible ? leftW : 0,
                background: 'var(--film-dark)',
                borderRight: leftVisible ? '1px solid rgba(196,124,46,0.07)' : 'none',
                overflow: 'hidden',
                opacity: leftVisible ? 1 : 0,
              }}
            >
              {builderMode === 'advanced' ? (
                <AdvancedPanelNav activePanel={advancedPanel} onChange={switchAdvancedPanel} />
              ) : (
                <LayerPanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  onSelect={handleSelectionOverride}
                  detailLevel="simple"
                />
              )}
              <div
                onMouseDown={startResizeLeft}
                className="absolute inset-y-0 right-0 w-2 cursor-col-resize group z-50"
              >
                <div className="absolute inset-y-0 right-0 w-[2px] bg-transparent group-hover:bg-[rgba(196,124,46,0.4)] transition-colors duration-150" />
              </div>
            </aside>
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
            <aside
              aria-label="Inspector"
              className="hidden lg:flex flex-col z-20 relative shrink-0 sidebar-transition"
              style={{
                width: rightVisible ? rightW : 0,
                background: 'var(--film-dark)',
                borderLeft: rightVisible ? '1px solid rgba(196,124,46,0.07)' : 'none',
                overflow: 'hidden',
                opacity: rightVisible ? 1 : 0,
              }}
            >
              <div
                onMouseDown={startResizeRight}
                className="absolute inset-y-0 left-0 w-2 cursor-col-resize group z-50"
              >
                <div className="absolute inset-y-0 left-0 w-[2px] bg-transparent group-hover:bg-[rgba(196,124,46,0.4)] transition-colors duration-150" />
              </div>
              {builderMode === 'advanced' ? (
                renderAdvancedPanel()
              ) : (
                <Inspector config={config} setConfig={setConfig} detailLevel="simple" />
              )}
            </aside>
          )}
        </div>

        {/* Zoom + fullscreen overlay — desktop only; mobile uses the sketch-driven fixed chrome. */}
        {isDesktop && (
          <ZoomOverlay
            isFullscreen={isFullscreen}
            rightSidebarWidth={isDesktop && rightVisible && !isFullscreen ? rightW : 0}
            onToggleFullscreen={toggleFullscreen}
            onZoomIn={() => dispatchZoom(0.25)}
            onZoomOut={() => dispatchZoom(-0.25)}
            onResetView={dispatchResetView}
            isMobile={false}
            viewOptions={viewOptions}
            onToggleViewOption={toggleViewOption}
          />
        )}
      </div>
    </>
  );
};

// ── Root app ──────────────────────────────────────────────────────────────────
const BuilderApp: React.FC<{ initialMode?: BuilderMode }> = ({ initialMode = 'simple' }) => {
  const {
    state: config,
    setState: setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePosterHistory(() => {
    try {
      const saved = localStorage.getItem(BUILDER_STORAGE_KEY);
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

  // Warm up the lazily-loaded overlays (keyboard shortcuts modal, reset/import
  // dialogs, export popover, context menu, command palette) once the builder
  // is idle after mount. These are code-split with React.lazy() to keep the
  // initial bundle small, but that means the *first* time a user opens one —
  // e.g. clicking Export, or right-clicking a badge to open the context menu —
  // the browser has to fetch (and parse) the chunk before it can render,
  // which shows up as a one-time delay on that first interaction. Since these
  // chunks are small and the user is very likely to touch at least one of
  // them, prefetching them during idle time removes that delay without
  // giving up the code-splitting benefit for the initial page load.
  useEffect(() => {
    const preload = () => {
      import('./components/KeyboardShortcutsModal');
      import('./components/ResetDialogue');
      import('./components/ImportDialogue');
      import('./components/ExportPopover');
      import('./components/ContextMenu');
      import('./components/CommandPalette');
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const handle = w.requestIdleCallback(preload);
      return () => w.cancelIdleCallback?.(handle);
    }

    const timeout = window.setTimeout(preload, 300);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(config));
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
