import { SITE_CONFIG } from '@/lib/config';

interface FaqSchemaEntry {
  question: string;
  answer: string;
}

interface HowToGuideInput {
  id: string;
  name: string;
  body: string;
}

interface ItemListEntry {
  id: string;
  title: string;
  description: string;
}

const stripMarkdown = (value: string): string =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toIsoDurationMinutes = (minutes: number): string => `PT${Math.max(1, Math.round(minutes))}M`;

const estimateMinutes = (text: string): number => {
  const words = stripMarkdown(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 160));
};

const extractHowToSteps = (body: string): string[] => {
  const orderedSteps = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);

  if (orderedSteps.length > 0) return orderedSteps;

  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
};

export const buildFaqPageSchema = (entries: FaqSchemaEntry[], pagePath = '/faq') => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_CONFIG.baseUrl}${pagePath}#faq`,
  url: `${SITE_CONFIG.baseUrl}${pagePath}`,
  mainEntity: entries
    .filter((entry) => entry.question.trim() && entry.answer.trim())
    .map((entry) => ({
      '@type': 'Question',
      name: entry.question.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripMarkdown(entry.answer),
      },
    })),
});

export const buildInstallationHowToSchemas = (guides: HowToGuideInput[], pagePath = '/installation') =>
  guides
    .map((guide) => {
      const steps = extractHowToSteps(guide.body);
      if (steps.length === 0) return null;
      const totalMinutes = steps.reduce((sum, step) => sum + estimateMinutes(step), 0);
      return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        '@id': `${SITE_CONFIG.baseUrl}${pagePath}#howto-${guide.id}`,
        name: `${guide.name} installation guide`,
        description: `Step-by-step Posterium setup for ${guide.name}.`,
        totalTime: toIsoDurationMinutes(totalMinutes),
        supply: [
          {
            '@type': 'HowToSupply',
            name: 'Posterium API URL',
          },
        ],
        step: steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: `Step ${index + 1}`,
          text: stripMarkdown(step),
          url: `${SITE_CONFIG.baseUrl}${pagePath}#${guide.id}`,
        })),
      };
    })
    .filter(Boolean);

export const buildPresetItemListSchema = (entries: ItemListEntry[], pagePath = '/examples') => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${SITE_CONFIG.baseUrl}${pagePath}#preset-list`,
  name: 'Posterium preset showcase',
  itemListOrder: 'http://schema.org/ItemListOrderAscending',
  numberOfItems: entries.length,
  itemListElement: entries.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_CONFIG.baseUrl}${pagePath}#${entry.id}`,
    item: {
      '@type': 'CreativeWork',
      name: entry.title,
      description: entry.description,
    },
  })),
});
