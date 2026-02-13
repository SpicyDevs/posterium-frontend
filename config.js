import { SUPPORTED_SOURCES, DEFAULT_SOURCE_PRIORITY } from './sources/index.js';

export const API_CACHE_TTL = 15552000; // 6 Months
export const IMG_CACHE_TTL = 7776000;  // 3 Months
export const FINAL_CACHE_TTL = 172800; // 2 Days

const RATING_KEYS = ['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'mal', 'age', 'runtime'];
const SVG_PARAM_MAX_LENGTH = 64;

export function clampIntRange(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, Math.round(value)));
}

export function clampFloatRange(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

function parseSourceOrder(value) {
    if (!value) return [...DEFAULT_SOURCE_PRIORITY];
    const items = value
        .split(',')
        .map(v => v.trim().toLowerCase())
        .filter(Boolean);

    const invalid = items.find(item => !SUPPORTED_SOURCES.includes(item));
    if (invalid) throw new Error(`Invalid source in 'source_order': '${invalid}'`);

    return [...new Set(items)];
}

export function parseConfig(url) {
    const p = url.searchParams;

    const getInt = (k, def, min, max) => {
        const raw = p.get(k);
        if (raw === null) return def;
        const v = parseInt(raw, 10);
        if (Number.isNaN(v)) throw new Error(`Invalid integer for '${k}'`);
        return clampIntRange(v, min, max);
    };
    const getFloat = (k, def, min, max) => {
        const raw = p.get(k);
        if (raw === null) return def;
        const v = parseFloat(raw);
        if (Number.isNaN(v)) throw new Error(`Invalid number for '${k}'`);
        return clampFloatRange(v, min, max);
    };
    const getBool = (k, def) => { if (!p.has(k)) return def; return p.get(k) === "1"; };
    const getSvgSafeValue = (k) => {
        const value = p.get(k);
        if (!value) return null;
        if (value.length > SVG_PARAM_MAX_LENGTH) {
            throw new Error(`Query parameter '${k}' exceeds max length of ${SVG_PARAM_MAX_LENGTH}`);
        }
        return value;
    };

    const source = p.get('source') ? p.get('source').trim().toLowerCase() : null;
    if (source && !SUPPORTED_SOURCES.includes(source)) {
        throw new Error(`Invalid source '${source}'`);
    }

    const defaults = {
        blur: getInt("blur", 0, 0, 25),
        alpha: getFloat("alpha", 0.4, 0, 1),
        radius: getInt("rad", 12, 0, 70),
        shadow: getBool("sh", true),
        scale: getFloat("g_scale", 1.0, 0.5, 2),
        borderW: getInt("g_bw", 0, 0, 10),
        borderC: getSvgSafeValue("g_bc") || '#ffffff',
        bg: getSvgSafeValue("g_bg"),
        txt: getSvgSafeValue("g_txt")
    };

    const items = {};
    RATING_KEYS.forEach(key => {
        const scaleOverride = p.has(`${key}_scale`) ? getFloat(`${key}_scale`, defaults.scale, 0.5, 2) : null;
        const bwOverride = p.has(`${key}_bw`) ? getInt(`${key}_bw`, defaults.borderW, 0, 10) : null;
        const bcOverride = getSvgSafeValue(`${key}_bc`);
        const bgOverride = getSvgSafeValue(`${key}_bg`);
        const txtOverride = getSvgSafeValue(`${key}_txt`);

        items[key] = {
            x: getInt(`${key}_x`, null, 0, 500),
            y: getInt(`${key}_y`, null, 0, 750),
            bg: bgOverride || defaults.bg,
            txt: txtOverride || defaults.txt,
            blur: getInt(`${key}_blur`, defaults.blur, 0, 25),
            alpha: getFloat(`${key}_alpha`, defaults.alpha, 0, 1),
            radius: getInt(`${key}_rad`, defaults.radius, 0, 70),
            shadow: getBool(`${key}_sh`, defaults.shadow),
            icon: p.has(`${key}_icon`) ? p.get(`${key}_icon`) === "1" : true,
            scale: scaleOverride ?? defaults.scale,
            borderW: bwOverride ?? defaults.borderW,
            borderC: bcOverride || defaults.borderC
        };
    });

    const parsedRatings = p.has("r")
        ? p.get("r").split(",").map((value) => value.trim()).filter((value) => RATING_KEYS.includes(value))
        : [];

    return {
        ratings: parsedRatings,
        source,
        sourcePriority: parseSourceOrder(p.get('source_order')),
        malId: p.get("mal_id") || undefined,
        textless: getBool("textless", false),
        posterBlur: getInt("bg_blur", 0, 0, 25),
        grayscale: getBool("bw", false),
        items
    };
}
