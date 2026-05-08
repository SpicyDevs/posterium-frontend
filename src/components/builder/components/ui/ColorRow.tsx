import React from 'react';
import ColorPicker from '../ColorPicker';

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onReset?: () => void;
  showOpacity?: boolean;
  opacity?: number;
  onOpacityChange?: (v: number) => void;
}

const ColorRow: React.FC<ColorRowProps> = ({
  label,
  value,
  onChange,
  onReset,
  showOpacity,
  opacity,
  onOpacityChange,
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span
        className="body-font"
        style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
      >
        {label}
      </span>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mono-font transition-colors"
          style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
          }}
        >
          Reset
        </button>
      )}
    </div>
    <ColorPicker
      value={value}
      onChange={onChange}
      showOpacity={showOpacity}
      opacity={opacity}
      onOpacityChange={onOpacityChange}
    />
  </div>
);

export default ColorRow;
