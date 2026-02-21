import React, { createContext, useContext, useState, useCallback } from 'react';
import { RatingType } from '../types';

type TabType = 'layers' | 'canvas' | 'badge';
export type SheetMode = 'hidden' | 'half' | 'full';

interface ViewOptions {
  showSafeArea: boolean;
  showGrid: boolean;
}

interface EditorContextType {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Mobile Sheet State
  mobileSheetMode: SheetMode;
  setMobileSheetMode: (mode: SheetMode) => void;

  // Selection
  selectedIds: Set<RatingType>;
  handleSelection: (id: RatingType, multi: boolean) => void;
  setBatchSelection: (ids: RatingType[]) => void; // <--- New Batch Function
  clearSelection: () => void;

  // View Helpers
  viewOptions: ViewOptions;
  toggleViewOption: (key: keyof ViewOptions) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabType>('canvas');
  const [mobileSheetMode, setMobileSheetMode] = useState<SheetMode>('hidden');
  const [selectedIds, setSelectedIds] = useState<Set<RatingType>>(new Set());

  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showSafeArea: false,
    showGrid: false,
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    // On mobile, switching tabs opens the sheet to 'half' if it was hidden
    if (window.innerWidth < 768 && mobileSheetMode === 'hidden') {
      setMobileSheetMode('half');
    }
  };

  const handleSelection = useCallback(
    (id: RatingType, multi: boolean) => {
      const newSet = new Set(multi ? selectedIds : []);
      if (newSet.has(id)) {
        if (multi) newSet.delete(id);
        else newSet.clear();
      } else {
        newSet.add(id);
      }
      setSelectedIds(newSet);

      if (newSet.size > 0) {
        setActiveTab('badge');
      } else {
        setActiveTab('canvas');
      }
    },
    [selectedIds, mobileSheetMode]
  );

  // Fix for "Select All" bug: Set all IDs at once instead of toggling one by one
  const setBatchSelection = useCallback((ids: RatingType[]) => {
    setSelectedIds(new Set(ids));
    if (ids.length > 0) {
      setActiveTab('badge');
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setActiveTab('canvas');
  }, []);

  const toggleViewOption = (key: keyof ViewOptions) => {
    setViewOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <EditorContext.Provider
      value={{
        activeTab,
        setActiveTab,
        mobileSheetMode,
        setMobileSheetMode,
        selectedIds,
        handleSelection,
        setBatchSelection,
        clearSelection,
        viewOptions,
        toggleViewOption,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within an EditorProvider');
  return context;
};
