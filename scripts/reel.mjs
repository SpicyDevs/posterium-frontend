#!/usr/bin/env node
/**
 * scripts/reel.mjs
 *
 * Generates a static masonry poster collage image for the Posterium homepage.
 * All posters maintain a strict 2:3 aspect ratio; scale varies per column span.
 * Every poster is dynamically generated with unique layout/style API parameters,
 * with a ~30% chance to use the minimal cinematic preset.
 *
 * The output is intentionally MASSIVE (20,000px wide) and is sliced into chunks 
 * to bypass the 16,383px dimension limits of WebP and JPEG encoders.
 *
 * Outputs:
 *   public/reel-mosaic-1.webp ... public/reel-mosaic-5.webp
 *   public/reel-mosaic-1.jpg  ... public/reel-mosaic-5.jpg
 *   public/reel-mosaic.json   ← metadata (dimensions, seed, poster list)
 *
 * Usage:
 *   node scripts/reel.mjs
 *   MOSAIC_SEED=99 node scripts/reel.mjs
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  seed: Number(process.env.MOSAIC_SEED ?? 67),
  
  canvasWidth: 20000,
  numCols: 60,
  numChunks: 5,
  chunkWidth: 4000,
  
  gap: 10,
  minHeight: 1200,
  doubleColChance: 0.22,
  gapFillThreshold: 80,
  
  showBadges: true,
  outputDir: 'public',
  outputName: 'reel-mosaic',
  webpQuality: 82,
  jpgQuality: 85,
  concurrency: 5,
  apiBase: 'https://api.spicydevs.xyz',
  background: { r: 7, g: 7, b: 6 },
};

// ─────────────────────────────────────────────────────────────────────────────
// POSTER POOLS
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
  { id: '603',    type: 'movie', title: 'The Matrix' },
  { id: '121',    type: 'movie', title: 'The Two Towers' },
  { id: '122',    type: 'movie', title: 'The Return of the King' },
  { id: '13',     type: 'movie', title: 'Forrest Gump' },
  { id: '111',    type: 'movie', title: 'Scarface' },
  { id: '807',    type: 'movie', title: 'Se7en' },
  { id: '24',     type: 'movie', title: 'Kill Bill: Vol. 1' },
  { id: '274',    type: 'movie', title: 'The Silence of the Lambs' },
  { id: '1573',   type: 'movie', title: 'Die Hard' },
  { id: '109',    type: 'movie', title: 'Predator' },
  { id: '8587',   type: 'movie', title: 'The Lion King' },
  { id: '354912', type: 'movie', title: 'Coco' },
  { id: '128',    type: 'movie', title: 'Princess Mononoke' },
  { id: '129',    type: 'movie', title: 'Spirited Away' },
  { id: '372058', type: 'movie', title: 'Your Name.' },
  { id: '5548',   type: 'movie', title: 'RoboCop' },
  { id: '564',    type: 'movie', title: 'The Mummy' },
  { id: '858',    type: 'movie', title: 'Sleepless in Seattle' },
  { id: '105',    type: 'movie', title: 'Back to the Future' },
  { id: '68718',  type: 'movie', title: 'Django Unchained' },
  { id: '299536', type: 'movie', title: 'Avengers: Infinity War' },
  { id: '118340', type: 'movie', title: 'Guardians of the Galaxy' },
  { id: '1726',   type: 'movie', title: 'Iron Man' },
  { id: '284054', type: 'movie', title: 'Black Panther' },
  { id: '22',     type: 'movie', title: 'Pirates of the Caribbean' },
  { id: '240832', type: 'movie', title: 'Lucy' },
  { id: '334',    type: 'movie', title: 'Jurassic Park' },
  { id: '629',    type: 'movie', title: 'The Usual Suspects' },
  { id: '77',     type: 'movie', title: 'Memento' },
  { id: '11324',  type: 'movie', title: 'Shutter Island' },
  { id: '389',    type: 'movie', title: '12 Angry Men' },
  { id: '37799',  type: 'movie', title: 'The Social Network' },
  { id: '324025', type: 'movie', title: '10 Cloverfield Lane' },
  { id: '1402',   type: 'tv',    title: 'The Walking Dead' },
  { id: '60059',  type: 'tv',    title: 'Better Call Saul' },
  { id: '1424',   type: 'tv',    title: 'Orange is the New Black' },
  { id: '1398',   type: 'tv',    title: 'The Sopranos' },
  { id: '1438',   type: 'tv',    title: 'The Wire' },
  { id: '4586',   type: 'tv',    title: 'The Office' },
  { id: '1100',   type: 'tv',    title: 'How I Met Your Mother' },
  { id: '1668',   type: 'tv',    title: 'Friends' },
  { id: '60625',  type: 'tv',    title: 'Rick and Morty' },
  { id: '94605',  type: 'tv',    title: 'Arcane' },
  { id: '82856',  type: 'tv',    title: 'The Mandalorian' },
  { id: '76479',  type: 'tv',    title: 'The Boys' },
  { id: '119051', type: 'tv',    title: 'Wednesday' },
  { id: '93405',  type: 'tv',    title: 'Squid Game' },
  { id: '81356',  type: 'tv',    title: 'Chernobyl' },
  { id: '1416',   type: 'tv',    title: "Grey's Anatomy" },
  { id: '71712',  type: 'tv',    title: 'The Good Doctor' },
  { id: '60573',  type: 'tv',    title: 'Silicon Valley' },
  { id: '48866',  type: 'tv',    title: 'The 100' },
  { id: '1412',   type: 'tv',    title: 'Arrow' },
  { id: '60735',  type: 'tv',    title: 'The Flash' },
  { id: '15860',  type: 'tv',    title: 'Narcos' },
  { id: '76669',  type: 'tv',    title: 'Elite' },
  { id: '66675',  type: 'tv',    title: 'House of Cards' },
  { id: '1435',   type: 'tv',    title: 'True Detective' },
  { id: '65494',  type: 'tv',    title: 'The Crown' }
];

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
  { id: '118',    type: 'movie', title: 'Charlie and the Chocolate Factory' },
  { id: '10138',  type: 'movie', title: 'Iron Man 2' },
  { id: '1771',   type: 'movie', title: 'Captain America: The First Avenger' },
  { id: '10195',  type: 'movie', title: 'Thor' },
  { id: '41154',  type: 'movie', title: 'Men in Black 3' },
  { id: '744',    type: 'movie', title: 'Top Gun' },
  { id: '604',    type: 'movie', title: 'The Matrix Reloaded' },
  { id: '605',    type: 'movie', title: 'The Matrix Revolutions' },
  { id: '607',    type: 'movie', title: 'Men in Black' },
  { id: '608',    type: 'movie', title: 'Men in Black II' },
  { id: '609',    type: 'movie', title: 'Poltergeist' },
  { id: '557',    type: 'movie', title: 'Spider-Man' },
  { id: '558',    type: 'movie', title: 'Spider-Man 2' },
  { id: '559',    type: 'movie', title: 'Spider-Man 3' },
  { id: '561',    type: 'movie', title: 'Constantine' },
  { id: '562',    type: 'movie', title: 'Die Hard 2' },
  { id: '563',    type: 'movie', title: 'Starship Troopers' }
];

// ─────────────────────────────────────────────────────────────────────────────
// RNG & UTILS
// ─────────────────────────────────────────────────────────────────────────────
function createRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generates unique layout properties and routing per poster.
 */
