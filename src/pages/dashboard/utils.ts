// src/pages/dashboard/utils.ts
import type { PosterItem } from './types';

export const API = 'https://api.spicydevs.xyz';

export const SAMPLE_URL =
  `${API}/movie/453395.png?r=imdb,rt,meta,tmdb&blur=8&alpha=0.45&rad=12&v=2&g_scale=1.000` +
  `&imdb_x=310&imdb_y=20&rt_x=310&rt_y=90&meta_x=310&meta_y=160&tmdb_x=310&tmdb_y=230`;

export const buildPosterUrl = (p: PosterItem, size: 'sm' | 'full' = 'sm'): string => {
  const ext = size === 'sm' ? 'svg' : 'png';
  return `${API}/${p.type}/${p.id}.${ext}?source=tmdb&r=${p.badges}${p.badgeConfig ?? ''}`;
};