import React, { memo } from 'react';
import { Badge, Film, Layers, Monitor, MousePointer2, Sliders } from 'lucide-react';
import clsx from 'clsx';
import type { PosterConfig } from '../types';
import type { TabType } from '../context/EditorContext';
import { useEditor } from '../context/EditorContext';
import SidebarLayout from '../components/SidebarLayout';

interface Props {
  config: PosterConfig;
  selectedCount: number;
}

const AdvancedPanelList: React.FC<Props> = memo(({ config, selectedCount }) => {
  const { activeTab, setActiveTab } = useEditor();
  const isMinimalPreset = (config.uiPreset ?? 'b') === 'm';
  const hasBadges = config.ratings.length > 0;
  const hasLogo = config.logo;

  const panels: {
    id: TabType;
    label: string;
    desc: string;
    Icon: React.ElementType;
    visible: boolean;
  }[] = [
    {
      id: 'source',
      label: 'Source',
      desc: 'Media search, IDs, poster source',
      Icon: Film,
      visible: true,
    },
    {
      id: 'layers',
      label: 'Layers',
      desc: 'Visibility, order, selection',
      Icon: Layers,
      visible: true,
    },
    {
      id: 'poster',
      label: 'Poster',
      desc: 'Canvas, overlays, output options',
      Icon: Monitor,
      visible: true,
    },
    {
      id: 'badges',
      label: hasLogo && !hasBadges ? 'Logo style' : 'Badge style',
      desc: 'Global badge and logo appearance',
      Icon: hasBadges || isMinimalPreset ? Badge : Sliders,
      visible: hasBadges || hasLogo || isMinimalPreset,
    },
    {
      id: 'selection',
      label: selectedCount > 0 ? `${selectedCount} selected` : 'Selection',
      desc: 'Fine tune selected layers',
      Icon: MousePointer2,
      visible: true,
    },
  ];

  return (
    <SidebarLayout side="left" bodyClassName="px-2 pt-3 pb-8">
      <div className="px-1 pb-3">
        <p className="syne-font uppercase tracking-[0.18em] text-[9px] font-bold text-[var(--film-text-dim)]">
          Advanced panels
        </p>
        <p className="mt-1 body-font text-[10px] leading-relaxed text-[var(--film-text-dim)]">
          Choose a system module, then edit it in the inspector on the right.
        </p>
      </div>
      <div className="space-y-1.5">
        {panels
          .filter((panel) => panel.visible)
          .map(({ id, label, desc, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-pressed={active}
                className={clsx(
                  'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all border',
                  active
                    ? 'bg-[rgba(196,124,46,0.14)] border-[rgba(196,124,46,0.28)] text-[var(--film-cream)]'
                    : 'bg-[rgba(255,255,255,0.025)] border-[rgba(255,255,255,0.045)] text-[var(--film-text-label)] hover:bg-[rgba(255,255,255,0.055)] hover:border-[rgba(196,124,46,0.18)]'
                )}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: active ? 'rgba(196,124,46,0.18)' : 'rgba(255,255,255,0.035)',
                    color: active ? 'var(--film-amber)' : 'var(--film-text-dim)',
                  }}
                >
                  <Icon size={14} />
                </span>
                <span className="min-w-0">
                  <span className="block syne-font text-[12px] font-bold uppercase tracking-wider truncate">
                    {label}
                  </span>
                  <span className="block body-font text-[10px] text-[var(--film-text-dim)] truncate mt-0.5">
                    {desc}
                  </span>
                </span>
              </button>
            );
          })}
      </div>
    </SidebarLayout>
  );
});

AdvancedPanelList.displayName = 'AdvancedPanelList';
export default AdvancedPanelList;
