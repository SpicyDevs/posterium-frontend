import { fetchWithTimeout, safeJsonFetch, fetchFanartData, extractFanartImage, extractImdbImage, normalizeServiceError } from './utils.js';
import { SOURCE_ADAPTERS } from './sources/index.js';

const PROVIDER_FETCH_REGISTRY = {
    fanart: {
        requirementKey: SOURCE_ADAPTERS.fanart.requirementKey,
        shouldFetch: ({ req, currentData, apiKeys }) => req.fanart && !currentData.posters?.fanart && apiKeys.fanartApiKey,
        fetch: ({ coreData, apiKeys, req }) => {
            const fanartId = coreData.type === 'movie' ? coreData.ids.tmdb : (coreData.ids.tvdb || coreData.ids.tmdb);
            if (!fanartId) return null;
            return fetchFanartData(fanartId, coreData.type, apiKeys.fanartApiKey).then(data => {
                if (!data) return null;
                return [
                    { source: 'fanart', type: 'text', url: extractFanartImage(data, coreData.type, false, req.fanartSecondBest) },
                    { source: 'fanart', type: 'textless', url: extractFanartImage(data, coreData.type, true, false) }
                ];
            });
        }
    },
    metahub: {
        requirementKey: SOURCE_ADAPTERS.metahub.requirementKey,
        shouldFetch: ({ req, currentData, workingImdbId }) => req.metahub && !currentData.posters?.metahub && workingImdbId,
        fetch: ({ workingImdbId }) => Promise.resolve({ source: 'metahub', url: `https://images.metahub.space/poster/medium/${workingImdbId}/img` })
    },
    imdb: {
        requirementKey: SOURCE_ADAPTERS.imdb.requirementKey,
        shouldFetch: ({ req, workingImdbId }) => req.imdb && workingImdbId,
        fetch: ({ workingImdbId, coreData, requestContext }) => safeJsonFetch(
            fetchWithTimeout(`https://api.imdbapi.dev/titles/${workingImdbId}/images?types=poster`, 3000, undefined, { ...requestContext, provider: 'imdb', inputType: coreData.type, id: workingImdbId, route: '/imdb/images' }),
            { ...requestContext, provider: 'imdb', inputType: coreData.type, id: workingImdbId, route: '/imdb/images' }
        ).then(data => {
            const url = extractImdbImage(data);
            return url ? { source: 'imdb', url } : null;
        })
    },
    mal: {
        requirementKey: SOURCE_ADAPTERS.mal.requirementKey,
        shouldFetch: ({ req, coreData }) => req.malImages && coreData.ids.mal,
        fetch: ({ coreData, requestContext }) => fetchWithTimeout(`https://api.jikan.moe/v4/anime/${coreData.ids.mal}`, 3500, undefined, { ...requestContext, provider: 'jikan', inputType: coreData.type, id: coreData.ids.mal, route: '/anime/:id' })
            .then(async res => {
                if (!res) return null;
                const data = (await res.json()).data;
                const imgs = data?.images;
                const posterUrl = imgs?.webp?.large_image_url || imgs?.jpg?.large_image_url;
                return posterUrl ? { source: 'mal', url: posterUrl } : null;
            })
    },
    tvdb: {
        requirementKey: SOURCE_ADAPTERS.tvdb.requirementKey,
        shouldFetch: ({ req }) => req.tvdb,
        fetch: () => Promise.resolve(null)
    },
    trakt: {
        requirementKey: SOURCE_ADAPTERS.trakt.requirementKey,
        shouldFetch: ({ req }) => req.trakt,
        fetch: () => Promise.resolve(null)
    },
    anilist: {
        requirementKey: SOURCE_ADAPTERS.anilist.requirementKey,
        shouldFetch: ({ req }) => req.anilist,
        fetch: () => Promise.resolve(null)
    }
};

// --- CORE FETCHING ---

