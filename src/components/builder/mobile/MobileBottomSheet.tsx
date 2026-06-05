import React, { useCallback } from 'react';
import type { PosterConfig } from '../types';
import type { ViewOptions } from '../context/EditorContext';
import type { PaletteCommand } from '../components/CommandPalette';
import { useMobileSheet } from './hooks/useMobileSheet';
import MobileSourcePanel from './panels/MobileSourcePanel';
import MobileCanvasPanel from './panels/MobileCanvasPanel';
import MobileBadgesPanel from './panels/MobileBadgesPanel';

type SheetTab = 'source' | 'poster' | 'badges';

interface Props {
  sheet: ReturnType<typeof useMobileSheet>;
  activeTab: SheetTab;
  onChangeTab: (tab: SheetTab) => void;
  onClose: () => void;
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<string>;
  selectedLogo: boolean;
  clearSelection: () => void;
  toggleViewOption: (key: keyof ViewOptions) => void;
  viewOptions: ViewOptions;
  onOpenExport: () => void;
  onOpenReset: () => void;
  tokens: typeof import('./MobileBuilder').M;
}

const MobileBottomSheet: React.FC<Props> = ({
  sheet,
  activeTab,
  onChangeTab,
  onClose,
  config,
  setConfig,
  selectedIds,
  selectedLogo,
  clearSelection,
  toggleViewOption,
  viewOptions,
  onOpenExport,
  onOpenReset,
  tokens,
}) => {
  const showBackdrop = sheet.isOpen || sheet.isDragging;
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      sheet.beginDrag(event.clientY);
      const onMove = (move: PointerEvent) => sheet.moveDrag(move.clientY);
      const onUp = () => {
        sheet.endDrag();
        window.removeEventListener('pointermove', onMove);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    },
    [sheet]
  );

  const activeStyles: React.CSSProperties = {
    color: 'var(--film-amber)',
    background: 'rgba(196,124,46,0.12)',
  };

  const tabButtonStyle: React.CSSProperties = {
    minWidth: 70,
    height: 36,
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: 'rgba(240,230,204,0.7)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'background 0.18s ease, color 0.18s ease',
  };

  return (
    <div
      aria-hidden={!showBackdrop}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 36,
        pointerEvents: showBackdrop ? 'auto' : 'none',
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.32)',
          opacity: showBackdrop ? 1 : 0,
          transition: `opacity ${tokens.SHEET_DUR} ${tokens.SHEET_EASE}`,
          pointerEvents: showBackdrop ? 'auto' : 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 'var(--sh, 0px)',
          transform: 'translateY(calc(100% - var(--sh, 0px)))',
          transition: sheet.isDragging
            ? 'none'
            : `transform ${tokens.SHEET_DUR} ${tokens.SHEET_EASE}, opacity ${tokens.SHEET_DUR} ${tokens.SHEET_EASE}, visibility 0s ${sheet.isOpen ? '0s' : tokens.SHEET_DUR}`,
          opacity: sheet.isOpen ? 1 : 0,
          visibility: sheet.isOpen ? 'visible' : 'hidden',
          pointerEvents: sheet.isOpen || sheet.isDragging ? 'auto' : 'none',
          display: 'flex',
          justifyContent: 'center',
          padding: '0 10px',
        }}
      >
        <div
          ref={sheet.sheetRef}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 640,
            height: '100%',
            background: 'rgba(7,7,6,0.98)',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            boxShadow: '0 -14px 50px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
          }}
        >
          <div
            onPointerDown={handlePointerDown}
            style={{
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              touchAction: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.15)',
              }}
            />
          </div>

          <div style={{ padding: '0 14px 10px' }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {(['source', 'poster', 'badges'] as SheetTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => onChangeTab(tab)}
                  style={
                    activeTab === tab
                      ? { ...tabButtonStyle, ...activeStyles }
                      : tabButtonStyle
                  }
                >
                  {tab === 'source' ? 'Source' : tab === 'poster' ? 'Poster' : 'Badges'}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '0 14px 20px',
            }}
          >
            {activeTab === 'source' && (
              <MobileSourcePanel
                config={config}
                setConfig={setConfig}
                tokens={tokens}
              />
            )}
            {activeTab === 'poster' && (
              <MobileCanvasPanel
                config={config}
                setConfig={setConfig}
                viewOptions={viewOptions}
                toggleViewOption={toggleViewOption}
                onOpenExport={onOpenExport}
                onOpenReset={onOpenReset}
                tokens={tokens}
              />
            )}
            {activeTab === 'badges' && (
              <MobileBadgesPanel
                config={config}
                setConfig={setConfig}
                selectedIds={selectedIds}
                selectedLogo={selectedLogo}
                clearSelection={clearSelection}
                onOpenExport={onOpenExport}
                tokens={tokens}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomSheet;
