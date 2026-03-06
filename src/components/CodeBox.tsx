// src/components/CodeBox.tsx
import React, { useState, useEffect, useId, memo } from 'react';
import { Copy, Check, ArrowRight, Link, Loader2, Download } from 'lucide-react';
import { generateApiUrl } from '../utils';
import { PosterConfig } from '../types';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
}

const CodeBox: React.FC<Props> = memo(({ config, onLoadConfig, baseUrl }) => {
  const inputId = useId();
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isManualTyping, setIsManualTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounce URL generation to keep dragging smooth.
  useEffect(() => {
    if (isManualTyping) return;

    const timer = setTimeout(() => {
      setUrl(generateApiUrl(config, baseUrl));
    }, 150);

    return () => clearTimeout(timer);
  }, [config, baseUrl, isManualTyping]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoad = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onLoadConfig(url);
      setIsManualTyping(false);
      setIsProcessing(false);
    }, 300);
  };

  const handleDownload = () => {
    try {
      const dlUrl = new URL(url);
      dlUrl.searchParams.set('download', '');
      window.open(dlUrl.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      // Invalid URL, skip.
    }
  };

  return (
    <div className="w-full group relative" role="search" aria-label="Poster API URL">
      {/* Hidden label for the URL input */}
      <label htmlFor={inputId} className="sr-only">
        Poster API URL — paste a URL to load a configuration, or press Enter to apply
      </label>

      <div className="bg-zinc-900/50 hover:bg-zinc-900 transition-colors backdrop-blur rounded-md border border-zinc-700/50 p-0.5 flex items-center shadow-sm focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50">
        <div className="pl-2 pr-1.5 text-zinc-500" aria-hidden="true">
          <Link size={12} />
        </div>
        <input
          id={inputId}
          type="url"
          value={url}
          onChange={(e) => {
            setIsManualTyping(true);
            setUrl(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          onBlur={() => {
            // If the user typed something and then left without pressing Enter, reset.
            if (isManualTyping && !isProcessing) {
              setIsManualTyping(false);
            }
          }}
          className="flex-1 bg-transparent border-none text-zinc-300 text-[11px] font-mono focus:ring-0 placeholder-zinc-600 truncate h-7 py-0 outline-none"
          placeholder="https://api.spicydevs.xyz/..."
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Poster API URL"
          aria-describedby={`${inputId}-hint`}
        />
        <span id={`${inputId}-hint`} className="sr-only">
          {isManualTyping
            ? 'Press Enter or click the arrow button to load this URL'
            : 'URL updates automatically as you edit the poster'}
        </span>

        {isManualTyping ? (
          <button
            onClick={handleLoad}
            disabled={isProcessing}
            aria-label={isProcessing ? 'Loading configuration…' : 'Load configuration from URL'}
            aria-busy={isProcessing}
            className="p-1.5 text-blue-400 hover:bg-zinc-800 rounded disabled:opacity-50 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 outline-none"
          >
            {isProcessing ? (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight size={12} aria-hidden="true" />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1" role="group" aria-label="URL actions">
            <button
              onClick={handleDownload}
              aria-label="Download poster image"
              title="Download image"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
            >
              <Download size={12} aria-hidden="true" />
            </button>
            <button
              onClick={handleCopy}
              aria-label={copied ? 'URL copied to clipboard' : 'Copy URL to clipboard'}
              aria-pressed={copied}
              title="Copy URL"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors focus-visible:ring-1 focus-visible:ring-white/30 outline-none"
            >
              {copied
                ? <Check size={12} className="text-green-500" aria-hidden="true" />
                : <Copy size={12} aria-hidden="true" />
              }
            </button>
          </div>
        )}
      </div>

      {/* Live region announces copy state to screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {copied ? 'URL copied to clipboard' : ''}
      </div>
    </div>
  );
});

CodeBox.displayName = 'CodeBox';

export default CodeBox;