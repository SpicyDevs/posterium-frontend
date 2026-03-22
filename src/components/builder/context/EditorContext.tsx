// src/components/builder/context/EditorContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { RatingType } from '../types';

type TabType = 'source' | 'layers' | 'canvas' | 'badge';
export type SheetMode = 'hidden' | 'half' | 'full';

interface ViewOptions { showSafeArea: boolean; showGrid: boolean; }

export type LiveRatings = Partial<Record<string, string>>;

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
  liveRatings: LiveRatings;
  setLiveRatings: (r: LiveRatings) => void;
  resolvedLogoSource: string | null;
  setResolvedLogoSource: (src: string | null) => void;
  /** Direct poster image URL (TMDB/fanart/etc.) — set by LayerPanel when media loads.
   *  Used by PreviewCanvas to show the raw poster without going through the SVG API. */
  livePosterUrl: string | null;
  setLivePosterUrl: (url: string | null) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabType>('canvas');
  const [mobileSheetMode, setMobileSheetMode] = useState<SheetMode>('hidden');
  const [selectedIds, setSelectedIds] = useState<Set<RatingType>>(new Set());
  const [viewOptions, setViewOptions] = useState<ViewOptions>({ showSafeArea: false, showGrid: false });
  const [liveRatings, setLiveRatings] = useState<LiveRatings>({});
  const [resolvedLogoSource, setResolvedLogoSource] = useState<string | null>(null);
  const [livePosterUrl, setLivePosterUrl] = useState<string | null>(null);

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
    setMobileSheetMode((prev) => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024 && prev === 'hidden') return 'half';
      return prev;
    });
  }, []);

  const handleSelection = useCallback((id: RatingType, multi: boolean) => {
    let nextSize = 0;
    setSelectedIds((prev) => {
      const next = new Set(multi ? prev : []);
      if (next.has(id)) { if (multi) next.delete(id); else next.clear(); }
      else next.add(id);
      nextSize = next.size;
      return next;
    });
    if (nextSize > 0) setActiveTab('badge');
    else setActiveTab('canvas');
  }, [setActiveTab]);

  const setBatchSelection = useCallback((ids: RatingType[]) => {
    setSelectedIds(new Set(ids));
    if (ids.length > 0) setActiveTab('badge');
  }, [setActiveTab]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setActiveTab('canvas');
  }, [setActiveTab]);

  const toggleViewOption = useCallback((key: keyof ViewOptions) => {
    setViewOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <EditorContext.Provider value={{
      activeTab, setActiveTab, mobileSheetMode, setMobileSheetMode,
      selectedIds, handleSelection, setBatchSelection, clearSelection,
      viewOptions, toggleViewOption,
      liveRatings, setLiveRatings,
      resolvedLogoSource, setResolvedLogoSource,
      livePosterUrl, setLivePosterUrl,
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within an EditorProvider');
  return context;
};