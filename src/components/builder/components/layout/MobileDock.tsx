// src/components/builder/components/layout/MobileDock.tsx
import React, { memo } from 'react';
import { Film, Layers, Monitor, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

type TabId = 'source' | 'layers' | 'canvas' | 'badge';

const TABS: { id: TabId; Icon: React.ElementType; label: string }[] = [
  { id: 'source', Icon: Film, label: 'Source' },
  { id: 'layers', Icon: Layers, label: 'Layers' },
  { id: 'canvas', Icon: Monitor, label: 'Canvas' },
  { id: 'badge', Icon: Sliders, label: 'Edit' },
];

const MobileDock: React.FC = memo(() => {
  const { activeTab, setActiveTab, setMobileSheetMode, mobileSheetMode } = useEditor();
const handleTab = (id: TabId) => {
    if (id === activeTab && mobileSheetMode !== 'hidden') {
      setMobileSheetMode('hidden');
      return;
    }
    setActiveTab(id);
    // REMADE MOBILE UI: Force 'full' fixed drawer instead of draggable sheet
    setMobileSheetMode('full'); 
  };

  return (
    <nav
      role="tablist"
      aria-label="Editor panels"
      className="lg:hidden shrink-0 h-16 flex items-stretch border-t shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 px-2 pb-[env(safe-area-inset-bottom,0px)]"
      style={{
        background: 'var(--film-dark)',
        borderColor: 'rgba(196,124,46,0.1)'
      }}
    >
      {TABS.map(({ id, Icon, label }) => {
        const isActive = activeTab === id && mobileSheetMode !== 'hidden';
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-controls="mobile-sheet"
            onClick={() => handleTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] rounded-xl mx-0.5 my-1 transition-all duration-150 active:scale-90 ${isActive ? 'bg-[#C47C2E]/12 text-[#D4A245]' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/4'}`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
            <span
              className={`text-[9px] font-medium tracking-wide ${isActive ? 'text-[#D4A245]' : 'text-zinc-600'}`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});

MobileDock.displayName = 'MobileDock';
export default MobileDock;
