// src/pages/dashboard/components/UseCases.tsx
import React from 'react';
import FadeSection from './FadeSection';
import { USE_CASES } from '../data';

const UseCases: React.FC = () => (
  <section className="py-20 sm:py-28 px-4 sm:px-6">
    <div className="max-w-5xl mx-auto">
      <FadeSection>
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-3">Use cases</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Where people use it</h2>
        </div>
      </FadeSection>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {USE_CASES.map((uc, i) => (
          <FadeSection key={uc.title} delay={i * 60}>
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0d0d0f] border border-white/[0.06] card-3d h-full">
              <div className="text-3xl mb-3">{uc.icon}</div>
              <h3 className="text-[14px] font-bold text-zinc-100 mb-2">{uc.title}</h3>
              <p className="text-[12px] text-zinc-600 leading-relaxed mb-3">{uc.desc}</p>
              <div className="flex flex-wrap gap-1">
                {uc.tags.map(t => (
                  <span
                    key={t}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-600 border border-white/[0.04]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </FadeSection>
        ))}
      </div>
    </div>
  </section>
);

export default UseCases;