---
name: Posterium
description: "The Projection Booth — a dark-room cinema interface where projector amber lights the work"
colors:
  projector-amber: "#c47c2e"
  dusk-gold: "#d4a245"
  curtain-red: "#a82018"
  cinema-black: "#070706"
  velvet-umber: "#0e0d0b"
  celluloid-umber: "#181612"
  char-umber: "#222018"
  dust-umber: "#453f37"
  screen-cream: "#f0e6cc"
  reel-pale: "#e8d8a8"
  reel-white: "#faf6ec"
  lobby-silver: "#b0a898"
  text-body: "rgba(230, 218, 196, 0.92)"
  text-label: "rgba(212, 198, 172, 0.82)"
  text-dim: "rgba(206, 193, 170, 0.82)"
  text-ghost: "rgba(178, 166, 146, 0.58)"
  text-muted: "rgba(122, 117, 110, 0.5)"
  text-faint: "rgba(110, 104, 96, 0.6)"
  glass: "rgba(255, 255, 255, 0.04)"
  brass: "rgba(180, 150, 80, 0.55)"
typography:
  display:
    fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif"
    fontSize: "clamp(88px, 13vw, 200px)"
    fontWeight: 400
    lineHeight: 0.84
    letterSpacing: "0.03em"
  headline:
    fontFamily: "'Syne', sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  title:
    fontFamily: "'Syne', sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "0.07em"
    textTransform: "uppercase"
  body:
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  prose:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "9px"
    fontWeight: 400
    letterSpacing: "0.12em"
    textTransform: "uppercase"
  button-label:
    fontFamily: "'Syne', sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.08em"
    textTransform: "uppercase"
  tag-label:
    fontFamily: "'Syne', sans-serif"
    fontSize: "9px"
    fontWeight: 700
    letterSpacing: "0.14em"
    textTransform: "uppercase"
  scale:
    micro: "8px"
    stamp: "9px"
    chrome: "10px"
    chrome-md: "11px"
    chrome-lg: "12px"
    chrome-xl: "13px"
    body-lg: "15px"
    body-2xl: "17px"
    logo: "18px"
    lead-xl: "22px"
    display-xs: "28px"
    display-sm: "32px"
    display-md: "34px"
    display-lg: "36px"
    display-xl: "38px"
    display-2xl: "40px"
    display-3xl: "44px"
    display-4xl: "52px"
    display-5xl: "60px"
    display-6xl: "64px"
    stat: "56px"
    stat-xl: "96px"
    display-7xl: "72px"
    display-8xl: "160px"
    display-9xl: "168px"
    display-10xl: "180px"
rounded:
  stamp: "2px"
  stamp-md: "3px"
  button: "4px"
  poster: "6px"
  field: "8px"
  card: "10px"
  panel: "12px"
  panel-lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.projector-amber}"
    textColor: "{colors.cinema-black}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.projector-amber}"
    textColor: "{colors.cinema-black}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    textColor: "{colors.screen-cream}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "11px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-label}"
    typography: "{typography.button-label}"
    rounded: "{rounded.button}"
    padding: "8px 14px"
  tag-amber:
    backgroundColor: "rgba(196, 124, 46, 0.1)"
    textColor: "{colors.projector-amber}"
    typography: "{typography.tag-label}"
    rounded: "{rounded.stamp}"
    padding: "3px 9px"
  input-search:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    textColor: "{colors.screen-cream}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    height: "34px"
    padding: "0 10px"
  card-default:
    backgroundColor: "rgba(24, 22, 18, 0.6)"
    textColor: "{colors.text-body}"
    rounded: "{rounded.card}"
    padding: "{spacing.md}"
---

# Design System: Posterium

## Overview

**Creative North Star: "The Projection Booth"**

Posterium is a dark room built around one beam of projector amber. The interface is a cinema interior after the lights go down: near-black velvet surfaces, hairline amber edges where surfaces meet, and color deployed the way a projectionist uses a light source — sparingly, pointedly, and always where the eye should land next. Nothing here glows for decoration; everything that glows is something you can press, read, or watch change.

The aesthetic philosophy is *restrained, precision cinema*. Density is real but ordered: the system leans on tiny exact details — 2px ticket-stamp tags, sprocket-hole perforations, corner brackets, 8px mono microlabels — so the surfaces stay quiet while the details carry the theater. Postures are theatrical only where the product is the theater: the hero wordmark (a two-tone POSTER/IUM with an amber-stroked second half), the film-frame carousels, the floating poster reels. Everything else stays disciplined, because the primary job of most screens is Operate: scan, adjust, ship a URL.

