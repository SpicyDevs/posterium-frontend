import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Coffee, Github, Menu, Search, X } from 'lucide-react';
import { useIsDesktop, useIsMobile, useBreakpoint } from '../../lib/breakpoints';

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
  keepSearchOnMobile?: boolean;
  showMobileBuildCta?: boolean;
  compactLogo?: boolean;
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
  }) => {
    const [visible, setVisible] = useState(!revealOnScroll);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const isDesktop = useIsDesktop();
    const isMobile = useIsMobile();
    const bp = useBreakpoint();

    useEffect(() => {
      if (!revealOnScroll) {
        setVisible(true);
        return;
      }

      const update = () => {
        const threshold = window.innerHeight * 0.15;
        const isVisible = window.scrollY > threshold;
        setVisible(isVisible);
        setScrolled(window.scrollY > 20);
      };

      update();
      window.addEventListener('scroll', update, { passive: true });
      return () => window.removeEventListener('scroll', update);
    }, [revealOnScroll]);

    const links = useMemo(() => [...sectionLinks, ...APP_LINKS], [sectionLinks]);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    useEffect(() => {
      if (!search) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        const isEditable = (target: EventTarget | null): boolean => {
          if (!(target instanceof HTMLElement)) return false;
          const tag = target.tagName;
          return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
        };

        if (isEditable(event.target)) {
          if (event.key === 'Escape') {
            searchInputRef.current?.blur();
          }
          return;
        }

        if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          searchInputRef.current?.focus();
          search.onActivate?.();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [search]);

    // Responsive sizing logic
    const isNarrowMobile = !bp || bp === 'sm'; // < 480px
    const isWideMobile = bp === 'md'; // 480-767px
    const isTablet = bp === 'lg'; // 768-1023px
    const isLargeDesktop = bp === 'xl'; // 1024-1599px
    const isUltraWide = bp === 'xxl'; // 1600px+

    const fontSize = isNarrowMobile ? 16 : (isWideMobile || isTablet) ? 18 : 22;

    const navStyle: React.CSSProperties = {
      position: fixed ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 'var(--z-header)' as any,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 var(--space-5)',
      background: scrolled || !revealOnScroll ? 'rgba(7,7,6,0.97)' : 'transparent',
      backdropFilter: scrolled || !revealOnScroll ? 'blur(24px)' : 'none',
      borderBottom: scrolled || !revealOnScroll ? '1px solid var(--film-border)' : '1px solid transparent',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      pointerEvents: visible ? 'all' : 'none',
      transition: 'var(--transition-spring)',
    };

    return (
      <>
        <nav aria-label="Main navigation" style={navStyle}>
          {/* Logo */}
          <a href="/" className="shrink-0">
            <span className="poster-font text-[var(--film-cream)] tracking-[0.12em]" style={{ fontSize }}>
              {compactLogo ? 'P' : 'POSTERIUM'}
            </span>
          </a>

          {/* Inline Links (1024px+) */}
          {(isLargeDesktop || isUltraWide) && (
            <div className="flex items-center gap-2 ml-4">
              {links.map(({ label, href, external }) => (
                <a
                  key={label + href}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                  className="syne-font text-[11px] font-bold uppercase tracking-wider px-3 py-1 text-zinc-400 hover:text-[var(--film-cream)] transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          )}

          {/* Search (768px+) */}
          {(isTablet || isLargeDesktop || isUltraWide) && (
            <div className={`flex justify-center ${isUltraWide ? 'flex-1' : 'flex-[0.5]'}`}>
              <div className="relative w-full max-w-[480px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={searchInputRef}
                  value={search?.value ?? ''}
                  onChange={(e) => search?.onChange?.(e.target.value)}
                  placeholder="Search… (Press '/' to focus)"
                  className="w-full bg-white/5 border border-white/10 rounded-[var(--radius-sm)] py-2 pl-10 pr-4 text-[13px] text-[var(--film-cream)] focus:border-[var(--film-amber)] outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {isUltraWide && (
              <a
                href="#"
                className="flex items-center gap-2 px-4 py-2 bg-[var(--film-amber)]/10 border border-[var(--film-amber)]/20 rounded-[var(--radius-sm)] text-[11px] font-bold uppercase tracking-wider text-[var(--film-cream)] hover:bg-[var(--film-amber)]/20 transition-all"
              >
                <Coffee size={14} />
                Support
              </a>
            )}

            {(isWideMobile || isTablet) && (
              <a
                href="/build"
                className="px-4 py-2 bg-[var(--film-amber)] text-[var(--film-black)] rounded-full text-[11px] font-black uppercase tracking-wider shadow-[0_0_20px_rgba(196,124,46,0.3)] hover:scale-105 transition-all"
              >
                Build
              </a>
            )}

            {isDesktop && (
              <a href="https://github.com/SpicyDevs/posterium" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-[var(--film-cream)] transition-colors">
                <Github size={20} />
              </a>
            )}

            {rightActions}

            {!isDesktop && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-[var(--radius-xs)] text-[var(--film-cream)]"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          className={`fixed inset-x-0 top-16 z-[var(--z-overlay)] bg-[rgba(7,7,6,0.97)] backdrop-blur-[24px] border-b border-white/5 transition-all duration-500 ease-[var(--transition-spring)] ${
            menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col p-6 gap-4">
            {isMobile && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search?.value ?? ''}
                  onChange={(e) => search?.onChange?.(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-white/5 border border-white/10 rounded-[var(--radius-sm)] py-3 pl-10 pr-4 text-[14px] text-[var(--film-cream)] outline-none"
                />
              </div>
            )}
            {links.map(({ label, href }) => (
              <a
                key={`mobile-${label}`}
                href={href}
                onClick={closeMenu}
                className="syne-font text-[18px] font-bold uppercase tracking-widest text-zinc-400 hover:text-[var(--film-amber)] transition-colors py-2 border-b border-white/5"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </>
    );
  }
);

MainNavbar.displayName = 'MainNavbar';

export default MainNavbar;
