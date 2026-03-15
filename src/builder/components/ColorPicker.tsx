// src/components/ColorPicker.tsx
import React, { useState, useRef, useEffect, useId, memo } from 'react';
import clsx from 'clsx';

interface Props {
  value: string; // CSS hex color, e.g. "#ffffff"
  onChange: (hex: string) => void;
  label?: string;
  showOpacity?: boolean; // show alpha slider (separate field)
  opacity?: number; // 0–1
  onOpacityChange?: (v: number) => void;
  className?: string;
}

// Common glassy / dark UI presets
const PRESETS = [
  '#000000',
  '#18181b',
  '#27272a',
  '#3f3f46',
  '#ffffff',
  '#a1a1aa',
  '#6366f1',
  '#818cf8',
  '#f43f5e',
  '#fb923c',
  '#facc15',
  '#34d399',
  '#38bdf8',
  '#c084fc',
  '#f472b6',
  '#84cc16',
];

const ColorPicker: React.FC<Props> = memo(
  ({
    value = '#000000',
    onChange,
    label,
    showOpacity = false,
    opacity = 1,
    onOpacityChange,
    className,
  }) => {
    const nativeRef = useRef<HTMLInputElement>(null);
    const hexId = useId();

    // Normalize incoming value to a clean hex string
    const normalize = (v: string) => {
      if (!v || v === 'Default') return '#000000';
      return v.startsWith('#') ? v : `#${v}`;
    };

    const [hex, setHex] = useState(normalize(value));

    // Sync external changes → internal state
    useEffect(() => {
      setHex(normalize(value));
    }, [value]);

    const commit = (v: string) => {
      const clean = v.startsWith('#') ? v : `#${v}`;
      // Only fire if it looks like a valid 6-char hex
      if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
        onChange(clean);
        setHex(clean);
      }
    };

    const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9a-fA-F#]/g, '');
      setHex(raw.startsWith('#') ? raw : `#${raw}`);
      if (/^#?[0-9a-fA-F]{6}$/.test(raw)) commit(raw);
    };

    const openNative = () => nativeRef.current?.click();

    return (
      <div className={clsx('space-y-2', className)}>
        {label && <span className="sidebar-label">{label}</span>}

        {/* Swatch grid */}
        <div className="grid grid-cols-8 gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => commit(preset)}
              title={preset}
              className={clsx(
                'w-full aspect-square rounded-md border-[1.5px] transition-all active:scale-90',
                normalize(value) === preset
                  ? 'border-indigo-400 scale-95 shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                  : 'border-transparent hover:border-white/30'
              )}
              style={{ background: preset }}
            />
          ))}
        </div>

        {/* Hex input + native picker button */}
        <div className="flex items-center gap-2">
          {/* Color swatch button - opens native picker */}
          <button
            type="button"
            onClick={openNative}
            className="w-8 h-8 rounded-lg border border-white/15 shrink-0tive overflow-hidden hover:scale-105 transition-transform active:scale-95 shadow-sm"
            title="Open color picker"
            style={{ background: hex }}
          >
            {/* Checkerboard for transparency hint */}
            <span className="sr-only">Open color picker</span>
          </button>

          {/* Hidden native input */}
          <input
            ref={nativeRef}
            type="color"
            value={hex.length === 7 ? hex : '#000000'}
            onChange={(e) => commit(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />

          {/* Hex text field */}
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-600 pointer-events-none">
              #
            </span>
            <input
              id={hexId}
              type="text"
              value={hex.replace('#', '').toUpperCase()}
              onChange={handleHexInput}
              maxLength={7}
              spellCheck={false}
              autoComplete="off"
              className="
              w-full h-8 pl-6 pr-3 rounded-lg
              bg-[#111113] border border-white/8
              text-[11px] font-mono text-zinc-300 uppercase
              focus:outline-none focus-visible:border-indigo-500/50 focus-visible:ring-1 focus-visible:ring-indigo-500/30
              transition-colors
            "
            />
          </div>
        </div>

        {/* Optional opacity slider */}
        {showOpacity && onOpacityChange && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-600">Opacity</span>
              <span className="text-[10px] font-mono text-zinc-500">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full"
              style={{
                // Gradient track from transparent → current color
                background: `linear-gradient(to right, transparent, ${hex})`,
                borderRadius: 99,
                height: 4,
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';
export default ColorPicker;
