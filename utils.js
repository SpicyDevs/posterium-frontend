// utils.js
import { API_CACHE_TTL } from './config.js';

const SENSITIVE_KEY_PATTERN = /(key|token|secret|authorization|password)/i;

export function redactSensitive(value) {
    if (value == null) return value;
    const s = String(value);
    if (s.length <= 6) return '***';
    return `${s.slice(0, 2)}***${s.slice(-2)}`;
}

function sanitizeForLog(payload, depth = 0) {
    if (depth > 4 || payload == null) return payload;
    if (Array.isArray(payload)) return payload.map(v => sanitizeForLog(v, depth + 1));
    if (typeof payload !== 'object') return payload;

    return Object.entries(payload).reduce((acc, [key, value]) => {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
            acc[key] = redactSensitive(value);
        } else {
            acc[key] = sanitizeForLog(value, depth + 1);
        }
        return acc;
    }, {});
}

export function logEvent(level, message, meta = {}) {
    const logger = level === 'error' ? console.error : console.log;
    const defaults = { route: null, inputType: null, id: null, provider: null, failureClass: null, requestId: null };
    logger(JSON.stringify({ ts: new Date().toISOString(), level, message, ...defaults, ...sanitizeForLog(meta) }));
}

export function normalizeServiceError(error, overrides = {}) {
    const base = typeof error === 'object' && error !== null ? error : { message: String(error || 'Unknown error') };
    const normalized = {
        code: base.code || 'INTERNAL_ERROR',
        status: base.status || 500,
        message: base.message || 'Internal error',
        failureClass: base.failureClass || 'internal',
        provider: base.provider || null,
        requestId: base.requestId || null,
        retryable: Boolean(base.retryable),
        details: base.details || null
    };
    return { ...normalized, ...overrides };
}

export function bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunkSize = 32768; 
    for (let i = 0; i < len; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
        binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
}

export const fetchWithTimeout = async (url, ms, cacheSeconds = API_CACHE_TTL, context = {}) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    const provider = context.provider || 'unknown';
    try {
        const r = await fetch(url, { 
            signal: controller.signal, 
            headers: {
                "User-Agent": "FreePosterAPI/1.0 (https://freeposterapi.pages.dev)"
            },
            cf: { cacheTtl: cacheSeconds, cacheEverything: true } 
        });
        if (!r.ok) {
            throw normalizeServiceError({
                code: 'UPSTREAM_BAD_STATUS',
                status: 502,
                message: `Upstream returned ${r.status}`,
                provider,
                failureClass: 'non_2xx',
                retryable: r.status >= 500,
                details: { upstreamStatus: r.status, url }
            }, context);
        }
        return r;
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw normalizeServiceError({
                code: 'UPSTREAM_TIMEOUT',
                status: 504,
                message: `Upstream timeout after ${ms}ms`,
                provider,
                failureClass: 'timeout',
                retryable: true,
                details: { timeoutMs: ms, url }
            }, context);
        }
        throw normalizeServiceError(error, { provider, ...context });
    }
    finally { clearTimeout(t); }
};

export async function safeJsonFetch(promise, context = {}) {
    const provider = context.provider || 'unknown';
    try {
        const req = await promise;
        const data = await req.json();
        const isEmptyObject = typeof data === 'object' && data !== null && !Array.isArray(data) && Object.keys(data).length === 0;
        if (data == null || isEmptyObject) {
            throw normalizeServiceError({
                code: 'UPSTREAM_EMPTY_PAYLOAD',
                status: 502,
                message: 'Upstream returned empty payload',
                provider,
                failureClass: 'empty_payload',
                retryable: true
            }, context);
        }
        return data;
    } catch (e) {
        if (e?.code) throw e;
        throw normalizeServiceError({
            code: 'UPSTREAM_PARSE_ERROR',
            status: 502,
            message: 'Failed to parse upstream payload',
            provider,
            failureClass: 'parse_error',
            retryable: true,
            details: { reason: e?.message }
        }, context);
    }
}

// --- D1 Database Helpers ---

export async function getD1Cache(db, type, id) {
    if (!db) return null;
    
    let query = "";
    let params = [];

    if (String(id).startsWith("tt")) {
        query = "SELECT data FROM poster_cache WHERE imdb_id = ?";
        params = [id];
    } else if (type === 'anime') {
        query = "SELECT data FROM poster_cache WHERE mal_id = ?";
        params = [id];
    } else {
        query = "SELECT data FROM poster_cache WHERE tmdb_id = ? AND type = ?";
        params = [id, type];
    }

    try {
        const result = await db.prepare(query).bind(...params).first();
        return result ? JSON.parse(result.data) : null;
    } catch (e) {
        logEvent('error', 'D1 Read Error', { failureClass: 'db_read_error', details: { reason: e?.message } });
        return null;
    }
}

