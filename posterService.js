import { fetchWithTimeout, safeJsonFetch, getD1Cache, setD1Cache, getFanartPoster } from './utils.js';

export async function getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, format) {
    const { tmdbApiKey, fanartApiKey, mdbListApiKey } = apiKeys;
    const cacheKey = rawId; // We now pass rawId directly to D1 helper, let it decide query based on type

    // 1. Check Cache
    // Note: getD1Cache now takes (db, type, id)
    let cachedData = await getD1Cache(env.POSTER_CACHE, inputType, rawId);
    
    if (cachedData && cachedData.cacheLevel === 'full') {
        if (cfg.textless && !cachedData.posters.tmdb?.textless && inputType !== 'anime') {
             // Fall through to fetch textless
        } else {
             return { ...processCachedData(cachedData, cfg), isCached: true };
        }
    }

    // If partial cache exists, return it but hydrate in background
    if (cachedData && format !== 'json' && !(cfg.textless && !cachedData.posters.tmdb?.textless)) {
        ctx.waitUntil(hydrateCache(env, cachedData, apiKeys));
        return { ...processCachedData(cachedData, cfg), isCached: true };
    }

    // 2. Fetch Core Data
    let coreData = cachedData?.core ? cachedData.core : await fetchCoreData(inputType, rawId, tmdbApiKey, cfg);
    
    // Inject parsed malId if available and not in core
    if (cfg.malId && !coreData.ids.mal) {
        coreData.ids.mal = cfg.malId;
    }

    // 3. Determine Requirements
    const needsFull = (format === 'json');
    const required = determineRequirements(cfg, needsFull, inputType, coreData, cachedData);
    
    // 4. Fetch Selected APIs
    const currentData = cachedData || { ratings: {}, posters: {}, mdblist: null };
    const fetchedResults = await fetchSelectedAPIs(required, currentData, coreData, apiKeys);
    
    // Merge
    const mergedData = mergeData(coreData, currentData, fetchedResults);

    // 5. Background Hydration or Save
    if (!needsFull) {
        ctx.waitUntil(hydrateCache(env, mergedData, apiKeys));
    } else {
        mergedData.cacheLevel = 'full';
        // Note: setD1Cache takes (db, type, ids, data)
        ctx.waitUntil(setD1Cache(env.POSTER_CACHE, mergedData.core.type, mergedData.ids, mergedData));
    }

    return processCachedData(mergedData, cfg);
}

// --- CORE FETCHING ---

