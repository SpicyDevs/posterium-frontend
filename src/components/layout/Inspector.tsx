// src/components/layout/Inspector.tsx
import React from 'react';
import { Tab } from '@headlessui/react'; // <--- Headless UI
import { useEditor } from '../../context/EditorContext';
import PropertyPanel from '../PropertyPanel';
import { PosterConfig } from '../../types';
import { Globe, Layers } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
}

const Inspector: React.FC<Props> = ({ config, setConfig }) => {
  const { activeTab, setActiveTab, selectedIds, clearSelection } = useEditor();

  // Mapping context strings to Tab indices (0: Canvas, 1: Badge)
  const tabIndex = activeTab === 'badge' ? 1 : 0;

  const handleIndexChange = (index: number) => {
    if (index === 0) {
      clearSelection(); // "Canvas" selected
      setActiveTab('canvas');
    } else {
      setActiveTab('badge');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e]">
      <Tab.Group selectedIndex={tabIndex} onChange={handleIndexChange}>
        <Tab.List className="flex items-center border-b border-white/5 bg-[#0c0c0e] px-2 pt-2">
          <Tab
            className={({ selected }) =>
              clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-md relative outline-none',
                selected
                  ? 'bg-[#18181b] text-indigo-400 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-1 after:bg-[#18181b]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )
            }
          >
            <Globe size={14} /> Canvas
          </Tab>
          <div className="w-px h-4 bg-white/10 mx-1 mb-2"></div>
          <Tab
            className={({ selected }) =>
              clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-wider transition-all rounded-t-md relative outline-none',
                selected
                  ? 'bg-[#18181b] text-indigo-400 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-1 after:bg-[#18181b]'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
              )
            }
          >
            <Layers size={14} />
            {selectedIds.size > 0 ? (
              <span className="flex items-center gap-1.5">
                Badge{' '}
                <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full text-[9px] min-w-[1.2em] text-center">
                  {selectedIds.size}
                </span>
              </span>
            ) : (
              'Selection'
            )}
          </Tab>
        </Tab.List>

        <Tab.Panels className="flex-1 overflow-hidden relative bg-[#18181b]">
          <Tab.Panel className="h-full focus:outline-none">
            <PropertyPanel
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              viewMode="global"
            />
          </Tab.Panel>
          <Tab.Panel className="h-full focus:outline-none">
            <PropertyPanel
              config={config}
              setConfig={setConfig}
              selectedIds={selectedIds}
              viewMode="selection"
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Inspector;
