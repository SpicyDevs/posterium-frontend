import React, { createContext, useContext, useState, useCallback } from 'react';
import { RatingType } from '../types';

type TabType = 'layers' | 'canvas' | 'badge';

interface EditorContextType {
  // Navigation State
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  
  // Mobile Specific
  isMobileSheetOpen: boolean;
  setMobileSheetOpen: (open: boolean) => void;
  
  // Selection State
  selectedIds: Set<RatingType>;
  handleSelection: (id: RatingType, multi: boolean) => void;
  clearSelection: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabType>('canvas');
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<RatingType>>(new Set());

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    // On mobile, switching tabs usually means opening the sheet
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
    
    // Auto-switch to Badge tab if we selected something
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

  return (
    <EditorContext.Provider value={{ 
        activeTab, setActiveTab, 
        isMobileSheetOpen, setMobileSheetOpen,
        selectedIds, handleSelection, clearSelection 
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