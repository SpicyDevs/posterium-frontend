
---

# DOCUMENT 4 — Instance 2: Phase-by-Phase Instructions

---

## Phase 1 — Mode System & EditorContext Extension

### Goal
The highest-priority phase. Instance 1 begins using `builderMode` and `advancedPanel` from their Phase 2. This must be delivered as soon as possible.

### Files to Create/Modify

**`src/components/builder/context/EditorContext.tsx`**

Add to the context interface and provider:

```
type AdvancedPanelId =
  | 'source' | 'poster' | 'badges' | 'logo'
  | 'layout' | 'selected' | 'fallbacks' | 'advanced' | 'presets'
```

Add state:
- `builderMode` — initialize from `localStorage.getItem('posterium_mode_v1')` with fallback to `'simple'`. Validate: only `'simple'` or `'advanced'` are accepted; anything else falls back to `'simple'`.
- `setBuilderMode(mode)` — `useCallback` that sets state and writes to localStorage. No other side effects.
- `advancedPanel` — initialize from `localStorage.getItem('posterium_advanced_panel_v1')` with fallback to `'source'`. Validate against the AdvancedPanelId union; fall back to `'source'` if invalid.
- `setAdvancedPanel(panel)` — `useCallback` that sets state and writes to localStorage.

Export `AdvancedPanelId` as a named type export from this file.

No other changes to EditorContext. Do not move, rename, or modify any existing context values or functions.

**`src/components/builder/components/ModeToggle.tsx` (NEW)**

A compact segmented control component with no required props. Reads `builderMode` and `setBuilderMode` from `useEditor()`. Renders two buttons: "Simple" and "Advanced".

Visual: the active button has amber fill (`rgba(196,124,46,0.15)`) with amber border and amber text. Inactive has neutral dim background. The overall control is `140px` wide, `32px` tall, with `4px` border-radius on the container and `3px` on each button.

On first switch to advanced: show a brief tooltip that appears for 3 seconds: "Advanced mode unlocks all V3 controls." Use a local ref to track if the tooltip has been shown this session (no localStorage persistence for the tooltip). The tooltip appears below the toggle, centered, with arrow pointing up.

Accessibility: `role="group"`, `aria-label="Builder mode"`. Each button has `aria-pressed`.

Animation: the transition between modes has a crossfade on the button backgrounds using `var(--transition-fast)`.

**`src/components/builder/components/CommandPalette.tsx`**

Instance 1 owns this file, but you add commands for mode-switching. Coordinate: ask Instance 1 to add an empty array `[]` of additional commands that you can append to their `paletteCommands` array. Alternatively, since `paletteCommands` is built inside the component, request that Instance 1 accepts a `additionalCommands?: PaletteCommand[]` prop and you pass your mode-switch commands from `builder/index.tsx`. This is a one-line prop addition for them.

If coordination is complex, defer this to Phase 3 and add the commands directly when both instances finalize their work.

### Acceptance Criteria
- `EditorContext.tsx` exports `AdvancedPanelId` type and all four new context values
- `ModeToggle.tsx` renders, persists state, and TypeScript is satisfied
- Instance 1's references to `builderMode`, `setBuilderMode`, `advancedPanel`, `setAdvancedPanel` from `useEditor()` all typecheck correctly
- localStorage persistence works correctly on page refresh

---

## Phase 2 — Right Sidebar: Simple Mode

### Goal
Create the three-tab inspector for simple mode: Badges, Logo, Presets.

### Files to Create/Modify

**`src/components/builder/components/layout/InspectorSimple.tsx` (NEW)**

Three-tab layout. Props: `{ config, setConfig }`. Reads `selectedIds`, `selectedLogo` from `useEditor()`.

Tab bar at top: three equal-width buttons. "Badges" | "Logo" | "Presets". Same styling as current Inspector tab bar.

Tab content area below: renders one of the three panels based on active tab. Active tab stored in `useState`, not persisted.

"Advanced settings active" detection: if `builderMode === 'simple'` AND `Object.keys(config.items).some(k => { const item = config.items[k]; return Object.keys(item).some(key => key !== 'x' && key !== 'y'); })`, show an info bar at the very top of the component (above the tab bar): amber icon + text "Advanced badge settings are active" + a "Switch to Advanced →" button that calls `setBuilderMode('advanced')`.

**`src/components/builder/panels/BadgesPanelSimple.tsx` (NEW)**

Props: `{ config, setConfig }`. No per-badge selection display.

