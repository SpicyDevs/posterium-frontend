import React from 'react';
import { Switch } from '@headlessui/react';
import clsx from 'clsx';

interface ToggleRowProps {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  small?: boolean;
  disabled?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  sub,
  checked,
  onChange,
  small,
  disabled,
}) => (
  <div
    className={clsx(
      'flex items-center justify-between gap-3',
      disabled && 'opacity-60 pointer-events-none'
    )}
  >
    <div className="min-w-0">
      <p
        className="body-font font-medium"
        style={{ fontSize: small ? 10 : 11, color: 'var(--film-text-label)' }}
      >
        {label}
      </p>
      {sub && (
        <p className="body-font mt-0.5" style={{ fontSize: 9, color: 'var(--film-text-dim)' }}>
          {sub}
        </p>
      )}
    </div>
    <Switch
      checked={checked}
      onChange={onChange}
      className={clsx(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E]',
        checked ? 'bg-[#C47C2E]' : 'bg-zinc-700/80'
      )}
    >
      <span
        className={clsx(
          'inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </Switch>
  </div>
);

export default ToggleRow;
