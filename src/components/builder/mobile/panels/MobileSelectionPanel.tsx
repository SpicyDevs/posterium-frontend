import React, { memo } from 'react';
type MobileTokens = typeof import('../MobileBuilder').M;

interface Props {
  selectedIds: Set<string>;
  selectedLogo: boolean;
  clearSelection: () => void;
  tokens: MobileTokens;
}

const MobileSelectionPanel: React.FC<Props> = memo(({ selectedIds, selectedLogo, clearSelection, tokens }) => {
  const selectionCount = selectedIds.size + (selectedLogo ? 1 : 0);
  if (selectionCount === 0) {
    return (
      <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', color: 'rgba(240,230,204,0.7)' }}>
        No selection active. Tap a badge or logo to edit specific settings.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: tokens.MID_BG }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 12, color: 'rgba(240,230,204,0.7)' }}>Selection</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--film-cream)' }}>
            {selectionCount} item{selectionCount > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={clearSelection}
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--film-cream)',
            padding: '8px 10px',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <button
          style={{
            width: '100%',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            padding: '12px 14px',
            textAlign: 'left',
            color: 'var(--film-cream)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.75 }}>Move selected badges</div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>Drag on canvas</div>
        </button>

        <button
          style={{
            width: '100%',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            padding: '12px 14px',
            textAlign: 'left',
            color: 'var(--film-cream)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.75 }}>Selection actions</div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>Use the inspector</div>
        </button>
      </div>
    </div>
  );
});

MobileSelectionPanel.displayName = 'MobileSelectionPanel';
export default MobileSelectionPanel;
