// src/components/builder/AdvancedBuilderApp.tsx
// Advanced Builder — vertical panel nav on the left, panel content on the right.
// No horizontal tab bars inside panels.

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import clsx from 'clsx';
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
import PreviewCanvas from './components/PreviewCanvas';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ResetDialog from './components/ResetDialogue';
import ImportDialog from './components/ImportDialogue';
import ExportPopover from './components/ExportPopover';
import { EditorProvider, useEditor } from './context/EditorContext';
import {
  Film,
  Layers,
  Monitor,
  Sliders,
  MousePointer2,
  RotateCcw,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckSquare,
  MousePointer2Off,
  Download,
  Contrast,
  Keyboard,
  ChevronDown,
  Search,
  PanelRight,
} from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';
import ContextMenu, { type ContextMenuState, type LayerTargetId } from './components/ContextMenu';
import CommandPalette, { type PaletteCommand } from './components/CommandPalette';
import BuilderModeToggle from './components/layout/BuilderModeToggle';
import AdvancedPanelList from './components/panels/left/AdvancedPanelList';
import AdvancedPanelHost from './components/panels/right/AdvancedPanelHost';

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'posterium_config_v2'; // shared with main builder
const COOKIE_KEY = 'posterium_apikeys_v1';
const MAX_QUERY_CONFIG_LENGTH = 12000;

