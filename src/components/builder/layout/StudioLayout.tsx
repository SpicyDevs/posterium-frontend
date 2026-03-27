// src/components/builder/layout/StudioLayout.tsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels';
import { Drawer } from 'vaul';
import * as RadixDialog from '@radix-ui/react-dialog';
import {
  AlertTriangle, ZoomIn, ZoomOut, Minimize2, Maximize2,
  Grid3x3, ShieldCheck, PanelLeft, PanelRight, Eye, EyeOff, Layers,
  CheckSquare, MousePointer2Off, Download, Image as ImageIcon,
  Contrast, ArrowUpToLine, ArrowDownToLine, ScanLine,
  Keyboard, Type, Undo2, Redo2, RotateCcw,
} from 'lucide-react';
import type { PosterConfig, ExtensionType, RatingType } from '../types';
import { ALL_BADGES } from '../types';
import { useEditor } from '../context/EditorContext';
import PreviewCanvas from '../components/PreviewCanvas';
import LayerPanel from '../components/LayerPanel';
import Inspector from '../components/layout/Inspector';
import MobileDock from '../components/layout/MobileDock';
import ContextMenu, { type ContextMenuState } from '../components/ContextMenu';
import CommandPalette, { type PaletteCommand } from '../components/CommandPalette';
import ShortcutsModal from '../components/ShortcutsModal';
import { Toolbar } from './Toolbar';

// ── Reset Dialog (Radix) ──────────────────────────────────────────────────────
const ResetDialog = memo<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
}>(({ isOpen, onClose, onConfirm }) => (
  <RadixDialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      />
      <RadixDialog.Content
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        style={{ background: 'var(--film-mid)', borderColor: 'rgba(196,124,46,0.15)' }}
      >
        <RadixDialog.Title
          className="text-sm font-semibold flex items-center gap-3"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--film-cream)' }}
        >
          <span className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle size={14} className="text-red-400" />
          </span>
          Reset Configuration
        </RadixDialog.Title>
        <p className="mt-3 text-xs leading-5" style={{ color: 'var(--film-silver)', fontFamily: 'DM Sans, sans-serif' }}>
          All settings will be restored to defaults. This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] cursor-pointer tracking-wide uppercase select-none"
            style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'var(--film-silver)', fontFamily: 'Syne, sans-serif' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)'; e.currentTarget.style.color = 'var(--film-pale)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--film-silver)'; }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 h-9 rounded-lg bg-red-600/90 border border-red-500/30 text-xs font-semibold text-white hover:bg-red-500 transition-all active:scale-[0.97] cursor-pointer tracking-wide uppercase select-none"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Reset All
          </button>
        </div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  </RadixDialog.Root>
));
ResetDialog.displayName = 'ResetDialog';

// ── Fullscreen overlay controls ───────────────────────────────────────────────
const FullscreenOverlay = memo<{
  onExit: () => void; onZoomIn: () => void; onZoomOut: () => void; onResetView: () => void;
}>(({ onExit, onZoomIn, onZoomOut, onResetView }) => (
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
      { icon: <Maximize2 size={14} />, label: 'Reset View', action: onResetView },
    ].map(({ icon, label, action }) => (
      <button
        key={label}
        onClick={action}
        title={label}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
        style={{ color: 'rgba(176,168,152,0.7)', cursor: 'pointer', background: 'transparent', border: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#D4A245'; e.currentTarget.style.background = 'rgba(196,124,46,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(176,168,152,0.7)'; e.currentTarget.style.background = 'transparent'; }}
      >
        {icon}
      </button>
    ))}
    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
    <button
      onClick={onExit}
      title="Exit Fullscreen (F or Esc)"
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90"
      style={{ color: 'rgba(196,124,46,0.7)', cursor: 'pointer', background: 'transparent', border: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.color = '#D4A245'; e.currentTarget.style.background = 'rgba(196,124,46,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(196,124,46,0.7)'; e.currentTarget.style.background = 'transparent'; }}
    >
      <Minimize2 size={15} />
    </button>
    <div className="absolute -top-8 right-0 flex items-center gap-2 pointer-events-none">
      {[['F', 'exit'], ['Esc', 'exit']].map(([k, l]) => (
        <div key={k} className="flex items-center gap-1">
          <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px', fontSize: 8, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(196,124,46,0.5)' }}>{k}</kbd>
          <span style={{ fontSize: 8, color: 'rgba(140,130,112,0.4)', fontFamily: 'Syne, sans-serif' }}>{l}</span>
        </div>
      ))}
    </div>
  </div>
));
FullscreenOverlay.displayName = 'FullscreenOverlay';

