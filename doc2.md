
---

# DOCUMENT 2 — Instance 1: Phase-by-Phase Instructions

---

## Phase 1 — Design System Foundation & Build Optimisation

### Goal
Establish the token system and infrastructure that every other phase and Instance 2 depends on. This phase must be delivered first.

### Files to Create/Modify

**`src/styles/global.css`**

Consolidate the entire design token system here. Currently tokens are split between `global.css` and `dashboard.css` with duplication. Fix this:
- Move all `:root` CSS variable declarations to a single block at the top of `global.css`
- Add the full spacing, radius, shadow, z-index, and transition token sets defined in your custom instructions
- Fluid typography scale: define six named classes (`.text-xs`, `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-2xl`) each using `clamp()` for responsive scaling. Base scale: xs=10px→10px, sm=11px→12px, base=13px→15px, lg=16px→20px, xl=20px→28px, 2xl=28px→48px (min→max)
- Keep all existing keyframes (`shimmer`, `grain-anim`, `fade-up`, etc.)
- Add a `.motion-safe` wrapper class: applies animation only when `prefers-reduced-motion: no-preference`
- Remove duplicate rules from `dashboard.css` after moving them here. `dashboard.css` should retain ONLY its own layout classes and animation classes that are truly dashboard-specific

**`src/styles/typography.css`**

Extract the fluid type scale into a separate file imported by `global.css`. This makes it easy for Instance 2 to reference type classes without wading through global.css.

**`src/lib/breakpoints.ts`**

Export:
- `BREAKPOINTS` constant: `{ sm: 480, md: 768, lg: 1024, xl: 1280, xxl: 1600 }`
- `useBreakpoint()` hook using `window.matchMedia` with cleanup
- `useIsMobile()` — true below md
- `useIsTablet()` — true between md and lg
- `useIsDesktop()` — true at lg and above
- `media(breakpoint)` — returns the CSS media query string for use in dynamic styles

**`src/lib/hooks/usePausedWhenOffscreen.ts`**

IntersectionObserver hook. Accepts a threshold (default 0.05). Returns `{ ref, isVisible }`. Components attach `ref` to their outermost container and conditionally apply `style={{ animationPlayState: isVisible ? 'running' : 'paused' }}` or a CSS class. Disconnect observer on unmount.

**`src/lib/hooks/useAnimation.ts`**

Combines `usePausedWhenOffscreen` with `prefers-reduced-motion` detection. Returns `{ ref, shouldAnimate }`. If `prefers-reduced-motion: reduce` is active, `shouldAnimate` is always false and the ref is inert. If offscreen, `shouldAnimate` is also false. Components use `shouldAnimate` to gate animations entirely.

**`vite.config.ts` (or `astro.config.mjs`)**

Add `rollupOptions.output.manualChunks` to split:
- `builder-canvas`: PreviewCanvas, DraggableBadge, DraggableLogo
- `builder-panels`: all files in `src/components/builder/panels/`, `src/components/builder/components/PropertyPanel.tsx`, `src/components/builder/components/LayerPanel*.tsx`
- `analytics`: everything in `src/components/admin/`
- Ensure `src/pages/index.astro` (home page) does not pull in any builder chunks. Verify with a build and check the output

### Acceptance Criteria
- `global.css` has exactly one `:root` block; no token is defined in any other file
- `dashboard.css` has zero color or typography definitions
- All five hooks export correctly and TypeScript is satisfied
- Build runs without warnings related to chunk size
- Home page bundle does not include builder code

---

## Phase 2 — Navigation Systems

### Goal
Make all navigation across the entire site responsive, accessible, and visually consistent from 320px to 2560px.

### Files to Create/Modify

**`src/components/shared/MainNavbar.tsx`**

Complete responsive overhaul. Define these layout breakpoints internally:

At **320–479px (xs):** Logo (text only, 16px) + hamburger button. Search bar hidden. Build CTA hidden. No links visible.

At **480–767px (sm):** Logo + hamburger. Search bar appears in the hamburger dropdown (full width). Build CTA appears as small amber pill in header right. Links in dropdown as large tap targets (56px min-height each).