async function fetchCoreData(inputType, rawId, tmdbApiKey, cfg) {
    let activeType = inputType;
    let tmdbId = rawId;
    let movie = {};
    let ratings = {};
    
    if (inputType === 'anime') {
        const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${rawId}`, 3500);
        if (!jikanRes) throw new Error("Resource Not Found");
        const data = (await jikanRes.json()).data;
        
        movie = {
            id: data.mal_id,
            title: data.title_english || data.title,
            name: data.title_english || data.title,
            overview: data.synopsis,
            release_date: data.aired?.from ? data.aired.from.split('T')[0] : null,
            status: data.status,
            genres: data.genres,
            external_ids: {},
            popularity: data.popularity || 0, 
            vote_count: data.members || 0
        };
        
        if (data.score) ratings.mal = data.score.toString();
        if (data.rating) ratings.age = data.rating.split(' ')[0];
        if (data.duration) {
             const digits = data.duration.match(/\d+/);
             if (digits) ratings.runtime = `${digits[0]}m`;
        }

        const imgs = data.images;
        const posterUrl = imgs.webp?.large_image_url || imgs.jpg?.large_image_url;
        
        return { 
            movie, 
            ids: { tmdb: null, imdb: null, mal: rawId }, 
            ratings, 
            posters: { mal: { text: posterUrl, textless: null } },
            type: 'anime'
        };
    } else {
        // TMDB Logic
        if (inputType === 'poster' || rawId.startsWith("tt")) {
            const findUrl = `https://api.themoviedb.org/3/find/${rawId}?api_key=${tmdbApiKey}&external_source=imdb_id`;
            const findData = await safeJsonFetch(fetchWithTimeout(findUrl, 2500));
            if (findData?.movie_results?.length > 0) { activeType = 'movie'; tmdbId = findData.movie_results[0].id; }
            else if (findData?.tv_results?.length > 0) { activeType = 'tv'; tmdbId = findData.tv_results[0].id; }
            else throw new Error("ID Not Found");
        }

        let appends = "external_ids,release_dates,content_ratings";
        if (cfg.textless) {
             appends += ",images"; 
        }

        const tmdbUrl = `https://api.themoviedb.org/3/${activeType}/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=${appends}&include_image_language=en,null`;
        const tmdbRes = await fetchWithTimeout(tmdbUrl, 2500);
        if (!tmdbRes) throw new Error("Resource Not Found");
        movie = await tmdbRes.json();
        
        if (movie.vote_average) ratings.tmdb = Math.round(movie.vote_average * 10) + "%";
        
        const tmdbPosters = { text: null, textless: null };
        if (movie.poster_path) tmdbPosters.text = `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
        
        if (movie.images?.posters) {
            const tl = movie.images.posters.filter(p => p.iso_639_1 === null || p.iso_639_1 === 'xx' || p.iso_639_1 === "");
            if (tl.length > 0) {
                tl.sort((a, b) => b.vote_count - a.vote_count);
                tmdbPosters.textless = `https://image.tmdb.org/t/p/w780${tl[0].file_path}`;
            }
        }

        let runtime = "";
        let age = "";
        if (activeType === 'movie') {
            if (movie.runtime) { const h = Math.floor(movie.runtime/60), m=movie.runtime%60; runtime = h>0?`${h}h ${m}m`:`${m}m`; }
            const us = movie.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
            if (us) age = us.release_dates.find(d => d.certification !== '')?.certification;
        } else {
             const r = movie.episode_run_time?.[0] || 0;
             if(r>0) { const h=Math.floor(r/60), m=r%60; runtime = h>0?`${h}h ${m}m`:`${m}m`; }
             const us = movie.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
             if(us) age = us.rating;
        }
        if(runtime) ratings.runtime = runtime;
        if(age) ratings.age = age;

        return {
            movie,
            ids: { tmdb: tmdbId, imdb: movie.external_ids?.imdb_id, tvdb: movie.external_ids?.tvdb_id },
            ratings,
            posters: { tmdb: tmdbPosters },
            type: activeType
        };
    }
}

// --- REQUIREMENTS LOGIC ---

function determineRequirements(cfg, needsFull, inputType, coreData, cachedData) {
    const requestedRatings = cfg.ratings || [];
    const req = { 
        fanart: false, 
        mdblist: false, 
        metahub: false, 
        tmdbImages: false,
        jikanExternal: false,
        malImages: false
    };
    
    // Check if we need to fetch MAL images (Anime source)
    if (cfg.source === 'mal' && !cachedData?.posters?.mal) {
        req.malImages = true;
    }

    if (needsFull) {
        req.tmdbImages = (inputType !== 'anime'); 
        req.fanart = true;
        if (inputType === 'anime' && !coreData.ids.imdb) {
            req.jikanExternal = true;
        }
        req.metahub = true;
        req.mdblist = true;
        return req;
    }
    
    // Fast Path Logic
    
    if (inputType === 'anime' && !coreData.ids.imdb) {
        const needsExternal = requestedRatings.some(r => ['imdb', 'rt', 'meta', 'letterboxd'].includes(r));
        if (needsExternal) req.jikanExternal = true;
    }
    
    const hasImdbId = !!coreData.ids.imdb; 

    const hasCachedTextless = cachedData?.posters?.tmdb?.textless;
    const hasCoreTextless = coreData.posters.tmdb?.textless;
    
    if (inputType !== 'anime' && cfg.textless && !hasCoreTextless && !hasCachedTextless) {
         req.tmdbImages = true;
    }

    if (cfg.source === 'fanart' && !cachedData?.posters?.fanart) req.fanart = true;
    if (cfg.source === 'metahub' && !cachedData?.posters?.metahub) req.metahub = true;

    if (hasImdbId || req.jikanExternal) {
        // Updated: Check if any ratings usually fetched from external sources are needed
        // All these now come from MDBList
        const externalRatings = ['imdb', 'rt', 'rt_popcorn', 'meta', 'letterboxd', 'runtime'];
        const needsMdbList = requestedRatings.some(r => externalRatings.includes(r));
        
        if (needsMdbList && !cachedData?.mdblist) {
            req.mdblist = true;
        }
    }
    
    return req;
}

