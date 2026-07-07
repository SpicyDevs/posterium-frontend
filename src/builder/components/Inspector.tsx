import React, { memo } from 'react';
import { useEditor } from '../EditorContext';
import { BadgesPanel, SelectionPanel } from './panels';
import type { PosterConfig } from '../types';
import { Badge, MousePointer2 } from 'lucide-react';
import SidebarLayout from './SidebarLayout';
import PanelTabs from './PanelTabs';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  detailLevel?: 'simple' | 'advanced';
}

type InspectorTab = 'badges' | 'selection';
const isInspectorTab = (value: string): value is InspectorTab =>
  value === 'badges' || value === 'selection';

const Inspector: React.FC<Props> = memo(({ config, setConfig, detailLevel = 'simple' }) => {
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
  const activeInspectorTab = isInspectorTab(activeTab) ? activeTab : undefined;
  const currentTab = visibleTabs.some((tab) => tab.id === activeInspectorTab)
    ? activeInspectorTab
    : visibleTabs[0]?.id;

  if (!currentTab) return null;

  return (
    <SidebarLayout
      header={
        <PanelTabs
          ariaLabel="Inspector panels"
          activeId={currentTab}
          onChange={(id) => setActiveTab(id)}
          tabs={visibleTabs.map(({ id, label, Icon }) => ({
            id,
            label,
            icon: <Icon size={11} strokeWidth={2} />,
          }))}
        />
      }
    >
      {currentTab === 'badges' ? (
        <BadgesPanel
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          selectedLogo={selectedLogo}
          selectedMinimalElements={selectedMinimalElements}
          detailLevel={detailLevel}
        />
      ) : (
        <SelectionPanel
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          selectedLogo={selectedLogo}
          selectedMinimalElements={selectedMinimalElements}
          detailLevel={detailLevel}
        />
      )}
    </SidebarLayout>
  );
});

Inspector.displayName = 'Inspector';
export default Inspector;
