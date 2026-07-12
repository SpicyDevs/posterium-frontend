import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { SprocketStrip } from './primitives';
import { REEL_ITEMS, API } from '@/lib/dashboard/constants';

const DESKTOP_REEL_CHUNKS = 3;
const CHUNK_WIDTH = 4000;
const MOSAIC_NATURAL_WIDTH = DESKTOP_REEL_CHUNKS * CHUNK_WIDTH;

// Walk offsetParent chain — stable on iOS composited layers unlike getBoundingClientRect
function getAbsTop(el: HTMLElement): number {
  let t = 0;
  let cur: HTMLElement | null = el;
  while (cur) { t += cur.offsetTop; cur = cur.offsetParent as HTMLElement | null; }
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop — sticky scroll → horizontal pan
// ─────────────────────────────────────────────────────────────────────────────
const DesktopStaticReel = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const containerAbsTopRef = useRef(0);
  const isScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHeight = useCallback(() => {
    if (isScrollingRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;
    if (!container) return;
    const imgW = img?.scrollWidth || MOSAIC_NATURAL_WIDTH;
    if (!imgW) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (imgW > vw) container.style.height = `${imgW - vw + vh}px`;
    // Cache AFTER setting height so position is stable
    containerAbsTopRef.current = getAbsTop(container);
  }, []);

  useEffect(() => {
    setHeight();
    const img = imgRef.current;
    const images = img?.querySelectorAll('img') || [];
    images.forEach((i) => i.addEventListener('load', setHeight));
    window.addEventListener('resize', setHeight, { passive: true });
    const t1 = setTimeout(setHeight, 300);
    const t2 = setTimeout(setHeight, 1000);
    return () => {
      images.forEach((i) => i.removeEventListener('load', setHeight));
      window.removeEventListener('resize', setHeight);
      clearTimeout(t1); clearTimeout(t2);
    };
  }, [setHeight]);

  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const container = containerRef.current;
      const img = imgRef.current;
      const fill = progressFillRef.current;
      if (!container || !img) return;
      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = (window.scrollY - containerAbsTopRef.current) / scrollable;
      const progress = Math.max(0, Math.min(1, isNaN(raw) ? 0 : raw));
      const imgW = img.scrollWidth || MOSAIC_NATURAL_WIDTH;
      const maxShift = Math.max(0, imgW - window.innerWidth);
      img.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
      if (fill) fill.style.width = `${progress * 100}%`;
    };

    const onScroll = () => {
      isScrollingRef.current = true;
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setHeight();
      }, 200);
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [setHeight]);

  return (
    <div id="reel" ref={containerRef} role="region" aria-label="Film Reel Showcase" style={{ position: 'relative' }}>
      <div style={{
        position: 'sticky', top: 0, height: '100dvh', overflow: 'hidden',
        background: 'var(--film-dark)', display: 'flex', flexDirection: 'column',
        touchAction: 'pan-y',
      }}>
        <div style={{ flexShrink: 0, padding: '14px 48px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(196,124,46,0.08)' }}>
          <div>
            <div className="poster-font" style={{ fontSize: 20, color: 'var(--film-cream)', letterSpacing: '0.08em', lineHeight: 1 }}>THE GALLERY</div>
            <div className="syne-font" style={{ fontSize: 8, color: 'var(--film-silver)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}>Scroll to browse</div>
          </div>
          <span className="mono-font" style={{ fontSize: 8, color: 'var(--film-text-ghost)', letterSpacing: '0.12em' }}>{REEL_ITEMS.length} titles</span>
        </div>
        <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.045)' }}>
          <SprocketStrip count={48} />
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 140, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to right, var(--film-dark) 0%, rgba(14,13,11,0.88) 60%, transparent 100%)' }} />
          <div aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 200, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)' }} />
          <div ref={imgRef} style={{ display: 'flex', height: '100%', width: 'max-content', flexShrink: 0, willChange: 'transform', filter: 'sepia(0.18) saturate(0.72) brightness(0.9)' }}>
            {Array.from({ length: DESKTOP_REEL_CHUNKS }).map((_, i) => (
              <picture key={i} style={{ display: 'block', height: '100%' }}>
                <source srcSet={`/reel-mosaic-${i + 1}.webp`} type="image/webp" />
                <img src={`/reel-mosaic-${i + 1}.jpg`} alt={i === 0 ? 'Collage of movie and TV show posters with IMDb rating badges' : ''} style={{ display: 'block', height: '100%', width: 'auto', maxWidth: 'none' }} loading="lazy" fetchPriority={i === 0 ? ('high' as any) : 'auto'} decoding="async" />
              </picture>
            ))}
          </div>
        </div>
        <div style={{ flexShrink: 0, background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.045)' }}>
          <SprocketStrip count={48} />
        </div>
        <div style={{ flexShrink: 0, padding: '7px 48px', borderTop: '1px solid rgba(196,124,46,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono-font" style={{ fontSize: 7, color: 'var(--film-text-ghost)', letterSpacing: '0.18em', textTransform: 'uppercase', flexShrink: 0 }}>Reel</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
            <div ref={progressFillRef} style={{ height: '100%', width: '0%', borderRadius: 99, background: 'linear-gradient(90deg, var(--film-amber), #D4A245)', transition: 'none' }} />
          </div>
          <span className="mono-font" style={{ fontSize: 7, color: 'var(--film-text-ghost)', flexShrink: 0, letterSpacing: '0.1em' }}>{REEL_ITEMS.length} frames</span>
        </div>
      </div>
    </div>
  );
});
DesktopStaticReel.displayName = 'DesktopStaticReel';

