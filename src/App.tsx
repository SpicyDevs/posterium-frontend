import React, { useState, useEffect, useRef } from 'react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Sparkles, Github, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'freeposterapi_config_v2';

const StudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
}> = ({ config, setConfig, handleReset, baseUrl, handleLoadConfig }) => {
  const { activeTab, mobileSheetMode, setMobileSheetMode, selectedIds, handleSelection, clearSelection } = useEditor();
  
  // -- DRAG LOGIC --
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentSheetY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
      startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (startY.current === null) return;
      const deltaY = e.touches[0].clientY - startY.current;
      currentSheetY.current = deltaY;
  };

  const handleTouchEnd = () => {
      if (startY.current === null) return;
      const threshold = 50; // pixels to trigger change
      
      if (currentSheetY.current > threshold) {
          // Dragged Down
          if (mobileSheetMode === 'full') setMobileSheetMode('half');
          else if (mobileSheetMode === 'half') setMobileSheetMode('hidden');
      } else if (currentSheetY.current < -threshold) {
          // Dragged Up
          if (mobileSheetMode === 'hidden') setMobileSheetMode('half');
          else if (mobileSheetMode === 'half') setMobileSheetMode('full');
      }
      
      startY.current = null;
      currentSheetY.current = 0;
  };

  const getCanvasPadding = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return 0;
      switch (mobileSheetMode) {
          case 'full': return '90%'; 
          case 'half': return '50%';
          default: return '4rem'; 
      }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#09090b] text-zinc-200 overflow-hidden font-sans selection:bg-blue-500/30">
      
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
        <div className="flex gap-2 items-center justify-end w-64">
             <button onClick={handleReset} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors" title="Reset"><RotateCcw size={18} /></button>
             <div className="w-px h-5 bg-white/10 mx-1"></div>
             <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2"><Github size={20} /></a>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Desktop Left */}
        <aside className="hidden md:flex w-72 flex-col bg-[#0c0c0e] border-r border-white/5 z-20">
            <LayerPanel config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
        </aside>

        {/* Center Canvas */}
        <main 
            className="flex-1 relative bg-[#18181b] flex flex-col overflow-hidden transition-all duration-300 ease-out" 
            style={{ paddingBottom: getCanvasPadding() }} 
            onClick={(e) => {
                if(e.target === e.currentTarget) clearSelection();
            }}
        >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            <PreviewCanvas config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
        </main>

        {/* Desktop Right */}
        <aside className="hidden md:flex w-80 flex-col bg-[#0c0c0e] border-l border-white/5 z-20">
           <Inspector config={config} setConfig={setConfig} />
        </aside>

        {/* Mobile Bottom Sheet (Draggable) */}
        <div 
            ref={sheetRef}
            className={`
                md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] bg-[#0c0c0e] border-t border-white/10 rounded-t-2xl shadow-2xl z-40 transition-transform duration-300 cubic-bezier(0.32, 0.72, 0, 1)
                ${mobileSheetMode === 'hidden' ? 'translate-y-[120%]' : 'translate-y-0'}
            `}
            style={{ 
                height: mobileSheetMode === 'full' ? '92%' : '50%',
                touchAction: 'none' 
            }}
        >
            {/* Drag Handle Area */}
            <div 
                className="h-8 w-full flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-white/5 touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="w-12 h-1 bg-zinc-700 rounded-full" />
            </div>
            
            {/* Sheet Content */}
            {/* BUG FIX: stopPropagation prevents scroll from triggering sheet drag */}
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
    if (confirm('Reset all settings?')) { setConfig(DEFAULT_CONFIG); localStorage.removeItem(STORAGE_KEY); }
  };

  return (
    <EditorProvider>
        <StudioLayout config={config} setConfig={setConfig} handleReset={handleReset} baseUrl={baseUrl} handleLoadConfig={handleLoadConfig} />
    </EditorProvider>
  );
};

export default App;