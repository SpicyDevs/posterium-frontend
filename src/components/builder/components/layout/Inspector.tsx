// src/components/builder/components/layout/Inspector.tsx
import React, { memo } from 'react';
import { useEditor } from '../../context/EditorContext';
import PropertyPanel from '../PropertyPanel';
import type { PosterConfig } from '../../types';
import { Globe, MousePointer2 } from 'lucide-react';
import clsx from 'clsx';
import SidebarLayout from '../SidebarLayout';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}
const INACTIVE_TAB_HOVER_CLASSES = 'hover:bg-white/[0.05] hover:text-[var(--film-text-dim)]';

const Inspector: React.FC<Props> = memo(({ config, setConfig }) => {
  const { activeTab, setActiveTab, selectedIds, clearSelection } = useEditor();
  const currentMode = selectedIds.size > 0 || activeTab === 'badge' ? 'selection' : 'global';
  const selCount = selectedIds.size;

  return (
    <SidebarLayout
      header={
        <div
          className="flex rounded-lg p-0.5"
          style={{
            background: 'var(--film-char)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <button
              onClick={() => {
                clearSelection();
                setActiveTab('canvas');
              }}
            aria-pressed={currentMode === 'global'}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none syne-font',
              currentMode !== 'global' && INACTIVE_TAB_HOVER_CLASSES
            )}
            style={{
              background: currentMode === 'global' ? 'var(--film-mid)' : 'transparent',
              color:
                currentMode === 'global' ? 'var(--film-cream)' : 'var(--film-text-dim)',
              boxShadow: currentMode === 'global' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <Globe size={11} strokeWidth={2} />
            Design
          </button>
          <button
            onClick={() => setActiveTab('badge')}
            aria-pressed={currentMode === 'selection'}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none syne-font',
              currentMode !== 'selection' && INACTIVE_TAB_HOVER_CLASSES
            )}
            style={{
              background: currentMode === 'selection' ? 'var(--film-mid)' : 'transparent',
              color:
                currentMode === 'selection' ? 'var(--film-cream)' : 'var(--film-text-dim)',
              boxShadow: currentMode === 'selection' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            <MousePointer2 size={11} strokeWidth={2} />
            {selCount > 0 ? `${selCount} selected` : 'Selection'}
          </button>
        </div>
      }
    >
      <PropertyPanel
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        viewMode={currentMode}
      />
    </SidebarLayout>
  );
});

Inspector.displayName = 'Inspector';
export default Inspector;
