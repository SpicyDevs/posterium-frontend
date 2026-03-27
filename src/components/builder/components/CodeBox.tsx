// src/components/builder/components/CodeBox.tsx
import React, { useState, useEffect, useId, memo, useRef } from 'react';
import {
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Download,
  Link2,
  Braces,
  ChevronDown,
} from 'lucide-react';
import { generateApiUrl, toTemplateUrl, isTemplateUrl } from '../utils';
import type { PosterConfig, ExtensionType } from '../types';
import clsx from 'clsx';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
  onExtensionChange?: (ext: ExtensionType) => void;
}

const EXT_OPTIONS: { id: ExtensionType; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'webp', label: 'WEBP' },
];

const CodeBox: React.FC<Props> = memo(({ config, onLoadConfig, baseUrl, onExtensionChange }) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const totalSlots =
    config.ratings.length + (config.fallbackEnabled ? config.fallbackPool.length : 0);
  // Warn when total active + fallback slots exceeds 12 (very long URLs can cause rendering issues or be rejected)
  const showLengthWarn = totalSlots > 12;

  useEffect(() => {
    if (isEditing) return;
    const t = setTimeout(() => setUrl(generateApiUrl(config, baseUrl)), 120);
    return () => clearTimeout(t);
  }, [config, baseUrl, isEditing]);

  // ── Handle outside click for format dropdown ───────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFormatDropdown(false);
      }
    };
    if (showFormatDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFormatDropdown]);

  // ── Copy the live URL ──────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  // ── Export as template — replaces the ID with {imdb_id} ───────────────────
  const handleExportTemplate = async () => {
    try {
      const templateUrl = toTemplateUrl(url);
      await navigator.clipboard.writeText(templateUrl);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  };

  // ── Load / import a URL (or a template URL) ───────────────────────────────
  const handleLoad = () => {
    if (!url.trim()) return;
    setIsLoading(true);

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
    } catch {
      /* malformed */
    }
  };

  const handleBlur = () => {
    if (isEditing && !isLoading) {
      setIsEditing(false);
      setUrl(generateApiUrl(config, baseUrl));
    }
  };

  const showingTemplate = isTemplateUrl(url);

  return (
    <div className="w-full space-y-1" role="search" aria-label="Poster URL">
      <label htmlFor={inputId} className="sr-only">
        Poster API URL
      </label>

      {/* ── URL bar ─────────────────────────────────────────────────────── */}
      <div
        className={clsx(
          'flex items-center h-8 border rounded-lg transition-all duration-150 focus-within:bg-[#131316] hover:border-white/15',
          showingTemplate
            ? 'bg-[#111113] border-[#C47C2E]/30'
            : 'bg-[#111113] border-white/9 focus-within:border-[#C47C2E]/50'
        )}
      >
        <span className="pl-2.5 text-zinc-600 shrink-0" aria-hidden="true">
          <Link2 size={11} strokeWidth={2} />
        </span>
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
          onScroll={(e) => {
            // Prevent visual glitches from horizontal wheel-scrolling on a truncated, unfocused input
            if (document.activeElement !== e.currentTarget) {
              e.currentTarget.scrollLeft = 0;
            }
          }}
          className="flex-1 min-w-0 h-full px-2 bg-transparent border-none outline-none text-[11px] font-mono text-zinc-300 placeholder-zinc-700 truncate"
          placeholder="https://api.spicydevs.xyz/…"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />

        <div className="flex items-center gap-0.5 pr-1 shrink-0 relative">
          {isEditing ? (
            <button
              onClick={handleLoad}
              disabled={isLoading}
              aria-label="Load this URL"
              title="Load this URL"
              className="w-6 h-6 rounded flex items-center justify-center text-[#D4A245] hover:bg-[#C47C2E]/15 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <ArrowRight size={11} />
              )}
            </button>
          ) : (
            <>
              {/* Format Dropdown Button */}
              {onExtensionChange && (
                <div className="relative flex items-center" ref={dropdownRef}>
                  <button
                    onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                    title="Change image format"
                    className="h-6 px-1.5 rounded flex items-center justify-center gap-0.5 text-[10px] font-mono uppercase text-zinc-500 hover:text-zinc-300 hover:bg-white/6 transition-colors select-none"
                  >
                    {config.extension}
                    <ChevronDown size={10} className="opacity-70" />
                  </button>

                  {/* Dropdown Menu */}
                  {showFormatDropdown && (
                    <div className="absolute top-full right-0 mt-1.5 w-16 bg-[#131316] border border-white/10 rounded-md shadow-xl overflow-hidden z-20 flex flex-col p-1">
                      {EXT_OPTIONS.map((ext) => (
                        <button
                          key={ext.id}
                          onClick={() => {
                            onExtensionChange(ext.id);
                            setShowFormatDropdown(false);
                          }}
                          className={clsx(
                            'px-2 py-1.5 text-[10px] font-mono text-center rounded-sm transition-colors uppercase',
                            config.extension === ext.id
                              ? 'bg-[#C47C2E]/20 text-[#D4A245] font-semibold'
                              : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                          )}
                        >
                          {ext.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleDownload}
                aria-label="Download poster"
                title="Download image"
                className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-white/6 transition-colors"
              >
                <Download size={11} />
              </button>

              <button
                onClick={handleExportTemplate}
                aria-label={
                  templateCopied
                    ? 'Template copied!'
                    : 'Copy as template (replaces ID with {imdb_id})'
                }
                title={templateCopied ? 'Template copied!' : 'Copy as {imdb_id} template'}
                className="w-6 h-6 rounded flex items-center justify-center transition-colors text-zinc-600 hover:text-zinc-300 hover:bg-white/6"
              >
                {templateCopied ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <Braces size={11} />
                )}
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

      {/* Template hint (only shown when copied) */}
      {templateCopied && (
        <div className="flex justify-end pr-1">
          <span className="text-[9px] font-mono text-[#D4A245]/70 whitespace-nowrap">
            Copied with <span className="font-bold">{'{imdb_id}'}</span>
          </span>
        </div>
      )}

      {/* URL length warning */}
      {showLengthWarn && (
        <p className="text-[9px] text-amber-400/70 text-right pr-1">
          Long URL: consider fewer badges/fallbacks for reliability.
        </p>
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
