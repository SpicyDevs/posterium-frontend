// src/components/builder/index.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import clsx from 'clsx';
import type { PosterConfig, ExtensionType, ApiKeys, RatingType, BadgeConfig } from './types';
import { DEFAULT_CONFIG, ALL_BADGES, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_BADGE_W, BASE_BADGE_H } from './types';
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
  ChevronDown,
  Search,
  MoreVertical,
  Undo2 as UndoIcon,
  Redo2 as RedoIcon,
  RotateCcw,
  PanelLeft,
  PanelRight,
  Download,
  Keyboard,
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
  Contrast,
  ArrowUpToLine,
  ArrowDownToLine,
  ScanLine,
  Type,
} from 'lucide-react';
import { useIsDesktop } from '../../lib/breakpoints';
import { ModeToggle } from './components/ModeToggle';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { VerticalPanelNav } from './components/VerticalPanelNav';
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
    selectedLogo,
    selectedMinimalElements,
    handleSelection,
    handleLogoSelection,
    clearSelection,
    viewOptions,
    toggleViewOption,
    copiedStyle,
    setCopiedStyle,
    setBatchSelection,
    builderMode,
    advancedPanel,
  } = useEditor();

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

  const isDesktop = useIsDesktop();

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
            next.logoX !== null && next.logoX !== undefined ? next.logoX : Math.round((CANVAS_WIDTH - next.logoW) / 2);
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
          next.minimalMetaX = Math.max(0, Math.min(CANVAS_WIDTH - 120, (next.minimalMetaX ?? 26) + dx));
          next.minimalMetaY = Math.max(0, Math.min(CANVAS_HEIGHT - 40, (next.minimalMetaY ?? 672) + dy));
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
              const parts = id.split('-');
              const idx = Number(parts[parts.length - 1] ?? -1);
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
  const handleCopyStyle = useCallback(
    (id: LayerTargetId) => {
      if (id === 'logo') return;
      const item = config.items[id as RatingType];
      const style: Partial<BadgeConfig> = { ...item };
      delete style.x;
      delete style.y;
      setCopiedStyle(style);
    },
    [config.items, setCopiedStyle]
  );
  const handlePasteStyle = useCallback(
    (id: LayerTargetId) => {
      if (!copiedStyle || id === 'logo') return;
      const targetIds = selectedIds.has(id as RatingType)
        ? Array.from(selectedIds)
        : [id as RatingType];
      setConfig((prev) => {
        const nextItems = { ...prev.items };
        targetIds.forEach((tid) => {
          nextItems[tid] = { ...nextItems[tid], ...copiedStyle };
        });
        return { ...prev, items: nextItems };
      });
    },
    [copiedStyle, selectedIds, setConfig]
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
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
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
      icon: <UndoIcon size={13} />,
      shortcut: '⌘Z',
      action: undo,
    },
    {
      id: 'redo',
      label: 'Redo',
      category: 'File',
      icon: <RedoIcon size={13} />,
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
        {/* Top Loading Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] z-[9999] overflow-hidden">
          <div className="h-full bg-[var(--film-amber)] w-full -translate-x-full animate-shimmer" />
        </div>

        {!isDesktop && (
          <div className="fixed inset-0 z-[var(--z-top)] flex items-center justify-center p-8 text-center bg-[var(--film-black)]">
            <div className="max-w-md space-y-6">
              <h2 className="poster-font text-3xl text-[var(--film-cream)]">Posterium Builder</h2>
              <p className="syne-font text-zinc-400">Posterium Builder requires a desktop browser.</p>
              <a href="/" className="inline-block px-6 py-2 bg-[var(--film-amber)] text-[var(--film-black)] rounded-full font-bold uppercase tracking-widest text-xs">
                Return Home
              </a>
            </div>
          </div>
        )}
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
          onSelect={(id) => (id === 'logo' ? handleLogoSelection(false) : handleSelectionOverride(id, false))}
          onDeselect={() => clearSelection()}
          onSelectAll={() => setBatchSelection(config.ratings)}
          onDeselectAll={clearSelection}
          onResetBadge={resetLayer}
          onDelete={deleteLayer}
          onCopyStyle={handleCopyStyle}
          onPasteStyle={handlePasteStyle}
          hasCopiedStyle={!!copiedStyle}
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
          <header className="h-12 shrink-0 flex items-center px-4 gap-4 bg-[rgba(7,7,6,0.97)] border-b border-white/5 z-30">
            {/* Left: Logo & ModeToggle */}
            <div className="flex items-center gap-4 shrink-0">
              <a href="/" className="poster-font text-[18px] text-[var(--film-cream)] tracking-widest leading-none">
                POSTERIUM
              </a>
              <ModeToggle />
            </div>

            {/* Center: Command Palette Search */}
            <div className="flex-1 flex justify-center px-4">
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex items-center gap-2 px-3 h-8 w-full max-w-[480px] bg-white/5 border border-white/10 rounded-[var(--radius-sm)] text-zinc-500 hover:border-white/20 transition-all text-left"
              >
                <Search size={13} />
                <span className="text-[11px] syne-font flex-1 truncate">Search commands…</span>
                <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-white/5">⌘K</kbd>
              </button>
            </div>

            {/* Right: Toggles, Undo/Redo, Import/Export, Overflow */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Sidebar Toggles */}
              <div className="flex items-center mr-2">
                <ToolbarBtn onClick={() => setLeftVisible(!leftVisible)} active={leftVisible} label="Toggle Layers ([)">
                  <PanelLeft size={14} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => setRightVisible(!rightVisible)} active={rightVisible} label="Toggle Inspector (])">
                  <PanelRight size={14} />
                </ToolbarBtn>
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center mr-2">
                <ToolbarBtn onClick={undo} disabled={!canUndo} label="Undo (⌘Z)">
                  <UndoIcon size={14} />
                </ToolbarBtn>
                <ToolbarBtn onClick={redo} disabled={!canRedo} label="Redo (⌘Y)">
                  <RedoIcon size={14} />
                </ToolbarBtn>
              </div>

              {/* Import/Export */}
              <div className="flex items-center gap-2 mr-2">
                <button
                  ref={importBtnRef}
                  onClick={() => setIsImportOpen(true)}
                  className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-[var(--film-cream)] transition-colors px-2 py-1"
                >
                  Import
                </button>
                <button
                  ref={exportBtnRef}
                  onClick={() => setExportOpen(!exportOpen)}
                  className="bg-[var(--film-amber)] text-[var(--film-black)] px-4 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_12px_rgba(196,124,46,0.2)]"
                >
                  <Download size={12} />
                  Export
                  <ChevronDown size={10} className={exportOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
              </div>

              {/* Overflow Menu */}
              <Menu as="div" className="relative">
                <Menu.Button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-[var(--film-cream)] hover:bg-white/5 transition-all">
                  <MoreVertical size={16} />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-[var(--film-dark)] border border-white/10 rounded-lg shadow-xl focus:outline-none z-50 p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setIsResetOpen(true)}
                          className={`${active ? 'bg-red-500/10 text-red-400' : 'text-red-400/80'} group flex w-full items-center rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors`}
                        >
                          <RotateCcw size={13} className="mr-3" />
                          Reset All
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setShortcutsOpen(true)}
                          className={`${active ? 'bg-white/5 text-[var(--film-cream)]' : 'text-zinc-400'} group flex w-full items-center rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors`}
                        >
                          <Keyboard size={13} className="mr-3" />
                          Shortcuts
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </header>
        )}

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden relative flex-col lg:flex-row">
          {/* Left sidebar */}
          {!isFullscreen && (
            <aside
              aria-label="Navigation"
              className="hidden lg:flex flex-col z-20 relative shrink-0 sidebar-transition"
              style={{
                width: leftVisible ? (builderMode === 'advanced' ? 140 : leftW) : 0,
                background: 'var(--film-dark)',
                borderRight: leftVisible ? '1px solid rgba(196,124,46,0.07)' : 'none',
                overflow: 'hidden',
                opacity: leftVisible ? 1 : 0,
              }}
            >
              {builderMode === 'advanced' ? (
                <VerticalPanelNav />
              ) : (
                <LayerPanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  onSelect={handleSelectionOverride}
                />
              )}
              {builderMode !== 'advanced' && (
                <div
                  onMouseDown={startResizeLeft}
                  className="absolute inset-y-0 right-0 w-2 cursor-col-resize group z-50"
                >
                  <div className="absolute inset-y-0 right-0 w-[2px] bg-transparent group-hover:bg-[rgba(196,124,46,0.4)] transition-colors duration-150" />
                </div>
              )}
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
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {advancedPanel === 'source' && (
                     <LayerPanel config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelectionOverride} hideBadgesSection />
                  )}
                  {advancedPanel === 'poster' && <Inspector config={config} setConfig={setConfig} panel="poster" />}
                  {advancedPanel === 'badges' && <Inspector config={config} setConfig={setConfig} hidePresets hideLogo panel="badges" />}
                  {advancedPanel === 'layout' && <Inspector config={config} setConfig={setConfig} panel="layout" />}
                  {advancedPanel === 'fallbacks' && <Inspector config={config} setConfig={setConfig} panel="fallbacks" />}
                </div>
              ) : (
                <Inspector config={config} setConfig={setConfig} />
              )}
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
