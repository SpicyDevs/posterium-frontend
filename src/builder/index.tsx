// src/BuilderApp.tsx
import React, {
  useState, useEffect, useRef, Fragment, useCallback, memo,
} from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Sparkles, RotateCcw, AlertTriangle, Undo2, Redo2, Home } from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';
import { Link } from '../Router';

const STORAGE_KEY = 'posterium_config_v2';

// ---------------------------------------------------------------------------
// Reset dialog
// ---------------------------------------------------------------------------
const ResetDialog = memo<{
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
}>(({ isOpen, onClose, onConfirm }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
        leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
      </TransitionChild>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100" leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
        >
          <DialogPanel className="w-full max-w-sm rounded-2xl bg-[#18181b] border border-white/10 p-6 shadow-2xl">
            <DialogTitle as="h3" className="text-sm font-semibold text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={14} className="text-red-400" />
              </span>
              Reset Configuration
            </DialogTitle>
            <p className="mt-3 text-xs text-zinc-400 leading-5">
              All settings will be restored to defaults. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={onClose}
                className="flex-1 h-9 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={() => { onConfirm(); onClose(); }}
                className="flex-1 h-9 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-500 transition-colors">
                Reset Everything
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </Transition>
));
ResetDialog.displayName = 'ResetDialog';

// ---------------------------------------------------------------------------
// Toolbar icon button
// ---------------------------------------------------------------------------
interface ToolbarBtnProps {
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
  href?: string;
  children: React.ReactNode;
}

const ToolbarBtn = memo<ToolbarBtnProps>(({ onClick, disabled, label, danger, href, children }) => {
  const base = 'relative group w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
  const active = danger
    ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95'
    : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/8 active:scale-95';
  const inactive = 'text-zinc-700 cursor-not-allowed pointer-events-none';

  const cls = `${base} ${disabled ? inactive : active}`;

  const tooltip = !disabled && (
    <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-200 border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 pointer-events-none z-50 shadow-lg">
      {label}
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={cls} aria-label={label}>
        {children}{tooltip}
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={!!disabled} className={cls} aria-label={label} aria-disabled={disabled}>
      {children}{tooltip}
    </button>
  );
});
ToolbarBtn.displayName = 'ToolbarBtn';

