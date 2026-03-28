import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Download, X, Copy, Check, ArrowRight } from 'lucide-react';
import type { PosterConfig, ExtensionType } from '../types';
import { generateApiUrl } from '../utils';

interface Props {
  config: PosterConfig;
  onLoadConfig: (url: string) => void;
  baseUrl: string;
  onExtensionChange: (ext: ExtensionType) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const ExportPopover = memo<Props>(({ config, onLoadConfig, baseUrl, onExtensionChange, isOpen, onClose, anchorRef }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editedUrl, setEditedUrl] = useState<string | null>(null);

  const EXT_OPTIONS: { id: ExtensionType; label: string }[] = [
    { id: 'svg', label: 'SVG' },
    { id: 'png', label: 'PNG' },
    { id: 'jpg', label: 'JPG' },
    { id: 'webp', label: 'WEBP' },
  ];

  const currentUrl = useMemo(() => {
    try { return generateApiUrl(config, baseUrl); } catch { return ''; }
  }, [config, baseUrl]);

  useEffect(() => {
    setEditedUrl(null);
  }, [currentUrl]);

  const displayUrl = editedUrl !== null ? editedUrl : currentUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const u = new URL(displayUrl);
      u.searchParams.set('download', '');
      window.open(u.toString(), '_blank', 'noopener,noreferrer');
    } catch { /* malformed */ }
    setTimeout(() => setDownloading(false), 800);
  };

  const handleLoad = () => {
     if (displayUrl.trim()) onLoadConfig(displayUrl.trim());
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50"
      style={{
        top: 52,
        right: 12,
        width: 320,
        background: 'rgba(18,17,14,0.98)',
        border: '1px solid rgba(196,124,46,0.18)',
        borderRadius: 14,
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06)',
        overflow: 'hidden',
        animation: 'export-panel-in 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes export-panel-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <Download size={13} style={{ color: 'var(--film-amber)' }} />
          <span
            className="syne-font font-bold uppercase tracking-widest"
            style={{ fontSize: 10, color: 'var(--film-cream)' }}
          >
            Export
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors"
          style={{ color: 'var(--film-text-ghost)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--film-text-ghost)'; }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Format selector */}
      <div className="px-4 pt-3 pb-2">
        <p
          className="syne-font uppercase tracking-widest mb-2"
          style={{ fontSize: 8, color: 'var(--film-text-ghost)', fontWeight: 700 }}
        >
          Format
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {EXT_OPTIONS.map((ext) => (
            <button
              key={ext.id}
              onClick={() => onExtensionChange(ext.id)}
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-all active:scale-95 syne-font"
              style={{
                background:
                  config.extension === ext.id
                    ? 'rgba(196,124,46,0.12)'
                    ? 'rgba(255,255,255,0.02)',
                border:
                  config.extension === ext.id
                    ? '1px solid rgba(196,124,46,0.25)'
                    : '1px solid rgba(255,255,255,0.05)',
                color:
                  config.extension === ext.id
                    ? 'var(--film-pale)'
                    : 'var(--film-text-dim)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700 }}>{ext.label}</span>
              <span
                className="body-font text-center leading-tight"
                style={{
                  fontSize: 7,
                  color:
                    config.extension === ext.id
                      ? 'rgba(196,124,46,0.6)'
                      : 'var(--film-text-ghost)',
                }}
              >
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editable URL Input */}
      <div className="px-4 pt-1 pb-3">
        <p
          className="syne-font uppercase tracking-widest mb-1.5"
          style={{ fontSize: 8, color: 'var(--film-text-ghost)', fontWeight: 700 }}
        >
          API URL
        </p>
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg focus-within:ring-1 focus-within:ring-[#C47C2E] transition-all"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <input
            type="url"
            value={displayUrl}
            onChange={(e) => setEditedUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLoad(); }}
            className="flex-1 min-w-0 bg-transparent border-none outline-none mono-font"
            style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
            spellCheck={false}
          />
          {editedUrl !== null && editedUrl !== currentUrl && (
            <button
              onClick={handleLoad}
              className="w-6 h-6 shrink-0 flex items-center justify-center rounded transition-colors hover:bg-white/10"
              style={{ color: 'var(--film-amber)' }}
              title="Load URL"
            >
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 px-4 pb-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}
      >
        <button
          onClick={handleCopy}
          className="flex-1 h-9 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] syne-font"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--film-text-dim)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.2)';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
          }}
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy URL'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 h-9 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] syne-font"
          style={{
            background: downloading ? 'rgba(196,124,46,0.2)' : 'var(--film-amber)',
            color: downloading ? 'var(--film-pale)' : '#070706',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            boxShadow: downloading ? 'none' : '0 0 20px rgba(196,124,46,0.25)',
            border: 'none',
          }}
          onMouseEnter={(e) => {
            if (!downloading) (e.currentTarget as HTMLElement).style.background = '#d4a245';
          }}
          onMouseLeave={(e) => {
            if (!downloading) (e.currentTarget as HTMLElement).style.background = 'var(--film-amber)';
          }}
        >
          <Download size={12} />
          Download
        </button>
      </div>
    </div>
  );
});

export default ExportPopover;