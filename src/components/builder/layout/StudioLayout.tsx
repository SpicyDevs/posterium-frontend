// src/components/builder/layout/StudioLayout.tsx
import React, {
  useState, useEffect, useRef, useCallback, memo,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Drawer } from 'vaul';
import { Group, Panel, Separator, usePanelRef } from 'react-resizable-panels';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import {
  AlertTriangle, ZoomIn, ZoomOut, Maximize2, Minimize2,
  RotateCcw, Undo2, Redo2, PanelLeft, PanelRight,
  Grid3x3, ShieldCheck, Eye, EyeOff, Layers,
  CheckSquare, MousePointer2Off, Download,
  Image as ImageIcon, Contrast, ArrowUpToLine,
  ArrowDownToLine, ScanLine, Keyboard, Type,
} from 'lucide-react';
import type { PosterConfig, ExtensionType, RatingType } from '../types';
import { ALL_BADGES } from '../types';
import PreviewCanvas from '../components/PreviewCanvas';
import LayerPanel from '../components/LayerPanel';
import Inspector from '../components/layout/Inspector';
import MobileDock from '../components/layout/MobileDock';
import ContextMenu, { type ContextMenuState } from '../components/ContextMenu';
import CommandPalette, { type PaletteCommand } from '../components/CommandPalette';
import ShortcutsModal from '../components/ShortcutsModal';
import Toolbar from './Toolbar';
import { useEditor } from '../context/EditorContext';

interface Props {
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

// ── Reset dialog (Radix Dialog, no headlessui) ────────────────────────────────
const ResetDialog = memo<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
}>(({ isOpen, onClose, onConfirm }) => (
  <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
    <Dialog.Portal>
      <Dialog.Overlay
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'rdOverlayIn 0.15s ease',
        }}
      />
      <Dialog.Content
        aria-describedby="reset-desc"
        style={{
          position: 'fixed', top: '50%', left: '50%', zIndex: 9991,
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 360, padding: 24,
          background: 'var(--film-mid)',
          border: '1px solid rgba(196,124,46,0.15)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,124,46,0.05)',
          animation: 'rdContentIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'rgba(239,68,68,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={14} style={{ color: '#f87171' }} />
          </div>
          <Dialog.Title style={{
            margin: 0, fontSize: 13, fontWeight: 600,
            color: 'var(--film-cream)', fontFamily: 'Syne, sans-serif',
          }}>
            Reset Configuration
          </Dialog.Title>
        </div>
        <p id="reset-desc" style={{
          margin: '0 0 20px', fontSize: 12, lineHeight: '1.6',
          color: 'var(--film-silver)',
        }}>
          All settings will be restored to defaults. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Dialog.Close asChild>
            <button
              style={{
                flex: 1, height: 36, borderRadius: 8,
                fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
                textTransform: 'uppercase', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--film-silver)',
                fontFamily: 'Syne, sans-serif',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)';
                e.currentTarget.style.color = 'var(--film-pale)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--film-silver)';
              }}
            >
              Cancel
            </button>
          </Dialog.Close>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            style={{
              flex: 1, height: 36, borderRadius: 8,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
              textTransform: 'uppercase', cursor: 'pointer',
              background: 'rgba(220,38,38,0.9)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.9)'; }}
          >
            Reset All
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
));
ResetDialog.displayName = 'ResetDialog';

