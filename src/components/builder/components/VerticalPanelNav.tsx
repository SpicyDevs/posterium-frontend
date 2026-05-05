import React from 'react';
import { useEditor, type AdvancedPanelId } from '../context/EditorContext';
import { MousePointer2 } from 'lucide-react';

const PANELS: { id: AdvancedPanelId; label: string }[] = [
  { id: 'source', label: 'Source' },
  { id: 'poster', label: 'Poster' },
  { id: 'badges', label: 'Badges' },
  { id: 'layout', label: 'Layout' },
  { id: 'fallbacks', label: 'Fallbacks' },
];

export const VerticalPanelNav: React.FC = () => {
  const { advancedPanel, setAdvancedPanel, selectionEnabled, setSelectionEnabled } = useEditor();

  return (
    <div className="w-[140px] h-full flex flex-col border-r border-white/5 bg-[rgba(7,7,6,0.5)]">
      <div className="flex-1 py-4 flex flex-col gap-1">
        {PANELS.map((p) => {
          const active = advancedPanel === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setAdvancedPanel(p.id)}
              className={`
                h-10 px-4 flex items-center text-[11px] font-bold uppercase tracking-widest transition-all text-left
                ${active 
                  ? 'text-[var(--film-amber)] border-l-2 border-[var(--film-amber)] bg-[rgba(196,124,46,0.05)]' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border-l-2 border-transparent'}
              `}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => setSelectionEnabled(!selectionEnabled)}
          className={`
            w-full h-10 px-3 flex items-center gap-3 rounded-[var(--radius-sm)] text-[10px] font-bold uppercase tracking-wider transition-all
            ${selectionEnabled 
              ? 'bg-[var(--film-amber)] text-[var(--film-black)] shadow-[0_0_12px_rgba(196,124,46,0.2)]' 
              : 'bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'}
          `}
        >
          <MousePointer2 size={13} fill={selectionEnabled ? 'currentColor' : 'none'} />
          Selection
        </button>
      </div>
    </div>
  );
};

export default VerticalPanelNav;
