// src/components/builder/components/CodeBox.tsx
import React, { useState, useEffect, useId, memo, useRef } from 'react';
import { Copy, Check, ArrowRight, Loader2, Download, Link2, Braces } from 'lucide-react';
import { generateApiUrl, toTemplateUrl, isTemplateUrl, parseUrlToConfig } from '../utils';
import type { PosterConfig } from '../types';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
}

const CodeBox: React.FC<Props> = memo(({ config, onLoadConfig, baseUrl }) => {
  const inputId  = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl]                 = useState('');
  const [copied, setCopied]           = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [isLoading, setIsLoading]     = useState(false);

  useEffect(() => {
    if (isEditing) return;
    const t = setTimeout(() => setUrl(generateApiUrl(config, baseUrl)), 120);
    return () => clearTimeout(t);
  }, [config, baseUrl, isEditing]);

  // ── Copy the live URL ──────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  // ── Export as template — replaces the ID with {imdb_id} ───────────────────
  const handleExportTemplate = async () => {
    try {
      const templateUrl = toTemplateUrl(url);
      await navigator.clipboard.writeText(templateUrl);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2500);
    } catch { /* clipboard unavailable */ }
  };

  // ── Load / import a URL (or a template URL) ───────────────────────────────
  const handleLoad = () => {
    if (!url.trim()) return;
    setIsLoading(true);

    // If the pasted URL is a template, substitute the placeholder with the
    // current config's media ID so the import resolves against live data.
    let resolvedUrl = url;
    if (isTemplateUrl(url)) {
      const currentId = config.imdbId || config.tmdbId;
      resolvedUrl = url.replace(/\{[^}]+\}/g, currentId);
    }

    setTimeout(() => {
      onLoadConfig(resolvedUrl);
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
    } catch { /* malformed */ }
  };

  const handleBlur = () => {
    if (isEditing && !isLoading) {
      setIsEditing(false);
      setUrl(generateApiUrl(config, baseUrl));
    }
  };

  // Whether current URL in box is a template
  const showingTemplate = isTemplateUrl(url);

  return (
    <div className="w-full" role="search" aria-label="Poster URL">
      <label htmlFor={inputId} className="sr-only">Poster API URL</label>
      <div className={`flex items-center h-8 border rounded-lg transition-all duration-150 focus-within:bg-[#131316] hover:border-white/15 ${
        showingTemplate
          ? 'bg-[#111113] border-[#C47C2E]/30'
          : 'bg-[#111113] border-white/9 focus-within:border-[#C47C2E]/50'
      }`}>
        <span className="pl-2.5 text-zinc-600 shrink-0" aria-hidden="true">
          <Link2 size={11} strokeWidth={2} />
        </span>
        <input
          id={inputId}
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => { setIsEditing(true); setUrl(e.target.value); }}
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          onBlur={handleBlur}
          className="flex-1 min-w-0 h-full px-2 bg-transparent border-none outline-none text-[11px] font-mono text-zinc-300 placeholder-zinc-700 truncate"
          placeholder="https://api.spicydevs.xyz/…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />

        <div className="flex items-center gap-0.5 pr-1 shrink-0">
          {isEditing ? (
            <button
              onClick={handleLoad}
              disabled={isLoading}
              aria-label="Load this URL"
              title="Load this URL"
              className="w-6 h-6 rounded flex items-center justify-center text-[#D4A245] hover:bg-[#C47C2E]/15 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader2 size={11} className="animate-spin" /> : <ArrowRight size={11} />}
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

              {/* Template export button ────────────────────────────────────
                  Copies the URL with the media ID replaced by {imdb_id}.
                  Useful for Plex/Jellyfin automations that inject the ID.  */}
              <button
                onClick={handleExportTemplate}
                aria-label={templateCopied ? 'Template copied!' : 'Copy as template (replaces ID with {imdb_id})'}
                title={templateCopied ? 'Template copied!' : 'Copy as {imdb_id} template'}
                className="w-6 h-6 rounded flex items-center justify-center transition-colors text-zinc-600 hover:text-zinc-300 hover:bg-white/6"
              >
                {templateCopied
                  ? <Check size={11} className="text-emerald-400" />
                  : <Braces size={11} />
                }
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

      {/* Template hint toast */}
      {templateCopied && (
        <div className="absolute mt-1 right-0 px-2 py-1 rounded-md text-[10px] font-mono bg-zinc-800/90 text-[#D4A245] border border-[#C47C2E]/30 whitespace-nowrap shadow-lg z-50 pointer-events-none">
          Copied with <span className="font-bold">{'{imdb_id}'}</span> placeholder
        </div>
      )}

      {/* Accessibility live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {copied ? 'URL copied to clipboard' : templateCopied ? 'Template URL copied' : ''}
      </div>
    </div>
  );
});

CodeBox.displayName = 'CodeBox';
export default CodeBox;