import React, { memo } from 'react';
import { Film, Layers, Monitor, Sliders, MousePointer2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

type TabId = 'source' | 'layers' | 'poster' | 'badges' | 'selection';

const MobileDock: React.FC<{
  hasBadges: boolean;
  hasLogo: boolean;
  isMinimalPreset: boolean;
  selectedCount: number;
}> = memo(({ hasBadges, hasLogo, isMinimalPreset, selectedCount }) => {
    const { activeTab, setActiveTab, setMobileSheetMode, mobileSheetMode } = useEditor();
    const badgesTabLabel = isMinimalPreset
      ? hasLogo
        ? 'Title/Logo'
        : 'Title'
      : hasBadges && hasLogo
        ? 'Badges/Logo'
        : hasLogo
          ? 'Logo'
          : 'Badges';
    const tabs: { id: TabId; Icon: React.ElementType; label: string; visible: boolean }[] = [
      { id: 'source', Icon: Film, label: 'Media', visible: true },
      { id: 'layers', Icon: Layers, label: 'Layers', visible: !isMinimalPreset },
      { id: 'poster', Icon: Monitor, label: 'Canvas', visible: true },
      { id: 'badges', Icon: Sliders, label: badgesTabLabel, visible: hasBadges || hasLogo || isMinimalPreset },
      {
        id: 'selection',
        Icon: MousePointer2,
        label: selectedCount > 0 ? `${selectedCount} selected` : 'Selection',
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
        aria-label="Builder mobile tabs"
        className="lg:hidden shrink-0 h-16 flex items-stretch border-t shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 px-1 pb-[env(safe-area-inset-bottom,0px)] relative overflow-hidden"
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
              id={`mobile-dock-tab-${id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls="builder-mobile-panel"
              tabIndex={0}
              onClick={() => handleTab(id)}
              className={`min-w-0 basis-0 flex-1 flex flex-col items-center justify-center gap-1 mx-0.5 my-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[rgba(196,124,46,0.1)]' : 'hover:bg-[rgba(196,124,46,0.07)] active:scale-95'}`}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{ color: isActive ? 'var(--film-amber)' : 'var(--film-text-dim)' }}
              />
              <span
                className={`text-[8px] font-semibold tracking-wide syne-font truncate max-w-full px-1 ${isActive ? 'text-[var(--film-amber)]' : 'text-[var(--film-text-dim)]'}`}
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
