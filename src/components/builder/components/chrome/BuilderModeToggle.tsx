import React, { memo } from 'react';
import clsx from 'clsx';
import type { BuilderMode } from '../panels/panelTypes';

interface BuilderModeToggleProps {
  value: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

const MODES: Array<{ id: BuilderMode; label: string; shortLabel: string }> = [
  { id: 'simple', label: 'Simple', shortLabel: 'S' },
  { id: 'advanced', label: 'Advanced', shortLabel: 'A' },
];

const BuilderModeToggle: React.FC<BuilderModeToggleProps> = memo(({ value, onChange }) => (
  <div
    aria-label="Builder mode"
    className="flex h-8 rounded-lg p-0.5 gap-0.5"
    style={{ background: 'var(--film-char)', border: '1px solid rgba(196,124,46,0.16)' }}
  >
    {MODES.map((mode) => {
      const active = value === mode.id;
      return (
        <button
          key={mode.id}
          type="button"
          onClick={() => onChange(mode.id)}
          aria-pressed={active}
          className={clsx(
            'min-w-8 px-2 rounded-md text-[10px] syne-font font-bold uppercase tracking-wider transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
            !active && 'hover:bg-white/[0.05] hover:text-[var(--film-text-label)]'
          )}
          style={{
            background: active ? 'rgba(196,124,46,0.16)' : 'transparent',
            color: active ? 'var(--film-cream)' : 'var(--film-text-dim)',
            border: active ? '1px solid rgba(196,124,46,0.28)' : '1px solid transparent',
          }}
          title={`Switch to ${mode.label} builder mode`}
        >
          <span className="hidden min-[901px]:inline">{mode.label}</span>
          <span className="min-[901px]:hidden">{mode.shortLabel}</span>
        </button>
      );
    })}
  </div>
));

BuilderModeToggle.displayName = 'BuilderModeToggle';
export default BuilderModeToggle;
