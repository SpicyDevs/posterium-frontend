import React, { memo } from 'react';
import { useEditor } from '../../context/EditorContext';
import type { PosterConfig } from '../../types';
import { Badge, MousePointer2 } from 'lucide-react';
import SidebarLayout from '../SidebarLayout';
import PanelSwitcher from '../navigation/PanelSwitcher';
import BadgesPanel from '../../panels/right/BadgesPanel';
import SelectionPanel from '../../panels/right/SelectionPanel';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  hideTabBar?: boolean;
  mode?: InspectorTab;
}

type InspectorTab = 'badges' | 'selection';
const isInspectorTab = (value: string): value is InspectorTab =>
  value === 'badges' || value === 'selection';

const Inspector: React.FC<Props> = memo(({ config, setConfig, hideTabBar = false, mode }) => {
  const { activeTab, setActiveTab, selectedIds, selectedLogo, selectedMinimalElements } =
    useEditor();
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

  const tabs = [
    {
      id: 'badges' as const,
      label: primaryTabLabel,
      icon: <Badge size={11} strokeWidth={2} />,
      visible: hasBadges || hasLogo || isMinimalPreset,
    },
    {
      id: 'selection' as const,
      label: selectedCount > 0 ? `${selectedCount} selected` : 'Selection',
      icon: <MousePointer2 size={11} strokeWidth={2} />,
      visible: true,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.visible);
  const activeInspectorTab = mode ?? (isInspectorTab(activeTab) ? activeTab : undefined);
  const currentTab = visibleTabs.some((tab) => tab.id === activeInspectorTab)
    ? activeInspectorTab
    : visibleTabs[0]?.id;

  if (!currentTab) return null;

  return (
    <SidebarLayout
      side="right"
      header={
        hideTabBar ? undefined : (
          <PanelSwitcher
            value={currentTab}
            onChange={(tab) => setActiveTab(tab)}
            items={visibleTabs}
          />
        )
      }
    >
      {currentTab === 'badges' ? (
        <BadgesPanel
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          selectedLogo={selectedLogo}
          selectedMinimalElements={selectedMinimalElements}
        />
      ) : (
        <SelectionPanel
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          selectedLogo={selectedLogo}
          selectedMinimalElements={selectedMinimalElements}
        />
      )}
    </SidebarLayout>
  );
});

Inspector.displayName = 'Inspector';
export default Inspector;