At **768–1023px (md):** Logo + hamburger (still no inline links). Search bar appears inline in the header (flex: 1, centered). Build CTA as amber pill. GitHub icon visible.

At **1024–1279px (lg):** Full desktop nav. Logo + inline links + search bar (centered, constrained width) + GitHub icon + Build CTA. No hamburger.

At **1280px+ (xl/2xl):** Same as lg but BMC/Support button reappears. At 1600px+, search bar expands to full flex width.

All interactive elements: 44px minimum height. Hamburger button: 44×44px. All nav links: 44px height via padding.

The mobile dropdown becomes a proper overlay panel (not just a div below the nav). It slides down from the top-right with `--transition-spring` animation, has a frosted glass background, and can be dismissed by tapping outside or pressing Escape.

The search input: on desktop, keyboard shortcut display (⌘K or Ctrl+K based on platform detection) shown inside the input as a kbd hint on the right side. On mobile, no keyboard hint shown.

Active page detection: compare `window.location.pathname` to each link href. Show a small amber dot below the active link on desktop.

Accessibility: `aria-expanded` on hamburger, `role="navigation"`, focus trap inside mobile menu when open. All links have visible focus rings using the film-amber color.

**`src/components/dashboard/Nav.tsx`**

Evaluate whether this can simply wrap `MainNavbar` with `revealOnScroll={true}`. The behavior is: navbar starts transparent at scroll 0, transitions to frosted-dark as user scrolls past `window.innerHeight * 0.15`. The `revealOnScroll` prop already exists; the transparent-start behavior is new. Add it to `MainNavbar` conditional on `revealOnScroll`:
- When `revealOnScroll=true` AND `window.scrollY < threshold`: background transparent, `backdropFilter: none`, `borderBottom: none`
- Above threshold: current frosted behavior

If the result is clean, `Nav.tsx` becomes a one-liner wrapper. If the home page nav genuinely needs different link structure, keep them separate.

**`src/components/builder/index.tsx` — Header section**

