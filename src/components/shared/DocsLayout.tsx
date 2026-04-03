import { memo, type ReactNode } from 'react';
import MainNavbar from '@/components/shared/MainNavbar';

export interface DocsSidebarLink {
  id: string;
  label: string;
  href: string;
}

interface DocsSearchConfig {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

interface DocsLayoutProps {
  sidebarTitle?: string;
  sidebarLinks: DocsSidebarLink[];
  search?: DocsSearchConfig;
  children: ReactNode;
}

const DocsLayout = memo<DocsLayoutProps>(
  ({ sidebarTitle = 'Table of Contents', sidebarLinks, search, children }) => {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
        }}
      >
        <MainNavbar
          search={search}
          keepSearchOnMobile
          showMobileBuildCta
        />

        <main className="docs-layout-main">
          <aside className="docs-layout-sidebar">
            <div
              className="syne-font"
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--film-text-dim)',
                marginBottom: 10,
              }}
            >
              {sidebarTitle}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sidebarLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="hover-cream syne-font"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--film-text-label)',
                    fontSize: 12,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </aside>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</section>
        </main>

        <style>{`
          .docs-layout-main {
            max-width: 1240px;
            margin: 0 auto;
            padding: 84px 20px 40px;
            display: grid;
            grid-template-columns: minmax(220px,280px) minmax(0,1fr);
            gap: 20px;
          }

          .docs-layout-sidebar {
            position: sticky;
            top: 84px;
            align-self: start;
            border: 1px solid rgba(196,124,46,0.14);
            background: rgba(14,13,11,0.72);
            border-radius: 12px;
            padding: 14px;
          }

          .docs-prose {
            color: var(--film-text-body);
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            line-height: 1.65;
          }
          .docs-prose h1, .docs-prose h2, .docs-prose h3, .docs-prose h4 {
            font-family: 'Syne', sans-serif;
            color: var(--film-cream);
            letter-spacing: 0.02em;
            margin: 0 0 12px;
          }
          .docs-prose h2 { margin-top: 18px; font-size: 20px; }
          .docs-prose h3 { margin-top: 14px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.07em; }
          .docs-prose p { margin: 0 0 12px; }
          .docs-prose ul, .docs-prose ol { margin: 0 0 12px; padding-left: 20px; }
          .docs-prose li { margin: 0 0 6px; }
          .docs-prose a { color: var(--film-gold); }
          .docs-prose strong { color: var(--film-cream); }
          .docs-prose code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 4px;
            padding: 1px 4px;
            color: var(--film-pale);
          }
          .docs-prose pre {
            background: rgba(10,10,9,0.92);
            border: 1px solid rgba(196,124,46,0.2);
            border-radius: 10px;
            padding: 12px;
            overflow-x: auto;
            margin: 0 0 12px;
          }
          .docs-prose pre code {
            border: 0;
            padding: 0;
            background: transparent;
            color: var(--film-cream);
            font-size: 12px;
            line-height: 1.6;
          }
          .docs-prose table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 0 14px;
            font-size: 13px;
          }
          .docs-prose th, .docs-prose td {
            border: 1px solid rgba(196,124,46,0.16);
            padding: 8px 10px;
            text-align: left;
          }
          .docs-prose th {
            color: var(--film-pale);
            background: rgba(196,124,46,0.08);
          }
          .docs-prose img {
            max-width: 100%;
            border-radius: 8px;
            border: 1px solid rgba(196,124,46,0.16);
            margin: 8px 0 12px;
          }

          @media (max-width: 960px) {
            .docs-layout-main {
              grid-template-columns: 1fr;
            }
            .docs-layout-sidebar {
              position: static;
            }
          }
        `}</style>
      </div>
    );
  }
);

DocsLayout.displayName = 'DocsLayout';

export default DocsLayout;
