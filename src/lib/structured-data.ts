interface FaqEntryLike {
  id: string;
  data: {
    question: string;
  };
  body?: string;
}

interface InstallGuideLike {
  id: string;
  data: {
    name?: string;
  };
  body?: string;
}

interface PresetLike {
  id: string;
  title: string;
  description: string;
  query: string;
}

const toIsoDurationMinutes = (minutes: number): string => `PT${Math.max(1, Math.round(minutes))}M`;

const stripMarkdown = (value: string): string =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const extractOrderedSteps = (markdown: string): string[] => {
  const stepRegex = /^\d+\.\s+(.+)$/gm;
  const steps: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = stepRegex.exec(markdown)) !== null) {
    const text = stripMarkdown(match[1] ?? '');
    if (text) steps.push(text);
  }
  return steps;
};

const estimateMinutesFromText = (text: string, wordsPerMinute: number): number => {
  const wordCount = stripMarkdown(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

/**
 * Builds FAQPage schema from FAQ content entries.
 */
export const generateFaqPageSchema = (entries: FaqEntryLike[], pageUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${pageUrl}#faq`,
  mainEntity: entries.map((entry) => ({
    '@type': 'Question',
    name: entry.data.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: stripMarkdown(entry.body ?? ''),
    },
  })),
});

/**
 * Builds one HowTo schema object per installation guide, with dynamic step/time estimates.
 */
export const generateHowToSchemas = (
  guides: InstallGuideLike[],
  opts: { baseUrl: string; pageUrl: string }
) =>
  guides.map((guide, index) => {
    const steps = extractOrderedSteps(guide.body ?? '');
    const fallbackStep = ['Open the guide and follow the setup instructions.'];
    const usableSteps = steps.length > 0 ? steps : fallbackStep;
    const stepDurations = usableSteps.map((step) => estimateMinutesFromText(step, 22));
    const totalMinutes = stepDurations.reduce((sum, duration) => sum + duration, 0);
    const guideName = guide.data.name ?? guide.id;
    const guideUrl = `${opts.baseUrl}/installation#${guide.id}`;

    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      '@id': `${guideUrl}#howto`,
      name: `Install Posterium on ${guideName}`,
      description: `Step-by-step installation for ${guideName}.`,
      url: guideUrl,
      totalTime: toIsoDurationMinutes(totalMinutes),
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '0',
      },
      supply: [
        {
          '@type': 'HowToSupply',
          name: guideName,
        },
      ],
      step: usableSteps.map((text, stepIndex) => ({
        '@type': 'HowToStep',
        position: stepIndex + 1,
        name: text,
        text,
        url: `${guideUrl}-step-${stepIndex + 1}`,
        estimatedDuration: toIsoDurationMinutes(stepDurations[stepIndex] ?? 1),
      })),
      position: index + 1,
      isPartOf: {
        '@id': `${opts.pageUrl}#installation`,
      },
    };
  });

/**
 * Builds ItemList schema for examples/preset showcase pages.
 */
export const generatePresetItemListSchema = (
  presets: PresetLike[],
  opts: { baseUrl: string; pageUrl: string }
) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${opts.pageUrl}#preset-list`,
  name: 'Posterium preset showcases',
  numberOfItems: presets.length,
  itemListOrder: 'https://schema.org/ItemListOrderAscending',
  itemListElement: presets.map((preset, index) => {
    const presetUrl = `${opts.baseUrl}/examples#${preset.id}`;
    const builderUrl = `${opts.baseUrl}/build?${preset.query}`;
    return {
      '@type': 'ListItem',
      position: index + 1,
      url: presetUrl,
      item: {
        '@type': 'CreativeWork',
        name: preset.title,
        description: preset.description,
        url: presetUrl,
        isBasedOn: builderUrl,
      },
    };
  }),
});
