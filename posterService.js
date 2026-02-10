// posterService.js
import { fetchWithTimeout, safeJsonFetch, getD1Cache, setD1Cache, getFanartPoster } from './utils.js';

export async function getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, format) {
    const { tmdbApiKey, fanartApiKey, omdbApiKey, mdbListApiKey } = apiKeys;
    const cacheKey = `${inputType}:${rawId}:v19`; // Version bumped for new schema

    // 1. Check Cache
    let cachedData = await getD1Cache(env.POSTER_CACHE, cacheKey);
    
    // If we have a FULL cache, return immediately
    if (cachedData && cachedData.cacheLevel === 'full') {
        return { ...processCachedData(cachedData, cfg), isCached: true };
    }

    // If we have a PARTIAL cache, but the user wants JSON (which requires full), we must upgrade.
    // If format is NOT json, partial is fine, so we return it.
    if (cachedData && format !== 'json') {
        // Trigger background hydration to make it full for next time
        ctx.waitUntil(hydrateCache(env, cachedData, apiKeys, cacheKey));
        return { ...processCachedData(cachedData, cfg), isCached: true };
    }

    // 2. Fetch Core Data (TMDB/Jikan) - Always needed
    let coreData = cachedData?.core ? cachedData.core : await fetchCoreData(inputType, rawId, tmdbApiKey);
    
    // 3. Determine Required APIs
    const needsFull = (format === 'json');
    const required = determineRequirements(cfg.ratings, needsFull, inputType, coreData);
    
    // 4. Fetch Required APIs (Fast Path)
    // We only fetch what isn't already in 'cachedData'
    const currentData = cachedData || { ratings: {}, posters: {}, omdb: null, mdblist: null };
    const fetchedResults = await fetchSelectedAPIs(required, currentData, coreData, apiKeys);
    
    // Merge results
    const mergedData = mergeData(coreData, currentData, fetchedResults);

    // 5. Background Hydration (The Magic Step)
    // If we did a partial fetch, we queue a background job to fetch the REST and cache everything.
    if (!needsFull) {
        ctx.waitUntil(hydrateCache(env, mergedData, apiKeys, cacheKey));
    } else {
        // If we needed full (JSON), we save the full result now.
        mergedData.cacheLevel = 'full';
        ctx.waitUntil(setD1Cache(env.POSTER_CACHE, cacheKey, mergedData));
    }

    return processCachedData(mergedData, cfg);
}

// --- CORE FETCHING ---

