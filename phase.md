# Phase 1 Implementation: Types, Constants & Utility Extraction

Starting with the lowest-risk, highest-leverage phase. Full directory map first, then deletion candidates, then actual extraction work with before/after snippets.

---

## 1. Detailed Target Directory Map

```
src/
├─ types/
│  ├─ poster.types.ts          # PosterConfig, BadgeConfig, RatingType, MediaType,
│  │                             ExtensionType, LogoSourceType, MinimalRatingConfig,
│  │                             ApiKeys, MinimalRatingIconMode, ThemeType, SizeType,
│  │                             LayoutType, PresetType, SourceType
│  ├─ seo.types.ts             # PageSEOMetadata, SchemaObject, BreadcrumbItem, FAQEntry,
│  │                             WebApplicationSchemaMeta, HowToSchemaMeta,
│  │                             CollectionBreadcrumbMeta, ArticleContentEntry
│  ├─ analytics.types.ts       # NodeHealthRow, LatencyRow, FallbackTierRow, WallStats,
│  │                             FormatRow, ColoRow, DbStats, BenchmarkResult types
│  │                             (currently inline-only in AnalyticsDashboard/TestBenchmark)
│  ├─ content.types.ts         # ExamplePreset, FaqSearchItem, DocsSidebarLink,
│  │                             ShowcaseImages, InstallationDevice, RelatedContentLink,
│  │                             MarkdownHeading
│  ├─ navigation.types.ts      # NavbarLink, PanelTab<T>, BuilderPanelId, InspectorTab,
│  │                             BuilderMode, ViewOptions, LiveRatings, LayerTargetId,
│  │                             ContextMenuState
│  └─ index.ts
│
├─ constants/
│  ├─ site.ts                  # was src/lib/config.ts
│  ├─ api.ts                   # single API_BASE_URL constant
│  ├─ infrastructure.ts        # reconciled RASTERIZER_NODES (flagged, see below)
│  ├─ theme.ts                 # JS mirror of --film-* tokens
│  ├─ badges.ts                # BADGE_ICONS, PROVIDER_DISPLAY_NAMES, ALL_BADGES
│  ├─ keyboard-shortcuts.ts
│  ├─ copy/
│  │  ├─ dashboard.copy.ts
│  │  ├─ builder.copy.ts
│  │  ├─ admin.copy.ts
│  │  └─ common.copy.ts
│  └─ index.ts
│
├─ hooks/
│  ├─ useLocalStorageState.ts
│  ├─ useMediaQuery.ts
│  ├─ useClipboard.ts
│  ├─ useDebouncedValue.ts
│  └─ index.ts
│
├─ seo/
│  ├─ lib/
│  │  ├─ schema-builders.ts      # buildOrganizationSchema, buildWebsiteSchema, etc.
│  │  ├─ text-processing.ts      # stripMarkdown, decodeHtmlEntities, htmlToPlainText,
│  │  │                            contentToPlainText, toFAQEntries
│  │  └─ index.ts
│  ├─ components/PageSEO.astro
│  ├─ internal-links.ts
│  ├─ features.ts
│  └─ index.ts
│
├─ markdown-negotiation/
│  └─ htmlToMarkdown.ts
│
(shared/, modules/ — built in Phases 2–4, untouched this phase)
```

**Phase 1 touches only:** `types/`, `constants/`, `hooks/`, `seo/`, `markdown-negotiation/`, and the import statements in files that consume relocated symbols. No component is split, no visual file changes yet.

---

## 2. Files Safe to Delete (only after their replacement lands and is confirmed)

