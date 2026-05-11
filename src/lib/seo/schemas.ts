export interface FaqEntry {
  question: string;
  answer: string;
}

export interface HowToStepEntry {
  name: string;
  text?: string;
}

export interface HowToSchemaInput {
  name: string;
  description?: string;
  url: string;
  image?: string;
  steps: HowToStepEntry[];
  totalMinutes: number;
}

export interface ItemListEntry {
  name: string;
  url?: string;
  description?: string;
}

export const cleanText = (value: string): string => {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const createFaqSchema = (entries: FaqEntry[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entries.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: entry.answer,
    },
  })),
});

export const createHowToSchema = ({
  name,
  description,
  url,
  image,
  steps,
  totalMinutes,
}: HowToSchemaInput) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name,
  description,
  url,
  image,
  totalTime: `PT${Math.max(1, Math.round(totalMinutes))}M`,
  step: steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text ?? step.name,
  })),
});

export const createItemListSchema = (name: string, items: ItemListEntry[], description?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  description,
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    url: item.url,
    description: item.description,
  })),
});
