// src/lib/masonryLayout.ts

class LCG {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }
  next() {
    // Standard LCG parameters (Numerical Recipes)
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
}

interface ColumnTemplate {
  heights: number[];
  weight: number;
}

const TEMPLATES: ColumnTemplate[] = [
  { heights: [100], weight: 2 },
  { heights: [50, 50], weight: 3 },
  { heights: [33, 33, 34], weight: 2 },
  { heights: [62, 38], weight: 2 },
  { heights: [38, 62], weight: 2 },
  { heights: [35, 65], weight: 1 },
];

export function generateMasonryLayout(stripHeightPx: number, viewportRefWidth = 1920) {
  const colWidth = Math.min(stripHeightPx * (2 / 3), 280);
  const numCols = Math.ceil(viewportRefWidth / colWidth) + 2; // Buffer for scrolling
  
  const rng = new LCG(2024);
  const totalWeight = TEMPLATES.reduce((sum, t) => sum + t.weight, 0);

  const columns = Array.from({ length: numCols }).map(() => {
    let r = rng.next() * totalWeight;
    let selected = TEMPLATES[0];
    for (const t of TEMPLATES) {
      if (r < t.weight) {
        selected = t;
        break;
      }
      r -= t.weight;
    }
    return {
      width: colWidth,
      items: selected.heights,
    };
  });

  return {
    colWidth,
    columns,
  };
}
