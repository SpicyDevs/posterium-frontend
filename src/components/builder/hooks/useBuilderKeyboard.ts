// src/components/builder/hooks/useBuilderKeyboard.ts
import { useEffect } from 'react';
import type { RatingType } from '../types';

interface UseBuilderKeyboardOptions {
  undo: () => void;
  redo: () => void;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  clearSelection: () => void;
  setBatchSelection: (ids: RatingType[]) => void;
  moveLayer: (id: RatingType, direction: 'front' | 'forward' | 'back' | 'toback') => void;
  hideBadge: (id: RatingType) => void;
  toggleViewOption: (key: string) => void;
  dispatchZoom: (delta: number) => void;
  dispatchResetView: () => void;
  nudgeSelection: (dx: number, dy: number) => void;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  setLeftVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setRightVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setExportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFullscreen: boolean;
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  exportOpen: boolean;
  selectedIds: Set<RatingType>;
  selectedLogo: boolean;
  selectedMinimalElements: Set<string>;
  isDesktop: boolean;
  configRatingsRef: React.RefObject<RatingType[]>;
  selectedIdsRef: React.RefObject<Set<RatingType>>;
  selectedLogoRef: React.RefObject<boolean>;
  selectedMinimalElementsRef: React.RefObject<Set<string>>;
}

/**
 * Registers the global keydown handler for the builder.
 * Extracted from builder/index.tsx to reduce the component's line count.
 *
 * Shortcuts handled:
 *   Escape           — dismiss panels / clear selection
 *   ⌘K / ⌘P         — command palette
 *   ⌘/               — keyboard shortcuts modal
 *   Arrow keys        — nudge selection (1px, Shift=10px)
 *   ⌘A / ⌘D          — select all / deselect
 *   ⌘Z / ⌘Y / ⌘⇧Z   — undo / redo
 *   Delete / Backspace — remove selected
 *   ⌘⇧] / ⌘⇧[       — bring to front / send to back
 *   ⌘] / ⌘[          — forward / back
 *   H                 — hide selected
 *   F                 — fullscreen (desktop only)
 *   G                 — grid toggle
 *   '                 — safe area toggle
 *   ⌘1               — reset view
 *   ⌘+ / ⌘-          — zoom in / out
 *   [ / ]             — toggle sidebars
 *   Tab / Shift+Tab   — cycle badge selection
 *   ⌘B               — toggle blur
 */
export function useBuilderKeyboard(opts: UseBuilderKeyboardOptions): void {
  const {
    undo, redo, setConfig, clearSelection, setBatchSelection,
    moveLayer, hideBadge, toggleViewOption, dispatchZoom, dispatchResetView,
    nudgeSelection, setIsFullscreen, setLeftVisible, setRightVisible,
    setPaletteOpen, setShortcutsOpen, setExportOpen,
    isFullscreen, paletteOpen, shortcutsOpen, exportOpen,
    selectedIds, selectedLogo, isDesktop,
    configRatingsRef, selectedIdsRef, selectedLogoRef, selectedMinimalElementsRef,
  } = opts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const inInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.tagName === 'SELECT';

      if (e.key === 'Escape') {
        if (shortcutsOpen) { setShortcutsOpen(false); return; }
        if (paletteOpen) { setPaletteOpen(false); return; }
        if (exportOpen) { setExportOpen(false); return; }
        if (isFullscreen) { setIsFullscreen(false); return; }
        if (selectedIds.size > 0 || selectedLogo) { clearSelection(); return; }
        return;
      }

      if (mod && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      if (mod && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      if (inInput) return;

      if (
        (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        (selectedIdsRef.current.size > 0 || selectedLogoRef.current || selectedMinimalElementsRef.current.size > 0)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowUp') nudgeSelection(0, -step);
        else if (e.key === 'ArrowDown') nudgeSelection(0, step);
        else if (e.key === 'ArrowLeft') nudgeSelection(-step, 0);
        else if (e.key === 'ArrowRight') nudgeSelection(step, 0);
        return;
      }

      if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); setBatchSelection(configRatingsRef.current); return; }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); clearSelection(); return; }
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedIdsRef.current.size > 0 || selectedLogoRef.current)) {
        e.preventDefault();
        const rm = new Set(selectedIdsRef.current);
        if (rm.size > 0) setConfig((p: any) => ({ ...p, ratings: p.ratings.filter((r: RatingType) => !rm.has(r)) }));
        clearSelection();
        return;
      }

      if (selectedIdsRef.current.size > 0) {
        const sel = Array.from(selectedIdsRef.current);
        if (mod && e.shiftKey && e.key === ']') { e.preventDefault(); sel.forEach((id) => moveLayer(id as RatingType, 'front')); return; }
        if (mod && e.shiftKey && e.key === '[') { e.preventDefault(); sel.forEach((id) => moveLayer(id as RatingType, 'toback')); return; }
        if (mod && e.key === ']') { e.preventDefault(); sel.forEach((id) => moveLayer(id as RatingType, 'forward')); return; }
        if (mod && e.key === '[') { e.preventDefault(); sel.forEach((id) => moveLayer(id as RatingType, 'back')); return; }
        if (e.key.toLowerCase() === 'h' && !mod) { e.preventDefault(); sel.forEach((id) => hideBadge(id as RatingType)); return; }
      }

      if (e.key.toLowerCase() === 'f' && !mod && isDesktop) { e.preventDefault(); setIsFullscreen((v) => !v); return; }
      if (e.key.toLowerCase() === 'g' && !mod) { e.preventDefault(); toggleViewOption('showGrid'); return; }
      if (e.key === "'" && !mod) { e.preventDefault(); toggleViewOption('showSafeArea'); return; }
      if (mod && e.key === '1') { e.preventDefault(); dispatchResetView(); return; }
      if (mod && (e.key === '+' || e.key === '=')) { e.preventDefault(); dispatchZoom(0.25); return; }
      if (mod && e.key === '-') { e.preventDefault(); dispatchZoom(-0.25); return; }
      if (e.key === '[' && !mod && !e.shiftKey) { e.preventDefault(); setLeftVisible((v) => !v); return; }
      if (e.key === ']' && !mod && !e.shiftKey) { e.preventDefault(); setRightVisible((v) => !v); return; }

      if (e.key === 'Tab' && !mod) {
        const ratings = configRatingsRef.current;
        if (ratings.length === 0) return;
        e.preventDefault();
        const selArr = Array.from(selectedIdsRef.current);
        const lastSel = selArr[selArr.length - 1];
        const idx = lastSel ? ratings.indexOf(lastSel) : -1;
        const next = ratings[(idx + (e.shiftKey ? -1 + ratings.length : 1)) % ratings.length];
        setBatchSelection([next]);
        return;
      }

      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setConfig((p: any) => ({ ...p, posterBlur: p.posterBlur > 0 ? 0 : 8 }));
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    undo, redo, setConfig, clearSelection, setBatchSelection,
    moveLayer, hideBadge, toggleViewOption, dispatchZoom, dispatchResetView,
    nudgeSelection, setIsFullscreen, setLeftVisible, setRightVisible,
    setPaletteOpen, setShortcutsOpen, setExportOpen,
    isFullscreen, paletteOpen, shortcutsOpen, exportOpen,
    selectedIds, selectedLogo, isDesktop,
    configRatingsRef, selectedIdsRef, selectedLogoRef, selectedMinimalElementsRef,
  ]);
}
