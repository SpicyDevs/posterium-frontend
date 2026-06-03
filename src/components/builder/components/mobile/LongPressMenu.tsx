import React, { memo, useEffect } from 'react';
import { Grid3x3, RotateCcw, ShieldCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onResetView: () => void;
  onToggleGrid: () => void;
  onToggleSafeArea: () => void;
}

const LongPressMenu: React.FC<Props> = memo(
  ({ open, onClose, onResetView, onToggleGrid, onToggleSafeArea }) => {
    useEffect(() => {
      if (!open) return;
      const t = window.setTimeout(onClose, 3000);
      return () => window.clearTimeout(t);
    }, [onClose, open]);
    if (!open) return null;
    return (
      <>
        <button
          aria-label="Dismiss quick actions"
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'transparent', border: 0 }}
        />
        <div
          className="mobile-longpress-menu"
          style={{
            position: 'fixed',
            bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 61,
            display: 'flex',
            gap: 8,
          }}
        >
          <QuickButton
            label="Reset view"
            onClick={() => {
              onResetView();
              onClose();
            }}
          >
            <RotateCcw size={16} />
          </QuickButton>
          <QuickButton
            label="Toggle grid"
            onClick={() => {
              onToggleGrid();
              onClose();
            }}
          >
            <Grid3x3 size={16} />
          </QuickButton>
          <QuickButton
            label="Toggle safe area"
            onClick={() => {
              onToggleSafeArea();
              onClose();
            }}
          >
            <ShieldCheck size={16} />
          </QuickButton>
        </div>
      </>
    );
  }
);
const QuickButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({
  label,
  onClick,
  children,
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    style={{
      width: 36,
      height: 36,
      borderRadius: 8,
      background: 'rgba(14,13,11,0.95)',
      border: '1px solid rgba(196,124,46,0.2)',
      color: 'var(--film-amber)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </button>
);
LongPressMenu.displayName = 'LongPressMenu';
export default LongPressMenu;