export async function setD1Cache(db, type, ids, minimalData) {
    if (!db) return;

    const tmdb = ids.tmdb ? String(ids.tmdb) : null;
    const mal = ids.mal ? String(ids.mal) : null;
    const imdb = ids.imdb || null;
    const timestamp = Date.now();
    const dataStr = JSON.stringify(minimalData);

    try {
        if (type === 'anime' && mal) {
            await db.prepare(`
                INSERT INTO poster_cache (tmdb_id, mal_id, imdb_id, type, data, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(mal_id) DO UPDATE SET
                    data = excluded.data,
                    updated_at = excluded.updated_at,
                    imdb_id = COALESCE(excluded.imdb_id, poster_cache.imdb_id),
                    tmdb_id = COALESCE(excluded.tmdb_id, poster_cache.tmdb_id)
            `).bind(tmdb, mal, imdb, type, dataStr, timestamp).run();
        } else if (tmdb) {
            await db.prepare(`
                INSERT INTO poster_cache (tmdb_id, mal_id, imdb_id, type, data, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(tmdb_id, type) DO UPDATE SET
                    data = excluded.data,
                    updated_at = excluded.updated_at,
                    mal_id = COALESCE(excluded.mal_id, poster_cache.mal_id),
                    imdb_id = COALESCE(excluded.imdb_id, poster_cache.imdb_id)
            `).bind(tmdb, mal, imdb, type, dataStr, timestamp).run();
        }
    } catch (e) {
        logEvent('error', 'D1 Upsert Error', { failureClass: 'db_write_error', details: { reason: e?.message } });
    }
}

// --- KV Database Helpers ---

export async function getApiKeyFromKV(storage, provider) {
    if (!storage) return null;
    try {
        const keys = await storage.get(provider, { type: 'json' });
        if (!keys || !Array.isArray(keys) || keys.length === 0) return null;
        return keys[Math.floor(Math.random() * keys.length)];
    } catch (e) {
        logEvent('error', 'Error loading API key', { provider, failureClass: 'kv_read_error', details: { reason: e?.message } });
        return null;
    }
}

export async function addApiKeyToKV(storage, provider, newKey) {
    if (!storage || !newKey || typeof newKey !== 'string') return;
    const cleanKey = newKey.trim();
    if (cleanKey.length === 0) return;

    try {
        let keys = await storage.get(provider, { type: 'json' });
        if (!Array.isArray(keys)) keys = [];
        if (!keys.includes(cleanKey)) {
            keys.push(cleanKey);
            await storage.put(provider, JSON.stringify(keys));
        }
    } catch (e) {
        logEvent('error', 'Error adding API key', { provider, failureClass: 'kv_write_error', details: { reason: e?.message } });
    }
}

// --- Fanart Helpers ---

export async function fetchFanartData(id, type, apiKey) {
    if (!id || !apiKey) return null;
    const endpoint = type === 'movie' ? 'movies' : 'tv';
    const url = `https://webservice.fanart.tv/v3.2/${endpoint}/${id}?client_key=${apiKey}`;
    return await safeJsonFetch(fetchWithTimeout(url, 2000, API_CACHE_TTL, { provider: 'fanart', inputType: type, id }), { provider: 'fanart', inputType: type, id });
}

export function extractFanartImage(data, type, preferTextless, useSecondBest = false) {
    if (!data) return null;
    const posterKey = type === 'movie' ? 'movieposter' : 'tvposter';
    
    if (data[posterKey] && data[posterKey].length > 0) {
        const list = data[posterKey].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
        
        const textlessList = list.filter(p => p.lang === '00' || p.lang === ''); 
        const englishList = list.filter(p => p.lang === 'en');
        
        if (preferTextless) {
            return (textlessList[0]?.url || englishList[0]?.url || list[0]?.url);
        } else {
            // Text logic
            const targetList = englishList.length > 0 ? englishList : (textlessList.length > 0 ? textlessList : list);
            
            if (useSecondBest && targetList.length > 1) {
                return targetList[1].url;
            }
            return targetList[0].url;
        }
    }
    return null;
}

// --- IMDb Helpers (New) ---

export function extractImdbImage(data) {
    if (!data || !data.images || !Array.isArray(data.images)) return null;

    // Filter: Must be labeled 'poster' and must be Portrait (Height > Width)
    const candidates = data.images.filter(img => 
        img.type === 'poster' && 
        img.width && img.height && 
        img.height > img.width
    );

    if (candidates.length === 0) return null;

    // Logic: Calculate distance from ideal Aspect Ratio (0.667 aka 2:3)
    // If aspect ratios are very similar (within 5%), pick the higher resolution one.
    const IDEAL_AR = 2 / 3;

    candidates.sort((a, b) => {
        const arA = a.width / a.height;
        const arB = b.width / b.height;
        const diffA = Math.abs(arA - IDEAL_AR);
        const diffB = Math.abs(arB - IDEAL_AR);

        if (Math.abs(diffA - diffB) < 0.05) {
            return (b.width * b.height) - (a.width * a.height); // Higher res wins
        }
        return diffA - diffB; // Closer AR wins
    });

    return candidates[0].url;
}
