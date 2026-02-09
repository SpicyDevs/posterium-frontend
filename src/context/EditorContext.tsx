import React, { createContext, useContext, useState, useCallback } from 'react';
import { RatingType } from '../types';

type TabType = 'layers' | 'canvas' | 'badge';

interface ViewOptions {
  showSafeArea: boolean;
  showGrid: boolean;
}

interface EditorContextType {
  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  // Mobile
  isMobileSheetOpen: boolean;
  setMobileSheetOpen: (open: boolean) => void;
  
  // Selection
  selectedIds: Set<RatingType>;
  handleSelection: (id: RatingType, multi: boolean) => void;
  clearSelection: () => void;

  // View Helpers (New)
  viewOptions: ViewOptions;
  toggleViewOption: (key: keyof ViewOptions) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabType>('canvas');
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<RatingType>>(new Set());
  
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showSafeArea: false,
    showGrid: false,
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    if (window.innerWidth < 768) {
        setMobileSheetOpen(true);
    }
  };

  const handleSelection = useCallback((id: RatingType, multi: boolean) => {
    const newSet = new Set(multi ? selectedIds : []);
    if (newSet.has(id)) {
        if (multi) newSet.delete(id);
        else newSet.clear(); 
    } else {
        newSet.add(id);
    }
    setSelectedIds(newSet);
    
    // Logic: Auto-switch tab based on selection state
    if (newSet.size > 0) {
        setActiveTab('badge');
    } else {
        setActiveTab('canvas');
    }
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
      setSelectedIds(new Set());
      setActiveTab('canvas');
  }, []);

  const toggleViewOption = (key: keyof ViewOptions) => {
      setViewOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <EditorContext.Provider value={{ 
        activeTab, setActiveTab, 
        isMobileSheetOpen, setMobileSheetOpen,
        selectedIds, handleSelection, clearSelection,
        viewOptions, toggleViewOption
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within an EditorProvider");
  return context;
};