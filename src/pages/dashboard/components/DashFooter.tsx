// src/pages/dashboard/components/DashFooter.tsx
// SEO: footer uses semantic <footer> landmark. Links use keyword-rich anchor text.
// Breadcrumb-style internal links help crawlers understand site structure.
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from '../../../Router';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Movie Poster Builder', href: '/build', internal: true },
      { label: 'API Documentation', href: '#api', internal: false },
      { label: 'Badge Showcase', href: '#badges', internal: false },
      { label: 'Live Examples', href: '#demo', internal: false },
    ],
  },
  {
    heading: 'Use Cases',
    links: [
      { label: 'Plex Custom Posters', href: '#use-cases', internal: false },
      { label: 'Jellyfin Posters', href: '#use-cases', internal: false },
      { label: 'Discord Bot Embeds', href: '#use-cases', internal: false },
      { label: 'Notion Watchlists', href: '#use-cases', internal: false },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'GitHub Repository', href: 'https://github.com/xdaayush/freeposterapi', internal: false },
      { label: 'Features', href: '#features', internal: false },
      { label: 'FAQ', href: '#faq', internal: false },
      { label: 'SpicyDevs', href: 'https://spicydevs.xyz', internal: false },
    ],
  },
] as const;

const DashFooter: React.FC = () => (
  <footer
    className="border-t border-white/[0.05] bg-[#09090b]"
    aria-label="Site footer"
    itemScope
    itemType="https://schema.org/WPFooter"
  >
    {/* Footer nav grid */}
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
      {FOOTER_LINKS.map(group => (
        <nav key={group.heading} aria-label={`${group.heading} links`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
            {group.heading}
          </p>
          <ul className="space-y-2">
            {group.links.map(link => (
              <li key={link.label}>
                {link.internal ? (
                  <Link
                    to={link.href}
                    className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                    className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>

    {/* Bottom bar */}
    <div className="border-t border-white/[0.04] max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Logo + description for crawlers */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <Sparkles size={9} className="text-white" />
        </div>
        <span className="text-[11px] text-zinc-600">
          <strong className="text-zinc-500 font-medium">FreePosterAPI</strong>
          {' '}— Free movie poster generator by{' '}
          <a
            href="https://spicydevs.xyz"
            target="_blank"
            rel="noreferrer noopener"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            SpicyDevs
          </a>
        </span>
      </div>

      {/* Legal / misc */}
      <p className="text-[10px] text-zinc-700">
        Open source · No account required · Free forever
      </p>
    </div>
  </footer>
);

export default DashFooter;