import type { PosterConfig, RatingType } from '../types';
import { DEFAULT_API_BASE, V3_KEY_TO_CODE, isApiRatingKey, DEFAULTS } from './constants';
import { calculateAutoPosition } from './positioning';

export const generateApiUrl = (
  config: PosterConfig,
  baseUrl: string = DEFAULT_API_BASE
): string => {
  const cleanBase = baseUrl.replace(/\/$/, '');

  let pathSegment: string;
  if (config.imdbId) {
    pathSegment = `/poster/${config.imdbId}`;
  } else if (config.mediaType && config.tmdbId) {
    pathSegment = `/${config.mediaType}/${config.tmdbId}`;
  } else {
    pathSegment = `/poster/{imdb_id}`;
  }

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

  p.set('source', config.source);
  if (config.textless && !['metahub', 'imdb'].includes(config.source)) p.set('tl', '1');
  if (config.ptype && config.ptype !== 'auto') p.set('pt', config.ptype);

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

  if (config.uiPreset && config.uiPreset !== 'b') p.set('p', config.uiPreset);

  if (config.showText === false) p.set('nt', '1');

  if (config.normalize) p.set('nm', '1');
  if (config.noEmbed) p.set('ne', '1');
  if (config.outOf !== undefined) p.set('of', config.outOf.toString());

  if (config.iconType !== undefined) p.set('it', config.iconType.toString());

  if (config.labelPos) p.set('lp', config.labelPos);
  if (config.labelText) p.set('lt', config.labelText);
  if (config.labelSize !== undefined && config.labelSize !== DEFAULTS.labelSize)
    p.set('ls', config.labelSize.toString());
  if (config.labelColor) p.set('lc', config.labelColor);

  if (config.decimals !== undefined && config.decimals !== DEFAULTS.decimals) p.set('dc', config.decimals.toString());
  if (config.forceDecimals) p.set('fd', '1');
  if (config.outOfSize !== undefined && config.outOfSize !== DEFAULTS.outOfSize) p.set('os', config.outOfSize.toString());
  if (config.outOfColor) p.set('oc', config.outOfColor);
  if (config.uniform) p.set('ub', '1');
  if (config.iconPos && config.iconPos !== DEFAULTS.iconPos) p.set('ip', config.iconPos);
  if (config.labelInside) p.set('li', '1');
  if (config.logoMaxW !== null && config.logoMaxW !== undefined) p.set('lmw', config.logoMaxW.toString());
  if (config.logoMaxH !== null && config.logoMaxH !== undefined) p.set('lmh', config.logoMaxH.toString());

  const titleItem = config.items?.title;
  if (titleItem && (config.titleEnabled ?? false)) {
    const T = 'T';
    p.set('ti', '1');
    if (titleItem.x !== undefined) p.set(`${T}_x`, titleItem.x.toString());
    if (titleItem.y !== undefined) p.set(`${T}_y`, titleItem.y.toString());
    if (titleItem.textSize !== undefined && titleItem.textSize !== 48) p.set(`${T}_sz`, titleItem.textSize.toString());
    if (titleItem.txt !== undefined && titleItem.txt !== '#ffffff') p.set(`${T}_tx`, titleItem.txt);
    if (titleItem.textAlign !== undefined && titleItem.textAlign !== 'left') p.set(`${T}_ta`, titleItem.textAlign);
    if (titleItem.textBoxWidth !== undefined && titleItem.textBoxWidth !== 450) p.set(`${T}_wd`, titleItem.textBoxWidth.toString());
    if (titleItem.textWeight !== undefined && titleItem.textWeight !== 800) p.set(`${T}_wt`, titleItem.textWeight.toString());
    if (titleItem.shadow !== undefined && titleItem.shadow > 0) p.set(`${T}_sh`, titleItem.shadow.toString());
    if (titleItem.lines !== undefined) p.set(`${T}_ln`, titleItem.lines);
    const vaDefault = config.uiPreset === 'm' ? 'bottom' : 'top';
    if (titleItem.verticalAnchor !== undefined && titleItem.verticalAnchor !== vaDefault) p.set(`${T}_va`, titleItem.verticalAnchor);
  }

  if (config.sourcePriority && config.sourcePriority.length > 0) p.set('so', config.sourcePriority.join(','));
  if (config.malId) p.set('mid', config.malId);
  if (config.font) p.set('fn', config.font);

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
    if (item.shadowX !== undefined && item.shadowX !== 0) p.set(`${code}_sx`, item.shadowX.toString());
    if (item.shadowY !== undefined && item.shadowY !== (config.shadowY ?? 2)) p.set(`${code}_sy`, item.shadowY.toString());
    if (item.shadowColor !== undefined && item.shadowColor !== '#000000') p.set(`${code}_sv`, item.shadowColor);
    if (item.shadowOpacity !== undefined && item.shadowOpacity !== 0.35) p.set(`${code}_sw`, item.shadowOpacity.toString());

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
    if (item.decimals !== undefined && item.decimals !== (config.decimals ?? DEFAULTS.decimals))
      p.set(`${code}_dc`, item.decimals.toString());
    if (item.forceDecimals !== undefined && item.forceDecimals !== (config.forceDecimals ?? false))
      p.set(`${code}_fd`, item.forceDecimals ? '1' : '0');
    if (item.outOfSize !== undefined && item.outOfSize !== (config.outOfSize ?? DEFAULTS.outOfSize))
      p.set(`${code}_os`, item.outOfSize.toString());
    if (item.outOfColor !== undefined && item.outOfColor !== config.outOfColor)
      p.set(`${code}_oc`, item.outOfColor);
    if (item.iconPos !== undefined && item.iconPos !== config.iconPos)
      p.set(`${code}_ip`, item.iconPos);
    if (item.labelInside !== undefined && item.labelInside !== (config.labelInside ?? false))
      p.set(`${code}_li`, item.labelInside ? '1' : '0');

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
    if (config.logoZ !== undefined && config.logoZ !== DEFAULTS.logoZ) p.set('lz', config.logoZ.toString());
  }

  const queryString = p.toString();
  return `${cleanBase}${pathSegment}.${config.extension}${queryString ? '?' + queryString : ''}`;
};
