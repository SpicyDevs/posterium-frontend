import { useEffect } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((node) => {
    if (!node.isConnected) return false;
    if (node.hasAttribute('disabled') || node.getAttribute('aria-disabled') === 'true') return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 || node === document.activeElement;
  });
};

interface FocusTrapOptions {
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
}

export const useFocusTrap = (
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: FocusTrapOptions = {}
) => {
  const { initialFocusRef, restoreFocus = true } = options;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const focusTarget =
      initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container;
    if (focusTarget) focusTarget.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const lastIndex = focusable.length - 1;
      if (event.shiftKey) {
        if (currentIndex <= 0) {
          event.preventDefault();
          focusable[lastIndex].focus();
        }
      } else if (currentIndex === -1 || currentIndex === lastIndex) {
        event.preventDefault();
        focusable[0].focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (restoreFocus && previousFocus?.focus) {
        previousFocus.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, restoreFocus]);
};
