import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onReset?: () => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (v: number) => string;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  onChange,
  onReset,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [inputText, setInputText] = useState(() => (formatValue ? formatValue(value) : `${value}`));
  const lastUpdate = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);
  const numberInputId = useId();
  const rangeInputId = useId();

  useEffect(() => {
    setLocalValue(value);
    if (!isFocused.current) setInputText(formatValue ? formatValue(value) : `${value}`);
  }, [value, formatValue]);

  const commitInput = useCallback(
    (text: string) => {
      const raw = text.replace(unit, '').replace(/[^0-9.\-]/g, '');
      const n = parseFloat(raw);
      if (!isNaN(n)) {
        const clamped = Math.max(min, Math.min(max, n));
        setLocalValue(clamped);
        setInputText(formatValue ? formatValue(clamped) : `${clamped}`);
        onChange(clamped);
      } else {
        setInputText(formatValue ? formatValue(localValue) : `${localValue}`);
      }
    },
    [min, max, onChange, unit, formatValue, localValue]
  );

  const handleRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setLocalValue(val);
      if (!isFocused.current) setInputText(formatValue ? formatValue(val) : `${val}`);
      const now = Date.now();
      if (now - lastUpdate.current > 33) {
        onChange(val);
        lastUpdate.current = now;
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onChange(val);
          lastUpdate.current = Date.now();
        }, 33);
      }
    },
    [onChange, formatValue]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitInput(inputText);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputText(formatValue ? formatValue(localValue) : `${localValue}`);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.key === 'ArrowUp' ? step : -step;
      const newVal = Math.max(min, Math.min(max, localValue + delta));
      setLocalValue(newVal);
      setInputText(formatValue ? formatValue(newVal) : `${newVal}`);
      onChange(newVal);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={numberInputId}
          className="body-font"
          style={{ fontSize: 11, color: 'var(--film-text-label)', fontWeight: 500 }}
        >
          {label}
        </label>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[9px] mono-font transition-colors"
            style={{ color: 'var(--film-text-dim)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-label)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
            }}
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          id={numberInputId}
          type="text"
          inputMode="decimal"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={() => {
            isFocused.current = true;
          }}
          onBlur={() => {
            isFocused.current = false;
            commitInput(inputText);
          }}
          onKeyDown={handleInputKeyDown}
          className="mono-font tabular-nums focus:outline-none shrink-0"
          style={{
            width: 48,
            height: 22,
            paddingInline: 5,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 10,
            color: 'var(--film-pale)',
            textAlign: 'center',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(196,124,46,0.4)';
          }}
          onMouseLeave={(e) => {
            if (!isFocused.current)
              (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        />
        <input
          id={rangeInputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleRangeChange}
          className="flex-1 min-w-0"
          aria-label={`${label} slider`}
        />
      </div>
    </div>
  );
};

export default SliderRow;
