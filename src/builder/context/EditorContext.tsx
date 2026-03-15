// src/context/EditorContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { RatingType } from '../types';

type TabType = 'source' | 'layers' | 'canvas' | 'badge';
export type SheetMode = 'hidden' | 'half' | 'full';

interface ViewOptions {
  showSafeArea: boolean;
  showGrid: boolean;
}

interface EditorContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mobileSheetMode: SheetMode;
  setMobileSheetMode: (mode: SheetMode) => void;
  selectedIds: Set<RatingType>;
  handleSelection: (id: RatingType, multi: boolean) => void;
  setBatchSelection: (ids: RatingType[]) => void;
  clearSelection: () => void;
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

  // FIX: Memoize with stable identity (empty deps). Uses a functional updater for
  // setMobileSheetMode so it never captures stale mobileSheetMode from its own closure.
  // Previously this was an unstable inline function - setBatchSelection and clearSelection
  // captured the version from mount (mobileSheetMode was always 'hidden') because their
  // deps arrays were empty.
  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    setMobileSheetMode((prev) => {
      // Open the sheet on mobile only when it is fully hidden.
      if (typeof window !== 'undefined' && window.innerWidth < 1024 && prev === 'hidden') {
        return 'half';
      }
      return prev;
    });
  }, []); // Stable forever - only uses state setters (which are always stable).

  // FIX: Use functional updater for setSelectedIds so we never read stale selectedIds
  // from the closure. Remove mobileSheetMode from deps (setActiveTab handles it internally).
  const handleSelection = useCallback(
    (id: RatingType, multi: boolean) => {
      let nextSize = 0;
      setSelectedIds((prev) => {
        const next = new Set(multi ? prev : []);
        if (next.has(id)) {
          if (multi) next.delete(id);
          else next.clear();
        } else {
          next.add(id);
        }
        nextSize = next.size;
        return next;
      });
      // We compute nextSize synchronously inside the updater above (React flushes
      // state setters synchronously in event handlers in React 18).
      if (nextSize > 0) setActiveTab('badge');
      else setActiveTab('canvas');
    },
    [setActiveTab] // No longer depends on selectedIds or mobileSheetMode
  );

  // FIX: setActiveTab is now stable so these deps are correct and non-stale.
  const setBatchSelection = useCallback(
    (ids: RatingType[]) => {
      setSelectedIds(new Set(ids));
      if (ids.length > 0) setActiveTab('badge');
    },
    [setActiveTab]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setActiveTab('canvas');
  }, [setActiveTab]);

  const toggleViewOption = useCallback((key: keyof ViewOptions) => {
    setViewOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

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
