import React, { memo } from 'react';
import { ChevronDown } from 'lucide-react';

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
    {/* Dropdown variant — used below the 80rem (xl) breakpoint, i.e. on
       mobile, tablet, and small desktop windows. */}
    <div className="relative flex items-center xl:hidden">
      <select
        value={mode}
        onChange={(e) => onChange(e.target.value as BuilderMode)}
        aria-label="Builder mode"
        className="h-8 pl-2.5 pr-6 rounded-lg syne-font text-[10px] font-bold uppercase tracking-wider appearance-none focus:outline-none cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(196,124,46,0.16)',
          color: 'var(--film-cream)',
        }}
      >
        {MODE_OPTIONS.map((opt) => (
          <option
            key={opt.id}
            value={opt.id}
            style={{ background: 'var(--film-mid)', color: 'var(--film-cream)' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        className="pointer-events-none absolute right-2"
        style={{ color: 'var(--film-text-dim)' }}
      />
    </div>

    {/* Segmented switcher — used at the 80rem (xl) breakpoint and up, where
       there's enough width for the full pill control. */}
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
