#!/usr/bin/env node
/**
 * scripts/generate-reel-mosaic.mjs
 *
 * Generates a static masonry poster collage image for the Posterium homepage.
 * All posters maintain a strict 2:3 aspect ratio; scale varies per column span.
 *
 * Outputs:
 *   public/reel-mosaic.webp   ← primary (use this in <picture>)
 *   public/reel-mosaic.jpg    ← fallback
 *   public/reel-mosaic.json   ← metadata (dimensions, seed, poster list)
 *
 * Usage:
 *   node scripts/generate-reel-mosaic.mjs
 *   MOSAIC_SEED=99 node scripts/generate-reel-mosaic.mjs
 *
 * One-time dep install:
 *   npm install --save-dev sharp
 *
 * To add/remove posters: edit the POSTERS array below.
 * To change the layout:  tweak the CONFIG section below.
 */

import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
  seed: Number(process.env.MOSAIC_SEED ?? 42),

  /** Total pixel width of the output image. */
  canvasWidth: 2560,

  /**
   * Number of base columns in the masonry grid.
   * Posters that span 2 columns will be exactly 2× a base column wide.
   */
  numCols: 8,

  /** Gap (px) between every poster, and between posters and the canvas edge. */
  gap: 10,

  /**
   * The script tiles the poster list until canvasHeight ≥ this value.
   * Increase for a taller image (more rows).
   */
  minHeight: 1800,

  /**
   * 0–1 probability that a given poster spans 2 columns instead of 1.
   * Higher → more "featured" wide posters, fewer total rows.
   */
  doubleColChance: 0.28,

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
// POSTERS — add / remove / reorder as needed
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
// SEEDED RNG  (Mulberry32 — fast, good quality, seedable)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns a deterministic pseudo-random number generator seeded with `seed`.
 * Each call to the returned function yields a float in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
