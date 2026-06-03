import React, { memo, useMemo, useRef } from 'react';
import { Download, Redo2, Undo2 } from 'lucide-react';
import type { PosterConfig, RatingType } from '../../types';
import type { LeftDrawerTab, RightDrawerTab } from './utils';
import { vibrate } from './utils';

interface Props {
  leftOpen: boolean;
  rightOpen: boolean;
  leftTab: LeftDrawerTab;
  rightTab: RightDrawerTab;
  selectedIds: Set<RatingType>;
  selectedLogo: boolean;
  config: PosterConfig;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  exportButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const displayNameForBadge = (id: RatingType) =>
  id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace('Imdb', 'IMDb');

const PressButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({
  children,
  active = true,
  style,
  onClick,
  ...props
}) => (
  <button
    {...props}
    onClick={(event) => {
      if (active) vibrate(8);
      onClick?.(event);
    }}
    className="mobile-toolbar-action"
    style={{ pointerEvents: active ? 'auto' : 'none', ...style }}
  >
    <span className="mobile-toolbar-action-inner">{children}</span>
  </button>
);

const MobileToolbar: React.FC<Props> = memo(
  ({
    leftOpen,
    rightOpen,
    leftTab,
    rightTab,
    selectedIds,
    selectedLogo,
    config,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    exportButtonRef,
  }) => {
    const brandRef = useRef<HTMLButtonElement>(null);
    const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0);
    const title = useMemo(() => {
      if (leftOpen) return leftTab === 'source' ? 'SOURCE' : 'LAYERS';
      if (rightOpen && rightTab === 'badges') return 'BADGES';
      if (rightOpen && rightTab === 'selection') {
        if (selectedCount === 0) return 'SELECTION';
        if (selectedCount > 1) return `${selectedCount} LAYERS`;
        if (selectedLogo) return 'LOGO';
        const [id] = Array.from(selectedIds);
        return displayNameForBadge(id);
      }
      return 'CANVAS';
    }, [leftOpen, leftTab, rightOpen, rightTab, selectedCount, selectedIds, selectedLogo]);

    const subtitle = useMemo(() => {
      if (leftOpen && leftTab === 'source') return 'MEDIA & POSTER SOURCE';
      if (leftOpen && leftTab === 'layers') return 'VISIBILITY & ORDER';
      if (rightOpen && rightTab === 'badges') return 'GLOBAL BADGE STYLE';
      if (rightOpen && rightTab === 'selection') {
        return selectedCount > 0 ? 'LAYER-SPECIFIC CONFIGURATION' : 'CLICK A LAYER ON THE CANVAS';
      }
      return 'TAP POSTER TO SELECT LAYERS';
    }, [leftOpen, leftTab, rightOpen, rightTab, selectedCount]);

    return (
      <header className="mobile-toolbar lg:hidden" style={{ gridArea: 'toolbar' }}>
        <div className="mobile-toolbar-ambient" />
        <div className="mobile-toolbar-row">
          <button
            ref={brandRef}
            className="mobile-brand-mark poster-font"
            aria-label="Posterium"
            onTouchStart={() => vibrate(4)}
            type="button"
          >
            P
          </button>

          <div className="mobile-panel-title" key={`${title}-${subtitle}`}>
            <div className="mobile-panel-title-main" title={title}>{title}</div>
            <div className="mobile-panel-title-sub">{subtitle}</div>
          </div>

          <div className="mobile-toolbar-actions">
            <PressButton aria-label="Undo" active={canUndo} onClick={onUndo}>
              <Undo2 size={14} color={canUndo ? 'rgba(240,230,204,0.8)' : 'rgba(140,130,112,0.25)'} />
            </PressButton>
            <PressButton aria-label="Redo" active={canRedo} onClick={onRedo}>
              <Redo2 size={14} color={canRedo ? 'rgba(240,230,204,0.8)' : 'rgba(140,130,112,0.25)'} />
            </PressButton>
            <div className="mobile-toolbar-divider" />
            <button ref={exportButtonRef} className="mobile-export-button" onClick={() => { vibrate(8); onExport(); }} type="button" aria-label={`Export ${config.extension.toUpperCase()}`}>
              <span className="mobile-toolbar-action-inner"><Download size={14} /></span>
            </button>
          </div>
        </div>
      </header>
    );
  }
);

MobileToolbar.displayName = 'MobileToolbar';
export default MobileToolbar;
