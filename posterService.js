// posterService.js
import { fetchWithTimeout, safeJsonFetch, getD1Cache, setD1Cache, getFanartPoster } from './utils.js';

export async function getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, format) {
    const { tmdbApiKey, fanartApiKey, omdbApiKey, mdbListApiKey } = apiKeys;
    const cacheKey = `${inputType}:${rawId}:v21`; // Version bumped to invalidate broken caches

    // 1. Check Cache
    let cachedData = await getD1Cache(env.POSTER_CACHE, cacheKey);
    
    // Full Cache Hit
    if (cachedData && cachedData.cacheLevel === 'full') {
        // If requesting textless but cache doesn't have it, we might need to fetch
        if (cfg.textless && !cachedData.posters.tmdb?.textless && inputType !== 'anime') {
             // Fall through to partial update
        } else {
             return { ...processCachedData(cachedData, cfg), isCached: true };
        }
    }

    // Partial Cache Upgrade needed for JSON or missing Textless
    if (cachedData && format !== 'json' && !(cfg.textless && !cachedData.posters.tmdb?.textless)) {
        ctx.waitUntil(hydrateCache(env, cachedData, apiKeys, cacheKey));
        return { ...processCachedData(cachedData, cfg), isCached: true };
    }

    // 2. Fetch Core Data (Optimized Skeleton)
    // Pass 'cfg' so we know if we need textless images immediately
    let coreData = cachedData?.core ? cachedData.core : await fetchCoreData(inputType, rawId, tmdbApiKey, cfg);
    
    // 3. Determine Requirements
    const needsFull = (format === 'json');
    const required = determineRequirements(cfg, needsFull, inputType, coreData);
    
    // 4. Fetch Selected APIs (Fast Path)
    const currentData = cachedData || { ratings: {}, posters: {}, omdb: null, mdblist: null };
    const fetchedResults = await fetchSelectedAPIs(required, currentData, coreData, apiKeys);
    
    // Merge
    const mergedData = mergeData(coreData, currentData, fetchedResults);

    // 5. Background Hydration
    if (!needsFull) {
        ctx.waitUntil(hydrateCache(env, mergedData, apiKeys, cacheKey));
    } else {
        mergedData.cacheLevel = 'full';
        ctx.waitUntil(setD1Cache(env.POSTER_CACHE, cacheKey, mergedData));
    }

    return processCachedData(mergedData, cfg);
}

// --- CORE FETCHING (OPTIMIZED) ---

