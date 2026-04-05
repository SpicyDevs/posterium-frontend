// src/components/builder/components/ResetDialog.tsx
import React, { Fragment, memo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
      </TransitionChild>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <DialogPanel
            className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{ background: 'var(--film-mid)', borderColor: 'rgba(196,124,46,0.15)' }}
          >
            <DialogTitle
              as="h3"
              className="text-sm font-semibold flex items-center gap-3 syne-font"
              style={{ color: 'var(--film-cream)' }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(248,113,113,0.12)' }}
              >
                <AlertTriangle size={14} className="text-red-400" />
              </span>
              Reset Configuration
            </DialogTitle>
            <p
              className="mt-3 text-xs leading-5 body-font"
              style={{ color: 'var(--film-text-dim)' }}
            >
              Badge and layout settings will be restored to defaults. Your current poster will be kept. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] cursor-pointer tracking-wide uppercase select-none syne-font"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--film-text-dim)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.25)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-pale)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--film-text-dim)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 h-9 rounded-lg bg-red-600/90 border border-red-500/30 text-xs font-semibold text-white hover:bg-red-500 transition-all active:scale-[0.97] cursor-pointer tracking-wide uppercase select-none syne-font"
              >
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
