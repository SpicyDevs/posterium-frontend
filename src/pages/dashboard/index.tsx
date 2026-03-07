// src/pages/dashboard/index.tsx
import React from 'react';
import DashNav        from './components/DashNav';
import Hero           from './components/Hero';
import StatsBar       from './components/StatsBar';
import LiveDemo       from './components/LiveDemo';
import PosterGallery  from './components/PosterGallery';
import HowItWorks     from './components/HowItWorks';
import BadgeShowcase  from './components/BadgeShowcase';
import FeaturesGrid   from './components/FeaturesGrid';
import ApiSection     from './components/ApiSection';
import UseCases       from './components/UseCases';
import CtaSection     from './components/CtaSection';
import DashFooter     from './components/DashFooter';

/** Global keyframes and utility classes shared across all dashboard sections. */
const GLOBAL_STYLES = `
  @keyframes floatA     { 0%,100% { transform: translateY(0) rotate(-0.5deg); } 50% { transform: translateY(-14px) rotate(0.5deg); } }
  @keyframes floatB     { 0%,100% { transform: translateY(-6px) rotate(0.3deg); } 50% { transform: translateY(8px) rotate(-0.3deg); } }
  @keyframes slideUp    { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer    { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  @keyframes posterReveal { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes ping-slow  { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0; } }

  .hero-anim      { animation: slideUp 0.75s cubic-bezier(0.16,1,0.3,1) both; }
  .gradient-text  { background: linear-gradient(135deg, #fff 0%, #e4e4e7 35%, #a5b4fc 65%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .shimmer-text   { background: linear-gradient(90deg, #52525b 0%, #d4d4d8 40%, #818cf8 60%, #52525b 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
  .dot-grid       { background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px); background-size: 28px 28px; }
  .poster-reveal  { animation: posterReveal 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .card-3d        { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .card-3d:hover  { transform: translateY(-3px) scale(1.01); }
  .glow-btn       { box-shadow: 0 0 30px rgba(99,102,241,0.25), 0 4px 20px rgba(0,0,0,0.4); }
  .glow-btn:hover { box-shadow: 0 0 50px rgba(99,102,241,0.4), 0 8px 32px rgba(0,0,0,0.5); }
  .nav-blur       { backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }
  .poster-wall-item { animation: posterReveal 0.6s cubic-bezier(0.16,1,0.3,1) both; }
`;

const Dashboard: React.FC = () => (
  <div
    className="min-h-screen bg-[#09090b] text-zinc-200 overflow-x-hidden"
    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
  >
    <style>{GLOBAL_STYLES}</style>

    <DashNav />
    <Hero />
    <StatsBar />
    <LiveDemo />
    <PosterGallery />
    <HowItWorks />
    <BadgeShowcase />
    <FeaturesGrid />
    <ApiSection />
    <UseCases />
    <CtaSection />
    <DashFooter />
  </div>
);

export default Dashboard;