// ── Canvas area ───────────────────────────────────────────────────────────────
const CanvasArea = memo<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  onClearSelection: () => void;
}>(({ config, setConfig, selectedIds, onSelect, onClearSelection }) => (
  <main
    id="main-canvas"
    role="main"
    aria-label="Poster canvas"
    className="w-full h-full relative overflow-hidden"
    style={{ background: '#111113' }}
    onClick={e => { if (e.target === e.currentTarget) onClearSelection(); }}
  >
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
    />
    <PreviewCanvas
      config={config}
      setConfig={setConfig}
      selectedIds={selectedIds}
      onSelect={onSelect}
    />
    {/* Film corner accents */}
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
));
CanvasArea.displayName = 'CanvasArea';

// ── Panel resize separator ────────────────────────────────────────────────────
const ResizeBar = () => (
  <Separator
    className="relative w-px bg-transparent hover:bg-[#C47C2E]/40 transition-colors duration-200 cursor-col-resize group shrink-0"
    style={{ zIndex: 10 }}
  >
    <div className="absolute inset-y-0 -left-0.5 w-[3px] group-hover:bg-[#C47C2E]/20 transition-colors" />
  </Separator>
);

// ── Main StudioLayout ─────────────────────────────────────────────────────────
export interface StudioLayoutProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function StudioLayout({
  config, setConfig, handleReset, baseUrl, handleLoadConfig,
  undo, redo, canUndo, canRedo,
}: StudioLayoutProps) {
  const {
    activeTab, mobileSheetMode, setMobileSheetMode,
    selectedIds, handleSelection, clearSelection, setBatchSelection,
    viewOptions, toggleViewOption,
  } = useEditor();

  const [isResetOpen,   setIsResetOpen]   = useState(false);
  const [leftVisible,   setLeftVisible]   = useState(true);
  const [rightVisible,  setRightVisible]  = useState(true);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen,   setPaletteOpen]   = useState(false);

  const toggleFullscreen = useCallback(() => setIsFullscreen(v => !v), []);

  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, badgeId: null });
  const openCtxMenu  = useCallback((badgeId: RatingType, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ visible: true, x: e.clientX, y: e.clientY, badgeId });
  }, []);
  const closeCtxMenu = useCallback(() => setCtxMenu(s => ({ ...s, visible: false })), []);

  // Stable refs to avoid stale closures in the keyboard handler
  const selectedIdsRef   = useRef(selectedIds);
  const configRatingsRef = useRef(config.ratings);
  useEffect(() => { selectedIdsRef.current = selectedIds; });
  useEffect(() => { configRatingsRef.current = config.ratings; });

  // ── react-resizable-panels v4 refs ────────────────────────────────────────
  const leftPanelRef  = usePanelRef();
  const rightPanelRef = usePanelRef();

  const dispatchZoom      = useCallback((delta: number) =>
    window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: delta })), []);
  const dispatchResetView = useCallback(() =>
    window.dispatchEvent(new CustomEvent('reset-canvas-view')), []);

  // ── Layer operations ──────────────────────────────────────────────────────
  const moveLayer = useCallback((id: RatingType, direction: 'front' | 'forward' | 'back' | 'toback') => {
    setConfig(prev => {
      const arr = [...prev.ratings];
      const idx = arr.indexOf(id);
      if (idx === -1) return prev;
      arr.splice(idx, 1);
      if (direction === 'front')        arr.push(id);
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

  const handleExtensionChange = useCallback((ext: ExtensionType) => {
    setConfig(prev => ({ ...prev, extension: ext }));
  }, [setConfig]);

  // ── Sidebar toggle with panel imperative API ──────────────────────────────
  const toggleLeft = useCallback(() => {
    setLeftVisible(v => {
      const next = !v;
      if (next) leftPanelRef.current?.expand();
      else      leftPanelRef.current?.collapse();
      return next;
    });
  }, [leftPanelRef]);

  const toggleRight = useCallback(() => {
    setRightVisible(v => {
      const next = !v;
      if (next) rightPanelRef.current?.expand();
      else      rightPanelRef.current?.collapse();
      return next;
    });
  }, [rightPanelRef]);

  // Sync panels when fullscreen changes
  useEffect(() => {
    if (isFullscreen) {
      leftPanelRef.current?.collapse();
      rightPanelRef.current?.collapse();
    } else {
      if (leftVisible)  leftPanelRef.current?.expand();
      if (rightVisible) rightPanelRef.current?.expand();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      // ESC — highest priority, runs even in inputs
      if (e.key === 'Escape') {
        if (shortcutsOpen) { setShortcutsOpen(false); return; }
        if (paletteOpen)   { setPaletteOpen(false); return; }
        if (isFullscreen)  { setIsFullscreen(false); return; }
        if (selectedIds.size > 0) { clearSelection(); return; }
        return;
      }

      // Command palette — runs even in inputs
      if (mod && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setPaletteOpen(v => !v);
        return;
      }

      // Shortcuts modal — runs even in inputs
      if (mod && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setShortcutsOpen(v => !v);
        return;
      }

      if (inInput) return;

      if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); setBatchSelection(configRatingsRef.current); return; }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); clearSelection(); return; }

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const rm = new Set(selectedIdsRef.current);
        setConfig(p => ({ ...p, ratings: p.ratings.filter(r => !rm.has(r)) }));
        clearSelection();
        return;
      }

      if (selectedIdsRef.current.size > 0) {
        const sel = Array.from(selectedIdsRef.current);
        if (mod && e.shiftKey && e.key === ']') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'front'));  return; }
        if (mod && e.shiftKey && e.key === '[') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'toback')); return; }
        if (mod && e.key === ']') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'forward')); return; }
        if (mod && e.key === '[') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'back'));    return; }
        if (e.key.toLowerCase() === 'h' && !mod) { e.preventDefault(); sel.forEach(id => hideBadge(id as RatingType)); return; }
      }

      if (e.key.toLowerCase() === 'f' && !mod) { e.preventDefault(); setIsFullscreen(v => !v); return; }
      if (e.key.toLowerCase() === 'g' && !mod) { e.preventDefault(); toggleViewOption('showGrid'); return; }
      if (e.key === "'" && !mod)               { e.preventDefault(); toggleViewOption('showSafeArea'); return; }
      if (mod && e.key === '1')                { e.preventDefault(); dispatchResetView(); return; }
      if (mod && (e.key === '+' || e.key === '=')) { e.preventDefault(); dispatchZoom(0.25);  return; }
      if (mod && e.key === '-')                { e.preventDefault(); dispatchZoom(-0.25); return; }

      if (e.key === '[' && !mod && !e.shiftKey) { e.preventDefault(); toggleLeft();  return; }
      if (e.key === ']' && !mod && !e.shiftKey) { e.preventDefault(); toggleRight(); return; }

      if (e.key === 'Tab' && !mod) {
        const ratings = configRatingsRef.current;
        if (ratings.length === 0) return;
        e.preventDefault();
        const selArr  = Array.from(selectedIdsRef.current);
        const lastSel = selArr[selArr.length - 1];
        const idx  = lastSel ? ratings.indexOf(lastSel) : -1;
        const next = ratings[(idx + (e.shiftKey ? -1 + ratings.length : 1)) % ratings.length];
        setBatchSelection([next]);
        return;
      }

      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setConfig(p => ({ ...p, posterBlur: p.posterBlur > 0 ? 0 : 8 }));
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    undo, redo, setConfig, clearSelection, setBatchSelection,
    moveLayer, hideBadge, toggleViewOption, dispatchZoom, dispatchResetView,
    toggleLeft, toggleRight, isFullscreen, paletteOpen, shortcutsOpen, selectedIds,
  ]);

  // ── Command palette commands ──────────────────────────────────────────────
  const paletteCommands: PaletteCommand[] = [
    // View & Canvas
    { id: 'zoom-fit',      label: 'Zoom to Fit',   category: 'View & Canvas', icon: <Maximize2 size={13} />,   shortcut: '⌘1',  keywords: ['reset','fit','view'],        action: dispatchResetView },
    { id: 'zoom-in',       label: 'Zoom In',        category: 'View & Canvas', icon: <ZoomIn size={13} />,     shortcut: '⌘+',  action: () => dispatchZoom(0.25) },
    { id: 'zoom-out',      label: 'Zoom Out',       category: 'View & Canvas', icon: <ZoomOut size={13} />,    shortcut: '⌘-',  action: () => dispatchZoom(-0.25) },
    { id: 'fullscreen',    label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Canvas', category: 'View & Canvas', icon: isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />, shortcut: 'F', action: toggleFullscreen },
    { id: 'grid',          label: `${viewOptions.showGrid ? 'Hide' : 'Show'} Grid Overlay`,    category: 'View & Canvas', icon: <Grid3x3 size={13} />,    shortcut: 'G',   keywords: ['grid','lines'],           action: () => toggleViewOption('showGrid') },
    { id: 'safe-area',     label: `${viewOptions.showSafeArea ? 'Hide' : 'Show'} Safe Area`,   category: 'View & Canvas', icon: <ShieldCheck size={13} />, shortcut: "'",   keywords: ['safe','area','zone'],      action: () => toggleViewOption('showSafeArea') },
    { id: 'sidebar-left',  label: `${leftVisible ? 'Hide' : 'Show'} Left Sidebar`,             category: 'View & Canvas', icon: <PanelLeft size={13} />,   shortcut: '[',   keywords: ['layers','source','panel'], action: toggleLeft },
    { id: 'sidebar-right', label: `${rightVisible ? 'Hide' : 'Show'} Right Sidebar`,           category: 'View & Canvas', icon: <PanelRight size={13} />,  shortcut: ']',   keywords: ['inspector','panel'],       action: toggleRight },
    { id: 'shortcuts-help',label: 'Show Keyboard Shortcuts',                                   category: 'View & Canvas', icon: <Keyboard size={13} />,    shortcut: '⌘/',  keywords: ['help','keys','hotkeys'],   action: () => setShortcutsOpen(true) },
    // Layers & Selection
    { id: 'select-all',    label: 'Select All Badges',      category: 'Layers & Selection', icon: <CheckSquare size={13} />,     shortcut: '⌘A',  action: () => setBatchSelection(config.ratings) },
    { id: 'deselect-all',  label: 'Deselect All',           category: 'Layers & Selection', icon: <MousePointer2Off size={13} />, shortcut: '⌘D',  action: clearSelection },
    { id: 'show-all',      label: 'Show All Badges',        category: 'Layers & Selection', icon: <Eye size={13} />,             keywords: ['reveal','unhide'],    action: showAllBadges },
    { id: 'hide-sel',      label: 'Hide Selected Badges',   category: 'Layers & Selection', icon: <EyeOff size={13} />,          shortcut: 'H',   keywords: ['hide','selected'],    action: () => Array.from(selectedIds).forEach(id => hideBadge(id as RatingType)) },
    { id: 'layer-front',   label: 'Bring to Front',         category: 'Layers & Selection', icon: <ArrowUpToLine size={13} />,   shortcut: '⌘⇧]', action: () => Array.from(selectedIds).forEach(id => moveLayer(id as RatingType, 'front')) },
    { id: 'layer-back',    label: 'Send to Back',           category: 'Layers & Selection', icon: <ArrowDownToLine size={13} />, shortcut: '⌘⇧[', action: () => Array.from(selectedIds).forEach(id => moveLayer(id as RatingType, 'toback')) },
    { id: 'delete-sel',    label: 'Delete Selected Badges', category: 'Layers & Selection', icon: <Layers size={13} />,          shortcut: 'Del', keywords: ['remove','delete'],
      action: () => { const rm = new Set(selectedIds); setConfig(p => ({ ...p, ratings: p.ratings.filter(r => !rm.has(r)) })); clearSelection(); } },
    // Badges
    { id: 'add-imdb',        label: 'Add IMDb Badge',       category: 'Badges', icon: <Layers size={13} />, keywords: ['add','badge','imdb'],      action: () => setConfig(p => p.ratings.includes('imdb') ? p : { ...p, ratings: ['imdb', ...p.ratings] }) },
    { id: 'add-rt',          label: 'Add Rotten Tomatoes',  category: 'Badges', icon: <Layers size={13} />, keywords: ['add','badge','rt','rotten','tomatoes'], action: () => setConfig(p => p.ratings.includes('rt') ? p : { ...p, ratings: ['rt', ...p.ratings] }) },
    { id: 'add-meta',        label: 'Add Metacritic',       category: 'Badges', icon: <Layers size={13} />, keywords: ['add','badge','meta','metacritic'], action: () => setConfig(p => p.ratings.includes('meta') ? p : { ...p, ratings: ['meta', ...p.ratings] }) },
    { id: 'add-tmdb',        label: 'Add TMDB Badge',       category: 'Badges', icon: <Layers size={13} />, keywords: ['add','badge','tmdb'],      action: () => setConfig(p => p.ratings.includes('tmdb') ? p : { ...p, ratings: ['tmdb', ...p.ratings] }) },
    { id: 'add-age',         label: 'Add Age Rating Badge', category: 'Badges', icon: <Layers size={13} />, keywords: ['add','age','rating','pg','certificate'], action: () => setConfig(p => p.ratings.includes('age') ? p : { ...p, ratings: ['age', ...p.ratings] }) },
    { id: 'add-runtime',     label: 'Add Runtime Badge',    category: 'Badges', icon: <Layers size={13} />, keywords: ['add','runtime','duration','time'], action: () => setConfig(p => p.ratings.includes('runtime') ? p : { ...p, ratings: ['runtime', ...p.ratings] }) },
    { id: 'clear-all-badges',label: 'Remove All Badges',    category: 'Badges', icon: <EyeOff size={13} />, keywords: ['clear','remove','all','badges'], action: () => { setConfig(p => ({ ...p, ratings: [] })); clearSelection(); } },
    { id: 'toggle-icons',    label: `${config.icon !== false ? 'Hide' : 'Show'} All Badge Icons`, category: 'Badges', icon: <Eye size={13} />, keywords: ['icons','show','hide'], action: () => setConfig(p => ({ ...p, icon: !(p.icon !== false) })) },
    { id: 'toggle-text',     label: `${config.showText !== false ? 'Hide' : 'Show'} Rating Text`, category: 'Badges', icon: <Type size={13} />, keywords: ['text','numbers','rating','show','hide'], action: () => setConfig(p => ({ ...p, showText: !(p.showText !== false) })) },
    // Canvas Properties
    { id: 'grayscale',     label: `${config.grayscale ? 'Remove' : 'Apply'} Grayscale`,        category: 'Canvas Properties', icon: <Contrast size={13} />,   keywords: ['grayscale','bw','black','white'],  action: () => setConfig(p => ({ ...p, grayscale: !p.grayscale })) },
    { id: 'blur-0',        label: 'Remove Poster Blur',           category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','clear','sharp'],  action: () => setConfig(p => ({ ...p, posterBlur: 0 })) },
    { id: 'blur-4',        label: 'Poster Blur: Light (4px)',     category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','light'],          action: () => setConfig(p => ({ ...p, posterBlur: 4 })) },
    { id: 'blur-8',        label: 'Poster Blur: Medium (8px)',    category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','medium'],         action: () => setConfig(p => ({ ...p, posterBlur: 8 })) },
    { id: 'blur-16',       label: 'Poster Blur: Heavy (16px)',    category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','heavy','strong'], action: () => setConfig(p => ({ ...p, posterBlur: 16 })) },
    { id: 'textless-on',   label: 'Enable Textless Poster',       category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['textless','clean'],      action: () => setConfig(p => ({ ...p, textless: true })) },
    { id: 'textless-off',  label: 'Disable Textless Poster',      category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['textless','text'],       action: () => setConfig(p => ({ ...p, textless: false })) },
    { id: 'source-tmdb',   label: 'Switch Poster Source: TMDB',   category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['source','tmdb','poster'],  action: () => setConfig(p => ({ ...p, source: 'tmdb' })) },
    { id: 'source-fanart', label: 'Switch Poster Source: Fanart', category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['source','fanart','poster'],action: () => setConfig(p => ({ ...p, source: 'fanart' })) },
    { id: 'radius-0',      label: 'Remove Badge Corner Radius',   category: 'Canvas Properties', icon: <Grid3x3 size={13} />,    keywords: ['radius','round','square'],action: () => setConfig(p => ({ ...p, radius: 0 })) },
    { id: 'radius-12',     label: 'Set Badge Radius: Rounded',    category: 'Canvas Properties', icon: <Grid3x3 size={13} />,    keywords: ['radius','round'],         action: () => setConfig(p => ({ ...p, radius: 12 })) },
    { id: 'radius-max',    label: 'Set Badge Radius: Pill',       category: 'Canvas Properties', icon: <Grid3x3 size={13} />,    keywords: ['radius','pill','circle'], action: () => setConfig(p => ({ ...p, radius: 30 })) },
    // Export
    { id: 'export-svg',    label: 'Export as SVG',  category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'svg'  })) },
    { id: 'export-png',    label: 'Export as PNG',  category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'png'  })) },
    { id: 'export-jpg',    label: 'Export as JPG',  category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'jpg'  })) },
    { id: 'export-webp',   label: 'Export as WebP', category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'webp' })) },
    // File
    { id: 'reset', label: 'Reset All Settings', category: 'File', icon: <RotateCcw size={13} />, keywords: ['reset','clear','default'], action: () => setIsResetOpen(true) },
    { id: 'undo',  label: 'Undo', category: 'File', icon: <Undo2 size={13} />, shortcut: '⌘Z', action: undo },
    { id: 'redo',  label: 'Redo', category: 'File', icon: <Redo2 size={13} />, shortcut: '⌘Y', action: redo },
  ];

  const ctxBadgeSelected = ctxMenu.badgeId ? selectedIds.has(ctxMenu.badgeId) : false;
  const ctxBadgeVisible  = ctxMenu.badgeId ? config.ratings.includes(ctxMenu.badgeId) : false;

  // Shared canvas props
  const canvasProps = {
    config,
    setConfig,
    selectedIds,
    onSelect: handleSelection,
    onContextMenu: openCtxMenu,
    onClearSelection: clearSelection,
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

      {/* Global style overrides for builder */}
      <style>{`
        .builder-ui, .builder-ui * { user-select: none; -webkit-user-select: none; }
        .builder-ui input, .builder-ui textarea, .builder-ui [contenteditable] {
          user-select: text; -webkit-user-select: text;
        }
      `}</style>

      {/* Overlays & dialogs */}
      <ResetDialog isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} commands={paletteCommands} />
      <ContextMenu
        state={ctxMenu} onClose={closeCtxMenu}
        isSelected={ctxBadgeSelected} isVisible={ctxBadgeVisible}
        onBringToFront={id => moveLayer(id, 'front')}
        onBringForward={id => moveLayer(id, 'forward')}
        onSendBackward={id => moveLayer(id, 'back')}
        onSendToBack={id => moveLayer(id, 'toback')}
        onHide={hideBadge} onShowAll={showAllBadges}
        onSelect={id => handleSelection(id, false)}
        onDeselect={() => clearSelection()}
        onSelectAll={() => setBatchSelection(config.ratings)}
        onDeselectAll={clearSelection}
        onResetBadge={resetBadge} onDelete={deleteBadge}
      />

      {/* Root shell */}
      <div
        className="builder-ui flex flex-col overflow-hidden"
        style={{ height: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)', fontFamily: 'DM Sans, sans-serif' }}
      >
        <h1 className="sr-only">Posterium Poster Builder</h1>

        {/* Toolbar (hidden in fullscreen) */}
        {!isFullscreen && (
          <Toolbar
            config={config}
            baseUrl={baseUrl}
            onLoadConfig={handleLoadConfig}
            onExtensionChange={handleExtensionChange}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onReset={() => setIsResetOpen(true)}
            onTogglePalette={() => setPaletteOpen(v => !v)}
            onToggleShortcuts={() => setShortcutsOpen(v => !v)}
            leftVisible={leftVisible}
            rightVisible={rightVisible}
            paletteOpen={paletteOpen}
            shortcutsOpen={shortcutsOpen}
            onToggleLeft={toggleLeft}
            onToggleRight={toggleRight}
            onToggleFullscreen={toggleFullscreen}
          />
        )}

        {/* ── BODY ── */}
        <div className="flex flex-1 overflow-hidden relative">

          {/* Desktop: react-resizable-panels tri-panel layout */}
          {!isFullscreen ? (
            <Group
              orientation="horizontal"
              className="hidden lg:flex h-full w-full"
              style={{ overflow: 'hidden' }}
            >
              <Panel
                panelRef={leftPanelRef}
                defaultSize={20}
                minSize={15}
                maxSize={35}
                collapsible
                collapsedSize={0}
                style={{ background: 'var(--film-dark)', borderRight: '1px solid rgba(196,124,46,0.08)', overflow: 'hidden' }}
              >
                <LayerPanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  onSelect={handleSelection}
                />
              </Panel>

              <ResizeBar />

              <Panel defaultSize={60} minSize={30} style={{ overflow: 'hidden' }}>
                <CanvasArea {...canvasProps} isFullscreen={false} />
              </Panel>

              <ResizeBar />

              <Panel
                panelRef={rightPanelRef}
                defaultSize={20}
                minSize={15}
                maxSize={35}
                collapsible
                collapsedSize={0}
                style={{ background: 'var(--film-dark)', borderLeft: '1px solid rgba(196,124,46,0.08)', overflow: 'hidden' }}
              >
                <Inspector config={config} setConfig={setConfig} />
              </Panel>
            </Group>
          ) : (
            /* Fullscreen: canvas only on desktop */
            <div className="hidden lg:flex h-full w-full">
              <CanvasArea {...canvasProps} isFullscreen={true} />
            </div>
          )}

          {/* Mobile: full-screen canvas (drawer is the panel) */}
          <div className="lg:hidden flex flex-col h-full w-full relative">
            <CanvasArea {...canvasProps} isFullscreen={false} />
          </div>
        </div>

        {/* Mobile bottom dock */}
        <MobileDock />

        {/* Mobile bottom drawer (vaul) — replaces custom touch-math sheet */}
        <Drawer.Root
          open={mobileSheetMode !== 'hidden'}
          onOpenChange={open => { if (!open) setMobileSheetMode('hidden'); }}
          snapPoints={[0.55, 1]}
          activeSnapPoint={mobileSheetMode === 'full' ? 1 : 0.55}
          setActiveSnapPoint={sp => {
            if (!sp) setMobileSheetMode('hidden');
            else if (typeof sp === 'number' && sp < 0.8) setMobileSheetMode('half');
            else setMobileSheetMode('full');
          }}
          modal={false}
          noBodyStyles
        >
          <Drawer.Portal>
            <Drawer.Content
              className="lg:hidden fixed left-0 right-0 z-40 flex flex-col rounded-t-2xl shadow-2xl outline-none"
              style={{
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                background: 'var(--film-dark)',
                border: '1px solid rgba(196,124,46,0.12)',
                borderBottom: 'none',
                maxHeight: 'calc(100dvh - 56px - env(safe-area-inset-top, 0px))',
              }}
              aria-label="Mobile editor panel"
            >
              {/* Drag handle */}
              <div className="shrink-0 h-10 w-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none">
                <div className="w-9 h-1.5 rounded-full" style={{ background: 'rgba(196,124,46,0.3)' }} />
              </div>
              {/* Panel content */}
              <div
                className="flex-1 overflow-y-auto overscroll-contain min-h-0"
                style={{ touchAction: 'pan-y' }}
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
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Fullscreen floating controls */}
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
}
