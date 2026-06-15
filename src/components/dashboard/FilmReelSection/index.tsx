// src/components/dashboard/FilmReelSection/index.tsx
import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { SprocketStrip } from '../primitives';
import { REEL_ITEMS } from '@/lib/dashboard/constants';

const DESKTOP_REEL_CHUNKS = 3;
const MOBILE_REEL_CHUNKS = 2;
const CHUNK_WIDTH = 4000;
const MOSAIC_NATURAL_WIDTH = DESKTOP_REEL_CHUNKS * CHUNK_WIDTH;

// ─────────────────────────────────────────────────────────────────────────────
// Desktop — sticky scroll → horizontal pan
// ─────────────────────────────────────────────────────────────────────────────
const DesktopStaticReel = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  // Track whether a scroll is in flight — don't mutate height mid-scroll
  const isScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setHeight = useCallback(() => {
    // Never mutate height while user is scrolling — causes browser layout jump
    if (isScrollingRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;
    if (!container) return;
    // scrollWidth is more reliable than offsetWidth for max-content tracks
    const imgW = img?.scrollWidth || MOSAIC_NATURAL_WIDTH;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (imgW > vw) {
      container.style.height = `${imgW - vw + vh}px`;
    }
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
      clearTimeout(t1);
      clearTimeout(t2);
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

      // Always compute fresh — never use a stale cached value
      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const progress = Math.max(0, Math.min(1, (window.scrollY - containerTop) / scrollable));

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
        setHeight(); // Safe to recalc now that scroll settled
      }, 150);
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
        {/* ── Minimal header ──────────────────────────────────────────────────── */}
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

        {/* ── Top sprocket ────────────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* ── Image area ──────────────────────────────────────────────────────── */}
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

          <div
            ref={imgRef}
            style={{
              display: 'flex',
              height: '100%',
              width: 'max-content',
              flexShrink: 0,
              willChange: 'transform',
              filter: 'sepia(0.18) saturate(0.72) brightness(0.9)',
            }}
          >
            {Array.from({ length: DESKTOP_REEL_CHUNKS }).map((_, i) => (
              <picture key={i} style={{ display: 'block', height: '100%' }}>
                <source srcSet={`/reel-mosaic-${i + 1}.webp`} type="image/webp" />
                <img
                  src={`/reel-mosaic-${i + 1}.jpg`}
                  alt={i === 0 ? 'Collage of movie and TV show posters with IMDb rating badges' : ''}
                  style={{
                    display: 'block',
                    height: '100%',
                    width: 'auto',
                    maxWidth: 'none',
                  }}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? ('high' as any) : 'auto'}
                  decoding="async"
                />
              </picture>
            ))}
          </div>
        </div>

        {/* ── Bottom sprocket ─────────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderTop: '1px solid rgba(255,255,255,0.045)',
          }}
        >
          <SprocketStrip count={48} />
        </div>

        {/* ── Progress bar ────────────────────────────────────────────────────── */}
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
// Mobile — PARALLAX like desktop (NOT native scroll)
// ─────────────────────────────────────────────────────────────────────────────
const MobileStaticReel = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile uses 2 chunks so width = 2 × CHUNK_WIDTH
  const mosaicMobileWidth = MOBILE_REEL_CHUNKS * CHUNK_WIDTH;

  const setHeight = useCallback(() => {
    if (isScrollingRef.current) return;
    const track = trackRef.current;
    const container = containerRef.current;
    if (!container) return;
    const trackW = track?.scrollWidth || mosaicMobileWidth;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (trackW > vw) {
      container.style.height = `${trackW - vw + vh}px`;
    }
  }, [mosaicMobileWidth]);

  useEffect(() => {
    setHeight();
    const track = trackRef.current;
    const images = track?.querySelectorAll('img') || [];
    images.forEach((i) => i.addEventListener('load', setHeight));
    window.addEventListener('resize', setHeight, { passive: true });
    const t1 = setTimeout(setHeight, 300);
    const t2 = setTimeout(setHeight, 1000);
    return () => {
      images.forEach((i) => i.removeEventListener('load', setHeight));
      window.removeEventListener('resize', setHeight);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [setHeight]);

  useEffect(() => {
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const container = containerRef.current;
      const track = trackRef.current;
      const fill = progressFillRef.current;
      if (!container || !track) return;

      const scrollable = container.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      // Always compute fresh — never use a stale cached value
      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const progress = Math.max(0, Math.min(1, (window.scrollY - containerTop) / scrollable));

      const trackW = track.scrollWidth || mosaicMobileWidth;
      const maxShift = Math.max(0, trackW - window.innerWidth);

      track.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
      if (fill) fill.style.width = `${progress * 100}%`;
    };

    const onScroll = () => {
      isScrollingRef.current = true;
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        setHeight(); // Safe to recalc now that scroll settled
      }, 150);
      if (rafId === null) rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    };
  }, [mosaicMobileWidth, setHeight]);

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
        {/* ── Top sprocket ─────────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderBottom: '1px solid rgba(255,255,255,0.045)',
            height: 24,
          }}
        >
          <SprocketStrip count={22} />
        </div>

        {/* ── Image area ───────────────────────────────────────────────────── */}
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
              width: 60,
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
              width: 80,
              zIndex: 2,
              pointerEvents: 'none',
              background:
                'linear-gradient(to left, var(--film-dark) 0%, rgba(14,13,11,0.9) 55%, transparent 100%)',
            }}
          />

          <div
            ref={trackRef}
            style={{
              display: 'flex',
              height: '100%',
              width: 'max-content',
              flexShrink: 0,
              willChange: 'transform',
              filter: 'sepia(0.18) saturate(0.72) brightness(0.9)',
            }}
          >
            {Array.from({ length: MOBILE_REEL_CHUNKS }).map((_, i) => (
              <picture key={i} style={{ display: 'block', height: '100%' }}>
                <source srcSet={`/reel-mosaic-${i + 1}.webp`} type="image/webp" />
                <img
                  src={`/reel-mosaic-${i + 1}.jpg`}
                  alt={i === 0 ? 'Collage of movie and TV show posters with IMDb rating badges' : ''}
                  style={{
                    display: 'block',
                    height: '100%',
                    width: 'auto',
                    maxWidth: 'none',
                  }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? ('high' as any) : 'auto'}
                  decoding="async"
                />
              </picture>
            ))}
          </div>
        </div>

        {/* ── Bottom sprocket ──────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.015)',
            borderTop: '1px solid rgba(255,255,255,0.045)',
            height: 24,
          }}
        >
          <SprocketStrip count={22} />
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '6px 16px',
            borderTop: '1px solid rgba(196,124,46,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
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
        </div>
      </div>
    </div>
  );
});
MobileStaticReel.displayName = 'MobileStaticReel';

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
