import { describe, expect, it } from 'vitest';
import { buildFAQPageSchema, contentToPlainText, toFAQEntries, type SchemaObject } from './seo';

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

    expect(schema).toMatchObject({ '@context': 'https://schema.org', '@type': 'FAQPage' });
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
