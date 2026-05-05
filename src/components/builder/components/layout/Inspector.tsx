import React, { memo } from 'react';
import { useEditor } from '../../context/EditorContext';
import PropertyPanel from '../PropertyPanel';
import type { PosterConfig } from '../../types';
import { Badge, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';
import SidebarLayout from '../SidebarLayout';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  hidePresets?: boolean;
  hideLogo?: boolean;
  panel?: 'poster' | 'badges' | 'layout' | 'fallbacks';
}

type InspectorTab = 'badges' | 'selection';
const INACTIVE_TAB_HOVER_CLASSES = 'hover:bg-white/[0.05] hover:text-[var(--film-text-dim)]';
const isInspectorTab = (value: string): value is InspectorTab =>
  value === 'badges' || value === 'selection';

const Inspector: React.FC<Props> = memo(({ config, setConfig, hidePresets, hideLogo, panel }) => {
  const { activeTab, setActiveTab, selectedIds, selectedLogo, selectedMinimalElements } = useEditor();
  const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0) + selectedMinimalElements.size;
  const isMinimalPreset = (config.uiPreset ?? 'b') === 'm';
  const hasBadges = config.ratings.length > 0;
  const hasLogo = config.logo;
  const primaryTabLabel = isMinimalPreset
    ? hasLogo
      ? 'Title / Logo'
      : 'Title'
    : hasBadges && hasLogo
      ? 'Badges / Logo'
      : hasLogo
        ? 'Logo'
        : 'Badges';

  const tabs: { id: InspectorTab; label: string; Icon: React.ElementType; visible: boolean }[] = [
    { id: 'badges', label: primaryTabLabel, Icon: Badge, visible: hasBadges || hasLogo || isMinimalPreset },
    {
      id: 'selection',
      label: selectedCount > 0 ? `${selectedCount} selected` : 'Selection',
      Icon: MousePointer2,
      visible: true,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.visible);
  const activeInspectorTab = isInspectorTab(activeTab) ? activeTab : undefined;
  const currentTab = visibleTabs.some((tab) => tab.id === activeInspectorTab)
    ? activeInspectorTab
    : visibleTabs[0]?.id;

  if (!currentTab) return null;

  return (
    <SidebarLayout
      header={
        <div
          className="flex rounded-lg p-0.5 gap-0.5"
          style={{
            background: 'var(--film-char)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {visibleTabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-pressed={currentTab === id}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none syne-font',
                currentTab !== id && INACTIVE_TAB_HOVER_CLASSES
              )}
              style={{
                background: currentTab === id ? 'var(--film-mid)' : 'transparent',
                color: currentTab === id ? 'var(--film-cream)' : 'var(--film-text-dim)',
                boxShadow: currentTab === id ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <Icon size={11} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      }
    >
      <PropertyPanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        selectedLogo={selectedLogo}
        selectedMinimalElements={selectedMinimalElements}
        mode={currentTab}
        hidePresets={hidePresets}
        hideLogo={hideLogo}
        panel={panel}
      />
    </SidebarLayout>
  );
});

Inspector.displayName = 'Inspector';
export default Inspector;
