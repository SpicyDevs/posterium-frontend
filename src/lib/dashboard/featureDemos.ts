// src/lib/dashboard/featureDemos.ts
import { API } from './constants';

export interface FeatureDemo {
  id: string;
  type: 'movie' | 'tv';
  r: string;
  pos: string;
}

export const FEATURE_DEMOS: Record<string, FeatureDemo> = {
  'Drag-Drop Editor': {
    id: '155',
    type: 'movie',
    r: 'imdb,rt,meta,tmdb',
    pos: 'imdb_x=310&imdb_y=22&rt_x=310&rt_y=96&meta_x=310&meta_y=170&tmdb_x=310&tmdb_y=244',
  },
  'Instant API URL': {
    id: '27205',
    type: 'movie',
    r: 'imdb,rt',
    pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88',
  },
  'Multiple Sources': {
    id: '872585',
    type: 'movie',
    r: 'rt,meta',
    pos: 'rt_x=14&rt_y=14&meta_x=310&meta_y=14',
  },
  'Live Ratings': { id: '1396', type: 'tv', r: 'imdb', pos: 'imdb_x=14&imdb_y=14' },
  'Movies, TV & Anime': {
    id: '238',
    type: 'movie',
    r: 'imdb,meta',
    pos: 'imdb_x=14&imdb_y=14&meta_x=14&meta_y=88',
  },
  'Any Export Format': { id: '475557', type: 'movie', r: 'rt', pos: 'rt_x=14&rt_y=14' },
  'Textless Posters': { id: '157336', type: 'movie', r: 'imdb', pos: 'imdb_x=310&imdb_y=14' },
  'Plex & Jellyfin Ready': {
    id: '680',
    type: 'movie',
    r: 'imdb,rt',
    pos: 'imdb_x=14&imdb_y=14&rt_x=14&rt_y=88',
  },
};

export const ICON_MAP: Record<string, string> = {
  'Drag-Drop Editor': '⌖',
  'Instant API URL': '⚡',
  'Multiple Sources': '⊞',
  'Live Ratings': '◉',
  'Movies, TV & Anime': '▣',
  'Any Export Format': '◫',
  'Textless Posters': '◻',
  'Plex & Jellyfin Ready': '▤',
};

export const FEATURE_SRCS: Record<string, string> = Object.fromEntries(
  Object.entries(FEATURE_DEMOS).map(([title, d]) => [
    title,
    `${API}/${d.type}/${d.id}.svg?r=${d.r}&source=tmdb&blur=7&alpha=0.43&rad=10&${d.pos}`,
  ])
);
