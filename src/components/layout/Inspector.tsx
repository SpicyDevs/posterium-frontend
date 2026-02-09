import React from 'react';
import { useEditor } from '../../context/EditorContext';
import PropertyPanel from '../PropertyPanel';
import { PosterConfig } from '../../types';
import { Globe, Layers } from 'lucide-react';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const Inspector: React.FC<Props> = ({ config, setConfig }) => {
  const { activeTab, setActiveTab, selectedIds, clearSelection } = useEditor();

  // Smart Tab Handler
  const handleTabChange = (tab: 'canvas' | 'badge') => {
      if (tab === 'canvas') {
          clearSelection(); // Solves the "Stuck" issue
      }
      setActiveTab(tab);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
        {/* Tab Header */}
        <div className="flex items-center border-b border-white/5 bg-[#0c0c0e] px-2 pt-2">
            <button 
                onClick={() => handleTabChange('canvas')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-md relative ${
                    activeTab === 'canvas' 
                    ? 'bg-[#18181b] text-indigo-400 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-1 after:bg-[#18181b]' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
            >
                <Globe size={14} /> Canvas
            </button>
            <div className="w-px h-4 bg-white/10 mx-1 mb-2"></div>
            <button 
                onClick={() => handleTabChange('badge')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-md relative ${
                    activeTab === 'badge' 
                    ? 'bg-[#18181b] text-indigo-400 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-1 after:bg-[#18181b]' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
            >
                <Layers size={14} /> 
                {selectedIds.size > 0 ? (
                    <span className="flex items-center gap-1.5">
                        Badge <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full text-[9px] min-w-[1.2em] text-center">{selectedIds.size}</span>
                    </span>
                ) : (
                    "Selection"
                )}
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-[#18181b]">
            <PropertyPanel 
                config={config} 
                setConfig={setConfig} 
                selectedIds={selectedIds} 
                viewMode={activeTab === 'canvas' ? 'global' : 'selection'}
            />
        </div>
    </div>
  );
};

export default Inspector;