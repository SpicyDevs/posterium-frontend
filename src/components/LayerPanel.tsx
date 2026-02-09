import React from 'react';
import { PosterConfig, RatingType, ALL_BADGES } from '../types';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

const LayerPanel: React.FC<Props> = ({ config, setConfig, selectedIds, onSelect }) => {
  
  const toggleVisibility = (e: React.MouseEvent, id: RatingType) => {
    e.stopPropagation();
    const current = new Set(config.ratings);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    
    // Sort based on predefined order to keep visual consistency
    const sorted = ALL_BADGES.map(b => b.id).filter(id => current.has(id));
    setConfig({ ...config, ratings: sorted });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Layers</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {ALL_BADGES.map((badge) => {
          const isActive = config.ratings.includes(badge.id);
          const isSelected = selectedIds.has(badge.id);

          return (
            <div 
              key={badge.id}
              onClick={(e) => onSelect(badge.id, e.shiftKey || e.ctrlKey || e.metaKey)}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all text-sm
                ${isSelected ? 'bg-indigo-600/10 text-indigo-300' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}
                ${!isActive && !isSelected ? 'opacity-50' : ''}
              `}
            >
              <button 
                onClick={(e) => toggleVisibility(e, badge.id)}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${isActive ? 'text-zinc-300' : 'text-zinc-600'}`}
              >
                {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              <span className="flex-1 font-medium truncate select-none">{badge.label}</span>
              
              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-white/5 text-[10px] text-zinc-600">
        <p>Tip: Hold Shift to select multiple layers.</p>
      </div>
    </div>
  );
};

export default LayerPanel;