// src/components/builder/components/ColorPicker.tsx
import React, { useState, useRef, useEffect, useId, memo } from 'react';
import clsx from 'clsx';

interface Props {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  showOpacity?: boolean;
  opacity?: number;
  onOpacityChange?: (v: number) => void;
  className?: string;
}

const PRESETS = [
  '#000000',
  '#18181b',
  '#27272a',
  '#3f3f46',
  '#ffffff',
  '#a1a1aa',
  '#C47C2E',
  '#D4A245',
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
    const normalize = (v: string) => {
      if (!v || v === 'Default') return '#000000';
      return v.startsWith('#') ? v : `#${v}`;
    };
    const [hex, setHex] = useState(normalize(value));
    useEffect(() => {
      setHex(normalize(value));
    }, [value]);

    const commit = (v: string) => {
      const clean = v.startsWith('#') ? v : `#${v}`;
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

    return (
      <div className={clsx('space-y-2', className)}>
        {label && <span className="sidebar-label">{label}</span>}
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
                  ? 'border-[#D4A245] scale-95 shadow-[0_0_6px_rgba(196,124,46,0.5)]'
                  : 'border-transparent hover:border-white/30'
              )}
              style={{ background: preset }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => nativeRef.current?.click()}
            className="w-8 h-8 rounded-lg border border-white/15 shrink-0 overflow-hidden hover:scale-105 transition-transform active:scale-95 shadow-sm"
            title="Open color picker"
            style={{ background: hex }}
          >
            <span className="sr-only">Open color picker</span>
          </button>
          <input
            ref={nativeRef}
            type="color"
            value={hex.length === 7 ? hex : '#000000'}
            onChange={(e) => commit(e.target.value)}
            className="sr-only"
            tabIndex={-1}
          />
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 pointer-events-none">
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
              className="w-full h-8 pl-6 pr-3 rounded-lg bg-[#111113] border border-white/8 hover:border-[#C47C2E]/35 text-[11px] font-mono text-zinc-300 uppercase focus:outline-none focus-visible:border-[#C47C2E]/50 focus-visible:ring-1 focus-visible:ring-[#C47C2E]/30 transition-colors"
            />
          </div>
        </div>
        {showOpacity && onOpacityChange && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-zinc-400">Opacity</span>
              <span className="text-[10px] font-mono text-zinc-400">
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
