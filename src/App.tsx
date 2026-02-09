import React, { useEffect, useState } from 'react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE, generateApiUrl } from './utils';
import Controls from './components/Controls';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import { Sparkles, Github, RotateCcw, Download, Undo2, Redo2 } from 'lucide-react';
import { usePosterHistory } from './hooks/usePosterHistory';

const STORAGE_KEY = 'freeposterapi_config_v1';

const App: React.FC = () => {
  // 1. Initialize State from Storage
  const getInitialState = (): PosterConfig => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  };

  // 2. Use History Hook
  const { state: config, setState: setConfig, undo, redo, canUndo, canRedo } = usePosterHistory(getInitialState());
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  // 3. Persist to LocalStorage
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
    }
  };

  const handleDownload = () => {
      const url = generateApiUrl(config, baseUrl);
      const downloadUrl = url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
      window.open(downloadUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#09090b] text-zinc-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* HEADER */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between gap-4 px-4 border-b border-zinc-800 bg-[#09090b] z-30">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="bg-blue-600 p-1.5 rounded-md shadow-sm">
             <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="hidden sm:block text-sm font-bold tracking-tight text-zinc-100">FreePosterAPI</h1>
        </div>

        <div className="flex-1 max-w-xl">
             <CodeBox config={config} onLoadConfig={handleLoadConfig} baseUrl={baseUrl} />
        </div>

        <div className="flex gap-2 items-center flex-shrink-0">
             {/* History Controls */}
             <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1 mr-2">
                <button onClick={undo} disabled={!canUndo} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Undo"><Undo2 size={14} /></button>
                <button onClick={redo} disabled={!canRedo} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Redo"><Redo2 size={14} /></button>
             </div>

             <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-white text-black rounded-md text-xs font-semibold transition-colors shadow-sm"
             >
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
             </button>
             
             <button 
                onClick={handleReset} 
                className="flex items-center gap-2 px-3 py-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-colors text-xs font-medium" 
                title="Reset"
             >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Reset</span>
             </button>
             
             <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors p-2"><Github size={20} /></a>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        <main className="flex-1 relative flex flex-col bg-zinc-950/50 overflow-hidden order-1 md:order-2">
            <div className="flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden">
                 <PreviewCanvas config={config} setConfig={setConfig} />
            </div>
        </main>
        
        <aside className="w-full md:w-80 flex-shrink-0 bg-[#09090b] z-30 border-t md:border-t-0 md:border-r border-zinc-800 flex flex-col order-2 md:order-1 h-[45%] md:h-auto shadow-xl">
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
             <Controls config={config} onChange={setConfig} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;