| File                                                       | Deleted because                                                                                                                                               | Replacement                                                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/config.ts`                                        | content moves verbatim                                                                                                                                        | `src/constants/site.ts`                                                                                                                   |
| `src/lib/seo.ts`                                           | split into schema builders + text processing + types                                                                                                          | `src/seo/lib/*`, `src/types/seo.types.ts`                                                                                                 |
| `src/lib/seo-features.ts`                                  | relocated as-is                                                                                                                                               | `src/seo/features.ts`                                                                                                                     |
| `src/lib/internal-links.ts`                                | relocated as-is                                                                                                                                               | `src/seo/internal-links.ts`                                                                                                               |
| `src/utils/v3Builder.ts`                                   | **pending audit finding 2.2** — confirm zero importers first, then delete. If any importer is found, do NOT delete; flag to human instead per the audit rule. | `generateApiUrl` in builder utils (unchanged this phase)                                                                                  |
| `src/lib/dashboard/featureDemos.ts`                        | **pending audit** — confirm `CombinedSection.tsx` truly doesn't import it anywhere (including dynamic/string references) before deleting                      | none — `CombinedSection.tsx`'s local tuples become canonical, OR gets rewired to import this file (human decision per audit dossier §2.2) |
| `src/components/builder/components/panels/PresetPanel.tsx` | **pending audit** — confirm unreachable in `AdvancedPanelNav` routing before deleting                                                                         | none yet — flag to human first                                                                                                            |
| `src/components/builder/AdvancedBuilderApp.tsx`            | **pending audit** — confirm no page renders it                                                                                                                | none                                                                                                                                      |

Do **not** delete `src/components/builder/types.ts` yet — in this phase it becomes a thin re-export shim pointing at `types/poster.types.ts` so every existing `from '../types'` import keeps working while Phase 4 gradually updates each import site to point at the new canonical path directly. It gets deleted for real only once zero files import from the old path — that's a Phase 4/6 cleanup, not now.

---

## 3. Extraction Work

### 3.1 `types/poster.types.ts` — new file

The entire type surface currently living in `src/components/builder/types.ts` (from `MediaType` through `ApiKeys`, and including `DEFAULT_CONFIG`, `CANVAS_WIDTH`/`HEIGHT`/etc., and `ALL_BADGES`) moves here **verbatim, byte-for-byte**. No renaming of fields, no reordering, no "cleanup." This is a pure relocation.

**Before** — `src/components/builder/types.ts` (461 lines, mixes types + defaults + constants + catalogue):

```ts
export type MediaType = 'movie' | 'tv' | 'anime';
export type RatingType = 'imdb' | 'rt' | /* ... */;
// ...interfaces...
export const DEFAULT_CONFIG: PosterConfig = { /* ... */ };
export const CANVAS_WIDTH = 500;
export const ALL_BADGES: { id: RatingType; label: string }[] = [ /* ... */ ];
```

**After** — split into two files, `types/poster.types.ts` (pure types) and `constants/badges.ts` (the `ALL_BADGES` catalogue + `DEFAULT_CONFIG`, since `DEFAULT_CONFIG` is data, not a type):

```ts
// src/types/poster.types.ts
export type MediaType = 'movie' | 'tv' | 'anime';
export type RatingType = 'imdb' | 'rt' | /* ...unchanged... */;
export interface PosterConfig { /* ...unchanged... */ }
export interface BadgeConfig { /* ...unchanged... */ }
export interface MinimalRatingConfig { /* ...unchanged... */ }
export interface ApiKeys { /* ...unchanged... */ }
```

```ts
// src/constants/badges.ts
import type { PosterConfig, RatingType } from "@/types";

export const DEFAULT_CONFIG: PosterConfig = {
  /* ...unchanged, copied verbatim... */
};

export const ALL_BADGES: { id: RatingType; label: string }[] = [
  /* ...unchanged... */
];

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 750;
export const BASE_BADGE_W = 140;
export const BASE_BADGE_H = 60;
export const GAP = 10;
export const PADDING = 20;
```

**Compatibility shim** — `src/components/builder/types.ts` becomes:

```ts
// src/components/builder/types.ts
// TEMPORARY — Phase 1 shim. Remove once every consumer imports from @/types and
// @/constants directly (tracked in REFACTOR_AUDIT.md). Do not add new exports here.
export type {
  MediaType,
  RatingType,
  ThemeType,
  SizeType,
  LayoutType,
  PresetType,
  SourceType,
  ExtensionType,
  LogoSourceType,
  MinimalRatingIconMode,
  MinimalRatingConfig,
  BadgeConfig,
  ApiKeys,
  PosterConfig,
} from "@/types/poster.types";
export {
  DEFAULT_CONFIG,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASE_BADGE_W,
  BASE_BADGE_H,
  GAP,
  PADDING,
  ALL_BADGES,
} from "@/constants/badges";
```

This shim is what makes Phase 1 zero-risk for the 15+ files that currently do `import type { PosterConfig } from '../types'` or `from '../../types'` — none of them need to change yet. They get individually migrated to `@/types/poster.types` in Phase 4 when each builder file is touched anyway.

---

### 3.2 `constants/badges.ts` continued — consolidating `BADGE_ICONS`

Per audit finding 2.1, `src/components/builder/constants.ts`'s own header comment says it's a "verbatim copy of `src/builder/constants.ts`" — confirm that second path is dead (it's not in the provided file list, meaning it may already be gone, or may exist unseen). Search the full repo for `from '../../builder/constants'` or `from '@/builder/constants'` outside the `components/builder/` tree before assuming there's truly only one copy today.

```ts
// src/constants/badges.ts (continued)
export { BADGE_ICONS } from "@/components/builder/constants";
// ^ TEMPORARY re-export — the SVG icon map itself (large, ~150 lines of markup)
// physically relocates here in Phase 2 when shared/ui absorbs it. For Phase 1
// we only redirect the *import path* other modules should start using, without
// moving the actual SVG string data yet, to keep this phase's diff small.
```

Also add, per audit 2.2, the single canonical provider display-name map (currently duplicated as `PROVIDER_DISPLAY_NAMES` in `DraggableBadge.tsx` and `BADGE_DISPLAY_NAMES` in `PropertyPanel.tsx` — verify the two maps are identical key-for-key before merging; if any key differs between them, flag to human, don't silently pick one):

```ts
// src/constants/badges.ts (continued)
import type { RatingType } from "@/types";

