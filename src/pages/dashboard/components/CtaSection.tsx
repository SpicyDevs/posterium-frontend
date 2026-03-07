// src/pages/dashboard/components/CtaSection.tsx
import React from 'react';
import { Sparkles, ArrowRight, Github, Star } from 'lucide-react';
import { Link } from '../../../Router';
import FadeSection from './FadeSection';

const CtaSection: React.FC = () => (
  <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0a0c]">
    <div className="max-w-3xl mx-auto text-center">
      <FadeSection>
        <div
          className="relative p-8 sm:p-12 rounded-3xl border border-white/[0.08] overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, transparent 100%)' }}
        >
          {/* Glow orbs */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6), transparent 70%)' }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)' }}
          />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/40">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to build?</h2>
            <p className="text-[13px] sm:text-[14px] text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Design your perfect poster in the visual editor. No account required — drag, drop, and copy your URL.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/build"
                className="glow-btn group flex items-center gap-2 h-11 sm:h-12 px-7 sm:px-8 rounded-xl text-[13px] sm:text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
              >
                Open Builder
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="https://github.com/xdaayush/freeposterapi"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 h-11 sm:h-12 px-6 sm:px-7 rounded-xl text-[13px] sm:text-[14px] font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/8 transition-all border border-white/[0.09]"
              >
                <Github size={14} /> Star on GitHub <Star size={11} className="text-amber-400" />
              </a>
            </div>
          </div>
        </div>
      </FadeSection>
    </div>
  </section>
);

export default CtaSection;