// src/components/layout/Inspector.tsx
import React from 'react';
import { useEditor } from '../../context/EditorContext';
import PropertyPanel from '../PropertyPanel';
import { PosterConfig } from '../../types';
import { Globe, Layers } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const Inspector: React.FC<Props> = ({ config, setConfig }) => {
  const { activeTab, setActiveTab, selectedIds, clearSelection } = useEditor();

  // If items are selected, force the "Selection" view mode. 
  // Otherwise, fallback to the explicitly clicked tab mode.
  const currentMode = selectedIds.size > 0 || activeTab === 'badge' ? 'selection' : 'global';

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      {/* Top Header Section matching LayerPanel's style */}
      <div className="p-3 border-b border-white/5 space-y-3 relative z-20 bg-[#0f0f11]">
        <div>
          <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1 block">
            Inspector View
          </label>
          <div className="flex bg-zinc-900/50 p-1 rounded-md border border-white/5">
            <button
              onClick={() => {
                clearSelection();
                setActiveTab('canvas');
              }}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-medium rounded transition-all',
                currentMode === 'global'
                  ? 'bg-[#18181b] text-indigo-400 shadow-sm border border-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )}
            >
              <Globe size={12} /> Canvas
            </button>
            <button
              onClick={() => setActiveTab('badge')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-1.5 text-[11px] font-medium rounded transition-all',
                currentMode === 'selection'
                  ? 'bg-[#18181b] text-indigo-400 shadow-sm border border-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )}
            >
              <Layers size={12} /> Selection {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] text-zinc-500 uppercase tracking-wider block">
            Status
          </label>
          <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 truncate">
            {selectedIds.size > 0
              ? `Editing ${selectedIds.size} badge${selectedIds.size > 1 ? 's' : ''}`
              : currentMode === 'selection'
                ? 'No Badge Selected'
                : 'Global Canvas Active'}
          </div>
        </div>
      </div>

      {/* Bottom scrollable area handling the properties panel naturally */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0c0c0e] relative">
        <PropertyPanel
          config={config}
          setConfig={setConfig}
          selectedIds={selectedIds}
          viewMode={currentMode}
        />
      </div>
    </div>
  );
};

export default Inspector;
