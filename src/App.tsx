import React, { useState, useEffect } from 'react';
import { PosterConfig, DEFAULT_CONFIG, RatingType } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import LayerPanel from './components/LayerPanel';
import PropertyPanel from './components/PropertyPanel';
import { Sparkles, Github, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'freeposterapi_config_v2';

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
  const [selectedIds, setSelectedIds] = useState<Set<RatingType>>(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const handleLoadConfig = (url: string) => {
    const newConfig = parseUrlToConfig(url);
    setConfig(newConfig);
    try {
        const urlObj = new URL(url);
        setBaseUrl(urlObj.origin);
    } catch(e) { /* ignore */ }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      setConfig(DEFAULT_CONFIG);
      setSelectedIds(new Set());
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSelection = (id: RatingType, multi: boolean) => {
    const newSet = new Set(multi ? selectedIds : []);
    if (newSet.has(id)) {
        if (multi) newSet.delete(id);
        else newSet.clear(); 
    } else {
        newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="flex flex-col h-[100dvh] bg-[#09090b] text-zinc-200 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation Bar */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-[#09090b] z-30">
        <div className="flex items-center gap-3 w-64">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
             <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="font-bold tracking-tight text-white text-sm">FreePosterAPI</h1>
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

      {/* Main Studio Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left: Layers Panel */}
        <aside className="w-64 flex-shrink-0 bg-[#0c0c0e] border-r border-white/5 flex flex-col z-20">
            <LayerPanel 
                config={config} 
                setConfig={setConfig} 
                selectedIds={selectedIds} 
                onSelect={handleSelection} 
            />
        </aside>

        {/* Center: Canvas */}
        <main className="flex-1 relative bg-[#18181b] flex flex-col overflow-hidden" onClick={(e) => {
            if(e.target === e.currentTarget) clearSelection();
        }}>
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <PreviewCanvas 
                config={config} 
                setConfig={setConfig} 
                selectedIds={selectedIds}
                onSelect={handleSelection}
            />
        </main>

        {/* Right: Properties Panel */}
        <aside className="w-80 flex-shrink-0 bg-[#0c0c0e] border-l border-white/5 flex flex-col z-20">
           <PropertyPanel 
                config={config}
                setConfig={setConfig}
                selectedIds={selectedIds}
           />
        </aside>

      </div>
    </div>
  );
};

export default App;