import { defineMiddleware } from 'astro:middleware';

const removeTagBlock = (input: string, tagName: string): string => {
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;

  let cursor = 0;
  let result = '';

  while (cursor < input.length) {
    const start = input.toLowerCase().indexOf(openTag, cursor);

    if (start === -1) {
      result += input.slice(cursor);
      break;
    }

    result += input.slice(cursor, start);

    const end = input.toLowerCase().indexOf(closeTag, start);
    if (end === -1) {
      break;
    }

    cursor = end + closeTag.length;
  }

  return result;
};

const stripHtmlTags = (input: string): string => {
  let output = '';
  let inTag = false;

  for (const char of input) {
    if (char === '<') {
      inTag = true;
      continue;
    }

    if (char === '>') {
      inTag = false;
      output += '\n';
      continue;
    }

    if (!inTag) {
      output += char;
    }
  }

  return output;
};

const normalizeWhitespace = (input: string): string => input
  .replace(/\r/g, '')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const htmlToMarkdown = (html: string): string => {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim();

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  const withoutScripts = removeTagBlock(body, 'script');
  const withoutStyles = removeTagBlock(withoutScripts, 'style');
  const textOnly = stripHtmlTags(withoutStyles);

  let markdown = normalizeWhitespace(textOnly);

  if (title && !markdown.startsWith('# ')) {
    markdown = `# ${title}\n\n${markdown}`;
  }

  return markdown;
};

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    return next();
  }

  const accept = context.request.headers.get('accept')?.toLowerCase() ?? '';

  if (!accept.includes('text/markdown')) {
    return next();
  }

  const response = await next();
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  const markdown = htmlToMarkdown(html);

  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  headers.delete('Content-Length');

  return new Response(markdown, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
