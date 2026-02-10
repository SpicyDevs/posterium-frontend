// posterService.js
import { fetchWithTimeout, safeJsonFetch, getD1Cache, setD1Cache, getFanartPoster } from './utils.js';

export async function getPosterData(env, ctx, inputType, rawId, cfg, apiKeys) {
    const { tmdbApiKey, fanartApiKey, omdbApiKey, mdbListApiKey } = apiKeys;
    
    // Cache Key
    const cacheKey = `${inputType}:${rawId}:${cfg.source}:${cfg.textless ? 'tl' : 'std'}:v17`;
    
    // 1. Try D1 Cache
    let cachedData = await getD1Cache(env.POSTER_CACHE, cacheKey);
    if (cachedData) {
        return { ...cachedData, isCached: true };
    }

    let activeType = inputType;
    let tmdbId = rawId;

    // 2. Resolve ID (if input is IMDb ID or generic 'poster')
    if (inputType === 'poster' || rawId.startsWith("tt")) {
        const findUrl = `https://api.themoviedb.org/3/find/${rawId}?api_key=${tmdbApiKey}&external_source=imdb_id`;
        const findData = await safeJsonFetch(fetchWithTimeout(findUrl, 2500));
        
        if (findData) {
            if (findData.movie_results?.length > 0) {
                activeType = 'movie';
                tmdbId = findData.movie_results[0].id;
            } else if (findData.tv_results?.length > 0) {
                activeType = 'tv';
                tmdbId = findData.tv_results[0].id;
            } else if (inputType === 'poster') {
                throw new Error("ID Not Found");
            }
        }
    }

    // 3. Fetch Core TMDB Data
    const tmdbUrl = `https://api.themoviedb.org/3/${activeType}/${tmdbId}?api_key=${tmdbApiKey}&append_to_response=external_ids,release_dates,content_ratings,credits,images`;
    const tmdbRes = await fetchWithTimeout(tmdbUrl, 2500);
    if (!tmdbRes) throw new Error("TMDB Resource Not Found");
    
    const movie = await tmdbRes.json();
    const imdbId = movie.external_ids?.imdb_id;
    const tvdbId = movie.external_ids?.tvdb_id;
    const fanartLookupId = activeType === 'movie' ? tmdbId : (tvdbId || tmdbId);

    // 4. Parallel Fetching (Fanart, OMDB, MDBList)
    const promises = [];
    promises.push(getFanartPoster(fanartLookupId, activeType, fanartApiKey, cfg.textless).then(res => ({ type: 'fanart', res })));
    
    if (imdbId) promises.push(safeJsonFetch(fetchWithTimeout(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbApiKey}&tomatoes=true`, 3000)).then(res => ({ type: 'omdb', res })));
    if (imdbId && mdbListApiKey) promises.push(safeJsonFetch(fetchWithTimeout(`https://mdblist.com/api/?apikey=${mdbListApiKey}&i=${imdbId}`, 3000)).then(res => ({ type: 'mdblist', res })));

    const results = await Promise.allSettled(promises);
    let fanartUrl = null;
    /** @type {any} */
    let omdb = null;
    /** @type {any} */
    let mdblist = null;

    results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
            if (r.value.type === 'fanart') fanartUrl = r.value.res;
            if (r.value.type === 'omdb') omdb = r.value.res;
            if (r.value.type === 'mdblist') mdblist = r.value.res;
        }
    });

    // 5. Resolve Poster URL
    let tmdbPoster = null;
    if (cfg.textless && movie.images && movie.images.posters) {
        const textlessPosters = movie.images.posters.filter(p => p.iso_639_1 === null || p.iso_639_1 === 'xx');
        if (textlessPosters.length > 0) {
            textlessPosters.sort((a, b) => b.vote_count - a.vote_count);
            tmdbPoster = `https://image.tmdb.org/t/p/w780${textlessPosters[0].file_path}`;
        }
    }
    if (!tmdbPoster) {
        tmdbPoster = movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : null;
    }

    let finalPosterUrl = (cfg.source === 'tmdb') ? (tmdbPoster || fanartUrl) : (fanartUrl || tmdbPoster);

    // 6. Consolidate Ratings
    const ratings = {};
    if (omdb) {
        if (omdb.imdbRating && omdb.imdbRating !== "N/A") ratings.imdb = omdb.imdbRating;
        if (omdb.Metascore && omdb.Metascore !== "N/A") ratings.meta = omdb.Metascore;
        const rt = omdb.Ratings?.find(r => r.Source === "Rotten Tomatoes");
        if (rt) ratings.rt = rt.Value; 
    }
    if (mdblist && mdblist.ratings) {
        if (!ratings.imdb && mdblist.score) ratings.imdb = mdblist.score.toString();
        const rtData = mdblist.ratings.find(x => x.source === 'tomatoes');
        if (!ratings.rt && rtData?.value) ratings.rt = rtData.value + "%"; 
        const metaData = mdblist.ratings.find(x => x.source === 'metacritic');
        if (!ratings.meta && metaData?.value) ratings.meta = metaData.value.toString();
        const rtAudience = mdblist.ratings.find(x => x.source === 'tomatoesaudience');
        if (rtAudience?.value) ratings.rt_popcorn = rtAudience.value + "%";
        const lbData = mdblist.ratings.find(x => x.source === 'letterboxd');
        if (lbData?.value) ratings.letterboxd = lbData.value.toString();
    }
    if (movie.vote_average) ratings.tmdb = Math.round(movie.vote_average * 10) + "%";

    // Age & Runtime Logic
    let ageRating = "";
    if (activeType === 'movie' && movie.release_dates?.results) {
        const us = movie.release_dates.results.find(r => r.iso_3166_1 === 'US');
        if (us) {
            const cert = us.release_dates.find(d => d.certification !== '');
            if (cert) ageRating = cert.certification;
        }
    } else if (activeType === 'tv' && movie.content_ratings?.results) {
        const us = movie.content_ratings.results.find(r => r.iso_3166_1 === 'US');
        if (us) ageRating = us.rating;
    }
    if (ageRating) ratings.age = ageRating;

    let runtime = "";
    if (activeType === 'movie' && movie.runtime) {
        const h = Math.floor(movie.runtime / 60);
        const m = movie.runtime % 60;
        runtime = h > 0 ? `${h}h ${m}m` : `${m}m`;
    } else if (activeType === 'tv') {
        let tRun = movie.episode_run_time?.[0] || movie.last_episode_to_air?.runtime || 0;
        if (tRun > 0) {
            const h = Math.floor(tRun / 60);
            const m = tRun % 60;
            runtime = h > 0 ? `${h}h ${m}m` : `${m}m`;
        }
    }
    if (!runtime && omdb?.Runtime && omdb.Runtime !== "N/A") {
        runtime = omdb.Runtime.replace(" min", "m").replace(" h", "h");
    }
    if (runtime) ratings.runtime = runtime;

    // 7. Write to Cache
    const dataToCache = { movie, ratings, finalPosterUrl, foundType: activeType, omdb, mdblist };
    if (env.POSTER_CACHE) {
        ctx.waitUntil(setD1Cache(env.POSTER_CACHE, cacheKey, dataToCache));
    }

    return { ...dataToCache, isCached: false };
}