import React, { useState, useEffect } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { generateApiUrl, DEFAULT_API_BASE } from '../utils';
import { PosterConfig } from '../types';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
}

const CodeBox: React.FC<Props> = ({ config, onLoadConfig, baseUrl }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal state with prop config unless user is typing
  useEffect(() => {
    if (!isFocused) {
      setUrl(generateApiUrl(config, baseUrl));
    }
  }, [config, baseUrl, isFocused]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoad = () => {
      onLoadConfig(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleLoad();
          (e.target as HTMLInputElement).blur();
      }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-6">
      <div className="flex items-center justify-between mb-2">
         <label className="text-sm font-semibold text-zinc-400">API Endpoint</label>
         {config.pos.imdb || config.pos.rt || config.pos.meta ? (
             <span className="text-xs text-yellow-500/80 bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-700/30">
                 Custom Coordinates Active
             </span>
         ) : null}
      </div>
      
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <span className="text-zinc-500 font-mono text-sm">GET</span>
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
              setIsFocused(false);
          }}
          onKeyDown={handleKeyDown}
          className="block w-full pl-12 pr-28 py-4 bg-black/50 border border-zinc-700 rounded-lg text-zinc-300 font-mono text-sm shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
             {isFocused && (
                 <button 
                    onClick={handleLoad}
                    className="p-2 text-zinc-400 hover:text-green-400 transition-colors bg-zinc-800 rounded hover:bg-zinc-700"
                    title="Load Configuration"
                 >
                     <ArrowRight size={16} />
                 </button>
             )}
            <button
                onClick={handleCopy}
                className="p-2 text-zinc-400 hover:text-white transition-colors rounded hover:bg-zinc-700"
                title="Copy URL"
            >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mt-2">
          Paste an existing FreePosterAPI URL above and press Enter to load its settings.
      </p>
    </div>
  );
};

export default CodeBox;