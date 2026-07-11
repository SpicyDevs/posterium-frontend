import { SEO_DEFAULTS, SITE_CONFIG } from '@/constants/site';
import type {
  SchemaObject,
  BreadcrumbItem,
  PageSEOMetadata,
  WebApplicationSchemaMeta,
  HowToSchemaMeta,
  CollectionBreadcrumbMeta,
  ArticleContentEntry,
  FAQEntry,
} from '@/types/seo';
import { absoluteUrl } from '@/seo/text-processing';

const siteNavigationItems: BreadcrumbItem[] = [
  { name: 'Home', url: SITE_CONFIG.baseUrl },
  { name: 'Builder', url: `${SITE_CONFIG.baseUrl}/build` },
  { name: 'Examples', url: `${SITE_CONFIG.baseUrl}/examples` },
  { name: 'Installation', url: `${SITE_CONFIG.baseUrl}/installation` },
  { name: 'FAQ', url: `${SITE_CONFIG.baseUrl}/faq` },
  { name: 'Docs', url: `${SITE_CONFIG.baseUrl}/docs` },
];

export function buildOrganizationSchema(): SchemaObject {
  return {
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

export function buildSiteNavigationSchema(): SchemaObject {
  return {
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
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.baseUrl}/#website`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.baseUrl,
    description: SEO_DEFAULTS.description,
    publisher: { '@id': `${SITE_CONFIG.baseUrl}/#organization` },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_CONFIG.baseUrl}/faq?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
  };
}

export function buildWebPageSchema(
  meta: Pick<PageSEOMetadata, 'title' | 'description' | 'canonical' | 'ogImage' | 'ogImageAlt' | 'datePublished' | 'dateModified' | 'speakable'>
): SchemaObject {
  const schema: SchemaObject = {
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
  if (meta.datePublished) schema.datePublished = meta.datePublished;
  if (meta.dateModified) schema.dateModified = meta.dateModified;
  if (meta.speakable) {
    schema.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: meta.speakable.cssSelector,
    };
  }
  return schema;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[], canonical?: string): SchemaObject {
  const breadcrumbUrl = canonical ?? items[items.length - 1]?.url ?? SITE_CONFIG.baseUrl;

  return {
    '@type': 'BreadcrumbList',
    '@id': `${breadcrumbUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

const titleCaseSegment = (segment: string): string =>
  segment
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

export function buildCollectionBreadcrumbs(meta: CollectionBreadcrumbMeta): BreadcrumbItem[] {
  const sectionUrl = `${SITE_CONFIG.baseUrl}${meta.sectionPath.startsWith('/') ? meta.sectionPath : `/${meta.sectionPath}`}`;
  const slug = (meta.slug ?? '').replace(/^\/+|\/+$/g, '');

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', url: SITE_CONFIG.baseUrl },
    { name: meta.sectionName, url: sectionUrl },
  ];

  if (!slug) return breadcrumbs;

  const segments = slug.split('/').filter(Boolean);
  const parents = segments.slice(0, -1);
  const leaf = segments[segments.length - 1];

  parents.forEach((segment, index) => {
    const parentPath = `${sectionUrl}/${segments.slice(0, index + 1).join('/')}`;
    breadcrumbs.push({ name: titleCaseSegment(segment), url: parentPath });
  });

  breadcrumbs.push({ name: meta.title, url: `${sectionUrl}/${segments.join('/')}` });
  if (leaf === 'index') breadcrumbs[breadcrumbs.length - 1] = { name: meta.title, url: sectionUrl };

  return breadcrumbs;
}

export function buildWebApplicationSchema(meta: WebApplicationSchemaMeta): SchemaObject {
  return {
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
    aggregateRating: meta.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: meta.aggregateRating.ratingValue,
          ratingCount: meta.aggregateRating.ratingCount,
          bestRating: meta.aggregateRating.bestRating ?? 5,
          worstRating: meta.aggregateRating.worstRating ?? 1,
        }
      : undefined,
  };
}

export function buildHowToSchema(meta: HowToSchemaMeta): SchemaObject {
  const images = (meta.images ?? []).filter(Boolean).map((image) => absoluteUrl(image));
  const schemaId = meta.url.includes('#') ? `${meta.url}-howto` : `${meta.url}#howto`;

  return {
    '@type': 'HowTo',
    '@id': schemaId,
    name: meta.name,
    description: meta.description,
    url: meta.url,
    image: images,
    step: meta.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step,
      image: images[index] ?? images[0],
    })),
    totalTime: `PT${Math.max(1, meta.steps.length * 2)}M`,
  };
}

