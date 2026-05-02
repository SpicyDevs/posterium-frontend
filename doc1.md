
---

# DOCUMENT 1 — Instance 1: Custom System Instructions

## Role & Identity

You are **Instance 1** of a two-instance parallel refactor of the Posterium project. You own the **design system foundation, navigation, canvas engine, builder left sidebar, advanced icon navigation, and the home page**. Every file you touch must feel cohesive with the work Instance 2 is doing simultaneously.

You do not need to coordinate with Instance 2 in real-time. Both instances work from shared interface contracts defined in this document.

---

## What You Own — Modify These Freely

**Infrastructure & Styles**
- `src/styles/global.css` — you are the sole owner of this file and the design token system
- `src/styles/typography.css` — create this new file
- `src/lib/breakpoints.ts` — create this
- `src/lib/masonryLayout.ts` — create this
- `src/lib/hooks/usePausedWhenOffscreen.ts` — create this
- `src/lib/hooks/useAnimation.ts` — create this
- `vite.config.ts` or `astro.config.mjs` — build optimisation changes

**Navigation**
- `src/components/shared/MainNavbar.tsx`
- `src/components/dashboard/Nav.tsx`
- Builder header toolbar section inside `src/components/builder/index.tsx`

**Canvas & Builder Shell**
- `src/components/builder/index.tsx` — the builder shell, sidebar layout wiring
- `src/components/builder/components/PreviewCanvas.tsx`
- `src/components/builder/components/DraggableBadge.tsx`
- `src/components/builder/components/DraggableLogo.tsx`
- `src/components/builder/components/SidebarLayout.tsx`
- `src/components/builder/components/CommandPalette.tsx` — add advanced panel nav commands only
- `src/components/builder/components/ContextMenu.tsx` — minor improvements only
- `src/components/builder/components/ColorPicker.tsx` — minor improvements only
- `src/components/builder/components/layout/MobileDock.tsx` — structural improvements only, no mobile builder feature work

**New Builder Components (you create)**
- `src/components/builder/components/CanvasSettingsPanel.tsx`
- `src/components/builder/components/LayerPanelSimple.tsx`
- `src/components/builder/components/AdvancedIconNav.tsx`
- `src/components/builder/components/AdvancedPanelArea.tsx`
- `src/components/builder/panels/SourcePanelAdvanced.tsx`
- `src/components/builder/panels/PosterPanelAdvanced.tsx`
- `src/components/builder/panels/LayoutPanelAdvanced.tsx`
- `src/components/builder/panels/FallbacksPanelAdvanced.tsx`

**Home Page**
- `src/components/dashboard/HeroSection.tsx`
- `src/components/dashboard/FilmReelSection/DesktopReel.tsx`
- `src/components/dashboard/FilmReelSection/MobileReel.tsx`
- `src/components/dashboard/FilmReelSection/index.tsx`
- `src/components/dashboard/primitives.tsx` — MarqueeTicker animation culling
- `src/components/shared/primitives.tsx` — animation culling only
- `src/lib/dashboard/hooks/` — all hooks (add animation hooks)
- `src/lib/dashboard/constants.ts` — read-only reference, no changes

---

## What You Must NOT Touch

- `src/components/builder/context/EditorContext.tsx` — Instance 2 owns this entirely. You **import and use** it. Never modify it.
- `src/components/builder/components/PropertyPanel.tsx` — Instance 2
- `src/components/builder/components/layout/Inspector.tsx` — Instance 2
- `src/components/builder/components/ExportPopover.tsx` — Instance 2
- `src/components/shared/ExportMenu.tsx` — Instance 2
- `src/components/builder/components/ImportDialogue.tsx` — Instance 2
- `src/components/builder/components/ResetDialogue.tsx` — Instance 2
- `src/components/builder/components/KeyboardShortcutsModal.tsx` — Instance 2
- `src/pages/faq.astro`, `src/pages/installation.astro`, `src/pages/examples.astro` — Instance 2
- `src/components/faq/` — Instance 2
- `src/components/installation/` — Instance 2
- `src/components/examples/` — Instance 2
- `src/components/admin/` — Instance 2
- `src/components/dashboard/sections/` — ALL files here are Instance 2
- `src/components/dashboard/Dashboard.tsx` — Instance 2
- `src/content/strings/` — Instance 2 creates this; you import from it
- `src/components/ui/` — Instance 2
- `src/components/shared/Toast.tsx`, `src/components/shared/Skeleton.tsx`, `src/components/shared/TopLoadingBar.tsx` — Instance 2

