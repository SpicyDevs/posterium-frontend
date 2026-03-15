// src/DynamicSEO.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Dynamic metadata engine. Reads the active route from the existing custom
// router, merges per-route overrides with global defaults, and injects the
// full tag suite via react-helmet-async.
//
// Route detection: uses useRouter() from src/Router.tsx - functionally
// identical to useLocation().pathname from react-router-dom.
//
// IMPORTANT: index.html must NOT contain any duplicate <title>, <meta name>,
// <meta property="og:">, or <meta name="twitter:"> tags. Those are exclusively
// owned by this component. index.html keeps only structural tags:
//   charset, viewport, fonts, preconnects, theme-color, PWA manifest, icons.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useRouter } from './Router';
import { SITE_CONFIG, SEO_DEFAULTS, ROUTE_SEO, OGMeta, TwitterMeta } from './config';

const DynamicSEO: React.FC = () => {
  const { path } = useRouter();

  // ── 1. Route lookup ───────────────────────────────────────────────────────
  const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  const routeMeta = ROUTE_SEO[normalizedPath];
  const isKnownRoute = normalizedPath in ROUTE_SEO;

  // ── 2. Scalar fallbacks ───────────────────────────────────────────────────
  const title       = routeMeta?.title       ?? SEO_DEFAULTS.title;
  const description = routeMeta?.description ?? SEO_DEFAULTS.description;
  const keywords    = routeMeta?.keywords    ?? SEO_DEFAULTS.keywords;
  const canonical   = routeMeta?.canonical   ?? SEO_DEFAULTS.canonical;
  const noindex     = routeMeta?.noindex     ?? !isKnownRoute;

  // ── 3. OG merge ───────────────────────────────────────────────────────────
  const og: OGMeta = {
    ...SEO_DEFAULTS.og,
    ...(routeMeta?.og ?? {}),
    title:       routeMeta?.og?.title       ?? title,
    description: routeMeta?.og?.description ?? description,
  };

  // ── 4. Twitter merge ──────────────────────────────────────────────────────
  const twitter: TwitterMeta = {
    ...SEO_DEFAULTS.twitter,
    ...(routeMeta?.twitter ?? {}),
    title:       routeMeta?.twitter?.title       ?? title,
    description: routeMeta?.twitter?.description ?? description,
  };

  // ── 5. JSON-LD schemas ────────────────────────────────────────────────────
  const jsonLdSchemas = routeMeta?.jsonLd ?? [];

  return (
    <Helmet>
      {/* ── HTML lang ────────────────────────────────────────── */}
      <html lang="en" />

      {/* ── Primary ──────────────────────────────────────────── */}
      <title>{title}</title>
      <meta name="description"          content={description} />
      <meta name="keywords"             content={keywords} />
      <meta name="author"               content={SITE_CONFIG.author} />
      <meta name="application-name"     content={SITE_CONFIG.name} />
      <meta name="generator"            content="Vite + React" />
      <meta name="theme-color"          content={SITE_CONFIG.themeColor} />
      <meta name="color-scheme"         content="dark" />
      <meta name="format-detection"     content="telephone=no, date=no, email=no, address=no" />
      <link rel="canonical"             href={canonical} />

      {/* Robots */}
      {noindex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      }

      {/* ── Apple / PWA ──────────────────────────────────────── */}
      <meta name="mobile-web-app-capable"                  content="yes" />
      <meta name="apple-mobile-web-app-capable"            content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style"   content="black-translucent" />
      <meta name="apple-mobile-web-app-title"              content={SITE_CONFIG.name} />

      {/* ── Microsoft / Windows ──────────────────────────────── */}
      <meta name="msapplication-TileColor"   content={SITE_CONFIG.themeColor} />
      <meta name="msapplication-TileImage"   content="/icon-192.png" />
      <meta name="msapplication-tap-highlight" content="no" />

      {/* ── Open Graph ───────────────────────────────────────── */}
      <meta property="og:site_name"   content={SITE_CONFIG.name} />
      <meta property="og:locale"      content={SITE_CONFIG.locale} />
      <meta property="og:type"        content={og.type} />
      <meta property="og:url"         content={og.url} />
      <meta property="og:title"       content={og.title} />
      <meta property="og:description" content={og.description} />
      <meta property="og:image"       content={og.image} />
      <meta property="og:image:width" content={String(og.imageWidth)} />
      <meta property="og:image:height" content={String(og.imageHeight)} />
      <meta property="og:image:alt"   content={og.imageAlt} />
      <meta property="og:image:type"  content="image/jpeg" />

      {/* ── Twitter Card ─────────────────────────────────────── */}
      <meta name="twitter:card"        content={twitter.card} />
      <meta name="twitter:site"        content={SITE_CONFIG.twitterHandle} />
      <meta name="twitter:creator"     content={twitter.creator} />
      <meta name="twitter:title"       content={twitter.title} />
      <meta name="twitter:description" content={twitter.description} />
      <meta name="twitter:image"       content={twitter.image} />
      <meta name="twitter:image:alt"   content={twitter.imageAlt} />

      {/* ── JSON-LD structured data ───────────────────────────── */}
      {jsonLdSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Helmet>
  );
};

export default DynamicSEO;