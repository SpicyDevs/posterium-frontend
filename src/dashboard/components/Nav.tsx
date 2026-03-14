// src/dashboard/components/Nav.tsx
import React, { memo, useState, useCallback } from 'react';
import { Link } from '../../Router';
import { Github, Menu, X } from 'lucide-react';
import { useNavScroll } from '../hooks';

const NAV_LINKS = [
  { label: 'Reel', href: '#reel' },
  { label: 'Features', href: '#combined' },
  { label: 'API', href: '#atlas' },
  { label: 'Integrations', href: '#combined' },
] as const;

const Nav = memo(() => {
  const scrolled = useNavScroll(44);
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
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 clamp(20px,4vw,56px)',
          background: scrolled ? 'rgba(7,7,6,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(1.3)' : 'none',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.055)'
            : '1px solid transparent',
          transition: 'background 0.4s ease, border-color 0.4s ease',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        {/* Wordmark */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span
            className="poster-font"
            style={{
              fontSize: 20,
              color: 'var(--film-cream)',
              letterSpacing: '0.1em',
              lineHeight: 1,
            }}
          >
            POSTERIUM
          </span>
        </Link>

        {/* Centre links — desktop only */}
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
            <a
              key={label}
              href={href}
              className="syne-font"
              style={{
                color: 'rgba(110,104,96,0.65)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '4px 14px',
                textDecoration: 'none',
                transition: 'color 0.18s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(110,104,96,0.65)';
              }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="nav-links-desktop"
            style={{
              color: 'rgba(110,104,96,0.55)',
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: 4,
              transition: 'color 0.18s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(110,104,96,0.55)';
            }}
          >
            <Github size={15} />
          </a>

          <Link
            to="/build"
            className="syne-font"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--film-amber)',
              color: '#070706',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '7px 16px',
              borderRadius: 3,
              flexShrink: 0,
            }}
          >
            Build
          </Link>

          {/* Mobile hamburger */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'var(--film-silver)',
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

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal
          aria-label="Navigation menu"
          style={{
            position: 'fixed',
            top: 56,
            left: 0,
            right: 0,
            background: 'rgba(7,7,6,0.98)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.055)',
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
              className="syne-font"
              style={{
                color: 'rgba(240,230,204,0.7)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                padding: '12px 8px',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--film-cream)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(240,230,204,0.7)';
              }}
            >
              {label}
            </a>
          ))}
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            onClick={closeMenu}
            className="syne-font"
            style={{
              color: 'rgba(240,230,204,0.5)',
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
            <Github size={13} /> GitHub
          </a>
        </div>
      )}
    </>
  );
});

Nav.displayName = 'Nav';
export default Nav;