export const PROVIDER_DISPLAY_NAMES: Partial<Record<RatingType, string>> = {
  imdb: "IMDb",
  rt: "Rotten Tomatoes",
  rt_popcorn: "Audience Score",
  tmdb: "TMDB",
  letterboxd: "Letterboxd",
  meta: "Metacritic",
  mal: "MyAnimeList",
  anilist: "AniList",
  age: "Age Rating",
  runtime: "Runtime",
  year: "Year",
  title: "Title",
};
```

_(Do not wire this into `DraggableBadge.tsx`/`PropertyPanel.tsx` yet — that import-site change happens in Phase 4C/4D when those files are already being touched. This phase only creates the canonical source.)_

---

### 3.3 `constants/api.ts` — new file, fixes a real bug

This directly resolves the stale-domain PWA cache bug from audit 2.1.

```ts
// src/constants/api.ts
export const API_BASE_URL = "https://api.posterium.xyz";
```

**Before** — scattered across the codebase:

- `src/lib/dashboard/constants.ts`: `export const API = 'https://api.posterium.xyz';`
- `src/components/builder/utils.ts`: `export const DEFAULT_API_BASE = envApiUrl || 'https://api.posterium.xyz';`
- `src/lib/config.ts`: `apiBase: 'https://api.posterium.xyz'`
- `astro.config.mjs`: `urlPattern: /^https:\/\/api\.spicydevs\.xyz\/.*/i` ← **wrong domain, confirmed bug**

**After** (this phase only fixes the config bug and adds the canonical constant — it does _not_ yet rewire `lib/dashboard/constants.ts` or `builder/utils.ts` to import it, since those are inside modules touched in Phase 4/5; changing them now would touch files outside this phase's blast radius):

```diff
--- a/astro.config.mjs
+++ b/astro.config.mjs
           {
-            urlPattern: /^https:\/\/api\.spicydevs\.xyz\/.*/i,
+            urlPattern: /^https:\/\/api\.posterium\.xyz\/.*/i,
             handler: 'NetworkFirst',
             options: {
               cacheName: 'posterium-api-cache',
```

Flag in `REFACTOR_AUDIT.md`: _"This PWA cache rule was matching zero real requests before this fix — confirm with the human whether NetworkFirst caching of the poster API was actually intended to be live, since enabling it now is a behavior change, not a pure refactor."_

---

### 3.4 `hooks/useLocalStorageState.ts` — new file

Consolidates the six-plus hand-rolled try/catch localStorage patterns (audit finding, hooks section).

```ts
// src/hooks/useLocalStorageState.ts
import { useCallback, useState } from "react";

export function readStorageValue<T>(
  key: string,
  fallback: T,
  storage: Storage = localStorage,
): T {
  try {
    const raw = storage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorageValue<T>(
  key: string,
  value: T,
  storage: Storage = localStorage,
): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota/serialization errors, matches existing behavior everywhere */
  }
}

export function useLocalStorageState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorageValue(key, fallback));
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeStorageValue(key, resolved);
        return resolved;
      });
    },
    [key],
  );
  return [value, update] as const;
}
```

**Not wired in yet.** This phase only creates the hook. The six call sites (`sectionStorage.ts`, `builderStorage.ts`'s cookie logic is a _different_ pattern and stays separate, `LayerPanel`'s `writeBadgesPreference`/`writeTextlessPreference`, `AnalyticsDashboard`'s `loadCfg`/`saveCfg`, `CommandPalette`'s recent-commands) get migrated to it individually in Phase 2–4 when each of those files is opened anyway — migrating them now would mean touching component logic outside Phase 1's declared scope.

---

### 3.5 `seo/lib/text-processing.ts` — extraction with type relocation

This is a real split, not just a move, because `lib/seo.ts` currently mixes pure string-processing functions with schema-object builders. They get separated by responsibility.

**Before** — `src/lib/seo.ts` (single 380-line file mixing concerns).

**After** — three files:

```ts
// src/seo/lib/text-processing.ts
// Pure string transforms: contentToPlainText, stripMarkdown, decodeHtmlEntities,
// htmlToPlainText, toFAQEntries — moved verbatim, zero logic changes.
export {
  absoluteUrl,
  stripMarkdown,
  decodeHtmlEntities,
  htmlToPlainText,
  contentToPlainText,
  toFAQEntries,
} from "./_impl";
```

```ts
// src/seo/lib/schema-builders.ts
// buildOrganizationSchema, buildSiteNavigationSchema, buildWebsiteSchema,
// buildWebPageSchema, buildBreadcrumbSchema, buildCollectionBreadcrumbs,
// buildWebApplicationSchema, buildHowToSchema, extractVideoObjectSchemas,
// buildFAQPageSchema, buildArticleOrTechArticleSchema, buildCoreSchemas,
// buildSchemaGraph — moved verbatim, zero logic changes.
```

```ts
// src/types/seo.types.ts
export type SchemaObject = Record<string, unknown>;
export interface BreadcrumbItem {
  name: string;
  url: string;
}
export interface FAQEntry {
  question: string;
  answer: string;
}
export interface PageSEOMetadata {
  /* ...unchanged... */
}
export interface WebApplicationSchemaMeta {
  /* ...unchanged... */
}
export interface HowToSchemaMeta {
  /* ...unchanged... */
}
export interface CollectionBreadcrumbMeta {
  /* ...unchanged... */
}
export interface ArticleContentEntry {
  /* ...unchanged... */
}
```

**Compatibility shim** — `src/lib/seo.ts` becomes a pure re-export barrel (same pattern as 3.1) so every one of the ~10 pages currently importing from `@/lib/seo` keeps working unchanged:

```ts
// src/lib/seo.ts — TEMPORARY shim, remove in Phase 6 cleanup
export * from "@/seo/lib/text-processing";
export * from "@/seo/lib/schema-builders";
export type * from "@/types/seo.types";
```

**Critical check before this lands:** `src/lib/seo.test.ts` imports directly from `./seo`. Per the Part 5 rule ("Test-Before/After Parity"), this test file's import path stays untouched in Phase 1 (it still says `from './seo'`, which now resolves through the shim) — do **not** update the test's imports to the new path in this phase. That update is deferred to Phase 6, done in the same commit as deleting the shim, so the test is never pointing at a half-migrated state.

---

### 3.6 `constants/site.ts` — pure relocation, smallest possible diff

```diff
--- a/src/lib/config.ts
+++ b/src/constants/site.ts
-// src/lib/config.ts
-// Shared site-wide constants and fallback SEO defaults only. Page-specific SEO
-// metadata lives with the pages/content that owns it.
+// src/constants/site.ts
+// Shared site-wide constants and fallback SEO defaults only. Page-specific SEO
+// metadata lives with the pages/content that owns it.

 export const SITE_CONFIG = { /* ...unchanged... */ } as const;
