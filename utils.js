// utils.js
import { API_CACHE_TTL } from './config.js';

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

export const fetchWithTimeout = async (url, ms, cacheSeconds = API_CACHE_TTL) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
        const r = await fetch(url, { 
            signal: controller.signal, 
            cf: { cacheTtl: cacheSeconds, cacheEverything: true } 
        });
        return r.ok ? r : null;
    } catch { return null; }
    finally { clearTimeout(t); }
};

export async function safeJsonFetch(promise) {
    try {
        const req = await promise;
        if (!req) return null;
        return await req.json();
    } catch (e) {
        return null;
    }
}

// --- SQL-Based D1 Helpers (No Counter) ---

export async function getPosterCache(db, type, id) {
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
        console.error("D1 Read Error:", e);
        return null;
    }
}

export async function setPosterCache(db, type, ids, fullData) {
    if (!db) return;

    const tmdb = ids.tmdb ? parseInt(ids.tmdb) : null;
    const mal = ids.mal ? parseInt(ids.mal) : null;
    const imdb = ids.imdb || null;

    let conflictTarget = "";
    if (type === 'anime' && mal) {
        conflictTarget = "mal_id";
    } else if (tmdb) {
        conflictTarget = "tmdb_id, type"; 
    } else if (imdb) {
        conflictTarget = "imdb_id";
    } else {
        return; 
    }

    try {
        await db.prepare(`
            INSERT INTO poster_cache (tmdb_id, mal_id, imdb_id, type, data, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(${conflictTarget}) DO UPDATE SET
                data = excluded.data,
                tmdb_id = COALESCE(excluded.tmdb_id, poster_cache.tmdb_id),
                mal_id = COALESCE(excluded.mal_id, poster_cache.mal_id),
                imdb_id = COALESCE(excluded.imdb_id, poster_cache.imdb_id),
                created_at = excluded.created_at
        `).bind(tmdb, mal, imdb, type, JSON.stringify(fullData), Date.now()).run();
    } catch (e) {
        console.error("D1 Write Error:", e);
    }
}

// --- KV Helpers ---

export async function getRandomKey(storage, prefix) {
    if (!storage) return null;
    try {
        const list = await storage.list({ prefix: `${prefix}_` });
        if (!list.keys || list.keys.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * list.keys.length);
        const keyName = list.keys[randomIndex].name;
        return await storage.get(keyName);
    } catch (e) {
        console.error(`Error loading random key for ${prefix}:`, e);
        return null;
    }
}

export async function getFanartPoster(id, type, apiKey, preferTextless = false) {
    if (!id) return null; 
    const endpoint = type === 'movie' ? 'movies' : 'tv';
    const data = await safeJsonFetch(fetchWithTimeout(`https://webservice.fanart.tv/v3/${endpoint}/${id}?api_key=${apiKey}`, 2000));
    
    if (!data) return null;
    const posterKey = type === 'movie' ? 'movieposter' : 'tvposter';
    
    if (data[posterKey] && data[posterKey].length > 0) {
        const pickBest = (list) => {
            if (!list || list.length === 0) return null;
            list.sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
            return list.length > 1 ? list[1].url : list[0].url;
        };
        const textlessList = data[posterKey].filter(p => p.lang === '00' || p.lang === ''); 
        const englishList = data[posterKey].filter(p => p.lang === 'en');
        return preferTextless ? (pickBest(textlessList) || pickBest(englishList)) : (pickBest(englishList) || pickBest(textlessList));
    }
    return null;
}