const youtubeVideoId = (value: string): string | undefined => {
  const url = value.trim();
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (shortMatch) return shortMatch[1];

  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watchMatch) return watchMatch[1];
  return undefined;
};

const extractVideoUrls = (text: string): string[] => {
  const found = new Set<string>();
  const urlRegex = /(https?:\/\/[^\s)]+)/gi;

  for (const match of text.matchAll(urlRegex)) {
    const url = match[1]?.trim();
    if (!url) continue;

    if (
      /youtube\.com\/watch\?/.test(url) ||
      /youtu\.be\/[a-zA-Z0-9_-]{6,}/.test(url) ||
      /vimeo\.com\/\d+/.test(url) ||
      /\.(mp4|webm|mov)(\?.*)?$/i.test(url)
    ) {
      found.add(url);
    }
  }

  return [...found];
};

export function extractVideoObjectSchemas(meta: {
  title: string;
  description: string;
  canonical: string;
  markdown?: string;
  uploadDate?: string;
}): SchemaObject[] {
  const urls = extractVideoUrls(meta.markdown ?? '');

  return urls.map((url, index) => {
    const videoId = youtubeVideoId(url);
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}`
      : url.includes('vimeo.com/')
        ? `https://player.vimeo.com/video/${url.split('/').pop()}`
        : undefined;
    const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;

    return {
      '@type': 'VideoObject',
      '@id': `${meta.canonical}#video-${index + 1}`,
      name: `${meta.title} video demo ${index + 1}`,
      description: meta.description,
      thumbnailUrl: thumbnail,
      contentUrl: url,
      embedUrl,
      uploadDate: meta.uploadDate,
      isFamilyFriendly: true,
    };
  });
}

export function buildFAQPageSchema(faqEntries: FAQEntry[]): SchemaObject {
  return {
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

export function buildItemListSchema(items: { name: string; url: string; description?: string }[]): SchemaObject {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
      description: item.description,
    })),
  };
}

const withoutSchemaContext = (schema: SchemaObject): SchemaObject => {
  const { '@context': _context, ...node } = schema;
  return node;
};

const schemaNodeKey = (schema: SchemaObject): string | undefined => {
  const id = schema['@id'];
  if (typeof id === 'string') return id;

  const type = schema['@type'];
  if (typeof type === 'string') {
    const url = schema.url;
    return typeof url === 'string' ? `${type}:${url}` : undefined;
  }

  return undefined;
};

const dedupeSchemaNodes = (schemas: SchemaObject[]): SchemaObject[] => {
  const seen = new Set<string>();
  const nodes: SchemaObject[] = [];

  for (const schema of schemas.map(withoutSchemaContext)) {
    const key = schemaNodeKey(schema);
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }

    nodes.push(schema);
  }

  return nodes;
};

export function buildCoreSchemas(meta: PageSEOMetadata): SchemaObject[] {
  const breadcrumbs = meta.breadcrumbs?.length
    ? meta.breadcrumbs
    : [
        { name: 'Home', url: SITE_CONFIG.baseUrl },
        ...(meta.canonical === SITE_CONFIG.baseUrl
          ? []
          : [{ name: meta.title, url: meta.canonical }]),
      ];

  return dedupeSchemaNodes([
    buildOrganizationSchema(),
    buildWebsiteSchema(),
    buildWebPageSchema(meta),
    buildBreadcrumbSchema(breadcrumbs, meta.canonical),
    ...meta.jsonLd,
  ]);
}

export function buildSchemaGraph(meta: PageSEOMetadata): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@graph': buildCoreSchemas(meta),
  };
}
