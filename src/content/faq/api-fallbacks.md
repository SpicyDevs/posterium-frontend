---
category: API
question: What happens when a rating source is missing?
order: 2
---

Ratings is one thing. Posters are another — and they fail differently.

If TMDB doesn't have artwork for a title, Posterium runs a cascade: Fanart.tv first, then Metahub, then IMDb. Each fallback kicks in automatically. You don't configure it, you don't get a broken image.

For ratings: if a source returns nothing (say, an obscure title has no RT score), the badge simply doesn't render. The rest of the poster stays intact. You can enable or disable individual sources in the builder — if you only want IMDb and Letterboxd, that's fine.