The builder header at `lg+`:
- Left: Logo (links to home) + ModeToggle (imported from Instance 2's `src/components/builder/components/ModeToggle.tsx`)
- Center: Command palette search bar (same as current)
- Right: sidebar toggles (desktop only) + undo/redo + Import + Export CTA + Reset + overflow menu

At `lg` (1024–1279px): condense right side. Hide "Reset" label (icon only with tooltip). Hide "Import" text (icon only).

Below `lg`: builder is not shown on mobile (show a "Builder requires desktop" message or redirect). This is consistent with the existing desktop-only nature of the builder. Do not implement a mobile builder layout — that is a future iteration.

Overflow menu (three-dot icon in header): appears at `xl` and below, contains items that don't fit. Items in overflow: Reset, Import, Keyboard Shortcuts toggle. Overflow is a small dropdown popover consistent with existing export popover style.

The `ModeToggle` component from Instance 2 is placed between the logo and the center search bar. Import it as: `import ModeToggle from '@/components/builder/components/ModeToggle'`. If Instance 2 hasn't delivered yet during your work, stub it as a `<div style="width:120px;height:32px" />` placeholder.

---

## Phase 3 — Canvas System & Builder Shell

### Goal
Improve the canvas interaction layer, add the settings panel, implement drag-lasso selection, and extend alignment guides.

### Files to Create/Modify

**`src/components/builder/components/CanvasSettingsPanel.tsx` (NEW)**

A small floating settings panel that attaches to the zoom overlay. Implementation:

Trigger: a gear icon button added to the zoom overlay cluster. The gear button matches the style of the existing ZoomIn/ZoomOut/ResetView buttons (same size, same hover behavior).

Panel position: opens to the left of the zoom overlay cluster, aligned vertically with the gear button. On screen edge, flip to the right. The panel is `200px` wide.

Content:
- "Canvas Settings" label (tiny caps, amber, uppercase)
- Safe Area overlay toggle (uses `toggleViewOption('showSafeArea')` from context)
- Grid overlay toggle (`toggleViewOption('showGrid')`)
- Snap to Grid toggle (`toggleViewOption('snapToGrid')`)
- Divider
- When `builderMode === 'advanced'` (from context): additional section "Advanced Canvas" with:
  - Canvas background color picker (purely visual, affects the preview area background in the builder, does not affect export)
  - Show Rulers toggle (future placeholder, disabled with "Coming soon" label)

Animation: `--transition-spring` scale-from-origin. The panel origin is the gear button position. `transform-origin` set accordingly. Opens with `scale(0.85) → scale(1)` and `opacity(0) → opacity(1)`. Closes instantly on outside click.

Accessibility: `role="dialog"`, `aria-label="Canvas settings"`, focus trap while open, Escape closes it.

**`src/components/builder/components/PreviewCanvas.tsx`**

Three additions:

1. **Drag-lasso multi-select**: When `pointerdown` fires on the canvas container itself (not on a badge), begin recording the drag. Render a dashed amber rectangle using an absolutely positioned div. On `pointerup`, calculate which badge bounding boxes intersect the rectangle and call `setBatchSelection` with those IDs. The lasso rect is rendered only during active dragging. Clear it on completion. Touch: lasso only activates on pointer devices (mouse/stylus), not on touch (where finger = pan intent).

2. **Extended alignment guides**: Currently center-X and center-Y snap guides exist. Add edge snap guides: show a guide line when a badge's edge (left, right, top, bottom) aligns within `SNAP_CENTER_TOLERANCE` of the canvas edge plus `PADDING` offset. This means four additional possible guide lines. Each guide is a 1px amber line, semi-transparent (0.8 opacity). Only shown during active drag.

3. **Double-tap to reset zoom**: On double-tap on the canvas background (not on a badge), call `resetView()`. Detect double-tap via two `click` events within 300ms on the canvas background element.

**`src/components/builder/components/DraggableBadge.tsx`**

Verify that `touchAction: 'none'` prevents scroll interference during badge drag on touch devices. Ensure the `onTouchStart` → `onTouchMove` → `onTouchEnd` chain properly calls `e.preventDefault()` only during active drag, not on initial touch. No major feature changes.

**`src/components/builder/components/DraggableLogo.tsx`**

Same touch verification as DraggableBadge. Confirm the logo can be dragged smoothly on touch without triggering page scroll.

**`src/components/builder/index.tsx` — Canvas layout wiring**

Wire the mode-conditional sidebar layout:

In **simple mode**: left sidebar (full width, `--leftSidebarWidth`px) renders `LayerPanelSimple`. Right sidebar (full width, `--rightSidebarWidth`px) renders Instance 2's `InspectorSimple`.

In **advanced mode**: left sidebar becomes 56px wide and renders `AdvancedIconNav`. Right sidebar renders Instance 2's `AdvancedPanelArea` (Instance 2 fills panel content; your `AdvancedPanelArea` routes to them). The canvas gains the width freed up by the narrowed left sidebar. Import: `import { AdvancedIconNav } from '@/components/builder/components/AdvancedIconNav'` and `import { AdvancedPanelArea } from '@/components/builder/components/AdvancedPanelArea'`.

Integrate `CanvasSettingsPanel` into the ZoomOverlay cluster. The gear button is part of the floating cluster.

---

## Phase 4 — Builder Left Sidebar (Simple & Advanced)

### Goal
Create the conditional left sidebar system: a simplified panel for simple mode and the icon-based navigation for advanced mode.

### Files to Create

**`src/components/builder/components/LayerPanelSimple.tsx`**

Two tabs: **Source** | **Layers**

Source tab keeps from the current `LayerPanel`:
- Media search (Combobox with TMDB)
- Media info card (title, year, type badge, ID display)
- Poster Source dropdown (TMDB / Fanart.tv / Metahub / IMDb)
- Textless toggle

Source tab adds (moved from where they were hidden or in Poster tab):
- A thin labelled divider: "Image Effects"
- Poster Blur slider (0–20, uses `config.posterBlur` / `updateConfig('posterBlur', v)`)
- Grayscale toggle (uses `config.grayscale` / `updateConfig('grayscale', v)`)

Source tab removes entirely:
- Media Type selector (auto-detected from search result; stored internally, not shown)
- Manual IMDb ID / TMDB ID text input
- Poster Type (ptype) selector
- Show Title Layer toggle
- Show Badges master toggle
- Logo Source selector (locked to `null`/auto in simple mode)
- API Keys section

Layers tab: identical to the current layers tab in `LayerPanel`. Extract the layers tab JSX cleanly. Keep all drag-drop, visibility toggle, and fallback pool behavior.

The component accepts the same props as the current `LayerPanel`: `{ config, setConfig, selectedIds, onSelect }`.

**`src/components/builder/components/AdvancedIconNav.tsx`**

A vertical strip exactly 56px wide. Nine icon buttons stacked top to bottom with 4px gaps. No labels shown — only icons with tooltip on hover.

Panel assignments and icons:
- Source → `Film` icon (lucide)
- Poster → `Image` icon
- Badges → `Tag` icon
- Logo → `ImagePlay` icon
- Layout → `LayoutGrid` icon
- Selected → `MousePointer2` icon
- Fallbacks → `GitMerge` icon
- Advanced → `Sliders` icon
- Presets → `Sparkles` icon

Each button: 48×48px with 4px border-radius. Active state: amber fill `rgba(196,124,46,0.15)` with amber left border 2px. Inactive hover: subtle highlight. Clicking calls `setAdvancedPanel(id)` from context.

Tooltip: appears to the right of the button, 200ms delay on hover, disappears immediately on mouseout. Tooltip shows the panel name in small-caps Syne font. Use a pure CSS tooltip approach (position: absolute relative to the nav strip, pointer-events: none) — no JS positioning library needed.

Accessibility: each button has `aria-label={panelName}`, `aria-pressed={isActive}`. The strip has `role="navigation"` and `aria-label="Builder panels"`.

Top of the nav strip: a thin amber accent line (2px horizontal bar). Bottom: same. This frames it visually.

**`src/components/builder/components/AdvancedPanelArea.tsx`**

A panel router component. Reads `advancedPanel` from context and renders the appropriate panel. This component is the right sidebar content in advanced mode.

Panel routing:
- `'source'` → `SourcePanelAdvanced` (you own)
- `'poster'` → `PosterPanelAdvanced` (you own)
- `'layout'` → `LayoutPanelAdvanced` (you own)
- `'fallbacks'` → `FallbacksPanelAdvanced` (you own)
- `'badges'` → lazy import `BadgesPanelAdvanced` (Instance 2's `src/components/builder/panels/BadgesPanelAdvanced.tsx`)
- `'logo'` → lazy import `LogoPanelAdvanced` (Instance 2)
- `'selected'` → lazy import `SelectedPanelAdvanced` (Instance 2)
- `'advanced'` → lazy import `AdvancedParamsPanel` (Instance 2)
- `'presets'` → lazy import `PresetsTabAdvanced` (Instance 2)

For Instance 2 panels: use `React.lazy()` with a `Suspense` fallback of a simple loading skeleton. The lazy import path must match exactly what Instance 2 will create. Until Instance 2 delivers, the Suspense fallback shows a skeleton panel.

The panel area has a sticky header showing the panel name and a small "?" icon button that opens a tooltip explaining the panel's purpose.

**`src/components/builder/panels/SourcePanelAdvanced.tsx`**

Everything from `LayerPanelSimple` Source tab PLUS:
- Media Type selector (movie / TV / Anime) — shown at the top
- Manual IMDb ID input — shown after media info card
- Source Order: a drag-sortable list of poster sources (Fanart → TMDB → Metahub → IMDb). Uses `@hello-pangea/dnd`. Reordering updates a `sourceOrder` field if you add it to config, or maps to the `so` V3 param. Store as an array of source strings. Note: the V3 URL generator doesn't currently emit `so`; you may need to add a `sourceOrder?: string[]` field to `PosterConfig` in `types.ts` and handle it in URL generation. Keep the change minimal — add the field and serialize it as `so=fanart,tmdb,metahub,imdb`.
- Ptype selector (Auto / Top1 / Top2 / Top3 / Best / Random / Latest / Oldest)
- API Keys section: TMDB key, Fanart.tv key, OMDB key, MDBList key — each with password input and show/hide toggle. Exactly as in the current `LayerPanel`.

**`src/components/builder/panels/PosterPanelAdvanced.tsx`**

Controls that affect the poster image before badge overlay:
- Poster Blur slider (0–20px, maps to `config.posterBlur`)
- Grayscale toggle (maps to `config.grayscale`)
- Textless toggle (maps to `config.textless`)
- No-Embed mode toggle: labelled "No-Embed / CDN Mode" with description "Bypasses embedding restrictions. Use when poster fails to render in certain contexts." Maps to a new `noEmbed` field on `PosterConfig`; serializes to `ne=1` in the URL. Add the field to types.ts.
- Canvas Background Color: a color picker that changes the preview canvas background color only (not exported). Store in component local state or in a non-serialized context value. This is purely visual for the builder.

**`src/components/builder/panels/LayoutPanelAdvanced.tsx`**

- Preset alignment grid (9-position, same `AlignmentGrid` component as in `PropertyPanel.tsx`)
- Flow Direction segmented: Row | Column
- Scale (sc) master slider (0.5 – 2.0, step 0.05)
- Uniform Width toggle: labelled "Uniform Badge Width" with description "Forces all badges to the same width for a grid-aligned look." Maps to `ub=1` in URL. Add `uniformWidth?: boolean` to `PosterConfig` and serialize.

**`src/components/builder/panels/FallbacksPanelAdvanced.tsx`**

Two vertical lists side by side (or stacked on narrow panels):
- Left: "Active Ratings" — the current `config.ratings` array
- Right: "Fallback Pool" — the current `config.fallbackPool` array

Both lists are drag-sortable using `@hello-pangea/dnd` with `Droppable`/`Draggable`. Items can be dragged between lists. Dropping from Active to Fallback removes from ratings and adds to fallbackPool. Dropping from Fallback to Active does the reverse.

Above the lists: a brief explanation — "If a rating isn't available for a title, Posterium will try your fallback providers in order."

Each item shows the provider icon (from `BADGE_ICONS`) + label. Minimum 48px height per item for touch usability.

---

## Phase 5 — Home Page Transformation

### Goal
Rebuild the masonry reel with a seeded algorithm and make the entire home page fluid and responsive.

### Files to Create/Modify

**`src/lib/masonryLayout.ts` (NEW)**

A pure, deterministic masonry column layout generator. This function is called once at component initialization and produces the same output every time for the same input.

Seeded random: implement an LCG (Linear Congruential Generator) with seed `2024`. Formula: `s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff`. Wrap in a class or closure that returns successive values on each call.

Column templates (each is an array of height percentages that sum to 100):
- Template A: `[100]` — single full-height poster. Weight: 2
- Template B: `[50, 50]` — two equal halves. Weight: 3
- Template C: `[33, 33, 34]` — three equal thirds. Weight: 2
- Template D: `[62, 38]` — big top, small bottom. Weight: 2
- Template E: `[38, 62]` — small top, big bottom. Weight: 2
- Template F: `[35, 65]` — narrow top, tall bottom. Weight: 1

Template selection: use weighted random. Build a prefix-sum array of weights, pick with a single RNG call.

Item assignment: take all `REEL_ITEMS` (22 items), shuffle using Fisher-Yates with the seeded RNG, then cycle through them as column slots are filled. Track each item's last-used column index to prevent the same item appearing in adjacent columns.

Column width calculation: the strip height is given as an input (in pixels). Column width = `stripHeight * (2 / 3)` (poster aspect ratio). Each column's slot heights are percentages of the strip height.

Generate enough columns to fill `Math.ceil(viewportWidth * 3.5 / columnWidth)` where viewportWidth is a constant reference of `1920` at build time. This ensures the strip is always long enough.

Export:
```
interface MasonrySlot { item: ReelItem; heightPct: number }
interface MasonryColumn { slots: MasonrySlot[]; width: number }
function generateMasonryLayout(stripHeightPx: number, viewportRefWidth?: number): MasonryColumn[]
```

**`src/components/dashboard/FilmReelSection/DesktopReel.tsx`**

Replace the fixed three-row implementation with the masonry system:

Strip height: calculated as `window.innerHeight - 92` (92px = header strip + sprocket strips). Recalculate on window resize with debounce.

Call `generateMasonryLayout(stripHeight)` once on mount. Store the result in `useMemo` (the function is deterministic, so memo is just for perf).

Render: a single `flex-direction: row` container. Each column is a `flex-direction: column` with the column's `width` and `height = stripHeight`. Each slot is a poster image with `height = slot.heightPct%`.

Apply `useAnimation` hook to the track container. Pass `shouldAnimate` to the scroll-driven transform: if `!shouldAnimate`, freeze the transform at 0 (poster is visible but not scrolling). This handles both `prefers-reduced-motion` and offscreen culling simultaneously.

The horizontal scroll driver (`useScrollReel` hook): unchanged. The progress bar and sprocket strips: unchanged. The sepia filter: unchanged.

Poster rendering: keep `ProgressiveImage` with the existing API URL pattern.

**`src/components/dashboard/HeroSection.tsx`**

Replace all fixed paddings and font sizes with `clamp()` values:
- Container padding: `clamp(64px, 9vh, 112px)` vertical, `clamp(40px, 5vw, 72px)` horizontal
- Main headline: `clamp(88px, 13vw, 200px)`
- Subtitle: `clamp(13px, 1.4vw, 16px)`
- Stat values: `clamp(24px, 3vw, 36px)`

Below 820px: the grid drops to single column. The poster carousel (`CyclingPoster`) is hidden (already hidden via CSS, verify it's clean). Replace it with an ambient glow effect: a radial gradient div positioned behind the headline text, giving the impression of light behind the text. No image loading needed.

Apply `useAnimation` to the hero animation elements (`.h-a1` through `.h-a5`). If `!shouldAnimate`, skip the reveal animation and show elements immediately at full opacity.

---

## Phase 6 — Responsiveness Audit & Polish

### Goal
Systematic verification pass across all Phase 2–5 work. No new features — only fixes and refinements.

### Tasks

**Breakpoint verification for each component you created:**

Go through each component at these widths mentally: 320px, 480px, 768px, 1024px, 1280px, 1600px, 2560px.

Common issues to look for and fix:
- Text overflow without ellipsis at narrow widths
- Buttons overlapping each other in toolbars at medium widths
- Tooltips clipping at screen edges (flip tooltip direction when near edge)
- Grid layouts that create empty space at very wide screens
- Fixed-width elements that break the layout at 320px
- Touch targets smaller than 44px on any interactive element

**Specific known risk areas:**
- `AdvancedIconNav` tooltips at screen right edge on wide monitors: add right-edge detection and flip tooltip to left side when near edge
- `CanvasSettingsPanel` at exactly 1024px builder width: verify it doesn't clip the canvas
- Masonry reel at 2560px: may produce columns that are too wide. Add a `maxColumnWidth: 280px` cap and recalculate column count
- Builder header at 1024–1280px range: the border case where overflow menu appears. Verify the overflow menu itself is usable
- `LayerPanelSimple` at its minimum width (e.g., if resized very narrow): content must not overflow

**Design token pass:**

Search for any hardcoded colors (`#c47c2e`, `rgba(196,124,46`, etc.) or spacing values in files you created. Replace all of them with the design tokens from `global.css`. The only hardcoded values allowed are in CSS variable declarations themselves.

**Animation correctness:**

Verify that `usePausedWhenOffscreen` is applied to:
- Masonry reel track animation
- MarqueeTicker
- Grain layer
- Hero floating animations

Verify `prefers-reduced-motion` is respected in all of these. Test by temporarily setting `@media (prefers-reduced-motion: reduce)` in your browser or devtools.

**Accessibility items you may have missed:**
- `AdvancedIconNav` icon buttons: all have `aria-label` and `aria-pressed`
- `CanvasSettingsPanel`: `role="dialog"` and `aria-label`
- Drag-lasso: announce to screen readers when a multi-selection is made (use an aria-live region in `PreviewCanvas`)
- Alignment guides: purely visual, `aria-hidden="true"`

**Build verification:**

Run a production build. Check:
- No TypeScript errors
- No console warnings
- The bundle analysis confirms home page doesn't load builder code
- The builder loads without error in simple and advanced mode

---