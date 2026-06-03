import React, { memo, useEffect } from 'react';
import { Grid3x3, RotateCcw, ShieldCheck } from 'lucide-react';
import { vibrate } from './utils';

type Props = {
  open: boolean;
  onClose: () => void;
  onResetView: () => void;
  onToggleGrid: () => void;
  onToggleSafeArea: () => void;
};

const ActionButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({
  label,
  onClick,
  children,
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={(e) => {
      e.stopPropagation();
      vibrate(8);
      onClick();
    }}
    className="grid h-9 w-9 place-items-center rounded-lg border border-[rgba(196,124,46,0.2)] bg-[rgba(14,13,11,0.95)] text-[rgba(196,124,46,0.8)] active:scale-95"
  >
    {children}
  </button>
);

const LongPressMenu: React.FC<Props> = memo(
  ({ open, onClose, onResetView, onToggleGrid, onToggleSafeArea }) => {
    useEffect(() => {
      if (!open) return;
      const id = window.setTimeout(onClose, 3000);
      const onDoc = () => onClose();
      window.addEventListener('pointerdown', onDoc);
      return () => {
        window.clearTimeout(id);
        window.removeEventListener('pointerdown', onDoc);
      };
    }, [open, onClose]);
    if (!open) return null;
    return (
      <div
        className="fixed left-1/2 z-[70] hidden -translate-x-1/2 items-center gap-2 rounded-xl border border-[rgba(196,124,46,0.18)] bg-[rgba(7,7,6,0.94)] p-2 shadow-[0_12px_36px_rgba(0,0,0,0.55)] max-lg:flex"
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)',
          animation: 'dock-popover-in 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ActionButton
          label="Reset view"
          onClick={() => {
            onResetView();
            onClose();
          }}
        >
          <RotateCcw size={16} />
        </ActionButton>
        <ActionButton
          label="Toggle grid"
          onClick={() => {
            onToggleGrid();
            onClose();
          }}
        >
          <Grid3x3 size={16} />
        </ActionButton>
        <ActionButton
          label="Toggle safe area"
          onClick={() => {
            onToggleSafeArea();
            onClose();
          }}
        >
          <ShieldCheck size={16} />
        </ActionButton>
      </div>
    );
  }
);
LongPressMenu.displayName = 'LongPressMenu';
export default LongPressMenu;
