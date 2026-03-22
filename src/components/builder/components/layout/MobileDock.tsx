// src/components/builder/components/layout/MobileDock.tsx
import React, { memo } from 'react';
import { Film, Layers, Monitor, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

type TabId = 'source' | 'layers' | 'canvas' | 'badge';

const TABS: { id: TabId; Icon: React.ElementType; label: string }[] = [
  { id: 'source', Icon: Film,    label: 'Source' },
  { id: 'layers', Icon: Layers,  label: 'Layers' },
  { id: 'canvas', Icon: Monitor, label: 'Canvas' },
  { id: 'badge',  Icon: Sliders, label: 'Edit'   },
];

const MobileDock: React.FC = memo(() => {
  const { activeTab, setActiveTab, setMobileSheetMode, mobileSheetMode } = useEditor();

  const handleTab = (id: TabId) => {
    if (id === activeTab && mobileSheetMode !== 'hidden') { setMobileSheetMode('hidden'); return; }
    setActiveTab(id);
    setMobileSheetMode('half');
  };

  return (
    <nav role="tablist" aria-label="Editor panels" className="lg:hidden shrink-0 h-14 flex items-stretch border-t border-white/6 bg-[#0d0d0f] z-50 px-1 pb-[env(safe-area-inset-bottom,0px)]">
      {TABS.map(({ id, Icon, label }) => {
        const isActive = activeTab === id && mobileSheetMode !== 'hidden';
        return (
          <button key={id} role="tab" aria-selected={isActive} aria-controls="mobile-sheet" onClick={() => handleTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] rounded-xl mx-0.5 my-1 transition-all duration-150 active:scale-90 ${isActive ? 'bg-[#C47C2E]/12 text-[#D4A245]' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/4'}`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
            <span className={`text-[9px] font-medium tracking-wide ${isActive ? 'text-[#D4A245]' : 'text-zinc-600'}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
});

MobileDock.displayName = 'MobileDock';
export default MobileDock;
