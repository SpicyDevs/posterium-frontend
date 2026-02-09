import React from 'react';
import { Layers, Monitor, Sliders } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';

const MobileDock: React.FC = () => {
  const { activeTab, setActiveTab, setMobileSheetMode } = useEditor();

  const handleTabClick = (tab: 'layers' | 'canvas' | 'badge') => {
    setActiveTab(tab);
    setMobileSheetMode('half'); // Open sheet on tap
  };

  const NavItem = ({ id, icon: Icon, label }: { id: 'layers' | 'canvas' | 'badge', icon: any, label: string }) => (
    <button 
        onClick={() => handleTabClick(id)}
        className={`flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-all active:scale-90 ${activeTab === id ? 'text-indigo-400' : 'text-zinc-500'}`}
    >
        <Icon size={20} />
        <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))] bg-[#0c0c0e] border-t border-white/5 flex items-start pt-2 justify-around px-2 z-50 shrink-0 pb-[env(safe-area-inset-bottom)]">
        <NavItem id="layers" icon={Layers} label="Layers" />
        <NavItem id="canvas" icon={Monitor} label="Canvas" />
        <NavItem id="badge" icon={Sliders} label="Edit Badge" />
    </div>
  );
};

export default MobileDock;