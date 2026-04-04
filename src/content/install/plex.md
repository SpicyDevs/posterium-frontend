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

# Plex installation guide

![Plex setup preview](/placeholders/install-desktop.svg)

[![Plex](https://img.shields.io/badge/Plex-Client-F5A623?style=for-the-badge&logo=plex)](https://www.plex.tv/)
[![Posterium](https://img.shields.io/badge/Posterium-Open%20Source-C47C2E?style=for-the-badge)](https://posters.spicydevs.xyz)

Use this flow to connect Posterium generated posters inside Plex metadata workflows.

## Requirements

- Plex Media Server (latest stable)
- A poster automation tool or metadata agent that accepts custom image URLs
- Access to Posterium builder or API output

## Step-by-step

1. Open Posterium and generate the poster style you want.
2. Copy the final poster URL.
3. In Plex, open the movie or show details panel.
4. Edit artwork and paste the Posterium URL.
5. Save and refresh metadata.

### API pattern

```text
https://api.spicydevs.xyz/poster/{imdb_id}?source=tmdb&imdb=true&rt=true&metacritic=true
```

### Optional: query template table

| Parameter | Description | Example |
| --- | --- | --- |
| `source` | Metadata source | `tmdb` |
| `imdb` | Include IMDb badge | `true` |
| `rt` | Include Rotten Tomatoes badge | `true` |
| `metacritic` | Include Metacritic badge | `true` |

## Verification checklist

- [ ] Poster URL resolves in browser
- [ ] Plex updates artwork preview
- [ ] Ratings render in final poster image
