import React, { memo } from 'react';
import { useEditor } from '../../context/EditorContext';
import type { PosterConfig } from '../../types';
import { BUILDER_PANELS } from './panelTypes';

interface AdvancedPanelListProps {
  config: PosterConfig;
}

const AdvancedPanelList: React.FC<AdvancedPanelListProps> = memo(({ config }) => {
  const { activeTab, setActiveTab, selectedIds, selectedLogo, selectedMinimalElements } = useEditor();
  const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0) + selectedMinimalElements.size;

  return (
    <div className="flex h-full flex-col bg-[var(--film-dark)]">
      <div className="shrink-0 px-4 py-3 border-b border-[rgba(196,124,46,0.07)]">
        <p className="syne-font text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--film-amber)]">
          Advanced Panels
        </p>
        <p className="mono-font mt-1 text-[8px] text-[var(--film-text-ghost)]">
          {config.ratings.length} badge{config.ratings.length === 1 ? '' : 's'} · {selectedCount} selected
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Builder panels">
        {BUILDER_PANELS.map(({ id, label, description, Icon }) => {
          const active = activeTab === id || (activeTab === 'logo' && id === 'selection');
          const badge = id === 'selection' && selectedCount > 0 ? selectedCount : null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={active ? 'page' : undefined}
              className="group flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-all"
              style={{
                borderLeftColor: active ? 'var(--film-amber)' : 'transparent',
                background: active ? 'rgba(196,124,46,0.08)' : 'transparent',
                color: active ? 'var(--film-cream)' : 'var(--film-text-dim)',
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
                style={{
                  background: active ? 'rgba(196,124,46,0.14)' : 'rgba(255,255,255,0.03)',
                  borderColor: active ? 'rgba(196,124,46,0.28)' : 'rgba(255,255,255,0.06)',
                  color: active ? 'var(--film-amber)' : 'inherit',
                }}
              >
                <Icon size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="syne-font text-[11px] font-bold uppercase tracking-wider">{label}</span>
                  {badge !== null && (
                    <span className="mono-font rounded-full bg-[var(--film-amber)] px-1.5 py-0.5 text-[8px] font-bold text-[#070706]">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="mono-font mt-0.5 block truncate text-[8px] text-[var(--film-text-ghost)]">
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
});

AdvancedPanelList.displayName = 'AdvancedPanelList';
export default AdvancedPanelList;
