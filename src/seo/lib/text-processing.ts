import { SITE_CONFIG } from '@/constants/site';
import type { FAQEntry, ArticleContentEntry } from '@/types/seo';

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
