// src/pages/dashboard/components/DashFooter.tsx
import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from '../../../Router';

const LINKS = [
  { label: 'Builder',  href: '/build',                                   internal: true  },
  { label: 'GitHub',   href: 'https://github.com/xdaayush/freeposterapi', internal: false },
  { label: 'API Docs', href: '#api',                                      internal: false },
  { label: 'Badges',   href: '#badges',                                   internal: false },
] as const;

const DashFooter: React.FC = () => (
  <footer className="border-t border-white/[0.05] py-8 sm:py-10 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <Sparkles size={9} className="text-white" />
        </div>
        <span className="text-[12px] text-zinc-600">
          FreePosterAPI by{' '}
          <a
            href="https://spicydevs.xyz"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            SpicyDevs
          </a>
        </span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-5 flex-wrap justify-center">
        {LINKS.map(link =>
          link.internal ? (
            <Link
              key={link.label}
              to={link.href}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {link.label}
            </Link>
          ) : (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {link.label}
            </a>
          ),
        )}
      </div>
    </div>
  </footer>
);

export default DashFooter;