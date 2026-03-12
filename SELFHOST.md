# 🏠 Self-Hosting Posterium

This guide covers every way to run Posterium yourself, from a quick local dev environment to a fully self-hosted stack with your own Cloudflare Worker API.

---

## Architecture Overview

Posterium has two completely independent pieces:

**The Frontend Editor** is a React/Vite SPA that lives in this repository. It handles the visual editor, drag-and-drop canvas, badge customization, and URL generation. It is a purely static build — it compiles down to HTML, CSS, and JavaScript files that can be served from any static host.

**The Backend API** (`api.spicydevs.xyz`) is a Cloudflare Worker that fetches poster images from TMDB/Fanart/etc., fetches live rating data from IMDb/RT/Metacritic/etc., composites the SVG badge overlays, and returns the final image. The Worker source is a separate repository.

You can self-host in two configurations:

- **Frontend only** — Run the editor yourself, pointed at the public `api.spicydevs.xyz` API. Zero backend work, takes about five minutes.
- **Full stack** — Deploy both the frontend and your own Cloudflare Worker API. Gives you complete control over rate limits, API keys, and domains.

---

## Prerequisites

Before you start, make sure you have the following installed:

- **Node.js 18+** (the project uses ES2020 targets and modern APIs — Node 18 is the minimum safe version)
- **npm 9+** (comes bundled with Node 18+)
- **Git**