The typographic voice is a poster house meets Swiss precision. Bebas Neue delivers condensed, all-caps display; Syne carries headings and chrome with wide tracking; Plus Jakarta Sans and DM Sans handle reading; JetBrains Mono stamps microlabels and captions.

**Key Characteristics:**

- Near-black amber-tinted neutrals only — no pure grays, no blues, no cold whites
- Amber is the sole light source; gold is its hot reflection, red is the alarm
- Hairline amber borders (0.08–0.28 alpha) define surfaces; fills are rare
- All-caps chrome typography with wide tracking; sentence-case body copy
- Cinema artifacts (sprockets, corners, stamps) as precision details, never decoration
- Shadows mean light: glow on interactive elements, deep darkness under posters

## Colors

One warm world: black-and-umber neutrals carrying a single amber light source, with gold as the lit edge and red as the only emergency.

### Primary

- **Projector Amber** (#c47c2e): The light source. Primary CTAs, active/selected states, slider thumbs, focus rings, glows, icon hovers. Appears as a fill only on the primary CTA and status moments; elsewhere it is a glow, a hairline, or a small stamp. Every amber accent should answer "what am I pointing at?"

### Secondary

- **Dusk Gold** (#d4a245): Amber's hot edge — links inside prose, hover brightening, scrollbar gradients, carousel control hover. Use for interactive text that must read as "warmly alive" without shouting.

### Tertiary

- **Curtain Red** (#a82018): The alarm. Destructive actions, error accents, low-score signals (Rotten Tomatoes red family). Never decorative; when red appears, something is a problem or a verdict.

### Neutral

- **Cinema Black** (#070706): The room itself — page background. All screens sit on it.
- **Velvet Umber** (#0e0d0b): Raised surfaces — nav bars, drawers, sidebars (translucent at 0.72 alpha).
- **Celluloid Umber** (#181612): Cards and panels (translucent at 0.6 alpha).
- **Char Umber** (#222018): Deepest inset surfaces, hover fills.
- **Dust Umber** (#453f37): Secondary borders, disabled chrome.
- **Screen Cream** (#f0e6cc): Primary text on dark — headings, strong copy.
- **Reel Pale** (#e8d8a8): Highlights, code text, table headers — cream with a push toward gold.
- **Lobby Silver** (#b0a898): Secondary text, subdued links, descriptions.
- **Reel White** (#faf6ec): The brightest text and the dark-on-amber button text.
- **Text roles**: body `rgba(230,218,196,0.92)`, label `rgba(212,198,172,0.82)`, dim `rgba(206,193,170,0.82)`, ghost `rgba(178,166,146,0.58)` — the reading ladder under screen-cream.

### Named Rules

**The Light-Source Rule.** Projector Amber covers a small fraction of any screen. Its rarity is its power: a screen full of amber is a screen that points at nothing.

**The Hairline Rule.** Amber appears most often at 0.08–0.28 alpha as a border or glow, never as a mid-opacity fill. When a surface needs more amber, increase the light (glow, hover), not the fill.

**The No-Cold-Colors Rule.** No blues, no pure grays, no cold whites. Every neutral leans warm; every bright text carries a hint of cream or gold.

## Typography

**Display Font:** Bebas Neue (with Arial Narrow fallback)
**Headline Font:** Syne (600–800)
**Body Font:** Plus Jakarta Sans (300–700) for chrome/UI; DM Sans (variable) for prose content
**Label/Mono Font:** JetBrains Mono (variable)

**Character:** A poster house run by a Swiss typesetter. Bebas Neue is the marquee — tall, condensed, all-caps, set tight with a near-unit line height. Syne is the geometric-but-arty voice for headings and chrome, always letter-spaced. Reading text is quietly humanist. Mono is the projectionist's clipboard: tiny, uppercase, wide-tracked.

### Hierarchy

The scale is a tiny-chrome cinema system: display type carries the voice, chrome runs 10–13px, microlabels floor at 8px, and nothing below 8px ships. Steps: micro 8 / stamp 9 / chrome 10–13 / body 14 / body-lg 15 / title 16 / prose 17 / logo 18 / headline 20 / display 28–160.

- **Display** (400, clamp(88px,13vw,200px), 0.84): Hero wordmark only. Line-height 0.84 is intentional — tight as a marquee.
- **Display secondary** (700, 28–160px): Section headers (36–72px), stat numerals (56–96px), CTA display (60–160px), footer titles (28–44px). One marquee voice, sized to surface authority.
- **Headline** (700, 20px, 1.2): Section and prose headings. Letter-spacing 0.02em.
- **Title** (600, 16px, uppercase, 0.07em): Sub-headings, panel titles, uppercase calls inside content.
- **Body** (400, 14px, 1.65): UI copy, cards, descriptions. Max line length ~65–75ch in prose.
- **Body large** (400, 15px): Feature descriptions and lead copy under display type.
- **Prose** (400, 14px, 1.65): Markdown content — DM Sans, with links in dusk-gold and code in reel-pale on glass wells.
- **Chrome** (700, 10–13px, uppercase, 0.08–0.14em): Nav links, button labels, table cells, feature names — the interface voice.
- **Label** (400, 8–9px, uppercase, 0.12em): Microlabels, captions, badge subtext, film-frame title bars — the projectionist's clipboard voice. 8px is the floor; 7px never ships.

### Named Rules

**The Showtime Rule.** All chrome text — buttons, nav links, tags, panel titles, microlabels — is uppercase with wide tracking. Sentence case appears only in reading copy. Uppercase is the interface's voice; lowercase is its content.

**The Microlabel Rule.** Mono microlabels stay at 8–9px with 0.12em tracking. Never enlarge them; scale their container instead.

## Layout

- Containers: hero max-width 1280px; docs/content max-width 1240px; both centered with `clamp(40px, 5vw, 72px)` side padding.
- Docs layout: `grid-template-columns: minmax(220px, 280px) minmax(0, 1fr)` with a sticky sidebar (top 84px, max-height `calc(100dvh - 100px)`); collapses to single column at 960px.
- Breakpoints: 960px (docs collapse), 820px (hero grid → single column, mobile poster peek appears), 768px (nav links → hamburger, desktop reel → mobile reel), 640px (feature panes stack), 600px (integration grids compress), 540px/500px (integration grid → 1 column, stats → 1 column).
- Posters are always 2:3 aspect, radius 6px, hairlined.
- Rhythm: 4 / 8 / 12 / 16 / 20 / 24 / 32px (xs → 3xl). Sections breathe on 32–40px+; controls sit on 8–16px.
- Below-fold sections use `content-visibility: auto` with `contain-intrinsic-size: 600px`.

## Elevation & Depth

Depth is **layered, with shadows as light**. The system builds hierarchy three ways: tonal layering (cinema-black → velvet-umber → celluloid-umber, always translucent), hairline amber borders, and light — glow on anything interactive, deep darkness beneath anything showcased.

### Shadow Vocabulary

- **Light-source glow** (`0 0 26px rgba(196,124,46,0.2), 0 4px 16px rgba(0,0,0,0.42)`): Primary CTAs at rest. Hover intensifies to `0 0 44px rgba(196,124,46,0.4), 0 8px 28px rgba(0,0,0,0.52)`.
- **Stage shadow** (`0 32px 80px rgba(0,0,0,0.8)` + amber rim `0 0 60px rgba(196,124,46,0.08)`): Featured posters and showcases — the artifact on the pedestal.
- **Film-frame hover** (lift `translateY(-8px) scale(1.05)`, 0.38s `cubic-bezier(0.16,1,0.3,1)`): Poster cards rise with a slow exhale; z-index jumps so the raised card overlaps siblings.

### Named Rules

**The Shadow-as-Light Rule.** Shadows are reserved for light sources (interactive amber elements) and stages (showcased posters). Ordinary surfaces — cards, panels, nav — carry no drop shadow; their depth comes from tone and hairlines.

## Shapes

A two-radius economy: **punched** and **housed**. Micro-elements are punched — ticket-stamp tags and sprocket holes at 2px radius, buttons at 4px, posters at 6px. Surfaces that hold content are housed — inputs at 8px, cards at 10px, sidebars and panels at 12px. Sliders and scrollbars go fully pill.

Recurring film artifacts:

- **Sprocket holes**: 20×13px near-rectangles, 2px radius, `1.5px solid rgba(255,255,255,0.1)` borders, rhythmically placed along edges (strips, dividers).
- **Film corners**: 10px amber corner brackets (`1.5px solid rgba(196,124,46,0.4)`), inset 8px — the "framed" marker for posters, hero art, and the builder's preview canvas.
- **Hairlines**: every surface meets its neighbor with a 1px border at 0.08–0.28 alpha — amber for brand surfaces, white for glass surfaces.
- The **stamp** language: amber tags and carousel dots sit at 2–3px radius — punched, not rounded.

## Components

### Buttons

- **Character:** Ticket stubs — stamped, uppercase, wide-tracked, with a short exhale on hover.
- **Shape:** Radius 4–6px. Primary `12px 24px`; secondary `11px 20px`; ghost `8px 14px`.
- **Primary:** Projector amber fill, cinema-black text (Syne 700, 11px, 0.08em, uppercase), `1px solid rgba(196,124,46,0.25)` border, light-source glow. Hover: glow swells to 44px and the button lifts 2px. Active: lift returns.
- **Hover / Focus:** Transitions `opacity 0.15s, background 0.15s`; focus ring is projector-amber, 2px, 2px offset (outline style, never box-shadow on focus).
- **Secondary:** Glass well (`rgba(255,255,255,0.03)`) with a white hairline; cream text; border brightens to `rgba(196,124,46,0.32)` and text warms to screen-cream on hover.
- **Ghost:** Transparent, label-toned text, no border at rest; warms on hover.

### Chips / Tags

- **Style:** The ticket stamp — projector amber at 10% fill, 28% border, amber text, 2px radius, Syne 700 9px with 0.14em tracking, uppercase. `padding: 3px 9px`.
- **State:** Tags are read-only stamps; filtering chips mirror the same shape with pressed (amber 14% fill, 28% border) and selected (solid amber, black text) states.

### Cards / Containers

- **Corner Style:** 10px.
- **Background:** Celluloid umber at 0.6 alpha (default), `linear-gradient(180deg, rgba(24,22,18,0.72), rgba(11,10,9,0.84))` (elevated), velvet umber at 0.72 (bordered).
- **Shadow Strategy:** None at rest — tone + hairline only (see Shadow-as-Light Rule).
- **Border:** `1px solid rgba(196,124,46,0.14)`.
- **Internal Padding:** 10px (sm) / 14px (md) / 18px (lg); `overflow: hidden` clips children to the 10px radius.

### Inputs / Fields

- **Style:** Glass wells — `rgba(255,255,255,0.03)` fill, `1px solid rgba(255,255,255,0.08)` stroke, 8px radius, 34px height (search), dim placeholder text.
- **Focus:** Projector-amber outline, 2px, 2px offset. No glow — the field is a well, not a light source.
- **Error / Disabled:** Errors use curtain-red hairline + text; disabled drops to ghost alpha with `cursor: not-allowed`.

### Navigation

- Links are Syne, uppercase, 0.08em tracking, label-toned; hover warms to lobby-silver→screen-cream with a 0.18s color fade; active sections glow amber. Desktop bar is hairline-bottomed velvet umber; mobile uses a hamburger into a slide-in panel with the same link language. Slash (`/`) or Ctrl/Cmd+F focuses the search well.
- **Signature — Film Frame:** The poster showcase — 2:3 art at 6px radius inside a 1px amber 0.18 hairline, film corners at the inset, stage shadow beneath, and a mono 8px amber 0.65 uppercase caption bar fading up from the base. Hover lifts it 8px and scales 1.05.
- **Signature — Hero Wordmark:** `POSTER` in screen-cream above `IUM` in transparent fill with a 2px projector-amber `WebkitTextStroke` — solid film + projected light in one word.
- **Signature — Sprocket Strip:** The film edge; rows of punched holes with `1.5px rgba(255,255,255,0.1)` borders, used as dividers and frame edges.

## Do's and Don'ts

### Do:

- **Do** start every surface on cinema-black and climb through velvet/celluloid umbers for hierarchy.
- **Do** use amber as a light source: CTAs, active states, focus rings, glows — and keep it rare.
- **Do** stamp micro-elements (tags, dots, sprockets) at 2–3px radius; they read as punched.
- **Do** set chrome text (buttons, nav, tags, microlabels) in uppercase Syne or 8–9px JetBrains Mono with wide tracking.
- **Do** keep reading copy in sentence case in DM Sans / Plus Jakarta Sans.
- **Do** give hover states an exhale: 0.18–0.38s, `cubic-bezier(0.16,1,0.3,1)` for lifts.
- **Do** respect `prefers-reduced-motion` — durations collapse to 0.01ms.
- **Do** hairline every surface junction at 0.08–0.28 alpha rather than filling.

### Don't:

- **Don't** use drop shadows on ordinary cards or panels — tone and hairlines do that work.
- **Don't** use cold colors (blues, pure grays, cold whites) anywhere — the room is warm-lit.
- **Don't** enlarge microlabels; scale their container instead.
- **Don't** set body copy in Bebas Neue, Syne, or uppercase.
- **Don't** make amber fills compete — the primary CTA is the only standard amber fill at rest.
- **Don't** introduce new corner radii between 2px and 4px, or between 8px and 10px — the economy is punched vs. housed.