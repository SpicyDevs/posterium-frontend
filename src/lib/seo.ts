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
  rendered?: {
    html?: string;
  };
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

const htmlEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

const normalizePlainText = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const stripMarkdown = (value = ''): string =>
  normalizePlainText(
    value
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/[>*_~]/g, ' ')
  );

export const decodeHtmlEntities = (value = ''): string =>
  value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const lowerCode = code.toLowerCase();

    if (lowerCode.startsWith('#x')) {
      const charCode = Number.parseInt(lowerCode.slice(2), 16);
      return Number.isNaN(charCode) || charCode > 0x10ffff
        ? entity
        : String.fromCodePoint(charCode);
    }

    if (lowerCode.startsWith('#')) {
      const charCode = Number.parseInt(lowerCode.slice(1), 10);
      return Number.isNaN(charCode) || charCode > 0x10ffff
        ? entity
        : String.fromCodePoint(charCode);
    }

    return htmlEntities[lowerCode] ?? entity;
  });

export const htmlToPlainText = (value = ''): string =>
  normalizePlainText(
    decodeHtmlEntities(
      value
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(
          /<\/?(?:address|article|aside|blockquote|br|dd|div|dl|dt|figcaption|figure|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b[^>]*>/gi,
          ' '
        )
        .replace(/<[^>]+>/g, ' ')
    )
  );

export const contentToPlainText = ({
  html,
  markdown,
}: {
  html?: string;
  markdown?: string;
}): string => {
  const renderedText = htmlToPlainText(html);
  return renderedText || stripMarkdown(markdown ?? '');
};

export const toFAQEntries = (entries: ArticleContentEntry[]): FAQEntry[] =>
  entries.map((entry) => ({
    question: entry.data?.question ?? entry.data?.title ?? entry.id ?? 'Question',
    answer: contentToPlainText({
      html: entry.rendered?.html,
      markdown: entry.body ?? entry.data?.description,
    }),
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
    sameAs: [SITE_CONFIG.github, SITE_CONFIG.authorUrl].filter(Boolean),
  };
}

const siteNavigationItems: BreadcrumbItem[] = [
  { name: 'Home', url: SITE_CONFIG.baseUrl },
  { name: 'Builder', url: `${SITE_CONFIG.baseUrl}/build` },
  { name: 'Examples', url: `${SITE_CONFIG.baseUrl}/examples` },
  { name: 'Installation', url: `${SITE_CONFIG.baseUrl}/installation` },
  { name: 'FAQ', url: `${SITE_CONFIG.baseUrl}/faq` },
];

export function buildSiteNavigationSchema(): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_CONFIG.baseUrl}/#site-navigation`,
    name: `${SITE_CONFIG.name} site navigation`,
    itemListElement: siteNavigationItems.map((item, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
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
    potentialAction: [
      {
        '@type': 'UseAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: meta.url,
        },
      },
      {
        '@type': 'CreateAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: meta.url,
        },
        result: {
          '@type': 'CreativeWork',
          name: 'Custom rating poster',
        },
      },
    ],
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
  const breadcrumbs = meta.breadcrumbs?.length
    ? meta.breadcrumbs
    : [
        { name: 'Home', url: SITE_CONFIG.baseUrl },
        ...(meta.canonical === SITE_CONFIG.baseUrl ? [] : [{ name: meta.title, url: meta.canonical }]),
      ];

  return [
    buildOrganizationSchema(),
    buildWebsiteSchema(),
    buildSiteNavigationSchema(),
    buildWebPageSchema(meta),
    buildBreadcrumbSchema(breadcrumbs),
    ...meta.jsonLd,
  ];
}
