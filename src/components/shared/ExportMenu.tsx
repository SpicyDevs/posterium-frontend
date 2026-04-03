import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Download, X, Copy, Check, ArrowRight, ExternalLink } from 'lucide-react';
import type { ExtensionType, PosterConfig } from '@/components/builder/types';
import { generateApiUrl } from '@/components/builder/utils';

interface ExportMenuProps {
  config: PosterConfig;
  baseUrl: string;
  onExtensionChange: (ext: ExtensionType) => void;
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  onLoadConfig?: (url: string) => void;
  containerStyle?: React.CSSProperties;
  urlOverride?: string;
  openInBuilderHref?: string;
}

const ExportMenu = memo<ExportMenuProps>(
  ({
    config,
    onLoadConfig,
    baseUrl,
    onExtensionChange,
    isOpen,
    onClose,
    anchorRef,
    containerStyle,
    urlOverride,
    openInBuilderHref,
  }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [popupCoords, setPopupCoords] = useState<{ top: number; left: number } | null>(null);
    const [copied, setCopied] = useState(false);
    const [aioCopied, setAioCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [editedUrl, setEditedUrl] = useState<string | null>(null);

    const EXT_OPTIONS: { id: ExtensionType; label: string }[] = [
      { id: 'svg', label: 'SVG' },
      { id: 'png', label: 'PNG' },
      { id: 'jpg', label: 'JPG' },
      { id: 'webp', label: 'WEBP' },
    ];

    const currentUrl = useMemo(() => {
      if (urlOverride) return urlOverride;
      try {
        return generateApiUrl(config, baseUrl);
      } catch {
        return '';
      }
    }, [config, baseUrl, urlOverride]);

    useEffect(() => {
      setEditedUrl(null);
    }, [currentUrl]);

    const displayUrl = editedUrl !== null ? editedUrl : currentUrl;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(displayUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore clipboard errors
      }
    };

    const handleAioCopy = async () => {
      try {
        const templateUrl = displayUrl.includes('/poster/')
          ? displayUrl.replace(/\/poster\/[^.]+\./, '/poster/{imdb_id}.')
          : displayUrl;
        await navigator.clipboard.writeText(templateUrl);
        setAioCopied(true);
        setTimeout(() => setAioCopied(false), 2000);
      } catch {
        // ignore clipboard errors
      }
    };

    const handleDownload = () => {
      setDownloading(true);
      try {
        const u = new URL(displayUrl);
        u.searchParams.set('download', '');
        window.open(u.toString(), '_blank', 'noopener,noreferrer');
      } catch {
        // malformed URL
      }
      setTimeout(() => setDownloading(false), 800);
    };

    const handleLoad = () => {
      if (displayUrl.trim() && onLoadConfig) onLoadConfig(displayUrl.trim());
    };

    useEffect(() => {
      if (!isOpen) return;

      const updatePosition = () => {
        if (!anchorRef?.current) {
          setPopupCoords(null);
          return;
        }
        const rect = anchorRef.current.getBoundingClientRect();
        const width = 320;
        const margin = 12;
        const left = Math.min(
          Math.max(margin, rect.right - width),
          Math.max(margin, window.innerWidth - width - margin)
        );
        setPopupCoords({
          top: rect.bottom + 8,
          left,
        });
      };

      updatePosition();

      const handler = (e: MouseEvent | TouchEvent) => {
        const target = 'touches' in e ? (e.touches[0]?.target as Node) : ((e as MouseEvent).target as Node);
        if (!popoverRef.current?.contains(target) && !anchorRef?.current?.contains(target)) {
          onClose();
        }
      };

      document.addEventListener('mousedown', handler as EventListener);
      document.addEventListener('touchstart', handler as EventListener, { passive: true });
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        document.removeEventListener('mousedown', handler as EventListener);
        document.removeEventListener('touchstart', handler as EventListener);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }, [isOpen, onClose, anchorRef]);

    if (!isOpen) return null;

    return (
      <div
        ref={popoverRef}
        className="z-50"
        style={{
          position: 'fixed',
          top: popupCoords?.top ?? 52,
          right: popupCoords ? 'auto' : 12,
          left: popupCoords?.left,
          width: 320,
          background: 'rgba(18,17,14,0.98)',
          border: '1px solid rgba(196,124,46,0.18)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06)',
          overflow: 'hidden',
          animation: 'export-panel-in 0.18s cubic-bezier(0.16,1,0.3,1)',
          ...containerStyle,
        }}
      >
        <style>{`
          @keyframes export-panel-in {
            from { opacity: 0; transform: translateY(-8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <Download size={13} style={{ color: 'var(--film-amber)' }} />
            <span className="syne-font font-bold uppercase tracking-widest" style={{ fontSize: 10, color: 'var(--film-cream)' }}>
              Export
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center transition-colors"
            style={{ color: 'var(--film-text-dim)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <p className="syne-font uppercase tracking-widest mb-2" style={{ fontSize: 8, color: 'var(--film-text-dim)', fontWeight: 700 }}>
            Format
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {EXT_OPTIONS.map((ext) => (
              <button
                key={ext.id}
                onClick={() => onExtensionChange(ext.id)}
                className="flex flex-col items-center gap-1 py-2 rounded-lg transition-all active:scale-95 syne-font"
                style={{
                  background: config.extension === ext.id ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.02)',
                  border: config.extension === ext.id ? '1px solid rgba(196,124,46,0.25)' : '1px solid rgba(255,255,255,0.05)',
                  color: config.extension === ext.id ? 'var(--film-pale)' : 'var(--film-text-dim)',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700 }}>{ext.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-1 pb-3">
          <p className="syne-font uppercase tracking-widest mb-1.5" style={{ fontSize: 8, color: 'var(--film-text-dim)', fontWeight: 700 }}>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLoad();
              }}
              className="flex-1 min-w-0 bg-transparent border-none outline-none mono-font"
              style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
              spellCheck={false}
            />
            {onLoadConfig && editedUrl !== null && editedUrl !== currentUrl ? (
              <button
                onClick={handleLoad}
                className="w-6 h-6 shrink-0 flex items-center justify-center rounded transition-colors hover:bg-white/10"
                style={{ color: 'var(--film-amber)' }}
                title="Load URL"
              >
                <ArrowRight size={13} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
          <div className="flex gap-2">
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
            >
              <Download size={12} />
              Download
            </button>
          </div>

          <button
            onClick={handleAioCopy}
            className="w-full h-9 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] syne-font"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--film-text-dim)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {aioCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {aioCopied ? 'Copied' : 'Copy for AIOMetadata'}
          </button>

          {openInBuilderHref ? (
            <a
              href={openInBuilderHref}
              className="w-full h-9 rounded-lg flex items-center justify-center gap-2 syne-font"
              style={{
                textDecoration: 'none',
                background: 'rgba(196,124,46,0.12)',
                border: '1px solid rgba(196,124,46,0.25)',
                color: 'var(--film-pale)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              <ExternalLink size={12} /> Open in Builder
            </a>
          ) : null}
        </div>
      </div>
    );
  }
);

ExportMenu.displayName = 'ExportMenu';

export default ExportMenu;