const saveKeysToCookie = (keys: ApiKeys) => {
  try {
    const val = encodeURIComponent(JSON.stringify(keys));
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${val}; expires=${exp}; path=/; SameSite=Strict`;
  } catch {}
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

// ── Panel definitions ─────────────────────────────────────────────────────────
const ADV_PANELS = [
  { id: 'source' as const, label: 'Source', Icon: Film, desc: 'Media & poster source' },
  { id: 'layers' as const, label: 'Layers', Icon: Layers, desc: 'Badge & logo layers' },
  { id: 'poster' as const, label: 'Canvas', Icon: Monitor, desc: 'Overlays & effects' },
  { id: 'badges' as const, label: 'Badges', Icon: Sliders, desc: 'Global badge style' },
  {
    id: 'selection' as const,
    label: 'Selection',
    Icon: MousePointer2,
    desc: 'Selected layer config',
  },
] as const;

// ── ToolbarBtn ────────────────────────────────────────────────────────────────
const ToolbarBtn = memo<{
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  hideOnMobile?: boolean;
}>(({ onClick, disabled, label, danger, href, active, children, hideOnMobile = false }) => {
  const cls = `relative group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E] ${hideOnMobile ? 'hidden lg:flex' : ''} ${disabled ? 'cursor-not-allowed pointer-events-none' : 'active:scale-95 cursor-pointer'}`;
  const activeStyle = active
    ? {
        color: 'var(--film-amber)',
        background: 'rgba(196,124,46,0.1)',
        border: '1px solid rgba(196,124,46,0.2)',
      }
    : disabled
      ? { color: 'rgba(255,255,255,0.15)', border: '1px solid transparent', opacity: 0.5 }
      : { color: 'var(--film-text-dim)', border: '1px solid transparent' };
  const tooltip = !disabled && (
    <span
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 pointer-events-none z-[200] shadow-lg syne-font"
      style={{
        background: 'var(--film-mid)',
        color: 'var(--film-cream)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      {label}
    </span>
  );
  const hoverEvents =
    !disabled && !active
      ? {
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            const el = e.currentTarget as HTMLElement;
            if (danger) {
              el.style.color = 'rgba(248,113,113,0.8)';
              el.style.background = 'rgba(248,113,113,0.08)';
            } else {
              el.style.color = 'var(--film-text-label)';
              el.style.background = 'rgba(196,124,46,0.07)';
            }
          },
          onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = 'var(--film-text-dim)';
            el.style.background = 'transparent';
          },
        }
      : {};
  if (href)
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cls}
        aria-label={label}
        style={activeStyle}
        {...hoverEvents}
      >
        {children}
        {tooltip}
      </a>
    );
  return (
    <button
      onClick={onClick}
      disabled={!!disabled}
      className={cls}
      aria-label={label}
      aria-disabled={disabled}
      style={activeStyle}
      {...hoverEvents}
    >
      {children}
      {tooltip}
    </button>
  );
});
ToolbarBtn.displayName = 'ToolbarBtn';

// ── AdvancedNavSidebar ────────────────────────────────────────────────────────
const AdvancedNavSidebar = memo<{
  config: PosterConfig;
  selectedCount: number;
}>(({ config, selectedCount }) => {
  const { activeTab, setActiveTab } = useEditor();

  const activePanel = (() => {
    if (activeTab === 'logo') return 'selection';
    if (['source', 'layers', 'poster', 'badges', 'selection'].includes(activeTab)) return activeTab;
    return 'source';
  })();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--film-dark)',
      }}
    >
      {/* Strip header */}
      <div
        style={{
          padding: '10px 14px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(196,124,46,0.015)',
          flexShrink: 0,
        }}
      >
        <span
          className="syne-font"
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(196,124,46,0.4)',
          }}
        >
          Panels
        </span>
      </div>

      {/* Nav list */}
      <nav style={{ flex: 1, overflowY: 'auto' }} aria-label="Builder panels">
        <AdvancedPanelList
          activeId={activePanel as (typeof ADV_PANELS)[number]['id']}
          onSelect={(id) => setActiveTab(id)}
          items={ADV_PANELS.map((panel) => ({
            ...panel,
            badge: panel.id === 'selection' && selectedCount > 0 ? selectedCount : null,
          }))}
        />
      </nav>

      {/* Footer info */}
      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}
      >
        <div
          className="mono-font"
          style={{ fontSize: 7, color: 'var(--film-text-ghost)', letterSpacing: '0.1em' }}
        >
          {config.ratings.length} badge{config.ratings.length !== 1 ? 's' : ''} · advanced
        </div>
      </div>
    </div>
  );
});
AdvancedNavSidebar.displayName = 'AdvancedNavSidebar';

// ── AdvancedRightPanel ────────────────────────────────────────────────────────
const AdvancedRightPanel = memo<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}>(({ config, setConfig, selectedIds, onSelect }) => {
  const { activeTab } = useEditor();
  const panelMeta =
    ADV_PANELS.find((p) => p.id === activeTab || (activeTab === 'logo' && p.id === 'selection')) ??
    ADV_PANELS[0];
  const PanelIcon = panelMeta.Icon;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--film-dark)',
      }}
    >
      {/* Panel label strip */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(196,124,46,0.07)',
          background: 'rgba(196,124,46,0.015)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <PanelIcon size={12} style={{ color: 'var(--film-amber)', flexShrink: 0 }} />
        <span
          className="syne-font"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--film-amber)',
          }}
        >
          {panelMeta.label}
        </span>
        <span
          className="mono-font"
          style={{ fontSize: 8, color: 'var(--film-text-ghost)', marginLeft: 'auto' }}
        >
          {panelMeta.desc}
        </span>
      </div>

      {/* Panel content — no tab bar */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AdvancedPanelHost
          activePanel={
            activeTab as 'source' | 'layers' | 'poster' | 'badges' | 'selection' | 'logo'
          }
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
});
AdvancedRightPanel.displayName = 'AdvancedRightPanel';

// ── AdvancedStudioLayout ──────────────────────────────────────────────────────
const AdvancedStudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
}) => {
  const {
    activeTab,
    setActiveTab,
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

  // ── UI state ────────────────────────────────────────────────────────────
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [rightW, setRightW] = useState(300);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  const importBtnRef = useRef<HTMLButtonElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

  // Stable refs for keyboard shortcuts
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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // ── Context menu ────────────────────────────────────────────────────────
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

  // ── Layer helpers (same logic as main builder) ──────────────────────────
  const handleSelectionOverride = useCallback(
    (id: RatingType, multi: boolean) => {
      handleSelection(id, multi);
    },
    [handleSelection]
  );

  const moveLayer = useCallback(
    (id: RatingType, dir: 'front' | 'forward' | 'back' | 'toback') => {
      setConfig((prev) => {
        const arr = [...prev.ratings];
        const idx = arr.indexOf(id);
        if (idx === -1) return prev;
        arr.splice(idx, 1);
        if (dir === 'front') arr.push(id);
        else if (dir === 'forward') arr.splice(Math.min(idx + 1, arr.length), 0, id);
        else if (dir === 'back') arr.splice(Math.max(idx - 1, 0), 0, id);
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
    (dir: 'front' | 'forward' | 'back' | 'toback') => {
      setConfig((prev) => {
        const c = prev.logoZ ?? 90;
        if (dir === 'front') return { ...prev, logoZ: 220 };
        if (dir === 'toback') return { ...prev, logoZ: 1 };
        if (dir === 'forward') return { ...prev, logoZ: Math.min(220, c + 1) };
        return { ...prev, logoZ: Math.max(1, c - 1) };
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

  // ── Nudge ────────────────────────────────────────────────────────────────
  const nudgeSelection = useCallback(
    (dx: number, dy: number) => {
      const activeBadges = Array.from(selectedIdsRef.current);
      const hasLogo = selectedLogoRef.current;
      if (activeBadges.length === 0 && !hasLogo) return;
      setConfig((prev) => {
        const next: PosterConfig = { ...prev, items: { ...prev.items } };
        if (activeBadges.length > 0) {
          activeBadges.forEach((id) => {
            const base = next.items[id] ?? {};
            const idx = next.ratings.indexOf(id);
            const auto = calculateAutoPosition(id, Math.max(0, idx), next.ratings.length, next);
            const currX = base.x ?? auto.x,
              currY = base.y ?? auto.y;
            const scale = getScale(next.size) * (base.scale ?? next.scale ?? 1.0);
            const w = BASE_BADGE_W * scale,
              h = BASE_BADGE_H * scale;
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
          const cx =
            next.logoX !== null && next.logoX !== undefined
              ? next.logoX
              : Math.round((CANVAS_WIDTH - next.logoW) / 2);
          next.logoX = Math.max(1 - next.logoW, Math.min(cx + dx, CANVAS_WIDTH - 1));
          next.logoY = Math.max(1 - next.logoH, Math.min(next.logoY + dy, CANVAS_HEIGHT - 1));
        }
        return next;
      });
    },
    [setConfig]
  );

  // ── Zoom helpers ────────────────────────────────────────────────────────
  const dispatchZoom = useCallback(
    (delta: number) => window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: delta })),
    []
  );
  const dispatchResetView = useCallback(
    () => window.dispatchEvent(new CustomEvent('reset-canvas-view')),
    []
  );

  // ── Right panel resize ──────────────────────────────────────────────────
  const startResizeRight = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const sx = e.clientX,
        sw = rightW;
      const move = (m: MouseEvent) =>
        setRightW(Math.max(260, Math.min(sw - (m.clientX - sx), 540)));
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.body.style.cursor = '';
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      document.body.style.cursor = 'col-resize';
    },
    [rightW]
  );

  const handleExtensionChange = useCallback(
    (ext: ExtensionType) => {
      setConfig((prev) => ({ ...prev, extension: ext }));
    },
    [setConfig]
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
        if (selectedIdsRef.current.size > 0 || selectedLogoRef.current) {
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
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        (selectedIdsRef.current.size > 0 ||
          selectedLogoRef.current ||
          selectedMinimalElementsRef.current.size > 0)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') nudgeSelection(0, -step);
        else if (e.key === 'ArrowDown') nudgeSelection(0, step);
        else if (e.key === 'ArrowLeft') nudgeSelection(-step, 0);
        else nudgeSelection(step, 0);
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
        if (rm.size > 0) setConfig((p) => ({ ...p, ratings: p.ratings.filter((r) => !rm.has(r)) }));
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
      if (e.key === ']' && !mod && !e.shiftKey) {
        e.preventDefault();
        setRightVisible((v) => !v);
        return;
      }
      if (e.key === 'Tab' && !mod) {
        const ratings = configRatingsRef.current;
        if (!ratings.length) return;
        e.preventDefault();
        const selArr = Array.from(selectedIdsRef.current);
        const lastSel = selArr[selArr.length - 1];
        const idx = lastSel ? ratings.indexOf(lastSel) : -1;
        const next = ratings[(idx + (e.shiftKey ? -1 + ratings.length : 1)) % ratings.length];
        setBatchSelection([next]);
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

  // ── Command palette commands ────────────────────────────────────────────
  const paletteCommands: PaletteCommand[] = [
    // Panel switching
    {
      id: 'panel-source',
      label: 'Open Source Panel',
      category: 'Panels',
      icon: <Film size={13} />,
      action: () => setActiveTab('source'),
    },
    {
      id: 'panel-layers',
      label: 'Open Layers Panel',
      category: 'Panels',
      icon: <Layers size={13} />,
      action: () => setActiveTab('layers'),
    },
    {
      id: 'panel-canvas',
      label: 'Open Canvas Panel',
      category: 'Panels',
      icon: <Monitor size={13} />,
      action: () => setActiveTab('poster'),
    },
    {
      id: 'panel-badges',
      label: 'Open Badges Panel',
      category: 'Panels',
      icon: <Sliders size={13} />,
      action: () => setActiveTab('badges'),
    },
    {
      id: 'panel-selection',
      label: 'Open Selection Panel',
      category: 'Panels',
      icon: <MousePointer2 size={13} />,
      action: () => setActiveTab('selection'),
    },
    // View
    {
      id: 'zoom-fit',
      label: 'Zoom to Fit',
      category: 'View & Canvas',
      icon: <Maximize2 size={13} />,
      shortcut: '⌘1',
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
      label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
      category: 'View & Canvas',
      icon: isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />,
      shortcut: 'F',
      action: toggleFullscreen,
    },
    {
      id: 'grid',
      label: `${viewOptions.showGrid ? 'Hide' : 'Show'} Grid`,
      category: 'View & Canvas',
      icon: <Grid3x3 size={13} />,
      shortcut: 'G',
      action: () => toggleViewOption('showGrid'),
    },
    {
      id: 'safe-area',
      label: `${viewOptions.showSafeArea ? 'Hide' : 'Show'} Safe Area`,
      category: 'View & Canvas',
      icon: <ShieldCheck size={13} />,
      action: () => toggleViewOption('showSafeArea'),
    },
    {
      id: 'right-panel',
      label: `${rightVisible ? 'Hide' : 'Show'} Right Panel`,
      category: 'View & Canvas',
      icon: <PanelRight size={13} />,
      shortcut: ']',
      action: () => setRightVisible((v) => !v),
    },
    // Selection
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
      action: showAllBadges,
    },
    {
      id: 'hide-sel',
      label: 'Hide Selected',
      category: 'Layers & Selection',
      icon: <EyeOff size={13} />,
      shortcut: 'H',
      action: () => Array.from(selectedIds).forEach((id) => hideBadge(id as RatingType)),
    },
    // Canvas
    {
      id: 'grayscale',
      label: `${config.grayscale ? 'Remove' : 'Apply'} Grayscale`,
      category: 'Canvas Properties',
      icon: <Contrast size={13} />,
      action: () => setConfig((p) => ({ ...p, grayscale: !p.grayscale })),
    },
    // Export
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
    // History
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
      id: 'reset',
      label: 'Reset All Settings',
      category: 'File',
      icon: <RotateCcw size={13} />,
      action: () => setIsResetOpen(true),
    },
    // App
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      category: 'File',
      icon: <Keyboard size={13} />,
      shortcut: '⌘/',
      action: () => setShortcutsOpen(true),
    },
  ];

  const ctxBadgeSelected = ctxMenu.badgeId
    ? ctxMenu.badgeId === 'logo'
      ? selectedLogo
      : selectedIds.has(ctxMenu.badgeId)
    : false;

  const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .adv-ui, .adv-ui * { user-select: none; -webkit-user-select: none; }
        .adv-ui input, .adv-ui textarea, .adv-ui [contenteditable] { user-select: text; -webkit-user-select: text; }
        .adv-sidebar-transition { transition: width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease; }
      `}</style>

      <div
        className="adv-ui flex flex-col overflow-hidden"
        style={{
          height: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        {/* ── Modals & overlays ── */}
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
        <ExportPopover
          config={config}
          onLoadConfig={handleLoadConfig}
          baseUrl={baseUrl}
          onExtensionChange={handleExtensionChange}
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          anchorRef={exportBtnRef}
        />

        {/* ── Header ────────────────────────────────────────────────────── */}
        {!isFullscreen && (
          <header
            className="h-12 shrink-0 flex items-center z-30 relative"
            style={{
              background: 'rgba(7,7,6,0.97)',
              borderBottom: '1px solid rgba(196,124,46,0.08)',
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(196,124,46,0.15), transparent)',
              }}
              aria-hidden="true"
            />

            {/* Left: logo + badges */}
            <div className="flex items-center px-2 sm:px-3 shrink-0 gap-1.5">
              <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
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
              <BuilderModeToggle mode="advanced" className="hidden sm:inline-flex" />
              <ToolbarBtn
                onClick={() => setShortcutsOpen((v) => !v)}
                label="Keyboard Shortcuts (⌘/)"
                active={shortcutsOpen}
                hideOnMobile
              >
                <Keyboard size={14} />
              </ToolbarBtn>
            </div>

            {/* Centre: command palette trigger */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none px-1 sm:px-2">
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden min-[751px]:flex items-center gap-2 px-3 h-8 w-full max-w-[420px] rounded-md transition-colors pointer-events-auto"
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
                  Search commands…
                </span>
                <kbd
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-white/5 shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right: actions */}
            <div className="ml-auto flex items-center justify-end px-2 sm:px-3 shrink-0 gap-0.5 sm:gap-1">
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

              <button
                ref={importBtnRef}
                onClick={() => setIsImportOpen(true)}
                className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-md transition-colors syne-font"
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
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: exportOpen ? 'none' : '0 0 16px rgba(196,124,46,0.2)',
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

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden relative flex-col lg:flex-row">
          {/* Left: Advanced nav sidebar (desktop only) */}
          {!isFullscreen && (
            <aside
              aria-label="Panel navigation"
              className="hidden lg:flex flex-col z-20 relative shrink-0 adv-sidebar-transition"
              style={{
                width: navVisible ? 220 : 0,
                borderRight: navVisible ? '1px solid rgba(196,124,46,0.07)' : 'none',
                overflow: 'hidden',
                opacity: navVisible ? 1 : 0,
              }}
            >
              <AdvancedNavSidebar config={config} selectedCount={selectedCount} />
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

            {/* Zoom + fullscreen overlay */}
            <div
              className={clsx(
                'fixed z-40 flex items-center gap-1 rounded-xl select-none',
                isDesktop ? 'flex-col' : 'flex-row'
              )}
              style={{
                ...(isDesktop
                  ? {
                      top: '50%',
                      transform: 'translateY(-50%)',
                      right: (rightVisible && !isFullscreen ? rightW : 0) + 20,
                      transition: 'right 0.3s cubic-bezier(0.16,1,0.3,1)',
                    }
                  : { bottom: 76, right: 12 }),
                background: 'rgba(14,13,11,0.92)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(196,124,46,0.18)',
                padding: '6px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}
            >
              {[
                { icon: <ZoomIn size={15} />, label: 'Zoom In', action: () => dispatchZoom(0.25) },
                {
                  icon: <ZoomOut size={15} />,
                  label: 'Zoom Out',
                  action: () => dispatchZoom(-0.25),
                },
                { icon: <Maximize2 size={14} />, label: 'Reset View', action: dispatchResetView },
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
              {isDesktop && (
                <>
                  <div
                    style={{
                      width: 20,
                      height: 1,
                      background: 'rgba(255,255,255,0.08)',
                      margin: '2px 0',
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
                </>
              )}
            </div>
          </main>

          {/* Right: panel content (desktop) */}
          {!isFullscreen && (
            <aside
              aria-label="Panel content"
              className="hidden lg:flex flex-col z-20 relative shrink-0 adv-sidebar-transition"
              style={{
                width: rightVisible ? rightW : 0,
                background: 'var(--film-dark)',
                borderLeft: rightVisible ? '1px solid rgba(196,124,46,0.07)' : 'none',
                overflow: 'hidden',
                opacity: rightVisible ? 1 : 0,
              }}
            >
              {/* Resize handle */}
              <div
                onMouseDown={startResizeRight}
                className="absolute inset-y-0 left-0 w-2 cursor-col-resize group z-50"
              >
                <div className="absolute inset-y-0 left-0 w-[2px] bg-transparent group-hover:bg-[rgba(196,124,46,0.4)] transition-colors duration-150" />
              </div>
              <AdvancedRightPanel
                config={config}
                setConfig={setConfig}
                selectedIds={selectedIds}
                onSelect={handleSelectionOverride}
              />
            </aside>
          )}

          {/* Mobile panel sheet */}
          {!isFullscreen && (
            <div
              className={clsx(
                'lg:hidden flex flex-col shrink-0 w-full bg-[var(--film-dark)] transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden z-20',
                mobileSheetMode !== 'hidden'
                  ? 'h-[45dvh] border-t border-[rgba(196,124,46,0.15)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]'
                  : 'h-0 border-t-0'
              )}
            >
              {/* Swipe handle */}
              <div
                className="shrink-0 h-8 flex items-center justify-center bg-[rgba(255,255,255,0.01)] border-b border-[rgba(255,255,255,0.04)] active:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer select-none"
                onClick={() => setMobileSheetMode('hidden')}
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
                    forcedPanel={activeTab as 'source' | 'layers' | 'poster'}
                  />
                )}
                {(activeTab === 'badges' || activeTab === 'selection' || activeTab === 'logo') && (
                  <Inspector config={config} setConfig={setConfig} hideTabBar />
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
          selectedCount={selectedCount}
        />
      </div>
    </>
  );
};

// ── AdvancedBuilderApp ────────────────────────────────────────────────────────
const AdvancedBuilderApp: React.FC = () => {
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
      } catch {}
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
    if (!configParam || configParam.length > MAX_QUERY_CONFIG_LENGTH) return;
    try {
      const decoded = atob(decodeURIComponent(configParam));
      const parsed = JSON.parse(decoded) as Partial<PosterConfig>;
      if (!parsed || !Array.isArray(parsed.ratings)) return;
      setConfig({ ...DEFAULT_CONFIG, ...parsed, items: parsed.items ?? {} } as PosterConfig);
    } catch {}
  }, [handleLoadConfig, setConfig]);

  return (
    <EditorProvider>
      <AdvancedStudioLayout
        config={config}
        setConfig={setConfig}
        handleReset={handleReset}
        baseUrl={baseUrl}
        handleLoadConfig={handleLoadConfig}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </EditorProvider>
  );
};

export default AdvancedBuilderApp;
