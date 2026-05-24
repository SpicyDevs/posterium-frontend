import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import type { ExtensionType, PosterConfig } from '../../types';
import { generateApiUrl } from '../../utils';

interface Props {
  config: PosterConfig;
  baseUrl: string;
  onExtensionChange: (ext: ExtensionType) => void;
  onOpenAdvanced: () => void;
}

const EXTENSIONS: ExtensionType[] = ['png', 'jpg', 'webp', 'svg'];

const RevealAndExport: React.FC<Props> = ({ config, baseUrl, onExtensionChange, onOpenAdvanced }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<ExtensionType | null>(null);

  const apiUrl = useMemo(() => {
    try {
      return generateApiUrl(config, baseUrl);
    } catch {
      return '';
    }
  }, [config, baseUrl]);

  const handleCopy = async () => {
    if (!apiUrl) return;
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownload = (ext: ExtensionType) => {
    setDownloading(ext);
    const nextUrl = (() => {
      try {
        return generateApiUrl({ ...config, extension: ext }, baseUrl);
      } catch {
        return '';
      }
    })();
    onExtensionChange(ext);
    if (nextUrl) {
      try {
        const u = new URL(nextUrl);
        u.searchParams.set('download', '');
        window.open(u.toString(), '_blank', 'noopener,noreferrer');
      } catch {
        // ignore malformed URL
      }
    }
    setTimeout(() => setDownloading(null), 700);
  };

  return (
    <div
      className="w-full max-w-3xl mx-auto rounded-3xl border px-6 py-5 space-y-4"
      style={{
        background: 'rgba(15,15,18,0.7)',
        borderColor: 'rgba(196,124,46,0.2)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
      }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p
            className="syne-font uppercase tracking-[0.4em]"
            style={{ fontSize: 10, color: 'var(--film-amber)' }}
          >
            Export Options
          </p>
          <p className="body-font" style={{ fontSize: 12, color: 'var(--film-text-dim)' }}>
            Download the final poster or copy the API URL to reuse anywhere.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAdvanced}
          className="flex items-center gap-2 h-9 px-4 rounded-full syne-font text-[11px] uppercase tracking-widest transition-all"
          style={{
            border: '1px solid rgba(196,124,46,0.35)',
            background: 'rgba(196,124,46,0.12)',
            color: 'var(--film-cream)',
          }}
        >
          <ExternalLink size={12} />
          Open in Advanced Editor
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {EXTENSIONS.map((ext) => (
          <button
            key={ext}
            type="button"
            onClick={() => handleDownload(ext)}
            className="flex items-center justify-center gap-2 h-10 rounded-xl syne-font text-[11px] uppercase tracking-widest transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--film-cream)',
            }}
          >
            <Download size={12} style={{ color: 'var(--film-amber)' }} />
            {downloading === ext ? 'Downloading…' : ext}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 h-9 px-4 rounded-full syne-font text-[10px] uppercase tracking-widest transition-all"
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            background: copied ? 'rgba(196,124,46,0.18)' : 'rgba(255,255,255,0.03)',
            color: copied ? 'var(--film-cream)' : 'var(--film-text-dim)',
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied API URL' : 'Copy API URL'}
        </button>
        <span
          className="mono-font text-[9px] truncate max-w-full sm:max-w-[420px]"
          style={{ color: 'var(--film-text-dim)' }}
        >
          {apiUrl}
        </span>
      </div>
    </div>
  );
};

export default RevealAndExport;
