# freeposterapi

## Full tests

Use this command to run the exhaustive source/media diagnostics endpoint:

```bash
curl 'http://127.0.0.1:8787/test/?run=1&movie_id=550&tv_id=1399&anime_id=5114&sources=tmdb,fanart,imdb,metahub,mal,tvdb,trakt,anilist'
```

Notes:
- `/test/` without `run=1` returns a dry-run matrix only.
- `/test/?run=1` executes every generated request and returns formatted per-step diagnostics.
