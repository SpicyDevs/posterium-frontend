import React, { memo } from 'react';
type MobileTokens = typeof import('./MobileBuilder').M;

interface Props {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  selectedLogo: boolean;
  clearSelection: () => void;
  onOpenExport: () => void;
  onOpenReset: () => void;
  tokens: MobileTokens;
}

const MobileInspectorDrawer: React.FC<Props> = memo(
  ({ open, onClose, selectedCount, selectedLogo, clearSelection, onOpenExport, onOpenReset, tokens }) => (
    <div
      aria-hidden={!open}
      style={{
        position: 'fixed',
        top: tokens.HEADER_H + 12,
        right: 12,
        width: tokens.DRAWER_W,
        maxHeight: tokens.PANEL_H,
        zIndex: 30,
        padding: 16,
        borderRadius: 22,
        background: tokens.PANEL_BG,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        transform: open ? 'translateX(0)' : 'translateX(110%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <p
            className="syne-font"
            style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-cream)' }}
          >
            Inspector
          </p>
          <p style={{ fontSize: 11, color: 'rgba(240,230,204,0.54)', marginTop: 4 }}>
            Quick actions for active selection.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close inspector drawer"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: 'none',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--film-text-dim)',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginTop: 18, gap: 12, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p style={{ fontSize: 11, color: 'rgba(240,230,204,0.7)', marginBottom: 6 }}>Selection</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--film-cream)' }}>
            {selectedCount || 'No'} selected
          </p>
          {selectedLogo && (
            <p style={{ fontSize: 11, color: 'rgba(240,230,204,0.55)', marginTop: 4 }}>Logo overlay active</p>
          )}
        </div>

        <button
          onClick={clearSelection}
          style={{
            minHeight: 44,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--film-cream)',
            cursor: 'pointer',
          }}
        >
          Clear selection
        </button>

        <button
          onClick={onOpenExport}
          style={{
            minHeight: 44,
            borderRadius: 14,
            border: 'none',
            background: 'var(--film-amber)',
            color: '#070706',
            cursor: 'pointer',
          }}
        >
          Export poster
        </button>

        <button
          onClick={onOpenReset}
          style={{
            minHeight: 44,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            color: 'rgba(240,230,204,0.8)',
            cursor: 'pointer',
          }}
        >
          Reset builder
        </button>
      </div>
    </div>
  )
);

MobileInspectorDrawer.displayName = 'MobileInspectorDrawer';
export default MobileInspectorDrawer;
