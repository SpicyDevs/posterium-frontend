export interface MarkdownHeading {
  depth: number;
  slug: string;
  text: string;
}

const punctuationRegex = /[^\p{L}\p{N}\s-]/gu;

const createSlug = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/`+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(punctuationRegex, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const plainText = (value: string): string => {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim();
};

export const extractMarkdownHeadings = (markdown: string): MarkdownHeading[] => {
  const lines = markdown.split(/\r?\n/);
  const headings: MarkdownHeading[] = [];
  const used = new Map<string, number>();

  lines.forEach((line) => {
    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*$/);
    if (!match) return;

    const depth = match[1].length;
    const text = plainText(match[2]);
    if (!text) return;

    const base = createSlug(text);
    if (!base) return;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const slug = count ? `${base}-${count + 1}` : base;

    headings.push({ depth, slug, text });
  });

  return headings;
};
