// src/pages/dashboard/components/Hero.tsx
// SEO: h1 contains primary keyword. Subheading reinforces secondary keywords.
// Floating poster images have descriptive alt text. Schema is in index.html.
import React, { useState, useEffect } from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Link } from '../../../Router';
import { useParallax } from '../hooks/useParallax';
import { POSTERS } from '../data';
import { buildPosterUrl, API } from '../utils';

const Hero: React.FC = () => {
  const heroRef = useParallax(0.25);
  const [posterWallLoaded, setPosterWallLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPosterWallLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      aria-label="Hero — Free Movie Poster Generator"
      className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden pt-14"
    >
      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" aria-hidden="true" />

      {/* Gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)' }} />
        <div className="absolute -top-20 right-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)' }} />
      </div>

      {/* Parallax poster wall */}
      <div
        ref={heroRef}
        className="absolute inset-0 pointer-events-none will-change-transform"
        aria-hidden="true"
        role="presentation"
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.5) 50%, rgba(9,9,11,0.95) 100%)' }}
        />
        {posterWallLoaded && (
          <div className="absolute inset-0 grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1 opacity-30 scale-110 -rotate-2">
            {[...POSTERS, ...POSTERS, ...POSTERS].slice(0, 36).map((p, i) => (
              <div
                key={`wall-${p.id}-${i}`}
                className="rounded overflow-hidden aspect-[2/3] bg-zinc-900 poster-wall-item"
                style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'both' }}
              >
                <img
                  src={`${API}/${p.type}/${p.id}.svg?source=tmdb`}
                  alt=""
                  loading="lazy"
                  width="120"
                  height="180"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main hero content ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="hero-anim" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[11px] font-semibold text-indigo-300 mb-8">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"
                style={{ animation: 'ping-slow 1.5s cubic-bezier(0,0,0.2,1) infinite' }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400" />
            </span>
            Free &amp; Open Source — No Account Required
          </div>
        </div>

        {/*
          SEO: Primary h1 — includes main keyword phrase.
          "Free Movie Poster Generator" is the high-intent search term.
        */}
        <h1
          className="hero-anim text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          style={{ animationDelay: '0.2s' }}
        >
          <span className="gradient-text">Free Movie Poster</span>
          <br />
          <span className="text-zinc-500 font-light">Generator with Live Ratings</span>
        </h1>

        {/*
          SEO: Subheading packs in secondary keywords naturally.
          Mentions Plex, Jellyfin, Discord — high-intent use-case searches.
        */}
        <p
          className="hero-anim max-w-xl mx-auto text-[14px] sm:text-[16px] text-zinc-500 leading-relaxed mb-3"
          style={{ animationDelay: '0.32s' }}
        >
          Generate custom movie and TV show posters with glassmorphism rating badges from{' '}
          <strong className="text-zinc-300 font-semibold">IMDb</strong>,{' '}
          <strong className="text-zinc-300 font-semibold">Rotten Tomatoes</strong>,{' '}
          <strong className="text-zinc-300 font-semibold">Metacritic</strong>,{' '}
          <strong className="text-zinc-300 font-semibold">TMDB</strong>, and more — all from a single API URL.
        </p>
        <p
          className="hero-anim max-w-lg mx-auto text-[12px] sm:text-[13px] text-zinc-600 leading-relaxed mb-10"
          style={{ animationDelay: '0.38s' }}
        >
          Perfect for <strong className="text-zinc-500">Plex</strong> and <strong className="text-zinc-500">Jellyfin</strong> custom posters,{' '}
          <strong className="text-zinc-500">Discord bots</strong>, <strong className="text-zinc-500">Notion</strong> watchlists, and more.
        </p>

        {/* CTAs */}
        <div
          className="hero-anim flex flex-wrap items-center justify-center gap-3 mb-14"
          style={{ animationDelay: '0.44s' }}
        >
          <Link
            to="/build"
            className="glow-btn group flex items-center gap-2 h-11 sm:h-12 px-6 sm:px-8 rounded-xl text-[13px] sm:text-[14px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
            aria-label="Open the free poster builder editor"
          >
            Open Free Builder
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
          <a
            href="#demo"
            className="flex items-center gap-2 h-11 sm:h-12 px-6 sm:px-7 rounded-xl text-[13px] sm:text-[14px] font-semibold text-zinc-300 bg-white/5 hover:bg-white/8 transition-all border border-white/[0.09] hover:border-white/15"
            aria-label="See live poster examples"
          >
            <PlayCircle size={14} aria-hidden="true" /> See Live Examples
          </a>
        </div>

        {/* Floating poster showcase */}
        <div
          className="hero-anim"
          style={{ animationDelay: '0.55s' }}
          aria-label="Example posters generated by Posterium"
        >
          <div className="flex items-end justify-center gap-2 sm:gap-3 overflow-hidden">
            {POSTERS.slice(0, 5).map((p, i) => {
              const isCenter  = i === 2;
              const offsets   = [-16, -8, 0, -8, -16];
              const width     = isCenter ? 140 : i === 1 || i === 3 ? 110 : 80;
              const height    = isCenter ? 210 : i === 1 || i === 3 ? 165 : 120;

              return (
                <div
                  key={p.id}
                  className="relative flex-shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 hover:scale-105 hover:z-10"
                  style={{
                    width,
                    height,
                    marginBottom: offsets[i],
                    boxShadow: isCenter
                      ? '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.2)'
                      : '0 12px 40px rgba(0,0,0,0.6)',
                    animation: `${i % 2 === 0 ? 'floatA' : 'floatB'} ${3.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
                    zIndex: isCenter ? 5 : 3 - Math.abs(i - 2),
                  }}
                >
                  <img
                    src={buildPosterUrl(p, 'sm')}
                    alt={`${p.title} (${p.year}) poster with rating badges`}
                    loading={i === 2 ? 'eager' : 'lazy'}
                    width={width}
                    height={height}
                    className="w-full h-full object-cover"
                  />
                  {isCenter && (
                    <div className="absolute inset-0 ring-2 ring-indigo-500/40 rounded-xl pointer-events-none" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-700" aria-hidden="true">
        <div className="w-[1px] h-8 bg-gradient-to-b from-transparent to-zinc-700 animate-bounce" />
      </div>
    </section>
  );
};

export default Hero;