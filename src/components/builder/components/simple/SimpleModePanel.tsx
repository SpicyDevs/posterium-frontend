import React from 'react';
import type { PosterConfig, PresetType, RatingType } from '../../types';
import { ALL_BADGES } from '../../types';
import SidebarLayout from '../SidebarLayout';
import { Section, SelectBox, ToggleRow } from '../ui';
import MediaPicker from './MediaPicker';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const SIMPLE_BADGE_IDS: RatingType[] = [
  'imdb',
  'rt',
  'rt_popcorn',
  'meta',
  'tmdb',
  'age',
  'runtime',
  'year',
  'title',
];

const PRESET_OPTIONS: { id: PresetType; label: string }[] = [
  { id: 'bl', label: 'Bottom Left' },
  { id: 'br', label: 'Bottom Right' },
  { id: 'tl', label: 'Top Left' },
  { id: 'tr', label: 'Top Right' },
  { id: 'bc', label: 'Bottom Center' },
  { id: 'tc', label: 'Top Center' },
];

const SimpleModePanel: React.FC<Props> = ({ config, setConfig }) => {
  const update = <K extends keyof PosterConfig>(key: K, value: PosterConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBadge = (id: RatingType, enabled: boolean) => {
    setConfig((prev) => {
      if (enabled && !prev.ratings.includes(id)) {
        return { ...prev, ratings: [...prev.ratings, id] };
      }
      if (!enabled) {
        return { ...prev, ratings: prev.ratings.filter((rating) => rating !== id) };
      }
      return prev;
    });
  };

  return (
    <SidebarLayout side="left" bodyClassName="px-2 pt-2 pb-8">
      <Section title="Media" sectionId="simple-media" inset="compact">
        <MediaPicker config={config} setConfig={setConfig} />
      </Section>

      <Section title="Theme" sectionId="simple-theme" inset="compact">
        <SelectBox
          value={config.theme}
          onChange={(value) => update('theme', value as PosterConfig['theme'])}
          options={[
            { id: 'glass', label: 'Glass' },
            { id: 'solid', label: 'Solid' },
          ]}
        />
      </Section>

      <Section title="Layout Preset" sectionId="simple-preset" inset="compact">
        <SelectBox
          value={config.preset === 'custom' ? 'bl' : config.preset}
          onChange={(value) => {
            update('preset', value as PresetType);
            update('layout', 'row');
          }}
          options={PRESET_OPTIONS}
        />
      </Section>

      <Section title="Badges" sectionId="simple-badges" inset="compact">
        {SIMPLE_BADGE_IDS.map((id) => {
          const label = ALL_BADGES.find((badge) => badge.id === id)?.label ?? id;
          return (
            <ToggleRow
              key={id}
              label={label}
              checked={config.ratings.includes(id)}
              onChange={(enabled) => toggleBadge(id, enabled)}
            />
          );
        })}
      </Section>
    </SidebarLayout>
  );
};

export default SimpleModePanel;
