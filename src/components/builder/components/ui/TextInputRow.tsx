import React, { useRef, useState } from 'react';

interface TextInputRowProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}

const TextInputRow: React.FC<TextInputRowProps> = ({
  label,
  value,
  placeholder,
  onChange,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className="body-font"
          style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
        >
          {label}
        </span>
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="mono-font transition-colors"
            style={{ fontSize: 9, color: 'var(--film-text-dim)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
            }}
          >
            Clear
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full focus:outline-none body-font hover:border-[rgba(196,124,46,0.28)]"
        style={{
          height: 28,
          paddingInline: 8,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(196,124,46,0.4)' : 'rgba(255,255,255,0.1)'}`,
          fontSize: 11,
          color: 'var(--film-pale)',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  );
};

export default TextInputRow;
