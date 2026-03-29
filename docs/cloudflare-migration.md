# Cloudflare Migration Guide

> Migrate the Posterium frontend from Vercel (or any static host) to
> **Cloudflare Workers + Assets** — the recommended zero-config edge hosting
> for this project.

---

## Table of Contents

1. [Why Cloudflare Workers + Assets](#1-why-cloudflare-workers--assets)
2. [Prerequisites](#2-prerequisites)
3. [Understanding the Existing Config](#3-understanding-the-existing-config)
4. [One-Time Account Setup](#4-one-time-account-setup)
5. [Deploy from the CLI](#5-deploy-from-the-cli)
6. [Connect a Custom Domain](#6-connect-a-custom-domain)
7. [Environment Variables & Secrets](#7-environment-variables--secrets)
8. [CI/CD with GitHub Actions](#8-cicd-with-github-actions)
9. [Vercel Teardown Checklist](#9-vercel-teardown-checklist)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Why Cloudflare Workers + Assets

| Feature | Vercel (Hobby) | Cloudflare Workers + Assets |
| --------------------------------- | -------------- | --------------------------- |
| Edge locations | ~18 | 300+ |
| Bandwidth (free tier) | 100 GB/mo | Unlimited |
| Requests (free tier) | Soft limits | 100 k/day (Workers) |
| Cold starts | Occasional | None (V8 isolates) |
| Custom domains | ✅ | ✅ |
| Native wrangler config in repo | ❌ | ✅ (already present) |

The `wrangler.jsonc` at the root of this project already contains the minimum
config needed — no additional files are required.

---

## 2. Prerequisites

| Requirement | Version | Notes |
| ------------------- | ------- | --------------------------------------------- |
| Node.js | ≥ 20 | `node --version` |
| npm | ≥ 10 | bundled with Node 20 |
| Wrangler CLI | ≥ 4 | `npm install -g wrangler` |
| Cloudflare account | — | Free at [dash.cloudflare.com](https://dash.cloudflare.com) |

Verify Wrangler is installed:

```bash
wrangler --version
```

---

## 3. Understanding the Existing Config

`wrangler.jsonc` (root of repo):

```jsonc
{
  "name": "frontend",
  "assets": {
    "directory": "./dist/",
    "not_found_handling": "404-page"
  }
}
```

| Key | Value | Effect |
| ---------------------- | ------------ | ----------------------------------------------- |
| `name` | `frontend` | Cloudflare Worker name (appears in the dashboard) |
| `assets.directory` | `./dist/` | Folder produced by `npm run build` |
| `not_found_handling` | `404-page` | Serves `dist/404.html` on unknown paths instead of a generic Cloudflare error |

Astro is configured with `output: 'static'` and `build.format: 'file'`, so
every route (`/`, `/build`, etc.) gets its own `.html` file in `dist/`. No
SPA catchall is needed — the `404-page` handler covers truly unknown URLs.

---

## 4. One-Time Account Setup

### 4a. Log in to Cloudflare

```bash
wrangler login
```

This opens a browser window. Authorise the Wrangler CLI and return to the
terminal.

### 4b. Confirm your account ID

```bash
wrangler whoami
```

Note the **Account ID** — you will need it for the GitHub Actions secret in
[§ 8](#8-cicd-with-github-actions).

---

## 5. Deploy from the CLI

### 5a. Build the site

```bash
npm run build
# → outputs static files to ./dist/
```

### 5b. Deploy to Cloudflare

```bash
wrangler deploy
```

Wrangler reads `wrangler.jsonc`, uploads the contents of `./dist/`, and
prints the Worker URL:

```
✅  Uploaded frontend (1.23 sec)
Published frontend (2.45 sec)
  https://frontend.<your-subdomain>.workers.dev
```

### 5c. Smoke test

Open the printed URL in a browser. Verify:

- The home page loads.
- `/build` renders the poster editor.
- A non-existent path (e.g. `/does-not-exist`) shows the custom 404 page.

---

## 6. Connect a Custom Domain

> These steps replace the `posters.spicydevs.xyz` Vercel domain with
> Cloudflare.

### 6a. Add the domain to Cloudflare DNS

If your domain is **not yet on Cloudflare**, transfer or add it at
`dash.cloudflare.com → Add a site`.  If it is already on Cloudflare, skip
this step.

### 6b. Add a custom domain to the Worker

```bash
wrangler deploy --name frontend
```

Then in the Cloudflare dashboard:

1. Go to **Workers & Pages → frontend → Settings → Domains & Routes**.
2. Click **Add Custom Domain**.
3. Enter `posters.spicydevs.xyz` and click **Add Domain**.
4. Cloudflare automatically creates the DNS record and provisions an SSL
   certificate (usually within 1–2 minutes).

Alternatively, add the route directly in `wrangler.jsonc`:

```jsonc
{
  "name": "frontend",
  "routes": [{ "pattern": "posters.spicydevs.xyz/*", "zone_name": "spicydevs.xyz" }],
  "assets": {
    "directory": "./dist/",
    "not_found_handling": "404-page"
  }
}
```

Then re-deploy:

```bash
wrangler deploy
```

---

## 7. Environment Variables & Secrets

The frontend uses a single runtime environment variable consumed at **build
time** by Vite:

| Variable | Purpose | Default |
| --------------- | ------------------------------------------- | ------------------------------ |
| `VITE_API_URL` | Base URL of the Posterium API worker | `https://api.spicydevs.xyz` |

Because Astro/Vite bakes `VITE_*` variables into the static bundle at build
time, they are **not** set in the Cloudflare Worker environment — they must be
present in the shell (or CI environment) when `npm run build` runs.

### For local builds

Create a `.env.local` file (already in `.gitignore`):

```env
VITE_API_URL=https://api.spicydevs.xyz
```

### For CI/CD

Add `VITE_API_URL` as a **repository secret** in GitHub (see § 8).

---

## 8. CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: npm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Required GitHub Secrets

| Secret | Where to get it |
| ------------------------- | -------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN` | [Cloudflare dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) → Create Token → **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | `wrangler whoami` or Cloudflare dashboard → right sidebar |
| `VITE_API_URL` | `https://api.spicydevs.xyz` (or your self-hosted worker URL) |

---

## 9. Vercel Teardown Checklist

Once the Cloudflare deployment is confirmed live on your custom domain:

- [ ] Update the DNS A/CNAME records for `posters.spicydevs.xyz` to point to
      Cloudflare (done automatically when using Cloudflare DNS in § 6).
- [ ] Remove the project from the Vercel dashboard to stop any automatic
      re-deployments.
- [ ] Delete or archive any Vercel-specific files (`vercel.json`) if they
      exist.
- [ ] Update the Live Site badge in `README.md` to replace `logo=vercel` with
      `logo=cloudflare`:

  ```diff
  - [![Live Site](https://img.shields.io/badge/Live%20Site-posters.spicydevs.xyz-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://posters.spicydevs.xyz)
  + [![Live Site](https://img.shields.io/badge/Live%20Site-posters.spicydevs.xyz-f6821f?style=for-the-badge&logo=cloudflare&logoColor=white)](https://posters.spicydevs.xyz)
  ```

---

## 10. Troubleshooting

### `wrangler deploy` fails with "Missing entry-point"

The `wrangler.jsonc` uses **Workers Assets** (no Worker script). Make sure you
are on Wrangler ≥ 4:

```bash
npm install -g wrangler@latest
wrangler --version
```

### 404 page is not shown — Cloudflare default error page appears instead

Verify that `dist/404.html` exists after `npm run build`. Astro generates this
from `src/pages/404.astro`. If it is missing, check that the page file is
present and rebuild.

### Assets are stale after deploy

Cloudflare Workers Assets are **immutable per deploy**. Each `wrangler deploy`
creates a new asset bundle — no manual cache purge is needed. If you see a
stale cached response in the browser, hard-refresh (`Ctrl+Shift+R`).

### The `/build` route returns a 404

Astro's `build.format: 'file'` outputs `dist/build.html`. Cloudflare Workers
Assets serves `build.html` for the path `/build` automatically. If this route
is still 404ing, confirm that `dist/build.html` exists and that you are using
Wrangler ≥ 4 (older versions did not support directory assets natively).

### Service Worker (`sw.js`) not updating after deploy

The Workbox-generated service worker uses content-hash filenames. After a new
deploy the browser will download the updated `sw.js` on the next page load and
activate it in the background (`registerType: 'autoUpdate'` is set in
`astro.config.mjs`). No additional steps are needed.
