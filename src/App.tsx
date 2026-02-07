import React, { useState, useEffect } from 'react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import Controls from './components/Controls';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import { Sparkles, Github, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'freeposterapi_config_v1';

const App: React.FC = () => {
  // Persistence: Load from local storage or use default
  const [config, setConfig] = useState<PosterConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  // Persistence: Save on change
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
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-200 overflow-hidden font-sans">
      
      {/* Navbar */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-[#0a0a0a] z-30">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 md:p-2 rounded-lg shadow-lg shadow-blue-900/20">
             <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
            FreePosterAPI <span className="text-zinc-500 font-normal hidden sm:inline">Editor</span>
          </h1>
        </div>
        <div className="flex gap-2 md:gap-4 items-center">
             <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-md transition-colors"
                title="Reset to Defaults"
             >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Reset</span>
             </button>
             <div className="w-px h-6 bg-white/10 mx-1"></div>
             <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                 <Github size={20} />
             </a>
        </div>
      </header>

      {/* Main Content */}
      {/* Mobile: Flex-col-reverse puts the Sidebar (Controls) BELOW the Content (Preview) */}
      <div className="flex flex-1 flex-col-reverse md:flex-row overflow-hidden relative">
        
        {/* Left Sidebar: Controls */}
        <aside className="w-full md:w-80 flex-shrink-0 bg-[#0f0f11] z-20 border-t md:border-t-0 md:border-r border-white/5 overflow-y-auto h-[45vh] md:h-auto md:max-h-none shadow-2xl md:shadow-none">
          <Controls config={config} onChange={setConfig} />
        </aside>

        {/* Center: Canvas & Output */}
        <main className="flex-1 relative flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden">
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
                
                {/* API Output */}
                <div className="w-full max-w-2xl mb-6 animate-in slide-in-from-top-4 duration-500 fade-in z-10">
                    <CodeBox 
                        config={config} 
                        onLoadConfig={handleLoadConfig} 
                        baseUrl={baseUrl}
                    />
                </div>
                
                {/* Visual Preview */}
                <div className="flex-1 w-full flex flex-col justify-center items-center min-h-[300px] pb-10">
                     <PreviewCanvas config={config} setConfig={setConfig} />
                </div>
                
            </div>
            
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/5 blur-[120px] pointer-events-none" />
        </main>
      </div>
    </div>
  );
};

export default App;