export async function fetchCoreData(inputType, rawId, tmdbApiKey, cfg, requestContext = {}) {
    let activeType = inputType;
    let tmdbId = rawId;
    let title = "";
    let year = "";
    let ratings = {};
    let posters = { tmdb: { text: null, textless: null } };

    if (inputType === 'anime') {
        const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${rawId}`, 3500, undefined, { ...requestContext, provider: 'jikan', inputType, id: rawId, route: '/anime/:id' });
        const data = (await jikanRes.json()).data;

        title = data.title_english || data.title;
        year = data.aired?.from ? data.aired.from.split('-')[0] : "";

        if (data.score) ratings.mal = data.score.toString();
        if (data.rating) ratings.age = data.rating.split(' ')[0];
        if (data.duration) {
            const digits = data.duration.match(/\d+/);
            if (digits) ratings.runtime = `${digits[0]}m`;
        }

        const imgs = data.images;
        const posterUrl = imgs.webp?.large_image_url || imgs.jpg?.large_image_url;

        return {
            title, year,
            ids: { tmdb: null, imdb: null, mal: rawId },
            ratings,
            posters: { mal: { text: posterUrl } },
            type: 'anime'
        };
    } else {
        if (inputType === 'poster' || rawId.startsWith("tt")) {
            const findUrl = `https://api.themoviedb.org/3/find/${rawId}?api_key=${tmdbApiKey}&external_source=imdb_id`;
            const findData = await safeJsonFetch(fetchWithTimeout(findUrl, 2500, undefined, { ...requestContext, provider: 'tmdb', inputType, id: rawId, route: '/find/:id' }), { ...requestContext, provider: 'tmdb', inputType, id: rawId, route: '/find/:id' });
            if (findData?.movie_results?.length > 0) { activeType = 'movie'; tmdbId = findData.movie_results[0].id; }
            else if (findData?.tv_results?.length > 0) { activeType = 'tv'; tmdbId = findData.tv_results[0].id; }
            else throw normalizeServiceError({ code: "ID_NOT_FOUND", status: 404, message: "ID Not Found", failureClass: "not_found", provider: "tmdb" }, requestContext);
        }

        let appends = "external_ids,release_dates,content_ratings";
        if (cfg.textless) appends += ",images";

        const tmdbUrl = `https://api.themoviedb.org/3/${activeType}/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=${appends}&include_image_language=en,null`;
        const tmdbRes = await fetchWithTimeout(tmdbUrl, 2500, undefined, { ...requestContext, provider: 'tmdb', inputType: activeType, id: tmdbId, route: '/tmdb/:type/:id' });
        const movie = await tmdbRes.json();

        title = movie.title || movie.name;
        const releaseDate = movie.release_date || movie.first_air_date;
        year = releaseDate ? releaseDate.split('-')[0] : "";

        if (movie.vote_average) ratings.tmdb = Math.round(movie.vote_average * 10) + "%";

        if (movie.poster_path) posters.tmdb.text = `https://image.tmdb.org/t/p/w780${movie.poster_path}`;

        if (movie.images?.posters) {
            const tl = movie.images.posters.filter(p => p.iso_639_1 === null || p.iso_639_1 === 'xx' || p.iso_639_1 === "");
            if (tl.length > 0) {
                tl.sort((a, b) => b.vote_count - a.vote_count);
                posters.tmdb.textless = `https://image.tmdb.org/t/p/w780${tl[0].file_path}`;
            }
        }

        let runtime = "";
        let age = "";
        if (activeType === 'movie') {
            if (movie.runtime) { const h = Math.floor(movie.runtime / 60), m = movie.runtime % 60; runtime = h > 0 ? `${h}h ${m}m` : `${m}m`; }
            const us = movie.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
            if (us) age = us.release_dates.find(d => d.certification !== '')?.certification;
        } else {
            const r = movie.episode_run_time?.[0] || 0;
            if (r > 0) { const h = Math.floor(r / 60), m = r % 60; runtime = h > 0 ? `${h}h ${m}m` : `${m}m`; }
            const us = movie.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
            if (us) age = us.rating;
        }
        if (runtime) ratings.runtime = runtime;
        if (age) ratings.age = age;

        return {
            title, year,
            ids: { tmdb: tmdbId, imdb: movie.external_ids?.imdb_id, tvdb: movie.external_ids?.tvdb_id },
            ratings,
            posters,
            type: activeType,
            original_language: movie.original_language
        };
    }
}

// --- REQUIREMENTS LOGIC ---

export function determineRequirements(cfg, needsFull, inputType, coreData, cachedData) {
    const requestedRatings = cfg.ratings || [];
    const req = {
        fanart: false,
        mdblist: false,
        metahub: false,
        tmdbImages: false,
        jikanExternal: false,
        malImages: false,
        fanartSecondBest: false,
        imdb: false,
        tvdb: false,
        trakt: false,
        anilist: false
    };

    const selectedSource = cfg.source;
    const hasCoreMal = coreData.posters?.mal?.text;
    if (selectedSource === 'mal' && !cachedData?.posters?.mal && !hasCoreMal) {
        req.malImages = true;
    }

    if (needsFull) {
        req.tmdbImages = (inputType !== 'anime');
        req.fanart = true;
        if (inputType === 'anime' && !coreData.ids.imdb) req.jikanExternal = true;
        req.metahub = true;
        req.mdblist = true;
        req.imdb = true;
        return req;
    }

    const hasImdbId = !!coreData.ids.imdb;
    const hasCachedTextless = cachedData?.posters?.tmdb?.textless;
    const hasCoreTextless = coreData.posters.tmdb?.textless;

    if (inputType !== 'anime' && cfg.textless && !hasCoreTextless && !hasCachedTextless) {
        req.tmdbImages = true;
    }

    if ((!selectedSource || selectedSource === 'fanart') && !cachedData?.posters?.fanart) {
        req.fanart = true;
    }

    if (selectedSource === 'fanart') req.fanartSecondBest = true;

    Object.values(PROVIDER_FETCH_REGISTRY).forEach(provider => {
        const key = provider.requirementKey;
        if (!key || !selectedSource || key === 'tmdbImages') return;
        const sourceName = Object.keys(SOURCE_ADAPTERS).find(name => SOURCE_ADAPTERS[name].requirementKey === key);
        if (sourceName === selectedSource && !cachedData?.posters?.[sourceName]) {
            req[key] = true;
        }
    });

    if (hasImdbId || req.jikanExternal) {
        const externalRatings = ['imdb', 'rt', 'rt_popcorn', 'meta', 'letterboxd', 'runtime'];
        const needsMdbList = requestedRatings.some(r => externalRatings.includes(r));
        if (needsMdbList) req.mdblist = true;
    }

    return req;
}

export async function fetchSelectedAPIs(req, currentData, coreData, apiKeys, requestContext = {}) {
    const promises = [];
    const ids = coreData.ids;
    let workingImdbId = ids.imdb;

    if (req.jikanExternal && !workingImdbId) {
        const jikanPromise = fetchWithTimeout(`https://api.jikan.moe/v4/anime/${ids.mal}/external`, 3000, undefined, { ...requestContext, provider: 'jikan', inputType: coreData.type, id: ids.mal, route: '/anime/:id/external' })
            .then(async res => {
                if (!res) return null;
                const jData = await res.json();
                const imdbItem = jData.data?.find(e => e.name === 'IMDb');
                if (imdbItem?.url) {
                    const foundId = imdbItem.url.match(/tt\d+/)?.[0];
                    if (foundId) workingImdbId = foundId;
                    return { source: 'jikan_ext', id: foundId };
                }
                return null;
            });
        promises.push(jikanPromise);
    }

    if (coreData.original_language === 'ja' && !coreData.ids.mal && !currentData.ids?.mal) {
        promises.push(fetchWithTimeout(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(coreData.title)}&limit=1`, 3000, undefined, { ...requestContext, provider: 'jikan', inputType: coreData.type, id: ids.mal || ids.tmdb, route: '/anime/search' })
            .then(async res => {
                if (!res) return null;
                const data = await res.json();
                const match = data.data?.[0];
                if (match) return { source: 'mdblist', data: { mal_id: match.mal_id } };
                return null;
            }));
    }

    if (req.tmdbImages && coreData.type !== 'anime') {
        const url = `https://api.themoviedb.org/3/${coreData.type}/${ids.tmdb}/images?api_key=${apiKeys.tmdbApiKey}&include_image_language=en,null`;
        promises.push(fetchWithTimeout(url, 2500, undefined, { ...requestContext, provider: 'tmdb', inputType: coreData.type, id: ids.tmdb, route: '/tmdb/:type/:id/images' }).then(async res => {
            if (!res) return null;
            const data = await res.json();
            let textless = null;
            if (data.posters) {
                const tl = data.posters.filter(p => p.iso_639_1 === null || p.iso_639_1 === 'xx' || p.iso_639_1 === "");
                if (tl.length > 0) {
                    tl.sort((a, b) => b.vote_count - a.vote_count);
                    textless = `https://image.tmdb.org/t/p/w780${tl[0].file_path}`;
                }
            }
            return { source: 'tmdb_images', textless };
        }));
    }

    if (req.mdblist && apiKeys.mdbListApiKey && workingImdbId) {
        promises.push(safeJsonFetch(fetchWithTimeout(`https://mdblist.com/api/?apikey=${apiKeys.mdbListApiKey}&i=${workingImdbId}`, 3000, undefined, { ...requestContext, provider: 'mdblist', inputType: coreData.type, id: workingImdbId, route: '/mdblist' }), { ...requestContext, provider: 'mdblist', inputType: coreData.type, id: workingImdbId, route: '/mdblist' })
            .then(res => ({ source: 'mdblist', data: res })));
    }

    if (workingImdbId || coreData.type !== 'anime') {
        Object.values(PROVIDER_FETCH_REGISTRY).forEach(provider => {
            if (!provider.shouldFetch({ req, currentData, coreData, apiKeys, workingImdbId })) return;
            const promise = provider.fetch({ req, currentData, coreData, apiKeys, requestContext, workingImdbId });
            if (promise) promises.push(promise);
        });
    }

    const results = await Promise.allSettled(promises);
    return results
        .map(r => {
            if (r.status === 'fulfilled') return r.value;
            return {
                source: 'error',
                error: normalizeServiceError(r.reason, {
                    ...requestContext,
                    code: 'FETCH_SELECTED_API_ERROR',
                    status: r.reason?.status || 502,
                    failureClass: r.reason?.failureClass || 'upstream_error'
                })
            };
        })
        .filter(Boolean)
        .flat();
}