function generateRandomParams(rng, isMinimal) {
  if (isMinimal) {
    const source = rng() < 0.7 ? 'fanart' : 'tmdb';
    const tl = rng() < 0.8 ? '1' : '0';
    return `v=3&p=m&source=${source}&tl=${tl}`;
  }

  // Random badge slots
  const combos = ['i', 'i,r', 'i,r,a', 't,m', 'l', 'l,r', 'i,n', 'r,a', 'i,p'];
  const r = combos[Math.floor(rng() * combos.length)];
  const fb = 't,m';

  // Random layout properties
  const ra = [0, 8, 12, 16, 24, 70][Math.floor(rng() * 6)];
  
  // 50% glassmorphism, 50% solid
  let bl = 0;
  let al = 0.8 + rng() * 0.2; // 0.8 to 1.0
  if (rng() < 0.5) {
     bl = Math.floor(4 + rng() * 12); // blur 4-15
     al = 0.2 + rng() * 0.4; // alpha 0.2-0.6
  }

  const ub = rng() < 0.5 ? 1 : 0;
  const ic = rng() < 0.1 ? 0 : 1; 
  const li = rng() < 0.2 ? 1 : 0; 
  
  let params = `v=3&r=${r}&fb=${fb}&ra=${ra}&bl=${bl}&al=${al.toFixed(2)}&ub=${ub}&ic=${ic}`;
  
  if (li) {
    params += `&li=1&lp=above&ls=9`;
  }
  
  // 15% chance to force a custom background tint
  if (rng() < 0.15) {
     const colors = ['%230f0f0f', '%23332200', '%23003300', '%231a1a2e', 'rgba(255,255,255,0.08)'];
     params += `&bg=${colors[Math.floor(rng() * colors.length)]}`;
  }

  return params;
}

