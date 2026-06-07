import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import type { PosterConfig } from '../types';
import type { PaletteCommand } from '../components/CommandPalette';
import type { LayerTargetId } from '../components/ContextMenu';
import { useEditor } from '../context/EditorContext';
import MobileHeader from './MobileHeader';
import MobileLayerDrawer from './MobileLayerDrawer';
import MobileInspectorDrawer from './MobileInspectorDrawer';
import MobileBottomSheet from './MobileBottomSheet';
import MobileNavBar from './MobileNavBar';
import { MobileZoomControls } from './MobileZoomControls';
import { useMobileSheet } from './hooks/useMobileSheet';

export const M = {
  HEADER_H: 48,
  NAV_H: 56,
  DRAWER_W: Math.min(280, typeof window !== 'undefined' ? window.innerWidth * 0.85 : 280),
  SHEET_PEEK: 0,
  SHEET_MID: 0,
  SHEET_MAX: 0,
  PANEL_H: 'min(480px, 62dvh)',
  SLIDE_DUR: '0.28s',
  SLIDE_EASE: 'cubic-bezier(0.4, 0, 0.2, 1)',
  SHEET_DUR: '0.34s',
  SHEET_EASE: 'cubic-bezier(0.16, 1, 0.3, 1)',
  AMBER: 'var(--film-amber)',
  AMBER_DIM: 'rgba(196,124,46,0.45)',
  AMBER_BG: 'rgba(196,124,46,0.1)',
  AMBER_BORDER: 'rgba(196,124,46,0.2)',
  CREAM: 'var(--film-cream)',
  DIM: 'var(--film-text-dim)',
  DARK: 'rgba(7,7,6,0.97)',
  PANEL_BG: 'var(--film-dark)',
  MID_BG: 'var(--film-mid)',
  TAP: 44,
} as const;

type SheetTab = 'source' | 'poster' | 'badges';

interface Props {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  exportOpen: boolean;
  onOpenExport: () => void;
  onOpenReset: () => void;
  exportBtnRef: React.RefObject<HTMLButtonElement | null>;
  onContextMenu: (badgeId: LayerTargetId, e: React.MouseEvent) => void;
  onLogoContextMenu: (e: React.MouseEvent) => void;
  paletteCommands: PaletteCommand[];
}

const panelTitles: Record<SheetTab, string> = {
  source: 'Source',
  poster: 'Poster',
  badges: 'Badges',
};

const sheetLabel = (tab: SheetTab) => panelTitles[tab];

const MobileBuilder: React.FC<Props> = ({
  config,
  setConfig,
  undo,
  redo,
  canUndo,
  canRedo,
  exportOpen,
  onOpenExport,
  onOpenReset,
  exportBtnRef,
}) => {
  const {
    selectedIds,
    selectedLogo,
    handleSelection,
    handleLogoSelection,
    clearSelection,
    viewOptions,
    toggleViewOption,
  } = useEditor();

  const [drawerOpen, setDrawerOpen] = useState<null | 'left' | 'right'>(null);
  const [activeTab, setActiveTab] = useState<SheetTab>('poster');
  const [sheetMid, setSheetMid] = useState(
    () => (typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.46) : 0)
  );
  const [sheetMax, setSheetMax] = useState(
    () =>
      typeof window !== 'undefined'
        ? Math.max(0, window.innerHeight - M.HEADER_H - M.NAV_H - 72)
        : 0
  );

  useLayoutEffect(() => {
    const update = () => {
      const height = window.innerHeight;
      setSheetMid(Math.round(height * 0.46));
      setSheetMax(Math.max(0, height - M.HEADER_H - M.NAV_H - 72));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const snapPoints = useMemo(() => [0, sheetMid, sheetMax], [sheetMid, sheetMax]);
  const sheet = useMobileSheet({ snapPoints, peekHeight: M.SHEET_PEEK, onOpenChange: () => {} });

  const anyPanelOpen = drawerOpen !== null || sheet.isOpen || sheet.isDragging;
  const contextLabel = drawerOpen
    ? drawerOpen === 'left'
      ? 'Layers'
      : 'Inspector'
    : sheet.isOpen
    ? sheetLabel(activeTab)
    : 'Tap a panel to edit';

  const toggleDrawer = useCallback((side: 'left' | 'right') => {
    setDrawerOpen((current) => (current === side ? null : side));
  }, []);

  const handleLogoSelect = useCallback(() => {
    handleLogoSelection(false);
  }, [handleLogoSelection]);

  const handlePanelSelect = useCallback(
    (tab: SheetTab) => {
      setActiveTab(tab);
      sheet.open();
    },
    [sheet]
  );

  const closeDrawers = useCallback(() => setDrawerOpen(null), []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'auto',
      }}
    >
      <MobileHeader
        contextLabel={contextLabel}
        anyPanelOpen={anyPanelOpen}
        canUndo={canUndo}
        canRedo={canRedo}
        exportOpen={exportOpen}
        onUndo={undo}
        onRedo={redo}
        onExport={onOpenExport}
        exportBtnRef={exportBtnRef}
      />

      <MobileLayerDrawer
        open={drawerOpen === 'left'}
        onClose={closeDrawers}
        config={config}
        selectedIds={selectedIds}
        selectedLogo={selectedLogo}
        onSelect={(id) => handleSelection(id, false)}
        onSelectLogo={handleLogoSelect}
        onDeselectAll={clearSelection}
        tokens={M}
      />

      <MobileInspectorDrawer
        open={drawerOpen === 'right'}
        onClose={closeDrawers}
        selectedCount={selectedIds.size + (selectedLogo ? 1 : 0)}
        selectedLogo={selectedLogo}
        clearSelection={clearSelection}
        onOpenExport={onOpenExport}
        onOpenReset={onOpenReset}
        tokens={M}
      />

      <MobileBottomSheet
        sheet={sheet}
        activeTab={activeTab}
        onChangeTab={handlePanelSelect}
        onClose={sheet.close}
        config={config}
        setConfig={setConfig}
        selectedIds={selectedIds}
        selectedLogo={selectedLogo}
        clearSelection={clearSelection}
        toggleViewOption={toggleViewOption}
        viewOptions={viewOptions}
        onOpenExport={onOpenExport}
        onOpenReset={onOpenReset}
        tokens={M}
      />

      <MobileNavBar
        activeTab={activeTab}
        leftOpen={drawerOpen === 'left'}
        rightOpen={drawerOpen === 'right'}
        onToggleLeft={() => toggleDrawer('left')}
        onToggleRight={() => toggleDrawer('right')}
        onSelectTab={handlePanelSelect}
      />

      <MobileZoomControls
        onZoomIn={() => window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: 0.25 }))}
        onZoomOut={() => window.dispatchEvent(new CustomEvent('canvas-zoom', { detail: -0.25 }))}
        onReset={() => window.dispatchEvent(new CustomEvent('reset-canvas-view'))}
      />
    </div>
  );
};

export default MobileBuilder;
