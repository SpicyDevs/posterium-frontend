import React, { memo } from 'react';

export type BuilderMode = 'simple' | 'advanced' | 'walkthrough';

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
    {(
      [
        { id: 'walkthrough', label: 'Walkthrough' },
        { id: 'simple', label: 'Simple' },
        { id: 'advanced', label: 'Advanced' },
      ] as const
    ).map((item) => {
      const active = mode === item.id;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          aria-pressed={active}
          className="h-7 px-2.5 rounded-md syne-font text-[10px] font-bold uppercase tracking-[0.16em] transition-all"
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
));

ModeToggle.displayName = 'ModeToggle';
export default ModeToggle;