// ─────────────────────────────────────────────────────────────────────────────
// MASONRY LAYOUT ENGINE
// ─────────────────────────────────────────────────────────────────────────────
function computeLayout(items, cfg, colHeightsIn) {
  const { numCols, gap, canvasWidth } = cfg;
  const colWidth = Math.floor((canvasWidth - gap * (numCols + 1)) / numCols);

  const colHeights = colHeightsIn
    ? [...colHeightsIn]
    : Array(numCols).fill(gap);

  const placements = [];

  for (const item of items) {
    const { poster, span, preset, apiParams } = item;
    const effectiveSpan = Math.min(span, numCols);

    const w = colWidth * effectiveSpan + gap * (effectiveSpan - 1);
    const h = Math.round(w * 1.5); 

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

    placements.push({ poster, x, y, w, h, span: effectiveSpan, preset, apiParams });

    const newBottom = y + h + gap;
    for (let s = 0; s < effectiveSpan; s++) {
      colHeights[bestCol + s] = newBottom;
    }
  }

  const canvasHeight = Math.max(...colHeights) + gap;
  return { placements, colHeights, canvasHeight };
}

function fillGaps(colHeights, cfg, fillers, rng) {
  const { numCols, gap, canvasWidth, gapFillThreshold } = cfg;
  const colWidth = Math.floor((canvasWidth - gap * (numCols + 1)) / numCols);

  const heights      = [...colHeights];
  const extraItems   = [];
  let   fillerIdx    = 0;
  const MAX_ITER = numCols * 10;
  let   iter     = 0;

  while (iter++ < MAX_ITER) {
    const maxH   = Math.max(...heights);
    const shortCols = heights
      .map((h, i) => ({ col: i, h }))
      .filter(({ h }) => maxH - h > gapFillThreshold);

    if (shortCols.length === 0) break;

    const { col } = shortCols.sort((a, b) => a.h - b.h)[0];

    const poster = fillers[fillerIdx % fillers.length];
    fillerIdx++;

    const w = colWidth; 
    const h = Math.round(w * 1.5);
    const x = gap + col * (colWidth + gap);
    const y = heights[col];

    const isMinimal = rng() < 0.30;
    const apiParams = generateRandomParams(rng, isMinimal);

    extraItems.push({ poster, x, y, w, h, span: 1, preset: isMinimal ? 'minimal' : 'badge', apiParams });
    heights[col] = y + h + gap;
  }

  return {
    extraPlacements : extraItems,
    finalColHeights : heights,
    fillerCount     : fillerIdx,
  };
}

