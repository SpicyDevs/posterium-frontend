import React, { memo } from 'react';
import clsx from 'clsx';

export interface PanelSwitcherItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  visible?: boolean;
}

interface Props<T extends string> {
  items: PanelSwitcherItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

const PanelSwitcher = <T extends string>({ items, value, onChange, className }: Props<T>) => {
  const visibleItems = items.filter((item) => item.visible !== false);

  return (
    <div
      className={clsx('flex rounded-lg p-0.5 gap-0.5', className)}
      style={{
        background: 'var(--film-char)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {visibleItems.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={active}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none syne-font',
              !active && 'hover:bg-[rgba(196,124,46,0.08)] hover:text-[var(--film-text-label)]'
            )}
            style={{
              background: active ? 'var(--film-mid)' : 'transparent',
              color: active ? 'var(--film-cream)' : 'var(--film-text-dim)',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default memo(PanelSwitcher) as typeof PanelSwitcher;
