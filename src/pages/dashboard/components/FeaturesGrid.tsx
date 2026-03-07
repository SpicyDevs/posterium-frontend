// src/pages/dashboard/components/FeaturesGrid.tsx
import React from 'react';
import FadeSection from './FadeSection';
import { FEATURES } from '../data';

const FeaturesGrid: React.FC = () => (
  <section id="features" className="py-20 sm:py-28 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto">
      <FadeSection>
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Everything you need</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Built for power users</h2>
        </div>
      </FadeSection>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURES.map((feat, i) => (
          <FadeSection key={feat.title} delay={i * 40}>
            <div className="p-4 sm:p-5 rounded-xl border border-white/[0.06] bg-[#0d0d0f] card-3d group h-full">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ background: `${feat.accent}18`, color: feat.accent }}
              >
                {feat.icon}
              </div>
              <h3 className="text-[12px] sm:text-[13px] font-bold text-zinc-200 mb-1.5">{feat.title}</h3>
              <p className="text-[11px] text-zinc-600 leading-relaxed">{feat.desc}</p>
            </div>
          </FadeSection>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesGrid;