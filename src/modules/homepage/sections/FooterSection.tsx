// src/components/dashboard/sections/FooterSection.tsx
import { memo } from 'react';
import { Film, Github, ExternalLink } from 'lucide-react';

const FOOTER_LINKS = [
  ['Poster Builder', '/build'],
  ['Project Repo', '#', false],
  ['MIT License', '#', false],
  ['API Docs', '#combined'],
  ['FAQ', '/faq'],
] as const;

const LEGAL_LINKS = [
  ['Privacy Policy', '/privacy'],
  ['Terms of Service', '/terms'],
] as const;

export const FooterSection = memo(() => (
  <footer
    style={{
      background: 'var(--film-black)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {/* Single amber-tinted divider line — clapperboard bottom */}
    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, rgba(196,124,46,0.25) 30%, rgba(196,124,46,0.25) 70%, transparent 100%)' }} />

    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Brand block */}
      <div style={{ padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,64px) 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 7,
            background: 'linear-gradient(140deg, #C47C2E, #D4A245)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(196,124,46,0.22), 0 4px 12px rgba(0,0,0,0.5)',
            flexShrink: 0,
          }}>
            <Film size={18} color="#070706" strokeWidth={2.5} />
          </div>
          <div>
            <div className="poster-font" style={{ fontSize: 'clamp(28px,4vw,44px)', color: 'var(--film-cream)', letterSpacing: '0.08em', lineHeight: 0.9 }}>
              POSTERIUM
            </div>
            <div className="mono-font" style={{ fontSize: 7, color: 'rgba(196,124,46,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>
              Free Poster API · MIT License
            </div>
          </div>
        </div>

        <p className="syne-font" style={{ fontSize: 'clamp(12px,1.4vw,14px)', color: 'rgba(200,190,170,0.6)', lineHeight: 1.65, maxWidth: 460, marginBottom: 0 }}>
          Movie and TV posters with live rating badges, served from one URL. Free, open source, no strings attached.
        </p>
      </div>

      {/* Amber rule */}
      <div aria-hidden="true" style={{ margin: 'clamp(24px,3.5vw,40px) clamp(20px,5vw,64px)', height: 1, background: 'linear-gradient(90deg, rgba(196,124,46,0.3), rgba(196,124,46,0.06) 70%, transparent)', opacity: 0.5 }} />

      {/* Nav links */}
      <div style={{ padding: '0 clamp(20px,5vw,64px)', display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
        {FOOTER_LINKS.map(([label, href, external], i) => {
          const isLast = i === FOOTER_LINKS.length - 1;
          return (
            <span key={label}>
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className={external ? 'hover-amber' : 'hover-cream'}
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', color: 'rgba(200,188,166,0.55)', fontFamily: 'Syne, sans-serif', padding: '5px 0', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'color 0.18s' }}
              >
                {label}
                {external && <ExternalLink size={8} style={{ opacity: 0.4 }} />}
              </a>
              {!isLast && (
                <span aria-hidden="true" style={{ margin: '0 14px', color: 'rgba(196,124,46,0.15)', fontSize: 10, fontFamily: 'monospace' }}>·</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Thin separator */}
      <div aria-hidden="true" style={{ margin: 'clamp(20px,3vw,32px) clamp(20px,5vw,64px)', height: 1, background: 'rgba(255,255,255,0.035)' }} />

      {/* Bottom bar */}
      <div style={{
        padding: '0 clamp(20px,5vw,64px) clamp(36px,4vw,52px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        {/* Copyright + legal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 'clamp(12px,2vw,28px)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="mono-font" style={{ fontSize: 8, color: 'rgba(196,124,46,0.3)', letterSpacing: '0.15em' }}>© 2026 SPICYDEVS</span>
            <span className="mono-font" style={{ fontSize: 8, color: 'rgba(196,124,46,0.2)', letterSpacing: '0.12em' }}>REL 2.0 · MIT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {LEGAL_LINKS.map(([label, href], i) => (
              <span key={label}>
                <a href={href} className="hover-amber" style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', color: 'rgba(200,188,166,0.45)', fontFamily: 'Syne, sans-serif', transition: 'color 0.18s' }}>
                  {label}
                </a>
                {i < LEGAL_LINKS.length - 1 && (
                  <span aria-hidden="true" style={{ margin: '0 10px', color: 'rgba(196,124,46,0.12)', fontSize: 8, fontFamily: 'monospace' }}>·</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* GitHub */}
        <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(196,124,46,0.35)', textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'color 0.18s' }}>
          <Github size={12} />
          Open Source
        </a>
      </div>
    </div>
  </footer>
));

FooterSection.displayName = 'FooterSection';
