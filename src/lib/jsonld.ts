// src/lib/jsonld.ts
/**
 * JSON-LD schema builders for FAQ, HowTo, and WebApplication pages.
 * Import and pass the result to <JsonLd data={…} />.
 */

/** FAQ page schema — pass all Q&A pairs */
export function buildFaqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

/** HowTo schema for installation guides */
export function buildHowToSchema(opts: {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration e.g. "PT10M"
  steps: { name: string; text: string; url?: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    ...(opts.totalTime ? { totalTime: opts.totalTime } : {}),
    step: opts.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

/** WebApplication schema for the builder page */
export function buildWebAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Posterium Builder',
    url: 'https://posters.spicydevs.xyz/build',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Free online tool for generating movie and TV poster images with live IMDb, Rotten Tomatoes, and Metacritic rating badges.',
  };
}

/** BreadcrumbList schema */
export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: url,
    })),
  };
}
