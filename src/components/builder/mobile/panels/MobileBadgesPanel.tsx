import React, { memo } from 'react';
import type { PosterConfig, RatingType } from '../../types';
type MobileTokens = typeof import('../MobileBuilder').M;
import MobileSelectionPanel from './MobileSelectionPanel';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<string>;
  selectedLogo: boolean;
  clearSelection: () => void;
  onOpenExport: () => void;
  tokens: MobileTokens;
}

const toggleShowText = (config: PosterConfig, setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>) => {
  setConfig((prev) => ({ ...prev, showText: !prev.showText }));
};

const toggleIcons = (setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>) => {
  setConfig((prev) => ({ ...prev, icon: !prev.icon }));
};

const MobileBadgesPanel: React.FC<Props> = memo(
  ({ config, setConfig, selectedIds, selectedLogo, clearSelection, onOpenExport, tokens }) => (
    <div style={{ background: tokens.DARK, borderRadius: 18, padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--film-cream)' }}>Badges</p>
          <p style={{ fontSize: 11, color: 'rgba(240,230,204,0.62)' }}>Quick defaults for badge styling.</p>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(196,124,46,0.8)' }}>{config.ratings.length} badges</span>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <button
          onClick={() => toggleShowText(config, setConfig)}
          style={{
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            padding: '14px',
            color: 'var(--film-cream)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(240,230,204,0.72)' }}>Show label text</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{config.showText ? 'Enabled' : 'Disabled'}</div>
        </button>

        <button
          onClick={() => toggleIcons(setConfig)}
          style={{
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            padding: '14px',
            color: 'var(--film-cream)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(240,230,204,0.72)' }}>Show icons</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{config.icon ? 'On' : 'Off'}</div>
        </button>

        <button
          onClick={() => setConfig((prev) => ({ ...prev, labelPos: prev.labelPos === 'below' ? 'left' : prev.labelPos === 'left' ? 'right' : 'below' }))}
          style={{
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)',
            padding: '14px',
            color: 'var(--film-cream)',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(240,230,204,0.72)' }}>Label position</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{config.labelPos ?? 'below'}</div>
        </button>

        <button
          onClick={() => onOpenExport()}
          style={{
            borderRadius: 16,
            border: 'none',
            background: 'var(--film-amber)',
            padding: '14px',
            color: '#070706',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Export badge layout
        </button>
      </div>

      <MobileSelectionPanel
        selectedIds={selectedIds}
        selectedLogo={selectedLogo}
        clearSelection={clearSelection}
        tokens={tokens}
      />
    </div>
  )
);

MobileBadgesPanel.displayName = 'MobileBadgesPanel';
export default MobileBadgesPanel;
