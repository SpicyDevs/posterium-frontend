import React, { memo } from 'react';
import type { PosterConfig, RatingType } from '../types';
import { Layers } from 'lucide-react';
import SidebarLayout from './SidebarLayout';
import GlobalSettingsView from './property-panel/GlobalSettingsView';
import SelectionView from './property-panel/SelectionView';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  selectedLogo?: boolean;
  selectedMinimalElements?: Set<string>;
  viewMode?: 'global' | 'selection';
  mode?: 'badges' | 'logo' | 'selection';
  detailLevel?: 'simple' | 'advanced';
}

const PropertyPanel: React.FC<Props> = ({
  config,
  setConfig,
  selectedIds,
  selectedLogo = false,
  selectedMinimalElements = new Set<string>(),
  viewMode,
  mode,
  detailLevel = 'simple',
}) => {
  const panelMode = mode ?? (viewMode === 'selection' ? 'selection' : 'badges');
  const showGlobal = panelMode !== 'selection';
  const selectionCount = selectedIds.size + (selectedLogo ? 1 : 0) + selectedMinimalElements.size;

  // No selection placeholder
  if (
    panelMode === 'selection' &&
    selectedIds.size === 0 &&
    !selectedLogo &&
    selectedMinimalElements.size === 0
  )
    return (
      <SidebarLayout side="right">
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Layers
              size={18}
              strokeWidth={1.5}
              style={{ color: 'var(--film-text-dim)', opacity: 0.7 }}
            />
          </div>
          <div>
            <p
              className="syne-font font-semibold"
              style={{ fontSize: 12, color: 'var(--film-text-dim)' }}
            >
              Nothing selected
            </p>
            <p className="body-font mt-1" style={{ fontSize: 11, color: 'var(--film-text-dim)' }}>
              Click a layer on the canvas to edit
            </p>
          </div>
        </div>
      </SidebarLayout>
    );

  return (
    <SidebarLayout side="right" bodyClassName="pb-24">
      {showGlobal ? (
        <GlobalSettingsView
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          selectedLogo={selectedLogo}
          selectedMinimalElements={selectedMinimalElements}
          detailLevel={detailLevel}
        />
      ) : (
        <SelectionView
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
};

export default memo(PropertyPanel);