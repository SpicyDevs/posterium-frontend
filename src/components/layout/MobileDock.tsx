import React from 'react';
import { Layers, Monitor, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

const MobileDock: React.FC = () => {
  const { activeTab, setActiveTab, setMobileSheetMode, mobileSheetMode } = useEditor();

  const handleTabClick = (tab: 'layers' | 'canvas' | 'badge') => {
    setActiveTab(tab);
    setMobileSheetMode('half'); // Open sheet on tap
  };

  const NavItem = ({ id, icon: Icon, label }: { id: 'layers' | 'canvas' | 'badge', icon: any, label: string }) => {
    // Determine active state: must match activeTab AND sheet must be open (or we are not checking for open-ness)
    // Fix: If sheet is hidden, no tab should look "active" in terms of opening a panel, 
    // BUT usually 'canvas' is the default view. 
    // The user requested "deselect the selected effect... because the panel is not yet opened".
    // So if hidden, we force inactive style.
    
    const isActive = activeTab === id && mobileSheetMode !== 'hidden';

    return (
      <button 
          onClick={() => handleTabClick(id)}
          className={`flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-all active:scale-90 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}
      >
          <Icon size={20} />
          <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))] bg-[#0c0c0e] border-t border-white/5 flex items-start pt-2 justify-around px-2 z-50 shrink-0 pb-[env(safe-area-inset-bottom)]">
        <NavItem id="layers" icon={Layers} label="Layers" />
        <NavItem id="canvas" icon={Monitor} label="Canvas" />
        <NavItem id="badge" icon={Sliders} label="Edit Badge" />
    </div>
  );
};

export default MobileDock;