import type { PosterConfig, RatingType } from '../types';
import { DEFAULT_API_BASE, V3_KEY_TO_CODE, isApiRatingKey, DEFAULTS } from './constants';
import { calculateAutoPosition } from './positioning';

export const generateApiUrl = (
  config: PosterConfig,
  baseUrl: string = DEFAULT_API_BASE
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');

  const displayId = config.imdbId || '{imdb_id}';
  const pathSegment = `/poster/${displayId}`;

  const p = new URLSearchParams();

  p.set('v', '3');

  const apiRatings = config.ratings.filter(isApiRatingKey);
  if (apiRatings.length > 0) {
    p.set('r', apiRatings.map((r) => V3_KEY_TO_CODE[r] ?? r).join(','));
  }

  const apiFallbackPool = config.fallbackPool.filter(isApiRatingKey);
  if (config.fallbackEnabled && apiFallbackPool.length > 0) {
    p.set('fb', apiFallbackPool.map((r) => V3_KEY_TO_CODE[r] ?? r).join(','));
  }

  if (config.source && config.source !== 'tmdb') p.set('source', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) p.set('tl', '1');
  if (config.ptype && config.ptype !== 'auto') p.set('pt', config.ptype);

  if (config.keys?.tmdb) p.set('tmdb_key', config.keys.tmdb);
  if (config.keys?.fanart) p.set('fanart_key', config.keys.fanart);
  if (config.keys?.omdb) p.set('omdb_key', config.keys.omdb);
  if (config.keys?.mdblist) p.set('mdblist_key', config.keys.mdblist);

  if (config.blur !== DEFAULTS.blur) p.set('bl', config.blur.toString());
  if (config.alpha !== DEFAULTS.alpha) p.set('al', config.alpha.toString());
  if (config.radius !== DEFAULTS.radius) p.set('ra', config.radius.toString());
  if (config.shadow !== DEFAULTS.shadow) p.set('sh', config.shadow.toString());

  const globalScale = config.scale ?? 1.0;
  if (globalScale !== DEFAULTS.scale) p.set('sc', globalScale.toFixed(3));

  if ((config.borderW ?? 0) > 0) p.set('bw', config.borderW!.toString());
  if (config.borderC) p.set('bc', config.borderC);
  if (config.bg) p.set('bg', config.bg);
  if (config.txt) p.set('tx', config.txt);
  if (config.icon === false) p.set('ic', '0');

  if (config.posterBlur > DEFAULTS.posterBlur) p.set('pb', config.posterBlur.toString());
  if (config.grayscale) p.set('gs', '1');
  if (config.minimalTextSize !== DEFAULTS.minimalTextSize) p.set('mts', config.minimalTextSize.toString());
  if (config.minimalTextX !== DEFAULTS.minimalTextX) p.set('mtx', config.minimalTextX.toString());
  if (config.minimalTextY !== DEFAULTS.minimalTextY) p.set('mty', config.minimalTextY.toString());

  if (config.layout !== 'custom') p.set('l', config.layout);
  if (config.preset !== 'custom') p.set('pos', config.preset);

  if (config.uiPreset && config.uiPreset !== 'b') p.set('p', config.uiPreset);

  if (config.showText === false) p.set('nt', '1');

  if (config.normalize) p.set('nm', '1');
  if (config.outOf !== undefined && config.outOf > 0) p.set('of', config.outOf.toString());

  if ((config.iconType ?? DEFAULTS.iconType) > DEFAULTS.iconType)
    p.set('it', config.iconType!.toString());

  if (config.labelPos) p.set('lp', config.labelPos);
  if (config.labelText) p.set('lt', config.labelText);
  if (config.labelSize !== undefined && config.labelSize !== DEFAULTS.labelSize)
    p.set('ls', config.labelSize.toString());
  if (config.labelColor) p.set('lc', config.labelColor);

  config.ratings.filter(isApiRatingKey).forEach((key: RatingType, index: number) => {
    const item = config.items[key] || {};
    const code = V3_KEY_TO_CODE[key];
    if (!code) return;

    const autoPos = calculateAutoPosition(key, index, config.ratings.length, config);
    const finalX = item.x !== undefined ? item.x : autoPos.x;
    const finalY = item.y !== undefined ? item.y : autoPos.y;

    p.set(`${code}_x`, Math.round(finalX).toString());
    p.set(`${code}_y`, Math.round(finalY).toString());

    if (item.bg !== undefined && item.bg !== (config.bg ?? '')) p.set(`${code}_bg`, item.bg);
    if (item.txt !== undefined && item.txt !== (config.txt ?? '')) p.set(`${code}_tx`, item.txt);

    const eff = (itemVal: any, globalVal: any): boolean =>
      itemVal !== undefined && itemVal !== globalVal;

    if (eff(item.blur, config.blur)) p.set(`${code}_bl`, item.blur!.toString());
    if (eff(item.alpha, config.alpha)) p.set(`${code}_al`, item.alpha!.toString());
    if (eff(item.radius, config.radius)) p.set(`${code}_ra`, item.radius!.toString());
    if (eff(item.shadow, config.shadow)) p.set(`${code}_sh`, item.shadow!.toString());

    const itemIcon = item.icon ?? config.icon ?? true;
    if (itemIcon !== (config.icon ?? true)) p.set(`${code}_ic`, itemIcon ? '1' : '0');

    if (item.scale !== undefined && item.scale !== (config.scale ?? 1.0))
      p.set(`${code}_sc`, item.scale.toFixed(3));

    if ((item.borderW ?? 0) > 0 && (item.borderW ?? 0) !== (config.borderW ?? 0))
      p.set(`${code}_bw`, item.borderW!.toString());
    if (item.borderC !== undefined && item.borderC !== (config.borderC ?? '#ffffff'))
      p.set(`${code}_bc`, item.borderC);

    if (item.showText === false && config.showText !== false) p.set(`${code}_nt`, '1');

    if (item.normalize !== undefined && item.normalize !== (config.normalize ?? false))
      p.set(`${code}_nm`, item.normalize ? '1' : '0');
    if (item.outOf !== undefined && item.outOf > 0 && item.outOf !== (config.outOf ?? 0))
      p.set(`${code}_of`, item.outOf.toString());

    if (item.iconType !== undefined && item.iconType !== (config.iconType ?? DEFAULTS.iconType))
      p.set(`${code}_it`, item.iconType.toString());

    if (item.labelPos !== undefined && item.labelPos !== config.labelPos)
      p.set(`${code}_lp`, item.labelPos);
    if (item.labelText !== undefined && item.labelText !== config.labelText)
      p.set(`${code}_lt`, item.labelText);
    if (item.labelSize !== undefined && item.labelSize !== (config.labelSize ?? DEFAULTS.labelSize))
      p.set(`${code}_ls`, item.labelSize.toString());
    if (item.labelColor !== undefined && item.labelColor !== config.labelColor)
      p.set(`${code}_lc`, item.labelColor);
    if (item.textCharWidth !== undefined && key === 'title')
      p.set(`${code}_tw`, Math.round(item.textCharWidth).toString());
    if (item.textCharHeight !== undefined && key === 'title')
      p.set(`${code}_th`, Math.round(item.textCharHeight).toString());
    if (item.textWrapEnabled !== undefined && key === 'title')
      p.set(`${code}_wr`, item.textWrapEnabled ? '1' : '0');
  });

  if (config.logo) {
    p.set('logo', '1');
    if (config.logoSource) p.set('logo_source', config.logoSource);
    if (config.logoX !== null && config.logoX !== undefined)
      p.set('logo_x', config.logoX.toString());
    if (config.logoY !== DEFAULTS.logoY) p.set('logo_y', config.logoY.toString());
    if (config.logoW !== DEFAULTS.logoW) p.set('logo_w', config.logoW.toString());
    if (config.logoH !== DEFAULTS.logoH) p.set('logo_h', config.logoH.toString());
    if (config.logoOpacity !== DEFAULTS.logoOpacity)
      p.set('logo_opacity', config.logoOpacity.toFixed(2));
    if (config.logoShadow !== DEFAULTS.logoShadow) p.set('logo_sh', config.logoShadow.toString());
    if (config.logoBgEnabled) p.set('logo_bg', '1');
    if (config.logoBgColor && config.logoBgColor !== '#000000') p.set('logo_bg_c', config.logoBgColor);
    if (config.logoBgOpacity !== DEFAULTS.logoBgOpacity)
      p.set('logo_bg_a', config.logoBgOpacity.toFixed(2));
    if (config.logoBgRadius !== DEFAULTS.logoBgRadius)
      p.set('logo_bg_r', config.logoBgRadius.toString());
    if (config.logoBgPadding !== DEFAULTS.logoBgPadding)
      p.set('logo_bg_p', config.logoBgPadding.toString());
    if (config.logoBgBorderW !== DEFAULTS.logoBgBorderW)
      p.set('logo_bg_bw', config.logoBgBorderW.toString());
    if (config.logoBgBorderC && config.logoBgBorderC !== '#ffffff')
      p.set('logo_bg_bc', config.logoBgBorderC);
    if (config.logoBgShadow !== DEFAULTS.logoBgShadow)
      p.set('logo_bg_sh', config.logoBgShadow.toString());
  }

  const queryString = p.toString();
  return `${cleanBase}${pathSegment}.${config.extension}${queryString ? '?' + queryString : ''}`;
};
