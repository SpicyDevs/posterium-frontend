// src/components/builder/components/ExportPopover.tsx
import React, { useEffect, useRef, memo } from 'react';
import { Download, X } from 'lucide-react';
import CodeBox from './CodeBox';
import type { PosterConfig, ExtensionType } from '../types';

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

  // Close on outside click
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

      {/* Embedded unified CodeBox */}
      <div className="px-4 py-4">
        <CodeBox
          config={config}
          onLoadConfig={onLoadConfig}
          baseUrl={baseUrl}
          onExtensionChange={onExtensionChange}
        />
      </div>
    </div>
  );
});
ExportPopover.displayName = 'ExportPopover';

export default ExportPopover;