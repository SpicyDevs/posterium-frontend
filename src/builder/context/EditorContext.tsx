// src/components/builder/context/EditorContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { RatingType } from '../types';

type TabType = 'source' | 'layers' | 'poster' | 'badges' | 'logo' | 'selection';

export interface ViewOptions {
  showSafeArea: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
}

export type LiveRatings = Partial<Record<string, string>>;

interface EditorContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedIds: Set<RatingType>;
  selectedLogo: boolean;
  selectedMinimalElements: Set<string>;
  handleSelection: (id: RatingType, multi: boolean) => void;
  handleMinimalSelection: (id: string, multi: boolean) => void;
  handleLogoSelection: (multi: boolean) => void;
  setBatchSelection: (ids: RatingType[]) => void;
  clearSelection: () => void;
  viewOptions: ViewOptions;
  toggleViewOption: (key: keyof ViewOptions) => void;
  liveRatings: LiveRatings;
  setLiveRatings: (r: LiveRatings) => void;
  liveTitle: string;
  setLiveTitle: (title: string) => void;
  liveYear: string;
  setLiveYear: (year: string) => void;
  resolvedLogoSource: string | null;
  setResolvedLogoSource: (src: string | null) => void;
  /** Direct poster image URL (TMDB/fanart/etc.) — set by LayerPanel when media loads.
   *  Used by PreviewCanvas to show the raw poster without going through the SVG API. */
  livePosterUrl: string | null;
  setLivePosterUrl: (url: string | null) => void;
  fallbackEnabled: boolean;
  setFallbackEnabled: (v: boolean) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabType>('source');
  const [selectedIds, setSelectedIds] = useState<Set<RatingType>>(new Set());
  const [selectedLogo, setSelectedLogo] = useState(false);
  const [selectedMinimalElements, setSelectedMinimalElements] = useState<Set<string>>(new Set());
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showSafeArea: false,
    showGrid: false,
    snapToGrid: true,
  });
  const [liveRatings, setLiveRatings] = useState<LiveRatings>({});
  const [liveTitle, setLiveTitle] = useState('');
  const [liveYear, setLiveYear] = useState('');
  const [resolvedLogoSource, setResolvedLogoSource] = useState<string | null>(null);
  const [livePosterUrl, setLivePosterUrl] = useState<string | null>(null);
  const [fallbackEnabled, setFallbackEnabled] = useState(false);

  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);
  }, []);

  const handleSelection = useCallback(
    (id: RatingType, multi: boolean) => {
      let nextSize = 0;
      let logoSelected = false;
      setSelectedIds((prev) => {
        const next = new Set(multi ? prev : []);
        if (next.has(id)) {
          if (multi) next.delete(id);
          else next.clear();
        } else next.add(id);
        nextSize = next.size;
        return next;
      });
      setSelectedLogo((prev) => {
        logoSelected = multi ? prev : false;
        return logoSelected;
      });
      if (!multi) setSelectedMinimalElements(new Set());
      // Use queueMicrotask so we read nextSize after the setter has run,
      // avoiding stale-closure issues in React 18 concurrent mode.
      queueMicrotask(() => {
        if (nextSize > 0 || logoSelected) setActiveTab('selection');
        else setActiveTab('badges');
      });
    },
    [setActiveTab]
  );

  const handleMinimalSelection = useCallback(
    (id: string, multi: boolean) => {
      let nextSize = 0;
      let logoSelected = false;
      setSelectedMinimalElements((prev) => {
        const next = new Set(multi ? prev : []);
        if (next.has(id)) {
          if (multi) next.delete(id);
          else next.clear();
        } else next.add(id);
        nextSize = next.size;
        return next;
      });
      setSelectedIds((prev) => (multi ? prev : new Set<RatingType>()));
      setSelectedLogo((prev) => {
        logoSelected = multi ? prev : false;
        return logoSelected;
      });
      queueMicrotask(() => {
        if (nextSize > 0 || logoSelected) setActiveTab('selection');
        else setActiveTab('badges');
      });
    },
    [setActiveTab]
  );

  const handleLogoSelection = useCallback(
    (multi: boolean) => {
      let badgeCount = 0;
      setSelectedIds((prev) => {
        badgeCount = multi ? prev.size : 0;
        return multi ? prev : new Set<RatingType>();
      });
      if (!multi) setSelectedMinimalElements(new Set());
      setSelectedLogo((prev) => {
        const next = multi ? !prev : true;
        queueMicrotask(() => {
          if (next || badgeCount > 0) setActiveTab('selection');
          else setActiveTab('badges');
        });
        return next;
      });
    },
    [setActiveTab]
  );

  const setBatchSelection = useCallback(
    (ids: RatingType[]) => {
      setSelectedIds(new Set(ids));
      setSelectedLogo(false);
      setSelectedMinimalElements(new Set());
      if (ids.length > 0) setActiveTab('selection');
    },
    [setActiveTab]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedLogo(false);
    setSelectedMinimalElements(new Set());
    setActiveTab('badges');
  }, [setActiveTab]);

  const toggleViewOption = useCallback((key: keyof ViewOptions) => {
    setViewOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <EditorContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedIds,
        selectedLogo,
        selectedMinimalElements,
        handleSelection,
        handleMinimalSelection,
        handleLogoSelection,
        setBatchSelection,
        clearSelection,
        viewOptions,
        toggleViewOption,
        liveRatings,
        setLiveRatings,
        liveTitle,
        setLiveTitle,
        liveYear,
        setLiveYear,
        resolvedLogoSource,
        setResolvedLogoSource,
        livePosterUrl,
        setLivePosterUrl,
        fallbackEnabled,
        setFallbackEnabled,
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
