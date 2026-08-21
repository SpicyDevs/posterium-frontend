// src/components/builder/index.tsx
import React, { Suspense, lazy, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PosterConfig, ExtensionType, RatingType } from './types';
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
import { generateApiUrl } from './utils/url-generator';
import { BUILDER_STORAGE_KEY } from './builderStorage';
import PreviewCanvas from './components/PreviewCanvas';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/Inspector';
import AdvancedPanelNav, { type BuilderPanelId } from './components/AdvancedPanelNav';
import ModeToggle, { type BuilderMode } from './components/ModeToggle';
import { SourcePanel, LayersPanel, BadgesPanel, SelectionPanel } from './components/panels';
import BuilderDesktopHeader from './components/BuilderDesktopHeader';
import ZoomOverlay from './components/ZoomOverlay';
import { EditorProvider, useEditor } from './EditorContext';
import { FilmCorners } from '@/ui/primitives';
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
  Sliders,
  MousePointer2,
  CheckSquare,
  MousePointer2Off,
  Download,
  Contrast,
  ArrowUpToLine,
  ArrowDownToLine,
  ScanLine,
  Search,
  Keyboard,
  Type,
  ChevronDown,
  BookOpen,
  CopyPlus,
  Check,
  Trash2,
  Link2,
} from 'lucide-react';
import { ToastProvider, useToast } from './components/ui/Toast';
import { usePosterHistory } from './usePosterHistory';
import { useMobileBottomSheet } from './useMobileBottomSheet';
import type { ContextMenuState, LayerTargetId } from './components/ContextMenu';
import type { PaletteCommand } from './components/CommandPalette';
import type { ExamplePreset } from '@/modules/ExamplesPage';
import {
  clearWalkthroughState,
  getWalkthroughState,
  saveWalkthroughState,
  saveBuilderMode,
  getBuilderMode,
} from './walkthroughStorage';
import WalkthroughModal from './components/walkthrough/WalkthroughModal';

const KeyboardShortcutsModal = lazy(() => import('./components/KeyboardShortcutsModal'));
const ResetDialog = lazy(() => import('./components/ResetDialogue'));
const ImportDialog = lazy(() => import('./components/ImportDialogue'));
const ExportPopover = lazy(() => import('./components/ExportPopover'));
const ContextMenu = lazy(() => import('./components/ContextMenu'));
const CommandPalette = lazy(() => import('./components/CommandPalette'));

