/**
 * handlers/backdrop.ts
 *
 * Handler stubs for the v3 backdrop and banner endpoints.
 *
 * Routes (to be registered in the Cloudflare Worker / backend):
 *   GET /:type/:id/backdrop
 *   GET /:type/:id/banner   (alias of backdrop)
 *
 * Both routes respond with HTTP 501 Not Implemented until the feature is
 * fully built.  They accept the following query params:
 *
 * @param source   - Poster source: tmdb | fanart | imdb | metahub
 * @param width    - Output image width in pixels (default: 1280)
 * @param textless - Strip title text from artwork (1 | 0, default: 0)
 * @param lang     - ISO 639-1 language code for localised artwork (default: "en")
 * @param no_embed - When 1, return raw image instead of embedded poster (default: 0)
 *
 * Implementation notes:
 * ─────────────────────
 * 1. Backdrop images are typically 16:9 artwork fetched from TMDB / Fanart.
 * 2. The banner route is a semantic alias; both share identical logic.
 * 3. When implemented, output formats should mirror the poster endpoints:
 *    SVG, PNG, JPG, WebP based on the file extension in the URL path.
 *
 * Example future request:
 *   GET /movie/155/backdrop.webp?source=tmdb&width=1920&textless=1
 */

export interface BackdropParams {
  /** Artwork source provider */
  source?: 'tmdb' | 'fanart' | 'imdb' | 'metahub';
  /** Output pixel width (default 1280) */
  width?: number;
  /** Strip title text overlay (default false) */
  textless?: boolean;
  /** ISO 639-1 language code (default "en") */
  lang?: string;
  /** Return raw image instead of embedded poster frame (default false) */
  no_embed?: boolean;
}

/**
 * Parses backdrop/banner query params from a URLSearchParams object.
 * Returns defaults for any missing values.
 */
export function parseBackdropParams(query: URLSearchParams): BackdropParams {
  const source = (query.get('source') ?? 'tmdb') as BackdropParams['source'];
  const width = query.has('width') ? parseInt(query.get('width')!, 10) : 1280;
  const textless = query.get('textless') === '1';
  const lang = query.get('lang') ?? 'en';
  const no_embed = query.get('no_embed') === '1';
  return { source, width, textless, lang, no_embed };
}

/**
 * Backdrop handler — responds 501 until implemented.
 *
 * In the Cloudflare Worker, register this handler for:
 *   router.get('/:type/:id/backdrop', handleBackdrop)
 *   router.get('/:type/:id/backdrop.:ext', handleBackdrop)
 *   router.get('/:type/:id/banner',   handleBackdrop)   // alias
 *   router.get('/:type/:id/banner.:ext', handleBackdrop) // alias
 */
export function handleBackdrop(
  _type: string,
  _id: string,
  _params: BackdropParams
): { status: 501; body: string } {
  return {
    status: 501,
    body: JSON.stringify({
      error: 'Not Implemented',
      message: 'Backdrop/banner endpoints are not yet implemented.',
      hint: 'Track progress at https://github.com/a5sh/freeposterapi',
    }),
  };
}

/** Banner is a semantic alias for backdrop. */
export const handleBanner = handleBackdrop;