function createRng(seed) {
  let s = seed >>> 0; // force unsigned 32-bit
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
 *      height across the required span — i.e., greedy "shortest-column" masonry.
 *   4. The poster is placed at (x, maxHeight) and the affected column heights
 *      are updated to maxHeight + posterH + GAP.
 *
 * @param {object[]}  items   Poster descriptors (poster, span pre-assigned)
 * @param {object}    cfg     CONFIG object
 * @param {() => number} rng  Seeded RNG
 * @returns {{ placements: Placement[]; canvasHeight: number }}
 */
function computeLayout(items, cfg, rng) {
  const { numCols, gap, canvasWidth } = cfg;
  const colWidth = Math.floor((canvasWidth - gap * (numCols + 1)) / numCols);

  // Current pixel height of each column (starts at `gap` for top padding)
  const colHeights = Array(numCols).fill(gap);

  /** @type {Placement[]} */
  const placements = [];

  for (const item of items) {
    const { poster, span } = item;

    // Clamp span so it never exceeds available columns
    const effectiveSpan = Math.min(span, numCols);

    // Width = span × colWidth + (span-1) × gap (inter-column gaps within span)
    const w = colWidth * effectiveSpan + gap * (effectiveSpan - 1);
    const h = Math.round(w * 1.5); // strict 2:3 ratio

    // Find the starting column index that minimises the max height across span
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

    // Update heights for all columns covered by this poster
    const newBottom = y + h + gap;
    for (let s = 0; s < effectiveSpan; s++) {
      colHeights[bestCol + s] = newBottom;
    }
  }

  const canvasHeight = Math.max(...colHeights) + gap; // bottom padding = gap
  return { placements, canvasHeight };
}

/**
 * Builds the full ordered item list, tiling the poster list until the
 * projected canvas height meets `cfg.minHeight`.
 * Span assignments are deterministic (seeded RNG), so the same SEED always
 * produces the same layout regardless of how many passes are needed.
 *
 * @param {object[]}     posters
 * @param {object}       cfg
 * @param {() => number} rng
 * @returns {{ placements: Placement[]; canvasHeight: number }}
 */
function buildLayout(posters, cfg, rng) {
  const items = [];
  let pass    = 0;

  // Keep adding shuffled passes until minHeight is satisfied
  while (true) {
    const shuffled = shuffle(posters, rng);
    for (const poster of shuffled) {
      const span = rng() < cfg.doubleColChance ? 2 : 1;
      items.push({ poster, span });
    }

    const { placements, canvasHeight } = computeLayout(items, cfg, rng);
    pass++;

    if (canvasHeight >= cfg.minHeight) {
      console.log(`  Layout converged in ${pass} pass(es). Canvas height: ${canvasHeight}px`);
      return { placements, canvasHeight };
    }

    if (pass > 20) {
      // Safety valve — shouldn't happen with reasonable config
      console.warn('  Warning: minHeight not reached after 20 passes. Proceeding anyway.');
      return computeLayout(items, cfg, rng);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Builds the fetch URL for a given poster.
 * @param {{ id: string; type: string }} poster
 * @param {object} cfg
 * @returns {string}
 */
function posterUrl(poster, cfg) {
  const ext    = 'jpg'; // JPG from API → best sharp compatibility
  const base   = `${cfg.apiBase}/${poster.type}/${poster.id}.${ext}`;
  const params = cfg.showBadges ? `?${cfg.badgeParams}` : '';
  return `${base}${params}`;
}

/**
 * Downloads a URL and returns its body as a Buffer.
 * @param {string} url
 * @param {number} [retries=2]
 * @returns {Promise<Buffer>}
 */
async function fetchBuffer(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = (attempt + 1) * 800;
      console.warn(`    Retry ${attempt + 1}/${retries} after ${wait}ms (${err.message})`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

/**
 * Processes placements in batches of `cfg.concurrency`, fetching and resizing
 * each poster image.
 *
 * @param {Placement[]} placements
 * @param {object}      cfg
 * @returns {Promise<Array<{ input: Buffer; left: number; top: number }>>}
 */
async function fetchAndResize(placements, cfg) {
  const results = [];
  const total   = placements.length;
  let   done    = 0;

  for (let i = 0; i < placements.length; i += cfg.concurrency) {
    const batch = placements.slice(i, i + cfg.concurrency);

    const batchResults = await Promise.all(
      batch.map(async ({ poster, x, y, w, h }) => {
        const url = posterUrl(poster, cfg);
        try {
          const raw     = await fetchBuffer(url);
          const resized = await sharp(raw)
            .resize(w, h, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: 90 })  // intermediate quality; final encode is separate
            .toBuffer();

          done++;
          const pct = Math.round((done / total) * 100);
          process.stdout.write(
            `\r  [${pct.toString().padStart(3)}%] ${done}/${total}  ${poster.title.slice(0, 30).padEnd(30)}`
          );

          return { input: resized, left: x, top: y };
        } catch (err) {
          done++;
          console.warn(`\n  ⚠  Skipped "${poster.title}": ${err.message}`);
          return null; // skip this poster; gap remains dark
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
  console.log(`  Canvas width: ${CONFIG.canvasWidth}px`);
  console.log(`  Columns     : ${CONFIG.numCols}`);
  console.log(`  Min height  : ${CONFIG.minHeight}px`);
  console.log(`  Badges      : ${CONFIG.showBadges ? 'yes' : 'no'}`);
  console.log(`  Posters     : ${POSTERS.length} unique`);
  console.log('');

  // ── 1. Compute layout ──────────────────────────────────────────────────
  console.log('Step 1/4  Computing layout...');
  const rng                    = createRng(CONFIG.seed);
  const { placements, canvasHeight } = buildLayout(POSTERS, CONFIG, rng);
  console.log(`  Total placements: ${placements.length}  (${canvasHeight}px tall)`);
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
    .raw()          // keep in memory as raw RGB for dual encode
    .toBuffer({ resolveWithObject: true });

  const { data: rawPixels, info } = rawComposite;
  console.log(`  Composited ${info.width}×${info.height} px  (${info.channels} channels)`);
  console.log('');

  // ── 4. Encode & write ──────────────────────────────────────────────────
  console.log('Step 4/4  Encoding & writing files...');

  const outDir = path.join(ROOT, CONFIG.outputDir);
  await mkdir(outDir, { recursive: true });

  const basePath = path.join(outDir, CONFIG.outputName);
  const webpPath = `${basePath}.webp`;
  const jpgPath  = `${basePath}.jpg`;
  const jsonPath = `${basePath}.json`;

  // Shared sharp instance from raw pixels
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

  // Metadata sidecar — useful for <img width height> attributes
  const meta = {
    generatedAt : new Date().toISOString(),
    seed        : CONFIG.seed,
    canvasWidth : info.width,
    canvasHeight: info.height,
    numCols     : CONFIG.numCols,
    gap         : CONFIG.gap,
    showBadges  : CONFIG.showBadges,
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
  console.log(`To regenerate with a different layout: MOSAIC_SEED=<n> node scripts/generate-reel-mosaic.mjs`);
}

main().catch(err => {
  console.error('\n✗  Fatal error:', err.message ?? err);
  process.exit(1);
});