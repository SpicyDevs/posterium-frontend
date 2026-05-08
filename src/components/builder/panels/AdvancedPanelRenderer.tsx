import React from 'react';
import { useEditor } from '../context/EditorContext';
import type { PosterConfig, RatingType } from '../types';
import SourcePanel from './left/SourcePanel';
import LayersPanel from './left/LayersPanel';
import PosterPanel from './left/PosterPanel';
import BadgesPanel from './right/BadgesPanel';
import SelectionPanel from './right/SelectionPanel';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

const AdvancedPanelRenderer: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  const { activeTab, selectedLogo, selectedMinimalElements } = useEditor();

  if (activeTab === 'source') {
    return (
      <SourcePanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        onSelect={onSelect}
        side="right"
      />
    );
  }
  if (activeTab === 'layers') {
    return (
      <LayersPanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        onSelect={onSelect}
        side="right"
      />
    );
  }
  if (activeTab === 'poster') {
    return (
      <PosterPanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        onSelect={onSelect}
        side="right"
      />
    );
  }
  if (activeTab === 'badges' || activeTab === 'logo') {
    return (
      <BadgesPanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        selectedLogo={selectedLogo}
        selectedMinimalElements={selectedMinimalElements}
      />
    );
  }

  return (
    <SelectionPanel
      config={config}
      setConfig={setConfig}
      selectedIds={selectedIds}
      selectedLogo={selectedLogo}
      selectedMinimalElements={selectedMinimalElements}
    />
  );
};

export default AdvancedPanelRenderer;
