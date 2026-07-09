import React, { memo } from 'react';
import SelectBox from './ui/SelectBox';

export type BuilderMode = 'simple' | 'advanced';

interface Props {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

const MODE_OPTIONS: { id: BuilderMode; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'advanced', label: 'Advanced' },
];

const ModeToggle: React.FC<Props> = memo(({ mode, onChange }) => (
  <>
    {/* Dropdown variant — below 80rem (xl), uses SelectBox to match
       the builder's other dropdown styling exactly. */}
    <div className="xl:hidden w-[90px]">
      <SelectBox
        value={mode}
        onChange={(v) => onChange(v as BuilderMode)}
        options={MODE_OPTIONS}
      />
    </div>

    {/* Segmented switcher — at 80rem (xl) and up, where there's enough
       width for the full pill control. */}
    <div
      className="hidden xl:flex items-center rounded-lg p-0.5 h-8"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,124,46,0.16)' }}
      aria-label="Builder mode"
    >
      {MODE_OPTIONS.map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className="h-7 px-2.5 rounded-md syne-font text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              color: active ? '#070706' : 'var(--film-text-dim)',
              background: active ? 'var(--film-amber)' : 'transparent',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  </>
));

ModeToggle.displayName = 'ModeToggle';
export default ModeToggle;
