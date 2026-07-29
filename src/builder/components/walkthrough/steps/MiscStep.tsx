import { memo } from 'react';
import type { PosterConfig } from '@/types/poster';
import ToggleRow from '../../ui/ToggleRow';
import SelectBox from '../../ui/SelectBox';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface MiscStepProps {
  config: PosterConfig;
  onChange: (updates: Partial<PosterConfig>) => void;
}

const logoSourceOptions = [
  { id: 'fanart', label: 'Fanart.tv' },
  { id: 'tmdb', label: 'TMDB' },
  { id: 'metahub', label: 'Metahub' },
];

const MiscStep = memo<MiscStepProps>(({ config, onChange }) => (
  <div>
    <StepTitle>Additional Settings</StepTitle>
    <StepSubtitle>
      Fine-tune extra poster elements. All settings are optional and have sensible defaults.
    </StepSubtitle>

    <div
      style={{
        maxHeight: 340,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(196,124,46,0.12) transparent',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div
          className="syne-font"
          style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 12 }}
        >
          Title &amp; Logo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ToggleRow
            label="Show title"
            sub="Display the movie/TV show title on the poster"
            checked={config.titleEnabled !== false}
            onChange={(v) => onChange({ titleEnabled: v })}
          />
          <ToggleRow
            label="Show logo"
            sub="Display the studio/network logo"
            checked={config.logo}
            onChange={(v) => onChange({ logo: v })}
          />
          {config.logo && (
            <div style={{ marginTop: 4 }}>
              <SelectBox
                value={config.logoSource || 'fanart'}
                onChange={(v) => onChange({ logoSource: v as PosterConfig['logoSource'] })}
                options={logoSourceOptions}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          className="syne-font"
          style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 12 }}
        >
          Source Priority
        </div>
        <ToggleRow
          label="Textless poster"
          sub="Use version without title/logo text overlay"
          checked={config.textless}
          onChange={(v) => onChange({ textless: v })}
        />
      </div>
    </div>
  </div>
));

MiscStep.displayName = 'MiscStep';
export default MiscStep;
