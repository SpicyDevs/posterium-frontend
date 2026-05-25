import React, { memo, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

export type BuilderMode = 'walkthrough' | 'simple' | 'advanced';

interface Props {
  mode: BuilderMode;
  onChange: (mode: BuilderMode) => void;
}

const MODE_OPTIONS: { id: BuilderMode; label: string }[] = [
  { id: 'walkthrough', label: 'Walkthrough' },
  { id: 'simple', label: 'Simple' },
  { id: 'advanced', label: 'Advanced' },
];

const ModeToggle: React.FC<Props> = memo(({ mode, onChange }) => {
  const activeLabel = MODE_OPTIONS.find((option) => option.id === mode)?.label ?? 'Walkthrough';

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="h-8 px-3 rounded-md syne-font text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
        style={{
          color: 'var(--film-cream)',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(196,124,46,0.2)',
        }}
      >
        {activeLabel} Mode
        <ChevronDown size={12} />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-120"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-90"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute left-0 mt-2 min-w-[180px] rounded-lg p-1 z-50 focus:outline-none"
          style={{
            background: 'var(--film-dark)',
            border: '1px solid rgba(196,124,46,0.2)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
          }}
        >
          {MODE_OPTIONS.map((item) => (
            <Menu.Item key={item.id}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => onChange(item.id)}
                  className="w-full h-8 px-2.5 rounded-md text-left inline-flex items-center justify-between text-[11px] syne-font transition-colors"
                  style={{
                    color: mode === item.id ? 'var(--film-amber)' : 'var(--film-cream)',
                    background: active ? 'rgba(196,124,46,0.1)' : 'transparent',
                  }}
                >
                  <span>{item.label}</span>
                  {mode === item.id && <Check size={12} />}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
});

ModeToggle.displayName = 'ModeToggle';
export default ModeToggle;
