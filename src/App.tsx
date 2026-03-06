// src/App.tsx
import React, { useState, useEffect, useRef, Fragment, useCallback, memo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Sparkles, RotateCcw, AlertTriangle, Undo2, Redo2 } from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';

const STORAGE_KEY = 'freeposterapi_config_v2';

const ResetDialog: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = memo(({
  isOpen,
  onClose,
  onConfirm,
}) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose} aria-labelledby="reset-dialog-title">
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
      </TransitionChild>

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#18181b] border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle
                as="h3"
                id="reset-dialog-title"
                className="text-lg font-medium leading-6 text-white flex items-center gap-2"
              >
                <AlertTriangle className="text-red-500" size={20} aria-hidden="true" />
                Reset Configuration
              </DialogTitle>
              <div className="mt-2">
                <p className="text-sm text-zinc-400">
                  Are you sure you want to reset all settings to default? This action cannot be
                  undone.
                </p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex justify-center rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Yes, Reset Everything
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </Transition>
));
ResetDialog.displayName = 'ResetDialog';

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
}> = ({ config, setConfig, handleReset, baseUrl, handleLoadConfig, undo, redo, canUndo, canRedo }) => {
  const {
    activeTab,
    mobileSheetMode,
    setMobileSheetMode,
    selectedIds,
    handleSelection,
    clearSelection,
    setBatchSelection,
  } = useEditor();

  const [isResetOpen, setIsResetOpen] = useState(false);

  const selectedIdsRef = useRef<Set<typeof selectedIds extends Set<infer T> ? T : never>>(selectedIds);
  const configRatingsRef = useRef(config.ratings);

  useEffect(() => { selectedIdsRef.current = selectedIds; });
  useEffect(() => { configRatingsRef.current = config.ratings; });

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setBatchSelection(configRatingsRef.current);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdsRef.current.size > 0) {
        e.preventDefault();
        const toRemove = new Set(selectedIdsRef.current);
        setConfig((prev) => ({
          ...prev,
          ratings: prev.ratings.filter((r) => !toRemove.has(r)),
        }));
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setConfig, clearSelection, setBatchSelection]);

  // --- SIDEBAR RESIZE LOGIC ---
  const [leftWidth, setLeftWidth] = useState(288);
  const [rightWidth, setRightWidth] = useState(320);

  const startResizingLeft = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = leftWidth;
      const onMouseMove = (moveEvent: MouseEvent) => {
        setLeftWidth(Math.max(220, Math.min(startWidth + (moveEvent.clientX - startX), 600)));
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
    },
    [leftWidth],
  );

  const startResizingRight = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = rightWidth;
      const onMouseMove = (moveEvent: MouseEvent) => {
        setRightWidth(Math.max(260, Math.min(startWidth - (moveEvent.clientX - startX), 600)));
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'col-resize';
    },
    [rightWidth],
  );

  // --- Mobile bottom-sheet physics drag ---
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || !isDragging.current || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - startY.current;
    currentY.current = deltaY;
    if (mobileSheetMode === 'full' && deltaY < 0) {
      sheetRef.current.style.transform = `translateY(${deltaY * 0.2}px)`;
      return;
    }
    sheetRef.current.style.transform = `translateY(${deltaY}px)`;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    startY.current = null;
    sheetRef.current.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    sheetRef.current.style.transform = '';
    const threshold = 80;
    const delta = currentY.current;
    if (delta > threshold) {
      if (mobileSheetMode === 'full') setMobileSheetMode('half');
      else if (mobileSheetMode === 'half') setMobileSheetMode('hidden');
    } else if (delta < -threshold) {
      if (mobileSheetMode === 'hidden') setMobileSheetMode('half');
      else if (mobileSheetMode === 'half') setMobileSheetMode('full');
    }
    currentY.current = 0;
  };

  useEffect(() => {
    if (sheetRef.current && !isDragging.current) sheetRef.current.style.transform = '';
  }, [mobileSheetMode]);

  return (
    <>
      {/* Skip to main content — screen reader / keyboard accessibility */}
      <a
        href="#main-canvas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-medium"
      >
        Skip to canvas
      </a>

      <div className="flex flex-col h-[100dvh] bg-[#09090b] text-zinc-200 overflow-hidden font-sans selection:bg-indigo-500/30">
        <ResetDialog
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          onConfirm={handleReset}
        />

        {/* Header */}
        <header
          role="banner"
          className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-[#09090b] z-30"
        >
          {/* Brand */}
          <div className="flex items-center gap-3 w-64">
            <div
              className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20"
              aria-hidden="true"
            >
              <Sparkles size={16} className="text-white" />
            </div>
            <h1 className="font-bold tracking-tight text-white text-sm hidden sm:block">
              FreePosterAPI
            </h1>
          </div>

          {/* URL bar */}
          <div className="flex-1 mx-4 flex justify-center" role="search" aria-label="Poster URL">
            <div className="w-3/4">
              <CodeBox config={config} onLoadConfig={handleLoadConfig} baseUrl={baseUrl} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 items-center justify-end w-auto sm:w-64" role="toolbar" aria-label="Editor actions">
            {/* Undo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo (Ctrl+Z)"
              aria-disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`
                relative p-2 rounded-md transition-all duration-150 group
                ${canUndo
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
                  : 'text-zinc-700 cursor-not-allowed'
                }
              `}
            >
              <Undo2 size={16} />
              {/* Tooltip badge */}
              {canUndo && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Ctrl+Z
                </span>
              )}
            </button>

            {/* Redo */}
            <button
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo (Ctrl+Y)"
              aria-disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`
                relative p-2 rounded-md transition-all duration-150 group
                ${canRedo
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 active:scale-95'
                  : 'text-zinc-700 cursor-not-allowed'
                }
              `}
            >
              <Redo2 size={16} />
              {canRedo && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Ctrl+Y
                </span>
              )}
            </button>

            <div className="w-px h-5 bg-white/10 mx-1" role="separator" aria-hidden="true" />

            {/* Reset */}
            <button
              onClick={() => setIsResetOpen(true)}
              aria-label="Reset configuration to defaults"
              title="Reset to defaults"
              className="relative p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/5 rounded-md transition-all duration-150 active:scale-95 group"
            >
              <RotateCcw size={16} />
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Reset
              </span>
            </button>

            <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" role="separator" aria-hidden="true" />

            <a
              href="https://github.com/xdaayush/freeposterapi"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="View FreePosterAPI source code on GitHub (opens in new tab)"
              className="text-zinc-500 hover:text-white transition-colors p-2 hidden sm:block rounded-md hover:bg-white/5"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </header>

        {/* Main Grid */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
          <aside
            aria-label="Layer panel"
            className="hidden lg:flex flex-col bg-[#0c0c0e] border-r border-white/5 z-20 relative flex-shrink-0 transition-[width] duration-0"
            style={{ width: leftWidth }}
          >
            <LayerPanel
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              onSelect={handleSelection}
            />
            <div
              onMouseDown={startResizingLeft}
              role="separator"
              aria-label="Resize layer panel"
              aria-orientation="vertical"
              tabIndex={0}
              className="absolute top-0 right-[-3px] bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 z-50 transition-colors focus-visible:bg-indigo-500/50 outline-none"
            />
          </aside>

          <main
            id="main-canvas"
            role="main"
            aria-label="Poster preview canvas"
            className="flex-1 relative bg-[#18181b] flex flex-col overflow-hidden transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)"
            onClick={(e) => {
              if (e.target === e.currentTarget) clearSelection();
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.03]"
              aria-hidden="true"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <PreviewCanvas
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              onSelect={handleSelection}
            />
          </main>

          {/* Right Sidebar */}
          <aside
            aria-label="Inspector panel"
            className="hidden lg:flex flex-col bg-[#0c0c0e] border-l border-white/5 z-20 relative flex-shrink-0 transition-[width] duration-0"
            style={{ width: rightWidth }}
          >
            <div
              onMouseDown={startResizingRight}
              role="separator"
              aria-label="Resize inspector panel"
              aria-orientation="vertical"
              tabIndex={0}
              className="absolute top-0 left-[-3px] bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 z-50 transition-colors focus-visible:bg-indigo-500/50 outline-none"
            />
            <Inspector config={config} setConfig={setConfig} />
          </aside>

          {/* Mobile Bottom Sheet */}
          <div
            ref={sheetRef}
            role="complementary"
            aria-label="Mobile editor panel"
            aria-hidden={mobileSheetMode === 'hidden'}
            className={`
              lg:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))]
              bg-[#0c0c0e] border-t border-white/10 rounded-t-2xl shadow-2xl z-40
              ${mobileSheetMode === 'hidden' ? 'translate-y-[120%]' : 'translate-y-0'}
            `}
            style={{
              height: mobileSheetMode === 'full' ? '92%' : '50%',
              pointerEvents: mobileSheetMode === 'hidden' ? 'none' : 'auto',
              transition:
                'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drag handle */}
            <div
              className="h-8 w-full flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-white/5 touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              role="slider"
              aria-label="Drag to resize panel"
              aria-valuemin={0}
              aria-valuemax={2}
              aria-valuenow={mobileSheetMode === 'hidden' ? 0 : mobileSheetMode === 'half' ? 1 : 2}
              aria-valuetext={mobileSheetMode}
              tabIndex={0}
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full" aria-hidden="true" />
            </div>

            <div
              className="h-[calc(100%-32px)] overflow-hidden relative"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
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
          </div>
        </div>

        <MobileDock />
      </div>
    </>
  );
};

const App: React.FC = () => {
  const { state: config, setState: setConfig, undo, redo, canUndo, canRedo } = usePosterHistory(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as PosterConfig) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const handleLoadConfig = useCallback((url: string) => {
    const newConfig = parseUrlToConfig(url);
    setConfig(newConfig);
    try {
      const urlObj = new URL(url);
      setBaseUrl(urlObj.origin);
    } catch {
      // Malformed URL — keep current baseUrl.
    }
  }, [setConfig]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('reset-canvas-view'));
  }, [setConfig]);

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

export default App;