Single scrollable section (no collapsible subsections — flat layout is correct for simple mode):
- Scale slider: 0.5–2.0, step 0.05. Formatted as `1.00×`. Maps to `config.scale`.
- Glass Blur slider: 0–20, step 1, unit "px". Maps to `config.blur`.
- Corner Radius slider: 0–30, step 1, unit "px". Maps to `config.radius`.
- Drop Shadow slider: 0–30, step 1. Maps to `config.shadow`.
- Divider
- Background label with ColorPicker. With opacity sub-slider (alpha, 0–1). Maps to `config.bg` + `config.alpha`.
- Text & Icon Color label with ColorPicker. Maps to `config.txt`.
- Divider
- Show Icons toggle. Maps to `config.icon ?? true`.
- Show Rating Text toggle. Maps to `config.showText !== false`.
- Icon Style segmented: Default (1) | Alt (2) | Mono (3). Maps to `config.iconType ?? 1`.

At the very bottom of the panel, below all controls and a thin divider: a small text row — "For per-badge control, use" + amber link "Advanced Mode" that calls `setBuilderMode('advanced')`. Font size 11px, dim color.

**`src/components/builder/panels/LogoPanelSimple.tsx` (NEW)**

Props: `{ config, setConfig }`.

**If `config.logo === false`:** Show an empty state centered in the panel. A large `ImagePlay` icon (dim, 48px), heading "No Logo Overlay", description "Add a title logo above your poster art.", and a large prominent "Enable Logo" toggle/button that sets `config.logo = true` and switches the active tab stays on Logo. Below the enable button: small "More logo controls → Advanced Mode" link.

**If `config.logo === true`:** Show:
- A "Logo Enabled" status row at top with a toggle to disable
- Divider
- Size slider: 100–490px, maps to `config.logoW`. When changed, calculate `config.logoH = Math.round(v / (logoBaseW / logoBaseH))` using the 380/100 base aspect ratio.
- Opacity slider: 0–1, step 0.05, formatted as percentage. Maps to `config.logoOpacity`.
- Drop Shadow slider: 0–30. Maps to `config.logoShadow`.
- At bottom: "More logo controls → Advanced Mode" link.

**`src/components/builder/panels/PresetsTab.tsx` (NEW)**

Props: `{ config, setConfig, onLoadConfig }`. The `onLoadConfig` prop receives the function from the builder that parses a URL into config — pass it down from `InspectorSimple` which gets it via props.

Three preset definitions (hardcoded objects, not loaded from external source):

```
Preset 1 — Classic Glass
  name: "Classic Glass"
  description: "IMDb + RT stacked top-right. Frosted glass style."
  params: "v=3&r=i,r,a&source=tmdb&bl=8&al=0.4&ra=12&sh=6&pos=tr&l=col"

Preset 2 — Cinematic Strip
  name: "Cinematic Strip"
  description: "Rating row at the bottom. Soft, transparent look."
  params: "v=3&r=i,r,m&source=tmdb&bl=12&al=0.3&ra=10&sh=4&pos=bc&l=row"

Preset 3 — Minimal Float
  name: "Minimal Float"
  description: "Icon-only badges, no background, bottom-left."
  params: "v=3&r=i,r&source=tmdb&ic=1&nt=1&al=0&bl=0&ra=0&sh=0&pos=bl&l=col"
```

Thumbnail URL logic:
- If `config.imdbId` is not the default (`'tt9419884'`) OR `config.tmdbId` is set and not empty: use the current media ID to build the thumbnail URL with each preset's params
- Otherwise (no media set): use `https://api.spicydevs.xyz/movie/155.webp` (The Dark Knight) as the hardcoded thumbnail
- Build URL: `https://api.spicydevs.xyz/{type}/{id}.webp?{presetParams}` where type is movie, id is the resolved ID

Layout: in a panel width below 280px: single column. At 280px+: two-column grid (first two presets side by side, third full-width below). At 380px+: three-column grid.

