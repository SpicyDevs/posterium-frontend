import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { Github, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Reel', href: '#reel' },
  { label: 'Features', href: '#combined' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Installation', href: '/installation' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Examples', href: '/examples' },
] as const;

const LINK_BASE: React.CSSProperties = {
  color: 'rgba(224, 210, 180, 0.88)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '4px 14px',
  textDecoration: 'none',
  fontFamily: 'Syne, sans-serif',
};

const GITHUB_BASE: React.CSSProperties = {
  color: 'rgba(200, 185, 155, 0.78)',
  display: 'flex',
  alignItems: 'center',
  padding: '6px 8px',
  borderRadius: 4,
};

const Nav = memo(() => {
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const heroH = window.innerHeight * 0.72;
      setVisible(window.scrollY > heroH);
      setScrolled(window.scrollY > heroH + 20);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeMenu();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    if (wasMenuOpenRef.current && !menuOpen) {
      menuToggleRef.current?.focus();
    }
    wasMenuOpenRef.current = menuOpen;
  }, [menuOpen]);

  return (
    <>
      <nav
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 clamp(20px,4vw,56px)',
          background: scrolled ? 'rgba(7,7,6,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(1.3)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(196,124,46,0.1)' : '1px solid transparent',
          justifyContent: 'space-between',
          gap: 24,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-100%)',
          pointerEvents: visible ? 'all' : 'none',
          transition:
            'opacity 0.45s cubic-bezier(0.16,1,0.3,1), ' +
            'transform 0.45s cubic-bezier(0.16,1,0.3,1), ' +
            'background 0.35s ease, border-color 0.35s ease',
        }}
      >
        <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span
            className="poster-font"
            style={{
              fontSize: 22,
              color: 'var(--film-cream)',
              letterSpacing: '0.12em',
              lineHeight: 1,
              textShadow: '0 0 32px rgba(196,124,46,0.18)',
            }}
          >
            POSTERIUM
          </span>
        </a>

        <div
          className="nav-links-desktop"
          style={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            gap: 0,
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="hover-cream" style={LINK_BASE}>
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <a
            href="#"
            aria-label="Repository"
            className="nav-links-desktop hover-cream"
            style={GITHUB_BASE}
          >
            <Github size={15} />
          </a>

          <a
            href="/build"
            className="syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--film-amber)',
              color: '#070706',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '7px 16px',
              borderRadius: 3,
              flexShrink: 0,
              boxShadow: '0 0 18px rgba(196,124,46,0.22)',
              transition: 'box-shadow 0.2s, background 0.2s',
            }}
          >
            Build
          </a>

          <button
            ref={menuToggleRef}
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-haspopup="dialog"
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
            }}
          >
            {menuOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </nav>

      {menuOpen && visible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{
            position: 'fixed',
            top: 56,
            left: 0,
            right: 0,
            background: 'rgba(7,7,6,0.98)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(196,124,46,0.1)',
            padding: '6px 20px 14px',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={closeMenu}
              className="syne-font hover-cream"
              style={{
                color: 'rgba(240, 230, 204, 0.82)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '12px 8px',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(196,124,46,0.06)',
              }}
            >
              {label}
            </a>
          ))}
          <a
            href="/build"
            onClick={closeMenu}
            className="syne-font"
            style={{
              color: 'rgba(196,124,46,0.85)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              padding: '12px 8px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 2,
            }}
          >
            Open Builder
          </a>
          <a
            href="#"
            onClick={closeMenu}
            className="syne-font"
            style={{
              color: 'rgba(196,124,46,0.85)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              padding: '12px 8px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 2,
            }}
          >
            <Github size={13} /> Repository
          </a>
        </div>
      )}
    </>
  );
});

Nav.displayName = 'Nav';
export default Nav;
