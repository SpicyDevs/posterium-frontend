// src/DynamicSEO.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Dynamic metadata engine. Reads the active route from the existing custom
// router, merges per-route overrides with global defaults, and injects the
// full tag suite via react-helmet-async.
//
// Route detection: uses useRouter() from src/Router.tsx — functionally
// identical to useLocation().pathname from react-router-dom. Replacing with
// react-router-dom would require BrowserRouter, which conflicts with the
// custom router's direct window.history.pushState calls.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useRouter } from './Router';
import {
  SITE_CONFIG,
  SEO_DEFAULTS,
  ROUTE_SEO,
  OGMeta,
  TwitterMeta,
} from './config';

const DynamicSEO: React.FC = () => {
  const { path } = useRouter();

  // ── 1. Route lookup ───────────────────────────────────────────────────────
  // Normalize trailing slash so '/build' and '/build/' resolve identically.
  const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  const routeMeta = ROUTE_SEO[normalizedPath];

  // ── 2. Scalar fallbacks ───────────────────────────────────────────────────
  const title       = routeMeta?.title       ?? SEO_DEFAULTS.title;
  const description = routeMeta?.description ?? SEO_DEFAULTS.description;
  const canonical   = routeMeta?.canonical   ?? SEO_DEFAULTS.canonical;
  const noindex     = routeMeta?.noindex      ?? false;

  // ── 3. OG merge: defaults → route-level override → title/desc backfill ───
  // Priority (highest to lowest):
  //   routeMeta.og.field  →  SEO_DEFAULTS.og.field  →  scalar title/description
  const og: OGMeta = {
    ...SEO_DEFAULTS.og,
    ...(routeMeta?.og ?? {}),
    // If a route defines an og.title/description, it wins; otherwise inherit
    // the already-resolved scalar title and description so OG is never blank.
    title:       routeMeta?.og?.title       ?? title,
    description: routeMeta?.og?.description ?? description,
  };

  // ── 4. Twitter merge (same strategy as OG) ─────────────────────────────────
  const twitter: TwitterMeta = {
    ...SEO_DEFAULTS.twitter,
    ...(routeMeta?.twitter ?? {}),
    title:       routeMeta?.twitter?.title       ?? title,
    description: routeMeta?.twitter?.description ?? description,
  };

  return (
    <Helmet>
      {/* ── Base ─────────────────────────────────────────────── */}
      <html lang="en" />
      <title>{title}</title>
      <meta name="description"  content={description} />
      <meta name="theme-color"  content={SITE_CONFIG.themeColor} />
      <link rel="canonical"     href={canonical} />

      {/* Prevent indexing when flagged (e.g. admin, 404 stubs) */}
      {noindex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow" />
      }

      {/* ── Open Graph ───────────────────────────────────────── */}
      <meta property="og:site_name"    content={SITE_CONFIG.name} />
      <meta property="og:locale"       content={SITE_CONFIG.locale} />
      <meta property="og:type"         content={og.type} />
      <meta property="og:url"          content={og.url} />
      <meta property="og:title"        content={og.title} />
      <meta property="og:description"  content={og.description} />
      <meta property="og:image"        content={og.image} />
      <meta property="og:image:width"  content={String(og.imageWidth)} />
      <meta property="og:image:height" content={String(og.imageHeight)} />
      <meta property="og:image:alt"    content={og.imageAlt} />

      {/* ── Twitter Card ─────────────────────────────────────── */}
      <meta name="twitter:card"        content={twitter.card} />
      <meta name="twitter:site"        content={SITE_CONFIG.twitterHandle} />
      <meta name="twitter:creator"     content={twitter.creator} />
      <meta name="twitter:title"       content={twitter.title} />
      <meta name="twitter:description" content={twitter.description} />
      <meta name="twitter:image"       content={twitter.image} />
      <meta name="twitter:image:alt"   content={twitter.imageAlt} />
    </Helmet>
  );
};

export default DynamicSEO;