import React, { memo } from 'react';
import clsx from 'clsx';

export interface PanelTab<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  visible?: boolean;
}

interface PanelTabsProps<T extends string> {
  tabs: readonly PanelTab<T>[];
  activeId: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

function PanelTabsComponent<T extends string>({
  tabs,
  activeId,
  onChange,
  ariaLabel,
}: PanelTabsProps<T>) {
  const visibleTabs = tabs.filter((tab) => tab.visible !== false);

  return (
    <div
      aria-label={ariaLabel}
      className="flex rounded-lg p-0.5 gap-0.5"
      style={{
        background: 'var(--film-char)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {visibleTabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={isActive}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none capitalize syne-font',
              !isActive && 'hover:bg-[rgba(196,124,46,0.08)] hover:text-[var(--film-text-label)]'
            )}
            style={{
              background: isActive ? 'var(--film-mid)' : 'transparent',
              color: isActive ? 'var(--film-cream)' : 'var(--film-text-dim)',
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const PanelTabs = memo(PanelTabsComponent) as typeof PanelTabsComponent;
export default PanelTabs;
