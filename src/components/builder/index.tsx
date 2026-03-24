// src/components/builder/index.tsx
import React, {
  useState, useEffect, useRef, Fragment, useCallback, memo,
} from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import type { PosterConfig, ExtensionType, ApiKeys, RatingType } from './types';
import { DEFAULT_CONFIG, ALL_BADGES } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import { EditorProvider, useEditor } from './context/EditorContext';
import {
  RotateCcw, AlertTriangle, Undo2, Redo2,
  PanelLeft, PanelRight, Maximize2, Minimize2,
  Command, ZoomIn, ZoomOut, Grid3x3, ShieldCheck,
  Eye, EyeOff, Layers, CheckSquare, MousePointer2Off,
  Download, Image as ImageIcon, Contrast, ArrowUpToLine,
  ArrowDownToLine, ScanLine, RefreshCw,
} from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';
import ContextMenu, { type ContextMenuState } from './components/ContextMenu';
import CommandPalette, { type PaletteCommand } from './components/CommandPalette';
import { SprocketStrip } from '@/components/shared/primitives';

const STORAGE_KEY = 'posterium_config_v2';

// ── Cookie helpers ────────────────────────────────────────────────────────────
const COOKIE_KEY = 'posterium_apikeys_v1';
const saveKeysToCookie = (keys: ApiKeys) => {
  try {
    const val = encodeURIComponent(JSON.stringify(keys));
    const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${val}; expires=${exp}; path=/; SameSite=Strict`;
  } catch { /* ignore */ }
};
const loadKeysFromCookie = (): ApiKeys => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
    if (!match) return {};
    return JSON.parse(decodeURIComponent(match[1])) || {};
  } catch { return {}; }
};

// ── Reset dialog ──────────────────────────────────────────────────────────────
const ResetDialog = memo<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
}>(({ isOpen, onClose, onConfirm }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <TransitionChild as={Fragment}
        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
      </TransitionChild>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
          leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
        >
          <DialogPanel className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{ background: 'var(--film-mid)', borderColor: 'rgba(196,124,46,0.15)' }}>
            <DialogTitle as="h3" className="text-sm font-semibold flex items-center gap-3"
              style={{ color: 'var(--film-cream)' }}>
              <span className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={14} className="text-red-400" />
              </span>
              Reset Configuration
            </DialogTitle>
            <p className="mt-3 text-xs leading-5" style={{ color: 'var(--film-silver)' }}>
              All settings will be restored to defaults. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={onClose}
                className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] cursor-pointer tracking-wide uppercase select-none"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--film-silver)',
                }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(196,124,46,0.3)'; (e.currentTarget).style.color = 'var(--film-pale)'; }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget).style.color = 'var(--film-silver)'; }}
              >
                Cancel
              </button>
              <button onClick={() => { onConfirm(); onClose(); }}
                className="flex-1 h-9 rounded-lg bg-red-600/90 border border-red-500/30 text-xs font-semibold text-white hover:bg-red-500 hover:border-red-400/50 transition-all active:scale-[0.97] cursor-pointer tracking-wide uppercase select-none">
                Reset All
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </Transition>
));
ResetDialog.displayName = 'ResetDialog';

// ── Toolbar button ────────────────────────────────────────────────────────────
interface ToolbarBtnProps {
  onClick?: () => void; disabled?: boolean; label: string;
  danger?: boolean; href?: string; active?: boolean; children: React.ReactNode;
}
const ToolbarBtn = memo<ToolbarBtnProps>(({ onClick, disabled, label, danger, href, active, children }) => {
  const base = 'relative group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]';
  const cls = `${base} ${
    disabled
      ? 'text-zinc-700 cursor-not-allowed pointer-events-none'
      : active
        ? 'text-[#D4A245] bg-[#C47C2E]/15 ring-1 ring-[#C47C2E]/25 cursor-pointer'
        : danger
          ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 cursor-pointer'
          : 'text-zinc-500 hover:text-[#D4A245] hover:bg-[#C47C2E]/10 active:scale-95 cursor-pointer'
  }`;
  const tooltip = !disabled && (
    <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 pointer-events-none z-50 shadow-lg"
      style={{ background: 'var(--film-mid)', color: 'var(--film-cream)', borderColor: 'rgba(255,255,255,0.1)' }}>
      {label}
    </span>
  );
  if (href) return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={cls} aria-label={label}>
      {children}{tooltip}
    </a>
  );
  return (
    <button onClick={onClick} disabled={!!disabled} className={cls} aria-label={label} aria-disabled={disabled}>
      {children}{tooltip}
    </button>
  );
});
ToolbarBtn.displayName = 'ToolbarBtn';

// ── Fullscreen floating overlay controls ──────────────────────────────────────
const FullscreenOverlay = memo<{ onExit: () => void; onZoomIn: () => void; onZoomOut: () => void; onResetView: () => void; }>(
  ({ onExit, onZoomIn, onZoomOut, onResetView }) => (
    <div
      className="fixed z-40 flex items-center gap-1 rounded-xl select-none"
      style={{
        bottom: 20, right: 20,
        background: 'rgba(14,13,11,0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(196,124,46,0.18)',
        padding: '6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {[
        { icon: <ZoomIn size={15} />, label: 'Zoom In', action: onZoomIn },
        { icon: <ZoomOut size={15} />, label: 'Zoom Out', action: onZoomOut },
        { icon: <RefreshCw size={14} />, label: 'Reset View', action: onResetView },
      ].map(({ icon, label, action }) => (
        <button key={label} onClick={action} title={label}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{ color: 'rgba(176,168,152,0.7)', cursor: 'pointer', background: 'transparent', border: 'none' }}
          onMouseEnter={e => { (e.currentTarget).style.color = '#D4A245'; (e.currentTarget).style.background = 'rgba(196,124,46,0.12)'; }}
          onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(176,168,152,0.7)'; (e.currentTarget).style.background = 'transparent'; }}
        >
          {icon}
        </button>
      ))}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
      <button onClick={onExit} title="Exit Fullscreen (F or Esc)"
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
        style={{ color: 'rgba(196,124,46,0.7)', cursor: 'pointer', background: 'transparent', border: 'none' }}
        onMouseEnter={e => { (e.currentTarget).style.color = '#D4A245'; (e.currentTarget).style.background = 'rgba(196,124,46,0.12)'; }}
        onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(196,124,46,0.7)'; (e.currentTarget).style.background = 'transparent'; }}
      >
        <Minimize2 size={15} />
      </button>

      {/* Shortcut hint */}
      <div className="absolute -top-8 right-0 flex items-center gap-2 pointer-events-none">
        {[['F', 'exit'], ['G', 'grid'], ['Esc', 'exit']].map(([k, l]) => (
          <div key={k} className="flex items-center gap-1">
            <kbd style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3, padding: '1px 5px', fontSize: 8,
              fontFamily: 'JetBrains Mono, monospace', color: 'rgba(196,124,46,0.5)',
            }}>{k}</kbd>
            <span style={{ fontSize: 8, color: 'rgba(140,130,112,0.4)', fontFamily: 'Syne, sans-serif' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
);
FullscreenOverlay.displayName = 'FullscreenOverlay';

// ── Studio layout (the real app shell) ────────────────────────────────────────
const StudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean;
}> = ({ config, setConfig, handleReset, baseUrl, handleLoadConfig, undo, redo, canUndo, canRedo }) => {
  const {
    activeTab, mobileSheetMode, setMobileSheetMode,
    selectedIds, handleSelection, clearSelection, setBatchSelection,
    viewOptions, toggleViewOption, setActiveTab,
  } = useEditor();

  const [isResetOpen, setIsResetOpen] = useState(false);

  // ── Sidebar visibility ─────────────────────────────────────────────────────
  const [leftVisible,  setLeftVisible]  = useState(true);
  const [rightVisible, setRightVisible] = useState(true);

  // ── Fullscreen ─────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => setIsFullscreen(v => !v), []);

  // ── Context menu ───────────────────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, badgeId: null,
  });
  const openCtxMenu = useCallback((badgeId: RatingType, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, badgeId });
  }, []);
  const closeCtxMenu = useCallback(() => setCtxMenu(s => ({ ...s, visible: false })), []);

  // ── Command palette ────────────────────────────────────────────────────────
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ── Resize refs ────────────────────────────────────────────────────────────
  const selectedIdsRef   = useRef(selectedIds);
  const configRatingsRef = useRef(config.ratings);
  useEffect(() => { selectedIdsRef.current = selectedIds; });
  useEffect(() => { configRatingsRef.current = config.ratings; });

  // ── Zoom/pan event bus ─────────────────────────────────────────────────────
  const dispatchZoom = useCallback((delta: number) =>
    window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: delta })), []);
  const dispatchResetView = useCallback(() =>
    window.dispatchEvent(new CustomEvent('reset-canvas-view')), []);

  // ── Layer manipulation helpers ─────────────────────────────────────────────
  const moveLayer = useCallback((id: RatingType, direction: 'front' | 'forward' | 'back' | 'toback') => {
    setConfig(prev => {
      const arr = [...prev.ratings];
      const idx = arr.indexOf(id);
      if (idx === -1) return prev;
      arr.splice(idx, 1);
      if (direction === 'front')   arr.push(id);
      else if (direction === 'forward') arr.splice(Math.min(idx + 1, arr.length), 0, id);
      else if (direction === 'back')    arr.splice(Math.max(idx - 1, 0), 0, id);
      else                              arr.unshift(id);
      return { ...prev, ratings: arr };
    });
  }, [setConfig]);

  const hideBadge = useCallback((id: RatingType) => {
    setConfig(prev => ({ ...prev, ratings: prev.ratings.filter(r => r !== id) }));
    clearSelection();
  }, [setConfig, clearSelection]);

  const showAllBadges = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      ratings: ALL_BADGES.map(b => b.id).filter(id =>
        prev.ratings.includes(id) || !prev.ratings.includes(id)
      ),
    }));
  }, [setConfig]);

  const resetBadge = useCallback((id: RatingType) => {
    setConfig(prev => {
      const ni = { ...prev.items };
      delete ni[id];
      return { ...prev, items: ni };
    });
  }, [setConfig]);

  const deleteBadge = useCallback((id: RatingType) => {
    setConfig(prev => ({ ...prev, ratings: prev.ratings.filter(r => r !== id) }));
    clearSelection();
  }, [setConfig, clearSelection]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      // Command palette (works even in inputs for Ctrl+K)
      if (mod && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setPaletteOpen(v => !v);
        return;
      }

      if (inInput) return;

      // ── Selection ──
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

      // ── History ──
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      // ── Delete selected ──
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const rm = new Set(selectedIdsRef.current);
        setConfig(p => ({ ...p, ratings: p.ratings.filter(r => !rm.has(r)) }));
        clearSelection();
        return;
      }

      // ── Layering (selected badges) ──
      if (selectedIdsRef.current.size > 0) {
        const sel = Array.from(selectedIdsRef.current);
        if (mod && e.shiftKey && e.key === ']') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'front')); return; }
        if (mod && e.shiftKey && e.key === '[') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'toback')); return; }
        if (mod && e.key === ']') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'forward')); return; }
        if (mod && e.key === '[') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'back')); return; }

        // ── Hide selected (H) ──
        if (e.key.toLowerCase() === 'h' && !mod) {
          e.preventDefault();
          sel.forEach(id => hideBadge(id as RatingType));
          return;
        }
      }

      // ── View / Canvas ──
      if (e.key.toLowerCase() === 'f' && !mod) {
        e.preventDefault();
        setIsFullscreen(v => !v);
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
      if (mod && e.key === '1') { e.preventDefault(); dispatchResetView(); return; }
      if (mod && (e.key === '+' || e.key === '=')) { e.preventDefault(); dispatchZoom(0.25); return; }
      if (mod && e.key === '-') { e.preventDefault(); dispatchZoom(-0.25); return; }

      // ── Sidebar toggles ──
      if (e.key === '[' && !mod && !e.shiftKey) { e.preventDefault(); setLeftVisible(v => !v); return; }
      if (e.key === ']' && !mod && !e.shiftKey) { e.preventDefault(); setRightVisible(v => !v); return; }

      // ── Tab: cycle badge selection ──
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
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    undo, redo, setConfig, clearSelection, setBatchSelection,
    moveLayer, hideBadge, toggleViewOption, dispatchZoom, dispatchResetView,
  ]);

  // ── Panel widths ───────────────────────────────────────────────────────────
  const [leftW,  setLeftW]  = useState(272);
  const [rightW, setRightW] = useState(308);

  const startResizeLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const sx = e.clientX, sw = leftW;
    const move = (m: MouseEvent) => setLeftW(Math.max(220, Math.min(sw + m.clientX - sx, 540)));
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
  }, [leftW]);

  const startResizeRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const sx = e.clientX, sw = rightW;
    const move = (m: MouseEvent) => setRightW(Math.max(248, Math.min(sw - (m.clientX - sx), 540)));
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
  }, [rightW]);

  // ── Mobile sheet ───────────────────────────────────────────────────────────
  const sheetRef        = useRef<HTMLDivElement>(null);
  const dragStartY      = useRef<number | null>(null);
  const dragDelta       = useRef(0);
  const isSheetDragging = useRef(false);
  const modeRef         = useRef(mobileSheetMode);
  useEffect(() => { modeRef.current = mobileSheetMode; });

  const SNAPS:   { hidden: string; half: string; full: string } = { hidden: '100%', half: '0%', full: '0%' };
  const HEIGHTS: { hidden: string; half: string; full: string } = {
    hidden: 'min(58dvh, 460px)',
    half:   'min(58dvh, 460px)',
    full:   'calc(100dvh - 56px - 56px - env(safe-area-inset-bottom, 0px))',
  };

  const snapTo = useCallback((mode: typeof mobileSheetMode, animate = true) => {
    const el = sheetRef.current; if (!el) return;
    el.style.transition = animate
      ? 'transform 0.38s cubic-bezier(0.16,1,0.3,1), height 0.38s cubic-bezier(0.16,1,0.3,1)'
      : 'none';
    el.style.transform = `translateY(${SNAPS[mode]})`;
    el.style.height = HEIGHTS[mode];
  }, []);

  useEffect(() => { if (!isSheetDragging.current) snapTo(mobileSheetMode); }, [mobileSheetMode, snapTo]);

  const onHandleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY; dragDelta.current = 0; isSheetDragging.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    if (!isSheetDragging.current || dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current; dragDelta.current = delta;
    const el = sheetRef.current; if (!el) return;
    const resistance = modeRef.current === 'full' && delta < 0 ? 0.1 : 1;
    el.style.transform = `translateY(${Math.max(delta * resistance, -30)}px)`;
  };
  const onHandleTouchEnd = () => {
    if (!isSheetDragging.current) return; isSheetDragging.current = false;
    const delta = dragDelta.current; dragDelta.current = 0; dragStartY.current = null;
    const cur = modeRef.current; const THRESHOLD = 64; let next = cur;
    if (delta > THRESHOLD)  next = cur === 'full' ? 'half' : 'hidden';
    if (delta < -THRESHOLD) next = cur === 'hidden' ? 'half' : 'full';
    snapTo(next); if (next !== cur) setMobileSheetMode(next);
  };

  const handleExtensionChange = useCallback((ext: ExtensionType) => {
    setConfig(prev => ({ ...prev, extension: ext }));
  }, [setConfig]);

  // ── Command palette commands ───────────────────────────────────────────────
  const paletteCommands: PaletteCommand[] = [
    // View & Canvas
    { id: 'zoom-fit',      label: 'Zoom to Fit',        category: 'View & Canvas', icon: <RefreshCw size={13} />, shortcut: '⌘1', keywords: ['reset', 'fit', 'view'], action: dispatchResetView },
    { id: 'zoom-in',       label: 'Zoom In',             category: 'View & Canvas', icon: <ZoomIn size={13} />,    shortcut: '⌘+', action: () => dispatchZoom(0.25) },
    { id: 'zoom-out',      label: 'Zoom Out',            category: 'View & Canvas', icon: <ZoomOut size={13} />,   shortcut: '⌘-', action: () => dispatchZoom(-0.25) },
    { id: 'fullscreen',    label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas', category: 'View & Canvas', icon: isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />, shortcut: 'F', action: toggleFullscreen },
    { id: 'grid',          label: `${viewOptions.showGrid ? 'Hide' : 'Show'} Grid`, category: 'View & Canvas', icon: <Grid3x3 size={13} />, shortcut: 'G', action: () => toggleViewOption('showGrid') },
    { id: 'safe-area',     label: `${viewOptions.showSafeArea ? 'Hide' : 'Show'} Safe Area`, category: 'View & Canvas', icon: <ShieldCheck size={13} />, shortcut: "'", action: () => toggleViewOption('showSafeArea') },
    { id: 'sidebar-left',  label: `${leftVisible ? 'Hide' : 'Show'} Left Sidebar`, category: 'View & Canvas', icon: <PanelLeft size={13} />, shortcut: '[', action: () => setLeftVisible(v => !v) },
    { id: 'sidebar-right', label: `${rightVisible ? 'Hide' : 'Show'} Right Sidebar`, category: 'View & Canvas', icon: <PanelRight size={13} />, shortcut: ']', action: () => setRightVisible(v => !v) },

    // Layers & Selection
    { id: 'select-all',   label: 'Select All Badges',   category: 'Layers & Selection', icon: <CheckSquare size={13} />, shortcut: '⌘A', action: () => setBatchSelection(config.ratings) },
    { id: 'deselect-all', label: 'Deselect All',         category: 'Layers & Selection', icon: <MousePointer2Off size={13} />, shortcut: '⌘D', action: clearSelection },
    { id: 'show-all',     label: 'Show All Badges',       category: 'Layers & Selection', icon: <Eye size={13} />, action: showAllBadges },
    { id: 'hide-sel',     label: 'Hide Selected Badges',  category: 'Layers & Selection', icon: <EyeOff size={13} />, shortcut: 'H',
      action: () => { Array.from(selectedIds).forEach(id => hideBadge(id as RatingType)); } },
    { id: 'layer-front',  label: 'Bring to Front',        category: 'Layers & Selection', icon: <ArrowUpToLine size={13} />, shortcut: '⌘⇧]',
      action: () => { Array.from(selectedIds).forEach(id => moveLayer(id as RatingType, 'front')); } },
    { id: 'layer-back',   label: 'Send to Back',           category: 'Layers & Selection', icon: <ArrowDownToLine size={13} />, shortcut: '⌘⇧[',
      action: () => { Array.from(selectedIds).forEach(id => moveLayer(id as RatingType, 'toback')); } },

    // Canvas Properties
    { id: 'grayscale',   label: `${config.grayscale ? 'Remove' : 'Apply'} Grayscale`, category: 'Canvas Properties', icon: <Contrast size={13} />,
      action: () => setConfig(p => ({ ...p, grayscale: !p.grayscale })) },
    { id: 'blur-0',      label: 'Remove Poster Blur',    category: 'Canvas Properties', icon: <ScanLine size={13} />, keywords: ['blur', 'clear'],
      action: () => setConfig(p => ({ ...p, posterBlur: 0 })) },
    { id: 'blur-8',      label: 'Poster Blur: 8px',      category: 'Canvas Properties', icon: <ScanLine size={13} />, keywords: ['blur'],
      action: () => setConfig(p => ({ ...p, posterBlur: 8 })) },

    // Export
    { id: 'export-png',  label: 'Export as PNG',  category: 'Export', icon: <ImageIcon size={13} />, action: () => setConfig(p => ({ ...p, extension: 'png'  })) },
    { id: 'export-jpg',  label: 'Export as JPG',  category: 'Export', icon: <ImageIcon size={13} />, action: () => setConfig(p => ({ ...p, extension: 'jpg'  })) },
    { id: 'export-webp', label: 'Export as WebP', category: 'Export', icon: <ImageIcon size={13} />, action: () => setConfig(p => ({ ...p, extension: 'webp' })) },
    { id: 'export-svg',  label: 'Export as SVG',  category: 'Export', icon: <ImageIcon size={13} />, action: () => setConfig(p => ({ ...p, extension: 'svg'  })) },

    // File
    { id: 'reset', label: 'Reset Configuration', category: 'File', icon: <RotateCcw size={13} />, keywords: ['clear', 'default'],
      action: () => setIsResetOpen(true) },
  ];

  // ── Selected badge context menu flag ──────────────────────────────────────
  const ctxBadgeSelected = ctxMenu.badgeId ? selectedIds.has(ctxMenu.badgeId) : false;
  const ctxBadgeVisible  = ctxMenu.badgeId ? config.ratings.includes(ctxMenu.badgeId) : false;

  return (
    <>
      <a href="#main-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium select-none"
        style={{ background: 'var(--film-amber)', color: '#070706' }}
      >
        Skip to canvas
      </a>

      {/* Global unselectable style for the builder UI */}
      <style>{`
        .builder-ui, .builder-ui * { user-select: none; -webkit-user-select: none; }
        .builder-ui input, .builder-ui textarea, .builder-ui [contenteditable] {
          user-select: text; -webkit-user-select: text;
        }
        .sidebar-transition { transition: width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease; }
        .sidebar-hidden { width: 0 !important; overflow: hidden; opacity: 0; pointer-events: none; }
        @keyframes zoom-flash { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>

      <div className="builder-ui flex flex-col overflow-hidden"
        style={{ height: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)', fontFamily: 'DM Sans, sans-serif' }}>
        <h1 className="sr-only">Posterium Poster Builder — Drag-and-Drop Movie Poster Editor</h1>

        <ResetDialog isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />

        {/* Context menu */}
        <ContextMenu
          state={ctxMenu}
          onClose={closeCtxMenu}
          isSelected={ctxBadgeSelected}
          isVisible={ctxBadgeVisible}
          onBringToFront={id => moveLayer(id, 'front')}
          onBringForward={id => moveLayer(id, 'forward')}
          onSendBackward={id => moveLayer(id, 'back')}
          onSendToBack={id => moveLayer(id, 'toback')}
          onHide={hideBadge}
          onShowAll={showAllBadges}
          onSelect={id => handleSelection(id, false)}
          onDeselect={() => clearSelection()}
          onSelectAll={() => setBatchSelection(config.ratings)}
          onDeselectAll={clearSelection}
          onResetBadge={resetBadge}
          onDelete={deleteBadge}
        />

        {/* Command palette */}
        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          commands={paletteCommands}
        />

        {/* ── HEADER (hidden in fullscreen) ── */}
        {!isFullscreen && (
          <header className="h-14 shrink-0 flex items-center gap-2 px-3 z-30 relative"
            style={{
              background: 'var(--film-dark)',
              borderBottom: '1px solid rgba(196,124,46,0.1)',
            }}
          >
            {/* Film sprocket strip at header bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(196,124,46,0.2), transparent)' }} />

            {/* Logo */}
            <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <span className="poster-font select-none" style={{
                fontSize: 20, color: 'var(--film-cream)',
                letterSpacing: '0.12em', lineHeight: 1,
                textShadow: '0 0 32px rgba(196,124,46,0.18)',
              }}>
                POSTERIUM
              </span>
            </a>

            <div className="w-px h-5 mx-1 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* URL bar */}
            <div className="flex-1 min-w-0">
              <CodeBox config={config} onLoadConfig={handleLoadConfig} baseUrl={baseUrl} onExtensionChange={handleExtensionChange} />
            </div>

            <div className="w-px h-5 mx-1 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />

            {/* Toolbar actions */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Command palette */}
              <ToolbarBtn onClick={() => setPaletteOpen(v => !v)} label="Command Palette (⌘K)" active={paletteOpen}>
                <Command size={14} />
              </ToolbarBtn>

              <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* Sidebar toggles */}
              <ToolbarBtn onClick={() => setLeftVisible(v => !v)} label={`${leftVisible ? 'Hide' : 'Show'} Layers ([)`} active={!leftVisible}>
                <PanelLeft size={14} />
              </ToolbarBtn>
              <ToolbarBtn onClick={() => setRightVisible(v => !v)} label={`${rightVisible ? 'Hide' : 'Show'} Inspector (])`} active={!rightVisible}>
                <PanelRight size={14} />
              </ToolbarBtn>

              {/* Fullscreen */}
              <ToolbarBtn onClick={toggleFullscreen} label="Fullscreen (F)" active={isFullscreen}>
                <Maximize2 size={14} />
              </ToolbarBtn>

              <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

              {/* Undo / Redo */}
              <ToolbarBtn onClick={undo} disabled={!canUndo} label="Undo (⌘Z)"><Undo2 size={15} /></ToolbarBtn>
              <ToolbarBtn onClick={redo} disabled={!canRedo} label="Redo (⌘Y)"><Redo2 size={15} /></ToolbarBtn>

              <div className="w-px h-5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />

              <ToolbarBtn onClick={() => setIsResetOpen(true)} danger label="Reset to defaults"><RotateCcw size={14} /></ToolbarBtn>

              <ToolbarBtn href="https://github.com/xdaayush/freeposterapi" label="GitHub">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </ToolbarBtn>
            </div>
          </header>
        )}

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left sidebar */}
          {!isFullscreen && (
            <aside
              aria-label="Layer panel"
              className="hidden lg:flex flex-col z-20 relative shrink-0 sidebar-transition"
              style={{
                width: leftVisible ? leftW : 0,
                background: 'var(--film-dark)',
                borderRight: leftVisible ? '1px solid rgba(196,124,46,0.08)' : 'none',
                overflow: 'hidden',
                opacity: leftVisible ? 1 : 0,
              }}
            >
              <LayerPanel config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
              <div onMouseDown={startResizeLeft}
                className="absolute inset-y-0 right-0 w-[3px] cursor-col-resize group z-50" title="Resize panel">
                <div className="absolute inset-y-0 right-0 w-[1px] bg-transparent group-hover:bg-[#C47C2E]/50 transition-colors" />
              </div>
            </aside>
          )}

          {/* Canvas */}
          <main id="main-canvas" role="main" aria-label="Poster canvas"
            className="flex-1 relative overflow-hidden"
            style={{ background: '#111113' }}
            onClick={e => { if (e.target === e.currentTarget) clearSelection(); }}
          >
            {/* Dot grid */}
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-100"
              style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <PreviewCanvas
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              onSelect={handleSelection}
              onContextMenu={openCtxMenu}
            />

            {/* Film corner accents on canvas area */}
            {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
              <div key={c} aria-hidden="true" style={{
                position: 'absolute',
                top:    c.startsWith('t') ? 8 : 'auto',
                bottom: c.startsWith('b') ? 8 : 'auto',
                left:   c.endsWith('l')   ? 8 : 'auto',
                right:  c.endsWith('r')   ? 8 : 'auto',
                width: 12, height: 12, pointerEvents: 'none',
                borderTop:    c.startsWith('t') ? '1px solid rgba(196,124,46,0.2)' : 'none',
                borderBottom: c.startsWith('b') ? '1px solid rgba(196,124,46,0.2)' : 'none',
                borderLeft:   c.endsWith('l')   ? '1px solid rgba(196,124,46,0.2)' : 'none',
                borderRight:  c.endsWith('r')   ? '1px solid rgba(196,124,46,0.2)' : 'none',
              }} />
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
                borderLeft: rightVisible ? '1px solid rgba(196,124,46,0.08)' : 'none',
                overflow: 'hidden',
                opacity: rightVisible ? 1 : 0,
              }}
            >
              <div onMouseDown={startResizeRight}
                className="absolute inset-y-0 left-0 w-[3px] cursor-col-resize group z-50" title="Resize panel">
                <div className="absolute inset-y-0 left-0 w-[1px] bg-transparent group-hover:bg-[#C47C2E]/50 transition-colors" />
              </div>
              <Inspector config={config} setConfig={setConfig} />
            </aside>
          )}
        </div>

        {/* Mobile dock */}
        <MobileDock />

        {/* Mobile sheet */}
        <div ref={sheetRef} role="complementary" aria-label="Mobile editor panel"
          aria-hidden={mobileSheetMode === 'hidden'}
          className="lg:hidden fixed inset-x-0 rounded-t-2xl shadow-2xl z-40 flex flex-col"
          style={{
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            height: HEIGHTS[mobileSheetMode],
            transform: `translateY(${SNAPS[mobileSheetMode]})`,
            background: 'var(--film-dark)',
            border: '1px solid rgba(196,124,46,0.1)',
            borderBottom: 'none',
            pointerEvents: mobileSheetMode === 'hidden' ? 'none' : 'auto',
            willChange: 'transform, height',
          }}
        >
          <div
            onTouchStart={onHandleTouchStart}
            onTouchMove={onHandleTouchMove}
            onTouchEnd={onHandleTouchEnd}
            className="shrink-0 h-10 w-full flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
            role="button" aria-label="Drag to resize"
          >
            <div className="w-9 h-0.75 rounded-full" style={{ background: 'rgba(196,124,46,0.3)' }} />
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0"
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}
            onTouchStart={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
          >
            {(activeTab === 'source' || activeTab === 'layers') && (
              <LayerPanel config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
            )}
            {(activeTab === 'canvas' || activeTab === 'badge') && (
              <Inspector config={config} setConfig={setConfig} />
            )}
          </div>
        </div>

        {/* Fullscreen overlay controls */}
        {isFullscreen && (
          <FullscreenOverlay
            onExit={toggleFullscreen}
            onZoomIn={() => dispatchZoom(0.25)}
            onZoomOut={() => dispatchZoom(-0.25)}
            onResetView={dispatchResetView}
          />
        )}
      </div>
    </>
  );
};

