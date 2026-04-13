import React, { memo } from 'react';
import { Film, Layers, Monitor, Sliders, ImagePlay, MousePointer2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

type TabId = 'source' | 'layers' | 'poster' | 'badges' | 'logo' | 'selection';

const MobileDock: React.FC<{ hasLogo: boolean; hasBadges: boolean; selectedCount: number }> = memo(
  ({ hasLogo, hasBadges, selectedCount }) => {
    const { activeTab, setActiveTab, setMobileSheetMode, mobileSheetMode } = useEditor();
    const tabs: { id: TabId; Icon: React.ElementType; label: string; visible: boolean }[] = [
      { id: 'source', Icon: Film, label: 'Media', visible: true },
      { id: 'layers', Icon: Layers, label: 'Layers', visible: true },
      { id: 'poster', Icon: Monitor, label: 'Canvas', visible: true },
      { id: 'badges', Icon: Sliders, label: 'Badges', visible: hasBadges },
      { id: 'logo', Icon: ImagePlay, label: 'Logo', visible: hasLogo },
      {
        id: 'selection',
        Icon: MousePointer2,
        label: selectedCount > 0 ? `${selectedCount}` : 'Select',
        visible: true,
      },
    ];
    const visibleTabs = tabs.filter((tab) => tab.visible);

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
        className="lg:hidden shrink-0 h-16 flex items-stretch border-t shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 px-1 pb-[env(safe-area-inset-bottom,0px)] relative overflow-x-auto"
        style={{
          background: '#0a0908',
          borderColor: 'rgba(196,124,46,0.15)',
        }}
      >
        {visibleTabs.map(({ id, Icon, label }) => {
          const isActive = activeTab === id && mobileSheetMode !== 'hidden';
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTab(id)}
              className={`min-w-[68px] flex-1 flex flex-col items-center justify-center gap-1 mx-1 my-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[rgba(196,124,46,0.1)]' : 'hover:bg-[rgba(196,124,46,0.07)] active:scale-95'}`}
            >
              {isActive ? (
                <div className="relative">
                  <Icon size={18} strokeWidth={2.5} style={{ color: 'var(--film-amber)' }} />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--film-amber)] shadow-[0_0_8px_var(--film-amber)]" />
                </div>
              ) : (
                <Icon size={18} strokeWidth={1.8} style={{ color: 'var(--film-text-dim)' }} />
              )}
              <span
                className={`text-[9px] font-semibold tracking-wide syne-font ${isActive ? 'text-[var(--film-amber)]' : 'text-[var(--film-text-dim)]'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }
);

MobileDock.displayName = 'MobileDock';
export default MobileDock;
