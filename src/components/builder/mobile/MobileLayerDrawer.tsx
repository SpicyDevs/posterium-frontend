import React, { memo } from 'react';
import type { PosterConfig, RatingType } from '../types';
import MobileLayersPanel from './panels/MobileLayersPanel';

type MobileTokens = typeof import('./MobileBuilder').M;

interface Props {
  open: boolean;
  onClose: () => void;
  config: PosterConfig;
  selectedIds: Set<RatingType>;
  selectedLogo: boolean;
  onSelect: (id: RatingType) => void;
  onSelectLogo: () => void;
  onDeselectAll: () => void;
  tokens: MobileTokens;
}

const MobileLayerDrawer: React.FC<Props> = memo(
  ({ open, onClose, config, selectedIds, onSelect, onSelectLogo, onDeselectAll, tokens }) => {
    return (
      <div
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: tokens.HEADER_H + 12,
          left: 12,
          width: tokens.DRAWER_W,
          maxHeight: tokens.PANEL_H,
          zIndex: 30,
          padding: 16,
          borderRadius: 22,
          background: 'rgba(10,10,9,0.96)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          transform: open ? 'translateX(0)' : 'translateX(-110%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p
              className="syne-font"
              style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-cream)' }}
            >
              Layers
            </p>
            <p style={{ fontSize: 11, color: 'rgba(240,230,204,0.54)', marginTop: 4 }}>
              Select a badge or logo to inspect.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close layers drawer"
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

        <MobileLayersPanel
          config={config}
          selectedIds={selectedIds}
          selectedLogo={selectedLogo}
          onSelect={onSelect}
          onSelectLogo={onSelectLogo}
          onDeselectAll={onDeselectAll}
          tokens={tokens}
        />
      </div>
    );
  }
);

MobileLayerDrawer.displayName = 'MobileLayerDrawer';
export default MobileLayerDrawer;
