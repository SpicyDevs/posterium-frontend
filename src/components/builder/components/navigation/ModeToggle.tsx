import React, { memo, useEffect, useRef } from 'react';

export type BuilderMode = 'simple' | 'advanced_v1' | 'advanced_v2';

interface Props {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

const ModeToggle: React.FC<Props> = memo(({ mode, onChange }) => {
  const isAdvanced = mode !== 'simple';
  const lastAdvancedModeRef = useRef<BuilderMode>('advanced_v2');

  useEffect(() => {
    if (mode !== 'simple') lastAdvancedModeRef.current = mode;
  }, [mode]);

  return (
    <div
      className="flex items-center rounded-lg p-0.5 h-8 gap-1"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,124,46,0.16)' }}
      aria-label="Builder mode"
    >
      <button
        type="button"
        onClick={() => onChange('simple')}
        aria-pressed={mode === 'simple'}
        className="h-7 px-2.5 rounded-md syne-font text-[10px] font-bold uppercase tracking-wider transition-all"
        style={{
          color: mode === 'simple' ? '#070706' : 'var(--film-text-dim)',
          background: mode === 'simple' ? 'var(--film-amber)' : 'transparent',
        }}
      >
        Simple
      </button>
      <button
        type="button"
        onClick={() =>
          onChange(
            isAdvanced
              ? mode === 'advanced_v1'
                ? 'advanced_v2'
                : 'advanced_v1'
              : lastAdvancedModeRef.current
          )
        }
        aria-pressed={isAdvanced}
        className="h-7 px-2.5 rounded-md syne-font text-[10px] font-bold uppercase tracking-wider transition-all"
        style={{
          color: isAdvanced ? '#070706' : 'var(--film-text-dim)',
          background: isAdvanced ? 'var(--film-amber)' : 'transparent',
        }}
      >
        Advanced
      </button>
      {isAdvanced && (
        <div
          className="flex items-center gap-1 rounded-md px-1 h-7"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          aria-label="Advanced version"
        >
          {(['advanced_v1', 'advanced_v2'] as const).map((item) => {
            const active = mode === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onChange(item)}
                aria-pressed={active}
                className="h-6 px-2 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  color: active ? '#070706' : 'var(--film-text-dim)',
                  background: active ? 'var(--film-amber)' : 'transparent',
                }}
              >
                {item === 'advanced_v1' ? 'v1' : 'v2'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

ModeToggle.displayName = 'ModeToggle';
export default ModeToggle;
