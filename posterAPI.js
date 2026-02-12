import { fetchWithTimeout, safeJsonFetch, getFanartPoster } from './utils.js';

// --- CORE FETCHING ---

export async function fetchCoreData(inputType, rawId, tmdbApiKey, cfg) {
    let activeType = inputType;
    let tmdbId = rawId;
    let title = "";
    let year = "";
    let ratings = {};
    let posters = { tmdb: { text: null, textless: null } };
    
    if (inputType === 'anime') {
        const jikanRes = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${rawId}`, 3500);
        if (!jikanRes) throw new Error("Resource Not Found");
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
            posters: { mal: { text: posterUrl } }, // Only text for MAL
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
        if (cfg.textless) appends += ",images"; 

        const tmdbUrl = `https://api.themoviedb.org/3/${activeType}/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=${appends}&include_image_language=en,null`;
        const tmdbRes = await fetchWithTimeout(tmdbUrl, 2500);
        if (!tmdbRes) throw new Error("Resource Not Found");
        const movie = await tmdbRes.json();
        
        title = movie.title || movie.name;
        const releaseDate = movie.release_date || movie.first_air_date;
        year = releaseDate ? releaseDate.split('-')[0] : "";

        if (movie.vote_average) ratings.tmdb = Math.round(movie.vote_average * 10) + "%";
        
        // 1. TMDB Text Poster
        if (movie.poster_path) posters.tmdb.text = `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
        
        // 2. TMDB Textless Poster (Best One)
        if (movie.images?.posters) {
            const tl = movie.images.posters.filter(p => p.iso_639_1 === null || p.iso_639_1 === 'xx' || p.iso_639_1 === "");
            if (tl.length > 0) {
                // Sort by vote count desc
                tl.sort((a, b) => b.vote_count - a.vote_count);
                posters.tmdb.textless = `https://image.tmdb.org/t/p/w780${tl[0].file_path}`;
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
            title, year,
            ids: { tmdb: tmdbId, imdb: movie.external_ids?.imdb_id, tvdb: movie.external_ids?.tvdb_id },
            ratings,
            posters,
            type: activeType
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
        malImages: false
    };
    
    if (cfg.source === 'mal' && !cachedData?.posters?.mal) req.malImages = true;

    if (needsFull) {
        req.tmdbImages = (inputType !== 'anime'); 
        req.fanart = true;
        if (inputType === 'anime' && !coreData.ids.imdb) req.jikanExternal = true;
        req.metahub = true;
        req.mdblist = true;
        return req;
    }
    
    const hasImdbId = !!coreData.ids.imdb; 
    const hasCachedTextless = cachedData?.posters?.tmdb?.textless;
    const hasCoreTextless = coreData.posters.tmdb?.textless;
    
    // Only fetch TMDB images if we specifically need textless and don't have it
    if (inputType !== 'anime' && cfg.textless && !hasCoreTextless && !hasCachedTextless) {
         req.tmdbImages = true;
    }

    if (cfg.source === 'fanart' && !cachedData?.posters?.fanart) req.fanart = true;
    if (cfg.source === 'metahub' && !cachedData?.posters?.metahub) req.metahub = true;

    if (hasImdbId || req.jikanExternal) {
        const externalRatings = ['imdb', 'rt', 'rt_popcorn', 'meta', 'letterboxd', 'runtime'];
        const needsMdbList = requestedRatings.some(r => externalRatings.includes(r));
        if (needsMdbList) req.mdblist = true; // Always check mdblist if ratings requested to ensure fresh data
    }
    
    return req;
}

export async function fetchSelectedAPIs(req, currentData, coreData, apiKeys) {
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

    // 2. MAL Images (Only Text)
    if (req.malImages && ids.mal) {
        promises.push(fetchWithTimeout(`https://api.jikan.moe/v4/anime/${ids.mal}`, 3500)
            .then(async res => {
                if (!res) return null;
                const data = (await res.json()).data;
                const imgs = data?.images;
                const posterUrl = imgs?.webp?.large_image_url || imgs?.jpg?.large_image_url;
                return posterUrl ? { source: 'mal', url: posterUrl } : null;
            }));
    }

    // 3. TMDB Images (For Textless)
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
        // Fanart: Fetch One Text and One Textless
        if (req.fanart && !currentData.posters?.fanart && apiKeys.fanartApiKey) {
            const fanartId = coreData.type === 'movie' ? ids.tmdb : (ids.tvdb || ids.tmdb);
            if (fanartId) {
                // Pass keys correctly
                promises.push(getFanartPoster(fanartId, coreData.type, apiKeys.fanartApiKey, false)
                    .then(p => ({ source: 'fanart', type: 'text', url: p })));
                promises.push(getFanartPoster(fanartId, coreData.type, apiKeys.fanartApiKey, true)
                    .then(p => ({ source: 'fanart', type: 'textless', url: p })));
            }
        }
        // Metahub: Only Text
        if (req.metahub && !currentData.posters?.metahub && workingImdbId) {
            promises.push(Promise.resolve({ source: 'metahub', url: `https://images.metahub.space/poster/medium/${workingImdbId}/img` }));
        }
        
        // MDBList
        if (req.mdblist && apiKeys.mdbListApiKey && workingImdbId) {
            promises.push(safeJsonFetch(fetchWithTimeout(`https://mdblist.com/api/?apikey=${apiKeys.mdbListApiKey}&i=${workingImdbId}`, 3000))
                .then(res => ({ source: 'mdblist', data: res })));
        }
    }

    const results = await Promise.allSettled(promises);
    return results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
}