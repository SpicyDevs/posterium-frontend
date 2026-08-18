#!/usr/bin/env node
/**
 * scripts/fetch-home-posters.mjs
 *
 * Pre-downloads every poster used on the homepage at build time so the live
 * site never hits the poster API at runtime (~1s per generated image).
 *
 * Outputs:
 *   public/images/home-posters/hero-<id>.webp  ← 6 hero carousel posters (exact params from HeroSection)
 *   public/images/home-posters/reel-<id>.webp  ← mobile reel grid posters (params from FilmReelSection)
 *   src/generated/homePosters.ts               ← static URL map consumed by the components
 *
 * Usage:
 *   node scripts/fetch-home-posters.mjs            # fetch missing/stale files
 *   FORCE=1 node scripts/fetch-home-posters.mjs    # refresh everything
 *   SKIP=1 node scripts/fetch-home-posters.mjs     # regenerate map only (no downloads)
 *
 * Run manually (like scripts/reel.mjs) before deploying; Cloudflare's build
 * does NOT run this — it only runs `astro build` against committed outputs.
 */

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'home-posters');
const MAP_FILE = path.join(ROOT, 'src', 'generated', 'homePosters.ts');
const CONSTANTS_FILE = path.join(ROOT, 'src', 'lib', 'dashboard', 'constants.ts');

const API_BASE = process.env.PUBLIC_API_URL ?? 'https://api.posterium.xyz';
const FORCE = Boolean(process.env.FORCE);
const SKIP = Boolean(process.env.SKIP);
const CONCURRENCY = 8;
const RETRIES = 3;
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // refresh after 7 days

// Keep in sync with HERO_POSTERS + getPosterSrc() in
// src/modules/homepage/HeroSection.tsx — same ids, rating sources, layout,
// blur, alpha and radius so the static files look pixel-identical.
const HERO_POSTERS = [
  {
    id: '872585',
    type: 'movie',
    r: 'rt,meta',
    vars: 'rt_x=10&rt_y=12&meta_x=10&meta_y=86',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '155',
    type: 'movie',
    r: 'imdb,rt',
    vars: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '238',
    type: 'movie',
    r: 'imdb',
    vars: 'imdb_x=10&imdb_y=12',
    blur: 7,
    alpha: 0.44,
    rad: 10,
  },
  {
    id: '680',
    type: 'movie',
    r: 'imdb,rt,meta',
    vars: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86&meta_x=10&meta_y=160',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '27205',
    type: 'movie',
    r: 'imdb,rt',
    vars: 'imdb_x=10&imdb_y=12&rt_x=10&rt_y=86',
    blur: 8,
    alpha: 0.46,
    rad: 10,
  },
  {
    id: '278',
    type: 'movie',
    r: 'imdb',
    vars: 'imdb_x=10&imdb_y=12',
    blur: 7,
    alpha: 0.44,
    rad: 10,
  },
];

// Same params every mobile reel card uses in src/modules/homepage/FilmReelSection.tsx
const REEL_PARAMS = 'imdb,rt&source=tmdb&blur=12&alpha=0.35&rad=6';

function heroUrl(p) {
  return `${API_BASE}/${p.type}/${p.id}.webp?r=${p.r}&source=tmdb&blur=${p.blur}&alpha=${p.alpha}&rad=${p.rad}&${p.vars}`;
}

function reelUrl({ type, id }) {
  return `${API_BASE}/${type}/${id}.webp?r=${REEL_PARAMS}`;
}

