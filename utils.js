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

// --- D1 & KV Helpers ---

export async function getD1Cache(db, key) {
    if (!db) return null;
    try {
        const result = await db.prepare("SELECT value FROM cache WHERE key = ?").bind(key).first();
        return result ? JSON.parse(result.value) : null;
    } catch (e) {
        console.error("D1 Read Error:", e);
        return null;
    }
}

export async function setD1Cache(db, key, data) {
    if (!db) return;
    try {
        await db.prepare(
            "INSERT OR REPLACE INTO cache (key, value, created_at) VALUES (?, ?, ?)"
        ).bind(key, JSON.stringify(data), Date.now()).run();
    } catch (e) {
        console.error("D1 Write Error:", e);
    }
}

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

// UPDATED: Accepts preferTextless boolean
export async function getFanartPoster(id, type, apiKey, preferTextless = false) {
    if (!id) return null; 
    const endpoint = type === 'movie' ? 'movies' : 'tv';
    const data = await safeJsonFetch(fetchWithTimeout(`https://webservice.fanart.tv/v3/${endpoint}/${id}?api_key=${apiKey}`, 2000));
    
    if (!data) return null;
    const posterKey = type === 'movie' ? 'movieposter' : 'tvposter';
    
    if (data[posterKey] && data[posterKey].length > 0) {
        
        // Helper to pick best image from a list
        const pickBest = (list) => {
            if (!list || list.length === 0) return null;
            list.sort((a, b) => (parseInt(b.likes) || 0) - (parseInt(a.likes) || 0));
            // Return 2nd best if available (often better quality/less cluttered), else 1st
            return list.length > 1 ? list[1].url : list[0].url;
        };

        const textlessList = data[posterKey].filter(p => p.lang === '00'); // '00' is No Language
        const englishList = data[posterKey].filter(p => p.lang === 'en');

        if (preferTextless) {
            // Try textless first, fallback to English
            return pickBest(textlessList) || pickBest(englishList);
        } else {
            // Try English first, fallback to textless
            return pickBest(englishList) || pickBest(textlessList);
        }
    }
    return null;
}