// src/components/builder/components/ImportDialogue.tsx
import React, { memo, useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';

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
      const panelHeight = popoverRef.current?.offsetHeight ?? 200;
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

  const handleLoad = () => {
    if (val.trim()) {
      onLoad(val.trim());
      setVal('');
      onClose();
    }
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: popupCoords?.top ?? 52,
        right: popupCoords ? 'auto' : 12,
        left: popupCoords?.left,
        width: 320,
        zIndex: 50,
        background: 'rgba(18,17,14,0.96)',
        border: '1px solid rgba(196,124,46,0.16)',
        borderRadius: 12,
        boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.02)',
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

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(196,124,46,0.08)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download
            size={13}
            style={{ color: 'var(--film-amber)', transform: 'rotate(180deg)' }}
          />
          <span
            className="syne-font"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--film-cream)',
            }}
          >
            Import
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close import dialog"
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            background: 'transparent',
            border: 'none',
            color: 'var(--film-text-dim)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--film-text-label)';
            e.currentTarget.style.background = 'rgba(196,124,46,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--film-text-dim)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 16px 8px' }}>
        <p
          className="syne-font"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(196,124,46,0.65)',
            marginBottom: 8,
            margin: 0,
          }}
        >
          API URL
        </p>
        <div
          className="focus-within:ring-1 focus-within:ring-[#C47C2E]/50"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(196,124,46,0.12)',
            transition: 'all 0.2s',
          }}
        >
          <input
            type="url"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && val.trim()) {
                handleLoad();
              }
            }}
            placeholder="Paste API URL…"
            autoFocus
            spellCheck={false}
            aria-label="Paste API URL"
            className="focus:outline-none mono-font"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: 10,
              color: 'var(--film-text-dim)',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid rgba(196,124,46,0.08)',
        }}
      >
        <button
          onClick={() => {
            onClose();
            setVal('');
          }}
          className="syne-font"
          style={{
            flex: 1,
            height: 32,
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            border: '1px solid rgba(196,124,46,0.16)',
            background: 'rgba(196,124,46,0.04)',
            color: 'var(--film-text-dim)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(196,124,46,0.1)';
            e.currentTarget.style.color = 'var(--film-text-label)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(196,124,46,0.04)';
            e.currentTarget.style.color = 'var(--film-text-dim)';
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleLoad}
          disabled={!val.trim()}
          className="syne-font"
          style={{
            flex: 1,
            height: 32,
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transition: 'all 0.2s',
            background: val.trim() ? 'var(--film-amber)' : 'rgba(196,124,46,0.2)',
            border: '1px solid ' + (val.trim() ? 'var(--film-amber)' : 'rgba(196,124,46,0.2)'),
            color: val.trim() ? 'var(--film-dark)' : 'rgba(196,124,46,0.4)',
            cursor: val.trim() ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (val.trim()) {
              e.currentTarget.style.background = 'rgba(196,124,46,0.9)';
            }
          }}
          onMouseLeave={(e) => {
            if (val.trim()) {
              e.currentTarget.style.background = 'var(--film-amber)';
            }
          }}
        >
          Load
        </button>
      </div>
    </div>
  );
});
ImportDialog.displayName = 'ImportDialog';

export default ImportDialog;
