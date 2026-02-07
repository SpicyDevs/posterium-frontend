import React, { useState, useEffect } from 'react';
import { Copy, Check, ArrowRight, Link } from 'lucide-react';
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

  // Sync state with config changes, unless user is actively typing to load something
  useEffect(() => {
    if (!isManualTyping) {
      setUrl(generateApiUrl(config, baseUrl));
    }
  }, [config, baseUrl, isManualTyping]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoad = () => {
      onLoadConfig(url);
      setIsManualTyping(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-4">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-1 flex items-center shadow-lg">
        <div className="pl-3 pr-2 text-zinc-500">
            <Link size={16} />
        </div>
        <input
          type="text"
          value={url}
          onChange={(e) => {
              setIsManualTyping(true);
              setUrl(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          className="flex-1 bg-transparent border-none text-zinc-300 text-sm font-mono focus:ring-0 placeholder-zinc-600"
          placeholder="https://..."
        />
        {isManualTyping ? (
             <button onClick={handleLoad} className="p-2 text-blue-400 hover:bg-zinc-800 rounded">
                 <ArrowRight size={18} />
             </button>
        ) : (
            <button onClick={handleCopy} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
        )}
      </div>
      <div className="flex justify-between mt-2 px-1">
          <p className="text-[10px] text-zinc-500">
             {isManualTyping ? "Press Enter to load this configuration." : "This URL generates the image above dynamically."}
          </p>
          <p className="text-[10px] text-zinc-500">
              {config.tmdbId}.{config.extension}
          </p>
      </div>
    </div>
  );
};

export default CodeBox;