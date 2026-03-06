// src/components/layout/MobileDock.tsx
import React, { memo } from 'react';
import { Film, Layers, Monitor, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

const MobileDock: React.FC = memo(() => {
  const { activeTab, setActiveTab, setMobileSheetMode, mobileSheetMode } = useEditor();

  const handleTabClick = (tab: 'source' | 'layers' | 'canvas' | 'badge') => {
    setActiveTab(tab);
    setMobileSheetMode('half');
  };

  type NavId = 'source' | 'layers' | 'canvas' | 'badge';

  const NavItem = ({
    id,
    icon: Icon,
    label,
    shortcut,
  }: {
    id: NavId;
    icon: React.ElementType;
    label: string;
    shortcut?: string;
  }) => {
    const isActive = activeTab === id && mobileSheetMode !== 'hidden';

    return (
      <button
        onClick={() => handleTabClick(id)}
        role="tab"
        aria-selected={isActive}
        aria-label={shortcut ? `${label} (${shortcut})` : label}
        className={`
          flex flex-col items-center justify-center gap-1 p-2 flex-1 
          transition-all active:scale-90 rounded-lg mx-0.5
          ${isActive
            ? 'text-indigo-400 bg-indigo-500/10'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }
        `}
      >
        <Icon size={20} aria-hidden="true" />
        <span className="text-[10px] font-medium">{label}</span>
        {/* Active indicator dot */}
        <span
          className={`
            w-1 h-1 rounded-full transition-all duration-300
            ${isActive ? 'bg-indigo-400 opacity-100' : 'opacity-0'}
          `}
          aria-hidden="true"
        />
      </button>
    );
  };

  return (
    <nav
      role="tablist"
      aria-label="Editor panels"
      className="lg:hidden h-[calc(4rem+env(safe-area-inset-bottom))] bg-[#0c0c0e] border-t border-white/5 flex items-start pt-2 justify-around px-2 z-50 shrink-0 pb-[env(safe-area-inset-bottom)]"
    >
      <NavItem id="source" icon={Film} label="Source" />
      <NavItem id="layers" icon={Layers} label="Layers" />
      <NavItem id="canvas" icon={Monitor} label="Canvas" />
      <NavItem id="badge" icon={Sliders} label="Edit Badge" />
    </nav>
  );
});

MobileDock.displayName = 'MobileDock';

export default MobileDock;