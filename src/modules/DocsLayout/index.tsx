import { memo, type ReactNode } from 'react';
import MainNavbar from '@/modules/Navbar/MainNavbar';

export interface DocsSidebarLink {
  id: string;
  label: string;
  href: string;
  onClick?: () => void;
  active?: boolean;
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
  sidebarFooter?: ReactNode;
  search?: DocsSearchConfig;
  children: ReactNode;
}

/**
 * DocsLayout - A React layout component for documentation-style pages.
 * Styles are now consolidated in global.css (.docs-layout-main, .docs-layout-sidebar, .prose)
 */
const DocsLayout = memo<DocsLayoutProps>(
  ({ sidebarTitle = 'Table of Contents', sidebarLinks, sidebarFooter, search, children }) => {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--film-black)',
          color: 'var(--film-cream)',
        }}
      >
        <MainNavbar search={search} keepSearchOnMobile showMobileBuildCta />

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
                  onClick={(event) => {
                    if (link.onClick) {
                      event.preventDefault();
                      link.onClick();
                    }
                  }}
                  className="hover-cream syne-font"
                  style={{
                    textDecoration: 'none',
                    color: link.active ? 'var(--film-cream)' : 'var(--film-text-label)',
                    fontSize: 12,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: link.active
                      ? '1px solid rgba(212,162,69,0.5)'
                      : '1px solid rgba(255,255,255,0.06)',
                    background: link.active ? 'rgba(196,124,46,0.2)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            {sidebarFooter ? <div style={{ marginTop: 12 }}>{sidebarFooter}</div> : null}
          </aside>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {children}
          </section>
        </main>
      </div>
    );
  }
);

DocsLayout.displayName = 'DocsLayout';

export default DocsLayout;
