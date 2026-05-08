// src/components/builder/components/ResetDialog.tsx
import { Fragment, memo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

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
        <div className="fixed inset-0 bg-[rgba(7,7,6,0.78)] backdrop-blur-md" />
      </TransitionChild>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 translate-y-2 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 translate-y-2 scale-95"
        >
          <DialogPanel
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(18,17,14,0.98)',
              border: '1px solid rgba(196,124,46,0.18)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,124,46,0.06)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(196,124,46,0.02)',
              }}
            >
              <DialogTitle as="div" className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(248,113,113,0.12)',
                    border: '1px solid rgba(248,113,113,0.2)',
                  }}
                >
                  <AlertTriangle size={14} className="text-red-400" />
                </span>
                <div>
                  <p
                    className="syne-font font-bold uppercase tracking-widest"
                    style={{ fontSize: 11, color: 'var(--film-cream)' }}
                  >
                    Reset Configuration
                  </p>
                  <p
                    className="mono-font uppercase tracking-widest"
                    style={{ fontSize: 8, color: 'var(--film-text-dim)' }}
                  >
                    Keep poster · reset layout
                  </p>
                </div>
              </DialogTitle>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--film-text-dim)',
                }}
              >
                <X size={13} />
              </button>
            </div>

            <div className="px-4 py-4">
              <p className="text-xs leading-5 body-font" style={{ color: 'var(--film-text-dim)' }}>
                Badge styling, layer positions, effects, and layout settings will be restored to
                defaults. Media source, poster choice, and API keys are preserved.
              </p>
              <div
                className="mt-3 rounded-xl px-3 py-2 flex items-start gap-2"
                style={{
                  background: 'rgba(248,113,113,0.07)',
                  border: '1px solid rgba(248,113,113,0.14)',
                }}
              >
                <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                <span
                  className="body-font"
                  style={{ fontSize: 10, color: 'rgba(254,202,202,0.82)' }}
                >
                  This cannot be undone unless you use history immediately after closing.
                </span>
              </div>
            </div>

            <div
              className="flex gap-2 px-4 py-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              <button
                onClick={onClose}
                className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] tracking-wide uppercase select-none syne-font"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--film-text-dim)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] tracking-wide uppercase select-none syne-font inline-flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(220,38,38,0.92)',
                  border: '1px solid rgba(248,113,113,0.34)',
                  color: '#fff',
                  boxShadow: '0 0 20px rgba(220,38,38,0.22)',
                }}
              >
                <RotateCcw size={12} />
                Reset All
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </Transition>
));
ResetDialog.displayName = 'ResetDialog';

export default ResetDialog;
