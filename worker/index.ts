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
    if (end === -1) break;
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
  if (!input) return 0;
  return Math.ceil(input.length / 4);
};

const extractTextMarkdownFromHtml = (html: string): string => {
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
  if (vary.toLowerCase().split(',').map((v) => v.trim()).includes('accept')) return;
  headers.set('Vary', `${vary}, Accept`);
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);
    const accept = request.headers.get('accept')?.toLowerCase() ?? '';
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

    // 1. AI Agent Markdown Handling
    if (accept.includes('text/markdown') && contentType.includes('text/html')) {
      const html = await response.text();
      const markdown = extractTextMarkdownFromHtml(html);

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
    }

    // 2. Standard Web Traffic - Inject Security Headers
    const secureHeaders = new Headers(response.headers);
    
    // Core Security Headers
    secureHeaders.set('X-Frame-Options', 'DENY');
    secureHeaders.set('X-Content-Type-Options', 'nosniff');
    secureHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    secureHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    
    // Content Security Policy (Tailored for Posterium's TMDB images and Google Fonts)
    secureHeaders.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https://image.tmdb.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.spicydevs.xyz;");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: secureHeaders,
    });
  },
} satisfies ExportedHandler<Env>;