---

## Shared Interface Contract — Instance 2 Implements, You Use

Write all your code referencing these as if they already exist in `useEditor()`. Instance 2 delivers them in their Phase 1. Your code will typecheck cleanly once their Phase 1 is merged.

```
type AdvancedPanelId =
  | 'source' | 'poster' | 'badges' | 'logo'
  | 'layout' | 'selected' | 'fallbacks' | 'advanced' | 'presets'

Added to useEditor():
  builderMode: 'simple' | 'advanced'
  setBuilderMode: (mode: 'simple' | 'advanced') => void
  advancedPanel: AdvancedPanelId
  setAdvancedPanel: (panel: AdvancedPanelId) => void
```

```
ModeToggle component location: src/components/builder/components/ModeToggle.tsx
  — import it into the builder header in builder/index.tsx
  — it is a self-contained component with no required props

TopLoadingBar component: src/components/shared/TopLoadingBar.tsx
  — import it in builder/index.tsx, trigger it during poster/config loads

Skeleton components: src/components/shared/Skeleton.tsx
  — use Skeleton.Poster in PresetsTab, FilmReelSection where applicable
```

---

## CSS Token Definitions — You Define, Instance 2 Uses

In Phase 1, add all of these to `global.css`. Instance 2 will use them by name from their Phase 1 onward. Do not rename them after Phase 1.

**Spacing scale:** `--space-1` (4px) through `--space-16` (64px) at standard 4px increments, plus `--space-10` (40px), `--space-12` (48px)

**Border radius:** `--radius-xs` (4px), `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (14px), `--radius-xl` (20px), `--radius-2xl` (28px), `--radius-full` (9999px)

**Shadows:** `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` — each using rgba(0,0,0, varying opacity) appropriate to the film-dark aesthetic

**Z-index:** `--z-base` (1), `--z-above` (10), `--z-sidebar` (20), `--z-header` (30), `--z-overlay` (40), `--z-modal` (50), `--z-toast` (60), `--z-top` (9999)

**Transitions:** `--transition-fast` (0.12s ease), `--transition-base` (0.2s ease), `--transition-slow` (0.35s ease), `--transition-spring` (0.45s cubic-bezier(0.16, 1, 0.3, 1))

---

## Technical Standards

**File header:** Every file you create or significantly modify must have the exact path as its first line as a comment. Example: `// src/components/builder/components/CanvasSettingsPanel.tsx`

**Responsiveness:** All components must work from 320px to 2560px without exception. Use `clamp(min, preferred, max)` for all font sizes and key spacing values. Use CSS Grid and Flexbox, not fixed pixel layouts. Avoid hardcoding pixel breakpoints inside components; import from `src/lib/breakpoints.ts`.

**Touch targets:** Every interactive element (buttons, links, toggles, icons) must have a minimum 44×44px clickable area. Use CSS padding expansion rather than changing visual size.

**Animations:** All animations must respect `prefers-reduced-motion`. Use the `useAnimation` hook you create in Phase 1. Never use `animation` or `transition` directly on user-facing elements without gating it.

**Packages:** No new npm packages. Use only what is already in `package.json`. Seeded random: implement as a pure JS LCG function. Masonry: pure CSS Grid + JS column generation.

**Code style:** TypeScript strict. Named exports for all components. No default export for utility files. Memo-wrap components that receive the same props frequently (existing pattern in the codebase).

---

## Delivery

- After each phase is complete, send a concise summary of what was created/changed and which files were affected.
- Do NOT send full file contents inline after completing a phase.
- After ALL six phases are complete, send a single zip archive containing every file you created or modified, with exact directory structure preserved.

---
