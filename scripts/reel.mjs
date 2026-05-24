#!/usr/bin/env node
/**
 * scripts/reel.mjs
 *
 * Generates a static masonry poster collage image for the Posterium homepage.
 * All posters maintain a strict 2:3 aspect ratio; scale varies per column span.
 *
 * The output is intentionally WIDE (horizontal) so the dashboard can pan it
 * horizontally as the user scrolls vertically — a scroll-driven parallax reel.
 *
 * Outputs:
 *   public/reel-mosaic.webp   ← primary (use this in <picture>)
 *   public/reel-mosaic.jpg    ← fallback
 *   public/reel-mosaic.json   ← metadata (dimensions, seed, poster list)
 *
 * Usage:
 *   node scripts/reel.mjs
 *   MOSAIC_SEED=99 node scripts/reel.mjs
 *
 * One-time dep install:
 *   npm install --save-dev sharp
 *
 * To add/remove posters:        edit the POSTERS array below.
 * To add/remove filler posters: edit the FILLER_POSTERS array below.
 * To change the layout:         tweak the CONFIG section below.
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — edit freely, then re-run the script
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  /** Integer seed. Change → different poster order / span assignments. */
  seed: Number(process.env.MOSAIC_SEED ?? 67),

  /**
   * Total pixel width of the output image.
   * Intentionally wider than any viewport — the UI pans it horizontally.
   * At 4000px, a 1920px-wide screen gets ~2080px of pan range.
   */
  canvasWidth: 4000,

  /**
   * Number of base columns in the masonry grid.
   * More columns → smaller individual posters, denser layout.
   */
  numCols: 12,

  /** Gap (px) between every poster, and between posters and the canvas edge. */
  gap: 10,

  /**
   * Minimum canvas height (px). The script tiles posters until this is met.
   * 1200px ensures good coverage across most viewport heights.
   */
  minHeight: 1200,

  /**
   * 0–1 probability that a given poster spans 2 columns instead of 1.
   * Lower → more uniform density, better for a wide panoramic strip.
   */
  doubleColChance: 0.22,

  /**
   * Gap-fill: how close (in px) a column's bottom must be to the tallest
   * column before we consider it "filled enough" and stop inserting extras.
   * Smaller → tighter fill, more filler posters used.
   * Larger → allows more variance, fewer inserts.
   */
  gapFillThreshold: 80,

  /**
   * Whether to include rating badges on each poster.
   * true  → fetches from the Posterium API with badge overlay
   * false → fetches raw TMDB artwork (no badge, slightly faster)
   */
  showBadges: true,

  /** Badge params appended when showBadges is true. */
  badgeParams: 'r=imdb&source=tmdb&blur=7&alpha=0.38&rad=9&imdb_x=8&imdb_y=10',

  /** Output directory, relative to project root. */
  outputDir: 'public',

  /** Base filename (extensions .webp / .jpg / .json are appended). */
  outputName: 'reel-mosaic',

  /** WebP quality (0–100). 80–85 is a good balance of quality/size. */
  webpQuality: 82,

  /** JPEG quality (0–100). Used for the fallback .jpg. */
  jpgQuality: 85,

  /** Maximum simultaneous HTTP downloads. Keep ≤ 6 to be API-polite. */
  concurrency: 5,

  /** Base URL of the Posterium API. */
  apiBase: 'https://api.spicydevs.xyz',

  /** Dark background colour matching --film-black. */
  background: { r: 7, g: 7, b: 6 },
};

