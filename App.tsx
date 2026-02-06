import React, { useState } from 'react';
import { PosterConfig, DEFAULT_CONFIG } from './types';
import { parseUrlToConfig, DEFAULT_API_BASE } from './utils';
import Controls from './components/Controls';
import PreviewCanvas from './components/PreviewCanvas';
import CodeBox from './components/CodeBox';
import { Sparkles, Github } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<PosterConfig>(DEFAULT_CONFIG);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE);

  const handleLoadConfig = (url: string) => {
    const newConfig = parseUrlToConfig(url);
    setConfig(newConfig);
    
    try {
        const urlObj = new URL(url);
        // If the loaded URL uses a different host, update our base URL setting too
        setBaseUrl(urlObj.origin);
    } catch(e) {
        // ignore
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-200 overflow-hidden">
      
      {/* Navbar */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0a0a] z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
             <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
            FreePosterAPI <span className="text-zinc-500 font-normal">Editor</span>
          </h1>
          <h1 className="text-xl font-bold tracking-tight text-white sm:hidden">
            FP<span className="text-zinc-500 font-normal">Editor</span>
          </h1>
        </div>
        <div className="flex gap-4">
             <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                 <Github size={20} />
             </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        
        {/* Left Sidebar: Controls - Full width on mobile, Sidebar on desktop */}
        <aside className="w-full md:w-80 flex-shrink-0 bg-[#0f0f11] z-10 border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto max-h-[30vh] md:max-h-none">
          <Controls config={config} onChange={setConfig} />
        </aside>

        {/* Center: Canvas & Output */}
        <main className="flex-1 relative flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-[#0a0a0a] to-[#0a0a0a] overflow-hidden">
            
            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
                
                {/* API Output (Now at the top) */}
                <div className="w-full max-w-4xl animate-in slide-in-from-top-4 duration-500 fade-in">
                    <CodeBox 
                        config={config} 
                        onLoadConfig={handleLoadConfig} 
                        baseUrl={baseUrl}
                    />
                </div>
                
                {/* Visual Preview */}
                <div className="w-full flex justify-center mb-8 pb-10">
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