// ---------------------------------------------------------------------------
// Studio layout
// ---------------------------------------------------------------------------
const StudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
  undo: () => void; redo: () => void;
  canUndo: boolean; canRedo: boolean;
}> = ({ config, setConfig, handleReset, baseUrl, handleLoadConfig, undo, redo, canUndo, canRedo }) => {
  const {
    activeTab, mobileSheetMode, setMobileSheetMode,
    selectedIds, handleSelection, clearSelection, setBatchSelection,
  } = useEditor();

  const [isResetOpen, setIsResetOpen] = useState(false);

  const selectedIdsRef   = useRef(selectedIds);
  const configRatingsRef = useRef(config.ratings);
  useEffect(() => { selectedIdsRef.current   = selectedIds;    });
  useEffect(() => { configRatingsRef.current = config.ratings; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); setBatchSelection(configRatingsRef.current); return; }
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const rm = new Set(selectedIdsRef.current);
        setConfig(p => ({ ...p, ratings: p.ratings.filter(r => !rm.has(r)) }));
        clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, setConfig, clearSelection, setBatchSelection]);

  const [leftW,  setLeftW]  = useState(272);
  const [rightW, setRightW] = useState(308);

  const startResizeLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const sx = e.clientX, sw = leftW;
    const move = (m: MouseEvent) => setLeftW(Math.max(220, Math.min(sw + m.clientX - sx, 540)));
    const up   = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
  }, [leftW]);

  const startResizeRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const sx = e.clientX, sw = rightW;
    const move = (m: MouseEvent) => setRightW(Math.max(248, Math.min(sw - (m.clientX - sx), 540)));
    const up   = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); document.body.style.cursor = ''; };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
    document.body.style.cursor = 'col-resize';
  }, [rightW]);

  const sheetRef          = useRef<HTMLDivElement>(null);
  const dragStartY        = useRef<number | null>(null);
  const dragDelta         = useRef(0);
  const isSheetDragging   = useRef(false);
  const modeRef           = useRef(mobileSheetMode);
  useEffect(() => { modeRef.current = mobileSheetMode; });

  const SNAPS   = { hidden: '100%', half: '0%', full: '0%' } as const;
  const HEIGHTS = {
    hidden: 'min(58dvh, 460px)',
    half:   'min(58dvh, 460px)',
    full:   'calc(100dvh - 56px - 56px - env(safe-area-inset-bottom, 0px))',
  } as const;

  const snapTo = useCallback((mode: typeof mobileSheetMode, animate = true) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animate
      ? 'transform 0.38s cubic-bezier(0.16,1,0.3,1), height 0.38s cubic-bezier(0.16,1,0.3,1)'
      : 'none';
    el.style.transform = `translateY(${SNAPS[mode]})`;
    el.style.height    = HEIGHTS[mode];
  }, []);

  useEffect(() => {
    if (!isSheetDragging.current) snapTo(mobileSheetMode);
  }, [mobileSheetMode, snapTo]);

  const onHandleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current  = e.touches[0].clientY;
    dragDelta.current   = 0;
    isSheetDragging.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const onHandleTouchMove = (e: React.TouchEvent) => {
    if (!isSheetDragging.current || dragStartY.current === null) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    dragDelta.current = delta;
    const el = sheetRef.current;
    if (!el) return;
    const resistance = modeRef.current === 'full' && delta < 0 ? 0.1 : 1;
    el.style.transform = `translateY(${Math.max(delta * resistance, -30)}px)`;
  };

  const onHandleTouchEnd = () => {
    if (!isSheetDragging.current) return;
    isSheetDragging.current = false;
    const delta = dragDelta.current;
    dragDelta.current = 0;
    dragStartY.current = null;

    const cur = modeRef.current;
    const THRESHOLD = 64;
    let next = cur;
    if (delta >  THRESHOLD) next = cur === 'full' ? 'half' : 'hidden';
    if (delta < -THRESHOLD) next = cur === 'hidden' ? 'half' : 'full';

    snapTo(next);
    if (next !== cur) setMobileSheetMode(next);
  };

  return (
    <>
      <a href="#main-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-medium">
        Skip to canvas
      </a>

      <div className="flex flex-col h-[100dvh] overflow-hidden font-sans bg-[#09090b] text-zinc-200 selection:bg-indigo-500/30">
        <ResetDialog isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />

        {/* HEADER */}
        <header className="h-14 flex-shrink-0 flex items-center gap-2 px-3 border-b border-white/[0.06] bg-[#09090b] z-30">
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Home link */}
            <Link to="/"
              className="relative group w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-white/8 transition-all duration-150 select-none"
              aria-label="Back to home">
              <Home size={14} />
              <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-200 border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 pointer-events-none z-50 shadow-lg">
                Home
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles size={13} className="text-white" />
              </div>
              <span className="text-[13px] font-semibold text-white tracking-tight select-none">
                Posterium
              </span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-5 bg-white/[0.08] mx-1 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <CodeBox config={config} onLoadConfig={handleLoadConfig} baseUrl={baseUrl} />
          </div>

          <div className="w-px h-5 bg-white/[0.08] mx-1 flex-shrink-0" />

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <ToolbarBtn onClick={undo} disabled={!canUndo} label="Undo (Ctrl+Z)">
              <Undo2 size={15} />
            </ToolbarBtn>
            <ToolbarBtn onClick={redo} disabled={!canRedo} label="Redo (Ctrl+Y)">
              <Redo2 size={15} />
            </ToolbarBtn>

            <div className="w-px h-5 bg-white/[0.08] mx-1" />

            <ToolbarBtn onClick={() => setIsResetOpen(true)} danger label="Reset to defaults">
              <RotateCcw size={14} />
            </ToolbarBtn>

            <ToolbarBtn href="https://github.com/xdaayush/freeposterapi" label="GitHub">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </ToolbarBtn>
          </div>
        </header>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">
          <aside
            aria-label="Layer panel"
            className="hidden lg:flex flex-col bg-[#0d0d0f] border-r border-white/[0.06] z-20 relative flex-shrink-0"
            style={{ width: leftW }}
          >
            <LayerPanel
              config={config} setConfig={setConfig}
              selectedIds={selectedIds} onSelect={handleSelection}
            />
            <div onMouseDown={startResizeLeft}
              className="absolute inset-y-0 right-0 w-[3px] cursor-col-resize group z-50" title="Resize panel">
              <div className="absolute inset-y-0 right-0 w-[1px] bg-transparent group-hover:bg-indigo-500/50 transition-colors" />
            </div>
          </aside>

          <main id="main-canvas" role="main" aria-label="Poster canvas"
            className="flex-1 relative bg-[#111113] overflow-hidden"
            onClick={e => { if (e.target === e.currentTarget) clearSelection(); }}>
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-100"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }} />
            <PreviewCanvas
              config={config} setConfig={setConfig}
              selectedIds={selectedIds} onSelect={handleSelection}
            />
          </main>

          <aside aria-label="Inspector"
            className="hidden lg:flex flex-col bg-[#0d0d0f] border-l border-white/[0.06] z-20 relative flex-shrink-0"
            style={{ width: rightW }}>
            <div onMouseDown={startResizeRight}
              className="absolute inset-y-0 left-0 w-[3px] cursor-col-resize group z-50" title="Resize panel">
              <div className="absolute inset-y-0 left-0 w-[1px] bg-transparent group-hover:bg-indigo-500/50 transition-colors" />
            </div>
            <Inspector config={config} setConfig={setConfig} />
          </aside>
        </div>

        <MobileDock />

        <div ref={sheetRef} role="complementary" aria-label="Mobile editor panel"
          aria-hidden={mobileSheetMode === 'hidden'}
          className="lg:hidden fixed inset-x-0 bg-[#0d0d0f] rounded-t-2xl border-t border-white/[0.08] shadow-2xl z-40 flex flex-col"
          style={{
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            height: HEIGHTS[mobileSheetMode],
            transform: `translateY(${SNAPS[mobileSheetMode]})`,
            pointerEvents: mobileSheetMode === 'hidden' ? 'none' : 'auto',
            willChange: 'transform, height',
          }}>
          <div onTouchStart={onHandleTouchStart} onTouchMove={onHandleTouchMove} onTouchEnd={onHandleTouchEnd}
            className="flex-shrink-0 h-10 w-full flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
            role="button" aria-label="Drag to resize">
            <div className="w-9 h-[3px] bg-zinc-700 rounded-full" />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0"
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'] }}
            onTouchStart={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}>
            {(activeTab === 'source' || activeTab === 'layers') && (
              <LayerPanel config={config} setConfig={setConfig}
                selectedIds={selectedIds} onSelect={handleSelection} />
            )}
            {(activeTab === 'canvas' || activeTab === 'badge') && (
              <Inspector config={config} setConfig={setConfig} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
const BuilderApp: React.FC = () => {
  const { state: config, setState: setConfig, undo, redo, canUndo, canRedo } =
    usePosterHistory(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? (JSON.parse(saved) as PosterConfig) : DEFAULT_CONFIG;
      } catch { return DEFAULT_CONFIG; }
    });

  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const handleLoadConfig = useCallback((url: string) => {
    setConfig(parseUrlToConfig(url));
    try { setBaseUrl(new URL(url).origin); } catch { /* keep */ }
  }, [setConfig]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
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