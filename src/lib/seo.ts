import { SEO_DEFAULTS, SITE_CONFIG, type OGMeta, type TwitterMeta } from '@/lib/config';

export type SchemaObject = Record<string, unknown>;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQEntry {
  question: string;
  answer: string;
}

export interface PageSEOMetadata {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogImageAlt: string;
  robots: string;
  keywords?: string;
  og?: Partial<OGMeta>;
  twitter?: Partial<TwitterMeta>;
  breadcrumbs?: BreadcrumbItem[];
  jsonLd: SchemaObject[];
}

export interface WebApplicationSchemaMeta {
  name?: string;
  description: string;
  url: string;
  applicationCategory?: string;
  applicationSubCategory?: string;
  operatingSystem?: string;
  featureList?: string[];
  screenshot?: string;
}

export interface ArticleContentEntry {
  id?: string;
  slug?: string;
  body?: string;
  data?: {
    title?: string;
    name?: string;
    question?: string;
    description?: string;
    category?: string;
    updatedDate?: string | Date;
    publishDate?: string | Date;
    pubDate?: string | Date;
  };
}

export const absoluteUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, SITE_CONFIG.baseUrl).toString();
};

const stripMarkdown = (value = ''): string =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

export const toFAQEntries = (entries: ArticleContentEntry[]): FAQEntry[] =>
  entries.map((entry) => ({
    question: entry.data?.question ?? entry.data?.title ?? entry.id ?? 'Question',
    answer: stripMarkdown(entry.body ?? entry.data?.description ?? ''),
  }));

export function buildOrganizationSchema(): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.baseUrl}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icon-512.png'),
    },
    sameAs: [SITE_CONFIG.github].filter((url) => url && url !== '#'),
  };
}

export function buildWebsiteSchema(): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.baseUrl}/#website`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    description: SEO_DEFAULTS.description,
    publisher: { '@id': `${SITE_CONFIG.baseUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.baseUrl}/build?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildWebPageSchema(
  meta: Pick<PageSEOMetadata, 'title' | 'description' | 'canonical' | 'ogImage' | 'ogImageAlt'>
): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${meta.canonical}#webpage`,
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    inLanguage: 'en-US',
    isPartOf: { '@id': `${SITE_CONFIG.baseUrl}/#website` },
    about: { '@id': `${SITE_CONFIG.baseUrl}/#organization` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: absoluteUrl(meta.ogImage),
      caption: meta.ogImageAlt,
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebApplicationSchema(meta: WebApplicationSchemaMeta): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${meta.url}#application`,
    name: meta.name ?? SITE_CONFIG.name,
    url: meta.url,
    description: meta.description,
    applicationCategory: meta.applicationCategory ?? 'DesignApplication',
    applicationSubCategory: meta.applicationSubCategory,
    operatingSystem: meta.operatingSystem ?? 'Web Browser',
    browserRequirements: 'Requires JavaScript. Requires a modern browser.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@id': `${SITE_CONFIG.baseUrl}/#organization` },
    screenshot: meta.screenshot ? absoluteUrl(meta.screenshot) : undefined,
    isAccessibleForFree: true,
    featureList: meta.featureList,
  };
}

export function buildFAQPageSchema(faqEntries: FAQEntry[]): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  };
}

export function buildArticleOrTechArticleSchema(contentEntry: ArticleContentEntry): SchemaObject {
  const data = contentEntry.data ?? {};
  const title = data.title ?? data.name ?? data.question ?? contentEntry.id ?? 'Posterium Article';
  const canonicalPath = contentEntry.slug ?? contentEntry.id ?? '';
  const url = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${SITE_CONFIG.baseUrl}/${canonicalPath.replace(/^\/+/, '')}`;

  return {
    '@context': 'https://schema.org',
    '@type': data.category === 'API' || data.category === 'Builder' ? 'TechArticle' : 'Article',
    headline: title,
    name: title,
    description: data.description,
    url,
    datePublished: data.publishDate ?? data.pubDate,
    dateModified: data.updatedDate ?? data.publishDate ?? data.pubDate,
    author: { '@id': `${SITE_CONFIG.baseUrl}/#organization` },
    publisher: { '@id': `${SITE_CONFIG.baseUrl}/#organization` },
    inLanguage: 'en-US',
  };
}

export function buildCoreSchemas(meta: PageSEOMetadata): SchemaObject[] {
  return [
    buildOrganizationSchema(),
    buildWebsiteSchema(),
    buildWebPageSchema(meta),
    ...(meta.breadcrumbs?.length ? [buildBreadcrumbSchema(meta.breadcrumbs)] : []),
    ...meta.jsonLd,
  ];
}
