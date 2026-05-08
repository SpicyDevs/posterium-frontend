import React from 'react';
import { PanelsTopLeft } from 'lucide-react';
import type { BuilderMode } from '../../types';

interface Props {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

const OPTIONS: { id: BuilderMode; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'advanced', label: 'Advanced' },
];

const BuilderModeToggle: React.FC<Props> = ({ mode, onChange }) => (
  <div
    className="flex items-center gap-1 h-8 p-0.5 rounded-lg border border-[rgba(196,124,46,0.18)] bg-[rgba(196,124,46,0.08)]"
    aria-label="Builder mode"
  >
    <PanelsTopLeft size={13} className="ml-1 text-[var(--film-amber)] hidden sm:block" />
    {OPTIONS.map((option) => {
      const active = mode === option.id;
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={active}
          className="h-6 px-2 rounded-md text-[10px] syne-font font-bold uppercase tracking-wider transition-all active:scale-95"
          style={{
            background: active ? 'var(--film-amber)' : 'transparent',
            color: active ? '#070706' : 'var(--film-text-dim)',
          }}
        >
          <span className={option.id === 'advanced' ? 'hidden min-[901px]:inline' : ''}>
            {option.label}
          </span>
          {option.id === 'advanced' && <span className="min-[901px]:hidden">Adv</span>}
        </button>
      );
    })}
  </div>
);

export default BuilderModeToggle;
