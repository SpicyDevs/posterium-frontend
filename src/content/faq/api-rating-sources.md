---
category: API
question: Which rating sources are supported?
order: 1
---

Twelve sources, last count:

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