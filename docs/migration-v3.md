# V3 Migration Guide

> **Existing v3 URLs continue to work unchanged.** This guide documents the
> new short-form aliases, params, and utilities added alongside the existing
> long-form params.

---

## Table of Contents

1. [Short-Form Global Param Aliases](#1-short-form-global-param-aliases)
2. [Per-Badge Short Provider Prefixes](#2-per-badge-short-provider-prefixes)
3. [New Params](#3-new-params)
4. [Value Display Normalization](#4-value-display-normalization)
5. [Display Presets](#5-display-presets)
6. [New Routes (Stubs)](#6-new-routes-stubs)
7. [Builder Utility](#7-builder-utility)
8. [URL Size Savings Example](#8-url-size-savings-example)
9. [v2 → v3 Migration Checklist](#9-v2--v3-migration-checklist)

---

## 1. Short-Form Global Param Aliases

Both the long-form **and** short-form keys are accepted. The backend resolves
short forms before processing, so you can use either interchangeably.

| Long form     | Short alias | Description                                     |
| ------------- | ----------- | ----------------------------------------------- |
| `blur`        | `bl`        | Badge glass blur (px)                           |
| `alpha`       | `al`        | Badge background opacity (0–1)                  |
| `rad`         | `ra`        | Badge corner radius (px)                        |
| `sh`          | `sh`        | Global drop shadow _(already short)_            |
| `g_scale`     | `sc`        | Global badge scale multiplier                   |
| `g_bc`        | `bc`        | Global badge border color                       |
| `g_bg`        | `bg`        | Global badge background color                   |
| `g_txt`       | `tx`        | Global badge text color                         |
| `g_icon`      | `ic`        | Global icon visibility (`1`/`0`)                |
| `bg_blur`     | `pb`        | Poster/background blur (px)                     |
| `textless`    | `tl`        | Textless poster (`1`/`0`)                       |
| `source`      | `so`        | Poster source (`tmdb`/`fanart`/`imdb`)          |
| `ptype`       | `pt`        | Poster selection mode                           |
| `normalize`   | `nm`        | Normalize scores to /10                         |
| `out_of`      | `of`        | Append denominator after value                  |
| `icon_type`   | `it`        | Icon variant index                              |
| `label_pos`   | `lp`        | Label position (`above`/`below`/`left`/`right`) |
| `label_text`  | `lt`        | Custom label string override                    |
| `label_size`  | `ls`        | Label font size (6–32, default 11)              |
| `label_color` | `lc`        | Label color override                            |
| `preset`      | `p`         | Display preset (`b`=badge, `m`=minimal)         |

---

## 2. Per-Badge Short Provider Prefixes

Instead of `imdb_x=10`, use `i_x=10`. The suffix map below applies to **both**
long and short provider prefixes.

### Provider prefix map

| Provider    | Long prefix   | Short prefix |
| ----------- | ------------- | ------------ |
| IMDb        | `imdb_`       | `i_`         |
| Rotten Tom. | `rt_`         | `r_`         |
| Audience    | `rt_popcorn_` | `p_`         |
| Letterboxd  | `letterboxd_` | `l_`         |
| Metacritic  | `meta_`       | `m_`         |
| TMDB        | `tmdb_`       | `t_`         |
| MyAnimeList | `mal_`        | `M_`         |
| AniList     | `anilist_`    | `A_`         |
| Age Rating  | `age_`        | `a_`         |
| Runtime     | `runtime_`    | `n_`         |

### Per-badge suffix map

| Long suffix | Short suffix | Description                    |
| ----------- | ------------ | ------------------------------ |
| `_blur`     | `_bl`        | Glass blur                     |
| `_alpha`    | `_al`        | Background opacity             |
| `_rad`      | `_ra`        | Corner radius                  |
| `_sh`       | `_sh`        | Drop shadow _(already short)_  |
| `_icon`     | `_ic`        | Icon visibility                |
| `_scale`    | `_sc`        | Badge scale                    |
| `_bw`       | `_bw`        | Border width _(already short)_ |
| `_bc`       | `_bc`        | Border color _(already short)_ |
| `_bg`       | `_bg`        | Background color               |
| `_txt`      | `_tx`        | Text color                     |
| `_x`        | `_x`         | X position _(already short)_   |
| `_y`        | `_y`         | Y position _(already short)_   |

All four combinations are accepted:

```
imdb_blur=8     ← long prefix + long suffix
imdb_bl=8       ← long prefix + short suffix
i_blur=8        ← short prefix + long suffix
i_bl=8          ← short prefix + short suffix  ← most compact
```

---

## 3. New Params

### `normalize` / `nm`

Normalize provider scores to a `/10` scale. Ignored for `age` and `runtime`
badges (those values are already categorical or time-based).

```
?nm=1           normalize all badges to /10
?i_nm=0         disable normalization for IMDb only
```

### `out_of` / `of`

Append a denominator string after the badge value. When `nm=1` is set and
`of` is not explicitly provided, the denominator defaults to `10`.

```
?of=10          → "8.4 /10"
?nm=1           → "8.4 /10"  (of=10 is implicit)
?nm=1&of=100    → "84 /100"
```

### `icon_type` / `it`

Select an alternate icon variant for a badge. The backend falls back to
variant `1` when the requested variant does not exist for a particular source.

```
?it=2           use icon variant 2 for all badges
?i_it=3         use variant 3 for IMDb only
```

### `label_pos` / `lp`

Position the badge label (source name / title) relative to the score value.

| Value   | Description              |
| ------- | ------------------------ |
| `above` | Label above the value    |
| `below` | Label below the value    |
| `left`  | Label left of the value  |
| `right` | Label right of the value |

```
?lp=below       label beneath the score for all badges
?i_lp=right     IMDb label to the right of its score
```

### `label_text` / `lt`

Override the badge label with a custom string.

```
?lt=Rating      all badges show "Rating" as label
?i_lt=IMDb      IMDb badge shows "IMDb"
```

### `label_size` / `ls`

Font size for the badge label. Range: `6`–`32`; default: `11`.

```
?ls=14          global label font size 14
?r_ls=10        Rotten Tomatoes label size 10
```

### `label_color` / `lc`

Color override for the badge label text.

```
?lc=%23ffcc00   golden label text (# encoded as %23)
?i_lc=%23ffffff IMDb label in white
```

---

## 4. Value Display Normalization

Badge values are cleaned to canonical precision before display:

| Raw value | Displayed |
| --------- | --------- |
| `85.0%`   | `85%`     |
| `7.50`    | `7.5`     |
| `3.80`    | `3.8`     |
| `72.0`    | `72`      |

This applies globally wherever badge values are rendered (canvas preview and
generated SVG/PNG output). Use the `cleanValue` helper for any custom display:

```ts
import { cleanValue } from "../utils/v3Builder";
console.log(cleanValue("85.0%")); // → '85%'
console.log(cleanValue("7.50")); // → '7.5'
```

---

## 5. Display Presets

Use `preset` / `p` to apply a named style preset. Explicit params always
override preset defaults.

| Value | Alias       | Description                                                              |
| ----- | ----------- | ------------------------------------------------------------------------ |
| `b`   | _(default)_ | **Badge** — full glassmorphism badge with icon, value, and label         |
| `m`   |             | **Minimal** — compact display (placeholder; full implementation pending) |

```
?p=b    badge preset (default, same as omitting the param)
?p=m    minimal preset
```

---

## 6. New Routes (Stubs)

Two new endpoints are defined but respond with **HTTP 501** until implemented.
They are documented in [`handlers/backdrop.ts`](../handlers/backdrop.ts).

| Route                     | Description                   |
| ------------------------- | ----------------------------- |
| `GET /:type/:id/backdrop` | Fetch backdrop / fanart image |
| `GET /:type/:id/banner`   | Alias of `/backdrop`          |

**Accepted query params:**

| Param      | Description                            | Default |
| ---------- | -------------------------------------- | ------- |
| `source`   | Image source: `tmdb`, `fanart`, `imdb` | `tmdb`  |
| `width`    | Output width in pixels                 | `1280`  |
| `textless` | Strip title text (`1`/`0`)             | `0`     |
| `lang`     | ISO 639-1 language code                | `en`    |
| `no_embed` | Return raw image, not embedded frame   | `0`     |

**Example:**

```
GET /movie/155/backdrop.webp?source=tmdb&width=1920&textless=1
→ 501 Not Implemented (until feature is shipped)
```

---

## 7. Builder Utility

`src/utils/v3Builder.ts` provides a `buildOptimalUrl` function that:

- Uses **short-form param aliases** for all global params.
- Uses **short provider prefixes** for all per-badge params.
- **Hoists** common per-badge values to a single global param (e.g. if every
  badge has `blur=8`, it emits `bl=8` once rather than `imdb_blur=8&rt_blur=8`).

```ts
import { buildOptimalUrl, cleanValue } from "./src/utils/v3Builder";

const url = buildOptimalUrl({
  mediaType: "movie",
  tmdbId: "453395",
  imdbId: "tt12042730",
  ratings: ["imdb", "rt", "age"],
  source: "tmdb",
  blur: 8,
  alpha: 0.4,
  radius: 12,
  shadow: 6,
  // … other fields
});
// → https://api.posterium.xyz/poster/tt12042730.png?r=i,r,a&v=3&bl=8&al=0.4&ra=12&sh=6…
```

---

## 8. URL Size Savings Example

```
# v3 long-form (existing, still works)
?r=imdb,rt,meta&blur=8&alpha=0.4&rad=12&sh=6&g_scale=1.000&g_icon=1
&imdb_x=340&imdb_y=20&rt_x=340&rt_y=90&meta_x=340&meta_y=160

# v3 short-form (new aliases, same result)
?r=i,r,m&bl=8&al=0.4&ra=12&sh=6&sc=1.000&ic=1
&i_x=340&i_y=20&r_x=340&r_y=90&m_x=340&m_y=160

Savings: ~30% shorter query string
```

---

## 9. v2 → v3 Migration Checklist

- [ ] Add `&v=3` to all API URLs (or update existing `v=2` to `v=3`).
- [ ] Replace `r=imdb,rt,meta,tmdb` with short forms: `r=i,r,m,t`.
- [ ] Optionally replace long global params with short aliases (e.g. `blur=8` → `bl=8`).
- [ ] Optionally replace long per-badge prefixes with short ones (e.g. `imdb_x` → `i_x`).
- [ ] Use `nm=1` if you want scores normalized to /10.
- [ ] Use `of=10` (or rely on the `nm` default) to show `/10` denominators.
- [ ] Check that badge values display correctly — trailing zeros are now stripped.
- [ ] Existing v3 URLs **do not need to change** — long-form params remain fully supported.
