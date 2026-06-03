// src/components/builder/index.tsx
import React, { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
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
import MobileToolbar from './components/mobile/MobileToolbar';
import MobileDrawer from './components/mobile/MobileDrawer';
import MobileDock from './components/mobile/MobileDock';
import CanvasHandles from './components/mobile/CanvasHandles';
import ZoomPill from './components/mobile/ZoomPill';
import LongPressMenu from './components/mobile/LongPressMenu';
import { DEFAULT_ANIMATION, getDefaultDrawerHeight, type LeftDrawerTab, type RightDrawerTab, vibrate } from './components/mobile/utils';
import ToolbarBtn from './components/toolbar/ToolbarButton';
import ZoomOverlay from './components/canvas/ZoomOverlay';
import { EditorProvider, useEditor } from './context/EditorContext';
import {
  RotateCcw,
  Undo2,
  Redo2,
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

  const mobileGridRef = useRef<HTMLDivElement>(null);
  const mobileExportBtnRef = useRef<HTMLButtonElement>(null);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [leftDrawerTab, setLeftDrawerTab] = useState<LeftDrawerTab>('source');
  const [rightDrawerTab, setRightDrawerTab] = useState<RightDrawerTab>('badges');
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [mountedDrawer, setMountedDrawer] = useState<'left' | 'right' | null>(null);
  const [drawerTransitionLock, setDrawerTransitionLock] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const applyDrawerHeight = useCallback((height: number, transition = 'none') => {
    setDrawerHeight(height);
    const grid = mobileGridRef.current;
    if (!grid) return;
    grid.style.transition = transition;
    grid.style.setProperty('--drawer-height', `${height}px`);
    if (transition !== 'none') {
      window.setTimeout(() => {
        if (grid) grid.style.transition = 'none';
      }, 390);
    }
  }, []);

  const snapDrawerTo = useCallback((height: number) => {
    applyDrawerHeight(height, DEFAULT_ANIMATION);
  }, [applyDrawerHeight]);

  const closeMobileDrawers = useCallback(() => {
    setLeftDrawerOpen(false);
    setRightDrawerOpen(false);
    setDrawerTransitionLock(true);
    applyDrawerHeight(0, 'grid-template-rows 0.2s cubic-bezier(0.16, 1, 0.3, 1)');
    window.setTimeout(() => {
      setMountedDrawer(null);
      setDrawerTransitionLock(false);
      vibrate(4);
    }, 220);
  }, [applyDrawerHeight]);

  const openMobileDrawer = useCallback((side: 'left' | 'right', tab?: LeftDrawerTab | RightDrawerTab) => {
    if (drawerTransitionLock) return;
    if (side === 'left') {
      if (tab) setLeftDrawerTab(tab as LeftDrawerTab);
      setRightDrawerOpen(false);
      setMountedDrawer('left');
      setLeftDrawerOpen(true);
    } else {
      if (tab) setRightDrawerTab(tab as RightDrawerTab);
      setLeftDrawerOpen(false);
      setMountedDrawer('right');
      setRightDrawerOpen(true);
    }
    applyDrawerHeight(getDefaultDrawerHeight(), 'grid-template-rows 0.32s cubic-bezier(0.16, 1, 0.3, 1)');
    window.setTimeout(() => vibrate(4), 320);
  }, [applyDrawerHeight, drawerTransitionLock]);

  useEffect(() => {
    if (isDesktop) closeMobileDrawers();
  }, [isDesktop, closeMobileDrawers]);

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
      vibrate(10);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        if (!rightDrawerOpen) openMobileDrawer('right', 'selection');
        else if (rightDrawerTab === 'badges') setRightDrawerTab('selection');
      }
    },
    [handleSelection, openMobileDrawer, rightDrawerOpen, rightDrawerTab]
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

  const renderMobileDrawerContent = () => {
    if (mountedDrawer === 'left') {
      const simplePanelProps = { ...sharedPanelProps, detailLevel: 'simple' as const };
      return leftDrawerTab === 'source' ? (
        <SourcePanel {...simplePanelProps} chrome={false} />
      ) : (
        <LayersPanel {...simplePanelProps} chrome={false} />
      );
    }
    if (mountedDrawer === 'right') {
      const simpleInspectorProps = { ...sharedInspectorProps, detailLevel: 'simple' as const };
      return rightDrawerTab === 'badges' ? (
        <BadgesPanel {...simpleInspectorProps} />
      ) : (
        <SelectionPanel {...simpleInspectorProps} />
      );
    }
    return null;
  };

  const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0);

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
        @keyframes panel-title-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoom-pill-tap { 0% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(0.88); } 100% { transform: translateX(-50%) scale(1); } }
        @keyframes mobile-popover-in { from { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(8px); } to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); } }
        @keyframes mobile-count-in { from { transform: scale(0); } to { transform: scale(1); } }
        @media (max-width: 1023px) {
          .mobile-builder-shell { display: grid; grid-template-rows: 48px 1fr 64px; grid-template-areas: "toolbar" "body" "dock"; height: 100dvh; }
          .mobile-body-grid { display: grid !important; grid-template-rows: minmax(0, 1fr) var(--drawer-height, 0px); grid-template-columns: 1fr; will-change: grid-template-rows; min-height: 0; }
          #main-canvas { grid-row: 1; width: 100%; height: 100%; outline: 2px solid ${selectedIds.size + (selectedLogo ? 1 : 0) > 0 ? 'rgba(196,124,46,0.3)' : 'transparent'}; outline-offset: -2px; transition: outline-color 0.2s ease; }
          .mobile-toolbar { position: relative; z-index: 50; height: 48px; background: rgba(7,7,6,0.97); backdrop-filter: blur(24px) saturate(1.5); -webkit-backdrop-filter: blur(24px) saturate(1.5); border-bottom: 1px solid rgba(196,124,46,0.1); }
          .mobile-toolbar-ambient { position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; pointer-events: none; z-index: 1; background: linear-gradient(90deg, transparent, rgba(196,124,46,0.15), transparent); }
          .mobile-toolbar-row { height: 48px; display: flex; align-items: center; gap: 6px; padding: 0 10px; }
          .mobile-brand-mark { width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(196,124,46,0.2); background: rgba(196,124,46,0.08); color: var(--film-amber); font-size: 16px; font-weight: 800; letter-spacing: 0.12em; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .mobile-brand-mark:active { background: rgba(196,124,46,0.15); }
          .mobile-panel-title { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 0 8px; animation: panel-title-in 0.12s ease forwards; }
          .mobile-panel-title-main { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: var(--film-cream); font-family: Syne, sans-serif; }
          .mobile-panel-title-sub { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.08em; color: rgba(140,130,112,0.45); white-space: nowrap; }
          .mobile-toolbar-actions { flex-shrink: 0; display: flex; align-items: center; gap: 4px; }
          .mobile-toolbar-action, .mobile-export-button { width: 36px; height: 36px; padding: 2px; border: 1px solid transparent; background: transparent; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
          .mobile-toolbar-action-inner { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: transform 0.12s ease; }
          .mobile-toolbar-action:active .mobile-toolbar-action-inner, .mobile-export-button:active .mobile-toolbar-action-inner { transform: scale(0.88); background: rgba(255,255,255,0.06); }
          .mobile-toolbar-divider { width: 1px; height: 16px; background: rgba(196,124,46,0.12); margin: 0 2px; }
          .mobile-export-button .mobile-toolbar-action-inner { background: rgba(196,124,46,0.12); border: 1px solid rgba(196,124,46,0.25); color: var(--film-amber); }
          .mobile-export-button:active .mobile-toolbar-action-inner { background: rgba(196,124,46,0.2); }
          .mobile-canvas-handle { position: absolute; top: 50%; z-index: 20; width: 24px; height: 72px; transform: translateY(-50%); background: rgba(10,9,8,0.92); backdrop-filter: blur(16px) saturate(1.3); -webkit-backdrop-filter: blur(16px) saturate(1.3); border: 1px solid rgba(196,124,46,0.2); display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center; color: rgba(196,124,46,0.55); }
          .mobile-canvas-handle-left { left: 0; border-left: none; border-radius: 0 10px 10px 0; box-shadow: 4px 0 16px rgba(0,0,0,0.4); }
          .mobile-canvas-handle-right { right: 0; border-right: none; border-radius: 10px 0 0 10px; box-shadow: -4px 0 16px rgba(0,0,0,0.4); }
          .mobile-canvas-handle.is-pressed, .mobile-canvas-handle:active { background: rgba(196,124,46,0.12); color: rgba(196,124,46,0.9); }
          .mobile-handle-dots { display: flex; flex-direction: column; gap: 4px; } .mobile-handle-dots i { width: 3px; height: 3px; border-radius: 50%; background: rgba(196,124,46,0.3); }
          .mobile-handle-icon { transition: color 0.2s ease; }
          .mobile-zoom-pill { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); z-index: 30; height: 26px; padding: 0 10px; border-radius: 13px; background: rgba(10,9,8,0.9); backdrop-filter: blur(12px); border: 1px solid rgba(196,124,46,0.18); box-shadow: 0 2px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 6px; color: rgba(196,124,46,0.6); font: 500 9px 'JetBrains Mono', monospace; letter-spacing: 0.06em; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
          .mobile-zoom-pill svg { color: rgba(196,124,46,0.5); } .mobile-zoom-pill.is-visible { opacity: 1; pointer-events: auto; } .mobile-zoom-pill.is-pulsing { animation: zoom-pill-tap 0.2s ease; }
          .mobile-drawer { grid-row: 2; position: relative; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; background: rgba(9,8,7,0.97); backdrop-filter: blur(28px) saturate(1.6); -webkit-backdrop-filter: blur(28px) saturate(1.6); border-top: 1px solid rgba(196,124,46,0.22); border-radius: 18px 18px 0 0; box-shadow: 0 -12px 60px rgba(0,0,0,0.7), 0 -1px 0 rgba(196,124,46,0.08); }
          .mobile-drawer-grip { position: absolute; top: 0; left: 50%; transform: translateX(-50%); z-index: 10; width: 80px; height: 24px; background: transparent; touch-action: none; display: flex; justify-content: center; align-items: flex-start; padding-top: 10px; }
          .mobile-drawer-grip span { width: 40px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.18); transition: width 0.15s ease, background 0.15s ease; } .mobile-drawer.is-dragging .mobile-drawer-grip span { width: 48px; background: rgba(255,255,255,0.35); }
          .mobile-drawer-header { height: 68px; flex-shrink: 0; display: flex; align-items: center; padding: 20px 12px 0 16px; border-bottom: 1px solid rgba(196,124,46,0.08); touch-action: none; }
          .mobile-drawer-tabs { flex: 1; display: flex; align-items: center; height: 100%; min-width: 0; } .mobile-drawer-tabs button { flex: 1; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; gap: 5px; color: rgba(140,130,112,0.45); font: 700 10px Syne, sans-serif; letter-spacing: 0.1em; } .mobile-drawer-tabs button.is-active { color: var(--film-cream); }
          .mobile-drawer-tabs button i { position: absolute; bottom: 0; left: 20%; width: 60%; height: 2px; opacity: 0; background: linear-gradient(90deg, transparent, var(--film-amber), transparent); } .mobile-drawer-tabs button.is-active i { opacity: 1; } .mobile-drawer-tabs b { width: 16px; height: 16px; border-radius: 50%; display: grid; place-items: center; background: rgba(196,124,46,0.9); color: #070706; font: 700 8px 'JetBrains Mono', monospace; }
          .mobile-drawer-icon-button { width: 28px; height: 28px; margin-left: 6px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03); color: rgba(140,130,112,0.5); display: grid; place-items: center; } .mobile-drawer-icon-button:active { color: rgba(196,124,46,0.8); background: rgba(196,124,46,0.08); }
          .mobile-drawer-snap-dots { width: 16px; padding: 2px; margin-right: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; } .mobile-drawer-snap-dots button { width: 10px; height: 10px; display: grid; place-items: center; } .mobile-drawer-snap-dots button::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: rgba(196,124,46,0.3); } .mobile-drawer-snap-dots button.is-active::after { background: rgba(196,124,46,0.9); }
          .mobile-drawer-content { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; touch-action: pan-y; scrollbar-width: thin; scrollbar-color: rgba(196,124,46,0.15) transparent; padding-bottom: 24px; transition: opacity 0.12s ease; } .mobile-drawer-content.is-fading { opacity: 0; } .mobile-drawer-content-inner { animation: panel-title-in 0.12s ease forwards; }
          .mobile-dock { position: relative; z-index: 50; height: 64px; min-height: 64px; padding-bottom: env(safe-area-inset-bottom,0px); background: rgba(7,7,6,0.98); backdrop-filter: blur(24px) saturate(1.5); -webkit-backdrop-filter: blur(24px) saturate(1.5); border-top: 1px solid rgba(196,124,46,0.12); box-shadow: 0 -4px 32px rgba(0,0,0,0.5), 0 -1px 0 rgba(196,124,46,0.06); display: flex; align-items: stretch; }
          .mobile-dock-active-line { position: absolute; top: -1px; width: 32px; height: 2px; background: var(--film-amber); border-radius: 0 0 2px 2px; transition: left 0.28s cubic-bezier(0.4,0,0.2,1); z-index: 1; }
          .mobile-dock-item { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; touch-action: manipulation; color: rgba(140,130,112,0.45); } .mobile-dock-item.is-active { color: var(--film-amber); }
          .mobile-dock-item-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1); } .mobile-dock-item:active .mobile-dock-item-inner { transform: scale(0.88); transition: transform 0.08s ease; }
          .mobile-dock-item-inner span { margin-top: 2px; line-height: 1; font: 700 8px Syne, sans-serif; letter-spacing: 0.1em; } .mobile-dock-center-bg { position: absolute; inset: 8px 4px; border-radius: 10px; background: transparent; transition: background 0.2s ease; } .mobile-dock-item.is-center.is-active .mobile-dock-center-bg { background: rgba(196,124,46,0.06); }
          .mobile-dock-count { position: absolute; top: 8px; right: calc(50% - 14px); width: 16px; height: 16px; border-radius: 50%; background: rgba(196,124,46,0.95); border: 1.5px solid rgba(7,7,6,0.8); color: #070706; display: grid; place-items: center; font: 800 8px 'JetBrains Mono', monospace; animation: mobile-count-in 0.2s cubic-bezier(0.34,1.56,0.64,1); }
          .mobile-longpress-scrim { position: fixed; inset: 0; z-index: 8997; background: transparent; } .mobile-longpress-menu { position: fixed; z-index: 8998; bottom: calc(64px + env(safe-area-inset-bottom,0px) + 8px); left: 50%; transform: translateX(-50%); display: flex; gap: 8px; padding: 8px; border-radius: 12px; background: rgba(9,8,7,0.95); border: 1px solid rgba(196,124,46,0.18); box-shadow: 0 12px 36px rgba(0,0,0,0.55); animation: mobile-popover-in 0.2s cubic-bezier(0.16,1,0.3,1); } .mobile-longpress-menu button { width: 36px; height: 36px; border-radius: 8px; background: rgba(14,13,11,0.95); border: 1px solid rgba(196,124,46,0.2); color: var(--film-amber); display: grid; place-items: center; }
        }

      `}</style>

      <div
        className="builder-ui mobile-builder-shell overflow-hidden"
        style={{
          height: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <h1 className="sr-only">Posterium Poster Builder</h1>

        {!isFullscreen && (
          <MobileToolbar
            leftOpen={leftDrawerOpen}
            rightOpen={rightDrawerOpen}
            leftTab={leftDrawerTab}
            rightTab={rightDrawerTab}
            selectedIds={selectedIds}
            selectedLogo={selectedLogo}
            config={config}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onExport={() => setExportOpen((v) => !v)}
            exportButtonRef={mobileExportBtnRef}
          />
        )}

        {(isResetOpen || isImportOpen || shortcutsOpen || ctxMenu.visible || paletteOpen || exportOpen) && (
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
                anchorRef={(isDesktop ? exportBtnRef : mobileExportBtnRef) as React.RefObject<HTMLButtonElement>}
              />
            )}
          </Suspense>
        )}

        {/* ── HEADER ── */}
        {!isFullscreen && (
          <header
            className="h-12 shrink-0 items-center z-30 relative hidden lg:flex"
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

        {/* ── BODY ── */}
        <div ref={mobileGridRef} className="mobile-body-grid flex flex-1 overflow-hidden relative flex-col lg:flex-row" style={{ gridArea: 'body', ['--drawer-height' as string]: `${drawerHeight}px` }}>
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
              if (e.target === e.currentTarget) {
                clearSelection();
                vibrate(5);
              }
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

            {!isFullscreen && (
              <CanvasHandles
                leftOpen={leftDrawerOpen}
                rightOpen={rightDrawerOpen}
                onToggleLeft={() => {
                  if (leftDrawerOpen) closeMobileDrawers();
                  else openMobileDrawer('left', leftDrawerTab);
                }}
                onToggleRight={() => {
                  if (rightDrawerOpen) closeMobileDrawers();
                  else openMobileDrawer('right', rightDrawerTab);
                }}
                onCloseLeft={closeMobileDrawers}
                onCloseRight={closeMobileDrawers}
              />
            )}

            <PreviewCanvas
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              onSelect={handleSelectionOverride}
              onContextMenu={openCtxMenu}
              onLogoContextMenu={(e) => openCtxMenu('logo', e)}
            />
            {/* Film corner accents */}
            {!isFullscreen && <ZoomPill onResetView={dispatchResetView} />}

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

          {/* Mobile Drawer (in-flow grid row) */}
          {!isFullscreen && mountedDrawer && (
            <MobileDrawer
              side={mountedDrawer}
              isOpen={mountedDrawer === 'left' ? leftDrawerOpen : rightDrawerOpen}
              drawerHeight={drawerHeight}
              onHeightChange={(height) => applyDrawerHeight(height, 'none')}
              onSnap={snapDrawerTo}
              onClose={closeMobileDrawers}
              activeTab={mountedDrawer === 'left' ? leftDrawerTab : rightDrawerTab}
              onTabChange={(tab) => {
                if (mountedDrawer === 'left') setLeftDrawerTab(tab as LeftDrawerTab);
                else setRightDrawerTab(tab as RightDrawerTab);
              }}
              selectedCount={selectedCount}
            >
              {renderMobileDrawerContent()}
            </MobileDrawer>
          )}
        </div>

        {/* Mobile dock */}
        {!isFullscreen && (
          <MobileDock
            leftOpen={leftDrawerOpen}
            rightOpen={rightDrawerOpen}
            leftTab={leftDrawerTab}
            rightTab={rightDrawerTab}
            selectedCount={selectedCount}
            onSource={() => {
              if (leftDrawerOpen && leftDrawerTab === 'source') closeMobileDrawers();
              else if (leftDrawerOpen) setLeftDrawerTab('source');
              else openMobileDrawer('left', 'source');
            }}
            onLayers={() => {
              if (leftDrawerOpen && leftDrawerTab === 'layers') closeMobileDrawers();
              else if (leftDrawerOpen) setLeftDrawerTab('layers');
              else openMobileDrawer('left', 'layers');
            }}
            onCanvas={() => { closeMobileDrawers(); clearSelection(); }}
            onBadges={() => {
              if (rightDrawerOpen && rightDrawerTab === 'badges') closeMobileDrawers();
              else if (rightDrawerOpen) setRightDrawerTab('badges');
              else openMobileDrawer('right', 'badges');
            }}
            onSelect={() => {
              if (rightDrawerOpen && rightDrawerTab === 'selection') closeMobileDrawers();
              else if (rightDrawerOpen) setRightDrawerTab('selection');
              else openMobileDrawer('right', 'selection');
            }}
            onCanvasLongPress={() => setQuickMenuOpen(true)}
          />
        )}
        <LongPressMenu
          open={quickMenuOpen}
          onClose={() => setQuickMenuOpen(false)}
          onResetView={dispatchResetView}
          onToggleGrid={() => toggleViewOption('showGrid')}
          onToggleSafeArea={() => toggleViewOption('showSafeArea')}
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
          viewOptions={viewOptions}
          onToggleViewOption={toggleViewOption}
        />
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
