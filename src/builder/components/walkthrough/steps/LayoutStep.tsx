import { memo, useCallback } from 'react';
import type { PosterConfig } from '@/types/poster';
import AlignmentGrid from '../../ui/AlignmentGrid';
import SegmentedRow from '../../ui/SegmentedRow';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface LayoutStepProps {
  config: PosterConfig;
  onChange: (updates: Partial<PosterConfig>) => void;
}

const layoutOptions = [
  { id: 'row', label: 'Row' },
  { id: 'col', label: 'Column' },
  { id: 'custom', label: 'Custom' },
];

const LayoutStep = memo<LayoutStepProps>(({ config, onChange }) => {
  // Switching to a non-custom layout/preset must drop stale per-badge x/y so
  // auto-positioning takes over — mirrors PropertyPanel.updateConfig.
  const setLayoutPreset = useCallback(
    (updates: Partial<PosterConfig>) => {
      onChange({
        ...updates,
        items: Object.fromEntries(
          Object.entries(config.items).map(([k, v]) => {
            if (!v) return [k, v];
            const { x: _x, y: _y, ...rest } = v;
            return [k, rest];
          })
        ),
      });
    },
    [config.items, onChange]
  );

  return (
    <div>
      <StepTitle>Badge Layout</StepTitle>
      <StepSubtitle>Choose how rating badges are arranged on the poster.</StepSubtitle>

      <div style={{ marginBottom: 24 }}>
        <SegmentedRow
          label="Layout direction"
          options={layoutOptions}
          value={config.layout}
          onChange={(v) => setLayoutPreset({ layout: v as PosterConfig['layout'] })}
          uppercaseLabel
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div
          className="syne-font"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--film-text-ghost)',
            marginBottom: 12,
          }}
        >
          Position preset
        </div>
        <AlignmentGrid value={config.preset} onChange={(v) => setLayoutPreset({ preset: v })} />
      </div>
    </div>
  );
});

LayoutStep.displayName = 'LayoutStep';
export default LayoutStep;
