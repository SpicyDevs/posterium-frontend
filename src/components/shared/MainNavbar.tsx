import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Coffee, Github, Menu, Search, X } from 'lucide-react';

export interface NavbarLink {
  label: string;
  href: string;
  external?: boolean;
}

interface NavbarSearchConfig {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  onActivate?: () => void;
}

interface MainNavbarProps {
  sectionLinks?: NavbarLink[];
  search?: NavbarSearchConfig;
  revealOnScroll?: boolean;
  fixed?: boolean;
  rightActions?: ReactNode;
  compactLogo?: boolean;
  keepSearchOnMobile?: boolean;
  showMobileBuildCta?: boolean;
}

const APP_LINKS: NavbarLink[] = [
  { label: 'Build', href: '/build' },
  { label: 'Installation', href: '/installation' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Examples', href: '/examples' },
];

const MainNavbar = memo<MainNavbarProps>(
  ({
    sectionLinks = [],
    search,
    revealOnScroll = false,
    fixed = true,
    rightActions,
    compactLogo = false,
    keepSearchOnMobile = false,
    showMobileBuildCta = false,
  }) => {
    const [visible, setVisible] = useState(!revealOnScroll);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (!revealOnScroll) {
        setVisible(true);
        return;
      }

      const update = () => {
        const heroH = window.innerHeight * 0.72;
        setVisible(window.scrollY > heroH);
        setScrolled(window.scrollY > heroH + 20);
      };

      update();
      window.addEventListener('scroll', update, { passive: true });
      return () => window.removeEventListener('scroll', update);
    }, [revealOnScroll]);

    const links = useMemo(() => [...sectionLinks, ...APP_LINKS], [sectionLinks]);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    useEffect(() => {
      if (!search) return;

      const isEditableTarget = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) return false;
        const tag = target.tagName;
        return (
          target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
        );
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (isEditableTarget(event.target)) return;

        const isSlash =
          event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
        const isFind = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f';

        if (!isSlash && !isFind) return;
        const input = searchInputRef.current;
        if (!input || input.readOnly || input.disabled || input.offsetParent === null) return;

        event.preventDefault();
        input.focus();
        input.select();
        search.onActivate?.();
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [search]);

    const navStyle: React.CSSProperties = {
      position: fixed ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 clamp(12px,2vw,20px)',
      background: scrolled || !revealOnScroll ? 'rgba(7,7,6,0.97)' : 'transparent',
      backdropFilter: scrolled || !revealOnScroll ? 'blur(24px) saturate(1.3)' : 'none',
      borderBottom:
        scrolled || !revealOnScroll ? '1px solid rgba(196,124,46,0.1)' : '1px solid transparent',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      pointerEvents: visible ? 'all' : 'none',
      transition:
        'opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1), background 0.35s ease, border-color 0.35s ease',
    };

    return (
      <>
        <nav aria-label="Main navigation" style={navStyle}>
          <a href="/" className="main-nav-logo" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span
              className="poster-font"
              style={{
                fontSize: compactLogo ? 18 : 22,
                color: 'var(--film-cream)',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              POSTERIUM
            </span>
          </a>

          <div
            className="main-nav-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              marginLeft: 8,
            }}
          >
            {links.map(({ label, href, external }) => (
              <a
                key={label + href}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="hover-cream"
                style={{
                  color: 'rgba(224, 210, 180, 0.88)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  textDecoration: 'none',
                  fontFamily: 'Syne, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </a>
            ))}
          </div>

          <div
            className="main-nav-search"
            style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}
          >
            <div
              style={{
                width: 'min(440px,100%)',
                height: 34,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--film-text-dim)',
              }}
            >
              <Search size={13} className="shrink-0" />
              <input
                ref={searchInputRef}
                value={search?.value ?? ''}
                onChange={(e) => search?.onChange?.(e.target.value)}
                onFocus={() => search?.onActivate?.()}
                readOnly={search?.readOnly || !search?.onChange}
                placeholder={search?.placeholder ?? 'Search…'}
                className="syne-font"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--film-cream)',
                  fontSize: 11,
                  letterSpacing: '0.02em',
                }}
              />
            </div>
          </div>

          <div
            className="main-nav-right"
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            <a
              href="https://buymeacoffee.com/dikhit"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy me a coffee"
              className="nav-desktop-item"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                border: '1px solid rgba(196,124,46,0.28)',
                background: 'rgba(196,124,46,0.14)',
                color: 'var(--film-cream)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'Syne, sans-serif',
              }}
            >
              <Coffee size={12} className="shrink-0" />
              <span className="main-nav-bmc-text">Buy me a Coffee</span>
            </a>

            <a
              href="https://github.com/xdaayush/freeposterapi"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="nav-desktop-item hover-cream"
              style={{
                color: 'rgba(200, 185, 155, 0.78)',
                display: 'flex',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 4,
              }}
            >
              <Github size={15} />
            </a>

            {rightActions}

            <button
              className="main-nav-mobile-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{
                background: 'none',
                border: '1px solid rgba(196,124,46,0.2)',
                color: 'var(--film-cream)',
                width: 34,
                height: 34,
                borderRadius: 4,
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'none',
              }}
            >
              {menuOpen ? <X size={14} /> : <Menu size={14} />}
            </button>

            {showMobileBuildCta ? (
              <a
                href="/build"
                className="main-nav-mobile-build syne-font"
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: 5,
                  background: 'var(--film-amber)',
                  color: '#070706',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '7px 12px',
                  borderRadius: 4,
                  flexShrink: 0,
                  boxShadow: '0 0 18px rgba(196,124,46,0.22)',
                }}
              >
                Build
              </a>
            ) : null}
          </div>
        </nav>

        {menuOpen && visible && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            style={{
              position: fixed ? 'fixed' : 'absolute',
              top: 56,
              left: 0,
              right: 0,
              background: 'rgba(7,7,6,0.98)',
              backdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(196,124,46,0.1)',
              padding: '8px 12px 14px',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {!keepSearchOnMobile ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Search size={13} color="var(--film-text-dim)" />
                <input
                  value={search?.value ?? ''}
                  onChange={(e) => search?.onChange?.(e.target.value)}
                  readOnly={search?.readOnly || !search?.onChange}
                  placeholder={search?.placeholder ?? 'Search…'}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--film-cream)',
                    fontSize: 12,
                  }}
                />
              </div>
            ) : null}

            {links.map(({ label, href, external }) => (
              <a
                key={`mobile-${label}-${href}`}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                onClick={closeMenu}
                className="syne-font hover-cream"
                style={{
                  color: 'rgba(240, 230, 204, 0.82)',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '10px 6px',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(196,124,46,0.06)',
                }}
              >
                {label}
              </a>
            ))}
          </div>
        )}

        <style>{`
          @media (max-width: 1280px) {
            .main-nav-bmc-text { display: none; }
          }
          @media (max-width: 1024px) {
            .main-nav-links, .nav-desktop-item { display: none !important; }
            .main-nav-search { display: ${keepSearchOnMobile ? 'flex' : 'none'} !important; }
            .main-nav-mobile-toggle { display: inline-flex !important; }
            .main-nav-mobile-build { display: inline-flex !important; }
            .main-nav-search { order: 0; flex: 1 1 auto; min-width: 0; justify-content: flex-start !important; margin: 0 8px 0 10px; }
            .main-nav-search > div { width: 100% !important; max-width: none !important; }
            .main-nav-right { margin-left: auto; justify-content: flex-end; gap: 8px !important; width: auto; }
            .main-nav-mobile-build { order: 0; }
            .main-nav-mobile-toggle { order: 1; }
            nav[aria-label="Main navigation"] { flex-wrap: nowrap; height: 56px !important; min-height: 56px; align-items: center !important; padding-top: 0 !important; padding-bottom: 0 !important; }
          }
          @media (max-width: 680px) {
            .main-nav-logo .poster-font { font-size: 18px !important; }
            .main-nav-search { margin: 0 6px !important; }
            .main-nav-mobile-build { padding: 7px 10px !important; }
          }
        `}</style>
      </>
    );
  }
);

MainNavbar.displayName = 'MainNavbar';

export default MainNavbar;
