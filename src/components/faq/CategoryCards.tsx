// src/components/faq/CategoryCards.tsx
import React, { useRef } from 'react';
import { useAnimation } from '@/lib/hooks/useAnimation';

interface Category {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface CategoryCardsProps {
  categories: Category[];
  /** CSS ID prefix for jump-link targets e.g. "#faq-general" */
  anchorPrefix?: string;
}

const CARD_STYLE_BASE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '16px 18px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  textDecoration: 'none',
  textAlign: 'left',
  transition: 'transform var(--transition-spring), box-shadow var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast)',
  minHeight: 160,
  flexShrink: 0,
  width: 160,
  scrollSnapAlign: 'start',
};

/**
 * Horizontal-scroll on mobile, responsive grid on desktop.
 * Click jumps to the matching FAQ section.
 * Hover: lift effect + amber border.
 */
export const CategoryCards: React.FC<CategoryCardsProps> = ({
  categories,
  anchorPrefix = '#faq-',
}) => {
  const { ref, shouldAnimate } = useAnimation({ rootMargin: '80px' });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      role="navigation"
      aria-label="FAQ categories"
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch' as any,
        scrollSnapType: 'x mandatory',
        display: 'flex',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) 2px var(--space-4)',
      } as React.CSSProperties}
    >
      {categories.map((cat, i) => (
        <a
          key={cat.id}
          href={`${anchorPrefix}${cat.id}`}
          style={{
            ...CARD_STYLE_BASE,
            opacity: shouldAnimate ? 1 : 0,
            transform: shouldAnimate ? 'translateY(0)' : 'translateY(16px)',
            transitionDelay: `${i * 60}ms`,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.transform = 'translateY(-4px)';
            el.style.borderColor = 'rgba(196,124,46,0.4)';
            el.style.background = 'rgba(196,124,46,0.06)';
            el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.transform = 'translateY(0)';
            el.style.borderColor = 'rgba(255,255,255,0.07)';
            el.style.background = 'rgba(255,255,255,0.03)';
            el.style.boxShadow = 'none';
          }}
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(`${anchorPrefix}${cat.id}`);
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {cat.icon && (
            <span style={{ fontSize: 28, lineHeight: 1 }}>{cat.icon}</span>
          )}
          <span
            className="syne-font"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--film-cream)',
              letterSpacing: '0.02em',
              lineHeight: 1.3,
            }}
          >
            {cat.label}
          </span>
          {cat.count != null && (
            <span
              className="mono-font"
              style={{
                fontSize: 9,
                color: 'var(--film-text-ghost)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 'auto',
              }}
            >
              {cat.count} question{cat.count !== 1 ? 's' : ''}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};

export default CategoryCards;
