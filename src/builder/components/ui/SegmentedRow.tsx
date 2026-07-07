import React from 'react';
import clsx from 'clsx';

const INACTIVE_OPTION_HOVER_CLASSES =
  'bg-[rgba(255,255,255,0.03)] text-[var(--film-text-label)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(196,124,46,0.24)] hover:text-[var(--film-cream)]';

interface SegmentedRowProps {
  label: string;
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
  uppercaseLabel?: boolean;
  size?: 'sm' | 'md';
}

const SegmentedRow: React.FC<SegmentedRowProps> = ({
  label,
  options,
  value,
  onChange,
  uppercaseLabel = false,
  size = 'sm',
}) => (
  <div className="space-y-1.5">
    {uppercaseLabel ? (
      <p
        className="syne-font uppercase tracking-widest"
        style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
      >
        {label}
      </p>
    ) : (
      <span
        className="body-font"
        style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
      >
        {label}
      </span>
    )}
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={clsx(
            `${size === 'md' ? 'h-8' : 'h-7'} rounded-md text-[10px] font-medium transition-all border syne-font`,
            value === opt.id
              ? 'bg-[rgba(196,124,46,0.15)] text-[var(--film-pale)] border-[rgba(196,124,46,0.3)]'
              : INACTIVE_OPTION_HOVER_CLASSES
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export default SegmentedRow;
