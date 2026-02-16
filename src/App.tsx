// src/App.tsx
import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Sparkles, Github, RotateCcw, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'freeposterapi_config_v2';

// --- NEW: Reset Dialog Component ---
const ResetDialog: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => (
  <Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={onClose}>
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
              <DialogTitle as="h3" className="text-lg font-medium leading-6 text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} /> Reset Configuration
              </DialogTitle>
              <div className="mt-2">
                <p className="text-sm text-zinc-400">
                  Are you sure you want to reset all settings to default? This action cannot be undone.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="inline-flex justify-center rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onConfirm(); onClose(); }}
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
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
);

const StudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
}> = ({ config, setConfig, handleReset, baseUrl, handleLoadConfig }) => {
  const { activeTab, mobileSheetMode, setMobileSheetMode, selectedIds, handleSelection, clearSelection } = useEditor();
  const [isResetOpen, setIsResetOpen] = useState(false); // State for Dialog

  // -- DRAG LOGIC (Retained for Physics) --
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

  const getCanvasPadding = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return 0;
      switch (mobileSheetMode) {
          case 'full': return '90%'; 
          case 'half': return '50%';
          default: return '4rem'; 
      }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#09090b] text-zinc-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      <ResetDialog isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} onConfirm={handleReset} />
      
      {/* Header */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-[#09090b] z-30">
        <div className="flex items-center gap-3 w-64">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
             <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="font-bold tracking-tight text-white text-sm hidden sm:block">FreePosterAPI</h1>
        </div>
        <div className="flex-1 max-w-xl mx-4">
             <CodeBox config={config} onLoadConfig={handleLoadConfig} baseUrl={baseUrl} />
        </div>
        <div className="flex gap-2 items-center justify-end w-auto sm:w-64">
             <a href="/tests" className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap">Run Tests</a>
             <button 
                onClick={() => setIsResetOpen(true)}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors" 
                title="Reset"
             >
                <RotateCcw size={18} />
             </button>
             <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block"></div>
             <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2 hidden sm:block"><Github size={20} /></a>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex w-72 flex-col bg-[#0c0c0e] border-r border-white/5 z-20">
            <LayerPanel config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
        </aside>

        <main 
            className="flex-1 relative bg-[#18181b] flex flex-col overflow-hidden transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)" 
            style={{ paddingBottom: getCanvasPadding() }} 
            onClick={(e) => { if(e.target === e.currentTarget) clearSelection(); }}
        >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <PreviewCanvas config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
        </main>

        <aside className="hidden md:flex w-80 flex-col bg-[#0c0c0e] border-l border-white/5 z-20">
           <Inspector config={config} setConfig={setConfig} />
        </aside>

        {/* Mobile Bottom Sheet (Retained Manual Physics for UX) */}
        <div 
            ref={sheetRef}
            className={`
                md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] bg-[#0c0c0e] border-t border-white/10 rounded-t-2xl shadow-2xl z-40
                ${mobileSheetMode === 'hidden' ? 'translate-y-[120%]' : 'translate-y-0'}
            `}
            style={{ 
                height: mobileSheetMode === 'full' ? '92%' : '50%',
                touchAction: 'none',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            <div 
                className="h-8 w-full flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-white/5 touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-12 h-1 bg-zinc-700 rounded-full" />
            </div>
            
            <div 
                className="h-[calc(100%-32px)] overflow-hidden relative"
                onPointerDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()}
            >
                {activeTab === 'layers' && (
                    <LayerPanel config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
                )}
                {(activeTab === 'canvas' || activeTab === 'badge') && (
                    <Inspector config={config} setConfig={setConfig} />
                )}
            </div>
        </div>
      </div>
      <MobileDock />
    </div>
  );
};

const App: React.FC = () => {

  const [config, setConfig] = useState<PosterConfig>(() => {
    try { return localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY)!) : DEFAULT_CONFIG; } catch { return DEFAULT_CONFIG; }
  });
  
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }, [config]);
  const handleLoadConfig = (url: string) => {
    const newConfig = parseUrlToConfig(url);
    setConfig(newConfig);
    try { const urlObj = new URL(url); setBaseUrl(urlObj.origin); } catch(e) {}
  };
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG); localStorage.removeItem(STORAGE_KEY);
  };
  return (
    <EditorProvider>
        <StudioLayout config={config} setConfig={setConfig} handleReset={handleReset} baseUrl={baseUrl} handleLoadConfig={handleLoadConfig} />
    </EditorProvider>
  );
};
export default App;