// ── Mobile toolbar button ─────────────────────────────────────────────────────
// The row-2 toolbar control. Icon-only by default — the glyph must be
// self-evident (ui-design-aesthetics: distinctive, unambiguous iconography).
// An optional caption is added ONLY where several similar glyphs sit close
// together and would otherwise be ambiguous (the undo/redo mirrored pair).
// Punched 4px radius (DESIGN two-radius economy: buttons are punched, not
// housed), 44px+ touch target, active/danger/disabled states.
// ── Studio layout ─────────────────────────────────────────────────────────────
const StudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  loadConfigInline?: (url: string) => { ok: boolean; error?: string };
  showCoach?: boolean;
  onCoachStart?: () => void;
  onCoachTour?: () => void;
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
  loadConfigInline,
  showCoach = false,
  onCoachStart,
  onCoachTour,
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
    selectedTitle,
    selectedMinimalElements,
    handleSelection,
    handleLogoSelection,
    handleTitleSelection,
    clearSelection,
    setBatchSelection,
    viewOptions,
    toggleViewOption,
  } = useEditor();

  const { toast } = useToast();

  const [builderMode, setBuilderMode] = useState<BuilderMode>(initialMode);
  const [advancedPanel, setAdvancedPanel] = useState<BuilderPanelId>('source');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  // Import and Export are desktop-header chrome on desktop; on mobile they
  // live in their own sheets (Source tab / export sheet) and need no anchor
  // ref. The dialogs only ever anchor to the visible desktop button now.
  const importBtnRefDesktop = useRef<HTMLButtonElement>(null);
  const importBtnRef = importBtnRefDesktop;
  const exportBtnRefDesktop = useRef<HTMLButtonElement>(null);
  const exportBtnRef = exportBtnRefDesktop;
  const mobileRootRef = useRef<HTMLDivElement>(null);
  const mobileCanvasRef = useRef<HTMLElement>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<
    'source' | 'layers' | 'badges' | 'selection'
  >('source');
  const [mobileExportOpen, setMobileExportOpen] = useState(false);
  // Starter helper card — shows on a blank canvas (fresh visit or reset) and
  // hides once the canvas has content or the user dismisses it.
  const [showStarterHelp, setShowStarterHelp] = useState(() => {
    const saved = localStorage.getItem(BUILDER_STORAGE_KEY);
    const hasContent = saved
      ? (() => {
          try {
            const cfg = JSON.parse(saved) as PosterConfig;
            return Boolean(
              cfg.imdbId ||
              cfg.tmdbId ||
              (cfg.ratings?.length ?? 0) > 0 ||
              cfg.logo ||
              cfg.titleEnabled
            );
          } catch {
            return true;
          }
        })()
      : false;
    return !hasContent;
  });
  const importFieldRef = useRef<HTMLInputElement>(null);
  const [importFocus, setImportFocus] = useState(0);
  // Mobile export sheet — 3-step flow (1 = format, 2 = progress, 3 = success).
  // Replaces the floating export popover on the mobile tree.
  const [exportStep, setExportStep] = useState<1 | 2 | 3>(1);
  const [exportAdvancedOpen, setExportAdvancedOpen] = useState(false);
  // Source-tab import — inline errors render inside the field, not toasts.
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  // Toolbar Reset button arms before firing (two-tap destructive) and
  // disarms when any other toolbar tool is tapped.
  const [resetArmed, setResetArmed] = useState(false);
  // View-tab zoom slider tracks its own value; deltas go to the canvas via the
  // shared canvas-zoom event so pinch-zoom stays the authoritative scale.
  const [viewZoom, setViewZoom] = useState(1);
  // Tablet tier (700–1023px): the phone shell keeps its header/tab bar/sheet,
  // but the canvas centers with gutters and the edge drawers return (they are
  // legitimate at this width — see diagnosis 2.15).
  const [isTablet, setIsTablet] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 700 && window.innerWidth < 1024
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 700px) and (max-width: 1023px)');
    const handle = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  // Export sheet format choice — starts at PNG (the mobile default).
  const [exportFormat, setExportFormat] = useState<ExtensionType>('png');

  // Source-tab import: field focus is requested via a counter so the keyboard
  // re-focuses after the bottom sheet opens and the layout shifts.
  useEffect(() => {
    if (importFocus > 0) importFieldRef.current?.focus();
  }, [importFocus]);

  const submitMobileImport = useCallback(() => {
    if (!loadConfigInline) {
      setImportError('Import is unavailable right now');
      return;
    }
    const url = importUrl.trim();
    if (!url) {
      setImportError('Paste a poster URL first');
      return;
    }
    const result = loadConfigInline(url);
    if (!result.ok) {
      setImportError(result.error ?? 'Enter a valid poster URL');
      return;
    }
    setImportUrl('');
    setImportError(null);
  }, [importUrl, loadConfigInline, setImportError, setImportUrl]);

  // Native Fullscreen API is handled by ZoomOverlay's internal nativeFs state
  // on mobile (the pill) and by the desktop isFullscreen state.

  const {
    bottomPanelOpen,
    isDragging: isDraggingBottomPanel,
    snapIndex: bottomSheetSnap,
    open: openBottomPanelSheet,
    close: closeBottomPanel,
    beginDrag: beginBottomPanelDrag,
    moveDrag: moveBottomPanelDrag,
    endDrag: endBottomPanelDrag,
  } = useMobileBottomSheet(mobileRootRef);

  const openBottomPanel = useCallback(
    (tab: 'source' | 'layers' | 'badges' | 'selection') => {
      setBottomPanelTab(tab);
      setMobileExportOpen(false);
      openBottomPanelSheet();
    },
    [openBottomPanelSheet]
  );

  useEffect(() => {
    if (['source', 'layers', 'badges', 'selection'].includes(activeTab)) {
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

  // Fullscreen canvas is a desktop concept. The mobile tree renders under
  // `!isFullscreen && !isDesktop`, so flipping isFullscreen on a phone would
  // unmount BOTH trees (the desktop tree is gated on isDesktop) and leave a
  // blank screen — the "mobile fullscreen no-op". Guard at the source so no
  // caller (palette command, F key) can ever hit that state on mobile.
  const toggleFullscreen = useCallback(() => {
    if (!isDesktop) return;
    setIsFullscreen((v) => !v);
  }, [isDesktop]);

  // Mobile fullscreen instead uses the native element Fullscreen API on the
  // canvas container, tracked locally — iOS Safari has no fullscreenEnabled,
  // so ZoomOverlay hides the button there and this stays a safe no-op.
  const handleMobileFullscreen = useCallback(() => {
    const el = mobileCanvasRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else if (document.fullscreenEnabled) {
      void el.requestFullscreen().catch(() => undefined);
    }
  }, []);

  // Virtual-keyboard avoidance. iOS Safari only reports the keyboard via
  // visualViewport (Android resizes the layout viewport thanks to
  // interactive-widget=resizes-content in BaseLayout — there this delta stays
  // ~0 and 100dvh already shrinks). When the keyboard is up, shrink the fixed
  // shell to the visible viewport so header, nav, drawers and the bottom
  // sheet stay reachable instead of hiding behind the keyboard. The 120px
  // threshold skips URL-bar-collapse noise on scrollable pages.
  const [kbInset, setKbInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const dh = window.innerHeight - vv.height;
      setKbInset(dh > 120 ? dh : 0);
    };
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    badgeId: null,
  });
  const openCtxMenu = useCallback((badgeId: LayerTargetId, e: React.MouseEvent) => {
    e.preventDefault();
    // Desktop-only surface. Android long-press dispatches `contextmenu` with
    // button 0 — mobile has its own long-press additive-select gesture in
    // DraggableBadge, so never open the desktop ContextMenu for touch. The
    // native browser menu is already suppressed by DraggableBadge's own
    // onContextMenu preventDefault; this gate stops the in-app menu instead.
    if (e.nativeEvent.button !== 2) return;
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, badgeId });
  }, []);
  const closeCtxMenu = useCallback(() => setCtxMenu((s) => ({ ...s, visible: false })), []);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const selectedIdsRef = useRef(selectedIds);
  const selectedLogoRef = useRef(selectedLogo);
  const selectedTitleRef = useRef(selectedTitle);
  const selectedMinimalElementsRef = useRef(selectedMinimalElements);
  const configRatingsRef = useRef(config.ratings);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  });
  useEffect(() => {
    selectedLogoRef.current = selectedLogo;
  });
  useEffect(() => {
    selectedTitleRef.current = selectedTitle;
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
      const hasTitle = selectedTitleRef.current || activeMinimal.includes('minimal-title');
      if (activeBadges.length === 0 && activeMinimal.length === 0 && !hasLogo && !hasTitle) return;
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
        if (hasTitle) {
          const ti = next.items?.title ?? {};
          const boxW = Math.max(120, ti.textBoxWidth ?? 450);
          const boxH = Math.max(36, (ti.textSize ?? 48) * 1.5);
          next.items = {
            ...next.items,
            title: {
              ...ti,
              x: Math.max(0, Math.min(CANVAS_WIDTH - boxW, (ti.x ?? 25) + dx)),
              y: Math.max(boxH, Math.min(CANVAS_HEIGHT, (ti.y ?? 100) + dy)),
            },
          };
        }
        if (activeMinimal.includes('minimal-title')) {
          const ti = next.items?.title ?? {};
          const boxW = Math.max(120, ti.textBoxWidth ?? 450);
          const boxH = Math.max(36, (ti.textSize ?? 48) * 1.5);
          next.items = {
            ...next.items,
            title: {
              ...ti,
              x: Math.max(0, Math.min(CANVAS_WIDTH - boxW, (ti.x ?? 25) + dx)),
              y: Math.max(boxH, Math.min(CANVAS_HEIGHT, (ti.y ?? 100) + dy)),
            },
          };
        }
        if (activeMinimal.includes('minimal-year')) {
          const yearItem = { ...(next.items.year ?? { icon: false, alpha: 0 }) };
          yearItem.x = Math.max(0, Math.min(CANVAS_WIDTH - 120, (yearItem.x ?? 25) + dx));
          yearItem.y = Math.max(0, Math.min(CANVAS_HEIGHT - 40, (yearItem.y ?? 683) + dy));
          next.items = { ...next.items, year: yearItem };
        }
        return next;
      });
    },
    [setConfig]
  );

  const handleSelectionOverride = useCallback(
    (id: RatingType, multi: boolean) => {
      handleSelection(id, multi);
      // Mobile: the Inspector drawer is gone — selection opens the EDIT sheet
      // tab instead (the dynamic 4th tab).
      if (!isDesktop) {
        setRightPanelOpen(false);
        setLeftPanelOpen(false);
        openBottomPanel('selection');
      }
    },
    [handleSelection, isDesktop, openBottomPanel]
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
      ratings: ALL_BADGES.map((b) => b.id),
    }));
  }, []);

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
      if (id === 'title') {
        setConfig((prev) => ({ ...prev, titleEnabled: false }));
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
        }));
        return;
      }
      if (id === 'title') {
        setConfig((prev) => {
          const ni = { ...prev.items };
          delete ni.title;
          return { ...prev, items: ni };
        });
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
      if (id === 'title') {
        setConfig((prev) => ({ ...prev, titleEnabled: false }));
        clearSelection();
        return;
      }
      deleteBadge(id);
    },
    [setConfig, clearSelection, deleteBadge]
  );

  // Duplicate badge(s): the poster model keys badges by provider — one
  // instance per badge type — so "duplicate" never appends a second copy.
  // Instead it re-adds the badge ON TOP of the stack (its ratings entry is
  // moved to the end, the render order) at +12px from its current position
  // and selects it. A badge that was never dragged has no items[id]; its
  // rendered position is the auto-layout slot from calculateAutoPosition.
  // History is recorded automatically through setConfig (usePosterHistory).
  const handleDuplicateBadge = useCallback(
    (ids: LayerTargetId[]) => {
      const badgeIds = ids.filter((id): id is RatingType => id !== 'logo' && id !== 'title');
      if (badgeIds.length === 0) return;
      setConfig((prev) => {
        const ni = { ...prev.items };
        for (const id of badgeIds) {
          const base = prev.items[id];
          if (base) {
            ni[id] = { ...base, x: (base.x ?? 25) + 12, y: (base.y ?? 25) + 12 };
          } else {
            // Never dragged — anchor to the badge's auto-layout slot.
            const auto = calculateAutoPosition(
              id,
              Math.max(0, prev.ratings.indexOf(id)),
              prev.ratings.length,
              prev
            );
            ni[id] = { x: auto.x + 12, y: auto.y + 12 };
          }
        }
        return {
          ...prev,
          items: ni,
          ratings: [...prev.ratings.filter((r) => !badgeIds.includes(r)), ...badgeIds],
        };
      });
      setBatchSelection(badgeIds);
    },
    [setConfig, setBatchSelection]
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
        if (mobileExportOpen) {
          setMobileExportOpen(false);
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
      if (mod && e.shiftKey && e.key.toLowerCase() === 'd') {
        // Duplicate the selected badges (⌘⇧D) — must run before plain ⌘D.
        e.preventDefault();
        handleDuplicateBadge(Array.from(selectedIdsRef.current));
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
        (selectedIdsRef.current.size > 0 || selectedLogoRef.current || selectedTitleRef.current)
      ) {
        e.preventDefault();
        const rm = new Set(selectedIdsRef.current);
        if (rm.size > 0) {
          setConfig((p) => ({ ...p, ratings: p.ratings.filter((r) => !rm.has(r)) }));
        }
        if (selectedTitleRef.current) {
          setConfig((p) => ({ ...p, titleEnabled: false }));
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
    mobileExportOpen,
    selectedIds,
    selectedLogo,
    selectedMinimalElements,
    isDesktop,
    handleDuplicateBadge,
  ]);

  // ── Panel widths ──────────────────────────────────────────────────────────
  const [leftW, setLeftW] = useState(272);
  const [rightW, setRightW] = useState(272);

  const startResizeLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const sx = e.clientX,
        sw = leftW;
      const move = (m: MouseEvent) => {
        const newW = sw + m.clientX - sx;
        if (newW < 120) {
          // Collapse for the moment, but never latch mid-gesture: while the
          // pointer is down the divider stays live, so dragging back out
          // re-expands at the drag position.
          setLeftVisible(false);
          setLeftW(272);
        } else {
          setLeftVisible(true);
          setLeftW(Math.max(220, Math.min(newW, 540)));
        }
      };
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
      const move = (m: MouseEvent) => {
        const newW = sw - (m.clientX - sx);
        if (newW < 120) {
          // See startResizeLeft: collapse mid-gesture, re-expand on drag-back.
          setRightVisible(false);
          setRightW(272);
        } else {
          setRightVisible(true);
          setRightW(Math.max(248, Math.min(newW, 540)));
        }
      };
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
      id: 'duplicate-badge',
      label: 'Duplicate Badge',
      category: 'Layers & Selection',
      icon: <CopyPlus size={13} />,
      shortcut: '⌘⇧D',
      keywords: ['duplicate', 'clone', 'copy badge'],
      action: () => handleDuplicateBadge(Array.from(selectedIds)),
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
      id: 'export-webp',
      label: 'Export as WebP',
      category: 'Export',
      icon: <Download size={13} />,
      action: () => {
        setConfig((p) => ({ ...p, extension: 'webp' }));
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
    {
      id: 'rerun-walkthrough',
      label: 'Show Walkthrough / Re-run Onboarding',
      category: 'File',
      icon: <BookOpen size={13} />,
      keywords: ['onboarding', 'tour', 'guide', 'help', 'start', 'welcome'],
      action: () => {
        clearWalkthroughState();
        window.location.reload();
      },
    },
  ];

  const ctxBadgeSelected = ctxMenu.badgeId
    ? ctxMenu.badgeId === 'logo'
      ? selectedLogo
      : ctxMenu.badgeId === 'title'
        ? selectedTitle
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
    selectedTitle,
    selectedMinimalElements,
    detailLevel: advancedDetailLevel as 'simple' | 'advanced',
  };

  const selectedCount =
    selectedIds.size +
    (selectedLogo ? 1 : 0) +
    (selectedTitle ? 1 : 0) +
    selectedMinimalElements.size;
  const selectedLabel = useMemo(() => {
    if (selectedCount === 0) return 'NOTHING SELECTED';
    if (selectedCount > 1) return `${selectedCount} LAYERS`;
    if (selectedLogo) return 'LOGO';
    if (selectedTitle) return 'TITLE';
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
        .builder-ui, .builder-ui * {
          user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
        }
        .builder-ui input, .builder-ui textarea, .builder-ui [contenteditable] {
          user-select: text; -webkit-user-select: text;
        }
        /* App-shell feel on touch: no tap flash, no double-tap zoom, no iOS
           long-press callout on chrome surfaces (inputs keep text selection
           above; the canvas/badges/sheet set their own touch-action). */
        .builder-ui { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .sidebar-transition { transition: opacity 0.2s ease; }
        .sidebar-resizing .sidebar-transition { transition: opacity 0.2s ease !important; }
        .mobile-header-scroll::-webkit-scrollbar { display: none; }
        /* The mobile tab bar's row of tabs scrolls horizontally at 320px;
           hide the scrollbar so it reads as a fixed chrome strip. */
        .mobile-tab-scroll { overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .mobile-tab-scroll::-webkit-scrollbar { display: none; }
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
                onConfirm={() => {
                  handleReset();
                  clearSelection();
                }}
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
                  id === 'logo'
                    ? moveLogoLayer('front')
                    : id === 'title'
                      ? null
                      : moveLayer(id, 'front')
                }
                onBringForward={(id) =>
                  id === 'logo'
                    ? moveLogoLayer('forward')
                    : id === 'title'
                      ? null
                      : moveLayer(id, 'forward')
                }
                onSendBackward={(id) =>
                  id === 'logo'
                    ? moveLogoLayer('back')
                    : id === 'title'
                      ? null
                      : moveLayer(id, 'back')
                }
                onSendToBack={(id) =>
                  id === 'logo'
                    ? moveLogoLayer('toback')
                    : id === 'title'
                      ? null
                      : moveLayer(id, 'toback')
                }
                onHide={hideLayer}
                onShowAll={showAllBadges}
                onSelect={(id) =>
                  id === 'logo'
                    ? handleLogoSelection(false)
                    : id === 'title'
                      ? handleTitleSelection(false)
                      : handleSelectionOverride(id, false)
                }
                onDeselect={() => clearSelection()}
                onSelectAll={() => setBatchSelection(config.ratings)}
                onDeselectAll={clearSelection}
                onResetBadge={resetLayer}
                onDelete={deleteLayer}
                onDuplicate={(id) => handleDuplicateBadge([id])}
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

        <BuilderDesktopHeader
          isFullscreen={isFullscreen}
          builderMode={builderMode}
          setBuilderMode={setBuilderMode}
          setPaletteOpen={setPaletteOpen}
          shortcutsOpen={shortcutsOpen}
          setShortcutsOpen={setShortcutsOpen}
          canUndo={canUndo}
          undo={undo}
          canRedo={canRedo}
          redo={redo}
          importBtnRef={importBtnRefDesktop}
          exportBtnRefDesktop={exportBtnRefDesktop}
          exportOpen={exportOpen}
          setExportOpen={setExportOpen}
          setIsResetOpen={setIsResetOpen}
          setIsImportOpen={setIsImportOpen}
          onRerunWalkthrough={() => {
            clearWalkthroughState();
            window.location.reload();
          }}
        />

        {/* ── MOBILE BUILDER (mounted only on non-desktop — see isDesktop) ── */}
        {!isFullscreen && !isDesktop && (
          <div
            ref={mobileRootRef}
            className="lg:hidden"
            style={
              {
                position: 'fixed',
                inset: 0,
                height: kbInset > 0 ? `calc(100dvh - ${kbInset}px)` : '100dvh',
                width: '100vw',
                background: 'var(--film-black)',
                overflow: 'hidden',
                '--bph': '0px',
                // Exposed for the bottom sheet max-height math (header grows
                // by the notch in PWA standalone; tab bar + home indicator).
                '--sait': 'env(safe-area-inset-top, 0px)',
                '--saib': 'env(safe-area-inset-bottom, 0px)',
              } as React.CSSProperties
            }
          >
            {/* ── MOBILE HEADER — two rows (96px = 52 + 44 + safe-top) ── */}
            {/* Row 1 (56px): brand lockup left (same POSTER/IUM mark as the
               desktop header) + the primary Export action right. Row 2 (44px):
               the tool strip — mode, import, reset (two-tap), tour — every
               tool visible, nothing hidden behind an overflow menu. Undo/redo
               + zoom stay in the sheet's handle row (native chrome). */}
            <header
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 'calc(96px + env(safe-area-inset-top, 0px))',
                paddingTop: 'env(safe-area-inset-top, 0px)',
                zIndex: 40,
                background: 'rgba(7,7,6,0.97)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* ── ROW 1 — Global Application Header (52px) ── */}
              {/* Brand left, search + export right. Search uses a subtle container to balance Export's weight. */}
              <div
                style={{
                  height: 52,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  gap: 12,
                }}
              >
                {/* Brand — Posterium wordmark */}
                <a
                  href="/"
                  aria-label="Posterium home"
                  style={{
                    textDecoration: 'none',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 32,
                    padding: 0,
                  }}
                >
                  <img
                    src="/posterium.svg"
                    alt=""
                    width={20}
                    height={20}
                    style={{ display: 'block', flexShrink: 0 }}
                  />
                  <span
                    className="poster-font"
                    style={{
                      fontSize: 16,
                      letterSpacing: '0.12em',
                      lineHeight: 1,
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ color: 'var(--film-cream)' }}>POSTER</span>
                    <span
                      style={{ color: 'transparent', WebkitTextStroke: '1px var(--film-amber)' }}
                    >
                      IUM
                    </span>
                  </span>
                </a>

                <div style={{ flex: 1 }} />

                {/* Search trigger — subtle container to balance Export weight */}
                <button
                  onClick={() => {
                    closeBottomPanel();
                    setPaletteOpen(true);
                  }}
                  aria-label="Search commands"
                  title="Search commands"
                  className="active:scale-95"
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(39,39,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: 'rgba(212,212,216,0.85)',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'transform 0.12s ease, background 0.15s ease',
                  }}
                >
                  <Search size={18} />
                </button>

                {/* Primary CTA — Export */}
                <button
                  onClick={() => {
                    closeBottomPanel();
                    setExportStep(1);
                    setExportAdvancedOpen(false);
                    setMobileExportOpen(true);
                  }}
                  aria-label="Export poster"
                  className="active:scale-95"
                  style={{
                    height: 36,
                    paddingInline: 16,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'var(--film-amber)',
                    color: '#070706',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    transition: 'transform 0.12s ease',
                  }}
                >
                  <Download size={16} />
                  <span
                    className="syne-font"
                    style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em' }}
                  >
                    Export
                  </span>
                </button>
              </div>

              {/* Row divider — distinct 1px line */}
              <div
                aria-hidden="true"
                style={{
                  height: 1,
                  flexShrink: 0,
                  background: 'rgba(255,255,255,0.08)',
                }}
              />

              {/* ── ROW 2 — Contextual Toolbar & Canvas Controls (44px) ── */}
              {/* History | Preset (center) | Utilities — unified monochrome, amber active, 32px targets */}
              <div
                style={{
                  height: 44,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  gap: 4,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {/* Left group — History (icon-only, 32px targets) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => {
                      setResetArmed(false);
                      undo();
                    }}
                    disabled={!canUndo}
                    aria-label="Undo"
                    title="Undo"
                    className="active:scale-95"
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: canUndo ? 'rgba(212,212,216,0.85)' : 'rgba(212,212,216,0.3)',
                      cursor: canUndo ? 'pointer' : 'default',
                      opacity: canUndo ? 1 : 0.3,
                      pointerEvents: canUndo ? 'auto' : 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'transform 0.12s ease, color 0.15s ease',
                    }}
                  >
                    <Undo2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setResetArmed(false);
                      redo();
                    }}
                    disabled={!canRedo}
                    aria-label="Redo"
                    title="Redo"
                    className="active:scale-95"
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: canRedo ? 'rgba(212,212,216,0.85)' : 'rgba(212,212,216,0.3)',
                      cursor: canRedo ? 'pointer' : 'default',
                      opacity: canRedo ? 1 : 0.3,
                      pointerEvents: canRedo ? 'auto' : 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'transform 0.12s ease, color 0.15s ease',
                    }}
                  >
                    <Redo2 size={18} />
                  </button>
                </div>

                {/* Separator — History | Preset */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 1,
                    height: 20,
                    margin: '0 4px',
                    background: 'rgba(255,255,255,0.08)',
                    flexShrink: 0,
                  }}
                />

                {/* Center group — Configuration / Preset (center-anchored pill) */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
                  <ModeToggle mode={builderMode} onChange={setBuilderMode} />
                </div>

                {/* Separator — Preset | Utilities */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 1,
                    height: 20,
                    margin: '0 4px',
                    background: 'rgba(255,255,255,0.08)',
                    flexShrink: 0,
                  }}
                />

                {/* Right group — Utilities (icon-only, 32px targets) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => {
                      setResetArmed(false);
                      setBottomPanelTab('source');
                      openBottomPanelSheet();
                      setImportFocus((f) => f + 1);
                    }}
                    aria-label="Import from URL"
                    title="Import"
                    className="active:scale-95"
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: 'rgba(212,212,216,0.7)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'transform 0.12s ease, background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color =
                        'rgba(212,212,216,0.7)';
                    }}
                  >
                    <Link2 size={18} />
                  </button>

                  {/* Reset — neutral by default, red on hover/armed */}
                  <button
                    onClick={() => {
                      if (!resetArmed) {
                        setResetArmed(true);
                        return;
                      }
                      setResetArmed(false);
                      handleReset();
                    }}
                    aria-label={resetArmed ? 'Confirm reset poster' : 'Reset poster'}
                    title={resetArmed ? 'Tap again to confirm' : 'Reset'}
                    className="active:scale-95"
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: resetArmed ? 'rgba(248,113,113,0.12)' : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: resetArmed ? '#f87171' : 'rgba(212,212,216,0.7)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'transform 0.12s ease, background 0.15s ease, color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!resetArmed) {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(248,113,113,0.08)';
                        (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!resetArmed) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color =
                          'rgba(212,212,216,0.7)';
                      }
                    }}
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button
                    onClick={() => {
                      setResetArmed(false);
                      clearWalkthroughState();
                      window.location.reload();
                    }}
                    aria-label="Re-run tour"
                    title="Tour"
                    className="active:scale-95"
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: 'rgba(212,212,216,0.7)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'transform 0.12s ease, background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(255,255,255,0.06)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color =
                        'rgba(212,212,216,0.7)';
                    }}
                  >
                    <BookOpen size={18} />
                  </button>
                </div>
              </div>
            </header>

            {/* ── CANVAS ── */}
            {/* Top: 96px (52 + 44 two-row header) + safe-area-inset-top (notch in
               PWA standalone). Bottom: 64px (tab bar) + safe-area + var(--bph)
               (bottom sheet). */}
            {/* Transition on bottom must match the sheet's spring exactly:
               0.45s cubic-bezier(0.32,0.72,0,1) — a slight overshoot so the
               canvas visibly settles when the sheet snaps. */}
            <main
              id="main-canvas"
              ref={mobileCanvasRef}
              aria-label="Poster canvas"
              className="mobile-canvas"
              style={{
                position: 'absolute',
                top: 'calc(96px + env(safe-area-inset-top, 0px))',
                left: 0,
                right: 0,
                bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + var(--bph, 0px))',
                background: 'var(--film-mid)',
                overflow: 'hidden',
                transition: isDraggingBottomPanel
                  ? 'none'
                  : 'bottom 0.45s cubic-bezier(0.32, 0.72, 0, 1)',
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
                onContextMenu={openCtxMenu as (id: string, e: React.MouseEvent) => void}
                onLogoContextMenu={(e) => openCtxMenu('logo', e)}
              />

              <FilmCorners />
            </main>

            {/* ── EDGE HANDLES + DRAWERS — tablet only (700–1023px) ── */}
            {/* Phone (<700) uses only the bottom sheet (Source / Layers / Badges / Edit);
                side drawers are redundant IA and tiny 22px targets. Tablet legitimately
                has gutter space for drawers (diagnosis 2.15). */}
            {isTablet && (
              <>
                {/* ── LEFT EDGE HANDLE (Layers toggle) ── */}
              {/* Width: 22px. Height: 64px. Centered vertically at 50%. Rounded right corners only. */}
              {/* z-index: 30 (above canvas, below drawers). */}
              <button
                aria-label={leftPanelOpen ? 'Close layers panel' : 'Open layers panel'}
                aria-expanded={leftPanelOpen}
                className="mobile-edge-handle mobile-edge-handle--left"
                onClick={() => {
                  closeBottomPanel();
                  setLeftPanelOpen((v) => !v);
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 30,
                  width: 22,
                  height: 64,
                  borderRadius: '0 10px 10px 0',
                  background: leftPanelOpen ? 'rgba(196,124,46,0.18)' : 'rgba(10,9,8,0.9)',
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
                className="mobile-edge-handle mobile-edge-handle--right"
                onClick={() => {
                  closeBottomPanel();
                  setRightPanelOpen((v) => !v);
                }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 30,
                  width: 22,
                  height: 64,
                  borderRadius: '10px 0 0 10px',
                  background: rightPanelOpen ? 'rgba(196,124,46,0.18)' : 'rgba(10,9,8,0.9)',
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
              {/* Top: 96px (below two-row header). Bottom: 56px (above nav) + safe-area-inset-bottom. */}
              {/* Content: LayersPanel with hideTabs=true (no internal tab bar, takes full height). */}
              {/* CRITICAL: Use visibility:hidden NOT display:none so the panel stays mounted. */}
              <aside
                aria-label="Layers panel"
                aria-hidden={!leftPanelOpen}
                style={{
                  position: 'absolute',
                  top: 'calc(96px + env(safe-area-inset-top, 0px))',
                  left: 0,
                  bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                  width: 'min(280px, 85vw)',
                  zIndex: 36,
                  background: 'var(--film-dark)',
                  borderRight: '1px solid rgba(196,124,46,0.18)',
                  borderRadius: '0 12px 12px 0',
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
                {/* Vertical grip — the sheet "handle" affordance on the inner edge */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 7,
                    transform: 'translateY(-50%)',
                    width: 2,
                    height: 28,
                    borderRadius: 1,
                    background: 'rgba(196,124,46,0.35)',
                    boxShadow: '0 0 6px rgba(196,124,46,0.25)',
                    pointerEvents: 'none',
                    zIndex: 2,
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
                  {/* Layer count — mono microlabel stamp */}
                  <span
                    className="mono-font"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: 'var(--film-amber)',
                      background: 'rgba(196,124,46,0.1)',
                      border: '1px solid rgba(196,124,46,0.22)',
                      borderRadius: 2,
                      padding: '2px 6px',
                      lineHeight: 1,
                      flexShrink: 0,
                      userSelect: 'none',
                    }}
                  >
                    {Object.keys(config.items ?? {}).length}
                  </span>
                  {/* Close button — 44×44 tap target (fits the 44px drawer header) */}
                  <button
                    onClick={() => setLeftPanelOpen(false)}
                    aria-label="Close layers panel"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 4,
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
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(196,124,46,0.1)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--film-amber)';
                    }}
                    onTouchEnd={(e) => {
                      setTimeout(() => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color =
                          'rgba(140,130,112,0.5)';
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
                  top: 'calc(96px + env(safe-area-inset-top, 0px))',
                  right: 0,
                  bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                  width: 'min(280px, 85vw)',
                  zIndex: 36,
                  background: 'var(--film-dark)',
                  borderLeft: '1px solid rgba(196,124,46,0.18)',
                  borderRadius: '12px 0 0 12px',
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
                {/* Vertical grip — the sheet "handle" affordance on the inner edge */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 7,
                    transform: 'translateY(-50%)',
                    width: 2,
                    height: 28,
                    borderRadius: 1,
                    background: 'rgba(196,124,46,0.35)',
                    boxShadow: '0 0 6px rgba(196,124,46,0.25)',
                    pointerEvents: 'none',
                    zIndex: 2,
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
                  {/* Selection count — mono microlabel stamp */}
                  <span
                    className="mono-font"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: 'var(--film-amber)',
                      background: 'rgba(196,124,46,0.1)',
                      border: '1px solid rgba(196,124,46,0.22)',
                      borderRadius: 2,
                      padding: '2px 6px',
                      lineHeight: 1,
                      flexShrink: 0,
                      userSelect: 'none',
                    }}
                  >
                    {selectedCount}
                  </span>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    aria-label="Close inspector panel"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 4,
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
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(196,124,46,0.1)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--film-amber)';
                    }}
                    onTouchEnd={(e) => {
                      setTimeout(() => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.color =
                          'rgba(140,130,112,0.5)';
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
              </>
            )}

            {/* ── BOTTOM SHEET PANEL ── */}
            {/* Position: above the bottom nav bar (56px + safe area). */}
            {/* Height: driven by CSS var --bph. Snaps to 200px / ~48vh / ~88vh. */}
            {/* Contains: drag handle (with snap-position dots), segmented tab */}
            {/* control, scrollable content. */}
            {/* IMPORTANT: All three tab contents must be rendered simultaneously with */}
            {/* display:none to avoid remounting and re-running effects on tab switch. */}
            <section
              aria-label="Editor panels"
              className="mobile-sheet"
              style={{
                position: 'absolute',
                left: isTablet ? '50%' : 0,
                right: isTablet ? 'auto' : 0,
                width: isTablet ? 'min(640px, 100vw - 48px)' : '100%',
                bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                zIndex: 35,
                height: 'var(--bph, 0px)',
                background: 'var(--film-dark)',
                borderTop: '1px solid rgba(196,124,46,0.2)',
                borderRadius: '12px 12px 0 0',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.7)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transform: bottomPanelOpen
                  ? isTablet
                    ? 'translateX(-50%) translateY(0)'
                    : 'translateY(0)'
                  : isTablet
                    ? 'translateX(-50%) translateY(100%)'
                    : 'translateY(100%)',
                opacity: bottomPanelOpen ? 1 : 0,
                pointerEvents: bottomPanelOpen ? 'auto' : 'none',
                transition: isDraggingBottomPanel
                  ? 'none'
                  : 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease',
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
                  background:
                    'linear-gradient(90deg, transparent, rgba(196,124,46,0.25), transparent)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />

              {/* HANDLE ROW — 56px native chrome (diagnosis 2.6/2.8): zoom −/%/+ on
                  the left, grabber + snap-position dots in the center (the
                  sheet's three positions as an affordance). Undo/redo moved
                  up to the header's tool strip (desktop parity). The whole
                  row is also the drag zone; the buttons stopPropagation
                  their touchstart so taps never drag. */}
              <div
                className="mobile-sheet-handle"
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
                  height: 56,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                  cursor: 'ns-resize',
                  touchAction: 'none',
                  borderBottom: '1px solid rgba(196,124,46,0.08)',
                }}
              >
                {/* Zoom cluster — 44px compact buttons; % resets the view */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 8 }}>
                  <button
                    aria-label="Zoom out"
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => {
                      setViewZoom((z) => {
                        const nz = Math.max(0.5, z - 0.1);
                        dispatchZoom(nz - z);
                        return nz;
                      });
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: 'rgba(196,124,46,0.75)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    aria-label="Reset zoom to 100%"
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => {
                      setViewZoom(1);
                      dispatchResetView();
                    }}
                    style={{
                      minWidth: 44,
                      height: 44,
                      paddingInline: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: 'rgba(240,230,204,0.72)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <span className="mono-font" style={{ fontSize: 11 }}>
                      {Math.round(viewZoom * 100)}%
                    </span>
                  </button>
                  <button
                    aria-label="Zoom in"
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => {
                      setViewZoom((z) => {
                        const nz = Math.min(2.5, z + 0.1);
                        dispatchZoom(nz - z);
                        return nz;
                      });
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: 'rgba(196,124,46,0.75)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>

                {/* Grabber — pill + snap dots, centered */}
                <div
                  style={{
                    flex: 1,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      background: isDraggingBottomPanel
                        ? 'rgba(196,124,46,0.6)'
                        : 'rgba(255,255,255,0.18)',
                      boxShadow: isDraggingBottomPanel ? '0 0 8px rgba(196,124,46,0.4)' : 'none',
                      transition: 'background 0.15s',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: 2,
                          background:
                            i === bottomSheetSnap
                              ? 'rgba(196,124,46,0.8)'
                              : 'rgba(255,255,255,0.13)',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </div>
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
                  {/* Import merged into Source (diagnosis 2.12) — a 44px field
                      with a URL keyboard and an inline error below it; the
                      desktop import dialog does not exist on mobile. */}
                  <div style={{ padding: '12px 12px 4px' }}>
                    <p
                      className="mono-font"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'rgba(196,124,46,0.6)',
                        marginBottom: 8,
                      }}
                    >
                      Import a poster URL
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        ref={importFieldRef}
                        value={importUrl}
                        onChange={(e) => {
                          setImportUrl(e.target.value);
                          if (importError) setImportError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitMobileImport();
                        }}
                        inputMode="url"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="https://posterium.xyz/poster/…"
                        aria-label="Poster URL"
                        aria-invalid={!!importError}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: 44,
                          paddingInline: 12,
                          borderRadius: 8,
                          background: 'rgba(14,13,11,0.9)',
                          border: importError
                            ? '1px solid rgba(248,113,113,0.6)'
                            : '1px solid rgba(196,124,46,0.22)',
                          color: 'var(--film-cream)',
                          fontSize: 12,
                          outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                      <button
                        onClick={submitMobileImport}
                        aria-label="Load poster URL"
                        style={{
                          height: 44,
                          paddingInline: 16,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--film-amber)',
                          color: '#070706',
                          border: 'none',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          className="syne-font"
                          style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}
                        >
                          LOAD
                        </span>
                      </button>
                    </div>
                    {importError && (
                      <p
                        role="alert"
                        className="body-font"
                        style={{
                          color: 'rgba(248,113,113,0.9)',
                          fontSize: 11,
                          marginTop: 6,
                          lineHeight: 1.35,
                        }}
                      >
                        {importError}
                      </p>
                    )}
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      height: 1,
                      margin: '10px 12px',
                      background:
                        'linear-gradient(90deg, transparent, rgba(196,124,46,0.14), transparent)',
                    }}
                  />
                  <SourcePanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelectionOverride}
                    chrome={false}
                    detailLevel="simple"
                  />
                </div>

                {/* LAYERS TAB CONTENT */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    display: bottomPanelTab === 'layers' ? 'block' : 'none',
                    paddingBottom: 24,
                  }}
                >
                  <LayersPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelectionOverride}
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

                {/* SELECTION TAB CONTENT — Inspector becomes a dynamic 4th tab
                    (diagnosis 2.9): shown in the nav bar only while a badge is
                    selected; opens SelectionPanel for fine adjustments. */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    display: bottomPanelTab === 'selection' ? 'block' : 'none',
                    paddingBottom: 24,
                  }}
                >
                  <SelectionPanel
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
            {/* Height: 64px. The tab bar IS the navigation (diagnosis 2.6) —
               the in-sheet tab row is gone. Three fixed tabs + a dynamic 4th:
               "Edit" appears while a badge is selected (Inspector), otherwise
               "View" (zoom/settings page). Active tab: 2px amber line at the
               top of the bar + amber icon/label. */}
            <nav
              aria-label="Editor navigation"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
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
                  background:
                    'linear-gradient(90deg, transparent, rgba(196,124,46,0.18), transparent)',
                  pointerEvents: 'none',
                }}
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

              {/* Nav buttons — idle: 3 tabs (Source / Layers / Badges) · selected: + Edit (Inspector). View tab removed — its zoom/settings live in the handle row + pill's gear popover. */}
              <div style={{ flex: 1, display: 'flex' }}>
                {(
                  [
                    { id: 'source', label: 'Source', Icon: Film },
                    { id: 'layers', label: 'Layers', Icon: Layers },
                    { id: 'badges', label: 'Badges', Icon: Sliders },
                    ...(selectedCount > 0
                      ? [{ id: 'selection' as const, label: 'Edit', Icon: MousePointer2 }]
                      : []),
                  ] as {
                    id: 'source' | 'layers' | 'badges' | 'selection';
                    label: string;
                    Icon: React.ComponentType<{
                      size?: number | string;
                      strokeWidth?: number | string;
                      style?: React.CSSProperties;
                    }>;
                  }[]
                ).map(({ id, label, Icon }) => {
                  const active = bottomPanelOpen && bottomPanelTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => (active ? closeBottomPanel() : openBottomPanel(id))}
                      aria-label={`${label} panel`}
                      aria-pressed={active}
                      className="active:scale-95"
                      style={{
                        position: 'relative',
                        flex: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        background: active ? 'rgba(196,124,46,0.08)' : 'transparent',
                        border: 'none',
                        borderRadius: 12,
                        margin: 4,
                        color: active ? 'var(--film-amber)' : 'rgba(240,230,204,0.58)',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease, background 0.15s ease, transform 0.12s ease',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {/* Active indicator — 32px amber line at the top, 8pt-aligned */}
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          top: -4,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 32,
                          height: 3,
                          borderRadius: '0 0 3px 3px',
                          background: active ? 'var(--film-amber)' : 'transparent',
                          boxShadow: active ? '0 2px 10px rgba(196,124,46,0.45)' : 'none',
                          transition: 'background 0.15s ease',
                        }}
                      />
                      <Icon
                        size={22}
                        strokeWidth={active ? 2.2 : 1.8}
                        style={
                          active
                            ? { filter: 'drop-shadow(0 0 6px rgba(196,124,46,0.45))' }
                            : undefined
                        }
                      />
                      <span
                        className="syne-font"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          lineHeight: 1,
                          opacity: active ? 1 : 0.9,
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* ── MOBILE EXPORT SHEET (3 steps, diagnosis 2.11) ── */}
            {mobileExportOpen && (
              <section
                aria-label="Export poster"
                role="dialog"
                aria-modal="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                  zIndex: 50,
                  background: 'var(--film-dark)',
                  borderTop: '1px solid rgba(196,124,46,0.2)',
                  borderRadius: '12px 12px 0 0',
                  boxShadow: '0 -8px 48px rgba(0,0,0,0.7)',
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                  animation: 'mob-sheet-up 0.45s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              >
                {/* Grabber */}
                <div
                  style={{
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.18)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px 12px',
                  }}
                >
                  <h2
                    className="syne-font"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--film-cream)',
                    }}
                  >
                    Export
                  </h2>
                  <button
                    onClick={() => setMobileExportOpen(false)}
                    aria-label="Close export"
                    style={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: 'rgba(140,130,112,0.45)',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {exportStep === 1 && (
                  <div style={{ padding: '0 16px 24px' }}>
                    <p
                      className="body-font"
                      style={{ fontSize: 12, color: 'rgba(240,230,204,0.72)', marginBottom: 12 }}
                    >
                      Pick a format, then download.
                    </p>
                    {/* 2×2 format chips — 44px+ targets */}
                    <div
                      role="radiogroup"
                      aria-label="Export format"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        marginBottom: 16,
                      }}
                    >
                      {(['svg', 'png', 'jpg', 'webp'] as ExtensionType[]).map((ext) => (
                        <button
                          key={ext}
                          role="radio"
                          aria-checked={exportFormat === ext}
                          onClick={() => setExportFormat(ext)}
                          style={{
                            height: 48,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background:
                              exportFormat === ext
                                ? 'rgba(196,124,46,0.16)'
                                : 'rgba(14,13,11,0.85)',
                            border:
                              exportFormat === ext
                                ? '1px solid rgba(196,124,46,0.55)'
                                : '1px solid rgba(196,124,46,0.14)',
                            color:
                              exportFormat === ext ? 'var(--film-cream)' : 'rgba(140,130,112,0.6)',
                            cursor: 'pointer',
                          }}
                        >
                          <span
                            className="syne-font"
                            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}
                          >
                            {ext.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setExportStep(2);
                        // Fire the download immediately; the progress step is a
                        // short acknowledgement before the success state.
                        try {
                          const u = new URL(generateApiUrl(config, baseUrl));
                          u.searchParams.set('download', '');
                          const urlStr = u.toString();
                          const win = window.open(urlStr, '_blank', 'noopener,noreferrer');
                          if (!win) {
                            void (async () => {
                              try {
                                const res = await fetch(urlStr);
                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                const blob = await res.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = objectUrl;
                                a.download =
                                  u.pathname.split('/').pop() || `poster.${exportFormat}`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                URL.revokeObjectURL(objectUrl);
                              } catch {
                                /* handled by the success step below */
                              }
                            })();
                          }
                          toast('Downloading poster…');
                        } catch {
                          toast('Download failed — enter a valid poster URL', 'error');
                        }
                        window.setTimeout(() => {
                          setExportStep(3);
                        }, 900);
                      }}
                      style={{
                        width: '100%',
                        height: 56,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: 'var(--film-amber)',
                        color: '#070706',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      <Download size={17} />
                      Download {exportFormat.toUpperCase()}
                    </button>
                    {/* Secondary actions — collapsed behind "Advanced" so the
                        primary action stays dominant. */}
                    <button
                      onClick={() => setExportAdvancedOpen((v) => !v)}
                      aria-expanded={exportAdvancedOpen}
                      style={{
                        marginTop: 10,
                        width: '100%',
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 4,
                        color: 'rgba(196,124,46,0.75)',
                        cursor: 'pointer',
                      }}
                    >
                      <span className="syne-font" style={{ fontSize: 9, letterSpacing: '0.1em' }}>
                        ADVANCED
                      </span>
                      <ChevronDown
                        size={14}
                        style={{ transform: exportAdvancedOpen ? 'rotate(180deg)' : 'none' }}
                      />
                    </button>
                    {exportAdvancedOpen && (
                      <div style={{ marginTop: 4 }}>
                        {[
                          {
                            label: 'Copy poster URL',
                            kind: 'url' as const,
                          },
                          {
                            label: 'Copy API metadata',
                            kind: 'aio' as const,
                          },
                        ].map(({ label, kind }) => (
                          <button
                            key={kind}
                            onClick={async () => {
                              try {
                                const displayUrl = generateApiUrl(config, baseUrl);
                                const text =
                                  kind === 'aio'
                                    ? displayUrl.replace(/\/poster\/[^.]+\./, '/poster/{imdb_id}.')
                                    : displayUrl;
                                await navigator.clipboard.writeText(text);
                                toast(
                                  kind === 'aio' ? 'API template copied' : 'Link copied',
                                  'success'
                                );
                              } catch {
                                /* clipboard unavailable */
                              }
                            }}
                            style={{
                              width: '100%',
                              height: 44,
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 12px',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: 4,
                              color: 'var(--film-cream)',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontFamily: 'inherit',
                              textAlign: 'left',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {exportStep === 2 && (
                  <div
                    style={{
                      padding: '24px 16px 48px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: '3px solid rgba(196,124,46,0.18)',
                        borderTopColor: 'var(--film-amber)',
                        animation: 'mob-spin 0.8s linear infinite',
                      }}
                    />
                    <p
                      className="syne-font"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--film-cream)',
                      }}
                    >
                      Rendering poster…
                    </p>
                    <p
                      className="body-font"
                      style={{ fontSize: 11, color: 'rgba(240,230,204,0.55)' }}
                    >
                      The download starts automatically.
                    </p>
                  </div>
                )}

                {exportStep === 3 && (
                  <div
                    style={{
                      padding: '20px 16px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(196,124,46,0.16)',
                        border: '1px solid rgba(196,124,46,0.4)',
                        color: 'var(--film-amber)',
                        boxShadow: '0 0 16px rgba(196,124,46,0.25)',
                      }}
                    >
                      <Check size={24} />
                    </div>
                    <p
                      className="syne-font"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--film-cream)',
                      }}
                    >
                      Saved to Downloads
                    </p>
                    <p
                      className="body-font"
                      style={{
                        fontSize: 11,
                        color: 'rgba(240,230,204,0.55)',
                        textAlign: 'center',
                        maxWidth: 260,
                      }}
                    >
                      Look in your browser's default download location.
                    </p>
                    {/* Mini poster swatch as the thumbnail */}
                    <div
                      aria-hidden="true"
                      style={{
                        width: 72,
                        height: 40,
                        borderRadius: 4,
                        background: 'linear-gradient(160deg, var(--film-mid), var(--film-dark))',
                        border: '1px solid rgba(196,124,46,0.25)',
                        position: 'relative',
                        overflow: 'hidden',
                        marginTop: 4,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 8,
                          right: 8,
                          top: 10,
                          height: 2,
                          borderRadius: 1,
                          background: 'rgba(196,124,46,0.7)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: 16,
                          width: 10,
                          height: 5,
                          borderRadius: 1,
                          background: 'rgba(255,255,255,0.14)',
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setMobileExportOpen(false)}
                      style={{
                        width: '100%',
                        height: 56,
                        borderRadius: 8,
                        background: 'var(--film-amber)',
                        color: '#070706',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        marginTop: 8,
                      }}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setExportStep(1)}
                      style={{
                        width: '100%',
                        height: 44,
                        borderRadius: 8,
                        background: 'transparent',
                        border: '1px solid rgba(196,124,46,0.3)',
                        color: 'var(--film-amber)',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                      }}
                    >
                      Export another
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ── STARTER HELPER CARD (diagnosis 2.4) ── */}
            {/* Neutral starter: blank canvas, one sample badge, and this card
                — never a finished demo poster. Dismissed once, it stays gone. */}
            {showStarterHelp && (
              <div
                role="status"
                style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
                  minHeight: 56,
                  zIndex: 45,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 8px 8px 14px',
                  borderRadius: 8,
                  background: 'rgba(14,13,11,0.92)',
                  border: '1px solid rgba(196,124,46,0.25)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--film-amber)',
                    boxShadow: '0 0 8px rgba(196,124,46,0.6)',
                    flexShrink: 0,
                  }}
                />
                <p
                  className="body-font"
                  style={{ flex: 1, fontSize: 12, color: 'var(--film-cream)' }}
                >
                  This is your canvas — drag anything from the tabs below.
                </p>
                <button
                  onClick={() => setShowStarterHelp(false)}
                  aria-label="Dismiss help"
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    color: 'rgba(140,130,112,0.5)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* ── OPT-IN WALKTHROUGH COACH (diagnosis 2.1/2.2) ── */}
            {/* The legacy first-visit gate is replaced on mobile by this
                bottom-sheet coach; the builder is usable immediately. */}
            {showCoach && !showStarterHelp && (
              <section
                aria-label="Welcome"
                role="dialog"
                aria-modal="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                  zIndex: 60,
                  background: 'var(--film-dark)',
                  borderTop: '1px solid rgba(196,124,46,0.2)',
                  borderRadius: '12px 12px 0 0',
                  boxShadow: '0 -8px 48px rgba(0,0,0,0.7)',
                  animation: 'mob-sheet-up 0.45s cubic-bezier(0.32, 0.72, 0, 1)',
                  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
              >
                <div
                  style={{
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.18)',
                    }}
                  />
                </div>
                <div style={{ padding: '0 20px 28px' }}>
                  <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        style={{
                          flex: 1,
                          height: 2,
                          borderRadius: 1,
                          background: i === 0 ? 'var(--film-amber)' : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                  <h2
                    className="syne-font"
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      color: 'var(--film-cream)',
                      marginBottom: 6,
                    }}
                  >
                    Welcome to Posterium
                  </h2>
                  <p
                    className="body-font"
                    style={{
                      fontSize: 12,
                      color: 'rgba(240,230,204,0.7)',
                      lineHeight: 1.5,
                      marginBottom: 20,
                    }}
                  >
                    Build a movie poster in under a minute: pick a source, drop badges, export. Want
                    a quick tour first?
                  </p>
                  <button
                    onClick={onCoachStart}
                    style={{
                      width: '100%',
                      height: 56,
                      borderRadius: 8,
                      background: 'var(--film-amber)',
                      color: '#070706',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      boxShadow: '0 4px 20px rgba(196,124,46,0.35)',
                    }}
                  >
                    Start creating
                  </button>
                  <button
                    onClick={onCoachTour}
                    style={{
                      width: '100%',
                      height: 44,
                      marginTop: 8,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      color: 'rgba(196,124,46,0.85)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                    }}
                  >
                    Show me around first
                  </button>
                </div>
              </section>
            )}

            {/* ── MOBILE ZOOM PILL (quick access, idle state) ── */}
            {/* Floating zoom/settings/fullscreen pill, bottom-right above
                the tab bar. Rendered INSIDE the mobile shell so its z-40
                stacks under the card (45), action bar (46), export sheet
                (50) and coach (60). Hidden while a badge is selected (the
                action bar owns that band), while the sheet is open (zoom
                lives in the handle row + View tab), and during starter
                help. */}
            {selectedCount === 0 && !bottomPanelOpen && !showStarterHelp && (
              <ZoomOverlay
                isFullscreen={false}
                rightSidebarWidth={0}
                onToggleFullscreen={handleMobileFullscreen}
                onZoomIn={() =>
                  setViewZoom((z) => {
                    const nz = Math.min(2.5, z + 0.1);
                    dispatchZoom(nz - z);
                    return nz;
                  })
                }
                onZoomOut={() =>
                  setViewZoom((z) => {
                    const nz = Math.max(0.5, z - 0.1);
                    dispatchZoom(nz - z);
                    return nz;
                  })
                }
                onResetView={() => {
                  setViewZoom(1);
                  dispatchResetView();
                }}
                isMobile={true}
                viewOptions={viewOptions}
                onToggleViewOption={toggleViewOption}
              />
            )}

            {/* ── SELECTION ACTION BAR — Edit / Delete only (Duplicate removed per user: not needed on mobile) ── */}
            {/* ≥44px floating bar above the tab bar while a badge is selected
                and the sheet is closed. The sheet's Edit tab (Inspector) is one tap away. */}
            {selectedCount > 0 && !bottomPanelOpen && !showStarterHelp && (
              <div
                role="toolbar"
                aria-label="Selected badge actions"
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
                  zIndex: 46,
                  display: 'flex',
                  borderRadius: 12,
                  background: 'rgba(10,9,8,0.95)',
                  border: '1px solid rgba(196,124,46,0.25)',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(12px)',
                  padding: 2,
                }}
              >
                <button
                  onClick={() => {
                    setBottomPanelTab('selection');
                    openBottomPanelSheet();
                  }}
                  aria-label="Edit badge"
                  style={{
                    height: 48,
                    minWidth: 48,
                    paddingInline: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 10,
                    color: 'var(--film-cream)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'inherit',
                  }}
                >
                  <Sliders size={15} style={{ color: 'rgba(196,124,46,0.8)' }} />
                  Edit
                </button>
                <div
                  aria-hidden="true"
                  style={{
                    width: 1,
                    alignSelf: 'stretch',
                    margin: '10px 0',
                    background: 'rgba(196,124,46,0.15)',
                  }}
                />
                <button
                  onClick={() => {
                    if (selectedTitle) deleteLayer('title');
                    else if (selectedLogo) deleteLayer('logo');
                    else if (selectedMinimalElements.size > 0) {
                      const first = Array.from(selectedMinimalElements)[0];
                      if (first === 'minimal-logo') deleteLayer('logo');
                      else if (first === 'minimal-title')
                        setConfig((p) => ({ ...p, titleEnabled: false }));
                      else clearSelection();
                    } else if (selectedIds.size > 0) deleteLayer([...selectedIds][0]);
                  }}
                  aria-label="Delete selection"
                  style={{
                    height: 48,
                    minWidth: 48,
                    paddingInline: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'inherit',
                  }}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── DESKTOP BUILDER (mounted only on desktop — see isDesktop) ── */}
        {isDesktop && (
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
              style={{ background: 'var(--film-mid)' }}
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

              {/* ── DESKTOP LEFT EDGE TOGGLE ── */}
              {!isFullscreen && (
                <button
                  aria-label={leftVisible ? 'Hide layers panel' : 'Show layers panel'}
                  aria-expanded={leftVisible}
                  onClick={() => setLeftVisible((v) => !v)}
                  className="hidden lg:flex"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 30,
                    width: 22,
                    height: 64,
                    borderRadius: '0 10px 10px 0',
                    background: leftVisible ? 'rgba(196,124,46,0.18)' : 'rgba(10,9,8,0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(196,124,46,0.22)',
                    borderLeft: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: leftVisible ? 'var(--film-amber)' : 'rgba(196,124,46,0.5)',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {leftVisible ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                </button>
              )}

              {/* ── DESKTOP RIGHT EDGE TOGGLE ── */}
              {!isFullscreen && (
                <button
                  aria-label={rightVisible ? 'Hide inspector panel' : 'Show inspector panel'}
                  aria-expanded={rightVisible}
                  onClick={() => setRightVisible((v) => !v)}
                  className="hidden lg:flex"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 30,
                    width: 22,
                    height: 64,
                    borderRadius: '10px 0 0 10px',
                    background: rightVisible ? 'rgba(196,124,46,0.18)' : 'rgba(10,9,8,0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(196,124,46,0.22)',
                    borderRight: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: rightVisible ? 'var(--film-amber)' : 'rgba(196,124,46,0.5)',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {rightVisible ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                </button>
              )}

              <PreviewCanvas
                config={config}
                setConfig={setConfig}
                selectedIds={selectedIds}
                onSelect={handleSelectionOverride}
                onContextMenu={openCtxMenu as (id: string, e: React.MouseEvent) => void}
                onLogoContextMenu={(e) => openCtxMenu('logo', e)}
              />
              <FilmCorners />
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
        )}

        {/* Zoom + fullscreen overlay — desktop: right-edge floating pill. The
           mobile pill lives INSIDE the mobile shell (see mobile tree) so it
           stacks under the shell's own overlays. */}
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

// A poster URL is one the API resolves to a generated poster (movie/tv/anime
// media pages or /poster/ image URLs). Load handlers refuse anything else so
// a bad import can never silently reset the config.
const POSTER_URL_PATH = /^\/(movie|tv|anime|poster)\//;

// Neutral starter — a deliberately BLANK canvas: no seeded demo media and no
// demo badge set, so a fresh visit (and a reset) never hands the user a
// finished poster. The starter helper card supplies the first action.
const NEUTRAL_STARTER: PosterConfig = {
  ...DEFAULT_CONFIG,
  // Blank-string ids — falsy, so no media lookup or ratings seeding fires,
  // but the field types require strings.
  imdbId: '',
  tmdbId: '',
  ratings: [],
};

// ── Root app ──────────────────────────────────────────────────────────────────
interface BuilderAppProps {
  initialMode?: BuilderMode;
  presets?: ExamplePreset[];
}

const BuilderAppInner: React.FC<BuilderAppProps> = ({ initialMode = 'simple', presets = [] }) => {
  const { toast } = useToast();
  const {
    state: config,
    setState: setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePosterHistory(() => {
    // A shared-config URL (?url=…) must win over saved local state and be
    // available synchronously — the walkthrough wizard initializes from it.
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('url');
      if (urlParam) return parseUrlToConfig(urlParam);
    }
    try {
      const saved = localStorage.getItem(BUILDER_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as PosterConfig) : NEUTRAL_STARTER;
    } catch {
      return NEUTRAL_STARTER;
    }
  });

  const [walkthroughDone, setWalkthroughDone] = useState(() => {
    // Synchronous check — runs before first paint, prevents flash
    if (typeof window === 'undefined') return false;
    return getWalkthroughState();
  });

  const handleWalkthroughComplete = useCallback(
    (mode: BuilderMode, walkthroughConfig: PosterConfig) => {
      saveWalkthroughState();
      saveBuilderMode(mode);
      setConfig(walkthroughConfig);
      setWalkthroughDone(true);
      setWalkthroughModalOpen(false);
    },
    [setConfig]
  );

  const handleWalkthroughDismiss = useCallback(() => {
    // Transient dismiss — does NOT save completion state
    setWalkthroughDone(true);
    setWalkthroughModalOpen(false);
  }, []);

  const handleWalkthroughSkip = useCallback(() => {
    saveWalkthroughState();
    setWalkthroughDone(true);
    setWalkthroughModalOpen(false);
  }, []);

  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  // pwa-register.ts dispatches 'pwa-update-activated' ~900ms before reloading
  // after a service-worker update installs. Surface it as a toast so an update
  // landing mid-edit never reads as a crash (config is already safe in
  // localStorage via autosave). Also informs standalone PWA users that the
  // reload they're about to see is the new version, not a failure.
  useEffect(() => {
    const onUpdate = () => toast('New version installed — updating…', 'success');
    window.addEventListener('pwa-update-activated', onUpdate);
    return () => window.removeEventListener('pwa-update-activated', onUpdate);
  }, [toast]);

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

  // Autosave feedback — "Changes saved", throttled (max once per 4s) and
  // suppressed for bursty drag/slider sweeps so we never toast per-drag.
  const autosaveBurstRef = useRef(0);
  const autosaveTimerRef = useRef<number | null>(null);
  // Seeded with now() so the mount-time effect run can't produce a toast.
  const lastAutosaveToastRef = useRef(Date.now());

  useEffect(() => {
    autosaveBurstRef.current += 1;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      const isBurst = autosaveBurstRef.current > 8;
      autosaveBurstRef.current = 0;
      const now = Date.now();
      if (!isBurst && now - lastAutosaveToastRef.current > 4000) {
        lastAutosaveToastRef.current = now;
        toast('Changes saved', 'success');
      }
    }, 1500);
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [config, toast]);

  const loadConfigCore = useCallback((url: string) => {
    try {
      const u = new URL(url);
      if (!POSTER_URL_PATH.test(u.pathname)) {
        return { ok: false as const, error: 'Enter a valid poster URL' };
      }
      return { ok: true as const, parsed: parseUrlToConfig(url) };
    } catch {
      // Malformed URL — never touch the current config
      return { ok: false as const, error: 'Enter a valid poster URL' };
    }
  }, []);

  const handleLoadConfig = useCallback(
    (url: string): boolean => {
      const { ok, error, parsed } = loadConfigCore(url);
      if (!ok || !parsed) {
        toast(error ?? 'Enter a valid poster URL', 'error');
        return false;
      }
      setConfig(parsed);
      try {
        setBaseUrl(new URL(url).origin);
      } catch {
        /* keep */
      }
      toast('Poster loaded', 'success');
      return true;
    },
    [loadConfigCore, setConfig, setBaseUrl, toast]
  );

  // Inline variant for the mobile Source tab — errors render inside the field
  // instead of a toast; a successful load still toasts.
  const loadConfigInline = useCallback(
    (url: string): { ok: boolean; error?: string } => {
      const { ok, error, parsed } = loadConfigCore(url);
      if (!ok || !parsed) return { ok: false, error };
      setConfig(parsed);
      try {
        setBaseUrl(new URL(url).origin);
      } catch {
        /* keep */
      }
      toast('Poster loaded', 'success');
      return { ok: true };
    },
    [loadConfigCore, setConfig, setBaseUrl, toast]
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
      // Reset lands on a blank canvas, NOT the demo badge set — a reset must
      // never silently hand back a finished demo poster.
      ratings: [],
    }));
    window.dispatchEvent(new CustomEvent('reset-canvas-view'));
    toast('Reset to a blank canvas', 'success');
  }, [setConfig, toast]);

  useEffect(() => {
    // The ?url= config is applied synchronously in the history initializer
    // above; this effect only pins the API base and reports a bad URL. It
    // never touches the config.
    const urlParam = new URLSearchParams(window.location.search).get('url');
    if (!urlParam) return;
    try {
      const u = new URL(urlParam);
      if (!POSTER_URL_PATH.test(u.pathname)) {
        toast('Enter a valid poster URL', 'error');
        return;
      }
      setBaseUrl(u.origin);
    } catch {
      toast('Enter a valid poster URL', 'error');
    }
  }, [toast, setBaseUrl]);

  const [walkthroughModalOpen, setWalkthroughModalOpen] = useState(false);

  // Desktop keeps the legacy first-visit modal; mobile swaps the gate for an
  // opt-in coach rendered inside the mobile tree (see StudioLayout), so the
  // builder is usable immediately. "Show me around first" opens this modal
  // from the coach.
  const [appIsDesktop, setAppIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handle = (e: MediaQueryListEvent) => setAppIsDesktop(e.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const handleCoachStart = useCallback(() => {
    // "Start creating" — the user saw the opt-in and declined the tour; save
    // completion so the coach doesn't nag on every visit.
    saveWalkthroughState();
    setWalkthroughDone(true);
  }, []);

  const handleCoachTour = useCallback(() => {
    setWalkthroughModalOpen(true);
  }, []);

  // Walkthrough not completed — desktop keeps the legacy gate; mobile renders
  // the builder with the opt-in coach overlaid instead of blocking.
  if (walkthroughModalOpen || (!walkthroughDone && appIsDesktop)) {
    return (
      <WalkthroughModal
        initialConfig={config}
        onComplete={handleWalkthroughComplete}
        onDismiss={handleWalkthroughDismiss}
        onSkip={handleWalkthroughSkip}
        presets={presets}
      />
    );
  }

  return (
    <EditorProvider>
      <StudioLayout
        config={config}
        setConfig={setConfig}
        handleReset={handleReset}
        baseUrl={baseUrl}
        handleLoadConfig={handleLoadConfig}
        loadConfigInline={loadConfigInline}
        showCoach={!walkthroughDone && !appIsDesktop}
        onCoachStart={handleCoachStart}
        onCoachTour={handleCoachTour}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        initialMode={getBuilderMode() || initialMode}
      />
    </EditorProvider>
  );
};

const BuilderApp: React.FC<BuilderAppProps> = (props) => (
  <ToastProvider>
    <BuilderAppInner {...props} />
  </ToastProvider>
);

export default BuilderApp;
