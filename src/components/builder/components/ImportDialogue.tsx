// src/components/builder/components/ImportDialog.tsx
import React, { memo, useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { toastSuccess } from '@/lib/useToast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (url: string) => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const ImportDialog = memo<Props>(({ isOpen, onClose, onLoad, anchorRef }) => {
  const [val, setVal] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popupCoords, setPopupCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!anchorRef?.current) {
        setPopupCoords(null);
        return;
      }
      const rect = anchorRef.current.getBoundingClientRect();
      const width = 320;
      const panelHeight = popoverRef.current?.offsetHeight ?? 220;
      const margin = 12;
      const left = Math.min(
        Math.max(margin, rect.right - width),
        Math.max(margin, window.innerWidth - width - margin)
      );
      const spaceAbove = rect.top - margin;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const showAbove = spaceAbove > spaceBelow && spaceAbove >= panelHeight;
      const top = showAbove
        ? Math.max(margin, rect.top - panelHeight - 8)
        : Math.min(window.innerHeight - panelHeight - margin, rect.bottom + 8);
      setPopupCoords({ top, left });
    };

    updatePosition();

    const handler = (e: MouseEvent | TouchEvent) => {
      const target =
        'touches' in e ? (e.touches[0]?.target as Node) : ((e as MouseEvent).target as Node);
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
        animation: 'import-panel-in 0.18s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes import-panel-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2">
          <Download size={13} style={{ color: 'var(--film-amber)' }} className="rotate-180" />
          <span
            className="syne-font font-bold uppercase tracking-widest"
            style={{ fontSize: 10, color: 'var(--film-cream)' }}
          >
            Import
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
        <p
          className="syne-font uppercase tracking-widest mb-1.5"
          style={{ fontSize: 8, color: 'var(--film-text-dim)', fontWeight: 700 }}
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
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Paste Posterium API URL here..."
            className="flex-1 min-w-0 bg-transparent border-none outline-none mono-font"
            style={{ fontSize: 10, color: 'var(--film-text-dim)' }}
            autoFocus
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && val.trim()) {
                onLoad(val.trim());
                toastSuccess('Poster configuration loaded');
                setVal('');
                onClose();
              }
            }}
          />
        </div>
      </div>

      <div
        className="flex flex-col gap-2 px-4 pb-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}
      >
        <button
          onClick={() => {
            if (!val.trim()) return;
            onLoad(val.trim());
            toastSuccess('Poster configuration loaded');
            setVal('');
            onClose();
          }}
          className="w-full h-9 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] syne-font"
          style={{
            background: 'var(--film-amber)',
            color: '#070706',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            boxShadow: '0 0 20px rgba(196,124,46,0.25)',
            border: 'none',
          }}
        >
          Load Poster
        </button>
      </div>
    </div>
  );
});
ImportDialog.displayName = 'ImportDialog';

export default ImportDialog;
