import React, { memo } from 'react';
import type { PosterConfig } from '../../types';
import Inspector from '../layout/Inspector';

interface RightInspectorPanelProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  onResizeStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  visible: boolean;
  width: number;
}

const RightInspectorPanel = memo<RightInspectorPanelProps>(
  ({ config, setConfig, onResizeStart, visible, width }) => (
    <aside
      aria-label="Inspector"
      className="hidden lg:flex flex-col z-20 relative shrink-0 sidebar-transition"
      style={{
        width: visible ? width : 0,
        background: 'var(--film-dark)',
        borderLeft: visible ? '1px solid rgba(196,124,46,0.07)' : 'none',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute inset-y-0 left-0 w-2 cursor-col-resize group z-50"
      >
        <div className="absolute inset-y-0 left-0 w-[2px] bg-transparent group-hover:bg-[rgba(196,124,46,0.4)] transition-colors duration-150" />
      </div>
      <Inspector config={config} setConfig={setConfig} />
    </aside>
  )
);

RightInspectorPanel.displayName = 'RightInspectorPanel';
export default RightInspectorPanel;
