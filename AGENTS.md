# Posterium Frontend — Agent Guide

## Stack

- **Astro 5** static site with React 19 islands
- Tailwind CSS v4 (`@tailwindcss/postcss`), PostCSS
- TypeScript strict (`noUnusedLocals`, `noUnusedParameters`)
- Cloudflare Worker (`worker/index.ts`) serves `dist/` as static assets + markdown content negotiation
- Testing: Vitest v4, config at `vitest.config.ts`

## Commands

```sh
npm run dev          # astro dev
npm run build        # astro build → dist/
npm run preview      # astro preview
npm run typecheck    # tsc --noEmit
npm run format       # prettier --write .
npm run test         # vitest run
npm run test:watch   # vitest
npm run clean        # rm -rf dist
npm run deploy       # wrangler deploy --env production
npm run cf:dev       # wrangler dev (local worker)

# Full CI-like pipeline (note: deploy:staging is not a standalone script):
npm run release:staging   # typecheck → test → build → deploy:staging
```

## Codebase Structure

| Directory | Purpose |
|---|---|
| `src/pages/` | Astro page routes (`.astro`) |
| `src/builder/` | Drag-and-drop poster editor React SPA at `/build` |
| `src/modules/` | React page modules (DocsLayout, ExamplesPage, etc.) |
| `src/ui/` | Shared React/Astro UI primitives |
| `src/components/` | Shared components (AnalyticsDashboard, TestBenchmark) |
| `src/constants/` | Site config (`site.ts`), badge definitions (`badges.ts`) |
| `src/types/` | TypeScript type definitions, re-exported from `builder/types.ts` |
| `src/content/` | Astro content collections (faq, install, examples, docs) — YAML + Zod |
| `src/lib/` | Utilities, remark plugin, tests |
| `src/seo/` | SEO components, JSON-LD schema builders |
| `src/layouts/` | Astro layouts (BaseLayout, DocsLayout) |
| `src/styles/` | Global CSS (Tailwind + custom vars) |
| `public/.well-known/` | **Agent discovery enclave** — MCP server card, OAuth metadata, JWKS, agent skills index, API catalog linkset |
| `scripts/` | Node scripts (`reel.mjs`, `validate-faq-jsonld.mjs`) |
| `worker/` | Cloudflare Worker (static assets + `Accept: text/markdown` → HTML-to-markdown) |

## Key Details

- **TypeScript strict** (`noUnusedLocals`, `noUnusedParameters`) — unused code breaks build
- **Path alias**: `@/` → `./src/` (in `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`)
- **Tests**: `src/**/*.test.ts` / `*.spec.ts`, also `handlers/**/*.test.ts` (none exist yet)
- **API base**: `https://api.posterium.xyz` — override via `PUBLIC_API_URL` env var or `.env.local`
- **Content collections** in `src/content/` mapped to routes: `install→/installation`, `faq→/faq`, `docs→/docs`, `examples→/examples`
- **Builder app**: `<BuilderApp client:only="react" />` — fully client-side; SSR only renders hidden SEO text + skip link
- **Two builder modes**: `simple` and `advanced` (toggle in header)
- **Builder types** (`PosterConfig`, etc.) live in `src/types/poster.ts`, re-exported from `src/builder/types.ts` alongside `DEFAULT_CONFIG`, `ALL_BADGES`, canvas constants
- **Badge defaults** in `src/constants/badges.ts`
- **Editor state**: `EditorContext.tsx` (React context), undo/redo via `usePosterHistory.ts`, mobile via `useMobileBottomSheet.ts`
- **Panel components** in `src/builder/components/` and `src/builder/components/panels/`
- **URL style**: no trailing slashes (`trailingSlash: 'never'`, `format: 'file'`)
- **Prettier**: single quotes, trailing commas es5, printWidth 100, semicolons
- **Custom remark plugin**: `src/lib/remark-require-image-alt.mjs` enforces alt text on markdown images
- **PWA**: auto-registering via `@vite-pwa/astro` with runtime caching (TMDB CacheFirst, Google Fonts CacheFirst 1y, Posterium API NetworkFirst 5s)
- **Vite manual chunks**: `react-vendor`, `icons` (lucide-react), `headlessui`, `dnd`
- **Custom sitemap integration** (`imageSitemapEnhancer` in `astro.config.mjs`) adds `<image:image>` tags per content collection
- **astro-compress**: minifies HTML/CSS/JS/SVG on build

## Agent Discovery Enclave

The repo exposes machine-readable discovery endpoints in `public/.well-known/`:

| Resource | Path |
|---|---|
| MCP server card | `.well-known/mcp/server-card.json` |
| Agent skills index | `.well-known/agent-skills/index.json` |
| API catalog linkset | `.well-known/api-catalog` |
| OAuth AS metadata | `.well-known/oauth-authorization-server` |
| OAuth RS metadata | `.well-known/oauth-protected-resource` |
| JWKS public keys | `.well-known/jwks.json` |

All served as static files from `public/`. To extend: edit the JSON in `public/.well-known/`, update `_headers` for custom Content-Types if needed.

## Deployment

- Static build to `dist/`
- Cloudflare Worker (`worker/index.ts`) serves `dist/` — all requests pass through worker first (`run_worker_first: true`)
- Worker checks `Accept: text/markdown` header; when present, converts HTML to Markdown and returns with `Content-Type: text/markdown` + `x-markdown-tokens` estimate
- Deploy: `wrangler deploy --env production` (custom domain `posterium.xyz`)
- Security headers in `public/_headers`: CSP, HSTS, XFO DENY, referrer policy, permissions
- Redirects in `public/_redirects`: `/sitemap.xml → /sitemap-index.xml`, `/builder → /build`