You can verify your versions with `node -v` and `npm -v`. If you need to install or upgrade Node, [nvm](https://github.com/nvm-sh/nvm) is the easiest way to manage multiple versions.

---

## Option 1 — Frontend Only (Recommended Starting Point)

This is the simplest path. You clone the frontend, run it locally or deploy it to a static host, and it talks to the public API. This is completely free and takes about five minutes.

### Step 1: Clone and Install

```bash
git clone https://github.com/xdaayush/freeposterapi.git
cd freeposterapi
npm install
```

The `npm install` step pulls in React, Vite, Tailwind, Headless UI, and the other frontend dependencies. There are no native modules or platform-specific binaries, so it works the same on macOS, Linux, and Windows.

### Step 2: Start the Development Server

```bash
npm run dev
```

Vite will start a local server, typically at `http://localhost:5173`. Open that URL in your browser and you should see the full Posterium editor, already connected to the public API.

The dev server supports hot module replacement (HMR), so changes you make to source files appear in the browser instantly without a full page reload.

### Step 3: (Optional) Point to a Custom API

If you want to use your own API worker instead of the public one, create a `.env.local` file in the project root:

```env
# .env.local
VITE_API_URL=https://your-api-worker.workers.dev
```

Vite reads `.env.local` automatically and the editor will use your custom API base URL for all poster requests and URL generation. The `.env.local` file is gitignored by default, so your personal keys and URLs won't be committed.

---

## Option 2 — Building for Production

When you're ready to deploy, build the project into static files:

```bash
npm run build
```

This runs TypeScript type-checking (`tsc`) followed by the Vite production build. The output goes into a `dist/` folder. Inside `dist/` you'll find:

- `index.html` — the shell HTML with script/style references
- `assets/` — hashed JS chunks and CSS, ready for long-lived caching

The build automatically handles code splitting. React and React DOM are bundled separately from the app code, and Headless UI and Lucide are split into their own chunks. This means returning visitors only re-download the chunks that changed.

### Important: SPA Routing

Posterium uses client-side routing with two routes (`/` for the dashboard and `/build` for the editor). Your static host needs to be configured to serve `index.html` for any path that doesn't match a real file. This is sometimes called "history API fallback" or "SPA mode."

---

## Deployment Targets

### Vercel

Vercel automatically detects Vite projects and configures SPA routing for you. The simplest path is to connect your GitHub fork directly:

1. Push your fork to GitHub.
2. Go to [vercel.com](https://vercel.com), create a new project, and import your repository.
3. Vercel will detect the Vite framework, set the build command to `npm run build`, and the output directory to `dist`.
4. If you need a custom API URL, add `VITE_API_URL` in the Vercel project's **Settings → Environment Variables** panel.
5. Deploy.

### Netlify

Netlify also handles Vite automatically. After connecting your repository, set the build command to `npm run build` and the publish directory to `dist`. For SPA routing, create a `public/_redirects` file with:

```
/*    /index.html    200
```

Add any environment variables under **Site settings → Environment variables**.

### Cloudflare Pages

Cloudflare Pages is a natural fit since the API already runs on Cloudflare Workers. Connect your GitHub repository, set the build command to `npm run build`, and the build output directory to `dist`. Cloudflare Pages handles SPA routing by default.

### Self-Hosted (Nginx)

If you're running your own server, copy the `dist/` folder to your web root and configure Nginx to fall back to `index.html`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/posterium;
    index index.html;

    # Serve static assets with long cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Self-Hosted (Docker)

If you prefer containers, here's a minimal `Dockerfile` you can add to the project root:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

And an `nginx.conf` alongside it:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run with:

```bash
docker build -t posterium .
docker run -p 8080:80 posterium
```

The editor will be live at `http://localhost:8080`.

---

## Option 3 — Full Stack (Frontend + Your Own API Worker)

For complete control — your own domains, your own TMDB/Fanart API keys baked in, no rate-limit concerns — you can deploy your own Cloudflare Worker API.

> The Worker source code is maintained separately. Check the repository's releases or the main README for a link to the Worker repository.

### What You'll Need

- A [Cloudflare account](https://cloudflare.com) (the free plan is sufficient)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A [TMDB API key](https://www.themoviedb.org/settings/api) (free)
- Optionally a [Fanart.tv API key](https://fanart.tv/get-an-api-key/) (free)

### Deploy the Worker

```bash
# Clone the Worker repository (check main README for URL)
git clone https://github.com/xdaayush/freeposterapi-worker.git
cd freeposterapi-worker

npm install

# Log into your Cloudflare account
wrangler login

# Set your API keys as secrets (stored encrypted by Cloudflare)
wrangler secret put TMDB_API_KEY
wrangler secret put FANART_API_KEY   # optional

# Deploy to Cloudflare's global edge network
wrangler deploy
```

After deploying, Wrangler prints your Worker's URL — something like `https://your-worker.your-subdomain.workers.dev`. You can also add a custom domain via the Cloudflare dashboard.

### Connect the Frontend to Your Worker

In the frontend project root, create `.env.local`:

```env
VITE_API_URL=https://your-worker.your-subdomain.workers.dev
```

Then build and deploy the frontend as described in Option 2. The editor will now generate API URLs pointing at your own Worker.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Override the default API base URL. Defaults to `https://api.spicydevs.xyz` if not set. |

All other configuration (TMDB keys, Fanart keys, etc.) is handled at runtime through the editor's API Keys panel in the inspector sidebar, or via URL parameters — not through build-time environment variables.

---

## Local Development Tips

**Running on a different port** — If port 5173 is taken, Vite will automatically try the next available port. You can also force a specific port: `npm run dev -- --port 3000`.

**Network access** — To test on a phone or tablet on the same network, expose the dev server: `npm run dev -- --host`. Vite will print the local network URL (e.g., `http://192.168.1.x:5173`).

**TypeScript checks** — The build runs `tsc` before Vite, so type errors will fail the build. Run `npx tsc --noEmit` at any time to check types without building.

**Formatting** — The project uses Prettier. Run `npm run format` before committing to ensure consistent style.

---

## Troubleshooting

**Blank page after deploy** — Almost always a SPA routing issue. Make sure your host is configured to serve `index.html` for all non-asset paths, as described in the Deployment Targets section above.

**CORS errors in the browser console** — This happens when the frontend's origin is not allowed by the API Worker. The public API (`api.spicydevs.xyz`) is open to all origins. If you're running your own Worker, check the CORS headers in the Worker source.

**Images not loading in the editor** — The poster images are loaded from `api.spicydevs.xyz` (or your custom API URL) and from TMDB's image CDN (`image.tmdb.org`). Make sure neither is blocked by a browser extension or network firewall in your environment.

**`npm install` errors** — Make sure you're on Node 18 or higher. The `vite-plugin-webfont-dl` package used for the Plus Jakarta Sans font download requires a modern Node environment.

---

## Updating

To pull in upstream changes from the main repository:

```bash
git remote add upstream https://github.com/xdaayush/freeposterapi.git
git fetch upstream
git merge upstream/main
npm install   # in case dependencies changed
```

---

## Getting Help

If you run into an issue not covered here, please [open an issue on GitHub](https://github.com/xdaayush/freeposterapi/issues) with details about your environment (OS, Node version, deployment target) and the error message you're seeing. Pull requests with improvements to this guide are also very welcome.
