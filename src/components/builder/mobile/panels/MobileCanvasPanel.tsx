import React, { memo } from 'react';
import type { PosterConfig } from '../../types';
import type { ViewOptions } from '../../context/EditorContext';
type MobileTokens = typeof import('../MobileBuilder').M;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  viewOptions: ViewOptions;
  toggleViewOption: (key: keyof ViewOptions) => void;
  onOpenExport: () => void;
  onOpenReset: () => void;
  tokens: MobileTokens;
}

const ControlRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '14px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const MobileCanvasPanel: React.FC<Props> = memo(
  ({ config, setConfig, viewOptions, toggleViewOption, onOpenExport, onOpenReset, tokens }) => {
    const rowStyle = { ...ControlRow, background: tokens.MID_BG };
    const cycleSize = () => {
      const sizeOrder: PosterConfig['size'][] = ['small', 'medium', 'large'];
      const nextIndex = sizeOrder.indexOf(config.size) + 1;
      const nextSize = sizeOrder[nextIndex % sizeOrder.length];
      setConfig((prev) => ({ ...prev, size: nextSize }));
    };

    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--film-cream)' }}>Canvas</p>

        <button style={ControlRow} onClick={cycleSize}>
          <span style={{ fontSize: 12, color: 'rgba(240,230,204,0.74)' }}>Poster size</span>
          <strong style={{ fontSize: 13 }}>{config.size}</strong>
        </button>

        <button style={ControlRow} onClick={() => setConfig((prev) => ({ ...prev, posterBlur: Math.min(24, prev.posterBlur + 4) }))}>
          <span style={{ fontSize: 12, color: 'rgba(240,230,204,0.74)' }}>Poster blur</span>
          <strong style={{ fontSize: 13 }}>{config.posterBlur}px</strong>
        </button>

        <button style={ControlRow} onClick={() => toggleViewOption('showGrid')}>
          <span style={{ fontSize: 12, color: 'rgba(240,230,204,0.74)' }}>Grid overlay</span>
          <strong style={{ fontSize: 13 }}>{viewOptions.showGrid ? 'On' : 'Off'}</strong>
        </button>

        <button style={ControlRow} onClick={() => toggleViewOption('showSafeArea')}>
          <span style={{ fontSize: 12, color: 'rgba(240,230,204,0.74)' }}>Safe area</span>
          <strong style={{ fontSize: 13 }}>{viewOptions.showSafeArea ? 'On' : 'Off'}</strong>
        </button>

        <div style={{ display: 'grid', gap: 10 }}>
          <button
            onClick={onOpenExport}
            style={{
              ...ControlRow,
              justifyContent: 'center',
              background: 'var(--film-amber)',
              color: '#070706',
            }}
          >
            Export poster
          </button>
          <button
            onClick={onOpenReset}
            style={{
              ...ControlRow,
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--film-cream)',
            }}
          >
            Reset poster
          </button>
        </div>
      </div>
    );
  }
);

MobileCanvasPanel.displayName = 'MobileCanvasPanel';
export default MobileCanvasPanel;
