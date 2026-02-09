import React, { useState, useEffect } from 'react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import LayerPanel from './components/LayerPanel';
import Inspector from './components/layout/Inspector';
import MobileDock from './components/layout/MobileDock';
import { EditorProvider, useEditor } from './context/EditorContext';
import { Sparkles, Github, RotateCcw, X } from 'lucide-react';

const STORAGE_KEY = 'freeposterapi_config_v2';

// Inner component to consume Context
const StudioLayout: React.FC<{
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  handleReset: () => void;
  baseUrl: string;
  handleLoadConfig: (url: string) => void;
}> = ({ config, setConfig, handleReset, baseUrl, handleLoadConfig }) => {
  const { activeTab, isMobileSheetOpen, setMobileSheetOpen, selectedIds, handleSelection, clearSelection } = useEditor();

  return (
    <div className="flex flex-col h-[100dvh] bg-[#09090b] text-zinc-200 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* --- DESKTOP HEADER --- */}
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
             <button onClick={handleReset} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors" title="Reset">
                <RotateCcw size={18} />
             </button>
             <div className="w-px h-5 bg-white/10 mx-1"></div>
             <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2">
                 <Github size={20} />
             </a>
        </div>
      </header>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT COLUMN: Layers (Desktop Only) */}
        <aside className="hidden md:flex w-72 flex-col bg-[#0c0c0e] border-r border-white/5 z-20">
            <LayerPanel 
                config={config} 
                setConfig={setConfig} 
                selectedIds={selectedIds} 
                onSelect={handleSelection} 
            />
        </aside>

        {/* CENTER COLUMN: Canvas */}
        <main className="flex-1 relative bg-[#18181b] flex flex-col overflow-hidden" onClick={(e) => {
            if(e.target === e.currentTarget) clearSelection();
        }}>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <PreviewCanvas 
                config={config} 
                setConfig={setConfig} 
                selectedIds={selectedIds}
                onSelect={handleSelection}
            />
        </main>

        {/* RIGHT COLUMN: Inspector (Desktop Only) */}
        <aside className="hidden md:flex w-80 flex-col bg-[#0c0c0e] border-l border-white/5 z-20">
           <Inspector config={config} setConfig={setConfig} />
        </aside>

        {/* --- MOBILE BOTTOM SHEET --- */}
        {/* This overlays the canvas on mobile when a tab is active */}
        <div 
            className={`
                md:hidden fixed inset-x-0 bottom-16 bg-[#0c0c0e] border-t border-white/10 rounded-t-2xl shadow-2xl z-40 transition-transform duration-300 ease-out
                ${isMobileSheetOpen ? 'translate-y-0' : 'translate-y-[110%]'}
            `}
            style={{ height: '70%' }}
        >
            {/* Sheet Handle */}
            <div className="h-6 w-full flex items-center justify-center cursor-pointer border-b border-white/5" onClick={() => setMobileSheetOpen(false)}>
                <div className="w-12 h-1 bg-zinc-700 rounded-full" />
            </div>
            
            <div className="h-[calc(100%-24px)] overflow-hidden relative">
                <button 
                    onClick={() => setMobileSheetOpen(false)} 
                    className="absolute top-2 right-2 p-2 text-zinc-500 hover:text-white z-50"
                >
                    <X size={16}/>
                </button>

                {activeTab === 'layers' && (
                    <LayerPanel config={config} setConfig={setConfig} selectedIds={selectedIds} onSelect={handleSelection} />
                )}
                
                {/* Re-use Inspector for Canvas/Badge tabs as it handles the toggle logic internally, 
                    but on mobile we might want to force the view based on the bottom tab?
                    Actually, Inspector has the top tabs built-in. Let's just render Inspector and let it sync.
                */}
                {(activeTab === 'canvas' || activeTab === 'badge') && (
                    <Inspector config={config} setConfig={setConfig} />
                )}
            </div>
        </div>

      </div>

      {/* --- MOBILE DOCK --- */}
      <MobileDock />
    </div>
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState<PosterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const handleLoadConfig = (url: string) => {
    const newConfig = parseUrlToConfig(url);
    setConfig(newConfig);
    try { const urlObj = new URL(url); setBaseUrl(urlObj.origin); } catch(e) {}
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <EditorProvider>
        <StudioLayout 
            config={config} 
            setConfig={setConfig} 
            handleReset={handleReset} 
            baseUrl={baseUrl} 
            handleLoadConfig={handleLoadConfig} 
        />
    </EditorProvider>
  );
};

export default App;