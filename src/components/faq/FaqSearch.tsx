// src/components/faq/FaqSearch.tsx
import { memo, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';

export interface FaqSearchItem {
  id: string;
  category: string;
  question: string;
  contentText: string;
}

interface FaqSearchProps {
  items: FaqSearchItem[];
  placeholder?: string;
}

/** Highlight matching substring in text */
function highlight(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark style="background:rgba(196,124,46,0.35);color:var(--film-cream);border-radius:2px;padding:0 2px;">$1</mark>'
  );
}

const FaqSearch = memo<FaqSearchProps>(({ items, placeholder = 'Search FAQs…' }) => {
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 150ms debounce on DOM manipulation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const filteredIds = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
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
  }, [items, debouncedSearch]);

  const matchCount = filteredIds.size;
  const isFiltering = debouncedSearch.trim().length > 0;

  // Toggle visibility + apply search highlights to DOM
  useEffect(() => {
    const q = debouncedSearch.trim();
    const accordions = document.querySelectorAll<HTMLDetailsElement>('[data-accordion-id]');
    const sections = document.querySelectorAll<HTMLElement>('[data-faq-section]');
    const badge = document.querySelector<HTMLElement>('[data-faq-count]');
    const emptyState = document.querySelector<HTMLElement>('[data-faq-empty]');

    accordions.forEach((accordion) => {
      const id = accordion.dataset.accordionId;
      const visible = !id || filteredIds.has(id);
      accordion.style.display = visible ? '' : 'none';

      // Apply highlight to question text
      if (visible && q) {
        const summary = accordion.querySelector<HTMLElement>('[data-faq-question]');
        const body = accordion.querySelector<HTMLElement>('[data-faq-body]');
        if (summary) summary.innerHTML = highlight(summary.dataset.rawText ?? summary.textContent ?? '', q);
        if (body) {
          const raw = body.dataset.rawHtml ?? body.innerHTML;
          if (!body.dataset.rawHtml) body.dataset.rawHtml = raw;
          body.innerHTML = highlight(raw, q);
        }
      } else if (visible && !q) {
        // Restore originals
        const summary = accordion.querySelector<HTMLElement>('[data-faq-question]');
        const body = accordion.querySelector<HTMLElement>('[data-faq-body]');
        if (summary && summary.dataset.rawText) summary.textContent = summary.dataset.rawText;
        if (body && body.dataset.rawHtml) { body.innerHTML = body.dataset.rawHtml; delete body.dataset.rawHtml; }
      }
    });

    sections.forEach((section) => {
      const sectionAccordions = section.querySelectorAll<HTMLDetailsElement>('[data-accordion-id]');
      const visibleCount = Array.from(sectionAccordions).filter((a) => a.style.display !== 'none').length;
      section.style.display = visibleCount === 0 ? 'none' : '';
    });

    if (badge) badge.textContent = isFiltering ? `${matchCount} result${matchCount !== 1 ? 's' : ''}` : '';
    if (emptyState) emptyState.style.display = isFiltering && matchCount === 0 ? '' : 'none';
  }, [filteredIds, matchCount, isFiltering, debouncedSearch]);

  // Keyboard shortcut: / or Ctrl+K focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setSearch('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const clear = useCallback(() => {
    setSearch('');
    inputRef.current?.focus();
  }, []);

  return (
    <div
      style={{ position: 'relative', width: '100%', maxWidth: 440 }}
      role="search"
      aria-label="Search frequently asked questions"
    >
      <div
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          borderRadius: 'var(--radius-sm)',
          border: isActive ? '1px solid rgba(196,124,46,0.45)' : '1px solid rgba(255,255,255,0.08)',
          background: isActive ? 'rgba(196,124,46,0.04)' : 'rgba(255,255,255,0.03)',
          transition: 'border-color var(--transition-fast), background var(--transition-fast)',
          boxShadow: isActive ? '0 0 0 3px rgba(196,124,46,0.1)' : 'none',
        }}
      >
        <Search size={14} style={{ color: 'var(--film-text-dim)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="search"
          id="faq-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => setIsActive(false)}
          placeholder={placeholder}
          className="syne-font"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-controls="faq-results"
          aria-label="Search FAQs"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--film-cream)',
            fontSize: 12,
            letterSpacing: '0.02em',
          }}
        />
        {/* Keyboard hint */}
        {!search && !isActive && (
          <kbd
            aria-hidden="true"
            style={{
              fontSize: 9,
              color: 'var(--film-text-ghost)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              padding: '1px 5px',
              fontFamily: 'JetBrains Mono, monospace',
              flexShrink: 0,
              letterSpacing: '0.06em',
            }}
          >
            /
          </kbd>
        )}
        {search && (
          <button
            type="button"
            onClick={clear}
            style={{
              background: 'none', border: 'none', padding: 4, cursor: 'pointer',
              color: 'var(--film-text-dim)', display: 'flex', alignItems: 'center',
              borderRadius: 3, transition: 'color var(--transition-fast)',
              minWidth: 22, minHeight: 22,
            }}
            aria-label="Clear search"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--film-cream)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--film-text-dim)')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Live region for screen reader count */}
      <div
        id="faq-results"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {isFiltering
          ? `${matchCount} FAQ result${matchCount !== 1 ? 's' : ''} for "${debouncedSearch}"`
          : ''}
      </div>
    </div>
  );
});

FaqSearch.displayName = 'FaqSearch';
export default FaqSearch;
