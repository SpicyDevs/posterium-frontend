import { fetchWithTimeout, getD1Cache, setD1Cache, fetchFanartData, extractFanartImage } from './utils.js';
import { fetchCoreData, determineRequirements, fetchSelectedAPIs } from './posterAPI.js';

export async function getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, format) {
    const { tmdbApiKey, fanartApiKey } = apiKeys;

    // 1. Check Cache
    let cachedData = await getD1Cache(env.POSTER_CACHE, inputType, rawId);
    
    if (cachedData && cachedData.cacheLevel === 'full') {
        if (cfg.textless && !cachedData.posters.tmdb?.textless && inputType !== 'anime') {
             // Fetch missing
        } else {
             return { ...processCachedData(cachedData, cfg), isCached: true };
        }
    }

    let coreData = cachedData?.ids ? cachedData : null;
    let raceWinnerSource = null;
    let raceFanartData = null;

    // 2. The Fork: Standard vs Race
    // "show tmdb only when source is tmdb" -> Standard Path
    // "no source is provided" -> Race Path
    if (coreData || cfg.source === 'tmdb' || cfg.source === 'mal' || cfg.source === 'imdb' || inputType === 'anime') {
        if (!coreData) coreData = await fetchCoreData(inputType, rawId, tmdbApiKey, cfg);
    } else {
        // --- RACE LOGIC ---
        // We race Fanart vs Core (TMDB). 
        // Note: We always need Core for metadata (Title, Year, Ratings), so we must await Core.
        // The "Race" determines which POSTER we show immediately.
        
        const canRace = (inputType === 'movie' || inputType === 'tv') && fanartApiKey;
        let fanartPromise = null;

        if (canRace) {
            // Attempt optimistic fetch. Fanart works with TMDB ID or IMDB ID (rawId).
            fanartPromise = fetchFanartData(rawId, inputType, fanartApiKey)
                .then(res => ({ source: 'fanart', raw: res }))
                .catch(() => null);
        }

        const corePromise = fetchCoreData(inputType, rawId, tmdbApiKey, cfg);
        
        // Tap Fanart to see if it finishes fast
        let fanartResolved = false;
        if (fanartPromise) fanartPromise.then(() => { fanartResolved = true; });

        // Await Core (Mandatory)
        try {
            coreData = await corePromise;
        } catch (e) {
            // If core fails, we can't really proceed as we lack metadata
            throw e; 
        }

        // CHECK RACE RESULT
        // If Fanart resolved BEFORE Core finished, or is ready now, we can use it?
        // "whichever returns the response first"
        // If Fanart is ready, we use it. If not, we fall back to TMDB (Core).
        
        if (fanartResolved && fanartPromise) {
            const fRes = await fanartPromise;
            if (fRes && fRes.raw) {
                raceFanartData = fRes.raw;
                // If Fanart yielded a valid image, it wins the "display" race
                const img = extractFanartImage(raceFanartData, inputType, cfg.textless, false);
                if (img) raceWinnerSource = 'fanart';
            }
        }
        // If fanart not resolved, we proceed with TMDB (default in coreData).
        // Fanart fetch continues in background/later.
    }

    // Inject parsed malId if available
    if (cfg.malId && !coreData.ids.mal) coreData.ids.mal = cfg.malId;

    // CHANGED: Only fetch Anime IMDb ID if ABSOLUTELY needed for requested ratings.
    // Otherwise, this expensive call is pushed to background hydration.
    const externalRatings = ['imdb', 'rt', 'rt_popcorn', 'meta', 'letterboxd'];
    const needsImdbForRatings = cfg.ratings && cfg.ratings.some(r => externalRatings.includes(r));

    if (inputType === 'anime' && !coreData.ids.imdb && coreData.ids.mal && needsImdbForRatings) {
        try {
            const extRes = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${coreData.ids.mal}/external`, 4000);
            if (extRes) {
                const jData = await extRes.json();
                const imdbItem = jData.data?.find(e => e.name === 'IMDb');
                if (imdbItem?.url) coreData.ids.imdb = imdbItem.url.match(/tt\d+/)?.[0];
            }
        } catch (e) { console.log("Jikan ID fetch failed", e); }
    }

    // 3. Determine Requirements
    const needsFull = (format === 'json');
    const required = determineRequirements(cfg, needsFull, inputType, coreData, cachedData);

    // If we already fetched Fanart in the race, don't fetch again
    if (raceFanartData) required.fanart = false;

    // 4. Fetch Selected APIs
    const currentData = cachedData || { ratings: {}, posters: {} };
    const fetchedResults = await fetchSelectedAPIs(required, currentData, coreData, apiKeys);
    
    // Inject Race Result into fetchedResults if needed
    if (raceFanartData) {
        // Note: raceFanartData is RAW. We need to format it like fetchSelectedAPIs does.
        // If "Auto", we use most liked (useSecondBest = false).
        // The DB save requirement "save 2nd liked if source=fanart" logic is handled in determineRequirements/fetchSelectedAPIs
        // but here in Race, source is usually NULL (Auto). So standard extraction applies.
        fetchedResults.push(
            { source: 'fanart', type: 'text', url: extractFanartImage(raceFanartData, inputType, false, false) },
            { source: 'fanart', type: 'textless', url: extractFanartImage(raceFanartData, inputType, true, false) }
        );
    }

    // 5. Merge & Minimize
    const mergedData = mergeAndMinimize(coreData, currentData, fetchedResults);

    // 6. Background Hydration
    if (!needsFull) {
        ctx.waitUntil(hydrateCache(env, mergedData, apiKeys));
    } else {
        mergedData.cacheLevel = 'full';
        ctx.waitUntil(setD1Cache(env.POSTER_CACHE, mergedData.type || inputType, mergedData.ids, mergedData));
    }

    // 7. Process Final Output
    // We pass the raceWinnerSource to prefer that one if set
    return processCachedData(mergedData, cfg, raceWinnerSource);
}

// --- HELPER LOGIC ---

function mergeAndMinimize(coreData, currentData, newResults) {
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
        
        if (res.source === 'metahub' || res.source === 'mal' || res.source === 'imdb') {
            if (!merged.posters[res.source]) merged.posters[res.source] = {};
            merged.posters[res.source].text = res.url;
        }

        if (res.source === 'mdblist' && res.data) {
            const m = res.data;
            if (m.mal_id && !merged.ids.mal) merged.ids.mal = m.mal_id;
            if (!merged.title && m.title) merged.title = m.title;
            if (!merged.year && m.year) merged.year = m.year;

            if (m.ratings) {
                const getVal = (s) => m.ratings.find(x => x.source === s)?.value;
                if (!merged.ratings.imdb) { const v = getVal('imdb'); if(v) merged.ratings.imdb = v.toString(); }
                if (!merged.ratings.rt) { const v = getVal('tomatoes'); if(v) merged.ratings.rt = v + "%"; }
                if (!merged.ratings.meta) { const v = getVal('metacritic'); if(v) merged.ratings.meta = v.toString(); }
                if (!merged.ratings.rt_popcorn) { const v = getVal('tomatoesaudience'); if(v) merged.ratings.rt_popcorn = v + "%"; }
                if (!merged.ratings.letterboxd) { const v = getVal('letterboxd'); if(v) merged.ratings.letterboxd = v.toString(); }

                if (!merged.ratings.tmdb) { 
                    const tmdbVal = getVal('tmdb'); 
                    if (tmdbVal) {
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

function processCachedData(data, cfg, overrideSource = null) {
    let finalPosterUrl = null;
    const p = data.posters || {};
    const type = cfg.textless ? 'textless' : 'text';

    // Logic: 
    // 1. If Override Source (Race Winner) provided, try that first.
    // 2. Else if cfg.source provided, try that.
    // 3. Else fallback.

    const preferred = overrideSource || cfg.source;

    if (preferred === 'metahub') finalPosterUrl = p.metahub?.text;
    else if (preferred === 'mal') finalPosterUrl = p.mal?.text;
    else if (preferred === 'imdb') finalPosterUrl = p.imdb?.text;
    else if (preferred === 'tmdb') finalPosterUrl = p.tmdb?.[type] || p.tmdb?.text;
    else if (preferred === 'fanart') finalPosterUrl = p.fanart?.[type] || p.fanart?.text;

    if (!finalPosterUrl) {
        // Fallback chain (Auto)
        finalPosterUrl = (p.tmdb?.[type] || p.tmdb?.text) || 
                         (p.fanart?.[type] || p.fanart?.text) || 
                         p.imdb?.text || // IMDb fallback priority: after fanart, before metahub
                         p.metahub?.text || 
                         p.mal?.text;
    }

    return {
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
    const tmdbRating = currentData.ratings?.tmdb ? parseInt(currentData.ratings.tmdb) : 0;
    const isPopular = (currentData.ids?.imdb && tmdbRating > 50) || currentData.type === 'anime';
    const req = determineRequirements({}, true, currentData.type, currentData, currentData);
    
    if (!isPopular) req.mdblist = false;

    const fetchedResults = await fetchSelectedAPIs(req, currentData, currentData, apiKeys);
    const hydrated = mergeAndMinimize(currentData, currentData, fetchedResults);
    
    hydrated.cacheLevel = isPopular ? 'full' : 'partial';

    if (env.POSTER_CACHE) {
        await setD1Cache(env.POSTER_CACHE, hydrated.type, hydrated.ids, hydrated);
    }
}