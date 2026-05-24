import React from 'react';
import clsx from 'clsx';
import type { PosterConfig } from '../../types';

export interface SkeletonLayoutOption {
  id: string;
  label: string;
  description: string;
  preset: PosterConfig['preset'];
  layout: PosterConfig['layout'];
  blocks: Array<{ x: number; y: number; w: number; h: number }>;
}

interface Props {
  options: SkeletonLayoutOption[];
  value: string | null;
  onChange: (option: SkeletonLayoutOption) => void;
}

const SkeletonLayoutSelector: React.FC<Props> = ({ options, value, onChange }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {options.map((option) => {
      const active = value === option.id;
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={active}
          className={clsx(
            'group relative text-left rounded-2xl border transition-all overflow-hidden',
            active ? 'shadow-[0_18px_50px_rgba(196,124,46,0.25)]' : 'shadow-none'
          )}
          style={{
            borderColor: active ? 'rgba(196,124,46,0.45)' : 'rgba(255,255,255,0.1)',
            background: active ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.02)',
          }}
        >
          <div className="p-4 space-y-3">
            <div
              className="relative w-full rounded-xl border"
              style={{
                height: 120,
                borderColor: active ? 'rgba(196,124,46,0.35)' : 'rgba(255,255,255,0.08)',
                background: 'rgba(7,7,8,0.45)',
              }}
            >
              {option.blocks.map((block, idx) => (
                <div
                  key={`${option.id}-${idx}`}
                  className="absolute rounded-md transition-all"
                  style={{
                    left: `${block.x}%`,
                    top: `${block.y}%`,
                    width: `${block.w}%`,
                    height: `${block.h}%`,
                    border: `1px solid ${
                      active ? 'rgba(196,124,46,0.8)' : 'rgba(255,255,255,0.2)'
                    }`,
                    background: active ? 'rgba(196,124,46,0.18)' : 'rgba(255,255,255,0.06)',
                    boxShadow: active ? '0 0 14px rgba(196,124,46,0.35)' : 'none',
                  }}
                />
              ))}
            </div>
            <div>
              <p
                className="syne-font uppercase tracking-[0.25em]"
                style={{
                  fontSize: 10,
                  color: active ? 'var(--film-cream)' : 'var(--film-text-label)',
                }}
              >
                {option.label}
              </p>
              <p
                className="body-font"
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: 'var(--film-text-dim)',
                }}
              >
                {option.description}
              </p>
            </div>
          </div>
        </button>
      );
    })}
  </div>
);

export default SkeletonLayoutSelector;
