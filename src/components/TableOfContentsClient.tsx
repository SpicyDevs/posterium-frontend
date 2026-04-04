import { memo } from 'react';
import type { MarkdownHeading } from '@/lib/markdown-headings';

interface Props {
  headings: MarkdownHeading[];
}

const TableOfContentsClient = memo<Props>(({ headings }) => {
  if (!headings.length) return null;

  return (
    <nav aria-label="Table of contents" className="toc-card">
      <div className="toc-title syne-font">Guide Contents</div>
      <ul className="toc-list">
        {headings.map((heading) => (
          <li key={`${heading.slug}-${heading.depth}`} className={`toc-item depth-${heading.depth}`}>
            <a href={`#${heading.slug}`} data-toc-link={heading.slug}>
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
