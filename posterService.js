import { getD1Cache, setD1Cache } from './utils.js';
import { fetchCoreData, determineRequirements, fetchSelectedAPIs } from './posterAPI.js';

export async function getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, format) {
    const { tmdbApiKey, fanartApiKey, mdbListApiKey } = apiKeys;

    // 1. Check Cache
    // Pass 'inputType' to help D1 helper decide which column to query
    let cachedData = await getD1Cache(env.POSTER_CACHE, inputType, rawId);
    
    // If full cache exists
    if (cachedData && cachedData.cacheLevel === 'full') {
        // If user specifically needs textless but we only have text, we might need to fetch
        if (cfg.textless && !cachedData.posters.tmdb?.textless && inputType !== 'anime') {
             // Fall through to fetch missing data
        } else {
             return { ...processCachedData(cachedData, cfg), isCached: true };
        }
    }

    // 2. Fetch Core Data (if not in cache)
    let coreData = cachedData?.ids ? cachedData : await fetchCoreData(inputType, rawId, tmdbApiKey, cfg);
    
    // Inject parsed malId if available and not in core
    if (cfg.malId && !coreData.ids.mal) {
        coreData.ids.mal = cfg.malId;
    }

    // 3. Determine Requirements
    const needsFull = (format === 'json');
    const required = determineRequirements(cfg, needsFull, inputType, coreData, cachedData);
    
    // 4. Fetch Selected APIs
    // We pass the full apiKeys object so helpers can extract fanart/mdblist keys
    const currentData = cachedData || { ratings: {}, posters: {} };
    const fetchedResults = await fetchSelectedAPIs(required, currentData, coreData, apiKeys);
    
    // 5. Merge & Minimize
    // This creates the clean object with only 1 poster per type and minimal meta
    const mergedData = mergeAndMinimize(coreData, currentData, fetchedResults);

    // 6. Background Hydration or Save
    if (!needsFull) {
        // If we didn't fetch everything, try to hydrate the rest in background
        ctx.waitUntil(hydrateCache(env, mergedData, apiKeys));
    } else {
        mergedData.cacheLevel = 'full';
        // Save the minimized data to D1
        ctx.waitUntil(setD1Cache(env.POSTER_CACHE, mergedData.type || inputType, mergedData.ids, mergedData));
    }

    return processCachedData(mergedData, cfg);
}

// --- HELPER LOGIC ---

function mergeAndMinimize(coreData, currentData, newResults) {
    // Start with core
    const merged = { 
        title: coreData.title,
        year: coreData.year,
        ids: { ...coreData.ids, ...(currentData.ids || {}) },
        ratings: { ...coreData.ratings, ...(currentData.ratings || {}) },
        posters: { ...coreData.posters },
        type: coreData.type
    };

    if (currentData.posters) {
        Object.keys(currentData.posters).forEach(key => {
            if (!merged.posters[key]) merged.posters[key] = currentData.posters[key];
        });
    }

    newResults.forEach(res => {
        if (!res) return;
        
        if (res.source === 'jikan_ext') merged.ids.imdb = res.id;
        
        if (res.source === 'tmdb_images' && res.textless) {
             if (!merged.posters.tmdb) merged.posters.tmdb = {};
             merged.posters.tmdb.textless = res.textless;
        }

        if (res.source === 'fanart') {
            if (!merged.posters.fanart) merged.posters.fanart = { text: null, textless: null };
            merged.posters.fanart[res.type] = res.url;
        }
        
        if (res.source === 'metahub' || res.source === 'mal') {
            // Metahub and MAL only have 'text'
            if (!merged.posters[res.source]) merged.posters[res.source] = {};
            merged.posters[res.source].text = res.url;
        }

        if (res.source === 'mdblist' && res.data) {
            const m = res.data;
            if (m.mal_id && !merged.ids.mal) merged.ids.mal = m.mal_id;
            
            // Extract Title/Year from MDBList if core was empty (rare)
            if (!merged.title && m.title) merged.title = m.title;
            if (!merged.year && m.year) merged.year = m.year;

            // Extract Ratings
            if (m.ratings) {
                const getVal = (s) => m.ratings.find(x => x.source === s)?.value;
                if (!merged.ratings.imdb) { const v = getVal('imdb'); if(v) merged.ratings.imdb = v.toString(); }
                if (!merged.ratings.rt) { const v = getVal('tomatoes'); if(v) merged.ratings.rt = v + "%"; }
                if (!merged.ratings.meta) { const v = getVal('metacritic'); if(v) merged.ratings.meta = v.toString(); }
                if (!merged.ratings.rt_popcorn) { const v = getVal('tomatoesaudience'); if(v) merged.ratings.rt_popcorn = v + "%"; }
                if (!merged.ratings.letterboxd) { const v = getVal('letterboxd'); if(v) merged.ratings.letterboxd = v.toString(); }

                // TMDB Rating Extraction (Fix for missing TMDB ratings)
                if (!merged.ratings.tmdb) { 
                    const tmdbVal = getVal('tmdb'); 
                    if (tmdbVal) {
                        // Handle potential formats (8.5 vs 85)
                        merged.ratings.tmdb = (tmdbVal <= 10 ? Math.round(tmdbVal * 10) : tmdbVal) + "%";
                    }
                }
            }
            if (!merged.ratings.runtime && m.runtime) {
                 const h = Math.floor(m.runtime / 60);
                 const mMin = m.runtime % 60;
                 merged.ratings.runtime = h > 0 ? `${h}h ${mMin}m` : `${mMin}m`;
            }
        }
    });

    return merged;
}

function processCachedData(data, cfg) {
    let finalPosterUrl = null;
    const p = data.posters || {};
    const type = cfg.textless ? 'textless' : 'text';

    if (cfg.source === 'metahub') finalPosterUrl = p.metahub?.text;
    else if (cfg.source === 'mal') finalPosterUrl = p.mal?.text;
    else if (cfg.source === 'tmdb') finalPosterUrl = p.tmdb?.[type] || p.tmdb?.text;
    else if (cfg.source === 'fanart') finalPosterUrl = p.fanart?.[type] || p.fanart?.text;

    if (!finalPosterUrl) {
        // Fallback chain
        finalPosterUrl = (p.tmdb?.[type] || p.tmdb?.text) || 
                         (p.fanart?.[type] || p.fanart?.text) || 
                         p.metahub?.text || 
                         p.mal?.text;
    }

    return {
        // Just return the minimal data we need for JSON output
        title: data.title,
        year: data.year,
        ratings: data.ratings,
        foundType: data.type,
        finalPosterUrl,
        posters: data.posters,       
        cacheLevel: data.cacheLevel || 'partial'
    };
}

async function hydrateCache(env, currentData, apiKeys) {
    const isPopular = (currentData.ids.imdb && currentData.ratings.tmdb && parseInt(currentData.ratings.tmdb) > 50) || currentData.type === 'anime';
    const req = determineRequirements({}, true, currentData.type, currentData, currentData);
    
    // Skip expensive calls for unpopular content to save API usage? 
    // Logic preserved from original but simplified.
    if (!isPopular) req.mdblist = false;

    const fetchedResults = await fetchSelectedAPIs(req, currentData, currentData, apiKeys);
    const hydrated = mergeAndMinimize(currentData, currentData, fetchedResults);
    
    hydrated.cacheLevel = isPopular ? 'full' : 'partial';

    if (env.POSTER_CACHE) {
        await setD1Cache(env.POSTER_CACHE, hydrated.type, hydrated.ids, hydrated);
    }
}