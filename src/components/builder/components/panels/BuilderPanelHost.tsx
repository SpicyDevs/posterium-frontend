import React, { memo } from 'react';
import type { PosterConfig, RatingType } from '../../types';
import { getPanelMeta, isBuilderPanelId, type BuilderPanelId } from './panelTypes';
import SourcePanel from './SourcePanel';
import LayersPanel from './LayersPanel';
import PosterPanel from './PosterPanel';
import BadgesPanel from './BadgesPanel';
import SelectionPanel from './SelectionPanel';

interface BuilderPanelHostProps {
  panelId: string;
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  advanced?: boolean;
}

const PanelShell: React.FC<{ panelId: BuilderPanelId; children: React.ReactNode; advanced?: boolean }> = ({
  panelId,
  children,
  advanced,
}) => {
  if (!advanced) return <>{children}</>;
  const { Icon, label, description } = getPanelMeta(panelId);
  return (
    <div className="flex h-full flex-col bg-[var(--film-dark)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-[rgba(196,124,46,0.07)] bg-[rgba(196,124,46,0.015)] px-4 py-3">
        <Icon size={13} className="text-[var(--film-amber)]" />
        <span className="syne-font text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--film-amber)]">
          {label}
        </span>
        <span className="mono-font ml-auto text-[8px] text-[var(--film-text-ghost)]">{description}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

const BuilderPanelHost: React.FC<BuilderPanelHostProps> = memo(
  ({ panelId, config, setConfig, selectedIds, onSelect, advanced = false }) => {
    const normalizedPanelId = isBuilderPanelId(panelId) ? panelId : 'source';
    const common = { config, setConfig, selectedIds, onSelect, hideChrome: advanced };
    let panel: React.ReactNode;

    switch (normalizedPanelId) {
      case 'source':
        panel = <SourcePanel {...common} />;
        break;
      case 'layers':
        panel = <LayersPanel {...common} />;
        break;
      case 'poster':
        panel = <PosterPanel {...common} />;
        break;
      case 'badges':
        panel = <BadgesPanel config={config} setConfig={setConfig} hideChrome={advanced} />;
        break;
      case 'selection':
        panel = <SelectionPanel config={config} setConfig={setConfig} hideChrome={advanced} />;
        break;
    }

    return (
      <PanelShell panelId={normalizedPanelId} advanced={advanced}>
        {panel}
      </PanelShell>
    );
  }
);

BuilderPanelHost.displayName = 'BuilderPanelHost';
export default BuilderPanelHost;
