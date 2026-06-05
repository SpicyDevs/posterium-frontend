import React, { memo } from 'react';
import { Undo2, Redo2, Download } from 'lucide-react';

interface Props {
  contextLabel: string;
  anyPanelOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  exportOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  exportBtnRef: React.RefObject<HTMLButtonElement | null>;
}

export const MobileHeader = memo<Props>(
  ({
    contextLabel,
    anyPanelOpen,
    canUndo,
    canRedo,
    exportOpen,
    onUndo,
    onRedo,
    onExport,
    exportBtnRef,
  }) => (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        zIndex: 42,
        background: 'rgba(7,7,6,0.97)',
        borderBottom: '1px solid rgba(196,124,46,0.09)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 14,
        paddingRight: 10,
        gap: 0,
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(196,124,46,0.14) 30%, rgba(196,124,46,0.14) 70%, transparent 100%)',
        }}
      />

      <a
        href="/"
        style={{ textDecoration: 'none', flexShrink: 0, lineHeight: 1 }}
        aria-label="Posterium home"
      >
        <span
          className="poster-font"
          style={{
            fontSize: 15,
            color: 'var(--film-cream)',
            letterSpacing: '0.12em',
            userSelect: 'none',
          }}
        >
          POSTERIUM
        </span>
      </a>

      <div
        aria-hidden="true"
        style={{ width: 1, height: 14, background: 'rgba(196,124,46,0.18)', flexShrink: 0, margin: '0 10px' }}
      />

      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <span
          className="syne-font"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: anyPanelOpen ? 'rgba(196,124,46,0.7)' : 'rgba(240,230,204,0.28)',
            transition: 'color 0.2s ease',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contextLabel}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            color: canUndo ? 'rgba(240,230,204,0.6)' : 'rgba(140,130,112,0.2)',
            cursor: canUndo ? 'pointer' : 'default',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Undo2 size={14} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            color: canRedo ? 'rgba(240,230,204,0.6)' : 'rgba(140,130,112,0.2)',
            cursor: canRedo ? 'pointer' : 'default',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Redo2 size={14} />
        </button>

        <div
          aria-hidden="true"
          style={{ width: 1, height: 14, background: 'rgba(196,124,46,0.12)', margin: '0 4px' }}
        />

        <button
          ref={exportBtnRef}
          onClick={onExport}
          aria-label="Export poster"
          style={{
            height: 30,
            paddingInline: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            background: exportOpen ? 'rgba(196,124,46,0.8)' : 'var(--film-amber)',
            color: '#070706',
            border: 'none',
            borderRadius: 7,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            flexShrink: 0,
            transition: 'background 0.15s ease',
          }}
        >
          <Download size={12} />
          <span
            className="syne-font"
            style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}
          >
            EXPORT
          </span>
        </button>
      </div>
    </header>
  )
);

MobileHeader.displayName = 'MobileHeader';
export default MobileHeader;
