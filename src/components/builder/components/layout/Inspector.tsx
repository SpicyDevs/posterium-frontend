import React, { memo } from 'react';
import { useEditor } from '../../context/EditorContext';
import PropertyPanel from '../PropertyPanel';
import type { PosterConfig } from '../../types';
import { Badge, MousePointer2 } from 'lucide-react';
import SidebarLayout from '../SidebarLayout';
import PanelSwitcher from './PanelSwitcher';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  mode?: InspectorTab;
  hideTabBar?: boolean;
}

type InspectorTab = 'badges' | 'selection';
const isInspectorTab = (value: string): value is InspectorTab =>
  value === 'badges' || value === 'selection';

const Inspector: React.FC<Props> = memo(({ config, setConfig, mode, hideTabBar = false }) => {
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

  const tabs: { id: InspectorTab; label: string; Icon: React.ElementType; visible: boolean }[] = [
    {
      id: 'badges',
      label: primaryTabLabel,
      Icon: Badge,
      visible: hasBadges || hasLogo || isMinimalPreset,
    },
    {
      id: 'selection',
      label: selectedCount > 0 ? `${selectedCount} selected` : 'Selection',
      Icon: MousePointer2,
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
        hideTabBar ? null : (
          <PanelSwitcher
            ariaLabel="Builder inspector panels"
            activeId={currentTab}
            onChange={(id) => setActiveTab(id)}
            items={visibleTabs.map(({ id, label, Icon }) => ({
              id,
              label,
              icon: <Icon size={11} strokeWidth={2} />,
            }))}
          />
        )
      }
    >
      <PropertyPanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        selectedLogo={selectedLogo}
        selectedMinimalElements={selectedMinimalElements}
        mode={currentTab}
      />
    </SidebarLayout>
  );
});

Inspector.displayName = 'Inspector';
export default Inspector;
