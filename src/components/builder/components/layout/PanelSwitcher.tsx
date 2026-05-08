import React from 'react';
import clsx from 'clsx';

export interface PanelSwitcherItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  items: readonly PanelSwitcherItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

const PanelSwitcher = <T extends string>({ items, activeId, onChange, ariaLabel }: Props<T>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className="flex rounded-lg p-0.5"
    style={{ background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.05)' }}
  >
    {items.map((item) => {
      const active = activeId === item.id;
      return (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(item.id)}
          className={clsx(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none capitalize syne-font',
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

export default PanelSwitcher;
