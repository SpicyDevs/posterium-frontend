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
  | 'title'
  | 'mal'
  | 'anilist';
export type ThemeType = 'glass' | 'solid';
export type SizeType = 'sm' | 'md' | 'lg';
export type LayoutType = 'row' | 'col' | 'custom';
export type PresetType = 'tl' | 'tr' | 'bl' | 'br' | 'tc' | 'bc' | 'lc' | 'rc' | 'cc' | 'custom';
export type SourceType = 'tmdb' | 'fanart' | 'metahub' | 'mal' | 'anilist' | 'imdb';
export type ExtensionType = 'svg' | 'jpg' | 'png' | 'webp';
export type LogoSourceType = 'fanart' | 'tmdb' | 'metahub' | null;
export type MinimalRatingIconMode = 'star' | 'original' | 'flat' | 'symbol';

export interface MinimalRatingConfig {
  provider: RatingType;
  enabled: boolean;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  iconMode: MinimalRatingIconMode;
  symbol: string;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  borderW: number;
  borderColor: string;
  borderOpacity: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  shadowEnabled: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
}

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
  textSize?: number;
  textWeight?: number;
  textLetterSpacing?: number;
  textLineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
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

export interface ApiKeys {
  tmdb?: string;
  fanart?: string;
  omdb?: string;
  mdblist?: string;
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
  minimalTextSize: number;
  minimalTextX: number;
  minimalTextY: number;
  minimalTitleEnabled?: boolean;
  minimalTitleWidth?: number;
  minimalTitleAlign?: 'left' | 'center' | 'right';
  minimalTitleFlow?: 'up' | 'down';
  minimalTitleColor?: string;
  minimalTitleOpacity?: number;
  minimalTitleWeight?: number;
  minimalTitleLetterSpacing?: number;
  minimalTitleLineHeight?: number;
  minimalTitleShadowEnabled?: boolean;
  minimalTitleShadowX?: number;
  minimalTitleShadowY?: number;
  minimalTitleShadowBlur?: number;
  minimalTitleShadowColor?: string;
  minimalTitleBorderW?: number;
  minimalTitleBorderColor?: string;
  minimalTitleBorderOpacity?: number;
  minimalTitleBgEnabled?: boolean;
  minimalTitleBgColor?: string;
  minimalTitleBgOpacity?: number;
  minimalTitlePaddingX?: number;
  minimalTitlePaddingY?: number;
  minimalTitleRadius?: number;
  minimalRatingsEnabled?: boolean;
  minimalRatingIconMode?: MinimalRatingIconMode;
  minimalRatingSymbol?: string;
  minimalRatings?: MinimalRatingConfig[];
  minimalYearEnabled?: boolean;
  minimalDurationEnabled?: boolean;
  minimalMetaX?: number;
  minimalMetaY?: number;
  minimalDurationX?: number;
  minimalDurationY?: number;
  minimalMetaSize?: number;
  minimalMetaColor?: string;
  minimalMetaOpacity?: number;
  minimalMetaWeight?: number;
  minimalMetaLetterSpacing?: number;
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
  items: Partial<Record<RatingType, BadgeConfig>>;
  logo: boolean;
  logoSource: LogoSourceType;
  logoX: number | null;
  logoY: number;
  logoW: number;
  logoH: number;
  logoOpacity: number;
  logoZ?: number;
  logoShadow: number;
  logoBgEnabled: boolean;
  logoBgColor?: string;
  logoBgOpacity: number;
  logoBgRadius: number;
  logoBgPadding: number;
  logoBgBorderW: number;
  logoBgBorderC?: string;
  logoBgShadow: number;
  fallbackEnabled: boolean;
  fallbackPool: RatingType[];
  keys?: ApiKeys;
}
