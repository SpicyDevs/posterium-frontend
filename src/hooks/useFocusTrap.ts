import { useEffect } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export const useFocusTrap = (
  isActive: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onEscape?: () => void
): void => {
  useEffect(() => {
    if (!isActive) return;

    const root = containerRef.current;
    if (!root) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
    );
    const first = focusables[0] ?? root;
    const last = focusables[focusables.length - 1] ?? root;

    first.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      if (focusables.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [isActive, containerRef, onEscape]);
};
