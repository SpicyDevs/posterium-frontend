// src/components/dashboard/Nav.tsx
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
  color: 'rgba(224, 210, 180, 0.75)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  padding: '4px 14px',
  textDecoration: 'none',
  fontFamily: 'Syne, sans-serif',
};

const Nav = memo(() => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const heroH = window.innerHeight * 0.72;
      setScrolled(window.scrollY > heroH + 20);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 52,
          display: 'flex', alignItems: 'center',
          padding: '0 clamp(20px,4vw,56px)',
          background: scrolled ? 'rgba(7,7,6,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(1.3)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(196,124,46,0.08)' : '1px solid transparent',
          justifyContent: 'space-between',
          gap: 24,
          transition: 'background 0.35s ease, border-color 0.35s ease',
        }}
      >
        {/* Logo — Syne for consistency, no FOUT */}
        <a
          href="/"
          style={{
            textDecoration: 'none',
            flexShrink: 0,
            opacity: scrolled ? 1 : 0,
            pointerEvents: scrolled ? 'auto' : 'none',
            transform: scrolled ? 'translateY(0)' : 'translateY(-8px)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}
        >
          <span
            className="syne-font"
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: 'var(--film-cream)',
              letterSpacing: '0.22em',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            POSTERIUM
          </span>
        </a>

        <div
          className="nav-links-desktop"
          style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 0 }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="hover-cream" style={LINK_BASE}>{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <a
            href="https://github.com/SpicyDevs/posterium-frontend"
            aria-label="Repository"
            className="nav-links-desktop hover-cream"
            style={{
              color: 'rgba(200, 185, 155, 0.55)',
              display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: 4,
              opacity: scrolled ? 1 : 0,
              pointerEvents: scrolled ? 'auto' : 'none',
              transform: scrolled ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease, color 0.18s ease',
            }}
          >
            <Github size={15} />
          </a>

          <a
            href="/build"
            className="syne-font"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--film-amber)', color: '#070706',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '7px 16px', borderRadius: 3, flexShrink: 0,
              boxShadow: '0 0 18px rgba(196,124,46,0.22)',
              opacity: scrolled ? 1 : 0,
              pointerEvents: scrolled ? 'auto' : 'none',
              transform: scrolled ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease, box-shadow 0.2s, background 0.2s',
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
              background: 'none', border: '1px solid rgba(196,124,46,0.2)',
              color: 'var(--film-cream)', width: 34, height: 34, borderRadius: 4,
              cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {menuOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          ref={dialogRef}
          role="dialog" aria-modal={true} aria-label="Navigation menu"
          style={{
            position: 'fixed', top: 52, left: 0, right: 0,
            background: 'rgba(7,7,6,0.98)', backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(196,124,46,0.08)',
            padding: '6px 20px 14px', zIndex: 99, display: 'flex', flexDirection: 'column',
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} onClick={closeMenu} className="syne-font hover-cream"
              style={{ color: 'rgba(240, 230, 204, 0.75)', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 8px', textDecoration: 'none', borderBottom: '1px solid rgba(196,124,46,0.05)' }}>
              {label}
            </a>
          ))}
          <a href="/build" onClick={closeMenu} className="syne-font"
            style={{ color: 'var(--film-amber)', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '12px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, marginTop: 2, opacity: 0.85 }}>
            Open Builder
          </a>
          <a href="https://github.com/SpicyDevs/posterium-frontend" onClick={closeMenu} className="syne-font"
            style={{ color: 'var(--film-amber)', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '12px 8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, opacity: 0.85 }}>
            <Github size={13} /> Repository
          </a>
        </div>
      )}
    </>
  );
});

Nav.displayName = 'Nav';
export default Nav;
