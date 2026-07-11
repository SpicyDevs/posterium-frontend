import { writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, '..', 'public', 'fonts');

if (!existsSync(FONTS_DIR)) mkdirSync(FONTS_DIR, { recursive: true });

const FAMILIES = [
  { name: 'Bebas Neue', url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap' },
  { name: 'Plus Jakarta Sans', url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap' },
  { name: 'Syne', url: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap' },
  { name: 'DM Sans', url: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap' },
  { name: 'JetBrains Mono', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap' },
];

// Known variable font families — all weights map to the same file
const VARIABLE_FONTS = new Set(['DM Sans', 'JetBrains Mono']);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const RANGE_LABELS = {
  'U+0000-00FF': 'latin',
  'U+0100-02BA': 'latinext',
};

function identifyRange(range) {
  for (const [prefix, label] of Object.entries(RANGE_LABELS)) {
    if (range.startsWith(prefix)) return label;
  }
  if (range.includes('0400-045F') || range.includes('0460-052F')) return null; // cyrillic skip
  if (range.includes('0370-0377') || range.includes('0384-038A')) return null; // greek skip
  if (range.includes('0102-0103') && range.includes('1EA0-1EF9')) return null; // vietnamese skip
  return null;
}

function parseFontFace(css, familyHint) {
  const blocks = [];
  const regex = /@font-face\s*{([^}]*)}/gi;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const block = match[1];
    const get = (prop) => {
      const m = block.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
      return m ? m[1].trim() : undefined;
    };
    const url = get('src')?.match(/url\(([^)]+)\)/)?.[1];
    if (url) {
      const range = get('unicode-range') || '';
      const rangeLabel = identifyRange(range);
      if (rangeLabel === null) continue; // Skip non-Western ranges
      blocks.push({
        family: get('font-family')?.replace(/['"]/g, '') || familyHint,
        weight: get('font-weight') || '400',
        style: get('font-style') || 'normal',
        unicodeRange: range,
        rangeLabel,
        url,
      });
    }
  }
  return blocks;
}

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

(async () => {
  // Clean old files
  for (const f of readdirSync(FONTS_DIR)) {
    if (f.endsWith('.woff2') || f === 'fonts.css') {
      rmSync(join(FONTS_DIR, f));
    }
  }

  const latinBlocks = [];

  for (const family of FAMILIES) {
    console.log(`Fetching ${family.name}...`);
    const res = await fetch(family.url, { headers: { 'User-Agent': UA } });
    const css = await res.text();
    const blocks = parseFontFace(css, family.name);

    // For variable fonts, deduplicate by URL
    const seenUrls = new Set();
    for (const block of blocks) {
      const urlKey = block.url.split('/').pop().split('?')[0];
      if (VARIABLE_FONTS.has(block.family) && seenUrls.has(urlKey)) continue;
      seenUrls.add(urlKey);

      const slug = slugify(block.family);
      // Use a generic weight label for variable fonts
      const weightPart = VARIABLE_FONTS.has(block.family) ? 'variable' : block.weight;
      const safeName = `${slug}-${weightPart}-${block.style}-${block.rangeLabel}.woff2`;

      if (!existsSync(join(FONTS_DIR, safeName))) {
        console.log(`  Downloading ${safeName}...`);
        const fileRes = await fetch(block.url);
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        writeFileSync(join(FONTS_DIR, safeName), buffer);
      }
      latinBlocks.push({ ...block, localFilename: safeName, weightPart });
    }
  }

  // Generate @font-face CSS — latin first, then latin-ext
  let cssOutput = '';

  for (const range of ['latin', 'latinext']) {
    const seen = new Set();
    for (const block of latinBlocks) {
      if (block.rangeLabel !== range) continue;
      const family = block.family;
      const isVariable = VARIABLE_FONTS.has(family);

      // For variable fonts, emit one rule with font-weight: 100 900
      const key = `${family}-${isVariable ? 'variable' : block.weight}-${block.style}-${range}`;
      if (seen.has(key)) continue;
      seen.add(key);

      cssOutput += `@font-face {
  font-family: '${family}';
  font-style: ${block.style};
  font-weight: ${isVariable ? '100 900' : block.weight};
  font-display: swap;
  src: url('/fonts/${block.localFilename}') format('woff2');
  unicode-range: ${block.unicodeRange};
}

`;
    }
  }

  writeFileSync(join(FONTS_DIR, 'fonts.css'), cssOutput);
  console.log('\nGenerated fonts.css');
  console.log(`Total unique font files: ${latinBlocks.length}`);
})().catch(console.error);
