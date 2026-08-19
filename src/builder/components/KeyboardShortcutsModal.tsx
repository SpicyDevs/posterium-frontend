// src/components/builder/components/KeyboardShortcutsModal.tsx
import React, { useEffect, memo, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Canvas & View',
    shortcuts: [
      { keys: ['F'], label: 'Toggle fullscreen' },
      { keys: ['G'], label: 'Toggle grid overlay' },
      { keys: ["'"], label: 'Toggle safe area' },
      { keys: ['⌘', '1'], label: 'Fit / reset zoom' },
      { keys: ['⌘', '+'], label: 'Zoom in' },
      { keys: ['⌘', '-'], label: 'Zoom out' },
      { keys: ['['], label: 'Toggle left sidebar' },
      { keys: [']'], label: 'Toggle right sidebar' },
      { keys: ['Esc'], label: 'Exit fullscreen / deselect' },
    ],
  },
  {
    title: 'Selection',
    shortcuts: [
      { keys: ['Click'], label: 'Select badge' },
      { keys: ['⇧+Click'], label: 'Multi-select badge' },
      { keys: ['⌘', 'A'], label: 'Select all badges' },
      { keys: ['⌘', 'D'], label: 'Deselect all' },
      { keys: ['⌘', '⇧', 'D'], label: 'Duplicate selected badge' },
      { keys: ['Tab'], label: 'Cycle next badge' },
      { keys: ['⇧', 'Tab'], label: 'Cycle previous badge' },
      { keys: ['Del / ⌫'], label: 'Delete selected badges' },
    ],
  },
  {
    title: 'Layers',
    shortcuts: [
      { keys: ['⌘', '⇧', ']'], label: 'Bring to front' },
      { keys: ['⌘', ']'], label: 'Bring forward' },
      { keys: ['⌘', '['], label: 'Send backward' },
      { keys: ['⌘', '⇧', '['], label: 'Send to back' },
      { keys: ['H'], label: 'Hide selected badges' },
    ],
  },
  {
    title: 'History & Actions',
    shortcuts: [
      { keys: ['⌘', 'Z'], label: 'Undo' },
      { keys: ['⌘', 'Y'], label: 'Redo' },
      { keys: ['⌘', '⇧', 'Z'], label: 'Redo (alt)' },
    ],
  },
  {
    title: 'App',
    shortcuts: [
      { keys: ['⌘', 'K'], label: 'Command palette' },
      { keys: ['⌘', 'P'], label: 'Command palette (alt)' },
      { keys: ['⌘', '/'], label: 'Keyboard shortcuts' },
      { keys: ['⌘', '?'], label: 'Keyboard shortcuts (alt)' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd
    className="mono-font"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 20,
      padding: '2px 6px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(196,124,46,0.12)',
      borderRadius: 3,
      fontSize: 10,
      lineHeight: 1.4,
      color: 'rgba(196,124,46,0.7)',
      userSelect: 'none',
    }}
  >
    {children}
  </kbd>
);

const KeyboardShortcutsModal: React.FC<Props> = memo(({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'keyboard-shortcuts' }, '');
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        onClose();
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === 'keyboard-shortcuts') {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7,7,6,0.85)',
              backdropFilter: 'blur(8px)',
            }}
          />
        </TransitionChild>

        <div
          style={{
            position: 'fixed',
            inset: 0,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-4"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              style={{
                width: '100%',
                maxWidth: 800,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.02)',
                background: 'rgba(18,17,14,0.96)',
                border: '1px solid rgba(196,124,46,0.22)',
              }}
            >
              <style>{`
                .ksm-close:focus-visible {
                  outline: 2px solid rgba(196,124,46,0.5);
                  outline-offset: 2px;
                }
                @media (max-width: 640px) {
                  .ksm-grid { grid-template-columns: 1fr !important; }
                  .ksm-grid > div { border-right: none !important; }
                  .ksm-grid > div:not(:last-child) { border-bottom: 1px solid rgba(196,124,46,0.08) !important; }
                }
              `}</style>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(196,124,46,0.08)',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                <DialogTitle as="div" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(196,124,46,0.12)',
                      border: '1px solid rgba(196,124,46,0.2)',
                    }}
                  >
                    <Keyboard size={13} style={{ color: 'var(--film-amber)' }} />
                  </div>
                  <div>
                    <p
                      className="syne-font font-bold uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        color: 'var(--film-cream)',
                        margin: 0,
                      }}
                    >
                      Keyboard Shortcuts
                    </p>
                    <p
                      className="mono-font"
                      style={{
                        fontSize: 10,
                        color: 'rgba(140,130,112,0.65)',
                        letterSpacing: '0.08em',
                        marginTop: 3,
                        margin: 0,
                      }}
                    >
                      POSTERIUM · ALL SHORTCUTS
                    </p>
                  </div>
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="ksm-close"
                  aria-label="Close keyboard shortcuts"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--film-text-dim)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--film-text-label)';
                    e.currentTarget.style.background = 'rgba(196,124,46,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--film-text-dim)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Content */}
              <div
                className="ksm-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 0,
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(196,124,46,0.12) transparent',
                }}
              >
                {SHORTCUT_GROUPS.map((group, gi) => {
                  const isLastRow = gi >= SHORTCUT_GROUPS.length - 2;
                  const isLeftCol = gi % 2 === 0;
                  return (
                    <div
                      key={group.title}
                      style={{
                        padding: 16,
                        borderBottom: !isLastRow ? '1px solid rgba(196,124,46,0.08)' : 'none',
                        borderRight: isLeftCol ? '1px solid rgba(196,124,46,0.08)' : 'none',
                      }}
                    >
                      <p
                        className="syne-font"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          marginBottom: 12,
                          color: 'rgba(196,124,46,0.65)',
                          textTransform: 'uppercase',
                          margin: 0,
                        }}
                      >
                        {group.title}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {group.shortcuts.map(({ keys, label }) => (
                          <div
                            key={label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <span
                              className="body-font"
                              style={{
                                fontSize: 12,
                                color: 'var(--film-pale)',
                              }}
                            >
                              {label}
                            </span>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0,
                              }}
                            >
                              {keys.map((k, i) => (
                                <Fragment key={k}>
                                  {i > 0 && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: 'rgba(122,117,110,0.5)',
                                      }}
                                    >
                                      +
                                    </span>
                                  )}
                                  <Kbd>{k}</Kbd>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderTop: '1px solid rgba(196,124,46,0.08)',
                  background: 'rgba(0,0,0,0.1)',
                }}
              >
                <span
                  className="mono-font"
                  style={{
                    fontSize: 10,
                    color: 'rgba(140,130,112,0.65)',
                    letterSpacing: '0.08em',
                  }}
                >
                  Press <Kbd>Esc</Kbd> or <Kbd>⌘/</Kbd> to close
                </span>
                <span
                  className="mono-font"
                  style={{
                    fontSize: 10,
                    color: 'rgba(140,130,112,0.55)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {SHORTCUT_GROUPS.reduce((acc, g) => acc + g.shortcuts.length, 0)} shortcuts
                </span>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
});

KeyboardShortcutsModal.displayName = 'KeyboardShortcutsModal';
export default KeyboardShortcutsModal;
