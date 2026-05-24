// src/components/dashboard/FilmReelSection/index.tsx
//
// Displays the pre-generated reel-mosaic.webp/.jpg as a scroll-driven
// horizontal parallax strip.
//
// Desktop: the image is pinned sticky while the user scrolls vertically;
//          scroll progress is converted to a horizontal translateX pan.
//
// Mobile:  the image sits in a native overflow-x: scroll strip with
//          a fixed display height.
//
// Run `node scripts/reel.mjs` once before pushing to generate the files.
// DesktopReel.tsx / MobileReel.tsx are superseded and can be deleted.

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { SprocketStrip } from '../primitives';
import { REEL_ITEMS } from '@/lib/dashboard/constants';

// Matches CONFIG.canvasWidth in scripts/reel.mjs — used as a pre-load
// estimate so the container height can be set before the image loads.
const MOSAIC_NATURAL_WIDTH = 4000;

// ─────────────────────────────────────────────────────────────────────────────
// Desktop — sticky scroll → horizontal pan
// ─────────────────────────────────────────────────────────────────────────────
const DesktopStaticReel = memo(() => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const imgRef          = useRef<HTMLImageElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  // Cache the container's document-top to avoid repeated getBoundingClientRect
  // calls inside the hot scroll path.
  const containerTopRef = useRef<number>(0);

  // ── Height calibration ─────────────────────────────────────────────────
  // container.height = imageRenderedWidth - viewportWidth + viewportHeight
  // This gives exactly enough scroll space to pan the image from left→right.
  const recalc = useCallback(() => {
    const img       = imgRef.current;
    const container = containerRef.current;
    if (!container) return;

    // offsetWidth reflects the actual rendered width (respects CSS height: 100%).
    // Fall back to the natural width estimate until the image loads.
    const imgW = img?.offsetWidth || MOSAIC_NATURAL_WIDTH;
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;

    if (imgW > vw) {
      container.style.height = `${imgW - vw + vh}px`;
    }

    // Cache absolute top (stable between resizes)
    containerTopRef.current =
      container.getBoundingClientRect().top + window.scrollY;
  }, []);

  useEffect(() => {
    recalc();

    const img = imgRef.current;
    img?.addEventListener('load', recalc);
    window.addEventListener('resize', recalc, { passive: true });

    // Re-measure after fonts / layout settle
    const t1 = setTimeout(recalc, 300);
    const t2 = setTimeout(recalc, 1000);

    return () => {
      img?.removeEventListener('load', recalc);
      window.removeEventListener('resize', recalc);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [recalc]);

  // ── Scroll-driven horizontal pan ───────────────────────────────────────
  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const container = containerRef.current;
      const img       = imgRef.current;
      const fill      = progressFillRef.current;
      if (!container || !img) return;

      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = Math.max(
        0,
        Math.min(1, (window.scrollY - containerTopRef.current) / scrollable)
      );

      // Use offsetWidth (rendered) so the pan matches what the user sees.
      const imgW     = img.offsetWidth || MOSAIC_NATURAL_WIDTH;
      const maxShift = Math.max(0, imgW - window.innerWidth);

      img.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
      if (fill) fill.style.width = `${progress * 100}%`;
    };

    const onScroll = () => {
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Run once immediately to set initial state
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      id="reel"
      ref={containerRef}
      role="region"
      aria-label="Film Reel Showcase"
      style={{ position: 'relative' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflow: 'hidden',
          background: 'var(--film-dark)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 48px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(196,124,46,0.08)',
          }}
        >
          <div>
            <div
              className="poster-font"
              style={{
                fontSize: 20,
                color: 'var(--film-cream)',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              THE REEL
            </div>
            <div
              className="syne-font"
              style={{
                fontSize: 8,
                color: 'var(--film-silver)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              Scroll to pan
            </div>
          </div>
          <span
            className="mono-font"
            style={{ fontSize: 8, color: 'var(--film-text-ghost)', letterSpacing: '0.12em' }}
          >
            {REEL_ITEMS.length} titles
          </span>
        </div>

        {/* ── Top sprocket ────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* ── Image area ──────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Left edge fade */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 140,
              zIndex: 2,
              pointerEvents: 'none',
              background:
                'linear-gradient(to right, var(--film-dark) 0%, rgba(14,13,11,0.88) 60%, transparent 100%)',
            }}
          />
          {/* Right edge fade */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 200,
              zIndex: 2,
              pointerEvents: 'none',
              background:
                'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)',
            }}
          />

          {/*
           * picture + img: the <source> serves webp to supporting browsers;
           * <img> is the fallback and also carries the ref for measurement.
           * display: contents on <picture> makes <img> a direct flex child
           * so height: 100% resolves against the flex-1 container.
           */}
          <picture style={{ display: 'contents' }}>
            <source srcSet="/reel-mosaic.webp" type="image/webp" />
            <img
              ref={imgRef}
              src="/reel-mosaic.jpg"
              alt="Collage of movie and TV show posters with IMDb rating badges"
              style={{
                display: 'block',
                height: '100%',    // fills the flex-1 area; width scales proportionally
                width: 'auto',
                maxWidth: 'none',  // must exceed overflow hidden boundary to pan
                flexShrink: 0,
                willChange: 'transform',
                filter: 'sepia(0.18) saturate(0.72) brightness(0.9)',
              }}
              loading="eager"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fetchPriority={'high' as any}
              decoding="async"
            />
          </picture>
        </div>

        {/* ── Bottom sprocket ─────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderTop: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* ── Progress bar ────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '7px 48px',
            borderTop: '1px solid rgba(196,124,46,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'var(--film-text-ghost)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            Reel
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              ref={progressFillRef}
              style={{
                height: '100%',
                width: '0%',
                borderRadius: 99,
                background: 'linear-gradient(90deg, var(--film-amber), #D4A245)',
                transition: 'none',
              }}
            />
          </div>
          <span
            className="mono-font"
            style={{
              fontSize: 7,
              color: 'var(--film-text-ghost)',
              flexShrink: 0,
              letterSpacing: '0.1em',
            }}
          >
            {REEL_ITEMS.length} frames
          </span>
        </div>
      </div>
    </div>
  );
});
DesktopStaticReel.displayName = 'DesktopStaticReel';

// ─────────────────────────────────────────────────────────────────────────────
// Mobile — native horizontal scroll strip
// ─────────────────────────────────────────────────────────────────────────────
const MobileStaticReel = memo(() => (
  <section
    id="reel"
    aria-label="Film Reel Showcase"
    style={{ background: 'var(--film-dark)', overflow: 'hidden' }}
  >
    {/* Header */}
    <div style={{ padding: '36px 22px 14px' }}>
      <div
        className="poster-font"
        style={{ fontSize: 30, color: 'var(--film-cream)', letterSpacing: '0.06em' }}
      >
        THE REEL
      </div>
      <div
        className="syne-font"
        style={{
          fontSize: 10,
          color: 'var(--film-silver)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginTop: 3,
        }}
      >
        Swipe to browse · {REEL_ITEMS.length} titles
      </div>
    </div>

    {/* Top sprocket */}
    <div
      style={{
        background: 'rgba(255,255,255,0.018)',
        borderTop: '1px solid rgba(255,255,255,0.055)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      <SprocketStrip count={22} />
    </div>

    {/* Horizontal scroll image strip */}
    <div
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scrollbarWidth: 'none' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        WebkitOverflowScrolling: 'touch' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        msOverflowStyle: 'none' as any,
      }}
    >
      <picture>
        <source srcSet="/reel-mosaic.webp" type="image/webp" />
        <img
          src="/reel-mosaic.jpg"
          alt="Collage of movie and TV show posters with IMDb rating badges"
          style={{
            // Fixed height so the strip has a consistent display size on mobile
            height: 280,
            width: 'auto',
            maxWidth: 'none',
            display: 'block',
            filter: 'sepia(0.18) saturate(0.72) brightness(0.9)',
          }}
          loading="lazy"
          decoding="async"
        />
      </picture>
    </div>

    {/* Bottom sprocket */}
    <div
      style={{
        background: 'rgba(255,255,255,0.018)',
        borderTop: '1px solid rgba(255,255,255,0.055)',
      }}
    >
      <SprocketStrip count={22} />
    </div>
  </section>
));
MobileStaticReel.displayName = 'MobileStaticReel';

// ─────────────────────────────────────────────────────────────────────────────
// Root export — renders SSR stub, then the right variant after hydration
// ─────────────────────────────────────────────────────────────────────────────
const FilmReelSection = memo(() => {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq     = window.matchMedia('(min-width: 769px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // ── SSR / pre-hydration stub ─────────────────────────────────────────
  // Matches the desktop component's outer structure so there is no layout
  // shift on hydration; actual content is painted client-side only.
  if (isDesktop === null) {
    return (
      <div
        id="reel"
        role="region"
        aria-label="Film Reel Showcase"
        style={{ height: '100dvh', background: 'var(--film-dark)' }}
      />
    );
  }

  return isDesktop ? <DesktopStaticReel /> : <MobileStaticReel />;
});

FilmReelSection.displayName = 'FilmReelSection';
export default FilmReelSection;