async function fetchCoreData(inputType, rawId, tmdbApiKey, cfg) {
    let activeType = inputType;
    let tmdbId = rawId;
    let movie = {};
    let ratings = {};
    
    if (inputType === 'anime') {
        // OPTIMIZATION: Use standard endpoint instead of /full to reduce payload
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

function determineRequirements(cfg, needsFull, inputType, coreData) {
    const requestedRatings = cfg.ratings || [];
    const req = { 
        fanart: false, 
        omdb: false, 
        mdblist: false, 
        metahub: false, 
        tmdbImages: false,
        jikanExternal: false
    };
    
    // If hydration/full, we need everything
    if (needsFull) {
        req.tmdbImages = (inputType !== 'anime'); 
        req.fanart = true;
        if (inputType === 'anime' && !coreData.ids.imdb) {
            req.jikanExternal = true;
        }
        req.metahub = true;
        req.omdb = true;
        req.mdblist = true;
        return req;
    }
    
    // Fast Path Logic
    
    // 1. Anime ID Resolution
    if (inputType === 'anime' && !coreData.ids.imdb) {
        const needsExternal = requestedRatings.some(r => ['imdb', 'rt', 'meta', 'letterboxd'].includes(r));
        if (needsExternal) req.jikanExternal = true;
    }
    
    const hasImdbId = !!coreData.ids.imdb; 

    // 2. TMDB Images (Textless) - Fetch if requested but missing
    if (inputType !== 'anime' && cfg.textless && !coreData.posters.tmdb?.textless) {
         req.tmdbImages = true;
    }

    // 3. Ratings & Source Images
    if (cfg.source === 'fanart') req.fanart = true;
    if (cfg.source === 'metahub') req.metahub = true;

    if (hasImdbId || req.jikanExternal) {
        if (requestedRatings.includes('imdb') || requestedRatings.includes('rt') || requestedRatings.includes('meta') || requestedRatings.includes('runtime')) {
            req.omdb = true;
        }
        if (requestedRatings.includes('letterboxd') || requestedRatings.includes('rt_popcorn')) {
            req.mdblist = true;
        }
    }
    
    return req;
}

async function fetchSelectedAPIs(req, currentData, coreData, apiKeys) {
    const promises = [];
    const ids = coreData.ids; 
    let workingImdbId = ids.imdb;

    // 1. Jikan External
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

    // 2. TMDB Images (Targeted Endpoint)
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

    // 3. Standard APIs
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
        if (req.omdb && !currentData.omdb && workingImdbId) {
            promises.push(safeJsonFetch(fetchWithTimeout(`https://www.omdbapi.com/?i=${workingImdbId}&apikey=${apiKeys.omdbApiKey}&tomatoes=true`, 3000))
                .then(res => ({ source: 'omdb', data: res })));
        }
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
    
    // Deep merge identifiers
    merged.ids = { ...coreData.ids, ...(currentData.ids || {}) };
    
    // Deep merge Ratings
    merged.ratings = { ...coreData.ratings, ...(currentData.ratings || {}) };

    // Deep merge Posters (Crucial: Start with Core/TMDB, then Cache, then New)
    merged.posters = { ...coreData.posters, ...(currentData.posters || {}) };

    newResults.forEach(res => {
        if (!res) return;
        
        if (res.source === 'jikan_ext') merged.ids.imdb = res.id;
        
        if (res.source === 'tmdb_images') {
             if (!merged.posters.tmdb) merged.posters.tmdb = { text: null, textless: null };
             if (res.textless) merged.posters.tmdb.textless = res.textless;
        }

        if (res.source === 'omdb') merged.omdb = res.data;
        if (res.source === 'mdblist') merged.mdblist = res.data;
        
        if (res.source === 'fanart' || res.source === 'metahub') {
            if (!merged.posters[res.source]) merged.posters[res.source] = { text: null, textless: null };
            merged.posters[res.source][res.type] = res.url;
        }
    });

    // Ratings extraction (OMDB/MDBList)
    const omdb = merged.omdb;
    const mdblist = merged.mdblist;

    if (omdb) {
        if (omdb.imdbRating && omdb.imdbRating !== "N/A") merged.ratings.imdb = omdb.imdbRating;
        if (omdb.Metascore && omdb.Metascore !== "N/A") merged.ratings.meta = omdb.Metascore;
        const rt = omdb.Ratings?.find(r => r.Source === "Rotten Tomatoes");
        if (rt) merged.ratings.rt = rt.Value;
        if (!merged.ratings.runtime && omdb.Runtime && omdb.Runtime !== "N/A") {
            merged.ratings.runtime = omdb.Runtime.replace(" min", "m").replace(" h", "h");
        }
    }

    if (mdblist && mdblist.ratings) {
        if (!merged.ratings.imdb && mdblist.score) merged.ratings.imdb = mdblist.score.toString();
        const rtData = mdblist.ratings.find(x => x.source === 'tomatoes');
        if (!merged.ratings.rt && rtData?.value) merged.ratings.rt = rtData.value + "%"; 
        const metaData = mdblist.ratings.find(x => x.source === 'metacritic');
        if (!merged.ratings.meta && metaData?.value) merged.ratings.meta = metaData.value.toString();
        const rtAudience = mdblist.ratings.find(x => x.source === 'tomatoesaudience');
        if (rtAudience?.value) merged.ratings.rt_popcorn = rtAudience.value + "%";
        const lbData = mdblist.ratings.find(x => x.source === 'letterboxd');
        if (lbData?.value) merged.ratings.letterboxd = lbData.value.toString();
    }

    return merged;
}

// --- BACKGROUND HYDRATION (OPTIMIZED) ---

async function hydrateCache(env, currentData, apiKeys, cacheKey) {
    const movie = currentData.core.movie;
    
    const isPopular = (movie.popularity && movie.popularity > 5.0) || 
                      (movie.vote_count && movie.vote_count > 50) ||
                      (currentData.core.type === 'anime'); 

    // 1. Determine requirements (Assume full fetch needed)
    // Pass empty cfg since we want full data regardless of user cfg here
    const req = determineRequirements({}, true, currentData.core.type, currentData.core);

    // 2. Filter out expensive APIs if NOT popular
    if (!isPopular) {
        req.omdb = false;
        req.mdblist = false;
    }

    // 3. Fetch missing pieces
    const fetchedResults = await fetchSelectedAPIs(req, currentData, currentData.core, apiKeys);
    
    // 4. Merge
    const fullyHydratedData = mergeData(currentData.core, currentData, fetchedResults);
    
    if (isPopular) {
        fullyHydratedData.cacheLevel = 'full';
    } else {
        fullyHydratedData.cacheLevel = 'partial'; 
    }

    // 5. Save to D1
    if (env.POSTER_CACHE) {
        await setD1Cache(env.POSTER_CACHE, cacheKey, fullyHydratedData);
    }
}

// --- FINAL OUTPUT PROCESSOR (Unchanged) ---
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
        omdb: data.omdb,       
        mdblist: data.mdblist, 
        cacheLevel: data.cacheLevel || 'partial',
        isCached: false 
    };
}