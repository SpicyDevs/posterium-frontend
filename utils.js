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
            headers: {
                "User-Agent": "FreePosterAPI/1.0 (https://freeposterapi.pages.dev)"
            },
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
        console.error("D1 Read Error:", e);
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
        console.error("D1 Upsert Error:", e);
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
        console.error(`Error loading API key for ${provider}:`, e);
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
        console.error(`Error adding API key to ${provider}:`, e);
    }
}

// --- Fanart Helpers ---

export async function fetchFanartData(id, type, apiKey) {
    if (!id || !apiKey) return null;
    const endpoint = type === 'movie' ? 'movies' : 'tv';
    const url = `https://webservice.fanart.tv/v3.2/${endpoint}/${id}?client_key=${apiKey}`;
    return await safeJsonFetch(fetchWithTimeout(url, 2000));
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