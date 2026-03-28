// src/components/builder/components/ImportDialog.tsx
import React, { Fragment, useState, memo } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (url: string) => void;
}

const ImportDialog = memo<Props>(({ isOpen, onClose, onLoad }) => {
  const [val, setVal] = useState('');
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
              className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
              style={{ background: 'var(--film-mid)', borderColor: 'rgba(196,124,46,0.15)' }}
            >
              <DialogTitle
                as="h3"
                className="text-sm font-semibold flex items-center gap-3 syne-font"
                style={{ color: 'var(--film-cream)' }}
              >
                <Download size={16} style={{ color: 'var(--film-amber)' }} className="rotate-180" />
                Import Configuration
              </DialogTitle>
              <div className="mt-4">
                <input
                  type="url"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder="Paste Posterium API URL here..."
                  className="w-full h-10 px-3 rounded-lg border focus:outline-none mono-font"
                  style={{
                    background: 'var(--film-char)',
                    borderColor: 'rgba(255,255,255,0.06)',
                    color: 'var(--film-cream)',
                    fontSize: 11,
                  }}
                  autoFocus
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)'; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && val.trim()) {
                      onLoad(val.trim());
                      setVal('');
                      onClose();
                    }
                  }}
                />
              </div>
              <div className="mt-5 flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 h-9 rounded-lg text-xs font-semibold transition-all hover:bg-white/5 syne-font uppercase tracking-wide"
                  style={{ color: 'var(--film-text-dim)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (val.trim()) { onLoad(val.trim()); setVal(''); onClose(); } }}
                  className="px-4 h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] syne-font uppercase tracking-wide"
                  style={{ background: 'var(--film-amber)', color: '#070706' }}
                >
                  Load Poster
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
});
ImportDialog.displayName = 'ImportDialog';

export default ImportDialog;