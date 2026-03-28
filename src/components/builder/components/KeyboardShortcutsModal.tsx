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
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 22,
      height: 20,
      padding: '0 5px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderBottom: '2px solid rgba(0,0,0,0.3)',
      borderRadius: 4,
      fontSize: 9,
      fontFamily: 'JetBrains Mono, monospace',
      color: 'rgba(196,124,46,0.8)',
      userSelect: 'none',
    }}
  >
    {children}
  </kbd>
);

const KeyboardShortcutsModal: React.FC<Props> = memo(({ isOpen, onClose }) => {
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
            className="fixed inset-0"
            style={{ background: 'rgba(7,7,6,0.85)', backdropFilter: 'blur(4px)' }}
          />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95 translate-y-2"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(14,13,11,0.97)',
                border: '1px solid rgba(196,124,46,0.18)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(196,124,46,0.06)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(196,124,46,0.02)',
                }}
              >
                <DialogTitle as="div" className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(196,124,46,0.12)',
                      border: '1px solid rgba(196,124,46,0.2)',
                    }}
                  >
                    <Keyboard size={14} style={{ color: 'var(--film-amber)' }} />
                  </div>
                  <div>
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: 'var(--film-cream)', fontFamily: 'Syne, sans-serif' }}
                    >
                      Keyboard Shortcuts
                    </p>
                    <p
                      className="text-[9px]"
                      style={{
                        color: 'rgba(140,130,112,0.5)',
                        fontFamily: 'JetBrains Mono, monospace',
                        letterSpacing: '0.1em',
                      }}
                    >
                      POSTERIUM · ALL SHORTCUTS
                    </p>
                  </div>
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(140,130,112,0.6)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--film-cream)';
                    e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(140,130,112,0.6)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <X size={13} />
                </button>
              </div>

              {/* Content */}
              <div
                className="grid grid-cols-2 gap-0 max-h-[70vh] overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(196,124,46,0.2) transparent',
                }}
              >
                {SHORTCUT_GROUPS.map((group, gi) => (
                  <div
                    key={group.title}
                    className="p-4"
                    style={{
                      borderBottom:
                        gi < SHORTCUT_GROUPS.length - 2
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                      borderRight: gi % 2 === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    <p
                      className="text-[9px] font-bold uppercase tracking-widest mb-3"
                      style={{ color: 'rgba(196,124,46,0.55)', fontFamily: 'Syne, sans-serif' }}
                    >
                      {group.title}
                    </p>
                    <div className="space-y-2.5">
                      {group.shortcuts.map(({ keys, label }) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span
                            className="text-[11px]"
                            style={{
                              color: 'rgba(240,230,204,0.7)',
                              fontFamily: 'DM Sans, sans-serif',
                            }}
                          >
                            {label}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {keys.map((k, i) => (
                              <React.Fragment key={k}>
                                {i > 0 && (
                                  <span style={{ fontSize: 9, color: 'rgba(122,117,110,0.3)' }}>
                                    +
                                  </span>
                                )}
                                <Kbd>{k}</Kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'rgba(140,130,112,0.3)',
                    letterSpacing: '0.1em',
                  }}
                >
                  Press <Kbd>Esc</Kbd> or <Kbd>⌘/</Kbd> to close
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'rgba(140,130,112,0.2)',
                    letterSpacing: '0.08em',
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
