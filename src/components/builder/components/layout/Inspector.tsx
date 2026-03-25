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
        <div
          className="flex w-full rounded-xl p-0.5 shadow-lg shadow-black/40"
          style={{
            background: 'linear-gradient(120deg, rgba(196,124,46,0.08), rgba(18,16,13,0.9))',
            border: '1px solid rgba(196,124,46,0.15)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <button
            onClick={() => { clearSelection(); setActiveTab('canvas'); }}
            aria-pressed={currentMode === 'global'}
            className={clsx('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 outline-none select-none', currentMode === 'global'
              ? 'bg-[#1c1c1f] text-[#F0E6CC] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-[#C47C2E]/35'
              : 'text-zinc-600 hover:text-zinc-400')}
          >
            <Globe size={11} strokeWidth={2} />
            Canvas
          </button>
          <button
            onClick={() => setActiveTab('badge')}
            aria-pressed={currentMode === 'selection'}
            className={clsx('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 outline-none select-none', currentMode === 'selection'
              ? 'bg-[#1c1c1f] text-[#F0E6CC] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ring-1 ring-[#C47C2E]/35'
              : 'text-zinc-600 hover:text-zinc-400')}
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
