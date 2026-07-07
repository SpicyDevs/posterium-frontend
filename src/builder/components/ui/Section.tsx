import React, { useCallback, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { readSectionState, writeSectionState } from './sectionStorage';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionId?: string;
  inset?: 'compact' | 'normal';
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = true,
  sectionId,
  inset = 'normal',
}) => {
  const [open, setOpen] = useState(() =>
    sectionId ? readSectionState(sectionId, defaultOpen) : defaultOpen
  );
  const x = inset === 'compact' ? 'px-1' : 'px-3';
  const mx = inset === 'compact' ? 'mx-1' : 'mx-3';

  const toggle = useCallback(() => {
    setOpen((v) => {
      const next = !v;
      if (sectionId) writeSectionState(sectionId, next);
      return next;
    });
  }, [sectionId]);

  return (
    <div className="pt-5 first:pt-3">
      <button
        type="button"
        onClick={toggle}
        className={`w-full flex items-center justify-between ${x} mb-3 focus:outline-none group`}
      >
        <span
          className="flex items-center gap-1.5 syne-font uppercase tracking-widest"
          style={{ fontSize: 9, color: 'var(--film-text-dim)', fontWeight: 700 }}
        >
          {icon && (
            <span style={{ color: 'var(--film-text-dim)', opacity: 1, lineHeight: 0 }}>{icon}</span>
          )}
          {title}
        </span>
        <span
          style={{
            color: 'var(--film-text-dim)',
            opacity: open ? 0.6 : 0.3,
            transition: 'opacity 0.15s',
            lineHeight: 0,
          }}
        >
          {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      </button>
      {open && <div className={`${x} pb-1 space-y-3.5`}>{children}</div>}
      <div
        className={`mt-5 ${mx}`}
        style={{ height: 1, background: 'rgba(255,255,255,0.04)' }}
        aria-hidden="true"
      />
    </div>
  );
};

export default Section;
