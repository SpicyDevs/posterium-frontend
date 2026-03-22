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

const Inspector: React.FC<Props> = memo(({ config, setConfig }) => {
  const { activeTab, setActiveTab, selectedIds, clearSelection } = useEditor();
  const currentMode = selectedIds.size > 0 || activeTab === 'badge' ? 'selection' : 'global';
  const selCount = selectedIds.size;

  return (
    <SidebarLayout
      header={
        <div className="flex bg-[#111113] rounded-lg p-0.5 border border-white/6">
          <button
            onClick={() => { clearSelection(); setActiveTab('canvas'); }}
            aria-pressed={currentMode === 'global'}
            className={clsx('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none', currentMode === 'global' ? 'bg-[#1c1c1f] text-zinc-100 shadow-sm' : 'text-zinc-600 hover:text-zinc-400')}
          >
            <Globe size={11} strokeWidth={2} />
            Canvas
          </button>
          <button
            onClick={() => setActiveTab('badge')}
            aria-pressed={currentMode === 'selection'}
            className={clsx('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 outline-none select-none', currentMode === 'selection' ? 'bg-[#1c1c1f] text-zinc-100 shadow-sm' : 'text-zinc-600 hover:text-zinc-400')}
          >
            <MousePointer2 size={11} strokeWidth={2} />
            {selCount > 0 ? `${selCount} selected` : 'Selection'}
          </button>
        </div>
      }
    >
      <PropertyPanel config={config} setConfig={setConfig} selectedIds={selectedIds} viewMode={currentMode} />
    </SidebarLayout>
  );
});

Inspector.displayName = 'Inspector';
export default Inspector;
