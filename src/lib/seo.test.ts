import { describe, expect, it } from 'vitest';
import {
  buildFAQPageSchema,
  buildSchemaGraph,
  buildWebApplicationSchema,
  contentToPlainText,
  toFAQEntries,
  type SchemaObject,
} from './seo';

const getFAQQuestions = (schema: SchemaObject) =>
  (schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map(
    (question) => ({
      name: question.name,
      text: question.acceptedAnswer.text,
    })
  );

describe('FAQ structured data helpers', () => {
  it('turns rendered FAQ HTML into safe plain text', () => {
    expect(
      contentToPlainText({
        html: '<p>Posterium supports <strong>SVG</strong> &amp; PNG.</p><script>alert("x")</script>',
        markdown: 'fallback text',
      })
    ).toBe('Posterium supports SVG & PNG.');
  });

  it('falls back to markdown when rendered HTML is unavailable', () => {
    expect(
      contentToPlainText({ markdown: 'Use the **Open in Builder** action from `/build`.' })
    ).toBe('Use the Open in Builder action from /build.');
  });

  it('builds FAQPage JSON-LD in the same order as the visible accordion entries', () => {
    const visibleAccordionEntries = [
      {
        id: 'getting-started-what-is-posterium',
        body: 'Markdown fallback should not be used.',
        rendered: {
          html: '<p>Posterium is a <strong>free movie &amp; TV poster generator</strong> with live rating badges.</p>',
        },
        data: { question: 'What is Posterium?' },
      },
      {
        id: 'builder-load-config',
        body: 'Use the **Open in Builder** action.',
        data: { question: 'Can I open an existing poster setup in the builder?' },
      },
    ];

    const schema = buildFAQPageSchema(toFAQEntries(visibleAccordionEntries));

    expect(schema).toMatchObject({ '@type': 'FAQPage' });
    expect(getFAQQuestions(schema)).toEqual([
      {
        name: 'What is Posterium?',
        text: 'Posterium is a free movie & TV poster generator with live rating badges.',
      },
      {
        name: 'Can I open an existing poster setup in the builder?',
        text: 'Use the Open in Builder action.',
      },
    ]);
  });
});

describe('schema graph builder', () => {
  it('emits a single Schema.org context with one graph of stable page nodes', () => {
    const canonical = 'https://posterium.xyz/build';
    const graph = buildSchemaGraph({
      title: 'Poster Builder - Drag & Drop Editor | Posterium',
      description: 'Drag-and-drop poster editor with real-time preview.',
      canonical,
      ogImage: 'https://posterium.xyz/og-image.png',
      ogImageAlt: 'Posterium poster builder',
      robots: 'index, follow',
      breadcrumbs: [
        { name: 'Home', url: 'https://posterium.xyz' },
        { name: 'Poster Builder', url: canonical },
      ],
      jsonLd: [
        buildWebApplicationSchema({
          name: 'Posterium Poster Builder',
          url: canonical,
          description: 'Visual drag-and-drop editor for custom posters.',
        }),
      ],
    }) as { '@context': string; '@graph': SchemaObject[] };

    expect(graph['@context']).toBe('https://schema.org');
    expect(graph['@graph']).toHaveLength(5);
    expect(graph['@graph'].map((node) => node['@id'])).toEqual([
      'https://posterium.xyz/#organization',
      'https://posterium.xyz/#website',
      `${canonical}#webpage`,
      `${canonical}#breadcrumb`,
      `${canonical}#application`,
    ]);
    expect(graph['@graph'].every((node) => node['@context'] === undefined)).toBe(true);
  });

  it('does not include application nodes on pages without application schema', () => {
    const canonical = 'https://posterium.xyz/privacy';
    const graph = buildSchemaGraph({
      title: 'Privacy Policy | Posterium',
      description: 'Privacy Policy for Posterium.',
      canonical,
      ogImage: 'https://posterium.xyz/og-image.png',
      ogImageAlt: 'Privacy Policy for Posterium',
      robots: 'index, follow',
      breadcrumbs: [
        { name: 'Home', url: 'https://posterium.xyz' },
        { name: 'Privacy Policy', url: canonical },
      ],
      jsonLd: [],
    }) as { '@graph': SchemaObject[] };

    expect(graph['@graph'].map((node) => node['@type'])).toEqual([
      'Organization',
      'WebSite',
      'WebPage',
      'BreadcrumbList',
    ]);
  });
});
