import { memo } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface SelectBoxProps {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}

const SelectBox = memo<SelectBoxProps>(({ value, onChange, options }) => (
  <Listbox value={value} onChange={onChange}>
    <div className="relative">
      <ListboxButton
        className="w-full flex items-center justify-between gap-1 h-9 px-2.5 rounded-lg text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C47C2E] syne-font"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--film-pale)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,124,46,0.4)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
        }}
      >
        <span className="truncate">{options.find((o) => o.id === value)?.label ?? value}</span>
        <ChevronDown size={10} style={{ color: 'var(--film-text-dim)', flexShrink: 0 }} />
      </ListboxButton>
      <ListboxOptions
        transition
        className="absolute z-50 mt-1 w-full py-1 rounded-xl shadow-2xl shadow-black/50 text-[11px] overflow-auto max-h-52 focus:outline-none transition duration-75 ease-in data-[closed]:scale-95 data-[closed]:opacity-0"
        style={{
          background: 'var(--film-mid)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {options.map((opt) => (
          <ListboxOption
            key={opt.id}
            value={opt.id}
            className={({ active, selected }) =>
              clsx(
                'flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors syne-font',
                active && 'bg-[rgba(196,124,46,0.1)]',
                !active && selected && 'text-[var(--film-pale)]',
                !active && !selected && 'text-[var(--film-text-label)]'
              )
            }
          >
            {({ selected }) => (
              <>
                <span className="flex-1 truncate">{opt.label}</span>
                {selected && (
                  <Check size={10} style={{ color: 'var(--film-amber)', flexShrink: 0 }} />
                )}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </div>
  </Listbox>
));
SelectBox.displayName = 'SelectBox';

export default SelectBox;
