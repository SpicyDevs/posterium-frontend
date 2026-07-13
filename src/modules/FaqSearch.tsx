import { memo, useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import SearchInput from '@/ui/SearchInput';

export interface FaqSearchItem {
  id: string;
  category: string;
  question: string;
  contentText: string;
}

interface FaqSearchProps {
  items: FaqSearchItem[];
}

const FaqSearch = memo<FaqSearchProps>(({ items }) => {
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState(false);

  const filteredIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return new Set(items.map((i) => i.id));
    return new Set(
      items
        .filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.contentText.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
        )
        .map((i) => i.id)
    );
  }, [items, search]);

  const matchCount = filteredIds.size;

  // Toggle visibility of FAQ items based on search
  useEffect(() => {
    const accordions = document.querySelectorAll<HTMLDetailsElement>('[data-accordion-id]');
    const sections = document.querySelectorAll<HTMLElement>('[data-faq-section]');
    const badge = document.querySelector<HTMLElement>('[data-faq-count]');

    accordions.forEach((accordion) => {
      const id = accordion.dataset.accordionId;
      if (id && !filteredIds.has(id)) {
        accordion.style.display = 'none';
      } else {
        accordion.style.display = '';
      }
    });

    // Hide empty sections
    sections.forEach((section) => {
      const sectionAccordions = section.querySelectorAll<HTMLDetailsElement>('[data-accordion-id]');
      const visibleCount = Array.from(sectionAccordions).filter(
        (a) => a.style.display !== 'none'
      ).length;
      section.style.display = visibleCount === 0 ? 'none' : '';
    });

    // Update count badge
    if (badge) {
      badge.textContent = `${matchCount} results`;
    }

    // Show/hide empty state
    const emptyState = document.querySelector<HTMLElement>('[data-faq-empty]');
    if (emptyState) {
      emptyState.style.display = matchCount === 0 ? '' : 'none';
    }
  }, [filteredIds, matchCount]);

  return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onActivate={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          placeholder="Search FAQs..."
          style={{
            height: 38,
            padding: '0 12px',
            border: isActive ? '1px solid rgba(196,124,46,0.4)' : '1px solid rgba(255,255,255,0.08)',
            transition: 'border-color 0.15s ease',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--film-text-dim)',
              display: 'flex',
              alignItems: 'center',
              zIndex: 1,
            }}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
  );
});

FaqSearch.displayName = 'FaqSearch';

export default FaqSearch;