// ── Fullscreen floating controls ──────────────────────────────────────────────
const FullscreenOverlay = memo<{
  onExit: () => void; onZoomIn: () => void; onZoomOut: () => void; onResetView: () => void;
}>(({ onExit, onZoomIn, onZoomOut, onResetView }) => (
  <div
    style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 2,
      background: 'rgba(14,13,11,0.88)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(196,124,46,0.18)',
      borderRadius: 12, padding: 6,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}
  >
    {(
      [
        { icon: <ZoomIn size={15} />,    label: 'Zoom In',    fn: onZoomIn    },
        { icon: <ZoomOut size={15} />,   label: 'Zoom Out',   fn: onZoomOut   },
        { icon: <Maximize2 size={14} />, label: 'Reset View', fn: onResetView },
      ] as { icon: React.ReactNode; label: string; fn: () => void }[]
    ).map(({ icon, label, fn }) => (
      <button
        key={label}
        onClick={fn}
        title={label}
        style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(176,168,152,0.7)', cursor: 'pointer',
          background: 'transparent', border: 'none',
          transition: 'color 0.13s, background 0.13s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#D4A245';
          e.currentTarget.style.background = 'rgba(196,124,46,0.12)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'rgba(176,168,152,0.7)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {icon}
      </button>
    ))}
    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
    <button
      onClick={onExit}
      title="Exit Fullscreen (F or Esc)"
      style={{
        width: 32, height: 32, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(196,124,46,0.7)', cursor: 'pointer',
        background: 'transparent', border: 'none',
        transition: 'color 0.13s, background 0.13s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#D4A245';
        e.currentTarget.style.background = 'rgba(196,124,46,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'rgba(196,124,46,0.7)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <Minimize2 size={15} />
    </button>
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', top: -30, right: 0,
        display: 'flex', alignItems: 'center', gap: 8,
        pointerEvents: 'none',
      }}
    >
      {(['F', 'Esc'] as const).map(k => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <kbd style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3, padding: '1px 5px',
            fontSize: 8, fontFamily: 'JetBrains Mono, monospace',
            color: 'rgba(196,124,46,0.5)',
          }}>{k}</kbd>
          <span style={{ fontSize: 8, color: 'rgba(140,130,112,0.4)', fontFamily: 'Syne, sans-serif' }}>exit</span>
        </div>
      ))}
    </div>
  </div>
));
FullscreenOverlay.displayName = 'FullscreenOverlay';

// ── Panel separator (resize handle) ──────────────────────────────────────────
const ResizeHandle: React.FC = () => (
  <Separator
    style={{
      width: 4, flexShrink: 0,
      position: 'relative', cursor: 'col-resize', zIndex: 10,
    }}
  >
    <div
      className="resize-line"
      style={{
        position: 'absolute', top: 0, bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 1,
        background: 'rgba(196,124,46,0.08)',
        transition: 'background 0.15s, width 0.15s',
      }}
    />
  </Separator>
);

// ── Canvas region (shared between mobile and desktop renders) ─────────────────
const CanvasRegion = memo<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  onBgClick: () => void;
}>(({ config, setConfig, selectedIds, onSelect, onBgClick }) => (
  <main
    id="main-canvas"
    role="main"
    aria-label="Poster canvas"
    style={{
      position: 'relative', height: '100%', overflow: 'hidden',
      background: '#111113',
    }}
    onClick={e => { if (e.target === e.currentTarget) onBgClick(); }}
  >
    {/* Dot-grid recessed background */}
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
    <PreviewCanvas
      config={config}
      setConfig={setConfig}
      selectedIds={selectedIds}
      onSelect={onSelect}
    />
    {/* Film corner accents */}
    {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
      <div
        key={c}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top:    c.startsWith('t') ? 8  : 'auto',
          bottom: c.startsWith('b') ? 8  : 'auto',
          left:   c.endsWith('l')   ? 8  : 'auto',
          right:  c.endsWith('r')   ? 8  : 'auto',
          width: 12, height: 12, pointerEvents: 'none',
          borderTop:    c.startsWith('t') ? '1px solid rgba(196,124,46,0.2)' : 'none',
          borderBottom: c.startsWith('b') ? '1px solid rgba(196,124,46,0.2)' : 'none',
          borderLeft:   c.endsWith('l')   ? '1px solid rgba(196,124,46,0.2)' : 'none',
          borderRight:  c.endsWith('r')   ? '1px solid rgba(196,124,46,0.2)' : 'none',
        }}
      />
    ))}
  </main>
));
CanvasRegion.displayName = 'CanvasRegion';