async function fetchSelectedAPIs(req, currentData, coreData, apiKeys) {
    const promises = [];
    const ids = coreData.ids; 
    let workingImdbId = ids.imdb;

    // 1. Jikan External (Anime -> IMDb)
    if (req.jikanExternal && !workingImdbId) {
        const jikanPromise = fetchWithTimeout(`https://api.jikan.moe/v4/anime/${ids.mal}/external`, 3000)
            .then(async res => {
                if (!res) return null;
                const jData = await res.json();
                const imdbItem = jData.data?.find(e => e.name === 'IMDb');
                if (imdbItem?.url) {
                    const foundId = imdbItem.url.match(/tt\d+/)?.[0];
                    return { source: 'jikan_ext', id: foundId };
                }
                return null;
            });
        promises.push(jikanPromise);
    }

    // 2. MAL Images (Forced Fetch via ID)
    if (req.malImages && ids.mal) {
        promises.push(fetchWithTimeout(`https://api.jikan.moe/v4/anime/${ids.mal}`, 3500)
            .then(async res => {
                if (!res) return null;
                const data = (await res.json()).data;
                const imgs = data?.images;
                const posterUrl = imgs?.webp?.large_image_url || imgs?.jpg?.large_image_url;
                if (posterUrl) {
                    return { source: 'mal', type: 'text', url: posterUrl };
                }
                return null;
            }));
    }

    // 3. TMDB Images
    if (req.tmdbImages && coreData.type !== 'anime') {
        const url = `https://api.themoviedb.org/3/${coreData.type}/${ids.tmdb}/images?api_key=${apiKeys.tmdbApiKey}&include_image_language=en,null`;
        promises.push(fetchWithTimeout(url, 2500).then(async res => {
            if(!res) return null;
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

    // 4. Standard APIs
    if (workingImdbId || coreData.type !== 'anime') {
        if (req.fanart && !currentData.posters.fanart) {
            const fanartId = coreData.type === 'movie' ? ids.tmdb : (ids.tvdb || ids.tmdb);
            if (fanartId) {
                promises.push(getFanartPoster(fanartId, coreData.type, apiKeys.fanartApiKey, false).then(p => ({ source: 'fanart', type: 'text', url: p })));
                promises.push(getFanartPoster(fanartId, coreData.type, apiKeys.fanartApiKey, true).then(p => ({ source: 'fanart', type: 'textless', url: p })));
            }
        }
        if (req.metahub && !currentData.posters.metahub && workingImdbId) {
            promises.push(Promise.resolve({ source: 'metahub', type: 'text', url: `https://images.metahub.space/poster/medium/${workingImdbId}/img` }));
        }
        
        // MDBList (Replaces OMDB for ratings)
        if (req.mdblist && !currentData.mdblist && apiKeys.mdbListApiKey && workingImdbId) {
            promises.push(safeJsonFetch(fetchWithTimeout(`https://mdblist.com/api/?apikey=${apiKeys.mdbListApiKey}&i=${workingImdbId}`, 3000))
                .then(res => ({ source: 'mdblist', data: res })));
        }
    }

    const results = await Promise.allSettled(promises);
    return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
}

function mergeData(coreData, currentData, newResults) {
    const merged = { ...currentData, core: coreData };
    
    merged.ids = { ...coreData.ids, ...(currentData.ids || {}) };
    merged.ratings = { ...coreData.ratings, ...(currentData.ratings || {}) };

    merged.posters = { ...coreData.posters };

    if (currentData.posters) {
        Object.keys(currentData.posters).forEach(key => {
            if (key === 'tmdb') {
                const coreTmdb = merged.posters.tmdb || {};
                const cachedTmdb = currentData.posters.tmdb || {};
                merged.posters.tmdb = {
                    text: coreTmdb.text || cachedTmdb.text, 
                    textless: coreTmdb.textless || cachedTmdb.textless 
                };
            } else {
                if (!merged.posters[key]) {
                    merged.posters[key] = currentData.posters[key];
                }
            }
        });
    }

    newResults.forEach(res => {
        if (!res) return;
        
        if (res.source === 'jikan_ext') merged.ids.imdb = res.id;
        
        if (res.source === 'tmdb_images') {
             if (!merged.posters.tmdb) merged.posters.tmdb = { text: null, textless: null };
             if (res.textless) merged.posters.tmdb.textless = res.textless;
        }

        if (res.source === 'mdblist') merged.mdblist = res.data;
        
        if (res.source === 'fanart' || res.source === 'metahub' || res.source === 'mal') {
            if (!merged.posters[res.source]) merged.posters[res.source] = { text: null, textless: null };
            merged.posters[res.source][res.type] = res.url;
        }
    });

    const mdblist = merged.mdblist;

    if (mdblist) {
        if (mdblist.mal_id && !merged.ids.mal) merged.ids.mal = mdblist.mal_id;
        
        // Runtime handling (mdblist returns integer minutes, e.g. 142)
        if (!merged.ratings.runtime && mdblist.runtime) {
            const h = Math.floor(mdblist.runtime / 60);
            const m = mdblist.runtime % 60;
            merged.ratings.runtime = h > 0 ? `${h}h ${m}m` : `${m}m`;
        }
        
        if (mdblist.ratings) {
            const getVal = (source) => mdblist.ratings.find(x => x.source === source)?.value;

            if (!merged.ratings.imdb) {
                const val = getVal('imdb');
                if (val) merged.ratings.imdb = val.toString();
            }

            if (!merged.ratings.rt) {
                const val = getVal('tomatoes');
                if (val) merged.ratings.rt = val + "%"; 
            }

            if (!merged.ratings.meta) {
                const val = getVal('metacritic');
                if (val) merged.ratings.meta = val.toString();
            }

            if (!merged.ratings.rt_popcorn) {
                const val = getVal('tomatoesaudience');
                if (val) merged.ratings.rt_popcorn = val + "%";
            }

            if (!merged.ratings.letterboxd) {
                const val = getVal('letterboxd');
                if (val) merged.ratings.letterboxd = val.toString();
            }
        }
    }

    return merged;
}

async function hydrateCache(env, currentData, apiKeys) {
    const movie = currentData.core.movie;
    
    const isPopular = (movie.popularity && movie.popularity > 5.0) || 
                      (movie.vote_count && movie.vote_count > 50) ||
                      (currentData.core.type === 'anime'); 

    const req = determineRequirements({}, true, currentData.core.type, currentData.core, currentData);

    if (!isPopular) {
        req.mdblist = false;
    }

    const fetchedResults = await fetchSelectedAPIs(req, currentData, currentData.core, apiKeys);
    
    const fullyHydratedData = mergeData(currentData.core, currentData, fetchedResults);
    
    if (isPopular) {
        fullyHydratedData.cacheLevel = 'full';
    } else {
        fullyHydratedData.cacheLevel = 'partial'; 
    }

    if (env.POSTER_CACHE) {
        await setD1Cache(env.POSTER_CACHE, currentData.core.type, fullyHydratedData.ids, fullyHydratedData);
    }
}

function processCachedData(data, cfg) {
    let finalPosterUrl = null;
    const p = data.posters;
    const type = cfg.textless ? 'textless' : 'text';

    if (cfg.source === 'metahub') {
        finalPosterUrl = p.metahub?.[type] || p.metahub?.text;
    } else if (cfg.source === 'tmdb') {
        finalPosterUrl = p.tmdb?.[type] || p.tmdb?.text;
    } else if (cfg.source === 'fanart') {
        finalPosterUrl = p.fanart?.[type] || p.fanart?.text;
    } else if (cfg.source === 'mal') {
        finalPosterUrl = p.mal?.[type] || p.mal?.text;
    }

    if (!finalPosterUrl) {
        finalPosterUrl = (p.tmdb?.[type] || p.tmdb?.text) || 
                         (p.fanart?.[type] || p.fanart?.text) || 
                         (p.metahub?.[type] || p.metahub?.text) || 
                         (p.mal?.[type] || p.mal?.text);
    }

    return {
        movie: data.core.movie,
        ratings: data.ratings,
        foundType: data.core.type,
        finalPosterUrl,
        posters: data.posters,       
        mdblist: data.mdblist, 
        cacheLevel: data.cacheLevel || 'partial',
        isCached: false 
    };
}