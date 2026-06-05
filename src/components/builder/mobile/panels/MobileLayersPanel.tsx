import React, { memo } from 'react';
import type { PosterConfig, RatingType } from '../../types';
type MobileTokens = typeof import('../MobileBuilder').M;

interface Props {
  config: PosterConfig;
  selectedIds: Set<RatingType>;
  selectedLogo: boolean;
  onSelect: (id: RatingType) => void;
  onSelectLogo: () => void;
  onDeselectAll: () => void;
  tokens: MobileTokens;
}

const MobileLayersPanel: React.FC<Props> = memo(
  ({ config, selectedIds, selectedLogo, onSelect, onSelectLogo, onDeselectAll, tokens }) => (
    <div style={{ background: tokens.MID_BG, borderRadius: 20, padding: 10 }}>
      <div style={{ display: 'flex', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--film-cream)', marginBottom: 4 }}>Layers</p>
          <p style={{ fontSize: 11, color: 'rgba(240,230,204,0.62)' }}>Tap a badge to select it.</p>
        </div>
        <button
          onClick={onDeselectAll}
          style={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--film-cream)',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          Clear
        </button>
      </div>

      <button
        onClick={onSelectLogo}
        style={{
          width: '100%',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: selectedLogo ? 'rgba(196,124,46,0.14)' : 'rgba(255,255,255,0.02)',
          padding: '14px',
          textAlign: 'left',
          color: 'var(--film-cream)',
          marginBottom: 14,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.75 }}>Logo</div>
        <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700 }}>Edit logo overlay</div>
      </button>

      <div style={{ display: 'grid', gap: 10 }}>
        {config.ratings.map((rating) => {
          const active = selectedIds.has(rating);
          return (
            <button
              key={rating}
              onClick={() => onSelect(rating)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.02)',
                color: 'var(--film-cream)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>{rating}</span>
              {active && <span style={{ fontSize: 11, color: 'var(--film-amber)' }}>Selected</span>}
            </button>
          );
        })}
      </div>
    </div>
  )
);

MobileLayersPanel.displayName = 'MobileLayersPanel';
export default MobileLayersPanel;
