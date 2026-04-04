import { memo, type ReactNode } from 'react';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeStyles = {
    sm: { fontSize: 10, padding: '5px 8px' },
    md: { fontSize: 11, padding: '6px 10px' },
  };

  return (
    <div style={{ display: 'inline-flex', gap: 6 }}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="syne-font"
            style={{
              borderRadius: 6,
              border: active
                ? '1px solid rgba(212,162,69,0.5)'
                : '1px solid rgba(255,255,255,0.08)',
              background: active ? 'rgba(196,124,46,0.24)' : 'rgba(255,255,255,0.03)',
              color: active ? 'var(--film-cream)' : 'var(--film-text-label)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              ...sizeStyles[size],
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const SegmentedControl = memo(SegmentedControlInner) as typeof SegmentedControlInner;

export default SegmentedControl;
