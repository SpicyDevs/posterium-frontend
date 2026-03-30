import React, { memo } from 'react';
import { Film, Layers, Monitor, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

type TabId = 'source' | 'layers' | 'canvas' | 'badge';

const TABS: { id: TabId; Icon: React.ElementType; label: string }[] = [
  { id: 'source', Icon: Film, label: 'Media' },
  { id: 'layers', Icon: Layers, label: 'Badges' },
  { id: 'canvas', Icon: Monitor, label: 'Global' },
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
    setMobileSheetMode('full');
  };

  return (
    <nav
      role="tablist"
      className="lg:hidden shrink-0 h-16 flex items-stretch border-t shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 px-2 pb-[env(safe-area-inset-bottom,0px)] relative"
      style={{
        background: '#0a0908',
        borderColor: 'rgba(196,124,46,0.15)'
      }}
    >
      {TABS.map(({ id, Icon, label }) => {
        const isActive = activeTab === id && mobileSheetMode !== 'hidden';
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 mx-1 my-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[rgba(196,124,46,0.1)]' : 'hover:bg-[rgba(196,124,46,0.07)] active:scale-95'}`}
          >
            {isActive ? (
              <div className="relative">
                 <Icon size={18} strokeWidth={2.5} style={{ color: 'var(--film-amber)' }} />
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--film-amber)] shadow-[0_0_8px_var(--film-amber)]" />
              </div>
            ) : (
              <Icon size={18} strokeWidth={1.8} style={{ color: 'var(--film-text-ghost)' }} />
            )}
            <span
              className={`text-[9px] font-semibold tracking-wide syne-font ${isActive ? 'text-[var(--film-amber)]' : 'text-[var(--film-text-ghost)]'}`}
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
