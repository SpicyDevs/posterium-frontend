import tmdb from './tmdb.js';
import fanart from './fanart.js';
import imdb from './imdb.js';
import metahub from './metahub.js';
import mal from './mal.js';
import tvdb from './tvdb.js';
import trakt from './trakt.js';
import anilist from './anilist.js';

export const SOURCE_ADAPTERS = {
    tmdb,
    fanart,
    imdb,
    metahub,
    mal,
    tvdb,
    trakt,
    anilist
};

export const SUPPORTED_SOURCES = Object.keys(SOURCE_ADAPTERS);
export const DEFAULT_SOURCE_PRIORITY = ['tmdb', 'fanart', 'imdb', 'metahub', 'mal', 'tvdb', 'trakt', 'anilist'];

export function getSourceAdapter(sourceName) {
    return sourceName ? SOURCE_ADAPTERS[sourceName] : null;
}
