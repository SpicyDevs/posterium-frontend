import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Film, ArrowRight } from 'lucide-react';
import { Link } from '../../../Router';
import { REEL_ITEMS, API } from './constants';
import Nav from './components/Nav';

const ReimaginedDashboard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // We track the scroll progress of the entire wrapper (0 = top, 1 = bottom)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth out the scroll progress so it doesn't jitter on standard mouse wheels
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 50, damping: 15 });

  // ─── CLAPPERBOARD TIMELINE (0.0 to 0.3) ───
  // Clapper stick rotates down to "Clap"
  const clapperStickRotate = useTransform(smoothProgress, [0, 0.05], [-25, 0]);
  
  // Whole board zooms in and rotates away in 3D
  const boardScale = useTransform(smoothProgress, [0.08, 0.2], [1, 3]);
  const boardRotateX = useTransform(smoothProgress, [0.08, 0.25], [0, 60]);
  const boardOpacity = useTransform(smoothProgress, [0.15, 0.25], [1, 0]);
  const boardY = useTransform(smoothProgress, [0.08, 0.25], [0, -500]);

  // ─── FILM REEL TIMELINE (0.2 to 0.8) ───
  // Fade in the reel right as the clapperboard flies past
  const reelOpacity = useTransform(smoothProgress, [0.2, 0.25], [0, 1]);
  // Move the film track horizontally
  const reelX = useTransform(smoothProgress, [0.25, 0.8], ["0%", "-80%"]);
  // Add a slight 3D tilt to the entire reel track
  const reelRotateY = useTransform(smoothProgress, [0.25, 0.8], [20, -20]);

  return (
    <div 
      ref={containerRef} 
      style={{ height: '400vh', background: 'var(--film-black)' }} 
      className="relative w-full overflow-clip text-white font-sans"
    >
      <Nav />

      {/* STICKY VIEWPORT
        This container stays pinned to the screen while we scroll through the 400vh height.
        All animations happen inside here based on the scroll progress.
      */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center perspective-[1200px]">
        
        {/* ─── 1. THE 3D CLAPPERBOARD ─── */}
        <motion.div
          style={{
            scale: boardScale,
            rotateX: boardRotateX,
            opacity: boardOpacity,
            y: boardY,
            transformStyle: "preserve-3d",
          }}
          className="absolute z-50 flex flex-col items-center justify-center w-[600px] pointer-events-none"
        >
          {/* Clapper Stick */}
          <motion.div
            style={{ rotateZ: clapperStickRotate, transformOrigin: 'bottom left' }}
            className="w-full h-16 bg-white/90 border-4 border-black relative overflow-hidden z-10"
          >
            {/* Zebra stripes */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'} skew-x-[-20deg] scale-125`} />
              ))}
            </div>
          </motion.div>

          {/* Clapper Base */}
          <div className="w-full h-[400px] bg-[#111] border-4 border-t-0 border-white/20 rounded-b-xl flex flex-col p-8 shadow-2xl relative">
            <div className="flex justify-between items-end border-b border-white/20 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-mono text-zinc-400 tracking-widest">PROD.</h2>
                <h1 className="text-6xl font-black tracking-tighter" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                  POSTERIUM
                </h1>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-mono text-zinc-400 tracking-widest">API_VER</h2>
                <h1 className="text-4xl font-bold text-[#C47C2E]">v2.0</h1>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <h2 className="text-xs font-mono text-zinc-500 mb-1">SCENE</h2>
                <p className="text-3xl font-mono">1A</p>
              </div>
              <div>
                <h2 className="text-xs font-mono text-zinc-500 mb-1">TAKE</h2>
                <p className="text-3xl font-mono">01</p>
              </div>
              <div>
                <h2 className="text-xs font-mono text-zinc-500 mb-1">FPS</h2>
                <p className="text-3xl font-mono">60</p>
              </div>
            </div>

            <p className="text-xl text-zinc-400 font-serif italic text-center mt-auto">
              Scroll down to roll camera...
            </p>
          </div>
        </motion.div>

        {/* ─── 2. THE HORIZONTAL FILM REEL ─── */}
        <motion.div
          style={{ opacity: reelOpacity }}
          className="absolute inset-0 flex items-center pt-20"
        >
          {/* Axis line */}
          <div className="absolute top-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#C47C2E]/30 to-transparent -translate-y-1/2 z-0" />

          {/* Moving Track */}
          <motion.div
            style={{ x: reelX, rotateY: reelRotateY, transformStyle: "preserve-3d" }}
            className="flex gap-16 px-[50vw] items-center z-10"
          >
            {REEL_ITEMS.map((item, i) => (
              <FilmPosterCard key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        </motion.div>

        {/* ─── 3. BOTTOM UI (Always visible during reel) ─── */}
        <motion.div 
          style={{ opacity: reelOpacity }}
          className="absolute bottom-0 w-full p-8 flex justify-between items-end border-t border-white/10 bg-gradient-to-t from-black to-transparent"
        >
          <div>
            <h3 className="text-[#C47C2E] font-bold tracking-widest text-sm mb-2 uppercase">Live API Rendering</h3>
            <p className="text-zinc-400 max-w-md">
              Every frame passing through this reel is a live <code>GET</code> request generating SVG badges on the fly.
            </p>
          </div>
          
          <Link
            to="/build"
            className="flex items-center gap-3 bg-[#C47C2E] text-black px-6 py-3 rounded hover:bg-[#D4A245] transition-colors font-bold uppercase tracking-wider"
          >
            Enter the Lab <ArrowRight size={16} />
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default ReimaginedDashboard;

// ─── Sub-component: Individual 3D Poster Card ───
const FilmPosterCard = ({ item, index }: { item: any, index: number }) => {
  return (
    <div className="relative flex-shrink-0 group">
      {/* Film Sprockets */}
      <div className="absolute -top-10 left-0 w-full flex justify-between px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-3 h-4 bg-black border border-white/10 rounded-[1px]" />
        ))}
      </div>
      <div className="absolute -bottom-10 left-0 w-full flex justify-between px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-3 h-4 bg-black border border-white/10 rounded-[1px]" />
        ))}
      </div>

      {/* Poster Image with 3D Hover Effect */}
      <div className="w-[280px] h-[420px] bg-[#111] border border-white/10 p-2 shadow-2xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-4 group-hover:z-50 group-hover:border-[#C47C2E]/50">
        <img
          src={`${API}/${item.type}/${item.id}.svg?r=imdb,rt&source=tmdb&blur=8&alpha=0.5&rad=12&imdb_x=200&imdb_y=20&rt_x=200&rt_y=90`}
          alt={item.title}
          className="w-full h-full object-cover rounded"
        />
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#C47C2E]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Meta Text */}
      <div className="absolute -bottom-24 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
        <h4 className="font-bold text-white tracking-widest uppercase">{item.title}</h4>
        <p className="text-[#C47C2E] text-xs font-mono">{item.year} • {item.director}</p>
      </div>
    </div>
  );
};