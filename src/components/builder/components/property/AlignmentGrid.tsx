import React from 'react';
import clsx from 'clsx';
import type { PresetType } from '../../types';

const GRID_POSITIONS: { id: PresetType; label: string }[] = [
  { id: 'tl', label: 'Top left' },
  { id: 'tc', label: 'Top centre' },
  { id: 'tr', label: 'Top right' },
  { id: 'lc', label: 'Middle left' },
  { id: 'cc', label: 'Centre' },
  { id: 'rc', label: 'Middle right' },
  { id: 'bl', label: 'Bottom left' },
  { id: 'bc', label: 'Bottom centre' },
  { id: 'br', label: 'Bottom right' },
];

const AlignmentGrid: React.FC<{ value: PresetType; onChange: (v: PresetType) => void }> = ({
  value,
  onChange,
}) => (
  <div className="grid grid-cols-3 gap-1 w-[5.5rem]">
    {GRID_POSITIONS.map((pos) => (
      <button
        key={pos.id}
        type="button"
        onClick={() => onChange(pos.id)}
        title={pos.label}
        className={clsx(
          'w-full aspect-square rounded transition-all active:scale-90',
          value === pos.id
            ? 'shadow-[0_0_8px_rgba(196,124,46,0.4)] border border-[rgba(196,124,46,0.3)]'
            : 'border border-white/[0.06] hover:bg-white/[0.08] hover:border-[rgba(196,124,46,0.24)]'
        )}
        style={{ background: value === pos.id ? '#C47C2E' : 'rgba(255,255,255,0.03)' }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full mx-auto"
          style={{ background: value === pos.id ? 'white' : 'rgba(180,168,148,0.68)' }}
        />
      </button>
    ))}
  </div>
);

export default AlignmentGrid;
