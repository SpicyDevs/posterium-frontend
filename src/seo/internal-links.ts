import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_CONFIG } from '@/constants/site';
import { stripMarkdown } from '@/seo/lib/text-processing';

type SupportedCollection = 'faq' | 'install' | 'examples' | 'docs';

export interface RelatedContentLink {
  title: string;
  href: string;
  collection: SupportedCollection;
  score: number;
}

interface RelatedContentContext {
  collection: SupportedCollection;
  id: string;
  title: string;
  text: string;
  keywords?: string[];
}

interface ContentNode {
  collection: SupportedCollection;
  id: string;
  title: string;
  href: string;
  searchableText: string;
}

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'your',
  'you',
]);
const CROSS_COLLECTION_BONUS_SCORE = 2;

const toAbsolutePath = (path: string): string => new URL(path, SITE_CONFIG.baseUrl).toString();

const titleFromEntry = (
  collection: SupportedCollection,
  entry: CollectionEntry<SupportedCollection>
): string => {
  if (collection === 'faq') return entry.data.question;
  if (collection === 'install') return entry.data.name ?? entry.id;
  if (collection === 'examples') return entry.data.title;
  return entry.data.title ?? entry.id;
};

const hrefFromEntry = (
  collection: SupportedCollection,
  entry: CollectionEntry<SupportedCollection>
): string => {
  if (collection === 'faq') return toAbsolutePath(`/faq#${entry.id}`);
  if (collection === 'install') return toAbsolutePath(`/installation#${entry.id}`);
  if (collection === 'examples') return toAbsolutePath('/examples');
  return entry.id === 'index' ? toAbsolutePath('/docs') : toAbsolutePath(`/docs/${entry.id}`);
};

const tokenize = (value: string): string[] =>
  stripMarkdown(value)
    .toLowerCase()
    .replace(/[`'"()[\]{}:;!?.,/\\|<>+=_*~#@]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

const toTokenSet = (value: string): Set<string> => new Set(tokenize(value));

const intersectionScore = (a: Set<string>, b: Set<string>): number => {
  let score = 0;
  for (const token of a) {
    if (b.has(token)) score += 1;
  }
  return score;
};

const nodeFromEntry = (
  collection: SupportedCollection,
  entry: CollectionEntry<SupportedCollection>
): ContentNode => {
  let extra = '';

  switch (collection) {
    case 'faq':
      extra = `${entry.data.category} ${entry.data.question}`;
      break;
    case 'install':
      extra = `${entry.data.name ?? ''}`;
      break;
    case 'examples':
      extra = `${entry.data.title} ${entry.data.description}`;
      break;
    case 'docs':
      extra = `${entry.data.title ?? ''} ${entry.data.description ?? ''}`;
      break;
  }

  return {
    collection,
    id: entry.id,
    title: titleFromEntry(collection, entry),
    href: hrefFromEntry(collection, entry),
    searchableText: `${extra} ${entry.body ?? ''}`,
  };
};

const toCandidateLinks = (
  context: RelatedContentContext,
  nodes: ContentNode[],
  limit: number
): RelatedContentLink[] => {
  const contextTokens = toTokenSet(`${context.title} ${context.text} ${(context.keywords ?? []).join(' ')}`);

  return nodes
    .filter((node) => !(node.collection === context.collection && node.id === context.id))
    .map((node) => {
      const nodeTokens = toTokenSet(`${node.title} ${node.searchableText}`);
      const tokenScore = intersectionScore(contextTokens, nodeTokens);
      const crossCollectionBonus =
        node.collection === context.collection ? 0 : CROSS_COLLECTION_BONUS_SCORE;

      return {
        title: node.title,
        href: node.href,
        collection: node.collection,
        score: tokenScore + crossCollectionBonus,
      };
    })
    .filter((link) => link.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
};

export async function getRelatedContentLinks(
  context: RelatedContentContext,
  limit = 6
): Promise<RelatedContentLink[]> {
  const [faq, install, examples, docs] = await Promise.all([
    getCollection('faq'),
    getCollection('install'),
    getCollection('examples'),
    getCollection('docs'),
  ]);

  const nodes = [
    ...faq.map((entry) => nodeFromEntry('faq', entry)),
    ...install.map((entry) => nodeFromEntry('install', entry)),
    ...examples.map((entry) => nodeFromEntry('examples', entry)),
    ...docs.map((entry) => nodeFromEntry('docs', entry)),
  ];

  return toCandidateLinks(context, nodes, limit);
}
