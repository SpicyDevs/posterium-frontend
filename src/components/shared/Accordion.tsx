import React, { memo, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Accordion = memo<AccordionProps>(({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const triggerId = useId();

  return (
    <article
      style={{
        border: '1px solid rgba(196,124,46,0.14)',
        background: 'rgba(24,22,18,0.6)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        id={triggerId}
        style={{
          width: '100%',
          border: 'none',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '14px 16px',
          color: 'var(--film-cream)',
          textAlign: 'left',
        }}
      >
        <span
          className="syne-font"
          style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}
        >
          {title}
        </span>
        <ChevronDown
          size={15}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {open ? (
        <div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          style={{
            borderTop: '1px solid rgba(196,124,46,0.12)',
            padding: '14px 16px',
            color: 'var(--film-text-body)',
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {children}
        </div>
      ) : null}
    </article>
  );
});

Accordion.displayName = 'Accordion';

export default Accordion;
