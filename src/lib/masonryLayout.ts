// src/lib/masonryLayout.ts

// ── Seeded random (LCG) ────────────────────────────────────────────────────────
export class SeededRandom {
  private s: number;
  constructor(seed = 2024) {
    this.s = seed;
  }
  next(): number {
    this.s = (this.s * 1664525 + 1013904223) & 0xffffffff;
    return (this.s >>> 0) / 0xffffffff;
  }
}

// ── Column height-percentage templates ────────────────────────────────────────
interface ColumnTemplate {
  slots: number[]; // height percentages, must sum to 100
  weight: number;
}

const COLUMN_TEMPLATES: ColumnTemplate[] = [
  { slots: [100], weight: 2 },        // A: single poster fills column
  { slots: [50, 50], weight: 3 },     // B: two equal posters
  { slots: [33, 33, 34], weight: 2 }, // C: three roughly equal
  { slots: [62, 38], weight: 2 },     // D: tall + short
  { slots: [38, 62], weight: 2 },     // E: short + tall
  { slots: [35, 65], weight: 1 },     // F: short + very tall
];

const WEIGHT_SUM = COLUMN_TEMPLATES.reduce((acc, t) => acc + t.weight, 0);
const WEIGHT_PREFIXES = COLUMN_TEMPLATES.reduce<number[]>((acc, t) => {
  acc.push((acc[acc.length - 1] ?? 0) + t.weight);
  return acc;
}, []);

function pickTemplate(rng: SeededRandom): ColumnTemplate {
  const r = rng.next() * WEIGHT_SUM;
  const idx = WEIGHT_PREFIXES.findIndex((p) => r < p);
  return COLUMN_TEMPLATES[idx >= 0 ? idx : 0];
}

function shuffle<T>(arr: T[], rng: SeededRandom): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Public types ──────────────────────────────────────────────────────────────
/** A single poster slot inside a masonry column. */
export interface MasonrySlot {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  /** Computed pixel width of this slot. */
  width: number;
  /** Height percentage (0–100) relative to the containing column. */
  heightPct: number;
}

/** A masonry column comprising one or more poster slots. */
export interface MasonryColumn {
  slots: MasonrySlot[];
  /** Pixel height of this column (= containerHeight). */
  height: number;
  /** Pixel width of this column. */
  width: number;
}

// ── Input item type ───────────────────────────────────────────────────────────
export interface ReelItem {
  id: string;
  type: 'movie' | 'tv';
  title: string;
  [key: string]: unknown;
}

// ── Options ───────────────────────────────────────────────────────────────────
export interface MasonryLayoutOptions {
  /** The items to distribute across columns. */
  items: ReelItem[];
  /** Height of the reel strip area in pixels (typically `window.innerHeight - 92`). */
  containerHeight: number;
  /** Maximum pixel width for any column. Default: 280. */
  colWidthCap?: number;
  /** Seed for deterministic layout. Default: 42. */
  seed?: number;
  /** Viewport reference width used to calculate total column count. Default: 1920. */
  viewportRefWidth?: number;
}

// ── Main generator ─────────────────────────────────────────────────────────────
/**
 * Deterministic masonry column generator for the desktop film reel.
 *
 * Column width is derived from a 2:3 poster aspect ratio of containerHeight,
 * capped at `colWidthCap`. Enough columns are generated to fill 3.5× the
 * viewportRefWidth for horizontal scroll travel.
 */
export function generateMasonryLayout(options: MasonryLayoutOptions): MasonryColumn[] {
  const {
    items,
    containerHeight,
    colWidthCap = 280,
    seed = 42,
    viewportRefWidth = 1920,
  } = options;

  const rng = new SeededRandom(seed);

  // Column width: 2:3 aspect of poster height, capped
  const rawColWidth = Math.round(containerHeight * (2 / 3));
  const colWidth = Math.min(rawColWidth, colWidthCap);

  // How many columns we need for 3.5× scrollable width
  const colCount = Math.ceil((viewportRefWidth * 3.5) / colWidth);

  const shuffled = shuffle(items, rng);
  const columns: MasonryColumn[] = [];
  let cursor = 0;

  for (let c = 0; c < colCount; c++) {
    const template = pickTemplate(rng);
    const slots: MasonrySlot[] = [];

    for (const heightPct of template.slots) {
      const prevIds = c > 0 ? columns[c - 1].slots.map((s) => s.id) : [];
      let candidate = shuffled[cursor % shuffled.length];

      // Try up to 5 alternates to avoid direct adjacency repeats
      for (let attempt = 0; attempt < 5; attempt++) {
        candidate = shuffled[(cursor + attempt) % shuffled.length];
        if (!prevIds.includes(candidate.id)) break;
      }

      slots.push({
        id: candidate.id,
        type: candidate.type,
        title: candidate.title,
        width: colWidth,
        heightPct,
      });
      cursor++;
    }

    columns.push({ slots, height: containerHeight, width: colWidth });
  }

  return columns;
}
