// config.js
export const API_CACHE_TTL = 15552000; // 6 Months
export const IMG_CACHE_TTL = 7776000;  // 3 Months
export const FINAL_CACHE_TTL = 172800; // 2 Days

export function parseConfig(url) {
    const p = url.searchParams;
    const getInt = (k, def) => { const v = parseInt(p.get(k)); return isNaN(v) ? def : v; }; 
    const getFloat = (k, def) => { const v = parseFloat(p.get(k)); return isNaN(v) ? def : v; };
    const getBool = (k, def) => { if (!p.has(k)) return def; return p.get(k) === "1"; };

    const defaults = {
        blur: getInt("blur", 0),
        alpha: getFloat("alpha", 0.4),
        radius: getInt("rad", 12),
        shadow: getBool("sh", true),
        scale: getFloat("g_scale", 1.0),
        borderW: getInt("g_bw", 0),
        borderC: p.get("g_bc") || '#ffffff',
        bg: p.get("g_bg"),
        txt: p.get("g_txt")
    };

    const items = {};
    ['imdb', 'rt', 'rt_popcorn', 'letterboxd', 'meta', 'tmdb', 'age', 'runtime'].forEach(key => {
        const scaleOverride = getFloat(`${key}_scale`, NaN);
        const bwOverride = getInt(`${key}_bw`, NaN);
        const bcOverride = p.get(`${key}_bc`);
        const bgOverride = p.get(`${key}_bg`);
        const txtOverride = p.get(`${key}_txt`);

        items[key] = {
            x: getInt(`${key}_x`, null),
            y: getInt(`${key}_y`, null),
            bg: bgOverride || defaults.bg,
            txt: txtOverride || defaults.txt,
            blur: getInt(`${key}_blur`, defaults.blur),
            alpha: getFloat(`${key}_alpha`, defaults.alpha),
            radius: getInt(`${key}_rad`, defaults.radius),
            shadow: getBool(`${key}_sh`, defaults.shadow),
            icon: p.has(`${key}_icon`) ? p.get(`${key}_icon`) === "1" : true,
            scale: !isNaN(scaleOverride) ? scaleOverride : defaults.scale,
            borderW: !isNaN(bwOverride) ? bwOverride : defaults.borderW,
            borderC: bcOverride || defaults.borderC
        };
    });

    return {
        ratings: p.has("r") ? p.get("r").split(",") : [],
        source: p.get("source") || "tmdb",
        textless: getBool("textless", false), // NEW PARAMETER
        posterBlur: getInt("bg_blur", 0),
        grayscale: getBool("bw", false),
        items
    };
}