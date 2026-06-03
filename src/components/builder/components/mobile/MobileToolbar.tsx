import React, { memo, useMemo } from 'react';
import { Download, Redo2, Undo2 } from 'lucide-react';
import type { RatingType } from '../../types';
import type { LeftMobileTab, RightMobileTab, MobileDrawerSide } from './utils';
import { vibrate } from './utils';

type Props = {
  openSide: MobileDrawerSide | null;
  leftTab: LeftMobileTab;
  rightTab: RightMobileTab;
  selectedIds: Set<RatingType>;
  selectedLogo: boolean;
  selectedMinimalElements: Set<string>;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  exportButtonRef: React.RefObject<HTMLButtonElement | null>;
};

const badgeDisplayName = (id: string) =>
  id
    .split(/[-_]/g)
    .map((part) => part.toUpperCase())
    .join(' ');

const PressButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
> = ({ children, onClick, ...props }) => (
  <button
    {...props}
    onClick={(e) => {
      vibrate(8);
      onClick?.(e);
    }}
    className={`group grid h-9 w-9 place-items-center rounded-lg border border-transparent bg-transparent p-0.5 active:bg-white/[0.06] ${props.className ?? ''}`}
  >
    <span className="grid h-8 w-8 place-items-center rounded-lg transition-transform duration-100 group-active:scale-[0.88]">
      {children}
    </span>
  </button>
);

const MobileToolbar: React.FC<Props> = memo(
  ({
    openSide,
    leftTab,
    rightTab,
    selectedIds,
    selectedLogo,
    selectedMinimalElements,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onExport,
    exportButtonRef,
  }) => {
    const selectedCount = selectedIds.size + (selectedLogo ? 1 : 0) + selectedMinimalElements.size;
    const titleState = useMemo(() => {
      if (!openSide) return { title: 'CANVAS', subtitle: 'TAP POSTER TO SELECT LAYERS' };
      if (openSide === 'left') {
        return leftTab === 'source'
          ? { title: 'SOURCE', subtitle: 'MEDIA & POSTER SOURCE' }
          : { title: 'LAYERS', subtitle: 'VISIBILITY & ORDER' };
      }
      if (rightTab === 'badges') return { title: 'BADGES', subtitle: 'GLOBAL BADGE STYLE' };
      if (selectedCount === 0)
        return { title: 'SELECTION', subtitle: 'CLICK A LAYER ON THE CANVAS' };
      if (selectedCount > 1)
        return { title: `${selectedCount} LAYERS`, subtitle: 'LAYER-SPECIFIC CONFIGURATION' };
      const onlyId = selectedIds.values().next().value as RatingType | undefined;
      return {
        title: onlyId ? badgeDisplayName(onlyId) : selectedLogo ? 'LOGO' : 'LAYER',
        subtitle: 'LAYER-SPECIFIC CONFIGURATION',
      };
    }, [openSide, leftTab, rightTab, selectedCount, selectedIds, selectedLogo]);
    const key = `${titleState.title}-${titleState.subtitle}`;

    return (
      <header
        className="relative z-50 hidden h-12 [grid-area:toolbar] border-b border-[rgba(196,124,46,0.1)] bg-[rgba(7,7,6,0.97)] backdrop-blur-2xl max-lg:block"
        style={{
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          backdropFilter: 'blur(24px) saturate(1.5)',
        }}
      >
        <div className="pointer-events-none absolute -bottom-px left-0 right-0 z-[1] h-px bg-[linear-gradient(90deg,transparent,rgba(196,124,46,0.15),transparent)]" />
        <div className="flex h-12 items-center gap-1.5 px-2.5">
          <button
            aria-label="Posterium"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[rgba(196,124,46,0.2)] bg-[rgba(196,124,46,0.08)] font-extrabold text-[16px] tracking-[0.12em] text-[var(--film-amber)] syne-font active:bg-[rgba(196,124,46,0.15)]"
          >
            P
          </button>
          <div
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2"
            key={key}
            style={{ animation: 'panel-title-in 0.12s ease forwards' }}
          >
            <div className="max-w-[120px] truncate text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--film-cream)] syne-font">
              {titleState.title}
            </div>
            <div className="truncate font-mono text-[8px] font-normal tracking-[0.08em] text-[rgba(140,130,112,0.45)]">
              {titleState.subtitle}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PressButton aria-label="Undo" disabled={!canUndo} onClick={onUndo}>
              <Undo2
                size={14}
                color={canUndo ? 'rgba(240,230,204,0.8)' : 'rgba(140,130,112,0.25)'}
              />
            </PressButton>
            <PressButton aria-label="Redo" disabled={!canRedo} onClick={onRedo}>
              <Redo2
                size={14}
                color={canRedo ? 'rgba(240,230,204,0.8)' : 'rgba(140,130,112,0.25)'}
              />
            </PressButton>
            <div className="mx-0.5 h-4 w-px shrink-0 bg-[rgba(196,124,46,0.12)]" />
            <button
              ref={exportButtonRef}
              aria-label="Export"
              onClick={() => {
                vibrate(8);
                onExport();
              }}
              className="group grid h-9 w-9 place-items-center rounded-lg border border-[rgba(196,124,46,0.25)] bg-[rgba(196,124,46,0.12)] p-0.5 active:bg-[rgba(196,124,46,0.2)]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg transition-transform duration-100 group-active:scale-[0.88]">
                <Download size={14} color="var(--film-amber)" />
              </span>
            </button>
          </div>
        </div>
      </header>
    );
  }
);

MobileToolbar.displayName = 'MobileToolbar';
export default MobileToolbar;
