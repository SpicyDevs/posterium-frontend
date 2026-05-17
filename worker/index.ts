interface Env {
  ASSETS: Fetcher;
}

const removeTagBlock = (input: string, tagName: string): string => {
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  const lowerInput = input.toLowerCase();

  let cursor = 0;
  let result = '';

  while (cursor < input.length) {
    const start = lowerInput.indexOf(openTag, cursor);

    if (start === -1) {
      result += input.slice(cursor);
      break;
    }

    result += input.slice(cursor, start);

    const end = lowerInput.indexOf(closeTag, start);
    if (end === -1) {
      break;
    }

    cursor = end + closeTag.length;
  }

  return result;
};

const stripHtmlTags = (input: string): string => input.replace(/<[^>]*>/g, ' ');

const normalizeWhitespace = (input: string): string => input
  .replace(/\r/g, '')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const estimateTokensFromCharCount = (input: string): number => {
  if (!input) {
    return 0;
  }

  return Math.ceil(input.length / 4);
};

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

const appendVaryAccept = (headers: Headers): void => {
  const vary = headers.get('Vary');
  if (!vary) {
    headers.set('Vary', 'Accept');
    return;
  }

  if (vary.toLowerCase().split(',').map((varyValue) => varyValue.trim()).includes('accept')) {
    return;
  }

  headers.set('Vary', `${vary}, Accept`);
};

export default {
  async fetch(request, env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);
    const accept = request.headers.get('accept')?.toLowerCase() ?? '';

    if (!accept.includes('text/markdown')) {
      return response;
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType && !contentType.includes('text/html')) {
      return response;
    }

    const html = await response.text();
    const markdown = htmlToMarkdown(html);

    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    headers.set('x-markdown-tokens', String(estimateTokensFromCharCount(markdown)));
    headers.delete('Content-Length');
    appendVaryAccept(headers);

    return new Response(markdown, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
