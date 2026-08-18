---
category: API
question: Which rating sources are supported?
order: 1
---

20+ sources — here's the core set:

- IMDb
- Rotten Tomatoes
- Metacritic
- TMDB
- Letterboxd
- AniList
- MyAnimeList
- Douban
- FilmAffinity
- Filmweb
- Criticker
- MUBI

Add them to your URL with the `r` parameter — comma-separated, no spaces. Example: `?r=imdb,rt,meta,letterboxd`. The API fetches them fresh on every request.
