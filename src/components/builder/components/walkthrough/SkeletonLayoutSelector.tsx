import React, { memo } from 'react';
import clsx from 'clsx';
import type { LayoutType, PosterConfig, PresetType } from '../../types';

interface LayoutOption {
  id: string;
  name: string;
  preset: PresetType;
  layout: LayoutType;
}

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const OPTIONS: LayoutOption[] = [
  { id: 'top-corners', name: 'Top Corners', preset: 'tl', layout: 'row' },
  { id: 'bottom-bar', name: 'Bottom Bar', preset: 'bc', layout: 'row' },
  { id: 'minimalist', name: 'Minimalist', preset: 'br', layout: 'col' },
];

const SkeletonLayoutSelector: React.FC<Props> = memo(({ config, setConfig }) => {
  const applyLayout = (preset: PresetType, layout: LayoutType) => {
    setConfig((prev) => {
      const newItems = { ...prev.items };
      (Object.keys(newItems) as (keyof typeof newItems)[]).forEach((k) => {
        const current = newItems[k];
        if (!current) return;
        const { x: _x, y: _y, ...rest } = current;
        newItems[k] = rest;
      });

      return { ...prev, preset, layout, items: newItems };
    });
  };

  return (
    <section className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
      {OPTIONS.map((item) => {
        const active = config.preset === item.preset && config.layout === item.layout;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => applyLayout(item.preset, item.layout)}
            className={clsx('rounded-xl p-4 border text-left transition-all', active && 'scale-[1.01]')}
            style={{
              borderColor: active ? 'var(--film-amber)' : 'rgba(255,255,255,0.14)',
              background: active ? 'rgba(196,124,46,0.1)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              className="h-32 rounded-lg border mb-3 relative"
              style={{ borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <div
                className="absolute inset-3 rounded border"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              />
              {item.layout === 'row' ? (
                <div
                  className="absolute h-3 rounded"
                  style={{
                    background: active ? 'var(--film-amber)' : 'rgba(255,255,255,0.2)',
                    width: '70%',
                    left: '15%',
                    top: item.preset.includes('t') ? 18 : item.preset.includes('b') ? 94 : 58,
                  }}
                />
              ) : (
                <div
                  className="absolute w-4 h-[52%] rounded"
                  style={{
                    background: active ? 'var(--film-amber)' : 'rgba(255,255,255,0.2)',
                    right: 22,
                    top: 24,
                  }}
                />
              )}
            </div>
            <p className="syne-font text-sm">{item.name}</p>
          </button>
        );
      })}
    </section>
  );
});

SkeletonLayoutSelector.displayName = 'SkeletonLayoutSelector';
export default SkeletonLayoutSelector;
