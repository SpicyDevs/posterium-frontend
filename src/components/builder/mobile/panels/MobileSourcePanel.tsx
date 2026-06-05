import React, { memo } from 'react';
import type { PosterConfig } from '../../types';
type MobileTokens = typeof import('../MobileBuilder').M;

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  tokens: MobileTokens;
}

const OPTION_STYLE: React.CSSProperties = {
  width: '100%',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.02)',
  color: 'var(--film-cream)',
  padding: '14px',
  textAlign: 'left',
  cursor: 'pointer',
};

const MobileSourcePanel: React.FC<Props> = memo(({ config, setConfig, tokens }) => {
  const toggleTextless = () => setConfig((prev) => ({ ...prev, textless: !prev.textless }));
  const cycleSource = () =>
    setConfig((prev) => ({ ...prev, source: prev.source === 'tmdb' ? 'poster' : 'tmdb' }));

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--film-cream)', marginBottom: 10 }}>Source</p>
      <div style={{ display: 'grid', gap: 12 }}>
        <button
          onClick={cycleSource}
          style={{ ...OPTION_STYLE, background: tokens.MID_BG }}
        >
          <div style={{ fontSize: 11, opacity: 0.72 }}>Media source</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{String(config.source)}</div>
        </button>

        <button
          onClick={toggleTextless}
          style={{
            ...OPTION_STYLE,
            background: config.textless ? tokens.AMBER_BG : tokens.MID_BG,
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.72 }}>Poster text overlay</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>
            {config.textless ? 'Textless' : 'Text visible'}
          </div>
        </button>
      </div>
    </div>
  );
});

MobileSourcePanel.displayName = 'MobileSourcePanel';
export default MobileSourcePanel;
