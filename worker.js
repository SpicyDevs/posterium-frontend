import { API_CACHE_TTL, IMG_CACHE_TTL, FINAL_CACHE_TTL, parseConfig } from './config.js';
import { getApiKeyFromKV, addApiKeyToKV, bufferToBase64, getD1Cache, logEvent, normalizeServiceError } from './utils.js';
import { generateSVGResponse } from './renderer.js';
import { getPosterData } from './posterService.js';
import { SUPPORTED_SOURCES } from './sources/index.js';

// 1. Define Global State outside the default export
// These persist between requests on the same worker instance
let GLOBAL_KEYS = {
    tmdb: null,
    fanart: null,
    mdblist: null,
    initialized: false
};


function getRequestId(request) {
    return request.headers.get('X-Request-ID') || crypto.randomUUID();
}

function withRequestHeaders(initHeaders = {}, requestId) {
    const headers = new Headers(initHeaders);
    headers.set('X-Request-ID', requestId);
    return headers;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });

    const cache = caches.default;
    const url = new URL(request.url);
    const requestId = getRequestId(request);

    if (request.method === "GET" && !url.pathname.startsWith('/ratings')) {
        let response = await cache.match(request);
        if (response) return response;
    }

    if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });
    if (url.pathname === "/") return Response.redirect("https://freeposterapi.pages.dev", 301);

    // --- TEST / HEALTH DIAGNOSTICS ENDPOINT ---
    if (url.pathname === "/test" || url.pathname === "/test/") {
        const runExecution = url.searchParams.get("run") === "1";
        const sourceList = url.searchParams.get("sources")
            ? url.searchParams.get("sources").split(',').map(s => s.trim().toLowerCase()).filter(s => SUPPORTED_SOURCES.includes(s))
            : SUPPORTED_SOURCES;

        const ids = {
            movie: url.searchParams.get("movie_id") || "550",
            tv: url.searchParams.get("tv_id") || "1399",
            anime: url.searchParams.get("anime_id") || "5114"
        };

        const baseUrl = `${url.origin}`;
        const steps = [];
        const addStep = (title, details = {}) => {
            steps.push({ step: steps.length + 1, title, timestamp: new Date().toISOString(), details });
        };

        addStep("Received /test request", {
            requestId,
            method: request.method,
            runExecution,
            fullPath: `${url.pathname}${url.search}`
        });

        addStep("Parsed IDs and source matrix", {
            ids,
            sourceCount: sourceList.length,
            sources: sourceList
        });

        const dbPreview = {};
        if (env.POSTER_CACHE) {
            for (const [mediaType, id] of Object.entries(ids)) {
                const item = await getD1Cache(env.POSTER_CACHE, mediaType, id);
                dbPreview[mediaType] = {
                    cacheHit: Boolean(item),
                    cacheLevel: item?.cacheLevel || null,
                    knownIds: item?.ids || null
                };
            }
            addStep("Checked database cache first", dbPreview);
        } else {
            addStep("Checked database cache first", { warning: "POSTER_CACHE binding not configured" });
        }

        addStep("Checked configured key availability", {
            tmdbConfigured: Boolean(env.TMDB_API_KEY),
            fanartConfigured: Boolean(env.FANART_API_KEY),
            mdblistConfigured: Boolean(env.MDBLIST_API_KEY),
            userKeysKVConfigured: Boolean(env.USER_KEYS)
        });

        const matrix = [];
        ["movie", "tv", "anime"].forEach(mediaType => {
            sourceList.forEach(source => {
                const requestPath = `/${mediaType}/${ids[mediaType]}.json?source=${encodeURIComponent(source)}&textless=1&r=imdb,rt,meta,tmdb,mal,age,runtime`;
                matrix.push({
                    mediaType,
                    id: ids[mediaType],
                    source,
                    requestPath,
                    requestUrl: `${baseUrl}${requestPath}`
                });
            });
        });

        addStep("Built exhaustive test matrix across media types and sources", {
            totalRequests: matrix.length,
            mediaTypes: ["movie", "tv", "anime"],
            sample: matrix.slice(0, 4)
        });

        const results = [];
        if (runExecution) {
            addStep("Executing each matrix entry", { mode: "live" });
            for (const testCase of matrix) {
                const startedAt = Date.now();
                try {
                    const testRes = await fetch(testCase.requestUrl, {
                        headers: { "X-Request-ID": `${requestId}:test:${testCase.mediaType}:${testCase.source}` }
                    });

                    results.push({
                        ...testCase,
                        status: testRes.status,
                        ok: testRes.ok,
                        durationMs: Date.now() - startedAt
                    });
                } catch (error) {
                    results.push({
                        ...testCase,
                        status: 0,
                        ok: false,
                        durationMs: Date.now() - startedAt,
                        error: error?.message || "Request failed"
                    });
                }
            }
            addStep("Completed live execution", {
                total: results.length,
                succeeded: results.filter(r => r.ok).length,
                failed: results.filter(r => !r.ok).length
            });
        } else {
            addStep("Execution skipped", { reason: "Pass run=1 to execute all tests. Returned dry-run matrix only." });
        }

        return new Response(JSON.stringify({
            requestId,
            route: "/test",
            mode: runExecution ? "live" : "dry-run",
            receivedInput: {
                query: Object.fromEntries(url.searchParams.entries()),
                ids,
                sources: sourceList
            },
            fullTestsCommand: `curl '${baseUrl}/test/?run=1&movie_id=${ids.movie}&tv_id=${ids.tv}&anime_id=${ids.anime}&sources=${sourceList.join(',')}'`,
            summary: {
                matrixCount: matrix.length,
                executedCount: results.length
            },
            steps,
            matrix,
            results
        }, null, 2), {
            headers: withRequestHeaders({ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, requestId)
        });
    }

    // --- SEARCH ROUTE (Unchanged) ---
    if (url.pathname === "/search") {
        const query = url.searchParams.get("q");
        const source = url.searchParams.get("source") || "tmdb";
        if (!query) return new Response(JSON.stringify({ error: "Missing query", requestId }), { status: 400, headers: withRequestHeaders({"Content-Type":"application/json"}, requestId) });
        try {
            if (source === 'mal') {
                const jikanRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`, { cf: { cacheTtl: 3600, cacheEverything: true } });
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
                const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
                const tmdbRes = await fetch(searchUrl, { cf: { cacheTtl: 3600, cacheEverything: true } });
                const data = await tmdbRes.json();
                const results = (data.results || [])
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
            const err = normalizeServiceError(e, { requestId, route: url.pathname, failureClass: e?.failureClass || "search_error", provider: "search" });
            logEvent("error", "Search failed", { route: url.pathname, requestId, failureClass: err.failureClass, provider: err.provider });
            return new Response(JSON.stringify({ error: err.message, requestId, failureClass: err.failureClass }), { status: err.status, headers: withRequestHeaders({"Content-Type":"application/json"}, requestId) });
        }
    }

    // --- RATINGS ENDPOINT (Secured) ---
    const ratingsMatch = url.pathname.match(/^\/ratings\/(movie|tv|anime)\/([^\/]+)$/);
    if (ratingsMatch) {
        if (request.headers.get("X-Internal-Secret") !== "spicydevs-internal-v1") {
            return new Response(JSON.stringify({ error: "Unauthorized", requestId, failureClass: "auth" }), { status: 403, headers: withRequestHeaders({"Content-Type":"application/json"}, requestId) });
        }
        const inputType = ratingsMatch[1];
        const rawId = ratingsMatch[2];
        const apiKeys = { tmdbApiKey: env.TMDB_API_KEY, fanartApiKey: env.FANART_API_KEY, mdbListApiKey: env.MDBLIST_API_KEY };

        try {
             const cfg = { ratings: ['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'mal', 'age', 'runtime'], textless: false, source: 'tmdb' };
             const data = await getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, 'json', { requestId, route: url.pathname, inputType, id: rawId });
             return new Response(JSON.stringify({
                 ratings: data.ratings,
                 ids: data.ids, // Useful for debugging/linking
                 meta: { title: data.title, year: data.year }
             }), { headers: withRequestHeaders({ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, requestId) });
        } catch(e) {
             const err = normalizeServiceError(e, { requestId, route: url.pathname, inputType, id: rawId });
             logEvent('error', 'Ratings route failed', { route: url.pathname, requestId, inputType, id: rawId, provider: err.provider, failureClass: err.failureClass });
             return new Response(JSON.stringify({ error: err.message, requestId, failureClass: err.failureClass }), { status: err.status, headers: withRequestHeaders({"Content-Type":"application/json"}, requestId) });
        }
    }

    // --- STANDARD RESOLVE ---
    const match = url.pathname.match(/^\/(movie|tv|poster|anime)\/(tt\d+|\d+)(?:\.(png|jpg|jpeg|svg|webp|json))?$/i);
    if (!match) return new Response(JSON.stringify({ error: "Not Found", requestId, failureClass: "not_found" }), { status: 404, headers: withRequestHeaders({"Content-Type":"application/json"}, requestId) });

    const inputType = match[1]; 
    const rawId = match[2];
    const format = (match[3] || "svg").toLowerCase();
    const isDownload = url.searchParams.has("download");
    const downloadFilename = `${rawId}.${format === 'json' ? 'json' : format}`;
    const dispositionHeader = isDownload ? `attachment; filename="${downloadFilename}"` : "inline";

    // Handle User Keys
    const userKeys = {
        tmdb: url.searchParams.get("tmdb_key"),
        fanart: url.searchParams.get("fanart_key"),
        mdblist: url.searchParams.get("mdblist_key")
    };

    if (env.USER_KEYS) {
        Object.entries(userKeys).forEach(([k, v]) => {
            if (v && v.trim() !== "") ctx.waitUntil(addApiKeyToKV(env.USER_KEYS, k, v));
        });
    }

    // 2. LAZY KEY SELECTION
    // Immediate: Use memory cache if available, otherwise fall back to env default immediately.
    // This adds 0ms latency.
    const apiKeys = {
        tmdbApiKey: userKeys.tmdb || GLOBAL_KEYS.tmdb || env.TMDB_API_KEY,
        fanartApiKey: userKeys.fanart || GLOBAL_KEYS.fanart || env.FANART_API_KEY,
        mdbListApiKey: userKeys.mdblist || GLOBAL_KEYS.mdblist || env.MDBLIST_API_KEY
    };

    // 3. BACKGROUND REFRESH
    // If we haven't fetched KV keys yet, schedule it for AFTER this response is sent.
    // The NEXT user will get the random keys.
    if (!GLOBAL_KEYS.initialized && env.USER_KEYS) {
        ctx.waitUntil(refreshGlobalKeys(env.USER_KEYS));
    }

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
            headers: withRequestHeaders({
                "Content-Type": response.headers.get("Content-Type"),
                "Cache-Control": `public, max-age=${FINAL_CACHE_TTL}`, 
                "Access-Control-Allow-Origin": "*",
                "Content-Disposition": dispositionHeader
            }, requestId)
        });
        ctx.waitUntil(cache.put(request, finalRes.clone()));
        return finalRes;
    }

    try {
        const cfg = parseConfig(url);
        const data = await getPosterData(env, ctx, inputType, rawId, cfg, apiKeys, format, { requestId, route: url.pathname, inputType, id: rawId });

        if (format === 'json') {
            const jsonRes = new Response(JSON.stringify({
                meta: {
                    title: data.title,
                    year: data.year,
                    // Minimal technical meta for debugging cache hits
                    cache_status: data.cacheLevel
                },
                poster: { 
                    selected: data.finalPosterUrl,
                    all_sources: data.posters
                },
                ratings: data.ratings
            }, null, 2), {
                headers: withRequestHeaders({ 
                    "Content-Type": "application/json", 
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": `public, max-age=${FINAL_CACHE_TTL}`
                }, requestId)
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
        const err = normalizeServiceError(e, { requestId, route: url.pathname, inputType, id: rawId });
        logEvent('error', 'Request failed', { route: url.pathname, requestId, inputType, id: rawId, provider: err.provider, failureClass: err.failureClass });
        return new Response(JSON.stringify({ error: err.message, requestId, failureClass: err.failureClass }), { status: err.status, headers: withRequestHeaders({"Content-Type":"application/json", "Access-Control-Allow-Origin":"*"}, requestId) });
    }
  }
};

// Helper function to update global state in background
async function refreshGlobalKeys(kv) {
    try {
        const [t, f, m] = await Promise.all([
            getApiKeyFromKV(kv, 'tmdb'),
            getApiKeyFromKV(kv, 'fanart'),
            getApiKeyFromKV(kv, 'mdblist')
        ]);
        if (t) GLOBAL_KEYS.tmdb = t;
        if (f) GLOBAL_KEYS.fanart = f;
        if (m) GLOBAL_KEYS.mdblist = m;
        GLOBAL_KEYS.initialized = true;
    } catch (e) {
        logEvent("error", "Background Key Refresh Failed", { route: "background", provider: "kv", failureClass: "background_refresh", details: { reason: e?.message } });
    }
}
