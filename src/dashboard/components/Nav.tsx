// src/pages/dashboard/components/Nav.tsx
import React, { memo, useState, useCallback } from 'react';
import { Link } from '../../Router';
import { Film, ArrowRight, Github, Menu, X } from 'lucide-react';
import { useNavScroll, useTimecode } from '../hooks';

const NAV_LINKS = [
  { label: 'Showcase', href: '#reel'       },
  { label: 'Features', href: '#features'   },
  { label: 'API',      href: '#api'        },
  { label: 'Uses',     href: '#use-cases'  },
] as const;

const Nav = memo(() => {
  const scrolled  = useNavScroll(44);
  const timecode  = useTimecode();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
          height: 58,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          background: scrolled ? 'rgba(7,7,6,0.94)' : 'transparent',
          backdropFilter: scrolled ? 'blur(18px) saturate(1.4)' : 'none',
          borderBottom: scrolled
            ? '1px solid rgba(196,124,46,0.11)'
            : '1px solid transparent',
          transition:
            'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.5s ease',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              background: 'linear-gradient(140deg, #C47C2E, #D4A245)',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(196,124,46,0.28)',
              flexShrink: 0,
            }}
          >
            <Film size={14} color="#070706" strokeWidth={2.5} />
          </div>
          <span
            className="poster-font"
            style={{ fontSize: 20, color: 'var(--film-cream)', letterSpacing: '0.06em' }}
          >
            POSTERIUM
          </span>
          <span
            className="mono-font"
            style={{
              fontSize: 8,
              color: 'var(--film-amber)',
              letterSpacing: '0.14em',
              border: '1px solid rgba(196,124,46,0.28)',
              padding: '2px 5px',
              borderRadius: 2,
            }}
          >
            v2
          </span>
        </div>

        {/* Desktop nav centre */}
        <div
          className="nav-links-desktop"
          style={{ display: 'flex', gap: 2, alignItems: 'center' }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <NavLink key={label} href={href}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Live timecode — desktop only, adds an imperfection that feels human */}
          <span
            className="mono-font nav-links-desktop"
            style={{
              fontSize: 9,
              color: 'rgba(122,117,110,0.45)',
              letterSpacing: '0.1em',
              marginRight: 4,
              // blink the colon separator
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {timecode}
          </span>

          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            className="syne-font"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              color: 'var(--film-silver)',
              fontSize: 11,
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 12px',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 5,
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(196,124,46,0.28)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--film-cream)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--film-silver)';
            }}
          >
            <Github size={12} />
            <span className="nav-links-desktop">GitHub</span>
          </a>

          <Link
            to="/build"
            className="glow-cta syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--film-amber)',
              color: '#070706',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '6px 16px',
              borderRadius: 5,
            }}
          >
            Builder <ArrowRight size={11} />
          </Link>

          {/* Mobile hamburger — display toggled by CSS */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--film-silver)',
              width: 34,
              height: 34,
              borderRadius: 5,
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              // display handled by CSS media query class
            }}
          >
            {menuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          style={{
            position: 'fixed',
            top: 58,
            left: 0,
            right: 0,
            background: 'rgba(7,7,6,0.98)',
            backdropFilter: 'blur(22px)',
            borderBottom: '1px solid rgba(196,124,46,0.14)',
            padding: '8px 16px 16px',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={closeMenu}
              className="syne-font"
              style={{
                color: 'var(--film-silver)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                padding: '11px 12px',
                borderRadius: 5,
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.02)',
                display: 'block',
                border: '1px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color =
                  'var(--film-cream)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(196,124,46,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color =
                  'var(--film-silver)';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'transparent';
              }}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </>
  );
});

// NavLink sub-component — extracted to avoid inline handler recreation
const NavLink = memo<{ href: string; children: React.ReactNode }>(
  ({ href, children }) => (
    <a
      href={href}
      className="syne-font"
      style={{
        color: 'var(--film-silver)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        padding: '5px 12px',
        borderRadius: 4,
        textDecoration: 'none',
        transition: 'color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = 'var(--film-cream)';
        el.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.color = 'var(--film-silver)';
        el.style.background = 'transparent';
      }}
    >
      {children}
    </a>
  ),
);
NavLink.displayName = 'NavLink';
Nav.displayName = 'Nav';

export default Nav;