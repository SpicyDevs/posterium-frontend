export type MediaType = 'movie' | 'tv' | 'anime';
export type RatingType =
  | 'imdb'
  | 'rt'
  | 'rt_popcorn'
  | 'letterboxd'
  | 'meta'
  | 'tmdb'
  | 'age'
  | 'runtime'
  | 'year'
  | 'mal'
  | 'anilist';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col' | 'custom';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType = 'tmdb' | 'fanart' | 'metahub' | 'mal' | 'anilist' | 'imdb';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp';
export type LogoSourceType = 'fanart' | 'tmdb' | 'metahub' | null;

export interface BadgeConfig {
  x?: number;
  y?: number;
  blur?: number;
  alpha?: number;
  radius?: number;
  shadow?: number;
  scale?: number;
  shadowX?: number;
  shadowY?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  bg?: string;
  txt?: string;
  borderW?: number;
  borderC?: string;
  icon?: boolean;
  showText?: boolean;
  iconType?: number;
  normalize?: boolean;
  outOf?: number;
  labelPos?: 'above' | 'below' | 'left' | 'right';
  labelText?: string;
  labelSize?: number;
  labelColor?: string;
  decimals?: number;
  forceDecimals?: boolean;
  outOfSize?: number;
  outOfColor?: string;
  iconPos?: 'left' | 'right' | 'above' | 'below' | 'center';
  labelInside?: boolean;
  textSize?: number;
  textWeight?: number;
  textLetterSpacing?: number;
  textLineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  lines?: '1' | '2';
  verticalAnchor?: 'top' | 'bottom';
  textMaxChars?: number;
  textMaxLines?: number;
  textBoxWidth?: number;
  textBoxHeight?: number;
  textCharWidth?: number;
  textCharHeight?: number;
  textWrapEnabled?: boolean;
  textShadowEnabled?: boolean;
  textShadowX?: number;
  textShadowY?: number;
  textShadowBlur?: number;
  textShadowColor?: string;
}

export interface PosterConfig {
  mediaType: MediaType;
  tmdbId: string;
  imdbId?: string;
  ratings: RatingType[];
  source: SourceType;
  ptype: string;
  textless: boolean;
  theme: ThemeType;
  size: SizeType;
  extension: ExtensionType;
  posterBlur: number;
  grayscale: boolean;
  layout: LayoutType;
  preset: PresetType;
  blur: number;
  alpha: number;
  radius: number;
  shadow: number;
  scale?: number;
  shadowX?: number;
  shadowY?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  bg?: string;
  txt?: string;
  borderW?: number;
  borderC?: string;
  icon?: boolean;
  showText?: boolean;
  iconType?: number;
  uiPreset?: 'b' | 'm';
  normalize?: boolean;
  outOf?: number;
  labelPos?: 'above' | 'below' | 'left' | 'right';
  labelText?: string;
  labelSize?: number;
  labelColor?: string;
  decimals?: number;
  forceDecimals?: boolean;
  outOfSize?: number;
  outOfColor?: string;
  uniform?: boolean;
  iconPos?: 'left' | 'right' | 'above' | 'below' | 'center';
  labelInside?: boolean;

  logoMaxW?: number | null;
  logoMaxH?: number | null;
  titleEnabled?: boolean;
  items: Partial<Record<RatingType, BadgeConfig>> & { title?: BadgeConfig };
  logo: boolean;
  logoSource: LogoSourceType;
  logoX: number | null;
  logoY: number;
  logoW: number;
  logoH: number;
  logoOpacity: number;
  logoZ?: number;
  logoShadow: number;
  fallbackEnabled: boolean;
  fallbackPool: RatingType[];
  noEmbed?: boolean;
  compressIcons?: boolean;
  sourcePriority?: string[];
  malId?: string;
  font?: string;
}
