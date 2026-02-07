import React, { useState, useEffect } from 'react';
import { Copy, Check, ArrowRight, Link, Loader2 } from 'lucide-react';
import { generateApiUrl } from '../utils';
import { PosterConfig } from '../types';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
}

const CodeBox: React.FC<Props> = ({ config, onLoadConfig, baseUrl }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isManualTyping, setIsManualTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Performance: Debounce URL generation to avoid lag during dragging
  useEffect(() => {
    if (isManualTyping) return;

    const timer = setTimeout(() => {
      setUrl(generateApiUrl(config, baseUrl));
    }, 150); // 150ms delay makes dragging smooth

    return () => clearTimeout(timer);
  }, [config, baseUrl, isManualTyping]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoad = () => {
      setIsProcessing(true);
      // Small artificial delay to show the "working" state helps UX
      setTimeout(() => {
          onLoadConfig(url);
          setIsManualTyping(false);
          setIsProcessing(false);
      }, 300);
  };

  return (
    <div className="w-full mx-auto mb-2 px-1">
      <div className="bg-zinc-900/90 backdrop-blur rounded-lg border border-zinc-700/50 p-1 flex items-center shadow-lg group focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
        <div className="pl-3 pr-2 text-zinc-500">
            <Link size={14} />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => {
              setIsManualTyping(true);
              setUrl(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          className="flex-1 bg-transparent border-none text-zinc-300 text-xs font-mono focus:ring-0 placeholder-zinc-600 truncate py-2"
          placeholder="https://..."
          spellCheck={false}
        />
        {isManualTyping ? (
             <button onClick={handleLoad} disabled={isProcessing} className="p-2 text-blue-400 hover:bg-zinc-800 rounded disabled:opacity-50">
                 {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <ArrowRight size={16} />}
             </button>
        ) : (
            <button onClick={handleCopy} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
        )}
      </div>
      <div className="flex justify-between mt-1.5 px-1 opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-zinc-500">
             {isManualTyping ? "Press Enter to load." : "Dynamic API URL"}
          </p>
      </div>
    </div>
  );
};

export default CodeBox;