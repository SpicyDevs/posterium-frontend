import React from 'react';
import { Layers, Monitor, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

const MobileDock: React.FC = () => {
  const { activeTab, setActiveTab, setMobileSheetOpen } = useEditor();

  const handleTabClick = (tab: 'layers' | 'canvas' | 'badge') => {
    setActiveTab(tab);
    setMobileSheetOpen(true);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: 'layers' | 'canvas' | 'badge', icon: any, label: string }) => (
    <button 
        onClick={() => handleTabClick(id)}
        className={`flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-colors ${activeTab === id ? 'text-indigo-400' : 'text-zinc-500'}`}
    >
        <Icon size={20} />
        <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="md:hidden h-16 bg-[#0c0c0e] border-t border-white/5 flex items-center justify-around px-2 z-50 shrink-0 safe-area-bottom">
        <NavItem id="layers" icon={Layers} label="Layers" />
        <NavItem id="canvas" icon={Monitor} label="Canvas" />
        <NavItem id="badge" icon={Sliders} label="Edit Badge" />
    </div>
  );
};

export default MobileDock;