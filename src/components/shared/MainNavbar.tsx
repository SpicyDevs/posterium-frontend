// src/components/shared/MainNavbar.tsx
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Coffee, Menu, Search, X } from 'lucide-react';

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

/** Detects macOS to show ⌘K vs Ctrl+K hint in the search bar. */
function usePlatformModKey(): string {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(
      typeof navigator !== 'undefined' &&
        (/Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
          /Mac/.test(navigator.userAgent))
    );
  }, []);
  return isMac ? '⌘K' : 'Ctrl+K';
}

/** Returns the pathname of the current page for active link detection. */
function useActivePath(): string {
  const [path, setPath] = useState('/');
  useEffect(() => {
    setPath(window.location.pathname);
  }, []);
  return path;
}

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
    const menuRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const modKey = usePlatformModKey();
    const activePath = useActivePath();

    // Reveal-on-scroll behaviour
    useEffect(() => {
      if (!revealOnScroll) {
        setVisible(true);
        return;
      }
      const update = () => {
        const threshold = window.innerHeight * 0.15;
        setVisible(window.scrollY > threshold);
        setScrolled(window.scrollY > threshold + 20);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      return () => window.removeEventListener('scroll', update);
    }, [revealOnScroll]);

    const links = useMemo(() => [...sectionLinks, ...APP_LINKS], [sectionLinks]);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    // Dismiss mobile menu on outside click or Escape
    useEffect(() => {
      if (!menuOpen) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeMenu();
          hamburgerRef.current?.focus();
        }
      };
      const handleClick = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
            !hamburgerRef.current?.contains(e.target as Node)) {
          closeMenu();
        }
      };
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
      return () => {
        document.removeEventListener('keydown', handleKey);
        document.removeEventListener('mousedown', handleClick);
      };
    }, [menuOpen, closeMenu]);

    // "/" key to focus search; Escape to blur
    useEffect(() => {
      if (!search) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        const t = e.target as HTMLElement;
        const inInput = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
        if (inInput) return;
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          search.onActivate?.();
        }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const t = e.target as HTMLElement;
          if (t === searchInputRef.current) searchInputRef.current?.blur();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }, [search]);

    const isFrosted = scrolled || !revealOnScroll;

    const navStyle: React.CSSProperties = {
      position: fixed ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 'var(--z-header)' as unknown as number,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '0 clamp(12px, 2vw, 20px)',
      background: isFrosted ? 'rgba(7,7,6,0.97)' : 'transparent',
      backdropFilter: isFrosted ? 'blur(24px) saturate(1.3)' : 'none',
      borderBottom: isFrosted ? '1px solid rgba(196,124,46,0.1)' : '1px solid transparent',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      pointerEvents: visible ? 'all' : 'none',
      transition: 'opacity var(--transition-spring), transform var(--transition-spring), background var(--transition-slow), border-color var(--transition-slow)',
    };

    return (
      <>
        <nav aria-label="Main navigation" style={navStyle}>
          {/* Logo */}
          <a href="/" className="main-nav-logo" style={{ textDecoration: 'none', flexShrink: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
            <span
              className="poster-font"
              style={{
                fontSize: compactLogo ? 18 : 'clamp(16px, 2.2vw, 22px)',
                color: 'var(--film-cream)',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              POSTERIUM
            </span>
          </a>

          {/* Desktop nav links */}
          <div
            className="main-nav-links"
            style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 8 }}
          >
            {links.map(({ label, href, external }) => {
              const isActive = activePath === href || activePath.startsWith(href + '/');
              return (
                <a
                  key={label + href}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className="hover-cream"
                  style={{
                    color: isActive ? 'var(--film-amber)' : 'rgba(224, 210, 180, 0.88)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '0 10px',
                    textDecoration: 'none',
                    fontFamily: 'Syne, sans-serif',
                    whiteSpace: 'nowrap',
                    minHeight: 44,
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  {label}
                  {/* Active indicator dot */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: 'var(--film-amber)',
                      }}
                    />
                  )}
                </a>
              );
            })}
          </div>

          {/* Search bar (desktop) */}
          {search && (
            <div
              className="main-nav-search"
              style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}
            >
              <div
                style={{
                  width: 'min(440px, 100%)',
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'var(--film-text-dim)',
                }}
              >
                <Search size={13} style={{ flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  value={search.value}
                  onChange={(e) => search.onChange?.(e.target.value)}
                  onFocus={() => search.onActivate?.()}
                  readOnly={search.readOnly || !search.onChange}
                  placeholder={search.placeholder ?? 'Search…'}
                  className="syne-font"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--film-cream)',
                    fontSize: 11,
                    letterSpacing: '0.02em',
                    minWidth: 0,
                  }}
                />
                {/* Platform-aware keyboard hint — desktop only */}
                <kbd
                  className="main-nav-kbd-hint"
                  style={{
                    fontSize: 9,
                    color: 'var(--film-text-ghost)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    padding: '1px 4px',
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {modKey}
                </kbd>
              </div>
            </div>
          )}

          {/* Right area */}
          <div
            className="main-nav-right"
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            {/* BMC/Support — shown at 1600px+ */}
            <a
              href="https://www.buymeacoffee.com"
              target="_blank"
              rel="noreferrer noopener"
              className="nav-bmc-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px',
                minHeight: 44,
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                border: '1px solid rgba(196,124,46,0.28)',
                background: 'rgba(196,124,46,0.14)',
                color: 'var(--film-cream)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: 'Syne, sans-serif',
                transition: 'background var(--transition-fast)',
              }}
            >
              <Coffee size={12} style={{ flexShrink: 0 }} />
              <span>Support</span>
            </a>

            {rightActions}

            {/* Mobile Build CTA — shown below 1024px */}
            {showMobileBuildCta && (
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
                  padding: '0 12px',
                  minHeight: 44,
                  borderRadius: 'var(--radius-xs)',
                  flexShrink: 0,
                  boxShadow: '0 0 18px rgba(196,124,46,0.22)',
                }}
              >
                Build
              </a>
            )}

            {/* Hamburger — 44×44px touch target */}
            <button
              ref={hamburgerRef}
              className="main-nav-mobile-toggle"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              style={{
                background: 'none',
                border: '1px solid rgba(196,124,46,0.2)',
                color: 'var(--film-cream)',
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'none',
                flexShrink: 0,
              }}
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown overlay */}
        {menuOpen && visible && (
          <div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            style={{
              position: fixed ? 'fixed' : 'absolute',
              top: 56,
              left: 0,
              right: 0,
              background: 'rgba(7,7,6,0.97)',
              backdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(196,124,46,0.1)',
              padding: 'var(--space-2) var(--space-3) var(--space-4)',
              zIndex: 'var(--z-overlay)' as unknown as number,
              display: 'flex',
              flexDirection: 'column',
              animation: 'fade-up 0.25s ease',
            }}
          >
            {/* Mobile search */}
            {search && !keepSearchOnMobile && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  padding: '10px 6px',
                  borderBottom: '1px solid rgba(196,124,46,0.06)',
                  marginBottom: 4,
                }}
              >
                <Search size={13} color="var(--film-text-dim)" />
                <input
                  value={search.value}
                  onChange={(e) => search.onChange?.(e.target.value)}
                  readOnly={search.readOnly || !search.onChange}
                  placeholder={search.placeholder ?? 'Search…'}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--film-cream)',
                    fontSize: 13,
                  }}
                />
              </div>
            )}

            {/* Nav links */}
            {links.map(({ label, href, external }) => {
              const isActive = activePath === href || activePath.startsWith(href + '/');
              return (
                <a
                  key={`mobile-${label}-${href}`}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  onClick={closeMenu}
                  className="syne-font hover-cream"
                  style={{
                    color: isActive ? 'var(--film-amber)' : 'rgba(240, 230, 204, 0.82)',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0 6px',
                    minHeight: 44,
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    borderBottom: '1px solid rgba(196,124,46,0.06)',
                    borderLeft: isActive ? '3px solid var(--film-amber)' : '3px solid transparent',
                    paddingLeft: isActive ? '9px' : '6px',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>
        )}

        <style>{`
          /* 320–767px: hamburger visible, links/search hidden */
          @media (max-width: 767px) {
            .main-nav-links { display: none !important; }
            .main-nav-search { display: none !important; }
            .main-nav-mobile-toggle { display: inline-flex !important; }
            .main-nav-mobile-build { display: inline-flex !important; }
            .nav-bmc-btn { display: none !important; }
            .main-nav-kbd-hint { display: none !important; }
          }
          /* 768–1023px: search inline, no desktop links */
          @media (min-width: 768px) and (max-width: 1023px) {
            .main-nav-links { display: none !important; }
            .main-nav-search { display: flex !important; flex: 1; }
            .main-nav-mobile-toggle { display: inline-flex !important; }
            .main-nav-mobile-build { display: none !important; }
            .nav-bmc-btn { display: none !important; }
          }
          /* 1024–1599px: links + search inline, no hamburger, no BMC */
          @media (min-width: 1024px) and (max-width: 1599px) {
            .main-nav-links { display: flex !important; }
            .main-nav-search { display: flex !important; }
            .main-nav-mobile-toggle { display: none !important; }
            .main-nav-mobile-build { display: none !important; }
            .nav-bmc-btn { display: none !important; }
          }
          /* 1600px+: everything visible including BMC */
          @media (min-width: 1600px) {
            .main-nav-links { display: flex !important; }
            .main-nav-search { display: flex !important; }
            .main-nav-mobile-toggle { display: none !important; }
            .main-nav-mobile-build { display: none !important; }
            .nav-bmc-btn { display: inline-flex !important; }
          }
        `}</style>
      </>
    );
  }
);

MainNavbar.displayName = 'MainNavbar';

export default MainNavbar;
