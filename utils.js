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

// --- D1 Database Helpers (New Schema) ---

export async function getD1Cache(db, type, id) {
    if (!db) return null;
    
    let query = "";
    let params = [];

    // Prioritize IDs based on input format
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
        // Check for existence to determine UPDATE vs INSERT
        let existing = null;
        if (type === 'anime' && mal) {
            existing = await db.prepare("SELECT id FROM poster_cache WHERE mal_id = ?").bind(mal).first();
        } else if (imdb && String(imdb).startsWith('tt')) {
            existing = await db.prepare("SELECT id FROM poster_cache WHERE imdb_id = ?").bind(imdb).first();
        } else if (tmdb) {
            existing = await db.prepare("SELECT id FROM poster_cache WHERE tmdb_id = ? AND type = ?").bind(tmdb, type).first();
        }

        if (existing) {
            await db.prepare(`
                UPDATE poster_cache 
                SET data = ?, created_at = ?, tmdb_id = COALESCE(?, tmdb_id), mal_id = COALESCE(?, mal_id), imdb_id = COALESCE(?, imdb_id)
                WHERE id = ?
            `).bind(dataStr, timestamp, tmdb, mal, imdb, existing.id).run();
        } else {
            await db.prepare(`
                INSERT INTO poster_cache (tmdb_id, mal_id, imdb_id, type, data, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(tmdb, mal, imdb, type, dataStr, timestamp).run();
        }
    } catch (e) {
        console.error("D1 Write Error:", e);
    }
}

// --- KV Database Helpers (Array Strategy) ---

export async function getApiKeyFromKV(storage, provider) {
    if (!storage) return null;
    try {
        // Provider is 'tmdb', 'fanart', or 'mdblist'
        const keys = await storage.get(provider, { type: 'json' });
        if (!keys || !Array.isArray(keys) || keys.length === 0) return null;
        
        // Return random key
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
        // 1. Get existing array
        let keys = await storage.get(provider, { type: 'json' });
        if (!Array.isArray(keys)) keys = [];

        // 2. Add only if unique
        if (!keys.includes(cleanKey)) {
            keys.push(cleanKey);
            // 3. Save back (KV limit 25MB is plenty for simple key strings)
            await storage.put(provider, JSON.stringify(keys));
        }
    } catch (e) {
        console.error(`Error adding API key to ${provider}:`, e);
    }
}

export async function getFanartPoster(id, type, apiKey, preferTextless = false) {
    if (!id) return null; 
    const endpoint = type === 'movie' ? 'movies' : 'tv';
    // Ensure API Key is passed correctly in URL
    const url = `https://webservice.fanart.tv/v3/${endpoint}/${id}?api_key=${apiKey}`;
    
    const data = await safeJsonFetch(fetchWithTimeout(url, 2000));
    
    if (!data) return null;
    const posterKey = type === 'movie' ? 'movieposter' : 'tvposter';
    
    if (data[posterKey] && data[posterKey].length > 0) {
        // Sort by likes
        const list = data[posterKey].sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
        
        const textlessList = list.filter(p => p.lang === '00' || p.lang === ''); 
        const englishList = list.filter(p => p.lang === 'en');
        
        // Return only the URL string of the best match
        if (preferTextless) {
            return (textlessList[0]?.url || englishList[0]?.url || list[0]?.url);
        } else {
            return (englishList[0]?.url || textlessList[0]?.url || list[0]?.url);
        }
    }
    return null;
}