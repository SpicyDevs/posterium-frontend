import React, { memo, useEffect } from 'react';
import { Grid3x3, RotateCcw, ShieldCheck } from 'lucide-react';
import { vibrate } from './utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onResetView: () => void;
  onToggleGrid: () => void;
  onToggleSafeArea: () => void;
}

const LongPressMenu: React.FC<Props> = memo(({ open, onClose, onResetView, onToggleGrid, onToggleSafeArea }) => {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  const action = (fn: () => void) => {
    vibrate(8);
    fn();
    onClose();
  };

  return (
    <>
      <button className="mobile-longpress-scrim" aria-label="Dismiss quick actions" onClick={onClose} />
      <div className="mobile-longpress-menu" role="menu" aria-label="Canvas quick actions">
        <button type="button" onClick={() => action(onResetView)} aria-label="Reset view"><RotateCcw size={15} /></button>
        <button type="button" onClick={() => action(onToggleGrid)} aria-label="Toggle grid"><Grid3x3 size={15} /></button>
        <button type="button" onClick={() => action(onToggleSafeArea)} aria-label="Toggle safe area"><ShieldCheck size={15} /></button>
      </div>
    </>
  );
});

LongPressMenu.displayName = 'LongPressMenu';
export default LongPressMenu;
