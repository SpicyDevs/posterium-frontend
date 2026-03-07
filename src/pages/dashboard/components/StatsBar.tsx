// src/pages/dashboard/components/StatsBar.tsx
import React from 'react';
import FadeSection from './FadeSection';
import { STATS } from '../data';

const StatsBar: React.FC = () => (
  <section className="border-y border-white/[0.05] bg-[#0d0d0f]">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <FadeSection>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-white/[0.06]">
          {STATS.map((s) => (
            <div key={s.l} className="flex flex-col items-center text-center px-4 sm:px-6 gap-1">
              <span className="text-zinc-700 mb-1">{s.icon}</span>
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{s.v}</span>
              <span className="text-[11px] text-zinc-600 font-medium">{s.l}</span>
            </div>
          ))}
        </div>
      </FadeSection>
    </div>
  </section>
);

export default StatsBar;