# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences of roughly equal weight, in a self-hosted media world:

1. **Media server owners** — hobbyists running Plex, Jellyfin, Emby, Kodi, or Stremio who want live rating badges (IMDb, RT, Metacritic, …) baked into their library's poster artwork. They paste a URL into a custom-poster field, once, and get self-updating artwork without creating an account or paying.
2. **API consumers / developers** — people wiring Posterium URLs into Discord bots, static sites, Notion pages, and dashboards. They want a predictable URL contract, no signup, and broad rating-source coverage.

Both share the job: _turn a title + rating sources into a shareable poster URL with zero friction._

## Product Purpose

Posterium generates movie and TV posters with live rating badges from 20+ sources (IMDb, Rotten Tomatoes, Metacritic, TMDB, Letterboxd, MyAnimeList, AniList, and more) and optional genre/cast/overlay information. Two ways to use it: a drag-and-drop visual builder at `/build` that produces a shareable API URL, or a hand-built URL. Success means a user gets the exact poster they want from one URL — no account, no config, no cost.

## Positioning

Total customisability where competitors ship fixed presets: every badge's placement and styling is configurable down to the pixel in the visual builder (per-badge blur, opacity, radius, shadow, border; free positioning), combined with:

- zero signup and generous daily limits on a free API, versus paid incumbents like RPDB;
- live badges from more than 20 rating sources, broader than competitors.

## Operating Context

- The API is remote at `https://api.posterium.xyz` (overridable via `PUBLIC_API_URL`); posters render server-side and update each time the URL is fetched.
- Media servers consume the poster URL from their custom-artwork field (Plex, Jellyfin, Emby, Kodi, Stremio all supported, with install guides in content).
- The homepage is 100% static: hero and reel posters are pre-downloaded at build time — zero runtime API calls.
- The builder is a fully client-side React SPA (`/build`); it produces shareable URLs, it does not upload or save posters.
- The site is deployed as pure static assets on Cloudflare (Workers static assets), served from `dist/`.
- The repository also acts as an agent discovery enclave: `.well-known/` exposes an MCP server card, OAuth AS/RS metadata, JWKS keys, an agent skills index, and an API catalog linkset.
- Operator tooling: `/admin/analytics` and `/admin/test` pages (internal monitoring/benchmarks).

## Capabilities and Constraints

- Two builder modes: `simple` and `advanced`.
- Per-badge glassmorphism-style controls: blur, opacity, radius, shadow, border; multi-select; undo/redo history; canvas zoom/pan; mobile bottom-sheet support.
- Exports: SVG, PNG, JPG, WebP (via API).
- URL API: no account, no API key; generous daily limits (per site copy).
- Content surfaces: docs (including a migration guide from API v2 → v3), FAQ, examples gallery, installation guides for Plex/Jellyfin/Emby/Kodi/Stremio.
- PWA: offline-capable service worker caching TMDB images, Google Fonts, and the Posterium API; `navigateFallback` to `/404.html`.
- Rating sources can be a single badge or multiple badges per poster; artwork may also carry genre tags and cast information.
- No server-side dynamic logic in the frontend — anything that must change at runtime goes through the API.
- Undecided: whether there are authenticated/paid tiers (none appears in the frontend; free + limits is the only stated model).

## Brand Commitments

- Name: **Posterium**; author: SpicyDevs (`github.com/SpicyDevs`, `spicydevs.js.org`).
- Domain: `posterium.xyz`; Twitter handle `@posterium`.
- Open source (MIT per README).
- Copy consistently claims: free, no account required, generous daily limits, 20+ rating sources, works with Plex/Jellyfin/Kodi/Discord/Stremio/Notion/static sites.
- The agent discovery enclave endpoints (`.well-known/`) are a shipped, documented feature, not scaffolding.

## Evidence on Hand

- Content collections: FAQ (9 entries), install guides (5), docs (2), examples gallery (8) — `src/content/`.
- SEO copy, OG image, README, and `src/constants/site.ts` establish name, URL contract, and feature claims.
- Homepage assets pre-downloaded by `scripts/fetch-home-posters.mjs` (6 hero + 22 reel posters) in `public/images/home-posters/`, plus generated `src/generated/homePosters.ts`.
- `.well-known/` endpoints: MCP server card, agent skills index, API catalog, OAuth AS/RS metadata, JWKS.
- Absent: testimonials, press mentions, case studies, and user counts. Do not fabricate these; the JSON-LD aggregate rating is env-gated and unset by default.

## Product Principles

1. **Zero friction wins:** no account, no config, no install — every step between intent and a poster URL is one to remove, not one to add.
2. **The user owns the pixels:** presets are starting points, never cages; the builder must expose full control over every badge.
3. **Live by default:** a poster is a living URL, not a static file — ratings refresh on fetch.
4. **Static-first delivery:** content surfaces stay dependency-free and offline-capable; runtime work belongs to the API.
5. **Open and machine-readable:** open source, standards-compliant agent discovery (MCP/OAuth/JWKS) as a first-class feature.
