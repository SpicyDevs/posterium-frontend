---
target: homepage
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-08-17T16-07-52Z
slug: src-pages-index-astro
---
# Critique: Posterium Homepage

**Method: dual-agent (A: design review · B: detector evidence)**

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Reel progress + dots good; autoplay has no pause indicator; 8px mono captions |
| 2 | Match System / Real World | 3 | Domain language right; source count varies (10+ / a dozen / 12 / 20+); "Others" never named |
| 3 | User Control and Freedom | 2 | No pause for carousel or mobile iris; reel scroll-only; no stop for animations |
| 4 | Consistency and Standards | 2 | Green dot, blue/red/green stats, emoji icons violate DESIGN.md; "API Docs"→Features anchor; "Reel"→"THE GALLERY" |
| 5 | Error Prevention | 3 | No inputs to corrupt; but core flow (copy URL → paste in Plex) has no validation moment |
| 6 | Recognition Rather Than Recall | 3 | Anchor mismatches; autoplay forces recall of tiny captions |
| 7 | Flexibility and Efficiency | 3 | Deep links, hash tabs, one-click /build; homepage search shortcut is dead code |
| 8 | Aesthetic and Minimalist Design | 4 | Disciplined, warm, rare-amber, hairline economy — genuinely excellent |
| 9 | Error Recovery | 2 | 🎞 emoji fallback, "no poster" text — no retry or guidance |
| 10 | Help and Documentation | 3 | Docs/FAQ in nav; zero in-page guidance at the decision point; footer "API Docs" mislinks |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict

**High specificity, with two category-leak holes.** The cinema frame is welded to the product: POSTER/IUM stroke wordmark, sprockets, film corners, clapperboard CTA could not transplant to a generic SaaS page. But the StatsBar (blue/green/red top-lines) and the six emoji icons are stock SaaS wearing the cinema coat. Missing proof moment: the page never shows a poster *in a Plex library*.

**Deterministic scan:** 44 findings (1 confirmed false positive): 27 color advisories incl. green #36A240 ×3 and cold blue rgba(60,100,200,0.2) — direct violations of DESIGN.md's No-Cold-Colors rule; 16 font-size advisories (7–11px body copy below the 14px floor, plus large clamps 36–160px off the documented ramp). Detector confirmed by eye: the leaks Assessment A flagged are mechanical, not subjective.

**Visual overlays:** No browser tool in this session — no rendered-DOM overlay; fallback signal = source + detector evidence only.

## Overall Impression

A genuinely exceptional visual system with a leaky shell: the Projection Booth world is enforced and memorable, but the homepage's first second fails its first-time visitors (no product statement, no nav), and its last mile drifts below its own design floor. The single biggest opportunity: prove the product — a poster sitting in a Plex library — in the first viewport.

## What's Working

1. A real, enforced design system end-to-end — the strongest brand signal on the page.
2. Peak-end architecture: hero → scroll-driven reel → clapperboard CTA is a genuine emotional arc.
3. Engineering humility: static pre-downloaded posters, visibility-gated animation, reduced-motion, honest "Where we fall short" copy.

## Priority Issues

- **[P0] The page never states what the product is.** Hero copy assumes the workflow is known; reads as a fan-art gallery, not a Plex tool. *Fix:* one audience+job sentence or a 3-step "how it works" strip above the reel. `$impeccable clarify`
- **[P0] Navbar invisible on first paint** (`revealOnScroll`, opacity 0 until scrollY > 72% viewport). Still focusable — keyboard users tab into ghost links. *Fix:* logo visible immediately; `visibility:hidden` when hidden. `$impeccable adapt`
- **[P1] Post-reel content hidden until hydration** — SSR sections render opacity:0 gated on useInView inside client:idle; no-JS and slow connections get a blank middle. *Fix:* SSR visible, observer becomes enhancement. `$impeccable harden`
- **[P1] Autoplay fails WCAG 2.2.2** (4.5s cycle, no pause) + carousel ARIA: role-less `aria-label` div, all 6 slides in AT tree. *Fix:* pause on hover/focus + pause button, `role="group"`, `aria-hidden` inactive slides. `$impeccable audit`
- **[P1] The page drifts below its own design floor** — 7–11px descriptions (2.5:1 contrast stat copy), green/blue accents, emoji icons (detector: 27 color + 16 font-size advisories). *Fix:* raise descriptive copy to 12–14px, recolor to amber/neutral, monochrome SVG icons. `$impeccable typeset` + `$impeccable colorize`

## Persona Red Flags

**Jordan (first-timer):** no nav/logo on paint; "what is this?" never answered; four different source counts (10+/a dozen/12/20+); "Open Builder" jumps into a full editor SPA with zero context; the 7px API hints he'd need are the hardest text on the page; "Others" never named.

**Riley (stress tester):** carousel and mobile iris cannot be paused; nav lies twice ("API Docs"→Features anchor, "Reel"→"THE GALLERY"); green/blue/red exactly where the system forbids; reel scroll-only, no scrub; no-JS run blanks the entire middle of the page.

**Casey (mobile, slow):** no hamburger or Build button until scrolling; ~35px 11px CTAs in the lower thumb zone; hover-only overlays hide card metadata (no tap affordance, 22 cards of artwork); post-reel opacity:0 while chunks download; 33-cell stacked comparison; 10px stat sub-copy unreadable outdoors.

## Minor Observations

- Carousel counter animation delays number readability on slow devices.
- Hidden GitHub link (`href="#"`, aria-hidden, tabIndex=-1) is dead weight.
- Comparison sticky header (top:52) collides with 56px nav.
- "That's the whole flow." — the best line on the page, wasted at the bottom.
- Reel progress bar implies draggability that doesn't exist (touchAction pan-y good).

## Questions to Consider

1. What is the page's first-second job — admire the wordmark, or know this is for your Plex library?
2. Does the 50/50 developer audience get served? No curl example, no code-first path exists.
3. Who is "Others"? Would a real preset-vs-per-pixel side-by-side (actual posters, not checkmarks) be more persuasive than named competition?
4. Where is the proof moment — a poster in a Plex UI, Discord embed, or Notion database?
