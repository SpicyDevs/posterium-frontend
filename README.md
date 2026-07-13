# Posterium Frontend

**The agentic interface layer for the Posterium network — an Astro 5 static site with React 19 islands, MCP discovery endpoints, and a full drag-and-drop poster builder.**

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)
[![Astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro)](#)
[![MCP](https://img.shields.io/badge/MCP-2025--03--26-6366f1)](#)
[![Prettier](https://img.shields.io/badge/code_style-Prettier-FF69B4)](#)

---

## Overview

Posterium Frontend is the web interface and discovery gateway for the Posterium poster generation network. It combines a **static-first Astro site** (marketing pages, documentation, examples, FAQ) with a **fully client-side React SPA** — the Poster drag-and-drop builder — that generates shareable API URLs for rendered movie/TV poster images with live rating badges.

Beyond the user-facing editor, this repository serves as an **AI Agent discovery enclave**. It exposes standards-compliant `.well-known` endpoints for the Model Context Protocol (MCP), OAuth authorization server metadata, JWKS public keys, and an agent skills index — enabling autonomous AI systems to discover, authenticate against, and invoke Posterium's capabilities without human configuration.

---

## Core Features

- **Astro-Powered Performance** — Island architecture delivers React components only where needed. Most pages are zero-JS HTML, resulting in sub-100 KB page loads and perfect Lighthouse scores out of the box.

- **Model Context Protocol (MCP) Integration** — A `.well-known/mcp/server-card.json` endpoint advertises Posterium's tool set (`open_builder`, `open_examples`) to MCP-compatible AI clients. Agents discover the interface automatically via the host's well-known URI.

- **Agent Skill & API Discovery** — An `agent-skills/index.json` manifest (draft spec) enumerates structured skills (`poster.generate`, `poster.examples`) with typed input/output schemas and web endpoints. The `api-catalog` linkset aggregates all discovery resources — MCP server card, OAuth config, agent skills, and documentation — into a single federated catalog.

- **Federated Machine Identity** — OAuth 2.0 Authorization Server metadata and JWKS endpoints (`oauth-authorization-server`, `jwks.json`) enable secure, standards-based authentication for automated clients and AI agents. Supports `authorization_code`, `client_credentials`, and `refresh_token` grants with PKCE (S256).

- **Drag-and-Drop Poster Builder** — A full React 19 SPA at `/build` with pixel-precise badge positioning, per-badge glassmorphism controls (blur, opacity, radius, shadow, border), multi-select, undo/redo history, and real-time canvas zoom/pan. The editor generates one-click shareable API URLs — no account required.

- **Progressive Web App (PWA)** — Auto-registering service worker via `@vite-pwa/astro` with runtime caching strategies for TMDB images (CacheFirst), Google Fonts (CacheFirst, 1 year), and the Posterium API (NetworkFirst, 5s timeout). Offline-capable once pages are visited.

- **Markdown Content Negotiation** — The Cloudflare Worker serving the built site inspects `Accept: text/markdown` headers and returns a clean Markdown representation of any HTML page — enabling LLMs and AI agents to consume site content as structured text without parsing HTML.

- **Static-First Deployment** — Full static output via `astro build`. Zero server-side rendering at runtime. Deployed to Cloudflare Workers + Assets for global edge delivery with sub-50ms TTFB.

---

## Tech Stack & Architecture

| Layer | Technology |
|---|---|
| Framework | Astro 5 (`@astrojs/react`, `@astrojs/sitemap`) |
| UI Runtime | React 19, TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4, PostCSS, Autoprefixer |
| State / Interactions | Headless UI React, @hello-pangea/dnd, clsx, Lucide React |
| Charts | Recharts (analytics dashboard) |
| Bundler | Vite (Astro-internal) with manual chunking (react-vendor, icons, headlessui, dnd) |
| Testing | Vitest 4 (node environment) |
| PWA | @vite-pwa/astro (Workbox runtime caching) |
| Compression | astro-compress (HTML/CSS/JS/SVG) |
| Formatting | Prettier (single quotes, trailing commas es5, printWidth 100) |
| Content Collections | Astro content (FAQ, install, examples, docs — YAML + Zod validation) |
| Identity & Discovery | OAuth 2.0, JWKS, MCP protocol, Agent Skills draft spec |
| Deployment | Cloudflare Workers + Assets, Wrangler 4 |
| API Backend | `https://api.posterium.xyz` (separate service) |

### Directory Layout

```
posterium-frontend/
├── public/
│   ├── _headers                  # CSP, HSTS, cache policies, discovery Link headers
│   ├── _redirects                # /sitemap.xml → /sitemap-index.xml, /builder → /build
│   ├── robots.txt                # AI training opt-out signals, per-bot rules
│   └── .well-known/              # ← Agent discovery enclave
│       ├── api-catalog           # Linkset aggregating all discovery resources
│       ├── oauth-authorization-server  # OAuth 2.0 AS metadata
│       ├── oauth-protected-resource     # OAuth 2.0 RS metadata
│       ├── jwks.json             # JSON Web Key Set (public keys)
│       ├── mcp/
│       │   └── server-card.json  # Model Context Protocol server card
│       └── agent-skills/
│           └── index.json        # Structured agent skill definitions
├── src/
│   ├── pages/                    # Astro page routes (.astro)
│   ├── builder/                  # React drag-and-drop poster SPA (/build)
│   │   ├── components/           # DraggableBadge, PropertyPanel, ZoomOverlay, etc.
│   │   ├── utils/                # URL generator/parser, positioning, constants
│   │   └── EditorContext.tsx     # Central editor state (React Context)
│   ├── modules/                  # React page modules (Dashboard, DocsLayout)
│   ├── ui/                       # Shared React/Astro UI primitives
│   ├── components/               # Shared components (AnalyticsDashboard, TestBenchmark)
│   ├── constants/                # Site config, badge definitions
│   ├── types/                    # TypeScript type definitions
│   ├── content/                  # Astro content collections (FAQ, install, examples, docs)
│   ├── lib/                      # Utility modules, remark plugin
│   ├── seo/                      # SEO components, JSON-LD schema builders
│   ├── layouts/                  # Astro layouts (BaseLayout, DocsLayout)
│   └── styles/                   # Global CSS (Tailwind + custom properties)
├── worker/
│   └── index.ts                  # Cloudflare Worker: static assets + markdown negotiation
├── astro.config.mjs
├── wrangler.jsonc
├── vitest.config.ts
└── tsconfig.json                 # Strict mode, @/ alias
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (check with `node --version`)
- **npm** (the project uses npm, not pnpm or yarn)

### Installation

```sh
git clone https://github.com/posterium/posterium-frontend.git
cd posterium-frontend
npm install
```

### Local Development

Start the Astro dev server with HMR:

```sh
npm run dev
```

Open `http://localhost:4321` in your browser. The poster builder is at `/build`.

### Production Build

```sh
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

### Useful Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Astro dev server (HMR) |
| `npm run build` | Static build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | Run `tsc --noEmit` (strict mode) |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run format` | Format all files with Prettier |
| `npm run clean` | Remove `dist/` directory |

### Custom API Endpoint

Create `.env.local` in the project root to override the default API base:

```env
PUBLIC_API_URL=https://your-api.example.com
```

### CI-Like Pipeline

```sh
npm run release:staging   # typecheck → test → build → deploy:staging
```

---

## Protocol Enclaves (.well-known Configuration)

This repository implements RFC 8615 well-known URIs to expose machine-readable metadata for AI agents, OAuth clients, and automated tooling. All discovery resources are served from `https://posterium.xyz/.well-known/`.

### Resource Catalog

The **`api-catalog`** file (RFC 9264 `application/linkset+json`) is the entry point. It aggregates all discovery endpoints into a single federated linkset:

```json
{
  "linkset": [
    {
      "anchor": "https://posterium.xyz/",
      "item": [
        { "href": "…/.well-known/oauth-authorization-server", "rel": "authorization_server" },
        { "href": "…/.well-known/oauth-protected-resource",  "rel": "oauth-protected-resource" },
        { "href": "…/.well-known/mcp/server-card.json",       "rel": "service-desc", "type": "application/json" },
        { "href": "…/.well-known/agent-skills/index.json",    "rel": "service-doc",  "type": "application/json" },
        { "href": "…/faq",                                    "rel": "service-doc",  "type": "text/html" }
      ]
    }
  ]
}
```

In addition, the homepage and `index.html` emit `Link` headers pointing to the `api-catalog`, enabling crawlers and middleware to discover the linkset without fetching the body.

### MCP Server Card

**`.well-known/mcp/server-card.json`** — Implements the Model Context Protocol `2025-03-26` draft. Advertises two tools:

| Tool | Description |
|---|---|
| `open_builder` | Open the Posterium builder with optional title prefill |
| `open_examples` | Browse examples, optionally filtered by query |

MCP-compatible clients discover this automatically by resolving `https://posterium.xyz/.well-known/mcp/server-card.json`.

### Agent Skills Index

**`.well-known/agent-skills/index.json`** — Defines structured skills per the Agent Skills draft specification (`version: 0.2.0`):

| Skill ID | Description | Input | Output |
|---|---|---|---|
| `poster.generate` | Generate a Posterium builder link with prefilled values | `{ title, year?, mediaType? }` | `{ url }` |
| `poster.examples` | Browse the gallery of poster examples | `{ query? }` | `{ url }` |

Each skill declares a typed `input_schema` and `output_schema`, enabling agents to validate parameters before invocation.

### OAuth & JWKS

| Endpoint | Purpose |
|---|---|
| `oauth-authorization-server` | OAuth 2.0 Authorization Server metadata (issuer, JWKS URI, supported grants/scopes, PKCE S256) |
| `oauth-protected-resource` | Protected resource metadata pointing to `https://api.posterium.xyz` |
| `jwks.json` | JSON Web Key Set for token signature verification |

### Extending the Agent Catalog

To add a new agent skill or tool:

1. Define the skill in `public/.well-known/agent-skills/index.json` following the existing `input_schema`/`output_schema` pattern.
2. If it exposes a new MCP tool, add it to `public/.well-known/mcp/server-card.json` under the `tools` array.
3. If the new endpoint should appear in the federated catalog, add a link entry to `public/.well-known/api-catalog`.
4. Update `public/_headers` if the new resource needs a specific `Content-Type`.

---

## Deployment

The project deploys as a **Cloudflare Workers + Assets** application.

### Build & Deploy

```sh
npm run build              # astro build → dist/
npm run deploy             # wrangler deploy --env production
```

The Wrangler configuration (`wrangler.jsonc`) mounts `dist/` as static assets with `run_worker_first: true` — every request passes through the Worker before hitting the static asset cache, enabling content negotiation.

### Security Headers

The `public/_headers` file configures Cloudflare to emit security and discovery headers:

- **CSP:** `default-src 'self'`; script-src allows `wasm-unsafe-eval`; img-src allows `https:` and `data:`; connect-src scoped to `api.posterium.xyz`, `api.themoviedb.org`, and `image.tmdb.org`
- **HSTS:** `max-age=31536000; includeSubDomains; preload`
- **Frame protection:** `X-Frame-Options: DENY`
- **Referrer policy:** `strict-origin-when-cross-origin`
- **Permissions:** Camera, microphone, geolocation all denied

### Caching Strategy

| Resource | Cache Policy |
|---|---|
| `index.html`, `404.html` | `max-age=0, must-revalidate` |
| `/assets/*` (hashed) | `max-age=31536000, immutable`, CORS `*` allowed |
| Static images (`og-image.png`, icons) | `max-age=604800, s-maxage=2592000, stale-while-revalidate=86400` |
| Sitemaps, robots.txt | `max-age=0` (sitemaps), `max-age=3600` (robots) |
| `.well-known/*` | Respective `Content-Type` set; no aggressive caching |

### Redirects

- `/sitemap.xml` → `/sitemap-index.xml` (301)
- `/builder` → `/build` (301)

### Content Negotiation

The Worker (`worker/index.ts`) checks `Accept: text/markdown` on every request. When present, HTML pages are converted to clean Markdown (scripts and styles stripped, headings extracted, whitespace normalized) and returned with `Content-Type: text/markdown` plus an `x-markdown-tokens` estimate header. This enables LLMs and AI agents to consume page content as structured text.

---

## Contributing

Contributions are welcome. Please open an issue to discuss changes before submitting a pull request.

```sh
# Fork the repo, then:
git checkout -b feat/your-feature
npm install
npm run dev

# Make your changes, then verify:
npm run typecheck
npm run test
npm run format

git commit -m "feat: your feature description"
git push origin feat/your-feature
# Open a pull request on GitHub
```

This project uses **TypeScript strict mode** with `noUnusedLocals` and `noUnusedParameters`. Unused code causes the build to fail. Run `npm run format` (Prettier) before committing.

---

## License

MIT © Posterium

See [LICENSE](./LICENSE) for details.
