// src/pages/dashboard/components/HowItWorks.tsx
import React from 'react';
import { Film, Layers, ExternalLink } from 'lucide-react';
import FadeSection from './FadeSection';

const STEPS = [
  {
    step: '01',
    title: 'Search & Pick',
    desc: 'Find any movie, TV show, or anime. Posters are pulled automatically from your preferred source.',
    icon: <Film size={20} />,
    color: '#818cf8',
  },
  {
    step: '02',
    title: 'Design Badges',
    desc: 'Drag badges to position, customize glassmorphism effects, colors, and choose which ratings to show.',
    icon: <Layers size={20} />,
    color: '#c084fc',
  },
  {
    step: '03',
    title: 'Copy URL',
    desc: 'Get a single embed URL that works anywhere — Plex, Jellyfin, Notion, Discord, anywhere.',
    icon: <ExternalLink size={20} />,
    color: '#34d399',
  },
] as const;

const HowItWorks: React.FC = () => (
  <section className="py-20 sm:py-28 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto">
      <FadeSection>
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Zero to poster in seconds</h2>
        </div>
      </FadeSection>

      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 relative">
        {/* Connector line (desktop only) */}
        <div
          className="hidden sm:block absolute top-8 left-1/6 right-1/6 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3) 20%, rgba(99,102,241,0.3) 80%, transparent)' }}
        />

        {STEPS.map((item, i) => (
          <FadeSection key={item.step} delay={i * 100}>
            <div className="relative p-5 sm:p-6 rounded-2xl bg-[#0d0d0f] border border-white/[0.06] card-3d h-full">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-black font-mono text-zinc-700 tracking-wider">{item.step}</span>
              </div>
              <h3 className="text-[14px] sm:text-[15px] font-bold text-zinc-100 mb-2">{item.title}</h3>
              <p className="text-[12px] text-zinc-600 leading-relaxed">{item.desc}</p>
            </div>
          </FadeSection>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;