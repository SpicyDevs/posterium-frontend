# Posterium Frontend — Agent Guide

## Stack

- **Astro 5** static site (NOT plain Vite—README is outdated) with React 19 islands
- Tailwind CSS v4 (`@tailwindcss/postcss`), PostCSS
- TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`)
- Cloudflare Worker (`worker/index.ts`) serving `dist/` as static assets
- Testing: Vitest v4 (node environment), config at `vitest.config.ts`

## Commands

```sh
npm run dev          # astro dev
npm run build        # astro build → dist/
npm run preview      # astro preview
npm run typecheck    # tsc --noEmit (run before commit)
npm run format       # prettier --write .
npm run test         # vitest run
npm run test:watch   # vitest
npm run clean        # rm -rf dist
npm run deploy       # wrangler deploy --env production
npm run cf:dev       # wrangler dev (local worker)

# Full CI-like pipeline:
npm run release:staging   # typecheck → test → build → deploy:staging
```

## Codebase Structure

| Directory | Purpose |
|---|---|
| `src/pages/` | Astro page routes (`.astro`) |
| `src/builder/` | Drag-and-drop poster editor (React SPA at `/build`) |
| `src/modules/` | React page modules (Dashboard, DocsLayout, etc.) |
| `src/ui/` | Shared React/Astro UI primitives |
| `src/components/` | Shared React components (AnalyticsDashboard, TestBenchmark) |
| `src/constants/` | Site config (`site.ts`), badge definitions (`badges.ts`) |
| `src/types/` | TypeScript type definitions |
| `src/content/` | Astro content collections (FAQ, install, examples, docs) |
| `src/lib/` | Utility modules, remark plugin, tests |
| `src/seo/` | SEO components and schema builders |
| `src/layouts/` | Astro layouts (BaseLayout, DocsLayout) |
| `src/styles/` | Global CSS (Tailwind + custom vars) |
| `scripts/` | Node scripts (`reel.mjs`, `validate-faq-jsonld.mjs`) |
| `worker/` | Cloudflare Worker (static asset serving + markdown content negotiation) |

## Key Details

- **TypeScript strict mode** with `noUnusedLocals`/`noUnusedParameters` — remove unused code
- **Path alias**: `@/` → `./src/` (configured in `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`)
- **Tests**: Only `src/lib/seo.test.ts` exists; patterns: `src/**/*.test.ts` / `*.spec.ts`
- **Content collections** in `src/content/` (faq, install, examples, docs) — YAML frontmatter validated via Zod
- **Custom remark plugin** `remark-require-image-alt.mjs` enforces alt text on all markdown images
- **PWA**: auto-registering service worker via `@vite-pwa/astro` with TMDB/Google Fonts/posters CDN caching
- **Builder app**: `<BuilderApp client:only="react" />` — fully client-side React; SSR only renders skip-link + hidden SEO text
- **Two builder modes**: `simple` and `advanced` (mode toggle in builder header)
- **API base**: `https://api.posterium.xyz` (override via `PUBLIC_API_URL` env var or `.env.local`)
- **Site URLs**: Always no trailing slash (`trailingSlash: 'never'`, `format: 'file'`)
- **Prettier**: single quotes, trailing commas (es5), printWidth 100, semicolons
- **.npmrc**: `prefer-offline=true`, `legacy-peer-deps=false`, `fund=false`, `audit=false`

## Deployment

- Static build output in `dist/`
- Cloudflare Worker (`worker/index.ts`) serves `dist/` assets with:
  - Markdown content negotiation (when `Accept: text/markdown`, converts HTML to markdown)
- Deploy via `wrangler deploy --env production`
- Production domain: `posterium.xyz` (custom domain in wrangler.jsonc)

## Builder Architecture

- Core types (`PosterConfig`, etc.) defined in `src/types/poster.ts`, re-exported from `src/builder/types.ts`
- Default badge config and constants in `src/constants/badges.ts`
- URL parser/generator utils in `src/builder/utils/`
- Editor state via `EditorContext.tsx` (React context)
- History (undo/redo) via `usePosterHistory.ts`
- Mobile support via `useMobileBottomSheet.ts`
- All panel components in `src/builder/components/` and `src/builder/components/panels/`
