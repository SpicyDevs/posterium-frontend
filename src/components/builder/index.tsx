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
import { parseUrlToConfig, DEFAULT_API_BASE, calculateAutoPosition, getScale } from './utils';
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
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const mobileRootRef = useRef<HTMLDivElement>(null);
  const mobileBottomContentRef = useRef<HTMLDivElement>(null);
  const mobileBottomDragRef = useRef({
    startY: 0,
    startHeight: 0,
    currentHeight: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    raf: 0,
  });
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [bottomPanelOpen, setBottomPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<'source' | 'canvas' | 'badges'>('source');
  const [isDraggingBottomPanel, setIsDraggingBottomPanel] = useState(false);
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
      if (typeof window !== 'undefined' && window.innerWidth < 1024) setRightPanelOpen(true);
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

  const mobileDetailLevel = 'simple' as const;
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
  const mobilePanelTitle = leftPanelOpen
    ? 'LAYERS'
    : rightPanelOpen
      ? 'SELECTION'
      : bottomPanelOpen
        ? bottomPanelTab.toUpperCase()
        : 'CANVAS';

  const getBottomPanelMaxHeight = useCallback(() => {
    if (typeof window === 'undefined') return 520;
    const safe = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0'
    );
    return Math.max(200, window.innerHeight - 48 - 56 - (Number.isFinite(safe) ? safe : 0) - 80);
  }, []);

  const setMobileBottomHeight = useCallback((height: number) => {
    mobileRootRef.current?.style.setProperty(
      '--bottom-panel-height',
      `${Math.max(0, Math.round(height))}px`
    );
  }, []);

  const getBottomSnapPoints = useCallback(() => {
    const max = getBottomPanelMaxHeight();
    const mid = Math.min(max, Math.max(200, Math.round(window.innerHeight * 0.48)));
    return [200, mid, max];
  }, [getBottomPanelMaxHeight]);

  const snapBottomPanelTo = useCallback(
    (height: number) => {
      const points = getBottomSnapPoints();
      const target = points.reduce((best, point) =>
        Math.abs(point - height) < Math.abs(best - height) ? point : best
      );
      setMobileBottomHeight(target);
      setBottomPanelOpen(true);
    },
    [getBottomSnapPoints, setMobileBottomHeight]
  );

  const closeBottomPanel = useCallback(() => {
    setMobileBottomHeight(0);
    setBottomPanelOpen(false);
  }, [setMobileBottomHeight]);

  const openBottomPanel = useCallback(
    (tab: 'source' | 'canvas' | 'badges') => {
      setBottomPanelTab(tab);
      if (!bottomPanelOpen) {
        const points = getBottomSnapPoints();
        setMobileBottomHeight(points[1]);
        setBottomPanelOpen(true);
      }
    },
    [bottomPanelOpen, getBottomSnapPoints, setMobileBottomHeight]
  );

  const beginBottomPanelDrag = useCallback(
    (clientY: number) => {
      if (!bottomPanelOpen) return;
      const current = parseFloat(
        mobileRootRef.current?.style.getPropertyValue('--bottom-panel-height') || '0'
      );
      mobileBottomDragRef.current = {
        ...mobileBottomDragRef.current,
        startY: clientY,
        startHeight: current,
        currentHeight: current,
        lastY: clientY,
        lastTime: performance.now(),
        velocity: 0,
      };
      setIsDraggingBottomPanel(true);
    },
    [bottomPanelOpen]
  );

  const moveBottomPanelDrag = useCallback(
    (clientY: number) => {
      if (!isDraggingBottomPanel) return;
      const drag = mobileBottomDragRef.current;
      const now = performance.now();
      const elapsed = Math.max(1, now - drag.lastTime);
      drag.velocity = ((clientY - drag.lastY) / elapsed) * 1000;
      drag.lastY = clientY;
      drag.lastTime = now;
      const max = getBottomPanelMaxHeight();
      const next = Math.max(0, Math.min(max, drag.startHeight - (clientY - drag.startY)));
      drag.currentHeight = next;
      if (drag.raf) cancelAnimationFrame(drag.raf);
      drag.raf = requestAnimationFrame(() => setMobileBottomHeight(next));
    },
    [getBottomPanelMaxHeight, isDraggingBottomPanel, setMobileBottomHeight]
  );

  const endBottomPanelDrag = useCallback(() => {
    if (!isDraggingBottomPanel) return;
    setIsDraggingBottomPanel(false);
    const drag = mobileBottomDragRef.current;
    if (drag.currentHeight < 120) {
      closeBottomPanel();
      return;
    }
    const points = getBottomSnapPoints();
    const sorted = [...points].sort((a, b) => a - b);
    const currentIndex = sorted.reduce(
      (bestIndex, point, index) =>
        Math.abs(point - drag.currentHeight) < Math.abs(sorted[bestIndex] - drag.currentHeight)
          ? index
          : bestIndex,
      0
    );
    if (drag.velocity > 500) {
      const next = Math.max(0, currentIndex - 1);
      setMobileBottomHeight(sorted[next]);
      return;
    }
    if (drag.velocity < -500) {
      const next = Math.min(sorted.length - 1, currentIndex + 1);
      setMobileBottomHeight(sorted[next]);
      return;
    }
    snapBottomPanelTo(drag.currentHeight);
  }, [
    closeBottomPanel,
    getBottomSnapPoints,
    isDraggingBottomPanel,
    setMobileBottomHeight,
    snapBottomPanelTo,
  ]);

  useEffect(() => {
    if (!bottomPanelOpen) setMobileBottomHeight(0);
  }, [bottomPanelOpen, setMobileBottomHeight]);

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
                ref={exportBtnRef}
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
              ['--bottom-panel-height' as string]: '0px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 48,
                zIndex: 40,
                background: 'rgba(7,7,6,0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(196,124,46,0.1)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(196,124,46,0.08)',
                  border: '1px solid rgba(196,124,46,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--film-amber)',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 800,
                }}
              >
                P
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'rgba(240,230,204,0.65)',
                }}
              >
                {mobilePanelTitle}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
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
                    color: canUndo ? 'rgba(240,230,204,0.7)' : 'rgba(140,130,112,0.25)',
                    pointerEvents: canUndo ? 'auto' : 'none',
                  }}
                >
                  <Undo2 size={15} />
                </button>
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
                    color: canRedo ? 'rgba(240,230,204,0.7)' : 'rgba(140,130,112,0.25)',
                    pointerEvents: canRedo ? 'auto' : 'none',
                  }}
                >
                  <Redo2 size={15} />
                </button>
                <button
                  ref={exportBtnRef}
                  onClick={() => setExportOpen((v) => !v)}
                  aria-label="Export"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(196,124,46,0.1)',
                    border: '1px solid rgba(196,124,46,0.22)',
                    color: 'var(--film-amber)',
                  }}
                >
                  <Download size={15} />
                </button>
              </div>
            </div>

            <main
              id="main-canvas"
              aria-label="Poster canvas"
              onClick={(e) => {
                if (e.target === e.currentTarget) clearSelection();
              }}
              style={{
                position: 'absolute',
                top: 48,
                left: 0,
                right: 0,
                bottom:
                  'calc(56px + env(safe-area-inset-bottom, 0px) + var(--bottom-panel-height, 0px))',
                background: '#111113',
                overflow: 'hidden',
                transition: isDraggingBottomPanel
                  ? 'none'
                  : 'bottom 0.32s cubic-bezier(0.16,1,0.3,1)',
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

            <button
              aria-label="Toggle layers panel"
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
                background: 'rgba(10,9,8,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(196,124,46,0.2)',
                borderLeft: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: leftPanelOpen ? 'rgba(196,124,46,1)' : 'rgba(196,124,46,0.6)',
                transition: 'color 0.15s ease',
              }}
            >
              {leftPanelOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            </button>
            <button
              aria-label="Toggle selection panel"
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
                background: 'rgba(10,9,8,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(196,124,46,0.2)',
                borderRight: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: rightPanelOpen ? 'rgba(196,124,46,1)' : 'rgba(196,124,46,0.6)',
                transition: 'color 0.15s ease',
              }}
            >
              {rightPanelOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
            <button
              aria-label="Toggle selection panel"
              onClick={() => setRightPanelOpen((v) => !v)}
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(50% + 44px)',
                zIndex: 30,
                height: 32,
                minWidth: 64,
                maxWidth: 120,
                borderRadius: '16px 0 0 16px',
                background: selectedCount > 0 ? 'rgba(196,124,46,0.18)' : 'rgba(196,124,46,0.12)',
                border: `1px solid ${selectedCount > 0 ? 'rgba(196,124,46,0.4)' : 'rgba(196,124,46,0.25)'}`,
                borderRight: 'none',
                padding: '0 10px 0 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Syne, sans-serif',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: selectedCount > 0 ? 'var(--film-amber)' : 'rgba(140,130,112,0.4)',
                opacity: selectedCount > 0 ? 1 : 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'opacity 0.2s ease, background 0.15s ease, border-color 0.15s ease',
              }}
            >
              {selectedLabel}
            </button>

            <div
              onClick={() => setLeftPanelOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 24,
                background: 'rgba(0,0,0,0.4)',
                opacity: leftPanelOpen ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: leftPanelOpen ? 'auto' : 'none',
              }}
            />
            <aside
              style={{
                position: 'absolute',
                top: 48,
                left: 0,
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                width: 280,
                zIndex: 25,
                background: 'rgba(9,8,7,0.96)',
                backdropFilter: 'blur(24px)',
                borderRight: '1px solid rgba(196,124,46,0.18)',
                boxShadow: '4px 0 32px rgba(0,0,0,0.6)',
                transform: leftPanelOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                }}
              >
                <div
                  style={{
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 14px',
                    borderBottom: '1px solid rgba(196,124,46,0.08)',
                    gap: 8,
                  }}
                >
                  <Layers size={13} color="var(--film-amber)" />
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: 'var(--film-cream)',
                    }}
                  >
                    LAYERS
                  </span>
                  <button
                    onClick={() => setLeftPanelOpen(false)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(140,130,112,0.5)',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <LayersPanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  onSelect={handleSelectionOverride}
                  chrome={false}
                  detailLevel={mobileDetailLevel}
                />
              </div>
            </aside>

            <div
              onClick={() => setRightPanelOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 24,
                background: 'rgba(0,0,0,0.4)',
                opacity: rightPanelOpen ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: rightPanelOpen ? 'auto' : 'none',
              }}
            />
            <aside
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                width: 280,
                zIndex: 25,
                background: 'rgba(9,8,7,0.96)',
                backdropFilter: 'blur(24px)',
                borderLeft: '1px solid rgba(196,124,46,0.18)',
                boxShadow: '-4px 0 32px rgba(0,0,0,0.6)',
                transform: rightPanelOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                }}
              >
                <div
                  style={{
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 14px',
                    borderBottom: '1px solid rgba(196,124,46,0.08)',
                    gap: 8,
                  }}
                >
                  <MousePointer2 size={13} color="var(--film-amber)" />
                  <span
                    style={{
                      flex: 1,
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: 'var(--film-cream)',
                    }}
                  >
                    {selectedCount === 0 ? 'SELECTION' : selectedLabel}
                  </span>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    style={{
                      marginLeft: 'auto',
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(140,130,112,0.5)',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <SelectionPanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  selectedLogo={selectedLogo}
                  selectedMinimalElements={selectedMinimalElements}
                  detailLevel={mobileDetailLevel}
                />
              </div>
            </aside>

            <section
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                zIndex: 35,
                height: 'var(--bottom-panel-height, 0px)',
                minHeight: bottomPanelOpen ? 200 : 0,
                maxHeight: 'calc(100dvh - 48px - 56px - env(safe-area-inset-bottom, 0px) - 80px)',
                background: 'rgba(9,8,7,0.97)',
                backdropFilter: 'blur(24px)',
                borderTop: '1px solid rgba(196,124,46,0.2)',
                borderRadius: '16px 16px 0 0',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                transform: bottomPanelOpen ? 'translateY(0)' : 'translateY(100%)',
                opacity: bottomPanelOpen ? 1 : 0,
                pointerEvents: bottomPanelOpen ? 'auto' : 'none',
                transition: isDraggingBottomPanel
                  ? 'none'
                  : 'transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease, height 0.32s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div
                onTouchStart={(e) => beginBottomPanelDrag(e.touches[0].clientY)}
                onTouchMove={(e) => {
                  e.preventDefault();
                  moveBottomPanelDrag(e.touches[0].clientY);
                }}
                onTouchEnd={endBottomPanelDrag}
                style={{
                  height: 32,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    margin: '10px auto 0',
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.15)',
                  }}
                />
              </div>
              <div
                style={{
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 14px 0 16px',
                  borderBottom: '1px solid rgba(196,124,46,0.08)',
                }}
              >
                <div style={{ flex: 1, display: 'flex' }}>
                  {(['source', 'canvas', 'badges'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setBottomPanelTab(tab)}
                      style={{
                        height: 44,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color:
                          bottomPanelTab === tab ? 'var(--film-cream)' : 'rgba(140,130,112,0.4)',
                        borderBottom:
                          bottomPanelTab === tab
                            ? '2px solid var(--film-amber)'
                            : '2px solid transparent',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  onClick={closeBottomPanel}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(140,130,112,0.4)',
                  }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div
                ref={mobileBottomContentRef}
                onTouchStart={(e) => {
                  if (mobileBottomContentRef.current?.scrollTop === 0)
                    beginBottomPanelDrag(e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  if (isDraggingBottomPanel) {
                    e.preventDefault();
                    moveBottomPanelDrag(e.touches[0].clientY);
                  }
                }}
                onTouchEnd={endBottomPanelDrag}
                style={{
                  height: 'calc(100% - 76px)',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  paddingBottom: 20,
                }}
              >
                {bottomPanelTab === 'source' && (
                  <SourcePanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelectionOverride}
                    chrome={false}
                    detailLevel={mobileDetailLevel}
                  />
                )}
                {bottomPanelTab === 'canvas' && (
                  <PosterPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelectionOverride}
                    chrome={false}
                    detailLevel={mobileDetailLevel}
                  />
                )}
                {bottomPanelTab === 'badges' && (
                  <BadgesPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    selectedLogo={selectedLogo}
                    selectedMinimalElements={selectedMinimalElements}
                    detailLevel={mobileDetailLevel}
                  />
                )}
              </div>
            </section>

            <nav
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 56,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                zIndex: 40,
                background: 'rgba(7,7,6,0.97)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(196,124,46,0.12)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
                display: 'flex',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 28,
                  height: 2,
                  left: `calc(${bottomPanelTab === 'source' ? 16.6667 : bottomPanelTab === 'canvas' ? 50 : 83.3333}% - 14px)`,
                  background: 'var(--film-amber)',
                  borderRadius: '0 0 2px 2px',
                  opacity: bottomPanelOpen ? 1 : 0,
                  transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.15s ease',
                }}
              />
              {(
                [
                  { id: 'source', label: 'SOURCE', Icon: Film },
                  { id: 'canvas', label: 'CANVAS', Icon: Monitor },
                  { id: 'badges', label: 'BADGES', Icon: Sliders },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = bottomPanelOpen && bottomPanelTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => (active ? closeBottomPanel() : openBottomPanel(id))}
                    style={{
                      flex: 1,
                      height: 56,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      color: active ? 'var(--film-amber)' : 'rgba(140,130,112,0.45)',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    <Icon size={19} />
                    <span
                      style={{
                        fontFamily: 'Syne, sans-serif',
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.09em',
                      }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
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