async function fetchBuffer(url) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt === RETRIES) throw err;
      const wait = Math.min(500 * Math.pow(2, attempt), 4000);
      console.warn(`    Retry ${attempt + 1}/${RETRIES} in ${wait}ms (${err.message})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function parseReelItems() {
  const source = await readFile(CONSTANTS_FILE, 'utf8');
  const start = source.indexOf('REEL_ITEMS');
  const open = source.indexOf('[', start);
  const close = source.indexOf('];', open);
  const block = source.slice(open + 1, close);
  const items = [...block.matchAll(/id:\s*'(\d+)',\s*\n?\s*type:\s*'(\w+)'/g)].map(
    ([, id, type]) => ({ id, type })
  );
  if (items.length === 0) {
    throw new Error(`No REEL_ITEMS parsed from ${CONSTANTS_FILE}`);
  }
  return items;
}

async function fileIsFresh(p) {
  if (FORCE) return false;
  try {
    const s = await stat(p);
    return Date.now() - s.mtimeMs < MAX_AGE_MS;
  } catch {
    return false;
  }
}

async function download(jobs) {
  const results = [];
  const total = jobs.length;
  let done = 0;

  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (job) => {
        const out = path.join(OUT_DIR, job.file);
        if (SKIP || (await fileIsFresh(out))) {
          results.push({ ...job, ok: true, cached: true });
          done++;
          return;
        }
        try {
          const buf = await fetchBuffer(job.url);
          await writeFile(out, buf);
          results.push({ ...job, ok: true, cached: false });
        } catch (err) {
          console.warn(`  ✗  Skipped "${job.file}": ${err.message}`);
          results.push({ ...job, ok: false });
        }
        done++;
        process.stdout.write(
          `\r  [${Math.round((done / total) * 100)
            .toString()
            .padStart(3)}%] ${done}/${total}`
        );
      })
    );
  }
  process.stdout.write('\n');
  return results;
}

async function writeGeneratedModule(heroResults, reelResults) {
  const hero = Object.fromEntries(
    heroResults.map((r) => [r.poster.id, `/images/home-posters/${r.file}`])
  );
  const reel = Object.fromEntries(
    reelResults.map((r) => [r.poster.id, `/images/home-posters/${r.file}`])
  );
  const banner =
    '// Generated by scripts/fetch-home-posters.mjs - do not edit by hand.\n' +
    '// Pre-downloaded homepage poster URLs (static; no runtime API calls).';

  const ts = `${banner}
export const HERO_POSTER_SRCS: Record<string, string> = ${JSON.stringify(hero, null, 2)};

export const REEL_POSTER_SRCS: Record<string, string> = ${JSON.stringify(reel, null, 2)};
`;

  await mkdir(path.dirname(MAP_FILE), { recursive: true });
  await writeFile(MAP_FILE, ts);
}

async function main() {
  console.log('┌──────────────────────────────────────────────────┐');
  console.log('│  Posterium - Homepage poster pre-download script  │');
  console.log('└──────────────────────────────────────────────────┘');
  console.log(`  API base  : ${API_BASE}`);
  console.log(`  Output dir: ${path.relative(ROOT, OUT_DIR)}`);
  console.log(`  Mode      : ${SKIP ? 'DRY (map only)' : FORCE ? 'FORCE refresh' : 'incremental'}`);

  const reelItems = await parseReelItems();
  console.log(`  Hero      : ${HERO_POSTERS.length} posters`);
  console.log(`  Reel      : ${reelItems.length} mobile-grid posters`);

  await mkdir(OUT_DIR, { recursive: true });

  const heroJobs = HERO_POSTERS.map((p) => ({
    poster: p,
    file: `hero-${p.id}.webp`,
    url: heroUrl(p),
  }));

  const reelJobs = reelItems.map((p) => ({
    poster: p,
    file: `reel-${p.id}.webp`,
    url: reelUrl(p),
  }));

  console.log('\nStep 1/2  Downloading hero posters...');
  const heroResults = await download(heroJobs);

  console.log('\nStep 2/2  Downloading reel posters...');
  const reelResults = await download(reelJobs);

  const heroFailed = heroResults.filter((r) => !r.ok).length;
  const reelFailed = reelResults.filter((r) => !r.ok).length;

  await writeGeneratedModule(heroResults, reelResults);

  if (heroFailed || reelFailed) {
    console.warn(
      `\n  ⚠  ${heroFailed + reelFailed} download(s) failed - build continues with existing/static files.`
    );
  }

  console.log(
    `\n  Done: ${heroResults.filter((r) => r.ok).length} hero + ${reelResults.filter((r) => r.ok).length} reel posters local (${heroResults.filter((r) => r.cached).length + reelResults.filter((r) => r.cached).length} cached).`
  );
  console.log(`  Map written: ${path.relative(ROOT, MAP_FILE)}`);
}

main().catch((err) => {
  console.error('\n✗  Fatal error:', err.message ?? err);
  process.exit(1);
});
