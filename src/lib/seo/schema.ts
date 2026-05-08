export interface FaqEntry {
  question: string;
  answer: string;
}

export interface HowToGuideInput {
  id: string;
  name: string;
  description: string;
  markdown: string;
}

export interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
}

const stripMarkdown = (value: string): string =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[>*_~#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toIsoMinutes = (minutes: number): string => `PT${Math.max(1, Math.round(minutes))}M`;

const parseHowToSteps = (markdown: string): string[] => {
  const lines = markdown.split(/\r?\n/);
  const orderedSteps = lines
    .map((line) => line.match(/^\s*\d+\.\s+(.+)$/)?.[1]?.trim() ?? '')
    .filter(Boolean)
    .map(stripMarkdown);

  if (orderedSteps.length > 0) {
    return orderedSteps;
  }

  return lines
    .map((line) => line.match(/^##\s+(.+)$/)?.[1]?.trim() ?? '')
    .filter(Boolean)
    .map(stripMarkdown)
    .filter((step) => !/^(requirements?|verification checklist)$/i.test(step));
};

const estimateHowToTime = (steps: string[]): string => {
  const words = steps.join(' ').split(/\s+/).filter(Boolean).length;
  const minutes = steps.length * 0.75 + words / 130;
  return toIsoMinutes(minutes);
};

export const buildFaqPageSchema = (items: FaqEntry[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});

export const buildHowToGraphSchema = (
  guides: HowToGuideInput[],
  pageUrl: string
): { '@context': string; '@graph': object[] } => ({
  '@context': 'https://schema.org',
  '@graph': guides.map((guide) => {
    const steps = parseHowToSteps(guide.markdown);
    const howToSteps = steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step,
    }));

    return {
      '@type': 'HowTo',
      '@id': `${pageUrl}#${guide.id}-howto`,
      name: `Install Posterium with ${guide.name}`,
      description: guide.description,
      totalTime: estimateHowToTime(steps),
      step: howToSteps,
    };
  }),
});

export const buildItemListSchema = (name: string, items: ItemListEntry[], pageUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  numberOfItems: items.length,
  url: pageUrl,
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: item.url,
    name: item.name,
    description: item.description,
  })),
});

export const toPlainText = stripMarkdown;