// ─────────────────────────────────────────────────────────────────────────────
// Mobile — 2-column poster grid (no parallax, no scroll-jacking)
// ─────────────────────────────────────────────────────────────────────────────
const MobilePosterGrid = memo(() => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      id="reel"
      role="region"
      aria-label="Poster Gallery"
      style={{
        background: 'var(--film-dark)',
        borderTop: '1px solid rgba(196,124,46,0.07)',
        borderBottom: '1px solid rgba(196,124,46,0.07)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px clamp(16px,4vw,24px) 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(196,124,46,0.08)',
        }}
      >
        <div>
          <div
            className="poster-font"
            style={{ fontSize: 18, color: 'var(--film-cream)', letterSpacing: '0.08em', lineHeight: 1 }}
          >
            THE GALLERY
          </div>
          <div
            className="syne-font"
            style={{ fontSize: 8, color: 'var(--film-silver)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 2 }}
          >
            Browse posters
          </div>
        </div>
        <span
          className="mono-font"
          style={{ fontSize: 8, color: 'var(--film-text-ghost)', letterSpacing: '0.12em' }}
        >
          {REEL_ITEMS.length} titles
        </span>
      </div>

      {/* Sprocket strip */}
      <div
        style={{
          background: 'rgba(255,255,255,0.015)',
          borderBottom: '1px solid rgba(255,255,255,0.045)',
          height: 20,
          overflow: 'hidden',
        }}
      >
        <SprocketStrip count={22} />
      </div>

      {/* 2-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          padding: '16px clamp(16px,4vw,24px)',
        }}
      >
        {REEL_ITEMS.map((item, i) => {
          const posterSrc = `${API}/${item.type}/${item.id}.webp?r=imdb,rt&source=tmdb&blur=7&alpha=0.43&rad=10&imdb_x=8&imdb_y=8&rt_x=8&rt_y=64`;
          const isHovered = hovered === i;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative',
                borderRadius: 6,
                overflow: 'hidden',
                background: '#111009',
                border: '1px solid rgba(196,124,46,0.12)',
                boxShadow: isHovered
                  ? '0 8px 28px rgba(0,0,0,0.6), 0 0 20px rgba(196,124,46,0.08)'
                  : '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                aspectRatio: '2/3',
              }}
            >
              <picture>
                <source srcSet={posterSrc.replace('.webp', '.webp')} type="image/webp" />
                <img
                  src={posterSrc}
                  alt={`${item.title} (${item.year}) — ${item.genre}`}
                  loading="lazy"
                  decoding="async"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </picture>
              {/* Hover overlay with metadata */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(7,7,6,0.92) 0%, rgba(7,7,6,0.4) 50%, transparent 100%)',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.28s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 10,
                  pointerEvents: 'none',
                }}
              >
                <div
                  className="syne-font"
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--film-cream)', lineHeight: 1.2, marginBottom: 2 }}
                >
                  {item.title}
                </div>
                <div
                  className="mono-font"
                  style={{ fontSize: 8, color: 'var(--film-text-dim)', letterSpacing: '0.06em' }}
                >
                  {item.year} · {item.genre}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
MobilePosterGrid.displayName = 'MobilePosterGrid';

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────
const FilmReelSection = memo(() => {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 769px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (isDesktop === null) {
    return <div id="reel" role="region" aria-label="Film Reel Showcase" style={{ height: '100dvh', background: 'var(--film-dark)' }} />;
  }

  return isDesktop ? <DesktopStaticReel /> : <MobilePosterGrid />;
});

FilmReelSection.displayName = 'FilmReelSection';
export default FilmReelSection;
