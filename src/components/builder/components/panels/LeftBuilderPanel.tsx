import React, { memo } from 'react';
import type { PosterConfig, RatingType } from '../../types';
import LayerPanel from '../LayerPanel';

interface LeftBuilderPanelProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  visible: boolean;
  width: number;
}

const LeftBuilderPanel = memo<LeftBuilderPanelProps>(
  ({ config, setConfig, selectedIds, onSelect, onResizeStart, visible, width }) => (
    <aside
      aria-label="Layer panel"
      className="hidden lg:flex flex-col z-20 relative shrink-0 sidebar-transition"
      style={{
        width: visible ? width : 0,
        background: 'var(--film-dark)',
        borderRight: visible ? '1px solid rgba(196,124,46,0.07)' : 'none',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
      }}
    >
      <LayerPanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        onSelect={onSelect}
      />
      <div
        onMouseDown={onResizeStart}
        className="absolute inset-y-0 right-0 w-2 cursor-col-resize group z-50"
      >
        <div className="absolute inset-y-0 right-0 w-[2px] bg-transparent group-hover:bg-[rgba(196,124,46,0.4)] transition-colors duration-150" />
      </div>
    </aside>
  )
);

LeftBuilderPanel.displayName = 'LeftBuilderPanel';
export default LeftBuilderPanel;
