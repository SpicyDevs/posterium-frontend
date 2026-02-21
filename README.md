# FreePosterAPI - Self-Hosting Guide

This guide will walk you through deploying both the **Cloudflare Worker (Backend)** and the **React Editor (Frontend)** to your own Cloudflare account.

## Prerequisites

1. **Node.js & npm** installed on your machine.
2. A **Cloudflare Account** (Free tier is sufficient).
3. **API Keys** from the following providers:

- [TMDB API Key](https://www.themoviedb.org/documentation/api) (The Movie Database)
- [OMDB API Key](https://www.omdbapi.com/apikey.aspx) (Open Movie Database)
- [Fanart.tv API Key](https://fanart.tv/get-an-api-key/)

---

## Part 1: Backend Deployment (Cloudflare Worker)

The backend handles image generation, caching, and third-party API requests.

### 1. Install Wrangler

Wrangler is the Cloudflare Workers CLI.

```bash
npm install -g wrangler
wrangler login

```

### 2. Create the Project Directory

If you haven't already, create a folder for your worker (e.g., `backend`) and place your `worker.js` file inside it. Initialize a basic configuration:

```bash
mkdir backend
cd backend
wrangler init -y

```

### 3. Create a KV Namespace

This is required for caching poster data to avoid rate limits and improve speed.

```bash
npx wrangler kv:namespace create "POSTER_CACHE"

```

_Copy the **id** output from this command. You will need it for the next step._

### 4. Configure `wrangler.toml`

Create or edit `wrangler.toml` in your `backend` directory. Replace the placeholders with your actual values.

```toml
name = "freeposterapi-worker"
main = "src/worker.js"
compatibility_date = "2023-10-02"

# 1. KV Namespace Binding
[[kv_namespaces]]
binding = "POSTER_CACHE"
id = "YOUR_KV_NAMESPACE_ID_HERE"

# 2. Environment Variables (API Keys)
[vars]
TMDB_API_KEY = "your_tmdb_api_key"
OMDB_API_KEY = "your_omdb_api_key"
FANART_API_KEY = "your_fanart_api_key"

```

### 5. Deploy the Worker

Publish your worker to the edge.

```bash
npx wrangler deploy

```

**Note the URL** provided after deployment (e.g., `https://freeposterapi-worker.yourname.workers.dev`). You will need this for the frontend.

---

## Part 2: Frontend Deployment (Cloudflare Pages)

The frontend is the visual editor that generates the URLs.

### 1. Setup Environment

Navigate to the frontend project directory (where `package.json` and `vite.config.ts` are located).

### 2. Configure API Connection

Create a `.env` file in the root of your frontend folder to point to your new backend worker.

```env
VITE_API_URL=https://freeposterapi-worker.yourname.workers.dev

```

### 3. Install Dependencies & Build

```bash
npm install
npm run build

```

This will create a `dist` folder containing your static website.

### 4. Deploy to Cloudflare Pages

You can deploy directly using Wrangler.

```bash
npx wrangler pages deploy dist --project-name freeposterapi-editor

```

Alternatively, you can connect your GitHub repository to **Cloudflare Pages** via the dashboard:

1. Go to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
2. Select your repository.
3. **Build Settings:**

- **Framework preset:** Vite / React
- **Build command:** `npm run build`
- **Output directory:** `dist`

4. **Environment Variables:**

- Add `VITE_API_URL` with your worker URL.

---

## Part 3: Verification

1. Open your **Frontend URL** (e.g., `https://freeposterapi-editor.pages.dev`).
2. The editor should load.
3. Check the **Code Box** at the bottom; the URL should start with your custom worker domain.
4. Try changing a setting (e.g., Blur). If the image updates, your backend and frontend are communicating correctly!

## Troubleshooting

- **Images not loading?** Check the "Real-time Logs" of your worker:

```bash
npx wrangler tail

```

- **"KV is not defined" error?** Ensure you created the KV namespace _and_ added the `[[kv_namespaces]]` block correctly in `wrangler.toml`.
- **API Rate Limits?** If images load slowly or fail, ensure your API keys are valid and that the KV cache is working (second load of the same poster should be instant).