// ── StudioLayout ──────────────────────────────────────────────────────────────
const StudioLayout: React.FC<Props> = ({
  config, setConfig, handleReset, baseUrl, handleLoadConfig,
  undo, redo, canUndo, canRedo,
}) => {
  const {
    activeTab, mobileSheetMode, setMobileSheetMode,
    selectedIds, handleSelection, clearSelection, setBatchSelection,
    viewOptions, toggleViewOption,
  } = useEditor();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [isResetOpen,   setIsResetOpen]   = useState(false);
  const [leftVisible,   setLeftVisible]   = useState(true);
  const [rightVisible,  setRightVisible]  = useState(true);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen,   setPaletteOpen]   = useState(false);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, badgeId: null });
  const [drawerSnap, setDrawerSnap] = useState<number | string>('400px');

  // SSR-safe mobile detection
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Panel refs (react-resizable-panels v4 API) ──────────────────────────────
  const leftPanelRef  = usePanelRef() as React.RefObject<PanelImperativeHandle | null>;
  const rightPanelRef = usePanelRef() as React.RefObject<PanelImperativeHandle | null>;

  // Stale-ref cache for keyboard handlers
  const selectedIdsRef   = useRef(selectedIds);
  const configRatingsRef = useRef(config.ratings);
  useEffect(() => { selectedIdsRef.current = selectedIds; });
  useEffect(() => { configRatingsRef.current = config.ratings; });

  // ── Panel toggle helpers ────────────────────────────────────────────────────
  const toggleLeft = useCallback(() => {
    const p = leftPanelRef.current;
    if (!p) return;
    if (p.isCollapsed()) { p.expand(); setLeftVisible(true); }
    else                 { p.collapse(); setLeftVisible(false); }
  }, [leftPanelRef]);

  const toggleRight = useCallback(() => {
    const p = rightPanelRef.current;
    if (!p) return;
    if (p.isCollapsed()) { p.expand(); setRightVisible(true); }
    else                 { p.collapse(); setRightVisible(false); }
  }, [rightPanelRef]);

  const toggleFullscreen = useCallback(() => setIsFullscreen(v => !v), []);

  // Collapse panels when entering fullscreen; restore when exiting
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

  // ── Canvas dispatch helpers ─────────────────────────────────────────────────
  const dispatchZoom      = useCallback((delta: number) =>
    window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: delta })), []);
  const dispatchResetView = useCallback(() =>
    window.dispatchEvent(new CustomEvent('reset-canvas-view')), []);

  // ── Context menu ────────────────────────────────────────────────────────────
  // openCtxMenu is exposed for future badge right-click wiring
  const closeCtxMenu = useCallback(() => setCtxMenu(s => ({ ...s, visible: false })), []);

  // ── Layer operations ────────────────────────────────────────────────────────
  const moveLayer = useCallback((id: RatingType, dir: 'front' | 'forward' | 'back' | 'toback') => {
    setConfig(prev => {
      const arr = [...prev.ratings];
      const idx = arr.indexOf(id);
      if (idx === -1) return prev;
      arr.splice(idx, 1);
      if      (dir === 'front')   arr.push(id);
      else if (dir === 'forward') arr.splice(Math.min(idx + 1, arr.length), 0, id);
      else if (dir === 'back')    arr.splice(Math.max(idx - 1, 0), 0, id);
      else                        arr.unshift(id);
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
    setConfig(prev => { const ni = { ...prev.items }; delete ni[id]; return { ...prev, items: ni }; });
  }, [setConfig]);

  const deleteBadge = useCallback((id: RatingType) => {
    setConfig(prev => ({ ...prev, ratings: prev.ratings.filter(r => r !== id) }));
    clearSelection();
  }, [setConfig, clearSelection]);

  const handleExtensionChange = useCallback((ext: ExtensionType) =>
    setConfig(prev => ({ ...prev, extension: ext })), [setConfig]);

  // ── Vaul drawer ↔ mobileSheetMode sync ─────────────────────────────────────
  useEffect(() => {
    setDrawerSnap(mobileSheetMode === 'full' ? 1 : '400px');
  }, [mobileSheetMode]);

  const handleDrawerOpenChange = useCallback((open: boolean) => {
    if (!open) setMobileSheetMode('hidden');
  }, [setMobileSheetMode]);

  const handleSnapChange = useCallback((snap: number | string | null) => {
    setDrawerSnap(snap ?? '400px');
    if      (snap === 1)     setMobileSheetMode('full');
    else if (snap !== null)  setMobileSheetMode('half');
    else                     setMobileSheetMode('hidden');
  }, [setMobileSheetMode]);

  // ── Global keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        if (shortcutsOpen) { setShortcutsOpen(false); return; }
        if (paletteOpen)   { setPaletteOpen(false);   return; }
        if (isFullscreen)  { setIsFullscreen(false);  return; }
        if (selectedIds.size > 0) { clearSelection(); return; }
        return;
      }
      if (mod && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault(); setPaletteOpen(v => !v); return;
      }
      if (mod && (e.key === '/' || e.key === '?')) {
        e.preventDefault(); setShortcutsOpen(v => !v); return;
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
        if (mod && e.shiftKey && e.key === ']') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'front')); return; }
        if (mod && e.shiftKey && e.key === '[') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'toback')); return; }
        if (mod && e.key === ']') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'forward')); return; }
        if (mod && e.key === '[') { e.preventDefault(); sel.forEach(id => moveLayer(id as RatingType, 'back')); return; }
        if (e.key.toLowerCase() === 'h' && !mod) { e.preventDefault(); sel.forEach(id => hideBadge(id as RatingType)); return; }
      }

      if (e.key.toLowerCase() === 'f' && !mod) { e.preventDefault(); setIsFullscreen(v => !v); return; }
      if (e.key.toLowerCase() === 'g' && !mod) { e.preventDefault(); toggleViewOption('showGrid'); return; }
      if (e.key === "'" && !mod) { e.preventDefault(); toggleViewOption('showSafeArea'); return; }
      if (mod && e.key === '1') { e.preventDefault(); dispatchResetView(); return; }
      if (mod && (e.key === '+' || e.key === '=')) { e.preventDefault(); dispatchZoom(0.25); return; }
      if (mod && e.key === '-') { e.preventDefault(); dispatchZoom(-0.25); return; }
      if (e.key === '[' && !mod && !e.shiftKey) { e.preventDefault(); toggleLeft(); return; }
      if (e.key === ']' && !mod && !e.shiftKey) { e.preventDefault(); toggleRight(); return; }

      if (e.key === 'Tab' && !mod) {
        const ratings = configRatingsRef.current;
        if (ratings.length === 0) return;
        e.preventDefault();
        const selArr = Array.from(selectedIdsRef.current);
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
    isFullscreen, paletteOpen, shortcutsOpen, selectedIds,
    toggleLeft, toggleRight,
  ]);

  // ── Command palette commands ────────────────────────────────────────────────
  const paletteCommands: PaletteCommand[] = [
    { id: 'zoom-fit',      label: 'Zoom to Fit',                                                 category: 'View & Canvas', icon: <Maximize2 size={13} />,      shortcut: '⌘1', keywords: ['reset','fit','view'],      action: dispatchResetView },
    { id: 'zoom-in',       label: 'Zoom In',                                                      category: 'View & Canvas', icon: <ZoomIn size={13} />,         shortcut: '⌘+',                                        action: () => dispatchZoom(0.25) },
    { id: 'zoom-out',      label: 'Zoom Out',                                                     category: 'View & Canvas', icon: <ZoomOut size={13} />,        shortcut: '⌘-',                                        action: () => dispatchZoom(-0.25) },
    { id: 'fullscreen',    label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Canvas',  category: 'View & Canvas', icon: isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />, shortcut: 'F', action: toggleFullscreen },
    { id: 'grid',          label: `${viewOptions.showGrid     ? 'Hide' : 'Show'} Grid Overlay`,  category: 'View & Canvas', icon: <Grid3x3 size={13} />,        shortcut: 'G',  keywords: ['grid','lines'],            action: () => toggleViewOption('showGrid') },
    { id: 'safe-area',     label: `${viewOptions.showSafeArea ? 'Hide' : 'Show'} Safe Area`,     category: 'View & Canvas', icon: <ShieldCheck size={13} />,    shortcut: "'",  keywords: ['safe','area','zone'],      action: () => toggleViewOption('showSafeArea') },
    { id: 'sidebar-left',  label: `${leftVisible  ? 'Hide' : 'Show'} Left Sidebar`,              category: 'View & Canvas', icon: <PanelLeft size={13} />,      shortcut: '[',  keywords: ['layers','source','panel'], action: toggleLeft },
    { id: 'sidebar-right', label: `${rightVisible ? 'Hide' : 'Show'} Right Sidebar`,             category: 'View & Canvas', icon: <PanelRight size={13} />,     shortcut: ']',  keywords: ['inspector','panel'],       action: toggleRight },
    { id: 'shortcuts-help',label: 'Show Keyboard Shortcuts',                                      category: 'View & Canvas', icon: <Keyboard size={13} />,       shortcut: '⌘/', keywords: ['help','keys','hotkeys'],   action: () => setShortcutsOpen(true) },
    { id: 'select-all',   label: 'Select All Badges',      category: 'Layers & Selection', icon: <CheckSquare size={13} />,      shortcut: '⌘A', action: () => setBatchSelection(config.ratings) },
    { id: 'deselect-all', label: 'Deselect All',           category: 'Layers & Selection', icon: <MousePointer2Off size={13} />, shortcut: '⌘D', action: clearSelection },
    { id: 'show-all',     label: 'Show All Badges',         category: 'Layers & Selection', icon: <Eye size={13} />,             keywords: ['reveal','unhide'],    action: showAllBadges },
    { id: 'hide-sel',     label: 'Hide Selected Badges',    category: 'Layers & Selection', icon: <EyeOff size={13} />,          shortcut: 'H',  keywords: ['hide','selected'],    action: () => Array.from(selectedIds).forEach(id => hideBadge(id as RatingType)) },
    { id: 'layer-front',  label: 'Bring to Front',          category: 'Layers & Selection', icon: <ArrowUpToLine size={13} />,   shortcut: '⌘⇧]', action: () => Array.from(selectedIds).forEach(id => moveLayer(id as RatingType, 'front')) },
    { id: 'layer-back',   label: 'Send to Back',            category: 'Layers & Selection', icon: <ArrowDownToLine size={13} />, shortcut: '⌘⇧[', action: () => Array.from(selectedIds).forEach(id => moveLayer(id as RatingType, 'toback')) },
    { id: 'delete-sel',   label: 'Delete Selected Badges',  category: 'Layers & Selection', icon: <Layers size={13} />,          shortcut: 'Del', keywords: ['remove','delete'],
      action: () => { const rm = new Set(selectedIds); setConfig(p => ({ ...p, ratings: p.ratings.filter(r => !rm.has(r)) })); clearSelection(); },
    },
    { id: 'add-imdb',         label: 'Add IMDb Badge',          category: 'Badges', icon: <Layers size={13} />, keywords: ['add','imdb'],      action: () => setConfig(p => p.ratings.includes('imdb')    ? p : { ...p, ratings: ['imdb',    ...p.ratings] }) },
    { id: 'add-rt',           label: 'Add Rotten Tomatoes',     category: 'Badges', icon: <Layers size={13} />, keywords: ['add','rt','rotten'],action: () => setConfig(p => p.ratings.includes('rt')      ? p : { ...p, ratings: ['rt',      ...p.ratings] }) },
    { id: 'add-meta',         label: 'Add Metacritic',          category: 'Badges', icon: <Layers size={13} />, keywords: ['add','meta'],       action: () => setConfig(p => p.ratings.includes('meta')    ? p : { ...p, ratings: ['meta',    ...p.ratings] }) },
    { id: 'add-tmdb',         label: 'Add TMDB Badge',          category: 'Badges', icon: <Layers size={13} />, keywords: ['add','tmdb'],       action: () => setConfig(p => p.ratings.includes('tmdb')    ? p : { ...p, ratings: ['tmdb',    ...p.ratings] }) },
    { id: 'add-age',          label: 'Add Age Rating Badge',    category: 'Badges', icon: <Layers size={13} />, keywords: ['add','age','pg'],   action: () => setConfig(p => p.ratings.includes('age')     ? p : { ...p, ratings: ['age',     ...p.ratings] }) },
    { id: 'add-runtime',      label: 'Add Runtime Badge',       category: 'Badges', icon: <Layers size={13} />, keywords: ['add','runtime'],    action: () => setConfig(p => p.ratings.includes('runtime') ? p : { ...p, ratings: ['runtime', ...p.ratings] }) },
    { id: 'clear-all-badges', label: 'Remove All Badges',       category: 'Badges', icon: <EyeOff size={13} />, keywords: ['clear','remove','all'], action: () => { setConfig(p => ({ ...p, ratings: [] })); clearSelection(); } },
    { id: 'toggle-icons',     label: `${config.icon     !== false ? 'Hide' : 'Show'} All Badge Icons`, category: 'Badges', icon: <Eye size={13} />,  keywords: ['icons'],  action: () => setConfig(p => ({ ...p, icon:     !(p.icon     !== false) })) },
    { id: 'toggle-text',      label: `${config.showText !== false ? 'Hide' : 'Show'} Rating Text`,     category: 'Badges', icon: <Type size={13} />, keywords: ['text'],   action: () => setConfig(p => ({ ...p, showText: !(p.showText !== false) })) },
    { id: 'grayscale',     label: `${config.grayscale ? 'Remove' : 'Apply'} Grayscale`,       category: 'Canvas Properties', icon: <Contrast size={13} />,   keywords: ['grayscale','bw'],   action: () => setConfig(p => ({ ...p, grayscale: !p.grayscale })) },
    { id: 'blur-0',        label: 'Remove Poster Blur',          category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','clear'],    action: () => setConfig(p => ({ ...p, posterBlur: 0  })) },
    { id: 'blur-4',        label: 'Poster Blur: Light (4px)',    category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','light'],    action: () => setConfig(p => ({ ...p, posterBlur: 4  })) },
    { id: 'blur-8',        label: 'Poster Blur: Medium (8px)',   category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','medium'],   action: () => setConfig(p => ({ ...p, posterBlur: 8  })) },
    { id: 'blur-16',       label: 'Poster Blur: Heavy (16px)',   category: 'Canvas Properties', icon: <ScanLine size={13} />,   keywords: ['blur','heavy'],    action: () => setConfig(p => ({ ...p, posterBlur: 16 })) },
    { id: 'textless-on',   label: 'Enable Textless Poster',      category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['textless'],        action: () => setConfig(p => ({ ...p, textless: true  })) },
    { id: 'textless-off',  label: 'Disable Textless Poster',     category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['textless','text'], action: () => setConfig(p => ({ ...p, textless: false })) },
    { id: 'source-tmdb',   label: 'Switch Poster Source: TMDB',  category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['source','tmdb'],   action: () => setConfig(p => ({ ...p, source: 'tmdb'   })) },
    { id: 'source-fanart', label: 'Switch Poster Source: Fanart',category: 'Canvas Properties', icon: <ImageIcon size={13} />,  keywords: ['source','fanart'], action: () => setConfig(p => ({ ...p, source: 'fanart' })) },
    { id: 'radius-0',      label: 'Remove Badge Corner Radius',  category: 'Canvas Properties', icon: <Grid3x3 size={13} />,    keywords: ['radius','square'], action: () => setConfig(p => ({ ...p, radius: 0  })) },
    { id: 'radius-12',     label: 'Set Badge Radius: Rounded',   category: 'Canvas Properties', icon: <Grid3x3 size={13} />,    keywords: ['radius','round'],  action: () => setConfig(p => ({ ...p, radius: 12 })) },
    { id: 'radius-max',    label: 'Set Badge Radius: Pill',      category: 'Canvas Properties', icon: <Grid3x3 size={13} />,    keywords: ['radius','pill'],   action: () => setConfig(p => ({ ...p, radius: 30 })) },
    { id: 'export-svg',    label: 'Export as SVG',   category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'svg'  })) },
    { id: 'export-png',    label: 'Export as PNG',   category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'png'  })) },
    { id: 'export-jpg',    label: 'Export as JPG',   category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'jpg'  })) },
    { id: 'export-webp',   label: 'Export as WebP',  category: 'Export', icon: <Download size={13} />, action: () => setConfig(p => ({ ...p, extension: 'webp' })) },
    { id: 'reset',         label: 'Reset All Settings', category: 'File', icon: <RotateCcw size={13} />, keywords: ['reset','clear','default'], action: () => setIsResetOpen(true) },
    { id: 'undo',          label: 'Undo',               category: 'File', icon: <Undo2 size={13} />,    shortcut: '⌘Z', action: undo },
    { id: 'redo',          label: 'Redo',               category: 'File', icon: <Redo2 size={13} />,    shortcut: '⌘Y', action: redo },
  ];

  const ctxBadgeSelected = ctxMenu.badgeId ? selectedIds.has(ctxMenu.badgeId)         : false;
  const ctxBadgeVisible  = ctxMenu.badgeId ? config.ratings.includes(ctxMenu.badgeId) : false;

  const canvasProps = {
    config, setConfig, selectedIds,
    onSelect: handleSelection,
    onBgClick: clearSelection,
  } as const;

  return (
    <>
      {/* Global styles */}
      <style>{`
        @keyframes rdOverlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rdContentIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .builder-ui, .builder-ui * { user-select: none; -webkit-user-select: none; }
        .builder-ui input,
        .builder-ui textarea,
        .builder-ui [contenteditable] { user-select: text; -webkit-user-select: text; }
        /* Panel separator hover glow */
        [data-separator] .resize-line        { background: rgba(196,124,46,0.08); }
        [data-separator]:hover .resize-line  { background: rgba(196,124,46,0.4); width: 2px; }
        [data-separator]:active .resize-line { background: rgba(196,124,46,0.6); width: 2px; }
        /* Vaul drawer */
        [data-vaul-drawer] { touch-action: none; }
        [data-vaul-overlay] { background: rgba(7,7,6,0.45) !important; }
      `}</style>

      {/* Skip-to-content link */}
      <a
        href="#main-canvas"
        style={{
          position: 'absolute', left: '-9999px', top: '-9999px', zIndex: 200,
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: 'var(--film-amber)', color: '#070706',
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to canvas
      </a>

      {/* Root shell */}
      <div
        className="builder-ui"
        style={{
          height: '100dvh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <h1 className="sr-only">Posterium Poster Builder</h1>

        {/* ── Overlays ── */}
        <ResetDialog
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          onConfirm={handleReset}
        />
        <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <ContextMenu
          state={ctxMenu}           onClose={closeCtxMenu}
          isSelected={ctxBadgeSelected} isVisible={ctxBadgeVisible}
          onBringToFront={id => moveLayer(id, 'front')}
          onBringForward={id => moveLayer(id, 'forward')}
          onSendBackward={id => moveLayer(id, 'back')}
          onSendToBack={id => moveLayer(id, 'toback')}
          onHide={hideBadge}        onShowAll={showAllBadges}
          onSelect={id => handleSelection(id, false)}
          onDeselect={() => clearSelection()}
          onSelectAll={() => setBatchSelection(config.ratings)}
          onDeselectAll={clearSelection}
          onResetBadge={resetBadge} onDelete={deleteBadge}
        />
        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          commands={paletteCommands}
        />

        {/* ── Toolbar ── */}
        {!isFullscreen && (
          <Toolbar
            config={config}
            baseUrl={baseUrl}
            handleLoadConfig={handleLoadConfig}
            onExtensionChange={handleExtensionChange}
            undo={undo}           redo={redo}
            canUndo={canUndo}     canRedo={canRedo}
            onReset={() => setIsResetOpen(true)}
            onPalette={() => setPaletteOpen(v => !v)}     isPaletteOpen={paletteOpen}
            onShortcuts={() => setShortcutsOpen(v => !v)} isShortcutsOpen={shortcutsOpen}
            onToggleLeft={toggleLeft}   leftVisible={leftVisible}
            onToggleRight={toggleRight} rightVisible={rightVisible}
            onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen}
          />
        )}

        {/* ── Body ── */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {isMobile ? (
            /* ── MOBILE: canvas fills the space ─────────────────────────── */
            <div style={{ height: '100%' }}>
              <CanvasRegion {...canvasProps} />
            </div>
          ) : (
            /* ── DESKTOP: tri-panel (react-resizable-panels v4) ─────────── */
            <Group orientation="horizontal" style={{ height: '100%' }}>
              {/* Left: Layers */}
              <Panel
                panelRef={leftPanelRef}
                defaultSize={20}
                minSize={14}
                maxSize={35}
                collapsible
                collapsedSize={0}
                onResize={size => setLeftVisible(size.asPercentage > 1)}
                style={{ background: 'var(--film-dark)', overflow: 'hidden' }}
              >
                <LayerPanel
                  config={config}
                  setConfig={setConfig}
                  selectedIds={selectedIds}
                  onSelect={handleSelection}
                />
              </Panel>

              <ResizeHandle />

              {/* Center: Canvas */}
              <Panel minSize={30} style={{ overflow: 'hidden' }}>
                <CanvasRegion {...canvasProps} />
              </Panel>

              <ResizeHandle />

              {/* Right: Inspector */}
              <Panel
                panelRef={rightPanelRef}
                defaultSize={24}
                minSize={18}
                maxSize={40}
                collapsible
                collapsedSize={0}
                onResize={size => setRightVisible(size.asPercentage > 1)}
                style={{ background: 'var(--film-dark)', overflow: 'hidden' }}
              >
                <Inspector config={config} setConfig={setConfig} />
              </Panel>
            </Group>
          )}
        </div>

        {/* ── Mobile dock ── */}
        <MobileDock />

        {/* ── Mobile Vaul drawer ── */}
        <Drawer.Root
          open={mobileSheetMode !== 'hidden'}
          onOpenChange={handleDrawerOpenChange}
          snapPoints={['400px', 1]}
          activeSnapPoint={drawerSnap}
          setActiveSnapPoint={handleSnapChange}
          modal={false}
        >
          <Drawer.Portal>
            <Drawer.Overlay
              style={{
                position: 'fixed', inset: 0, zIndex: 39,
                background: 'rgba(7,7,6,0.4)',
              }}
            />
            <Drawer.Content
              aria-label="Mobile editor panel"
              style={{
                position: 'fixed',
                bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                left: 0, right: 0, zIndex: 40,
                background: 'var(--film-dark)',
                borderTop: '1px solid rgba(196,124,46,0.14)',
                borderLeft: '1px solid rgba(196,124,46,0.07)',
                borderRight: '1px solid rgba(196,124,46,0.07)',
                borderRadius: '18px 18px 0 0',
                boxShadow: '0 -12px 48px rgba(0,0,0,0.55)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                maxHeight: 'calc(100dvh - 56px - 56px)',
                willChange: 'transform',
              }}
            >
              {/* Drag handle indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px', flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(196,124,46,0.3)' }} />
              </div>

              {/* Scrollable content */}
              <div
                style={{
                  flex: 1, minHeight: 0,
                  overflowY: 'auto', overscrollBehavior: 'contain',
                  touchAction: 'pan-y',
                  WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
                }}
              >
                {(activeTab === 'source' || activeTab === 'layers') && (
                  <LayerPanel
                    config={config}
                    setConfig={setConfig}
                    selectedIds={selectedIds}
                    onSelect={handleSelection}
                  />
                )}
                {(activeTab === 'canvas' || activeTab === 'badge') && (
                  <Inspector config={config} setConfig={setConfig} />
                )}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* ── Fullscreen floating controls ── */}
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

export default StudioLayout;
