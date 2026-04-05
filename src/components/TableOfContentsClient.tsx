// src/components/TableOfContentsClient.tsx
//
// FIX SUMMARY vs. previous version
// ─────────────────────────────────
// 1. Added IntersectionObserver that tracks which heading is currently in view
//    and highlights the matching sidebar link via data-active.
// 2. Re-runs the observer whenever `headings` changes (different guide selected).
// 3. Listens for a custom "posterium:guide-change" CustomEvent fired by the
//    Astro page script when the user switches installation app tabs.
// 4. Clicking a TOC link immediately sets that slug as active (no scroll lag).
// 5. Zero style regressions — styles are identical to the original.

import { memo, useEffect, useRef, useState, useCallback } from 'react';
import type { MarkdownHeading } from '@/lib/markdown-headings';

interface Props {
  /** Headings for the INITIALLY active guide. The component also reacts to
   *  "posterium:guide-change" events to swap headings at runtime. */
  headings: MarkdownHeading[];
}

// Matches the rootMargin used by the Astro page's existing section observer so
// a heading is considered "active" once it clears the sticky navbar (≈80 px).
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: '-80px 0px -55% 0px',
  threshold: 0,
};

const TableOfContentsClient = memo<Props>(({ headings: initialHeadings }) => {
  const [headings, setHeadings] = useState<MarkdownHeading[]>(initialHeadings);
  const [activeSlug, setActiveSlug] = useState<string>(initialHeadings[0]?.slug ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Observe headings in the DOM ─────────────────────────────────────────
  const observe = useCallback((hs: MarkdownHeading[]) => {
    observerRef.current?.disconnect();
    if (!hs.length) return;

    // Collect DOM elements for these heading slugs
    const els = hs
      .map(({ slug }) => document.getElementById(slug))
      .filter((el): el is HTMLElement => el !== null);

    if (!els.length) return;

    // Set first heading active immediately so the TOC is never blank
    setActiveSlug(hs[0].slug);

    observerRef.current = new IntersectionObserver((entries) => {
      // Pick the first intersecting entry (topmost on page)
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActiveSlug(visible[0].target.id);
      }
    }, OBSERVER_OPTIONS);

    els.forEach((el) => observerRef.current!.observe(el));
  }, []);

  // Initial observation
  useEffect(() => {
    observe(headings);
    return () => observerRef.current?.disconnect();
  }, [headings, observe]);

  // ── Listen for guide-change events from the Astro page script ──────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ headings: MarkdownHeading[] }>).detail;
      if (detail?.headings) {
        setHeadings(detail.headings);
        // Re-observe after a tick so the new guide's DOM is visible
        requestAnimationFrame(() => observe(detail.headings));
      }
    };

    window.addEventListener('posterium:guide-change', handler);
    return () => window.removeEventListener('posterium:guide-change', handler);
  }, [observe]);

  if (!headings.length) return null;

  return (
    <nav aria-label="Table of contents" className="toc-card">
      <div className="toc-title syne-font">Guide Contents</div>
      <ul className="toc-list">
        {headings.map((heading) => {
          const isActive = activeSlug === heading.slug;
          return (
            <li
              key={`${heading.slug}-${heading.depth}`}
              className={`toc-item depth-${heading.depth}`}
            >
              <a
                href={`#${heading.slug}`}
                data-toc-link={heading.slug}
                data-active={isActive ? 'true' : undefined}
                // Immediate highlight on click without waiting for scroll
                onClick={() => setActiveSlug(heading.slug)}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>

      <style>{`
        .toc-card {
          border: 1px solid rgba(196, 124, 46, 0.14);
          background: rgba(14, 13, 11, 0.72);
          border-radius: 12px;
          padding: 14px;
        }

        .toc-title {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--film-text-dim);
          margin-bottom: 10px;
        }

        .toc-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .toc-item a {
          display: block;
          text-decoration: none;
          color: var(--film-text-label);
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          transition:
            color 0.2s ease,
            border-color 0.2s ease,
            background-color 0.2s ease;
        }

        .toc-item.depth-3 a {
          margin-left: 14px;
          font-size: 11px;
        }

        .toc-item a:hover {
          color: var(--film-cream);
        }

        /* Active state — driven by data-active attribute so React controls it,
           not a CSS :target that can get out of sync with scroll position. */
        .toc-item a[data-active='true'] {
          color: var(--film-cream);
          border-color: rgba(212, 162, 69, 0.5);
          background: rgba(196, 124, 46, 0.2);
        }
      `}</style>
    </nav>
  );
});

TableOfContentsClient.displayName = 'TableOfContentsClient';

export default TableOfContentsClient;