Each card:
- `ProgressiveImage` with 2:3 aspect ratio, `loading="lazy"`. Fallback: a shimmer div with same dimensions (use inline shimmer style until Instance 1's `Skeleton` component is available in Phase 7).
- Preset name below in Syne font, 12px, bold
- Description in 10px dim text
- "Apply" button: full-width amber button, 36px height. On click: call `handleApplyPreset(preset)`.

`handleApplyPreset`: parse the preset params as a partial config override. Construct a URL using the current media ID + preset params + v=3. Call `onLoadConfig(url)`. This merges the preset style onto the current media without changing what's loaded.

Active preset detection: compare current `config.blur`, `config.alpha`, `config.radius`, `config.shadow`, `config.preset`, `config.layout` to preset values. If all match, highlight that card with amber border.

Footer: "Build your own preset → " + amber link "Advanced Mode".

**`src/components/builder/components/layout/Inspector.tsx`**

Modify to route between simple and advanced mode:
- When `builderMode === 'simple'`: render `<InspectorSimple config={config} setConfig={setConfig} onLoadConfig={onLoadConfig} />`
- When `builderMode === 'advanced'`: render `<AdvancedPanelArea />` (Instance 1's component, imported from `@/components/builder/components/AdvancedPanelArea`)

The `Inspector.tsx` component no longer renders its own tab bar when in advanced mode. The `SidebarLayout` wrapper remains for structural consistency.

Pass `onLoadConfig` prop down from the builder index through Inspector. Instance 1 will add this prop to the Inspector call site.

---

## Phase 3 — Right Sidebar: Advanced Mode Panels

### Goal
Create the badge, logo, selection, and advanced-params panels for advanced mode.

### Files to Create

**`src/components/builder/panels/BadgesPanelAdvanced.tsx` (NEW)**

Extends `BadgesPanelSimple` with all additional global controls:

Keep all Simple controls. Add below them in collapsible sections:

Section "Shadow Detail" (collapsed by default):
- Shadow X offset: -20 to 20, step 1, unit "px". Maps to `config.shadowX ?? 0`.
- Shadow Y offset: -20 to 20, step 1. Maps to `config.shadowY ?? 2`.
- Shadow Color: ColorPicker. Maps to `config.shadowColor ?? '#000000'`.
- Shadow Opacity: 0–1, step 0.01, formatted as percentage. Maps to `config.shadowOpacity ?? 0.35`.

Section "Border" (collapsed by default):
- Border Width: 0–10, unit "px". Maps to `config.borderW ?? 0`.
- Border Color: ColorPicker. Shown only when `borderW > 0`. Maps to `config.borderC`.

Section "Score Display":
- Normalize Scores toggle: maps to `config.normalize ?? false`. Description: "Convert all scores to a 0–10 scale."
- Show Denominator toggle: maps to `(config.outOf ?? 0) > 0`. If enabled, shows denominator value as "/ 10" (fixed, no slider needed for the global value).

Section "Labels" (collapsed by default):
- Same label controls as in the current `PropertyPanel.tsx` global view: position, text, size, color.

Section "Icon & Text" (collapsed by default, advanced only):
- Icon Position segmented: Left | Right. Maps to a new `iconPosition?: 'left' | 'right'` on PosterConfig. Serializes to `ip=l` or `ip=r`. Add to types.ts.
- Label Inside toggle: Maps to `labelInside?: boolean`. Serializes to `li=1`. Add to types.ts.

Remove the "switch to Advanced" footer text (already in Advanced).

**`src/components/builder/panels/LogoPanelAdvanced.tsx` (NEW)**

Extends `LogoPanelSimple` with all additional controls:

Keep the enable/disable state logic. When enabled, show ALL logo controls:

Simple controls (Size, Opacity, Drop Shadow) + the following:

Section "Source":
- Logo Source selector: Auto | Fanart | TMDB | Metahub. Maps to `config.logoSource`.

Section "Border":
- Border Width slider: 0–10. Maps to `config.logoBgBorderW`.
- Border Color: shown when borderW > 0. Maps to `config.logoBgBorderC`.
- Border Radius slider: 0–40. Maps to `config.logoBgRadius`.

Section "Background Panel":
- Background toggle. Maps to `config.logoBgEnabled`.
- When enabled: Background Color + opacity slider. Maps to `config.logoBgColor` + `config.logoBgOpacity`.
- Padding slider: 0–48. Maps to `config.logoBgPadding`.
- Background Shadow slider: 0–30. Maps to `config.logoBgShadow`.
- "Apply Badge Style to Logo Background" button — same as in existing PropertyPanel logo section.

No "switch to Advanced" footer text.

**`src/components/builder/panels/SelectedPanelAdvanced.tsx` (NEW)**

This is the per-badge override panel, equivalent to the current PropertyPanel selection view. Extract the selection view logic from `PropertyPanel.tsx` and put it in this standalone panel.

The component reads `selectedIds`, `selectedLogo`, `selectedMinimalElements` from `useEditor()` and `config`/`setConfig` from props.

If nothing is selected: show the same empty state currently in PropertyPanel (`<Layers>` icon + "Nothing selected" text).

If something is selected: render the full per-badge override UI. Reuse all existing helper functions (`getCommonValue`, `updateSelectedBadges`, `clearSelectedBadgeProp`) from `PropertyPanel.tsx` by extracting them into a shared utility file at `src/components/builder/utils/badgeOverrideHelpers.ts`. This avoids duplicating logic.

All sections from the current selection view: Transform, Container/Shape, Colors, Visibility, Score, Labels, Typography (for title/year), Text Shadow. All present and functionally identical.

The "Reset selected to defaults" button at the bottom: unchanged.

Multi-selection with mixed values: unchanged logic — `getCommonValue` returns null for mixed values, display "mixed" or a neutral visual.

**`src/components/builder/panels/AdvancedParamsPanel.tsx` (NEW)**

V3 params that aren't surfaced elsewhere:

- **Normalize (nm)**: toggle with info icon. Tooltip: "Converts all ratings to a 0–10 scale." Already in BadgesPanelAdvanced, so show it here as a read-only summary linking to that panel.
- **Decimal Places (dc)**: segmented control with four options: Auto (−1) | 0 | 1 | 2. Maps to a new `decimalPlaces?: number` on PosterConfig. Serializes to `dc=-1` etc. Add to types.ts. Default: −1 (auto).
- **Force Decimal (fd)**: toggle. "Always show decimal point even for whole numbers (e.g., 8 → 8.0)." Maps to `forceDecimal?: boolean`. Serializes to `fd=1`. Add to types.ts.
- **Uniform Badge Width (ub)**: toggle. Already handled by Instance 1's LayoutPanelAdvanced, link to it. Or show a second control here with a note.
- **No-Embed Mode (ne)**: toggle. Already in Instance 1's PosterPanelAdvanced. Show read-only summary.
- **MAL ID Override (mid)**: text input. "Override the MAL anime ID for this title." Maps to `malIdOverride?: string`. Serializes to `mid=xxx`. Add to types.ts. Shown only when `config.mediaType === 'anime'`.
- **Font Override (fn)**: dropdown selector. Options: Default, Syne, DM Sans, JetBrains Mono, Bebas Neue, Plus Jakarta Sans. Maps to `fontOverride?: string`. Serializes to `fn=syne` etc. Add to types.ts.

Each param has a small info icon (Lucide `Info`, 12px) that shows a tooltip explaining the V3 URL parameter name and its effect.

**`src/components/builder/panels/PresetsTabAdvanced.tsx` (NEW)**

Identical to `PresetsTab` but with:
- No "switch to Advanced" footer
- An additional section below the three presets: "Custom Presets" with a grey-bordered card containing: an icon, heading "Custom Preset Saving", and text "Save and name your current configuration. Coming soon." — disabled state, no button, no interaction.

---

## Phase 4 — Content String System & Dashboard Sections

### Goal
Create the content string infrastructure and polish all four dashboard content sections.

### Files to Create/Modify

**`src/content/strings/` (new directory)**

Create these JSON files with typed content. Every key maps to a single string (no nested objects for now — keep it flat per domain):

`common.json`: Copy, Copied, Download, Downloading, Error, Loading, Reset, Apply, Cancel, Save, Open, Close, Enable, Disable, ShowMore, ShowLess, OpenBuilder, NoData, TryAgain, Advanced, Simple, Builder

`nav.json`: all navigation link labels, hamburger aria-label, search placeholder, Build button label, Support button label

`hero.json`: headline, subheadline, stat labels and descriptions, primary CTA text, secondary CTA text

`builder.json`: all panel names, all control labels that appear in the builder UI (Scale, Blur, Radius, Shadow, etc.), all placeholder texts, all tooltip texts, mode names, preset names, preset descriptions

`cta.json`: CTA section headlines, body copy, button labels

`footer.json`: tagline, all link labels, copyright text, legal link labels

`faq.json`: category names, category icons (Unicode emoji), search placeholder, empty state message

`install.json`: page title, page subtitle, showcase tab labels (Desktop, TV, Mobile), progress tracker labels, checkbox aria labels

**`src/lib/useStrings.ts` (NEW)**

A simple typed hook. Takes a JSON module and returns it typed. For React: `function useStrings<T>(module: T): T { return module; }` — this is a pass-through that provides a consistent import pattern and future extensibility (e.g., i18n).

For Astro files, provide a `getStrings(module)` function that works identically at build time.

The value is in the consistent import pattern and TypeScript type safety — if a key is missing from the JSON, TypeScript errors at compile time because the JSON type is inferred.

**Dashboard Sections — Polish Pass:**

`StatsBar.tsx`: Apply `useAnimation` hook (from Instance 1) to the counter animation. The stat counter only increments when visible. Verify grid is 2-col at `<700px` and 1-col at `<420px`. Fix any overflow at 320px.

`CombinedSection.tsx`: At `<640px`: features list becomes full-width, stacked. The feature detail area stacks vertically below. At `<480px`: integration cards become single-column. Apply `usePausedWhenOffscreen` to any ambient animations in this section.

`ComparisonSection.tsx`: At `<768px`: the three-column comparison table transforms into single-column stacked cards. Each row becomes a card where Posterium's value is highlighted at top, "Others" value below it in dim text. This is a fundamentally different layout — use a CSS class `@media (max-width: 768px)` to switch between the grid and the card layout.

`CTASection.tsx`: Apply `usePausedWhenOffscreen` to the clapperboard stripe animation. At `<480px`: headline size uses a smaller clamp floor. Buttons stack vertically. Apply string system for all text content.

`FooterSection.tsx`: Major responsiveness improvements. Grid at full width: 3-column (wordmark + nav links + social). At `<1024px`: 2-column. At `<640px`: single column, centered. All footer links 44px touch target height on mobile. Apply string system for all text content.

---

## Phase 5 — FAQ Page Redesign

### Goal
Transform the FAQ from a documentation page into an interactive knowledge base.

### Files to Create/Modify

**`src/components/faq/CategoryCards.tsx` (NEW)**

A horizontal row of category cards. Props: `{ categories: Array<{ id: string; name: string; icon: string; count: number }> }`.

Each card: 160px wide on desktop, fluid on mobile. Content: emoji icon (32px), category name, "N questions" count. Border: 1px solid amber-dim. Background: `var(--film-char)`. On hover: slight Y lift (−4px, `var(--transition-spring)`), amber border brightens, amber glow shadow appears.

On click: smooth scroll to the corresponding section (use `document.getElementById(categoryId).scrollIntoView({ behavior: 'smooth' })`).

At `<768px`: cards scroll horizontally (no wrapping, `overflow-x: auto`, `scrollbar-width: none`). At 768px+: cards wrap or display in a 2-col grid. At 1024px+: single row, all cards side by side with a slight gap.

**`src/components/faq/FaqSearch.tsx`**

Existing improvements:
- After filtering, highlight matching text inside accordion answers. Send matched text to a custom event or context that accordion items can listen to. Alternatively, expose `searchQuery` as a global component-level state and pass it down via props/context to accordions.
- Use a `useHighlight(text, query)` utility that returns a string with `<mark>` elements inserted. Apply to accordion answer content. This requires that answers are rendered as React children (not static HTML) when search is active. For static Astro-rendered accordions, inject a MutationObserver approach: when a search query exists, find all `.prose` containers inside visible accordions and highlight text using `document.createTreeWalker`.
- Search debounce: verify it's 300ms. If not, adjust.

**`src/pages/faq.astro`**

Restructure:
- Remove the sidebar category links. Replace the sidebar area with the main content full-width.
- At the top of the content, above the search bar, insert `CategoryCards` (React island with `client:idle`).
- Each FAQ category section gets a distinct left-border accent color based on category: Getting Started (#4ade80 green), Builder (#60a5fa blue), API (#facc15 yellow), Integrations (#a78bfa purple). Pass as a CSS custom property to each section.
- Keep the accordion structure but update animations (see below).

**`src/components/ui/Accordion.astro`**

Smooth spring-like open/close using CSS max-height:
- On open: `max-height` transitions from 0 to a large value (1000px). Use `var(--transition-spring)`.
- On close: reverse. The content will clip out smoothly.
- Add `::before` pseudo-element on the summary that creates the left-border accent (the color passed as a CSS variable from the section).
- "Was this helpful?" micro-interaction at the bottom of each open accordion:
  - Two small icon-buttons: thumbs up (👍), thumbs down (👎). 28px × 28px each.
  - On click: the clicked button gets filled amber state, the other is disabled. State saved to `localStorage` under key `posterium_faq_helpful_{accordionId}`.
  - On reload: restore saved state.
  - No server calls, no tracking.

Responsiveness: the FAQ content becomes full-width (no sidebar) at all breakpoints. At `<480px`: accordion summary text at 12px, content at 13px. Horizontal padding reduced using clamp.

---

## Phase 6 — Installation Page Redesign

### Goal
Transform the installation page into a step-guided experience with visual progress and per-app accent colors.

### Files to Modify/Create

**`src/content.config.ts`**

Add two fields to the `install` collection schema:
- `estimatedTime: z.string().optional()` — e.g., "5 minutes"
- `accentColor: z.string().optional()` — hex color e.g., "#e5a00d"

**`src/content/install/*.md`**

Add frontmatter to each guide:
- `plex.md`: `estimatedTime: "5 minutes"`, `accentColor: "#e5a00d"`
- `jellyfin.md`: `estimatedTime: "3 minutes"`, `accentColor: "#9a9fd7"`
- `emby.md`: `estimatedTime: "4 minutes"`, `accentColor: "#52b54b"`
- `stremio.md`: `estimatedTime: "4 minutes"`, `accentColor: "#8a5fff"`
- `kodi.md`: `estimatedTime: "5 minutes"`, `accentColor: "#17b4e8"`

**`src/components/installation/StepProgress.tsx` (NEW)**

A vertical step tracker shown to the right of the guide content on desktop (or below guide on mobile).

Props: `{ steps: Array<{ heading: string; id: string }>, guideId: string }`

Each step shows: step number (circle), heading text, a connecting vertical line to the next step. The current step (determined by IntersectionObserver watching heading elements) is highlighted: filled amber circle, bold text, amber connecting line above.

Completed steps (user has scrolled past): checkmark icon in the circle, dim text, dim line.

Checkboxes: each step has a small checkbox at the right. Checking it saves to `localStorage` under `posterium_install_{guideId}_step_{index}_checked`. On load, restore checked state. Checked state makes the step show a slightly different visual (checkmark icon overlay on the number, subtle green tint).

At `<1024px`: the step tracker is hidden. The connecting lines and step numbering become a horizontal progress indicator at the top of the guide article instead.

**`src/pages/installation.astro`**

Changes:
- Pass `estimatedTime` and `accentColor` from frontmatter to guide articles
- Each guide card gets its accent color as a `--guide-accent` CSS custom property on the article element. The left border of the article uses `var(--guide-accent)`.
- The sidebar link for the active guide shows the accent color
- "Estimated setup time" badge appears next to the guide title: a small pill with clock icon + the time string
- `StepProgress` component is rendered as a React island inside each guide article. It receives the headings extracted from the guide's markdown.
- The showcase viewer gets a loading skeleton: when `ShowcaseViewer` is loading images, show a skeleton with the correct aspect ratio. Update `ShowcaseViewer.tsx` to add this loading state.

**`src/components/installation/ShowcaseViewer.tsx`**

Add loading and error states:
- While device image is loading: show a skeleton div with correct aspect ratio (`16/9` for desktop/TV, `9/16` for mobile). Skeleton uses the shimmer animation.
- On error: show a grey placeholder card with the app name centered in it.
- Use the `ProgressiveImage` component consistently for all screenshot images.

---

## Phase 7 — Quality Systems

### Goal
Toast notifications, skeleton loading components, error states, and the offline indicator.

### Files to Create/Modify

**`src/lib/useToast.ts` (NEW)**

Implement a pub/sub singleton toast system without any external library:

A module-level store: `{ toasts: Toast[], listeners: Set<Function> }`. Export:
- `useToast()` hook: subscribes to the store using `React.useSyncExternalStore`. Returns `{ toast(message, options?) }` where `options` includes `type?: 'success' | 'error' | 'info'` and `duration?: number`.
- `toast(message, options)` function: adds to the store, auto-removes after `duration` (default 3000ms). Generates a unique ID per toast. Maximum 3 toasts at once: if 4th is added, remove the oldest.

```
interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration: number
}
```

**`src/components/shared/Toast.tsx` (NEW)**

A `ToastContainer` component (place once in `BaseLayout.astro` and `builder/index.tsx`).

Position: fixed `bottom-right` on desktop (`bottom: var(--space-6)`, `right: var(--space-6)`). On mobile (`<768px`): `bottom-center` (`bottom: var(--space-4)`, `left: 50%`, `transform: translateX(-50%)`).

Each toast:
- Background: `var(--film-mid)`, border: `1px solid var(--film-amber)` (for success/info) or `1px solid rgba(248,113,113,0.4)` (for error)
- A colored left border 3px wide: amber for success/info, red for error
- Toast text in DM Sans, 13px
- A small × dismiss button (28×28px, top-right of toast)
- Auto-dismiss after `duration` ms

Animations: new toast slides in from the right (`transform: translateX(100%)` → `translateX(0)`). On dismiss: fades out (`opacity: 1` → `opacity: 0`) and shrinks height to 0. These use `var(--transition-spring)`.

If `prefers-reduced-motion: reduce`: no slide, just opacity fade.

Stack behavior: toasts stack vertically, newest at the bottom. Maximum 3 visible.

`role="status"`, `aria-live="polite"` on the container.

**`src/components/shared/Skeleton.tsx` (NEW)**

A set of skeleton placeholder components exported as named exports:

- `SkeletonPoster`: a div with 2:3 aspect ratio, shimmer animation, `var(--radius-sm)` border-radius
- `SkeletonBadge`: a pill-shaped skeleton, default `140×60px`
- `SkeletonText`: a line skeleton. Props: `width?: string` (default '80%'), `height?: number` (default 12)
- `SkeletonPanel`: several `SkeletonText` lines of varying widths to simulate a panel loading
- `SkeletonCard`: a generic card-shaped skeleton, full width, configurable height

All use the `shimmer` keyframe from `global.css`. All `aria-hidden="true"`. If `prefers-reduced-motion: reduce`: static grey block, no shimmer animation (import `useAnimation` from Instance 1 to detect this).

**`src/components/shared/TopLoadingBar.tsx` (NEW)**

Props: `{ loading: boolean }`.

A fixed 3px amber line at the very top of the viewport (`position: fixed`, `top: 0`, `left: 0`, `z-index: var(--z-top)`).

When `loading` becomes `true`: bar animates from 0% width to 85% over 1.2 seconds (ease-out). Holds at 85%.

When `loading` becomes `false`: bar instantly jumps to 100% width, then fades out over 0.3s.

Implementation: track `width` in state. Use `useEffect` on `loading` changes. Use CSS `transition` on the width. The `opacity` transitions on completion.

If `prefers-reduced-motion: reduce`: show a simple pulsing amber dot at the top-left instead of a bar animation.

**`src/layouts/BaseLayout.astro`**

Add:
- `<ToastContainer client:only="react" />` — mounted once
- `<TopLoadingBar client:only="react" />` — mounted once (always present, shows/hides based on loading state)
- Offline indicator: a script that listens to `window.addEventListener('online'/'offline')`. When offline: shows a fixed amber banner at the bottom of the viewport: "You're offline. Some features may not work." With an X to dismiss. When back online: banner hides with fade. Implement as a small inline script + minimal CSS in `BaseLayout.astro` (no React component needed — pure DOM manipulation keeps it lightweight).

**Toast integration in existing components:**

`src/shared/ExportMenu.tsx`:
- On "Copy URL" success: `toast('URL copied to clipboard', { type: 'success' })`
- On download triggered: `toast('Downloading poster...', { type: 'info', duration: 1500 })`

`src/components/builder/components/ResetDialogue.tsx`:
- After reset confirmed: `toast('Settings reset to defaults', { type: 'info' })`

`src/components/builder/components/ImportDialogue.tsx`:
- After successful load: `toast('Poster configuration loaded', { type: 'success' })`
- On invalid URL: `toast('Invalid URL format', { type: 'error' })`

**Error States for `src/components/ui/`:**

Add to the UI component library:
- `ErrorCard.tsx`: Props `{ title?: string; message: string; action?: { label: string; onClick: () => void } }`. An amber-bordered card with error icon, title, message, and optional retry button.
- `EmptyState.tsx`: Already exists, improve it. Add an optional `action` prop for a button below the message.

---

## Phase 8 — Accessibility, SEO & Analytics Refactor

### Goal
Accessibility audit, structured data completion, and analytics dashboard refactor.

### ARIA & Accessibility

Systematic pass across all Instance 2 components:

**Toasts**: `ToastContainer` has `role="status"` `aria-live="polite"`. Individual toasts have `role="alert"` when type is "error".

**ModeToggle**: `role="group"`, `aria-label="Builder mode"`. Buttons have `aria-pressed`.

**InspectorSimple tabs**: `role="tablist"` on the tab bar, `role="tab"` on each button, `aria-selected`, `role="tabpanel"` on the content area, `aria-labelledby` pointing to the active tab.

**Preset cards**: each "Apply" button has `aria-label="Apply {presetName} preset"`.

**AdvancedParamsPanel**: all info icon buttons have `aria-label="Learn more about {param name}"`.

**Category cards in FAQ**: each card is a `<button>` with `aria-label="{categoryName} ({count} questions)"`.

**Accordion** (Accordion.astro): Verify `aria-expanded` is set correctly on the `<summary>` element. Add `id` to each accordion content section and `aria-controls` on the summary.

**StepProgress**: step circle buttons that are checkboxes have proper `role="checkbox"`, `aria-checked`, `aria-label="Mark step {n} complete"`.

**Skip links**: 
- In `BaseLayout.astro`: add `<a href="#main-content" class="skip-link">Skip to main content</a>` as the very first child of `<body>`. Style it: visually hidden by default (`position: absolute; left: -9999px`), visible on focus (`left: 8px; top: 8px; background: var(--film-amber); color: #070706; padding: 8px 14px; border-radius: 4px; z-index: var(--z-top)`).
- In builder pages: there's already a skip link; verify it works.
- In `installation.astro`: add `<a href="#install-main-content">Skip to guide content</a>`.

**Focus rings**: verify all interactive elements in your components show amber focus rings. Add to global.css (Instance 1 can do this, or request they add: `*:focus-visible { outline: 2px solid var(--film-amber); outline-offset: 2px; }`).

### SEO Structured Data

**FAQ page**: Add `FAQPage` JSON-LD schema generated from the actual FAQ collection entries. In `pages/faq.astro`, build the schema object from `sortedFaqs` and inject as `<script type="application/ld+json">`.

**Installation page**: Add `HowTo` JSON-LD for each guide. The `name` is the guide app name. `totalTime` maps to `estimatedTime` from frontmatter. `step` items are the h2/h3 headings extracted from the guide markdown.

**Examples page**: Add `ItemList` JSON-LD where each item is a preset example with `name` and `description` from the preset frontmatter.

**`src/layouts/BaseLayout.astro`**: Ensure `og:image` is correctly set for all pages, `twitter:image` matches. Verify `canonical` is always set. Verify `rel="canonical"` is present on every page.

### Analytics Dashboard Refactor

Split `src/components/admin/AnalyticsDashboard.tsx` (~1000 lines) into focused sub-components. Create `src/components/admin/` sub-files:

- `AnalyticsShared.tsx`: export all shared primitives — `StatCard`, `Card`, `NodeCard`, `Gauge`, `Skel`, `LatDist`, `PosterThumb`, `FilmTooltip`, `fmtMs`, `fmtNum`, `fmtPct`, `msColor`, `rateColor`, `healthScore`, `fmtBucket`, `relTime`, `nodeColor`, `nodeLabel`, all color constants (`CH`), `PERIODS`, `TABS`, the tab type
- `AnalyticsAuth.tsx`: the password screen component
- `AnalyticsControls.tsx`: the sticky header (period selector, live toggle, refresh, logout)
- `AnalyticsOverviewTab.tsx`: overview tab content
- `AnalyticsNodesTab.tsx`: nodes tab
- `AnalyticsTrafficTab.tsx`: traffic tab
- `AnalyticsFallbacksTab.tsx`: fallbacks tab
- `AnalyticsRequestsTab.tsx`: requests tab
- `AnalyticsDevicesTab.tsx`: devices tab
- `AnalyticsDbTab.tsx`: db tab
- `AnalyticsErrorsTab.tsx`: errors tab
- `AnalyticsBreakdownTab.tsx`: breakdown tab
- `AnalyticsWallTimeTab.tsx`: wall-time tab

`AnalyticsDashboard.tsx` becomes a shell: handles auth state, data fetching, derived data (all the `useMemo` computations), and renders the controls + tab router. Each tab component receives only the slice of data it needs as props. This reduces the main file from ~1000 to ~200 lines.

Responsiveness pass on analytics: dashboard stat grid switches to 2-col at `<900px`, 1-col at `<600px`. Tab bar scrolls horizontally on mobile. Charts maintain minimum 200px height at all widths.

### Responsiveness Final Pass (Instance 2 Components)

Systematic pass across all Instance 2 components at 320px, 480px, 768px, 1024px, 1280px, 1600px, 2560px:

- FAQ category cards: horizontal scroll below 480px, 2-col at 480px, 3-4 col at 1024px+
- Installation step tracker: hidden below 1024px, visible 1024px+. At 2560px, step tracker widens to 280px.
- Preset cards in builder: fluid grid from 1-col (narrow panel) to 3-col (wide panel)
- `BadgesPanelAdvanced` collapsible sections: all sections expand/collapse smoothly, never clip at any panel width
- Toast container: right-aligned on desktop, centered on mobile
- Analytics dashboard: grid adapts across all widths

Apply design token replacements: search all Instance 2 files for any hardcoded spacing values, colors, or radius values and replace with tokens from Instance 1's `global.css`.