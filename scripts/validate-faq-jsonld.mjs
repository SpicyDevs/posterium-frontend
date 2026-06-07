import { readFileSync } from 'node:fs';

const html = readFileSync('dist/faq.html', 'utf8');

const htmlEntities = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

const decodeHtmlEntities = (value = '') =>
  value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code) => {
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

const toPlainText = (value = '') =>
  decodeHtmlEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

const schemas = [
  ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
].flatMap((match) => {
  const schema = JSON.parse(match[1]);

  if (Array.isArray(schema)) {
    return schema;
  }

  if (Array.isArray(schema['@graph'])) {
    return schema['@graph'];
  }

  return [schema];
});
const faqSchema = schemas.find((schema) => schema['@type'] === 'FAQPage');
const breadcrumbSchema = schemas.find((schema) => schema['@type'] === 'BreadcrumbList');

if (!faqSchema) {
  throw new Error('Missing FAQPage JSON-LD in dist/faq.html');
}

if (!breadcrumbSchema) {
  throw new Error('Missing BreadcrumbList JSON-LD in dist/faq.html');
}

const schemaEntries = faqSchema.mainEntity.map((question) => ({
  name: question.name,
  text: question.acceptedAnswer.text,
}));
const accordionEntries = [
  ...html.matchAll(
    /<details\b(?=[^>]*class="faq-accordion")[\s\S]*?<summary[\s\S]*?<span\b[^>]*>([\s\S]*?)<\/span>[\s\S]*?<div\b(?=[^>]*class="prose prose-compact")[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/details>/g
  ),
].map((match) => ({
  name: toPlainText(match[1]),
  text: toPlainText(match[2]),
}));

if (JSON.stringify(schemaEntries) !== JSON.stringify(accordionEntries)) {
  console.error(JSON.stringify({ schemaEntries, accordionEntries }, null, 2));
  throw new Error('FAQPage JSON-LD does not match visible accordion content');
}

const breadcrumbNames = breadcrumbSchema.itemListElement.map((item) => item.name).join(' → ');
if (breadcrumbNames !== 'Home → FAQ') {
  throw new Error(`Unexpected FAQ breadcrumbs: ${breadcrumbNames}`);
}

console.log(
  `Validated ${schemaEntries.length} FAQPage entries and BreadcrumbList: ${breadcrumbNames}`
);
