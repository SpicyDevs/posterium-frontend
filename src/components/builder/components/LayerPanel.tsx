import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { PosterConfig, RatingType } from '../types';
import { ALL_BADGES, DEFAULT_CONFIG } from '../types';
import { useEditor } from '../context/EditorContext';
import SidebarLayout from './SidebarLayout';
import PanelTabs from './navigation/PanelTabs';
import SourceTabContent from './layer-panel/SourceTabContent';
import LayersTabContent from './layer-panel/LayersTabContent';
import PosterTabContent from './layer-panel/PosterTabContent';

const BADGES_PREF_STORAGE_KEY = 'posterium_badges_toggle_pref_v1';
const TEXTLESS_PREF_STORAGE_KEY = 'posterium_textless_toggle_pref_v1';

const writeBadgesPreference = (enabled: boolean) => {
  try {
    localStorage.setItem(BADGES_PREF_STORAGE_KEY, enabled ? '1' : '0');
  } catch {}
};

const writeTextlessPreference = (enabled: boolean) => {
  try {
    localStorage.setItem(TEXTLESS_PREF_STORAGE_KEY, enabled ? '1' : '0');
  } catch {}
};

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  panelMode?: 'source' | 'layers' | 'poster';
  hideTabs?: boolean;
  detailLevel?: 'simple' | 'advanced';
}

const LayerPanel: React.FC<Props> = ({
  config,
  setConfig,
  selectedIds,
  onSelect,
  panelMode,
  hideTabs = false,
  detailLevel = 'simple',
}) => {
  const {
    setBatchSelection,
    activeTab,
    setActiveTab,
    selectedLogo,
    handleLogoSelection,
    setLiveRatings,
    setLiveTitle,
    setLiveYear,
    fallbackEnabled,
    setFallbackEnabled,
    viewOptions,
    toggleViewOption,
  } = useEditor();

  const isAdvanced = detailLevel === 'advanced';
  const [localMode, setLocalMode] = useState<'source' | 'layers' | 'poster'>(panelMode ?? 'source');
  const [inactiveOrder, setInactiveOrder] = useState<RatingType[]>([]);
  const savedActiveBadgesRef = useRef<RatingType[]>([]);
  const badgesVisible = config.ratings.length > 0;

  useEffect(() => {
    if (panelMode) {
      setLocalMode(panelMode);
      return;
    }
    if (activeTab === 'source' || activeTab === 'poster' || activeTab === 'layers')
      setLocalMode(activeTab);
  }, [activeTab, panelMode]);

  useEffect(() => {
    if ((config.uiPreset ?? 'b') !== 'b') {
      setConfig((prev) => ({ ...prev, uiPreset: 'b' }));
    }
  }, [config.uiPreset, setConfig]);

  useEffect(() => {
    writeTextlessPreference(config.textless);
  }, [config.textless]);

  const disableBadges = useCallback(
    ({ persistPreference = true }: { persistPreference?: boolean } = {}) => {
      if (persistPreference) writeBadgesPreference(false);
      setConfig((prev) => {
        if (prev.ratings.length > 0) {
          savedActiveBadgesRef.current = [...prev.ratings];
        }
        return { ...prev, ratings: [] };
      });
      setBatchSelection([]);
    },
    [setConfig, setBatchSelection]
  );

  const enableBadges = useCallback(() => {
    writeBadgesPreference(true);
    setConfig((prev) => {
      if (prev.ratings.length > 0) return prev;
      const restored = savedActiveBadgesRef.current.filter((id) =>
        ALL_BADGES.some((badge) => badge.id === id)
      );
      return { ...prev, ratings: restored.length > 0 ? restored : DEFAULT_CONFIG.ratings };
    });
  }, [setConfig]);

  const handleToggleVisibility = useCallback(
    (id: RatingType, visible: boolean) => {
      if (visible) {
        setConfig((prev) => {
          if (prev.ratings.includes(id)) return prev;
          if (id !== 'title' && id !== 'year') return { ...prev, ratings: [id, ...prev.ratings] };
          const nextItems = { ...prev.items, [id]: { ...(prev.items[id] ?? {}) } };
          const titleItem = nextItems[id];
          if (titleItem) {
            delete titleItem.x;
            delete titleItem.y;
          }
          return { ...prev, ratings: [id, ...prev.ratings], items: nextItems };
        });
        setInactiveOrder((prev) => prev.filter((x) => x !== id));
        onSelect(id, false);
        setActiveTab('selection');
      } else {
        setConfig((prev) => ({ ...prev, ratings: prev.ratings.filter((r) => r !== id) }));
        setInactiveOrder((prev) => [id, ...prev.filter((x) => x !== id)]);
      }
    },
    [onSelect, setActiveTab, setConfig]
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      // Drag end logic
    },
    [setConfig, fallbackEnabled]
  );

  return (
    <SidebarLayout
      side="left"
      bodyClassName="px-2 pt-2 pb-8"
      header={
        hideTabs ? null : (
          <PanelTabs
            ariaLabel="Builder content panels"
            activeId={localMode}
            onChange={(id) => setActiveTab(id)}
            tabs={[
              { id: 'source', label: 'Source', icon: null },
              { id: 'layers', label: 'Layers', icon: null },
              { id: 'poster', label: 'Poster', icon: null },
            ]}
          />
        )
      }
    >
      {localMode === 'source' && (
        <SourceTabContent
          config={config}
          setConfig={setConfig}
          disableBadges={disableBadges}
          enableBadges={enableBadges}
          badgesVisible={badgesVisible}
          setLiveRatings={setLiveRatings}
          setLiveTitle={setLiveTitle}
          setLiveYear={setLiveYear}
          detailLevel={detailLevel}
        />
      )}

      {localMode === 'poster' && (
        <PosterTabContent config={config} setConfig={setConfig} isAdvanced={isAdvanced} />
      )}

      {localMode === 'layers' && (
        <LayersTabContent
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          onSelect={onSelect}
          handleToggleVisibility={handleToggleVisibility}
          handleDragEnd={handleDragEnd}
          viewOptions={viewOptions}
          fallbackEnabled={fallbackEnabled}
          setFallbackEnabled={setFallbackEnabled}
        />
      )}
    </SidebarLayout>
  );
};

export default LayerPanel;