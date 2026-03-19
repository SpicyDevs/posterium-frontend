// src/components/CodeBox.tsx
import React, { useState, useEffect, useId, memo, useRef } from 'react';
import { Copy, Check, ArrowRight, Loader2, Download, Link2 } from 'lucide-react';
import { generateApiUrl } from '../utils';
import { PosterConfig } from '../types';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
}

const CodeBox: React.FC<Props> = memo(({ config, onLoadConfig, baseUrl }) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce URL generation - keeps drag smooth
  useEffect(() => {
    if (isEditing) return;
    const t = setTimeout(() => setUrl(generateApiUrl(config, baseUrl)), 120);
    return () => clearTimeout(t);
  }, [config, baseUrl, isEditing]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleLoad = () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      onLoadConfig(url);
      setIsEditing(false);
      setIsLoading(false);
      inputRef.current?.blur();
    }, 300);
  };

  const handleDownload = () => {
    try {
      const u = new URL(url);
      u.searchParams.set('download', '');
      window.open(u.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      /* malformed url */
    }
  };

  const handleBlur = () => {
    // Reset editing state if user leaves without submitting
    if (isEditing && !isLoading) {
      setIsEditing(false);
      // Regenerate clean URL
      setUrl(generateApiUrl(config, baseUrl));
    }
  };

  return (
    <div className="w-full" role="search" aria-label="Poster URL">
      <label htmlFor={inputId} className="sr-only">
        Poster API URL
      </label>

      <div
        className="
        flex items-center h-8
        bg-[#111113] border border-white/9 rounded-lg
        transition-all duration-150
        focus-within:border-[#C47C2E]/50 focus-within:bg-[#131316]
        hover:border-white/15
      "
      >
        {/* Icon */}
        <span className="pl-2.5 text-zinc-600 shrink-0" aria-hidden="true">
          <Link2 size={11} strokeWidth={2} />
        </span>

        {/* Input */}
        <input
          id={inputId}
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => {
            setIsEditing(true);
            setUrl(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          onBlur={handleBlur}
          className="
            flex-1 min-w-0 h-full px-2 bg-transparent border-none outline-none
            text-[11px] font-mono text-zinc-300 placeholder-zinc-700
            truncate
          "
          placeholder="https://api.spicydevs.xyz/..."
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 pr-1 shrink-0">
          {isEditing ? (
            <button
              onClick={handleLoad}
              disabled={isLoading}
              aria-label="Load this URL"
              className="
                w-6 h-6 rounded flex items-center justify-center
                text-[#D4A245] hover:bg-[#C47C2E]/15
                disabled:opacity-50 transition-colors
              "
            >
              {isLoading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <ArrowRight size={11} />
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleDownload}
                aria-label="Download poster"
                title="Download image"
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/6 transition-colors"
              >
                <Download size={11} />
              </button>
              <button
                onClick={handleCopy}
                aria-label={copied ? 'Copied!' : 'Copy URL'}
                title={copied ? 'Copied!' : 'Copy URL'}
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/6 transition-colors"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Screen reader copy announcement */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? 'URL copied to clipboard' : ''}
      </div>
    </div>
  );
});

CodeBox.displayName = 'CodeBox';
export default CodeBox;
