// src/pages/dashboard/components/DashNav.tsx
import React, { useState } from 'react';
import { Sparkles, ArrowRight, Github, ChevronRight, Menu, X } from 'lucide-react';
import { Link } from '../../../Router';

const NAV_LINKS = [
  ['Features', '#features'],
  ['Badges',   '#badges'],
  ['Demo',     '#demo'],
  ['API',      '#api'],
] as const;

const DashNav: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 nav-blur border-b border-white/[0.06]"
      style={{ background: 'rgba(9,9,11,0.8)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="text-[13px] font-bold text-white tracking-tight">FreePosterAPI</span>
          <span className="hidden sm:flex text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/20 uppercase tracking-wider">
            v2
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="px-3 py-1.5 rounded-lg text-[12px] text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all font-medium"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/6 transition-all border border-white/[0.07]"
          >
            <Github size={12} /> GitHub
          </a>
          <Link
            to="/build"
            className="glow-btn flex items-center gap-1.5 h-8 px-4 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
          >
            Open Builder <ArrowRight size={11} />
          </Link>
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-all"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#09090b] px-4 py-3 space-y-1">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-medium"
            >
              <ChevronRight size={12} className="text-zinc-700" />
              {label}
            </a>
          ))}
          <a
            href="https://github.com/xdaayush/freeposterapi"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-medium"
          >
            <Github size={12} className="text-zinc-700" /> GitHub
          </a>
        </div>
      )}
    </nav>
  );
};

export default DashNav;