// ─────────────────────────────────────────────────────────────────────────────
// POSTERS — main pool, shuffled and tiled to fill the canvas
// ─────────────────────────────────────────────────────────────────────────────
/** @type {Array<{ id: string; type: 'movie' | 'tv'; title: string }>} */
const POSTERS = [
  { id: '155',    type: 'movie', title: 'The Dark Knight' },
  { id: '27205',  type: 'movie', title: 'Inception' },
  { id: '872585', type: 'movie', title: 'Oppenheimer' },
  { id: '238',    type: 'movie', title: 'The Godfather' },
  { id: '157336', type: 'movie', title: 'Interstellar' },
  { id: '680',    type: 'movie', title: 'Pulp Fiction' },
  { id: '278',    type: 'movie', title: 'The Shawshank Redemption' },
  { id: '550',    type: 'movie', title: 'Fight Club' },
  { id: '634649', type: 'movie', title: 'Spider-Man: No Way Home' },
  { id: '1396',   type: 'tv',    title: 'Breaking Bad' },
  { id: '424',    type: 'movie', title: "Schindler's List" },
  { id: '1399',   type: 'tv',    title: 'Game of Thrones' },
  { id: '66732',  type: 'tv',    title: 'Stranger Things' },
  { id: '475557', type: 'movie', title: 'Joker' },
  { id: '76341',  type: 'movie', title: 'Mad Max: Fury Road' },
  { id: '11',     type: 'movie', title: 'Star Wars' },
  { id: '120',    type: 'movie', title: 'The Fellowship of the Ring' },
  { id: '346698', type: 'movie', title: 'Barbie' },
  { id: '98',     type: 'movie', title: 'Gladiator' },
  { id: '315162', type: 'movie', title: 'Puss in Boots 2' },
  { id: '324857', type: 'movie', title: 'Spider-Man: Into the Spider-Verse' },
  { id: '19995',  type: 'movie', title: 'Avatar' },
];

