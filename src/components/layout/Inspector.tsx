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
  const { activeTab, setActiveTab, selectedIds } = useEditor();

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
        {/* Tab Header */}
        <div className="flex items-center border-b border-white/5 bg-[#0c0c0e]">
            <button 
                onClick={() => setActiveTab('canvas')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'canvas' ? 'border-indigo-500 text-zinc-100' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
            >
                <Globe size={14} /> Canvas
            </button>
            <button 
                onClick={() => setActiveTab('badge')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'badge' ? 'border-indigo-500 text-zinc-100' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
            >
                <Layers size={14} /> 
                Badge <span className="bg-zinc-800 text-zinc-400 px-1.5 rounded-full text-[9px]">{selectedIds.size}</span>
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            <PropertyPanel 
                config={config} 
                setConfig={setConfig} 
                selectedIds={selectedIds} 
                // We pass a 'forceView' prop to tell PropertyPanel which mode to render
                // This requires updating PropertyPanel to accept this prop
                viewMode={activeTab === 'canvas' ? 'global' : 'selection'}
            />
        </div>
    </div>
  );
};

export default Inspector;