// src/pages/dashboard/components/BadgeShowcase.tsx
import React from 'react';
import { Palette } from 'lucide-react';
import FadeSection from './FadeSection';
import { BADGE_DATA } from '../data';

const CONTROLS = [
  { label: 'Glass Blur', value: '8px',  pct: 70 },
  { label: 'Opacity',    value: '45%',  pct: 45 },
  { label: 'Radius',     value: '12px', pct: 60 },
  { label: 'Shadow',     value: '5',    pct: 50 },
  { label: 'Border',     value: '0px',  pct:  5 },
  { label: 'Scale',      value: '1.0×', pct: 50 },
] as const;

const BadgeShowcase: React.FC = () => (
  <section id="badges" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
    <div className="max-w-5xl mx-auto">
      {/* Heading */}
      <FadeSection>
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Rating badges</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Every score, beautifully rendered</h2>
          <p className="text-[13px] sm:text-[14px] text-zinc-600 max-w-md mx-auto">
            Glassmorphism badges with live data. Fully customizable per badge or globally.
          </p>
        </div>
      </FadeSection>

      {/* Badge cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {BADGE_DATA.map((badge, i) => (
          <FadeSection key={badge.id} delay={i * 40}>
            <div
              className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border card-3d cursor-default"
              style={{ background: badge.bg, borderColor: badge.border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${badge.border}` }}
              >
                {badge.icon}
              </div>
              <div className="text-center">
                <p className="text-[18px] sm:text-[22px] font-black leading-tight" style={{ color: badge.color }}>
                  {badge.value}
                </p>
                <p
                  className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 truncate"
                  style={{ color: badge.color, opacity: 0.7 }}
                >
                  {badge.label}
                </p>
              </div>
            </div>
          </FadeSection>
        ))}
      </div>

      {/* Per-badge controls preview */}
      <FadeSection delay={200}>
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#0d0d0f] border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-5">
            <Palette size={13} className="text-indigo-400" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Per-badge controls</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CONTROLS.map(ctrl => (
              <div key={ctrl.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-600 font-medium">{ctrl.label}</span>
                  <span className="text-[10px] font-mono text-zinc-700">{ctrl.value}</span>
                </div>
                <div className="h-1 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${ctrl.pct}%`, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>
    </div>
  </section>
);

export default BadgeShowcase;