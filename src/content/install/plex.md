---
name: Plex
order: 1
showcaseImages:
  desktop: /placeholders/install-desktop.svg
  tv: /placeholders/install-tv.svg
  mobile:
    - /placeholders/install-mobile.svg
    - /placeholders/install-mobile-alt.svg
---

# Plex

![Plex setup preview](/placeholders/install-desktop.svg)

[![Plex](#)](#)
[![Posterium](#)](#)

Paste a Posterium URL into Plex's custom poster field. That's the whole trick.

## What you'll need

- Plex Media Server (any recent version)
- A tool or workflow that accepts custom image URLs (all of them do)
- A Posterium URL from the builder or API

## Steps

1. Open Posterium and build your poster layout.
2. Copy the final URL.
3. In Plex, open the movie or show you want to customize.
4. Click Edit Artwork → Upload Photo → enter the Posterium URL.
5. Save. Done.

### API pattern

```text
https://api.posterium.xyz/poster/{imdb_id}?source=tmdb&imdb=true&rt=true&metacritic=true
```

### Options

| Parameter    | What it does                | Example |
| ------------ | --------------------------- | ------- |
| `source`     | Which poster backend to use | `tmdb`  |
| `imdb`       | Add IMDb badge              | `true`  |
| `rt`         | Add Rotten Tomatoes badge   | `true`  |
| `metacritic` | Add Metacritic badge        | `true`  |

## Checklist

- [ ] Poster URL loads in your browser before you paste it
- [ ] Plex preview shows your custom artwork
- [ ] Ratings render on the final poster image