```

Shim at old path:

```ts
// src/lib/config.ts — TEMPORARY shim, remove in Phase 6
export {
  SITE_CONFIG,
  SEO_DEFAULTS,
  type OGMeta,
  type TwitterMeta,
} from "@/constants/site";
```

---

## 4. What This Phase Does _Not_ Touch

To be explicit, since literal-minded execution is the risk being managed here:

- No `.astro` page changes imports yet — they keep hitting `@/lib/config`, `@/lib/seo`, `../types`, etc. through shims.
- No component is split.
- No CSS changes except the one-line domain typo fix in `astro.config.mjs`.
- No styling/markup/animation code moves.
- `analytics.types.ts`, `content.types.ts`, `navigation.types.ts` are created as **empty-shell files with just the type declarations copied out of their current inline locations** — the components that currently declare those interfaces locally are _not_ edited to import from the new location yet. That import-site rewiring happens per-module in Phase 2–4. Creating the type file now without rewiring consumers means zero risk of breaking a component mid-edit while still making the types available for Phase 2 onward to consume.

---

## 5. Checkpoint

Once the above lands:

1. Run `tsc --noEmit` — must pass with zero new errors (shims guarantee this).
2. Run `vitest run` — `seo.test.ts` must pass unchanged.
3. Visual diff of homepage, builder, both admin dashboards, FAQ/docs/installation/examples/privacy/terms — must be pixel-identical, since literally no rendering code changed.
4. Confirm the `api.posterium.xyz` PWA cache fix doesn't need a version bump or cache-name change to take effect for already-installed PWA users (flag this operational question to the human — it's outside refactor scope but is a direct consequence of the fix).

**Ready to proceed to Phase 2 (shared/ui micro-component extraction) once you confirm the above.**
