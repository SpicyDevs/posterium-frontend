import { memo } from 'react';
import SegmentedRow from '../../ui/SegmentedRow';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface IconStyleStepProps {
  iconType: number;
  onChange: (iconType: number) => void;
}

const ICON_STYLE_OPTIONS = [
  { id: '1', label: 'Default' },
  { id: '2', label: 'Alt' },
  { id: '3', label: 'Mono' },
];

const IconStyleStep = memo<IconStyleStepProps>(({ iconType, onChange }) => (
  <div>
    <StepTitle>Icon Style</StepTitle>
    <StepSubtitle>Choose how rating badge icons should appear across all badges.</StepSubtitle>

    <div style={{ maxWidth: 320 }}>
      <SegmentedRow
        label="Icon variant"
        options={ICON_STYLE_OPTIONS}
        value={String(iconType)}
        onChange={(v) => onChange(parseInt(v))}
        uppercaseLabel
      />
    </div>

    <div
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 10,
        background: 'rgba(14,13,11,0.72)',
        border: '1px solid rgba(196,124,46,0.14)',
      }}
    >
      <div
        className="body-font"
        style={{ fontSize: 10, color: 'var(--film-text-dim)', marginBottom: 8 }}
      >
        Preview
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {[1, 2, 3].map((t) => (
          <div
            key={t}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 6,
              background: iconType === t ? 'rgba(196,124,46,0.1)' : 'transparent',
              border: iconType === t ? '1px solid rgba(196,124,46,0.2)' : '1px solid transparent',
              fontSize: 10,
              color: iconType === t ? 'var(--film-cream)' : 'var(--film-text-dim)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 122.88 122.88" fill="#F5C518">
              <path d="M18.43,0h86.02c10.18,0,18.43,8.25,18.43,18.43v86.02c0,10.18-8.25,18.43-18.43,18.43H18.43C8.25,122.88,0,114.63,0,104.45l0-86.02C0,8.25,8.25,0,18.43,0z" />
            </svg>
            <span>{t === 1 ? 'IMDb 8.4' : t === 2 ? 'IMDb 8.4' : '8.4'}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
));

IconStyleStep.displayName = 'IconStyleStep';
export default IconStyleStep;
