// src/components/builder/index.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import clsx from 'clsx';
import type { PosterConfig, ExtensionType, ApiKeys, RatingType } from './types';
import { DEFAULT_CONFIG, ALL_BADGES } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
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
  Coffee,
} from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';
import ContextMenu, { type ContextMenuState } from './components/ContextMenu';
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

// ── Toolbar button ──────────────────────────────────────────────────────────
interface ToolbarBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  hideOnMobile?: boolean;
}
const ToolbarBtn = memo<ToolbarBtnProps>(
  ({ onClick, disabled, label, danger, href, active, children, hideOnMobile = false }) => {
    const base = `relative group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E] ${hideOnMobile ? 'hidden lg:flex' : ''}`;
    const cls = `${base} ${
      disabled
        ? 'cursor-not-allowed pointer-events-none'
        : active
          ? 'cursor-pointer'
          : 'active:scale-95 cursor-pointer'
    }`;

    const activeStyle = active
      ? {
          color: 'var(--film-amber)',
          background: 'rgba(196,124,46,0.1)',
          border: '1px solid rgba(196,124,46,0.2)',
        }
      : disabled
        ? { color: 'rgba(255,255,255,0.15)', border: '1px solid transparent', opacity: 0.5 }
        : danger
          ? { color: 'var(--film-text-dim)', border: '1px solid transparent' }
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
  }
);
ToolbarBtn.displayName = 'ToolbarBtn';

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
    mobileSheetMode,
    setMobileSheetMode,
    selectedIds,
    handleSelection,
    clearSelection,
    setBatchSelection,
    viewOptions,
    toggleViewOption,
  } = useEditor();

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
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
  const openCtxMenu = useCallback((badgeId: RatingType, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, badgeId });
  }, []);
  const closeCtxMenu = useCallback(() => setCtxMenu((s) => ({ ...s, visible: false })), []);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const selectedIdsRef = useRef(selectedIds);
  const configRatingsRef = useRef(config.ratings);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
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
        if (selectedIds.size > 0) {
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
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const rm = new Set(selectedIdsRef.current);
        setConfig((p) => ({ ...p, ratings: p.ratings.filter((r) => !rm.has(r)) }));
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
    isFullscreen,
    paletteOpen,
    shortcutsOpen,
    exportOpen,
    selectedIds,
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

  const ctxBadgeSelected = ctxMenu.badgeId ? selectedIds.has(ctxMenu.badgeId) : false;

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
        />
        <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <ContextMenu
          state={ctxMenu}
          onClose={closeCtxMenu}
          isSelected={ctxBadgeSelected}
          onBringToFront={(id) => moveLayer(id, 'front')}
          onBringForward={(id) => moveLayer(id, 'forward')}
          onSendBackward={(id) => moveLayer(id, 'back')}
          onSendToBack={(id) => moveLayer(id, 'toback')}
          onHide={hideBadge}
          onShowAll={showAllBadges}
          onSelect={(id) => handleSelectionOverride(id, false)}
          onDeselect={() => clearSelection()}
          onSelectAll={() => setBatchSelection(config.ratings)}
          onDeselectAll={clearSelection}
          onResetBadge={resetBadge}
          onDelete={deleteBadge}
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
          <header
            className="h-12 shrink-0 flex items-center z-30 relative"
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
              <a
                href="#"
                aria-label="Support us by Buying us a Coffee"
                className="flex items-center gap-1 h-7 px-2 sm:px-2.5 rounded-md transition-all active:scale-95 bg-[rgba(196,124,46,0.16)] border border-[rgba(196,124,46,0.28)] text-[var(--film-cream)] hover:bg-[rgba(196,124,46,0.24)] hover:border-[rgba(196,124,46,0.42)]"
              >
                <Coffee size={12} className="shrink-0 fill-current" />
                <span className="hidden min-[901px]:inline text-[10px] syne-font font-bold uppercase tracking-wider">
                  Support
                </span>
              </a>
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
        <div className="flex flex-1 overflow-hidden relative flex-col lg:flex-row">
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
              <LayerPanel
                config={config}
                setConfig={setConfig}
                selectedIds={selectedIds}
                onSelect={handleSelectionOverride}
              />
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
              <Inspector config={config} setConfig={setConfig} />
            </aside>
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
                {(activeTab === 'badges' || activeTab === 'logo' || activeTab === 'selection') && (
                  <Inspector config={config} setConfig={setConfig} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile dock */}
        <MobileDock
          hasLogo={config.logo}
          hasBadges={config.ratings.length > 0}
          selectedCount={selectedIds.size}
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
const BuilderApp: React.FC = () => {
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
      />
    </EditorProvider>
  );
};

export default BuilderApp;
