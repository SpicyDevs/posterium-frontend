import { API_CACHE_TTL, IMG_CACHE_TTL, FINAL_CACHE_TTL, parseConfig } from './config.js';
import { getApiKeyFromKV, addApiKeyToKV, bufferToBase64 } from './utils.js';
import { generateSVGResponse } from './renderer.js';
import { getPosterData } from './posterService.js';

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });

    const cache = caches.default;
    const url = new URL(request.url);

    if (request.method === "GET" && !url.pathname.startsWith('/ratings')) {
        let response = await cache.match(request);
        if (response) return response;
    }

    if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });
    if (url.pathname === "/") return Response.redirect("https://freeposterapi.pages.dev", 301);

    // --- SEARCH ROUTE ---
    if (url.pathname === "/search") {
        const query = url.searchParams.get("q");
        const source = url.searchParams.get("source") || "tmdb";
        if (!query) return new Response("Missing query", { status: 400 });
        
        try {
            if (source === 'mal') {
                const jikanUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`;
                const jikanRes = await fetch(jikanUrl, { cf: { cacheTtl: 3600, cacheEverything: true } });
                const data = await jikanRes.json();
                const results = (data.data || []).map(item => ({
                    id: item.mal_id,
                    title: item.title_english || item.title,
                    poster_path: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
                    release_date: item.aired?.from ? item.aired.from.split('T')[0] : null,
                    media_type: 'anime'
                }));
                return new Response(JSON.stringify({ results }), { headers: { "Content-Type": "application/json" }});
            } else {
                const tmdbKey = env.TMDB_API_KEY; 
                const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(query)}`;
                const tmdbRes = await fetch(searchUrl, { cf: { cacheTtl: 3600, cacheEverything: true } });
                const data = await tmdbRes.json();
                if (!data.results) return new Response(JSON.stringify({ results: [] }), { headers: { "Content-Type": "application/json" }});
                
                const results = data.results
                    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                    .map(item => ({
                        id: item.id,
                        title: item.title || item.name,
                        poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null,
                        media_type: item.media_type,
                        release_date: item.release_date || item.first_air_date
                    }));

                return new Response(JSON.stringify({ results }), { headers: { "Content-Type": "application/json" }});
            }
        } catch (e) {
            return new Response("Search Error", { status: 500 });
        }
    }

    // --- RATINGS ENDPOINT ---
    const ratingsMatch = url.pathname.match(/^\/ratings\/(movie|tv|anime)\/([^\/]+)$/);
    if (ratingsMatch) {
        if (request.headers.get("X-Internal-Secret") !== "spicydevs-internal-v1") {
            return new Response("Unauthorized", { status: 403 });
        }

        const inputType = ratingsMatch[1];
        const rawId = ratingsMatch[2];

        const apiKeys = {
            tmdbApiKey: env.TMDB_API_KEY,
            fanartApiKey: env.FANART_API_KEY,
            mdbListApiKey: env.MDBLIST_API_KEY
        };

        try {
             const cfg = { 
                 ratings: ['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'mal', 'age', 'runtime'],
                 textless: false, 
                 source: 'tmdb' 
             };
             
             const data = await getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, 'json');
             
             return new Response(JSON.stringify({
                 ratings: data.ratings,
                 ids: data.ids,
                 meta: { 
                     title: data.movie?.title || data.movie?.name || data.movie?.original_title,
                     year: data.movie?.release_date?.split('-')[0] || data.movie?.first_air_date?.split('-')[0]
                 }
             }), { 
                 headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
             });
        } catch(e) {
             return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    // --- STANDARD RESOLVE ---
    const match = url.pathname.match(/^\/(movie|tv|poster|anime)\/(tt\d+|\d+)(?:\.(png|jpg|jpeg|svg|webp|json))?$/i);
    if (!match) return new Response("Not Found", { status: 404 });

    const inputType = match[1]; 
    const rawId = match[2];
    const format = (match[3] || "svg").toLowerCase();
    const isDownload = url.searchParams.has("download");
    const downloadFilename = `${rawId}.${format === 'json' ? 'json' : format}`;
    const dispositionHeader = isDownload ? `attachment; filename="${downloadFilename}"` : "inline";

    const userKeys = {
        tmdb: url.searchParams.get("tmdb_key"),
        fanart: url.searchParams.get("fanart_key"),
        mdblist: url.searchParams.get("mdblist_key")
    };

    // Store user keys in KV (Arrays)
    if (env.USER_KEYS) {
        for (const [provider, key] of Object.entries(userKeys)) {
            if (key && key.trim() !== "") {
                ctx.waitUntil(addApiKeyToKV(env.USER_KEYS, provider, key));
            }
        }
    }

    const apiKeys = {
        tmdbApiKey: userKeys.tmdb || await getApiKeyFromKV(env.USER_KEYS, 'tmdb') || env.TMDB_API_KEY,
        fanartApiKey: userKeys.fanart || await getApiKeyFromKV(env.USER_KEYS, 'fanart') || env.FANART_API_KEY,
        mdbListApiKey: userKeys.mdblist || await getApiKeyFromKV(env.USER_KEYS, 'mdblist') || env.MDBLIST_API_KEY
    };

    if (format !== "svg" && format !== "json") {
        const svgUrl = new URL(request.url);
        const publicHost = "rpdb.padhaiaayush.workers.dev";
        svgUrl.pathname = `/${inputType}/${rawId}.svg`;
        if (svgUrl.hostname !== publicHost && !svgUrl.hostname.includes('localhost')) {
            svgUrl.hostname = publicHost;
            svgUrl.protocol = "https:";
            svgUrl.port = ""; 
        }
        url.searchParams.forEach((v, k) => svgUrl.searchParams.set(k, v));
        const rasterService = new URL("https://wsrv.nl/");
        rasterService.searchParams.set("url", svgUrl.toString());
        rasterService.searchParams.set("output", format === "webp" ? "webp" : (format === "png" ? "png" : "jpg"));
        rasterService.searchParams.set("q", "100"); 

        const response = await fetch(rasterService);
        const finalRes = new Response(response.body, {
            headers: {
                "Content-Type": response.headers.get("Content-Type"),
                "Cache-Control": `public, max-age=${FINAL_CACHE_TTL}`, 
                "Access-Control-Allow-Origin": "*",
                "Content-Disposition": dispositionHeader
            }
        });
        ctx.waitUntil(cache.put(request, finalRes.clone()));
        return finalRes;
    }

    try {
        const cfg = parseConfig(url);
        const data = await getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, format);

        if (format === 'json') {
            const jsonRes = new Response(JSON.stringify({
                meta: {
                    request: { type: inputType, id: rawId },
                    resolved: { type: data.foundType, tmdb_id: data.movie?.id },
                    source_config: cfg.source,
                    textless_requested: cfg.textless,
                    is_cached: data.isCached,
                    cache_status: data.cacheLevel
                },
                poster: { 
                    selected: data.finalPosterUrl,
                    all_sources: data.posters
                },
                ratings: data.ratings,
                details: {
                    title: data.movie?.title || data.movie?.name,
                    overview: data.movie?.overview,
                    year: data.movie?.release_date?.split('-')[0] || data.movie?.first_air_date?.split('-')[0],
                    runtime: data.ratings?.runtime,
                    age_rating: data.ratings?.age,
                    imdb_id: data.movie?.external_ids?.imdb_id,
                }
            }, null, 2), {
                headers: { 
                    "Content-Type": "application/json", 
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": `public, max-age=${FINAL_CACHE_TTL}`
                }
            });
            ctx.waitUntil(cache.put(request, jsonRes.clone()));
            return jsonRes;
        }

        let posterBase64 = "";
        if (data.finalPosterUrl) {
            const imageFetch = fetch(data.finalPosterUrl, { cf: { cacheTtl: IMG_CACHE_TTL, cacheEverything: true } });
            const imgReq = await imageFetch;
            if (imgReq.ok) {
                const buffer = await imgReq.arrayBuffer();
                posterBase64 = `data:${imgReq.headers.get("content-type") || "image/jpeg"};base64,${bufferToBase64(buffer)}`;
            }
        }
        return generateSVGResponse(request, cfg, posterBase64, data.ratings, dispositionHeader, cache, ctx);

    } catch (e) {
        const status = (e.message === "ID Not Found" || e.message === "Resource Not Found") ? 404 : 500;
        return new Response("Error: " + e.message, { status });
    }
  }
};