// ─────────────────────────────────────────────────────────────────────────────
// FILLER POSTERS — used exclusively by the gap-fill pass.
//
// These are drawn round-robin (not randomly) to patch columns that finish
// significantly below the tallest column after the main layout.  They are
// always placed as single-span (width-1) posters so they slot cleanly into
// a single short column without disturbing the rest of the grid.
//
// Tip: keep this list at least as long as `numCols` (12) so the round-robin
// never has to repeat the same poster twice in the same gap-fill run.
// ─────────────────────────────────────────────────────────────────────────────
/** @type {Array<{ id: string; type: 'movie' | 'tv'; title: string }>} */
const FILLER_POSTERS = [
  { id: '299534', type: 'movie', title: 'Avengers: Endgame' },
  { id: '496243', type: 'movie', title: 'Parasite' },
  { id: '244786', type: 'movie', title: 'Whiplash' },
  { id: '264644', type: 'movie', title: 'Room' },
  { id: '205596', type: 'movie', title: 'The Imitation Game' },
  { id: '329865', type: 'movie', title: 'Arrival' },
  { id: '438631', type: 'movie', title: 'Dune' },
  { id: '361743', type: 'movie', title: 'Top Gun: Maverick' },
  { id: '505642', type: 'movie', title: 'Black Panther: Wakanda Forever' },
  { id: '76492',  type: 'tv',    title: 'The Last of Us' },
  { id: '60574',  type: 'tv',    title: 'Peaky Blinders' },
  { id: '1418',   type: 'tv',    title: 'The Big Bang Theory' },
  { id: '84958',  type: 'tv',    title: 'Loki' },
  { id: '88396',  type: 'tv',    title: 'The Falcon and the Winter Soldier' },
  { id: '67178',  type: 'tv',    title: 'Westworld' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEEDED RNG  (Mulberry32 — fast, good quality, seedable)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns a deterministic pseudo-random number generator seeded with `seed`.
 * Each call to the returned function yields a float in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
function createRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using the provided seeded RNG.
 * Returns a new array; does not mutate the input.
 * @template T
 * @param {T[]} arr
 * @param {() => number} rng
 * @returns {T[]}
 */
function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// MASONRY LAYOUT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @typedef {{ poster: object; x: number; y: number; w: number; h: number; span: number }} Placement
 */

/**
 * Computes pixel placement for every poster in `items`.
 *
 * Algorithm:
 *   1. Each poster is randomly assigned a column span (1 or 2).
 *   2. We maintain an array of per-column pixel heights (initially = GAP).
 *   3. For each poster we find the starting column that minimises the maximum
 *      height across the required span — greedy "shortest-column" masonry.
 *   4. The poster is placed at (x, maxHeight) and the affected column heights
 *      are updated to maxHeight + posterH + GAP.
 *
 * @param {object[]}  items   Poster descriptors (poster, span pre-assigned)
 * @param {object}    cfg     CONFIG object
 * @param {number[]}  [colHeightsIn]  Optional pre-seeded column heights
 * @returns {{ placements: Placement[]; colHeights: number[]; canvasHeight: number }}
 */
function computeLayout(items, cfg, colHeightsIn) {
  const { numCols, gap, canvasWidth } = cfg;
  const colWidth = Math.floor((canvasWidth - gap * (numCols + 1)) / numCols);

  const colHeights = colHeightsIn
    ? [...colHeightsIn]
    : Array(numCols).fill(gap);

  /** @type {Placement[]} */
  const placements = [];

  for (const item of items) {
    const { poster, span } = item;
    const effectiveSpan = Math.min(span, numCols);

    const w = colWidth * effectiveSpan + gap * (effectiveSpan - 1);
    const h = Math.round(w * 1.5); // strict 2:3 ratio

    let bestCol  = 0;
    let bestMaxH = Infinity;

    const maxStart = numCols - effectiveSpan;
    for (let c = 0; c <= maxStart; c++) {
      let maxH = 0;
      for (let s = 0; s < effectiveSpan; s++) {
        if (colHeights[c + s] > maxH) maxH = colHeights[c + s];
      }
      if (maxH < bestMaxH) {
        bestMaxH = maxH;
        bestCol  = c;
      }
    }

    const x = gap + bestCol * (colWidth + gap);
    const y = bestMaxH;

    placements.push({ poster, x, y, w, h, span: effectiveSpan });

    const newBottom = y + h + gap;
    for (let s = 0; s < effectiveSpan; s++) {
      colHeights[bestCol + s] = newBottom;
    }
  }

  const canvasHeight = Math.max(...colHeights) + gap;
  return { placements, colHeights, canvasHeight };
}

/**
 * Gap-fill pass — runs after the main layout is stable.
 *
 * Any column whose bottom edge is more than `cfg.gapFillThreshold` px below
 * the tallest column receives single-span filler posters (drawn round-robin
 * from FILLER_POSTERS) until it falls within the threshold.
 *
 * Returns the additional placements only; callers concatenate them with the
 * main placements.
 *
 * @param {number[]}  colHeights   Live column-height array from the main layout
 * @param {object}    cfg
 * @param {object[]}  fillers      FILLER_POSTERS array
 * @returns {{ extraPlacements: Placement[]; finalColHeights: number[]; fillerCount: number }}
 */
function fillGaps(colHeights, cfg, fillers) {
  const { numCols, gap, canvasWidth, gapFillThreshold } = cfg;
  const colWidth = Math.floor((canvasWidth - gap * (numCols + 1)) / numCols);

  const heights      = [...colHeights];
  const extraItems   = [];
  let   fillerIdx    = 0;

  // Keep iterating until every column is within threshold of the tallest.
  // Cap iterations to prevent infinite loops on degenerate configs.
  const MAX_ITER = numCols * 10;
  let   iter     = 0;

  while (iter++ < MAX_ITER) {
    const maxH   = Math.max(...heights);
    const shortCols = heights
      .map((h, i) => ({ col: i, h }))
      .filter(({ h }) => maxH - h > gapFillThreshold);

    if (shortCols.length === 0) break;

    // Insert one filler poster into the shortest column.
    const { col } = shortCols.sort((a, b) => a.h - b.h)[0];

    const poster = fillers[fillerIdx % fillers.length];
    fillerIdx++;

    const w = colWidth; // always span 1
    const h = Math.round(w * 1.5);
    const x = gap + col * (colWidth + gap);
    const y = heights[col];

    extraItems.push({ poster, x, y, w, h, span: 1 });
    heights[col] = y + h + gap;
  }

  return {
    extraPlacements : extraItems,
    finalColHeights : heights,
    fillerCount     : fillerIdx,
  };
}

/**
 * Builds the full ordered item list, tiling the poster list until the
 * projected canvas height meets `cfg.minHeight`, then gap-fills short columns.
 *
 * @param {object[]}     posters
 * @param {object[]}     fillerPosters
 * @param {object}       cfg
 * @param {() => number} rng
 * @returns {{ placements: Placement[]; canvasHeight: number }}
 */
function buildLayout(posters, fillerPosters, cfg, rng) {
  const items = [];
  let pass    = 0;

  // ── Phase 1: tile main posters until minHeight is reached ─────────────
  let result;
  while (true) {
    const shuffled = shuffle(posters, rng);
    for (const poster of shuffled) {
      const span = rng() < cfg.doubleColChance ? 2 : 1;
      items.push({ poster, span });
    }

    result = computeLayout(items, cfg);
    pass++;

    if (result.canvasHeight >= cfg.minHeight) {
      console.log(`  Layout converged in ${pass} pass(es). Canvas height: ${result.canvasHeight}px`);
      break;
    }

    if (pass > 20) {
      console.warn('  Warning: minHeight not reached after 20 passes. Proceeding anyway.');
      break;
    }
  }

  // ── Phase 2: gap-fill short columns with filler posters ───────────────
  const { extraPlacements, finalColHeights, fillerCount } =
    fillGaps(result.colHeights, cfg, fillerPosters);

  if (fillerCount > 0) {
    console.log(`  Gap-fill: inserted ${fillerCount} filler poster(s) to patch short columns.`);
  } else {
    console.log('  Gap-fill: all columns within threshold — no fillers needed.');
  }

  const allPlacements = [...result.placements, ...extraPlacements];
  const canvasHeight  = Math.max(...finalColHeights) + cfg.gap;

  return { placements: allPlacements, canvasHeight };
}

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK
// ─────────────────────────────────────────────────────────────────────────────
function posterUrl(poster, cfg) {
  const base   = `${cfg.apiBase}/${poster.type}/${poster.id}.jpg`;
  const params = cfg.showBadges ? `?${cfg.badgeParams}` : '';
  return `${base}${params}`;
}

function posterFallbackUrl(poster, cfg) {
  return `${cfg.apiBase}/${poster.type}/${poster.id}.jpg`;
}

async function fetchBuffer(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = Math.min(1000 * Math.pow(2, attempt), 8000);
      console.warn(`    Retry ${attempt + 1}/${retries} in ${wait}ms (${err.message})`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

async function fetchAndResize(placements, cfg) {
  const results = [];
  const total   = placements.length;
  let   done    = 0;

  for (let i = 0; i < placements.length; i += cfg.concurrency) {
    const batch = placements.slice(i, i + cfg.concurrency);

    const batchResults = await Promise.all(
      batch.map(async ({ poster, x, y, w, h }) => {
        const url         = posterUrl(poster, cfg);
        const fallbackUrl = posterFallbackUrl(poster, cfg);

        let raw;

        try {
          raw = await fetchBuffer(url);
        } catch (primaryErr) {
          process.stdout.write(`\n  ↩  "${poster.title}" badge fetch failed, trying plain poster...`);
          try {
            raw = await fetchBuffer(fallbackUrl, 2);
          } catch {
            done++;
            console.warn(`\n  ✗  Skipped "${poster.title}" entirely: ${primaryErr.message}`);
            return null;
          }
        }

        try {
          const resized = await sharp(raw)
            .resize(w, h, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 90 })
            .toBuffer();

          done++;
          const pct = Math.round((done / total) * 100);
          process.stdout.write(
            `\r  [${pct.toString().padStart(3)}%] ${done}/${total}  ${poster.title.slice(0, 30).padEnd(30)}`
          );

          return { input: resized, left: x, top: y };
        } catch (sharpErr) {
          done++;
          console.warn(`\n  ⚠  Sharp error for "${poster.title}": ${sharpErr.message}`);
          return null;
        }
      })
    );

    results.push(...batchResults.filter(Boolean));
  }

  process.stdout.write('\n');
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('┌─────────────────────────────────────────┐');
  console.log('│  Posterium — Reel Mosaic Generator       │');
  console.log('└─────────────────────────────────────────┘');
  console.log(`  Seed        : ${CONFIG.seed}`);
  console.log(`  Canvas      : ${CONFIG.canvasWidth}px wide × ≥${CONFIG.minHeight}px tall`);
  console.log(`  Columns     : ${CONFIG.numCols}`);
  console.log(`  Double-col  : ${Math.round(CONFIG.doubleColChance * 100)}% chance`);
  console.log(`  Gap fill    : ≤${CONFIG.gapFillThreshold}px threshold`);
  console.log(`  Badges      : ${CONFIG.showBadges ? 'yes' : 'no'}`);
  console.log(`  Posters     : ${POSTERS.length} main + ${FILLER_POSTERS.length} fillers`);
  console.log('');

  // ── 1. Compute layout ──────────────────────────────────────────────────
  console.log('Step 1/4  Computing layout...');
  const rng                          = createRng(CONFIG.seed);
  const { placements, canvasHeight } = buildLayout(POSTERS, FILLER_POSTERS, CONFIG, rng);
  console.log(`  Total placements: ${placements.length}  (${CONFIG.canvasWidth}×${canvasHeight}px)`);
  console.log('');

  // ── 2. Download & resize ────────────────────────────────────────────────
  console.log('Step 2/4  Fetching & resizing posters...');
  const compositeInputs = await fetchAndResize(placements, CONFIG);
  console.log(`  Downloaded: ${compositeInputs.length}/${placements.length}`);
  console.log('');

  if (compositeInputs.length === 0) {
    console.error('  ✗  No images downloaded. Aborting.');
    process.exit(1);
  }

  // ── 3. Composite ───────────────────────────────────────────────────────
  console.log('Step 3/4  Compositing...');

  const rawComposite = await sharp({
    create: {
      width    : CONFIG.canvasWidth,
      height   : canvasHeight,
      channels : 3,
      background: CONFIG.background,
    },
  })
    .composite(compositeInputs)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: rawPixels, info } = rawComposite;
  console.log(`  Composited ${info.width}×${info.height}px  (${info.channels} channels)`);
  console.log('');

  // ── 4. Encode & write ──────────────────────────────────────────────────
  console.log('Step 4/4  Encoding & writing files...');

  const outDir = path.join(ROOT, CONFIG.outputDir);
  await mkdir(outDir, { recursive: true });

  const basePath = path.join(outDir, CONFIG.outputName);
  const webpPath = `${basePath}.webp`;
  const jpgPath  = `${basePath}.jpg`;
  const jsonPath = `${basePath}.json`;

  const fromRaw = () =>
    sharp(rawPixels, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    });

  await Promise.all([
    fromRaw()
      .webp({ quality: CONFIG.webpQuality, effort: 4, smartSubsample: true })
      .toFile(webpPath),

    fromRaw()
      .jpeg({ quality: CONFIG.jpgQuality, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toFile(jpgPath),
  ]);

  const meta = {
    generatedAt : new Date().toISOString(),
    seed        : CONFIG.seed,
    canvasWidth : info.width,
    canvasHeight: info.height,
    numCols     : CONFIG.numCols,
    gap         : CONFIG.gap,
    showBadges  : CONFIG.showBadges,
    gapFillThreshold: CONFIG.gapFillThreshold,
    placements  : placements.map(({ poster, x, y, w, h, span }) => ({
      id   : poster.id,
      type : poster.type,
      title: poster.title,
      x, y, w, h, span,
    })),
  };
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(jsonPath, JSON.stringify(meta, null, 2))
  );

  console.log('');
  console.log('  ✓  ' + webpPath);
  console.log('  ✓  ' + jpgPath);
  console.log('  ✓  ' + jsonPath);
  console.log('');
  console.log(`Done!  ${info.width}×${info.height}px · ${placements.length} placements`);
  console.log(`Tip: regenerate with a different seed:  MOSAIC_SEED=<n> node scripts/reel.mjs`);
}

main().catch(err => {
  console.error('\n✗  Fatal error:', err.message ?? err);
  process.exit(1);
});