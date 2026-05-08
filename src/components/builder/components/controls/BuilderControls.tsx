import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Switch } from '@headlessui/react';
import clsx from 'clsx';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import ColorPicker from '../ColorPicker';

const SECTION_STORAGE_KEY = 'posterium_section_states_v2';

const readSectionStates = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(SECTION_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeSectionState = (id: string, open: boolean) => {
  try {
    const states = readSectionStates();
    localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify({ ...states, [id]: open }));
  } catch {}
};

export const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionId?: string;
  compact?: boolean;
}> = ({ title, icon, children, defaultOpen = true, sectionId, compact = false }) => {
  const [open, setOpen] = useState(() => {
    if (!sectionId) return defaultOpen;
    const states = readSectionStates();
    return sectionId in states ? states[sectionId] : defaultOpen;
  });

  const toggle = useCallback(() => {
    setOpen((value) => {
      const next = !value;
      if (sectionId) writeSectionState(sectionId, next);
      return next;
    });
  }, [sectionId]);

  const xPad = compact ? 'px-1' : 'px-3';
  const mx = compact ? 'mx-1' : 'mx-3';

  return (
    <div className={clsx('pt-5', !compact && 'first:pt-3')}>
      <button
        type="button"
        onClick={toggle}
        className={clsx(
          'w-full flex items-center justify-between mb-3 focus:outline-none group',
          xPad
        )}
      >
        <span
          className="flex items-center gap-1.5 syne-font uppercase tracking-widest"
          style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
        >
          {icon && <span style={{ color: 'var(--film-text-dim)', lineHeight: 0 }}>{icon}</span>}
          {title}
        </span>
        <span
          style={{
            color: 'var(--film-text-dim)',
            opacity: open ? 0.6 : 0.3,
            transition: 'opacity 0.15s',
            lineHeight: 0,
          }}
        >
          {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      </button>
      {open && <div className={clsx(xPad, 'pb-1 space-y-3.5')}>{children}</div>}
      <div
        className={clsx('mt-5', mx)}
        style={{ height: 1, background: 'rgba(255,255,255,0.04)' }}
        aria-hidden="true"
      />
    </div>
  );
};

export const SliderRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  onReset?: () => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (v: number) => string;
}> = ({ label, value, onChange, onReset, min, max, step = 1, unit = '', formatValue }) => {
  const [localValue, setLocalValue] = useState(value);
  const [inputText, setInputText] = useState(() => (formatValue ? formatValue(value) : `${value}`));
  const lastUpdate = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFocused = useRef(false);

  useEffect(() => {
    setLocalValue(value);
    if (!isFocused.current) setInputText(formatValue ? formatValue(value) : `${value}`);
  }, [value, formatValue]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const commitInput = useCallback(
    (text: string) => {
      const raw = text.replace(unit, '').replace(/[^0-9.\-]/g, '');
      const n = parseFloat(raw);
      if (!Number.isNaN(n)) {
        const clamped = Math.max(min, Math.min(max, n));
        setLocalValue(clamped);
        setInputText(formatValue ? formatValue(clamped) : `${clamped}`);
        onChange(clamped);
      } else {
        setInputText(formatValue ? formatValue(localValue) : `${localValue}`);
      }
    },
    [formatValue, localValue, max, min, onChange, unit]
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
    [formatValue, onChange]
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
          >
            Reset
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
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
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleRangeChange}
          className="flex-1 min-w-0"
        />
      </div>
    </div>
  );
};

export const ToggleRow: React.FC<{
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  small?: boolean;
  disabled?: boolean;
}> = ({ label, sub, checked, onChange, small, disabled }) => (
  <div
    className={clsx(
      'flex items-center justify-between gap-3',
      disabled && 'opacity-60 pointer-events-none'
    )}
  >
    <div className="min-w-0">
      <p
        className="body-font font-medium"
        style={{ fontSize: small ? 10 : 11, color: 'var(--film-text-label)' }}
      >
        {label}
      </p>
      {sub && (
        <p className="body-font mt-0.5" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
          {sub}
        </p>
      )}
    </div>
    <Switch
      checked={checked}
      onChange={onChange}
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
        checked ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
      )}
    >
      <span
        className={clsx(
          'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </Switch>
  </div>
);

export const SegmentedRow: React.FC<{
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="space-y-1.5">
    <p
      className="syne-font uppercase tracking-widest"
      style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
    >
      {label}
    </p>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={clsx(
            'h-8 rounded-md text-[10px] font-medium transition-all border syne-font',
            value === opt.id
              ? 'bg-[rgba(196,124,46,0.15)] text-[var(--film-pale)] border-[rgba(196,124,46,0.3)]'
              : 'bg-[rgba(255,255,255,0.03)] text-[var(--film-text-label)] border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.07)] hover:border-[rgba(196,124,46,0.24)] hover:text-[var(--film-cream)]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export const TextInputRow: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onClear?: () => void;
}> = ({ label, value, placeholder, onChange, onClear }) => {
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
          >
            Clear
          </button>
        )}
      </div>
      <input
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

export const SelectBox = memo(
  ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: { id: string; label: string }[];
  }) => (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton
          className="w-full flex items-center justify-between gap-1 h-9 px-2.5 rounded-lg text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E] syne-font"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--film-pale)',
          }}
        >
          <span className="truncate">{options.find((o) => o.id === value)?.label ?? value}</span>
          <ChevronDown size={10} style={{ color: 'var(--film-text-dim)', flexShrink: 0 }} />
        </ListboxButton>
        <ListboxOptions
          transition
          className="absolute z-50 mt-1 w-full py-1 rounded-xl shadow-2xl shadow-black/50 text-[11px] overflow-auto max-h-52 focus:outline-none transition duration-75 ease-in data-[closed]:scale-95 data-[closed]:opacity-0"
          style={{ background: 'var(--film-mid)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {options.map((opt) => (
            <ListboxOption
              key={opt.id}
              value={opt.id}
              className={({ active, selected }) =>
                clsx(
                  'flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors syne-font',
                  active && 'bg-[rgba(196,124,46,0.1)]',
                  !active && selected && 'text-[var(--film-pale)]',
                  !active && !selected && 'text-[var(--film-text-label)]'
                )
              }
            >
              {({ selected }) => (
                <>
                  <span className="flex-1 truncate">{opt.label}</span>
                  {selected && (
                    <Check size={10} style={{ color: 'var(--film-amber)', flexShrink: 0 }} />
                  )}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
);
SelectBox.displayName = 'SelectBox';

export const ColorRow: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  onReset?: () => void;
  showOpacity?: boolean;
  opacity?: number;
  onOpacityChange?: (v: number) => void;
}> = ({ label, value, onChange, onReset, showOpacity, opacity, onOpacityChange }) => (
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
