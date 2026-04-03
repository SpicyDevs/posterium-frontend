import { memo, useMemo, useState } from 'react';
import Accordion from '@/components/shared/Accordion';
import { AmberTag } from '@/components/shared/primitives';
import { renderBasicMarkdown } from '@/components/shared/markdown';
import DocsLayout, { type DocsSidebarLink } from '@/components/shared/DocsLayout';
import faqsData from '@/data/faqs.json';

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqs = faqsData as FaqItem[];

const FaqPage = memo(() => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((item) => {
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const sections = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    filtered.forEach((item) => {
      const current = map.get(item.category) ?? [];
      current.push(item);
      map.set(item.category, current);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const sidebarLinks = useMemo<DocsSidebarLink[]>(
    () =>
      sections.map(([category]) => ({
        id: category,
        label: category,
        href: `#${category.toLowerCase().replace(/\s+/g, '-')}`,
      })),
    [sections]
  );

  return (
    <DocsLayout
      sidebarLinks={sidebarLinks}
      searchConfig={{
        value: search,
        onChange: setSearch,
        placeholder: 'Search FAQs…',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            className="poster-font"
            style={{
              margin: 0,
              fontSize: 'clamp(38px,7vw,64px)',
              letterSpacing: '0.08em',
              lineHeight: 0.9,
            }}
          >
            FAQ
          </h1>
          <p
            className="body-font"
            style={{ margin: '10px 0 0', color: 'var(--film-text-dim)', fontSize: 14 }}
          >
            Find answers for API usage, builder workflows, and integrations.
          </p>
        </div>
        <AmberTag>{filtered.length} results</AmberTag>
      </div>

      {sections.map(([category, items]) => (
        <section
          key={category}
          id={category.toLowerCase().replace(/\s+/g, '-')}
          style={{ scrollMarginTop: 88 }}
        >
          <h2
            className="syne-font"
            style={{
              margin: '0 0 10px',
              fontSize: 14,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--film-pale)',
            }}
          >
            {category}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, index) => (
              <Accordion key={item.id} title={item.question} defaultOpen={index === 0 && !search.trim()}>
                <div className="body-font faq-markdown">{renderBasicMarkdown(item.answer)}</div>
              </Accordion>
            ))}
          </div>
        </section>
      ))}

      {!sections.length ? (
        <div
          className="syne-font"
          style={{
            border: '1px solid rgba(196,124,46,0.14)',
            background: 'rgba(24,22,18,0.6)',
            borderRadius: 10,
            padding: 16,
            color: 'var(--film-text-dim)',
            fontSize: 13,
          }}
        >
          No FAQs matched your search.
        </div>
      ) : null}

      <style>{`
        .faq-markdown p { margin: 0 0 10px; }
        .faq-markdown p:last-child { margin-bottom: 0; }
        .faq-markdown ul { margin: 0 0 10px; padding-left: 18px; }
        .faq-markdown li { margin: 0 0 6px; }
        .faq-markdown strong { color: var(--film-cream); }
        .faq-markdown code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          padding: 1px 4px;
          color: var(--film-pale);
        }
        .faq-markdown a { color: var(--film-gold); }
      `}</style>
    </DocsLayout>
  );
});

FaqPage.displayName = 'FaqPage';

export default FaqPage;
