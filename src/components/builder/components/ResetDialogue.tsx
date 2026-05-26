// src/components/builder/components/ResetDialogue.tsx
import { Fragment, memo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetDialog = memo<Props>(({ isOpen, onClose, onConfirm }) => (
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 translate-y-4 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 translate-y-4 scale-95"
        >
          <DialogPanel
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.02)',
              background: 'rgba(18,17,14,0.96)',
              border: '1px solid rgba(196,124,46,0.22)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 16px',
                borderBottom: '1px solid rgba(196,124,46,0.08)',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <DialogTitle as="div" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
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
                  <AlertTriangle size={13} style={{ color: 'var(--film-amber)' }} />
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--film-cream)',
                    fontFamily: 'Syne, sans-serif',
                  }}
                >
                  Reset Configuration
                </span>
              </DialogTitle>
              <button
                onClick={onClose}
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
                <X size={12} />
              </button>
            </div>
            <div style={{ padding: '16px 16px' }}>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  fontFamily: 'DM Sans, sans-serif',
                  color: 'var(--film-text-dim)',
                  margin: 0,
                }}
              >
                Badge and layout settings will be restored to defaults. Your current poster source,
                media IDs, and saved API keys in local storage will be kept.
              </p>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: 8,
                }}
              >
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(196,124,46,0.16)',
                    background: 'rgba(196,124,46,0.04)',
                    color: 'var(--film-text-dim)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(196,124,46,0.1)';
                    e.currentTarget.style.color = 'var(--film-text-label)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(196,124,46,0.04)';
                    e.currentTarget.style.color = 'var(--film-text-dim)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'all 0.2s',
                    background: 'rgba(196,124,46,0.82)',
                    border: '1px solid rgba(196,124,46,0.4)',
                    color: 'var(--film-dark)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--film-amber)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(196,124,46,0.82)';
                  }}
                >
                  Reset All
                </button>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </Transition>
));
ResetDialog.displayName = 'ResetDialog';

export default ResetDialog;