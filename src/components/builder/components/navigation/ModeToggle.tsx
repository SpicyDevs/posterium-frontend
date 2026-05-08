import React, { memo } from 'react';

export type BuilderMode = 'simple' | 'advanced';

interface Props {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

const ModeToggle: React.FC<Props> = memo(({ mode, onChange }) => (
  <div
    className="flex items-center rounded-lg p-0.5 h-8"
    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,124,46,0.16)' }}
    aria-label="Builder mode"
  >
    {(['simple', 'advanced'] as const).map((item) => {
      const active = mode === item;
      return (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          aria-pressed={active}
          className="h-7 px-2.5 rounded-md syne-font text-[10px] font-bold uppercase tracking-wider transition-all"
          style={{
            color: active ? '#070706' : 'var(--film-text-dim)',
            background: active ? 'var(--film-amber)' : 'transparent',
          }}
        >
          {item}
        </button>
      );
    })}
  </div>
));

ModeToggle.displayName = 'ModeToggle';
export default ModeToggle;