// ── Root app ──────────────────────────────────────────────────────────────────
const BuilderApp: React.FC = () => {
  const { state: config, setState: setConfig, undo, redo, canUndo, canRedo } = usePosterHistory(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const cfg = saved ? (JSON.parse(saved) as PosterConfig) : DEFAULT_CONFIG;
      const cookieKeys = loadKeysFromCookie();
      if (cookieKeys && Object.keys(cookieKeys).some(k => cookieKeys[k as keyof ApiKeys])) {
        return { ...cfg, keys: { ...cookieKeys, ...cfg.keys } };
      }
      return cfg;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }, [config]);
  useEffect(() => {
    if (config.keys) {
      const hasAnyKey = Object.values(config.keys).some(v => v && v.trim());
      if (hasAnyKey) saveKeysToCookie(config.keys);
    }
  }, [config.keys]);

  const handleLoadConfig = useCallback((url: string) => {
    setConfig(parseUrlToConfig(url));
    try { setBaseUrl(new URL(url).origin); } catch { /* keep */ }
  }, [setConfig]);

const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
    window.dispatchEvent(new CustomEvent('reset-canvas-view'));
  }, [setConfig]);

  return (
    <EditorProvider>
      <StudioLayout
        config={config} setConfig={setConfig}
        handleReset={handleReset} baseUrl={baseUrl}
        handleLoadConfig={handleLoadConfig}
        undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
      />
    </EditorProvider>
  );
};

export default BuilderApp;
