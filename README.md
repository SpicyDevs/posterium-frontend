<div align="center">

<img src="#" alt="Posterium Banner" width="100%" style="border-radius: 12px;" />

<br />
<br />

<h1>🎬 Posterium</h1>

<p><strong>Free, open-source movie & TV poster generator with live rating badges.</strong><br />
Drag. Drop. Copy URL. Done.</p>

<br />

<!-- Badges row 1: Status -->

[![Live Site](#)](#)
[![API](#)](#)
[![License](#)](#)

<br />

<!-- Badges row 2: Repo stats -->

[![Stars](#)](#)
[![Forks](#)](#)
[![Issues](#)](#)
[![PRs Welcome](#)](#)

<br />

<!-- Badges row 3: Tech stack -->

![React](#)
![TypeScript](#)
![Vite](#)
![Tailwind CSS](#)
![Cloudflare Workers](#)

<br />

<!-- Support -->

[![Buy Me a Coffee](#)](#)
[![GitHub Sponsors](#)](#)

</div>

---

## ✨ What is Posterium?

Posterium is a **free, open-source visual editor** that generates custom movie and TV show posters with live rating badges baked directly into the image - all from a single API URL you can use anywhere.

Search any title, drag rating badges to exactly where you want them, tweak the glassmorphism effects, then copy one URL that works in Plex, Jellyfin, Discord bots, Notion, or any image tag on the web. No account. No rate limits. No nonsense.

```
#
  ?r=imdb,rt,meta,tmdb
  &blur=8&alpha=0.45&rad=12
  &imdb_x=310&imdb_y=20
  &rt_x=310&rt_y=90
```

That URL above is a fully rendered poster image - live ratings included - returned directly from the edge.

---

## 🖼️ Features

**Visual Editor**

- Drag-and-drop badge positioning with pixel precision
- Multi-select and group-move multiple badges at once
- Full undo/redo history (`Ctrl+Z` / `Ctrl+Y`)
- Resizable side panels on desktop, swipeable bottom sheet on mobile
- Zoom, pan, pinch-to-zoom canvas

**Badge System**

- 10 rating sources: IMDb, Rotten Tomatoes (Tomatometer + Audience Score), Metacritic, TMDB, Letterboxd, MyAnimeList, AniList, Runtime, Age Rating
- Per-badge overrides for glass blur, opacity, corner radius, drop shadow, border, scale, background color, and text color
- Global defaults that apply to all badges simultaneously

**Poster Fetching**

- Four poster sources: TMDB, Fanart.tv, Metahub, IMDb
- Textless poster support (artwork without title text)
- Smart selection modes: Top 1, Top 2, Bayesian Best, Random
- Full support for Movies, TV Series, and Anime

**API & Export**

- Instant API URL generation - one URL is the complete shareable poster
- Four export formats: SVG (vector), PNG, JPG, WebP
- Poster blur and grayscale effects baked into the output
- Bring your own API keys for TMDB and Fanart.tv

---

## 🚀 Quick Start (Using the Hosted Version)

The fastest way is to use the live editor - no setup required.

1. Go to **[posters.project-team.xyz/build](#)**
2. Search for a movie or TV show in the **Source** panel on the left
3. Toggle badges on/off in the **Layers** panel and drag them on the canvas
4. Tweak glass effects in the **Canvas / Badge** inspector on the right
5. Copy the URL from the top bar and paste it anywhere

---

## 🏠 Self-Hosting

> See [**SELFHOST.md**](#) for the full detailed guide. A quick overview is below.

Posterium is split into two parts: this **frontend editor** (React/Vite) and a separate **Cloudflare Worker** that powers the API. You can self-host the frontend and point it at the public API, or deploy the full stack yourself.

### Frontend Only (5 minutes)

```bash
git clone <REPOSITORY_URL>
cd freeposterapi
npm install
npm run dev          # → http://localhost:5173
```

To point the editor at a custom API, create a `.env.local` file:

```env
VITE_API_URL=#
```

### Build for Production

```bash
npm run build        # outputs to /dist
```

Deploy the `/dist` folder to Vercel, Netlify, Cloudflare Pages, or any static host. Make sure your host is configured to serve `index.html` for all routes (SPA fallback).

---

## 📡 API Reference

The API endpoint format is:

```
#
```

where `type` is `movie`, `tv`, or `anime`, `id` is the TMDB or IMDb ID, and `ext` is `svg`, `png`, `jpg`, or `webp`.

| Parameter           | Description                      | Example                         |
| ------------------- | -------------------------------- | ------------------------------- |
| `r`                 | Comma-separated badge IDs        | `imdb,rt,meta,tmdb`             |
| `source`            | Poster image source              | `tmdb` \| `fanart` \| `metahub` |
| `blur`              | Badge glass blur (px)            | `8`                             |
| `alpha`             | Badge background opacity         | `0.45`                          |
| `rad`               | Badge corner radius (px)         | `12`                            |
| `sh`                | Global drop shadow               | `5`                             |
| `{id}_x` / `{id}_y` | Badge pixel position             | `imdb_x=310&imdb_y=20`          |
| `g_scale`           | Global badge scale multiplier    | `1.0`                           |
| `textless`          | Strip title text from poster     | `1`                             |
| `ptype`             | Poster selection mode            | `top1` \| `best` \| `random`    |
| `bg_blur`           | Blur the background poster image | `4`                             |
| `bw`                | Grayscale the poster             | `1`                             |
| `download`          | Force file download response     | _(no value)_                    |
| `tmdb_key`          | Override TMDB API key            | `your_key`                      |
| `fanart_key`        | Override Fanart.tv API key       | `your_key`                      |

**Badge IDs:** `imdb`, `rt`, `rt_popcorn`, `letterboxd`, `meta`, `tmdb`, `mal`, `anilist`, `age`, `runtime`

---

## 🎨 Use Cases

**Plex & Jellyfin** - Paste the API URL as a custom poster in your media server. Ratings update automatically as scores change over time.

**Discord Bots** - Drop the URL directly into a bot embed's image field for rich, visually consistent movie recommendation cards.

**Notion & Obsidian** - Use an Image block with the API URL to embed a live poster with ratings in your watchlist database or movie notes.

**Personal Websites & Blogs** - A dynamic image source that always shows fresh data without any server-side code on your end.

**Automation (Make / Zapier / n8n)** - Integrate into workflows to auto-generate poster cards when you add titles to a watchlist.

---

## 🧱 Tech Stack

The frontend editor is built with **React 19** and **TypeScript**, bundled with **Vite 7**, and styled with **Tailwind CSS v4**. UI components use **Headless UI** for accessible primitives and **@hello-pangea/dnd** for drag-and-drop. The backend API runs on **Cloudflare Workers** at the edge for low-latency global delivery.

---

## 🤝 Contributing

Contributions are very welcome. Please open an issue first to discuss what you'd like to change, then submit a pull request against `main`.

```bash
# Fork the repo, then:
git checkout -b feat/your-feature
npm install
npm run dev
# Make your changes, then:
npm run format      # Prettier
git commit -m "feat: your feature"
git push origin feat/your-feature
# Open a PR on GitHub
```

---

## 💛 Support the Project

Posterium is free and will stay free. If it saves you time or brings you joy, consider supporting the work:

<div align="center">

[![Buy Me a Coffee](#)](#)

[![GitHub Sponsors](#)](#)

⭐ **Starring the repo is free and helps more people discover the project!**

</div>

---

## 📄 License

MIT © [Project Team](#)

---

<div align="center">
  <sub>Built with ❤️ by <a href="#">Project Team</a> · <a href="#">Live Editor</a> · <a href="#">GitHub</a></sub>
</div>
