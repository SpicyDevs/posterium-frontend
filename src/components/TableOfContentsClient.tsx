import { memo, useEffect, useMemo, useState } from 'react';
import type { MarkdownHeading } from '@/lib/markdown-headings';

interface Props {
  headings: MarkdownHeading[];
  activeGuideId?: string;
}

const TableOfContentsClient = memo<Props>(({ headings, activeGuideId }) => {
  const [activeHeadingSlug, setActiveHeadingSlug] = useState<string | null>(headings[0]?.slug ?? null);

  const headingSlugs = useMemo(() => headings.map((heading) => heading.slug), [headings]);

  useEffect(() => {
    setActiveHeadingSlug(headings[0]?.slug ?? null);
  }, [activeGuideId, headings]);

  useEffect(() => {
    if (!headingSlugs.length) return;

    const activeGuideArticle = activeGuideId
      ? document.querySelector<HTMLElement>(`[data-guide-id="${activeGuideId}"]`)
      : null;

    const headingElements = headingSlugs
      .map((slug) => activeGuideArticle?.querySelector<HTMLElement>(`[id="${slug}"]`) ?? null)
      .filter((element): element is HTMLElement => Boolean(element));

    if (!headingElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length) {
          const headingId = visible[0].target.id;
          if (headingId) setActiveHeadingSlug(headingId);
        }
      },
      { rootMargin: '-88px 0px -50% 0px', threshold: [0.1, 0.45, 1] }
    );

    headingElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headingSlugs, activeGuideId]);

  if (!headings.length) return null;

  return (
    <nav aria-label="Table of contents" className="toc-card">
      <div className="toc-title syne-font">Guide Contents</div>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li key={`${heading.slug}-${heading.depth}`} className={`toc-item depth-${heading.depth}`}>
            <a
              href={`#${heading.slug}`}
              data-toc-link={heading.slug}
              data-active={activeHeadingSlug === heading.slug}
              onClick={(event) => {
                if (!activeGuideId) return;
                event.preventDefault();
                const activeGuideArticle = document.querySelector<HTMLElement>(
                  `[data-guide-id="${activeGuideId}"]`
                );
                const target = activeGuideArticle?.querySelector<HTMLElement>(`[id="${heading.slug}"]`);
                if (!target) return;
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveHeadingSlug(heading.slug);
              }}
              aria-current={activeHeadingSlug === heading.slug ? 'true' : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
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

        .toc-item a[data-active='true'] {
          color: var(--film-cream);
          border: 1px solid rgba(212, 162, 69, 0.5);
          background: rgba(196, 124, 46, 0.2);
        }
      `}</style>
    </nav>
  );
});

TableOfContentsClient.displayName = 'TableOfContentsClient';

export default TableOfContentsClient;