function buildLayout(posters, fillerPosters, cfg, rng) {
  const items = [];
  let pass    = 0;
  let result;

  while (true) {
    const shuffled = shuffle(posters, rng);
    for (const poster of shuffled) {
      const span = rng() < cfg.doubleColChance ? 2 : 1;
      const isMinimal = rng() < 0.30;
      const apiParams = generateRandomParams(rng, isMinimal);
      items.push({ poster, span, preset: isMinimal ? 'minimal' : 'badge', apiParams });
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

  const { extraPlacements, finalColHeights, fillerCount } = fillGaps(result.colHeights, cfg, fillerPosters, rng);

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
function posterUrl(placement, cfg) {
  const base = `${cfg.apiBase}/${placement.poster.type}/${placement.poster.id}.jpg`;
  const params = cfg.showBadges && placement.apiParams ? `?${placement.apiParams}` : '?v=3';
  return `${base}${params}`;
}

function posterFallbackUrl(placement, cfg) {
  return `${cfg.apiBase}/${placement.poster.type}/${placement.poster.id}.jpg`;
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
      batch.map(async (placement) => {
        const { poster, x, y, w, h } = placement;
        const url         = posterUrl(placement, cfg);
        const fallbackUrl = posterFallbackUrl(placement, cfg);

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
  console.log(`  Chunks      : ${CONFIG.numChunks} (${CONFIG.chunkWidth}px each)`);
  console.log(`  Columns     : ${CONFIG.numCols}`);
  console.log(`  Double-col  : ${Math.round(CONFIG.doubleColChance * 100)}% chance`);
  console.log(`  Gap fill    : ≤${CONFIG.gapFillThreshold}px threshold`);
  console.log(`  Badges      : ${CONFIG.showBadges ? 'yes (dynamic per poster)' : 'no'}`);
  console.log(`  Posters     : ${POSTERS.length} main + ${FILLER_POSTERS.length} fillers`);
  console.log('');

  // ── 1. Compute layout ──────────────────────────────────────────────────
  console.log('Step 1/4  Computing layout...');
  const rng = createRng(CONFIG.seed);
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
  console.log('Step 4/4  Encoding & writing chunked files...');

  const outDir = path.join(ROOT, CONFIG.outputDir);
  await mkdir(outDir, { recursive: true });

  const basePath = path.join(outDir, CONFIG.outputName);
  const encodePromises = [];
  
  for (let i = 0; i < CONFIG.numChunks; i++) {
    const left = i * CONFIG.chunkWidth;
    const chunkWebpPath = `${basePath}-${i + 1}.webp`;
    const chunkJpgPath  = `${basePath}-${i + 1}.jpg`;

    const extractChunk = () => sharp(rawPixels, {
      raw: { width: info.width, height: info.height, channels: info.channels }
    }).extract({ left, top: 0, width: CONFIG.chunkWidth, height: info.height });

    encodePromises.push(
      extractChunk()
        .webp({ quality: CONFIG.webpQuality, effort: 4, smartSubsample: true })
        .toFile(chunkWebpPath)
        .then(() => console.log(`  ✓  ${chunkWebpPath}`))
    );
    encodePromises.push(
      extractChunk()
        .jpeg({ quality: CONFIG.jpgQuality, mozjpeg: true, chromaSubsampling: '4:2:0' })
        .toFile(chunkJpgPath)
        .then(() => console.log(`  ✓  ${chunkJpgPath}`))
    );
  }

  await Promise.all(encodePromises);

  const jsonPath = `${basePath}.json`;
  const meta = {
    generatedAt : new Date().toISOString(),
    seed        : CONFIG.seed,
    canvasWidth : info.width,
    canvasHeight: info.height,
    numChunks   : CONFIG.numChunks,
    chunkWidth  : CONFIG.chunkWidth,
    numCols     : CONFIG.numCols,
    gap         : CONFIG.gap,
    showBadges  : CONFIG.showBadges,
    gapFillThreshold: CONFIG.gapFillThreshold,
    placements  : placements.map(({ poster, x, y, w, h, span, preset, apiParams }) => ({
      id       : poster.id,
      type     : poster.type,
      title    : poster.title,
      preset   : preset || undefined,
      apiParams: apiParams,
      x, y, w, h, span,
    })),
  };
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(jsonPath, JSON.stringify(meta, null, 2))
  );
  console.log(`  ✓  ${jsonPath}`);

  console.log('');
  console.log(`Done!  ${info.width}×${info.height}px (${CONFIG.numChunks} chunks) · ${placements.length} placements`);
  console.log(`Tip: regenerate with a different seed:  MOSAIC_SEED=<n> node scripts/reel.mjs`);
}

main().catch(err => {
  console.error('\n✗  Fatal error:', err.message ?? err);
  process.exit(1);
});