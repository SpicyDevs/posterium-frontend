import React, { useState, useEffect } from 'react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import Controls from './components/Controls';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import { Sparkles, Github, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'freeposterapi_config_v1';

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
    // h-[100dvh] handles mobile address bars better than h-screen
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-zinc-200 overflow-hidden font-sans">
      
      {/* Navbar */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between gap-4 px-4 border-b border-white/5 bg-[#0a0a0a] z-30">
        
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-blue-900/20">
             <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="hidden sm:block text-base font-bold tracking-tight text-white">
            FreePosterAPI
          </h1>
        </div>

        {/* Center: CodeBox (Dynamic URL) */}
        <div className="flex-1 max-w-xl">
             <CodeBox 
                config={config} 
                onLoadConfig={handleLoadConfig} 
                baseUrl={baseUrl}
            />
        </div>

        {/* Actions */}
        <div className="flex gap-3 items-center flex-shrink-0">
             <button 
                onClick={handleReset}
                className="p-2 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-md transition-colors"
                title="Reset"
             >
                <RotateCcw size={16} />
             </button>
             <div className="w-px h-5 bg-white/10"></div>
             <a href="https://github.com/xdaayush/freeposterapi" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                 <Github size={20} />
             </a>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        
        {/* CENTER: Preview Canvas */}
        <main className="flex-1 relative flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden order-1 md:order-2">
            <div className="flex-1 w-full flex items-center justify-center p-4 min-h-0">
                 <PreviewCanvas config={config} setConfig={setConfig} />
            </div>
        </main>

        {/* LEFT/BOTTOM: Controls Sidebar */}
        <aside className="w-full md:w-80 flex-shrink-0 bg-[#0f0f11] z-30 border-t md:border-t-0 md:border-r border-white/5 flex flex-col order-2 md:order-1 h-[45%] md:h-auto shadow-2xl md:shadow-none">
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-safe">
             <Controls config={config} onChange={setConfig} />
          </div>
        </aside>

      </div>
    </div>
  );
};

export default App;