async function fetchCoreData(inputType, rawId, tmdbApiKey) {
    let activeType = inputType;
    let tmdbId = rawId;
    let movie = {};
    let ratings = {};
    
    if (inputType === 'anime') {
        const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${rawId}/full`, 3500);
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
            external_ids: {}
        };
        // Extract IMDb from Jikan
        const imdbObj = data.external?.find(e => e.name === 'IMDb');
        if (imdbObj?.url) movie.external_ids.imdb_id = imdbObj.url.match(/tt\d+/)?.[0];
        
        if (data.score) ratings.mal = data.score.toString();
        if (data.rating) ratings.age = data.rating.split(' ')[0];
        if (data.duration) {
             const digits = data.duration.match(/\d+/);
             if (digits) ratings.runtime = `${digits[0]}m`;
        }

        // Parse Jikan Images
        const imgs = data.images;
        const posterUrl = imgs.webp?.large_image_url || imgs.jpg?.large_image_url;
        
        return { 
            movie, 
            ids: { tmdb: null, imdb: movie.external_ids.imdb_id, mal: rawId }, 
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

        const tmdbUrl = `https://api.themoviedb.org/3/${activeType}/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=external_ids,release_dates,content_ratings,images&include_image_language=en,null`;
        const tmdbRes = await fetchWithTimeout(tmdbUrl, 2500);
        if (!tmdbRes) throw new Error("Resource Not Found");
        movie = await tmdbRes.json();
        
        if (movie.vote_average) ratings.tmdb = Math.round(movie.vote_average * 10) + "%";
        
        // Extract Posters (Text & Textless)
        const tmdbPosters = { text: null, textless: null };
        if (movie.poster_path) tmdbPosters.text = `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
        
        if (movie.images?.posters) {
            const tl = movie.images.posters.filter(p => p.iso_639_1 === null || p.iso_639_1 === 'xx' || p.iso_639_1 === "");
            if (tl.length > 0) {
                tl.sort((a, b) => b.vote_count - a.vote_count);
                tmdbPosters.textless = `https://image.tmdb.org/t/p/w780${tl[0].file_path}`;
            }
        }

        // Runtime & Age Logic
        let runtime = "";
        let age = "";
        if (activeType === 'movie') {
            if (movie.runtime) { const h = Math.floor(movie.runtime/60), m=movie.runtime%60; runtime = h>0?`${h}h ${m}m`:`${m}m`; }
            const us = movie.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
            if (us) age = us.release_dates.find(d => d.certification !== '')?.certification;
        } else {
             // TV Logic simplified
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

// --- HELPER LOGIC ---

function determineRequirements(requestedRatings, needsFull, inputType, coreData) {
    const req = { fanart: false, omdb: false, mdblist: false, metahub: false };
    const hasImdbId = !!coreData.ids.imdb;

    if (needsFull) {
        req.fanart = true;
        req.metahub = hasImdbId;
        req.omdb = hasImdbId;
        req.mdblist = hasImdbId;
        return req;
    }

    // Optimization: Only fetch Fanart if specifically requested source OR we have no poster
    // But Fanart also gives badges? No, just logos/posters. 
    // We fetch Fanart if specific source logic needs it, usually we do it in background.
    
    if (hasImdbId) {
        // OMDB covers: imdb, rt, meta, runtime
        if (requestedRatings.includes('imdb') || requestedRatings.includes('rt') || requestedRatings.includes('meta') || requestedRatings.includes('runtime')) {
            req.omdb = true;
        }
        // MDBList covers: letterboxd, popcorn, meta, imdb, rt
        if (requestedRatings.includes('letterboxd') || requestedRatings.includes('rt_popcorn')) {
            req.mdblist = true;
        }
        // Fallback: If OMDB fails/not keyed, MDBList can provide IMDB/RT/Meta too.
        if (req.omdb && !req.mdblist) { 
            // We usually prefer OMDB for RT/Meta, but MDBList is a good backup or alternative.
            // For strict optimization: keep OMDB only if keys exist.
        }
    }
    
    return req;
}

async function fetchSelectedAPIs(req, currentData, coreData, apiKeys) {
    const promises = [];
    const ids = coreData.ids;
    const type = coreData.type;

    // Fanart (Only if not cached)
    if (req.fanart && !currentData.posters.fanart) {
        const fanartId = type === 'movie' ? ids.tmdb : (ids.tvdb || ids.tmdb);
        if (fanartId) {
            promises.push(getFanartPoster(fanartId, type, apiKeys.fanartApiKey, false) // Fetch Text
                .then(p => ({ source: 'fanart', type: 'text', url: p })));
            promises.push(getFanartPoster(fanartId, type, apiKeys.fanartApiKey, true)  // Fetch Textless
                .then(p => ({ source: 'fanart', type: 'textless', url: p })));
        }
    }

    // Metahub (Only if not cached)
    if (req.metahub && !currentData.posters.metahub && ids.imdb) {
        promises.push(Promise.resolve({ source: 'metahub', type: 'text', url: `https://images.metahub.space/poster/medium/${ids.imdb}/img` }));
    }

    // OMDB (Only if not cached)
    if (req.omdb && !currentData.omdb && ids.imdb) {
        promises.push(safeJsonFetch(fetchWithTimeout(`https://www.omdbapi.com/?i=${ids.imdb}&apikey=${apiKeys.omdbApiKey}&tomatoes=true`, 3000))
            .then(res => ({ source: 'omdb', data: res })));
    }

    // MDBList (Only if not cached)
    if (req.mdblist && !currentData.mdblist && ids.imdb && apiKeys.mdbListApiKey) {
        promises.push(safeJsonFetch(fetchWithTimeout(`https://mdblist.com/api/?apikey=${apiKeys.mdbListApiKey}&i=${ids.imdb}`, 3000))
            .then(res => ({ source: 'mdblist', data: res })));
    }

    const results = await Promise.allSettled(promises);
    return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
}

function mergeData(coreData, currentData, newResults) {
    const merged = { ...currentData, core: coreData, ids: coreData.ids };
    
    // Initialize complex objects if missing
    if (!merged.ratings) merged.ratings = { ...coreData.ratings };
    else merged.ratings = { ...coreData.ratings, ...merged.ratings }; // Core updates override? Or vice versa. Usually Core is fresher.

    if (!merged.posters) merged.posters = { ...coreData.posters };
    else merged.posters = { ...merged.posters, ...coreData.posters }; // Merge TMDB/MAL posters

    // Process New Results
    newResults.forEach(res => {
        if (res.source === 'omdb') merged.omdb = res.data;
        if (res.source === 'mdblist') merged.mdblist = res.data;
        
        if (res.source === 'fanart' || res.source === 'metahub') {
            if (!merged.posters[res.source]) merged.posters[res.source] = { text: null, textless: null };
            merged.posters[res.source][res.type] = res.url;
        }
    });

    // Extract Ratings from stored OMDB/MDBList data (whether new or cached)
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

// --- BACKGROUND HYDRATION ---

async function hydrateCache(env, currentData, apiKeys, cacheKey) {
    // 1. Determine what is missing. We want EVERYTHING.
    // We act as if 'needsFull' is true.
    const req = determineRequirements([], true, currentData.core.type, currentData.core);
    
    // 2. Fetch missing pieces
    const fetchedResults = await fetchSelectedAPIs(req, currentData, currentData.core, apiKeys);
    
    // 3. Merge
    const fullyHydratedData = mergeData(currentData.core, currentData, fetchedResults);
    fullyHydratedData.cacheLevel = 'full';

    // 4. Save to D1
    if (env.POSTER_CACHE) {
        await setD1Cache(env.POSTER_CACHE, cacheKey, fullyHydratedData);
    }
}

// --- FINAL OUTPUT PROCESSOR ---

function processCachedData(data, cfg) {
    // Select the correct poster based on config
    let finalPosterUrl = null;
    const p = data.posters;
    const type = cfg.textless ? 'textless' : 'text';

    // Source Priority
    if (cfg.source === 'metahub') {
        finalPosterUrl = p.metahub?.[type] || p.metahub?.text;
    } else if (cfg.source === 'tmdb') {
        finalPosterUrl = p.tmdb?.[type] || p.tmdb?.text;
    } else if (cfg.source === 'fanart') {
        finalPosterUrl = p.fanart?.[type] || p.fanart?.text;
    } else if (cfg.source === 'mal') {
        finalPosterUrl = p.mal?.[type] || p.mal?.text;
    }

    // Fallbacks
    if (!finalPosterUrl) {
        // Preference chain: TMDB -> Fanart -> Metahub -> MAL
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
        posters: data.posters, // Return all posters for JSON debugging/usage
        omdb: data.omdb,       // Keep raw for JSON
        mdblist: data.mdblist, // Keep raw for JSON
        cacheLevel: data.cacheLevel || 'partial',
        isCached: false // Overridden by caller if true
    };
}