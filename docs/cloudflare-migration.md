# Cloudflare Pages → Workers Static Assets Migration

This document explains why the Posterium frontend was migrated from **Cloudflare Pages** to **Cloudflare Workers with Static Assets**, what changed, and how to deploy going forward.

---

## Table of Contents

1. [Background & Motivation](#1-background--motivation)
2. [What Changed](#2-what-changed)
3. [wrangler.jsonc Reference](#3-wranglerjsonc-reference)
4. [Build & Deploy](#4-build--deploy)
5. [Headers and Redirects Compatibility](#5-headers-and-redirects-compatibility)
6. [404 Handling](#6-404-handling)
7. [Known Differences from Pages](#7-known-differences-from-pages)
8. [Rollback / Re-enabling Pages](#8-rollback--re-enabling-pages)

---

## 1. Background & Motivation

The frontend was previously deployed as a **Cloudflare Pages** site. Pages is a great starting point, but it has limitations that become relevant as the project grows:

| Concern | Pages | Workers Static Assets |
|---|---|---|
| Run Worker logic alongside static files | ✗ (separate Worker required) | ✓ (same `wrangler.jsonc`) |
| Fine-grained HTTP headers per route | `_headers` file only | `_headers` file + Worker middleware |
| Custom redirect logic | `_redirects` file only | `_redirects` file + Worker middleware |
| Colocation with backend handler stubs | ✗ | ✓ (`handlers/` can be imported directly) |
| `wrangler.jsonc`-based config | Partial | Full |

Moving to **Workers Static Assets** gives a single deployment unit that can serve static files _and_ run Worker code (such as the stubs in `handlers/`) without any routing glue between separate Pages and Workers projects.

---

## 2. What Changed

### Added: `wrangler.jsonc`

The only file added in this migration was `wrangler.jsonc` at the repository root:

```jsonc
{
  "name": "frontend",
  "assets": {
    "directory": "./dist/",
    "not_found_handling": "404-page"
  }
}
```

This file instructs Wrangler to treat the compiled `./dist/` output as a static asset bundle and serve it from a Worker.

### Removed: Cloudflare Pages project configuration

The Pages project in the Cloudflare dashboard (build command, output directory, Git integration) is superseded by the `wrangler.jsonc` config and the deploy command below. The Pages project can be deleted or left dormant after the Worker is live.

---

## 3. `wrangler.jsonc` Reference

| Field | Value | Description |
|---|---|---|
| `name` | `"frontend"` | The name of the Worker (also becomes the `*.workers.dev` subdomain) |
| `assets.directory` | `"./dist/"` | Path to the Astro build output relative to the repo root |
| `assets.not_found_handling` | `"404-page"` | Serve `dist/404.html` for any unmatched path instead of a plain 404 |

`not_found_handling: "404-page"` is the Workers equivalent of the Cloudflare Pages built-in 404 fallback. Astro generates `dist/404.html` automatically; no extra configuration is needed.

For a full list of supported `assets` fields see the [Cloudflare Workers Assets docs](https://developers.cloudflare.com/workers/static-assets/configuration/).

---

## 4. Build & Deploy

### Prerequisites

```bash
npm install -g wrangler      # or use npx wrangler
wrangler login               # authenticate once
```

### Local development

```bash
npm run dev                  # Astro dev server (hot reload)
```

To preview the production build served by a local Wrangler instance:

```bash
npm run build && npx wrangler dev --local
```

### Production deployment

```bash
npm run build                # Astro static build → dist/
npx wrangler deploy          # upload dist/ to Cloudflare Workers
```

> **Previously (Cloudflare Pages):**
> ```bash
> npx wrangler pages deploy ./dist
> ```
> That command is no longer needed.

### CI/CD

In a GitHub Actions workflow, replace the Pages deploy step:

```yaml
# Before (Pages)
- run: npx wrangler pages deploy ./dist --project-name=frontend

# After (Workers Static Assets)
- run: npm run build && npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

The `CLOUDFLARE_API_TOKEN` must have the **Workers Scripts: Edit** permission (not the Pages-specific token).

---

## 5. Headers and Redirects Compatibility

`public/_headers` and `public/_redirects` are **fully supported** by Workers Static Assets — they are processed identically to Cloudflare Pages.

- `public/_headers` — sets HTTP response headers per URL pattern, copied to `dist/_headers` during `npm run build`.
- `public/_redirects` — defines HTTP redirects, copied to `dist/_redirects` during `npm run build`.

No changes to either file were necessary.

---

## 6. 404 Handling

`not_found_handling: "404-page"` causes the Workers runtime to serve `dist/404.html` (with a `404` status code) for any request that does not match a static asset. This mirrors the default Cloudflare Pages behavior and is compatible with the `src/pages/404.astro` page already in the project.

If you later add a custom Worker script (e.g. to implement the `handlers/backdrop.ts` stubs), you can intercept unmatched requests in the `fetch` handler before the asset fallback fires.

---

## 7. Known Differences from Pages

| Feature | Cloudflare Pages | Workers Static Assets |
|---|---|---|
| Automatic Git deployments | ✓ via Pages dashboard | Configure via `wrangler deploy` in CI |
| Preview deployments per branch | ✓ built-in | Use separate named Workers (e.g. `frontend-preview`) |
| Build logs in dashboard | ✓ | Use CI logs |
| Analytics (Web Analytics) | ✓ toggle in Pages settings | Add the [Workers Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) binding manually |
| `_headers` / `_redirects` | ✓ | ✓ |
| 404 fallback | `404.html` auto-detected | `not_found_handling: "404-page"` |
| Custom domains | ✓ via Pages settings | ✓ via Workers Custom Domains |

---

## 8. Rollback / Re-enabling Pages

If you need to roll back to Cloudflare Pages:

1. Remove or rename `wrangler.jsonc` so Wrangler does not pick it up.
2. Re-enable the Pages project in the Cloudflare dashboard and point it at this repository.
3. Set the build command to `npm run build` and the output directory to `dist`.

No changes to `astro.config.mjs`, `public/_headers`, `public/_redirects`, or source files are required in either direction — the migration was purely a deployment-layer change.
