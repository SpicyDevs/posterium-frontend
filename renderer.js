// renderer.js
import { ICONS } from './icons.js';
import { FINAL_CACHE_TTL } from './config.js';

export function generateSVGResponse(request, cfg, posterUrl, ratings, dispositionHeader, cache, ctx) {
    const defaults = { 
        tmdb: {x:30,y:30}, imdb: {x:30,y:110}, rt: {x:30,y:190}, rt_popcorn: {x:30,y:270},
        letterboxd: {x:30,y:350}, meta: {x:30,y:430}, age: {x:30,y:510}, runtime: {x:30,y:590}
    };
    
    // Generate Defs
    const defs = Object.entries(ICONS).map(([k,v]) => `<symbol id="i-${k}" viewBox="${v.vb}">${v.body}</symbol>`).join("") 
            + `<filter id="sh" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                    <feOffset dx="0" dy="4" result="offsetblur"/>
                    <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
                    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>`
            + `<filter id="poster-fx">
                    <feGaussianBlur stdDeviation="${cfg.posterBlur}" />
                    <feColorMatrix type="saturate" values="${cfg.grayscale ? '0' : '1'}" />
                </filter>`;

    let blurDefs = "";
    let backgroundLayers = "";
    let badgeElements = "";
    let mainLayer = "";

    if (posterUrl) {
        // 1. Main Poster Layer (Using URL)
        mainLayer = `<image href="${posterUrl}" width="500" height="750" preserveAspectRatio="xMidYMid slice" filter="url(#poster-fx)"/>`;

        // 2. Calculate Blur Masks
        const activeRatings = cfg.ratings.filter(t => ratings[t]);
        const uniqueBlurs = new Set();
        activeRatings.forEach(t => {
            const item = cfg.items[t];
            if (item.blur > 0) uniqueBlurs.add(item.blur);
        });

        // Create blur filters
        uniqueBlurs.forEach(b => {
            blurDefs += `<filter id="b-${b}"><feGaussianBlur stdDeviation="${b}" /></filter>`;
        });

        // Create clip paths and background layers for each blur level
        uniqueBlurs.forEach(b => {
            let paths = ""; // Defined HERE, inside the loop
            
            activeRatings.forEach(t => {
                const item = cfg.items[t];
                if (item.blur === b) {
                    const x = item.x !== null ? item.x : defaults[t].x;
                    const y = item.y !== null ? item.y : defaults[t].y;
                    const scale = item.scale !== undefined ? item.scale : 1.0;
                    // Append to paths
                    paths += `<rect x="${x}" y="${y}" width="140" height="60" rx="${item.radius}" fill="white" transform="translate(${x},${y}) scale(${scale}) translate(-${x},-${y})" />`;
                }
            });
            
            // Check paths here (must be inside the uniqueBlurs loop)
            if (paths) {
                const maskId = `m-${b}`;
                blurDefs += `<clipPath id="${maskId}">${paths}</clipPath>`;
                backgroundLayers += `<image href="${posterUrl}" width="500" height="750" preserveAspectRatio="xMidYMid slice" filter="url(#b-${b}) url(#poster-fx)" clip-path="url(#${maskId})" />`;
            }
        });

    } else {
        // Fallback
        mainLayer = `
            <rect width="500" height="750" fill="#1a1a1a"/>
            <text x="250" y="375" dominant-baseline="middle" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="50" font-weight="bold" fill="#666666">NO POSTER</text>
        `;
    }

    // Badge Layers
    const activeRatings = cfg.ratings.filter(t => ratings[t]);
    activeRatings.forEach(t => {
        const val = ratings[t];
        const item = cfg.items[t];
        const x = item.x !== null ? item.x : defaults[t].x;
        const y = item.y !== null ? item.y : defaults[t].y;
        
        let bg = item.bg || `rgba(0,0,0,${item.alpha})`;
        if (bg.startsWith("grad:")) {
            const colors = bg.replace("grad:", "").split(":");
            const id = `g-${t}`;
            blurDefs += `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors[0]}"/><stop offset="100%" stop-color="${colors[1] || colors[0]}"/></linearGradient>`;
            bg = `url(#${id})`;
        }

        const txt = item.txt || "#fff";
        const scale = item.scale !== undefined ? item.scale : 1.0;
        const borderAttr = item.borderW > 0 ? `stroke="${item.borderC}" stroke-width="${item.borderW}"` : "";
        
        let iconId = t;
        if (t === "rt") iconId = parseInt(val) >= 60 ? "rt_fresh" : "rt_rotten";
        else if (t === "rt_popcorn") iconId = parseInt(val) >= 60 ? "popcorn_fresh" : "popcorn_rotten";
        
        const shadowAttr = item.shadow ? `filter="url(#sh)"` : "";
        let innerContent = "";
        
        if (t === 'age') {
            innerContent = `
                <text x="70" y="31" dominant-baseline="middle" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="bold" fill="${txt}">${val}</text>
                <rect x="15" y="10" width="110" height="40" rx="4" fill="none" stroke="${txt}" stroke-width="2.5" opacity="0.6"/>
            `;
        } else {
            const isRuntime = t === 'runtime';
            const iconSvg = isRuntime ? 'runtime' : iconId;
            const hasIcon = item.icon && ICONS[iconSvg];
            
            if (hasIcon) {
                let fSize = 28;
                if (isRuntime && val.length > 5) fSize = 24;
                innerContent = `
                    <use href="#i-${iconSvg}" x="${isRuntime?9:12}" y="${isRuntime?14:12}" width="${isRuntime?32:36}" height="${isRuntime?32:36}" ${isRuntime ? `color="${txt}"` : ""}/>
                    <text x="128" y="31" dominant-baseline="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="${fSize}" font-weight="bold" fill="${txt}" text-anchor="end">${val}</text>
                `;
            } else {
                innerContent = `<text x="70" y="31" dominant-baseline="middle" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="bold" fill="${txt}">${val}</text>`;
            }
        }

        badgeElements += `<g transform="translate(${x},${y}) scale(${scale}) translate(0,0)" transform-origin="70 30" ${shadowAttr}>
            <rect width="140" height="60" rx="${item.radius}" fill="${bg}" ${borderAttr}/>
            ${innerContent}
        </g>`;
    });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
        <style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&amp;display=swap');</style>
        <defs>${defs}${blurDefs}</defs>
        ${mainLayer}
        ${backgroundLayers}
        ${badgeElements}
    </svg>`;

    const finalResponse = new Response(svg, {
        headers: { 
            "Content-Type": "image/svg+xml", 
            "Cache-Control": `public, max-age=${FINAL_CACHE_TTL}`, 
            "Access-Control-Allow-Origin": "*",
            "Content-Disposition": dispositionHeader
        }
    });

    ctx.waitUntil(cache.put(request, finalResponse.clone()));
    return finalResponse;
}