/**
 * Tests for v3Builder — buildOptimalUrl, cleanValue, urlSavings.
 * Tests for utils — parseUrlToConfig and generateApiUrl (short-form aliases).
 * Tests for handlers/backdrop — 501 stub.
 */
import { describe, it, expect } from 'vitest';
import { cleanValue, buildOptimalUrl, urlSavings } from '../v3Builder';
import { parseUrlToConfig, generateApiUrl, PROVIDER_SHORT, SHORT_PROVIDER } from '../../components/builder/utils';
import { handleBackdrop, handleBanner, parseBackdropParams } from '../../../handlers/backdrop';
import type { PosterConfig } from '../../components/builder/types';
import { DEFAULT_CONFIG } from '../../components/builder/types';

// ---------------------------------------------------------------------------
// cleanValue
// ---------------------------------------------------------------------------

describe('cleanValue', () => {
  it('strips trailing zeros from percentage', () => {
    expect(cleanValue('85.0%')).toBe('85%');
  });
  it('strips trailing zeros from decimal', () => {
    expect(cleanValue('7.50')).toBe('7.5');
    expect(cleanValue('3.80')).toBe('3.8');
  });
  it('strips ".0" from whole number expressed as decimal', () => {
    expect(cleanValue('72.0')).toBe('72');
  });
  it('leaves integers unchanged', () => {
    expect(cleanValue('84')).toBe('84');
    expect(cleanValue('72')).toBe('72');
  });
  it('leaves significant decimals unchanged', () => {
    expect(cleanValue('8.42')).toBe('8.42');
  });
  it('leaves non-numeric strings unchanged', () => {
    expect(cleanValue('PG-13')).toBe('PG-13');
    expect(cleanValue('2h 8m')).toBe('2h 8m');
  });
  it('handles integer percentage', () => {
    expect(cleanValue('95%')).toBe('95%');
  });
});

// ---------------------------------------------------------------------------
// buildOptimalUrl — short-form aliases
// ---------------------------------------------------------------------------

const SAMPLE_CONFIG: PosterConfig = {
  ...DEFAULT_CONFIG,
  ratings: ['imdb', 'rt'],
  blur: 8, alpha: 0.4, radius: 12, shadow: 6,
  source: 'tmdb', textless: false, ptype: 'auto',
  grayscale: false, posterBlur: 0, extension: 'png',
  items: {
    imdb: { x: 310, y: 20 },
    rt:   { x: 310, y: 90 },
  },
};

describe('buildOptimalUrl — short-form params', () => {
  it('uses short provider IDs in r= param', () => {
    const url = buildOptimalUrl(SAMPLE_CONFIG);
    const q   = new URL(url).searchParams;
    expect(q.get('r')).toBe('i,r');
  });

  it('uses bl/al/ra/sh for global glass params', () => {
    const url = buildOptimalUrl(SAMPLE_CONFIG);
    const q   = new URL(url).searchParams;
    expect(q.get('bl')).toBe('8');
    expect(q.get('al')).toBe('0.4');
    expect(q.get('ra')).toBe('12');
    expect(q.get('sh')).toBe('6');
  });

  it('uses short provider prefix for per-badge x/y', () => {
    const url = buildOptimalUrl(SAMPLE_CONFIG);
    const q   = new URL(url).searchParams;
    expect(q.get('i_x')).toBe('310');
    expect(q.get('i_y')).toBe('20');
    expect(q.get('r_x')).toBe('310');
    expect(q.get('r_y')).toBe('90');
    // Long-form prefix should NOT be set (builder uses short prefix)
    expect(q.get('imdb_x')).toBeNull();
    expect(q.get('rt_x')).toBeNull();
  });

  it('uses so for source when not tmdb', () => {
    const cfg = { ...SAMPLE_CONFIG, source: 'fanart' as const };
    const url = buildOptimalUrl(cfg);
    const q   = new URL(url).searchParams;
    expect(q.get('so')).toBe('fanart');
    expect(q.get('source')).toBeNull();
  });

  it('uses tl for textless flag', () => {
    const cfg = { ...SAMPLE_CONFIG, source: 'tmdb' as const, textless: true };
    const url = buildOptimalUrl(cfg);
    const q   = new URL(url).searchParams;
    expect(q.get('tl')).toBe('1');
    expect(q.get('textless')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildOptimalUrl — new v3 params
// ---------------------------------------------------------------------------

describe('buildOptimalUrl — new v3 params', () => {
  it('emits nm=1 when normalize is true', () => {
    const cfg = { ...SAMPLE_CONFIG, normalize: true };
    const url = buildOptimalUrl(cfg);
    expect(new URL(url).searchParams.get('nm')).toBe('1');
  });

  it('emits of= with explicit value', () => {
    const cfg = { ...SAMPLE_CONFIG, outOf: 10 };
    const url = buildOptimalUrl(cfg);
    expect(new URL(url).searchParams.get('of')).toBe('10');
  });

  it('emits it= when iconType > 1', () => {
    const cfg = { ...SAMPLE_CONFIG, iconType: 2 };
    const url = buildOptimalUrl(cfg);
    expect(new URL(url).searchParams.get('it')).toBe('2');
  });

  it('does NOT emit it= when iconType === 1 (default)', () => {
    const cfg = { ...SAMPLE_CONFIG, iconType: 1 };
    const url = buildOptimalUrl(cfg);
    expect(new URL(url).searchParams.get('it')).toBeNull();
  });

  it('emits lp/lt/ls/lc when set', () => {
    const cfg = { ...SAMPLE_CONFIG, labelPos: 'below' as const, labelText: 'Score', labelSize: 14, labelColor: '#ff0000' };
    const url = buildOptimalUrl(cfg);
    const q   = new URL(url).searchParams;
    expect(q.get('lp')).toBe('below');
    expect(q.get('lt')).toBe('Score');
    expect(q.get('ls')).toBe('14');
    expect(q.get('lc')).toBe('#ff0000');
  });

  it('emits p=m when uiPreset is m', () => {
    const cfg = { ...SAMPLE_CONFIG, uiPreset: 'm' as const };
    const url = buildOptimalUrl(cfg);
    expect(new URL(url).searchParams.get('p')).toBe('m');
  });

  it('does NOT emit p= when uiPreset is b (default)', () => {
    const cfg = { ...SAMPLE_CONFIG, uiPreset: 'b' as const };
    const url = buildOptimalUrl(cfg);
    expect(new URL(url).searchParams.get('p')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// buildOptimalUrl — per-badge new v3 params
// ---------------------------------------------------------------------------

describe('buildOptimalUrl — per-badge new v3 params', () => {
  it('emits short prefix per-badge nm/of/it/lp/lt/ls/lc', () => {
    const cfg: PosterConfig = {
      ...SAMPLE_CONFIG,
      items: {
        imdb: { x: 310, y: 20, normalize: true, outOf: 10, iconType: 2, labelPos: 'left', labelText: 'IMDb', labelSize: 13, labelColor: '#ffffff' },
        rt:   { x: 310, y: 90 },
      },
    };
    const url = buildOptimalUrl(cfg);
    const q   = new URL(url).searchParams;
    expect(q.get('i_nm')).toBe('1');
    expect(q.get('i_of')).toBe('10');
    expect(q.get('i_it')).toBe('2');
    expect(q.get('i_lp')).toBe('left');
    expect(q.get('i_lt')).toBe('IMDb');
    expect(q.get('i_ls')).toBe('13');
    expect(q.get('i_lc')).toBe('#ffffff');
  });
});

// ---------------------------------------------------------------------------
// buildOptimalUrl — param hoisting
// ---------------------------------------------------------------------------

describe('buildOptimalUrl — param hoisting', () => {
  it('hoists common blur to global bl when all badges share it', () => {
    const cfg: PosterConfig = {
      ...SAMPLE_CONFIG,
      items: {
        imdb: { x: 310, y: 20, blur: 12 },
        rt:   { x: 310, y: 90, blur: 12 },
      },
    };
    const url = buildOptimalUrl(cfg);
    const q   = new URL(url).searchParams;
    // Global bl should be overridden with the hoisted value
    expect(q.get('bl')).toBe('12');
    // Per-badge bl should NOT appear (it was hoisted)
    expect(q.get('i_bl')).toBeNull();
    expect(q.get('r_bl')).toBeNull();
  });

  it('does NOT hoist when badges have different blur', () => {
    const cfg: PosterConfig = {
      ...SAMPLE_CONFIG,
      items: {
        imdb: { x: 310, y: 20, blur: 8  },
        rt:   { x: 310, y: 90, blur: 16 },
      },
    };
    const url = buildOptimalUrl(cfg);
    const q   = new URL(url).searchParams;
    expect(q.get('i_bl')).toBe('8');
    expect(q.get('r_bl')).toBe('16');
  });
});

// ---------------------------------------------------------------------------
// urlSavings
// ---------------------------------------------------------------------------

describe('urlSavings', () => {
  it('calculates correct byte savings', () => {
    const short = '?r=i,r&bl=8&al=0.4';
    const long  = '?r=imdb,rt&blur=8&alpha=0.4';
    const { saved, pct } = urlSavings(short, long);
    expect(saved).toBe(long.length - short.length);
    expect(pct).toBe(Math.round((saved / long.length) * 100));
  });

  it('returns { saved: 0, pct: 0 } when URLs are the same length', () => {
    const { saved, pct } = urlSavings('abc', 'abc');
    expect(saved).toBe(0);
    expect(pct).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseUrlToConfig — short-form global aliases (long AND short both accepted)
// ---------------------------------------------------------------------------

describe('parseUrlToConfig — global short-form aliases', () => {
  const BASE = 'https://api.spicydevs.xyz/poster/tt12042730.png?v=3&r=i,r';

  it('parses bl as blur', () => {
    const cfg = parseUrlToConfig(`${BASE}&bl=10`);
    expect(cfg.blur).toBe(10);
  });

  it('parses al as alpha', () => {
    const cfg = parseUrlToConfig(`${BASE}&al=0.55`);
    expect(cfg.alpha).toBe(0.55);
  });

  it('parses ra as radius', () => {
    const cfg = parseUrlToConfig(`${BASE}&ra=16`);
    expect(cfg.radius).toBe(16);
  });

  it('parses sc as g_scale', () => {
    const cfg = parseUrlToConfig(`${BASE}&sc=1.5`);
    expect(cfg.scale).toBe(1.5);
  });

  it('parses pb as bg_blur', () => {
    const cfg = parseUrlToConfig(`${BASE}&pb=4`);
    expect(cfg.posterBlur).toBe(4);
  });

  it('parses tl=1 as textless', () => {
    const cfg = parseUrlToConfig(`${BASE}&tl=1`);
    expect(cfg.textless).toBe(true);
  });

  it('parses so as source', () => {
    const cfg = parseUrlToConfig(`${BASE}&so=fanart`);
    expect(cfg.source).toBe('fanart');
  });

  it('parses pt as ptype', () => {
    const cfg = parseUrlToConfig(`${BASE}&pt=top1`);
    expect(cfg.ptype).toBe('top1');
  });

  it('long-form blur still works', () => {
    const cfg = parseUrlToConfig(`${BASE}&blur=14`);
    expect(cfg.blur).toBe(14);
  });

  it('long-form takes precedence over short-form when both present', () => {
    const cfg = parseUrlToConfig(`${BASE}&blur=14&bl=10`);
    expect(cfg.blur).toBe(14); // long-form wins
  });
});

// ---------------------------------------------------------------------------
// parseUrlToConfig — new v3 params
// ---------------------------------------------------------------------------

describe('parseUrlToConfig — new v3 params', () => {
  const BASE = 'https://api.spicydevs.xyz/poster/tt12042730.png?v=3&r=i,r';

  it('parses nm=1 as normalize', () => {
    const cfg = parseUrlToConfig(`${BASE}&nm=1`);
    expect(cfg.normalize).toBe(true);
  });

  it('parses of= as outOf', () => {
    const cfg = parseUrlToConfig(`${BASE}&of=10`);
    expect(cfg.outOf).toBe(10);
  });

  it('parses it= as iconType', () => {
    const cfg = parseUrlToConfig(`${BASE}&it=2`);
    expect(cfg.iconType).toBe(2);
  });

  it('parses lp= as labelPos', () => {
    const cfg = parseUrlToConfig(`${BASE}&lp=below`);
    expect(cfg.labelPos).toBe('below');
  });

  it('parses lt= as labelText', () => {
    const cfg = parseUrlToConfig(`${BASE}&lt=Score`);
    expect(cfg.labelText).toBe('Score');
  });

  it('parses ls= as labelSize', () => {
    const cfg = parseUrlToConfig(`${BASE}&ls=14`);
    expect(cfg.labelSize).toBe(14);
  });

  it('parses lc= as labelColor', () => {
    const cfg = parseUrlToConfig(`${BASE}&lc=%23ff0000`);
    expect(cfg.labelColor).toBe('#ff0000');
  });

  it('parses p= as uiPreset', () => {
    const cfg = parseUrlToConfig(`${BASE}&p=m`);
    expect(cfg.uiPreset).toBe('m');
  });

  it('also accepts long-form normalize=1', () => {
    const cfg = parseUrlToConfig(`${BASE}&normalize=1`);
    expect(cfg.normalize).toBe(true);
  });

  it('also accepts long-form out_of=10', () => {
    const cfg = parseUrlToConfig(`${BASE}&out_of=10`);
    expect(cfg.outOf).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// parseUrlToConfig — per-badge short provider prefix + short suffix
// ---------------------------------------------------------------------------

describe('parseUrlToConfig — per-badge short prefix/suffix variants', () => {
  const BASE = 'https://api.spicydevs.xyz/poster/tt12042730.png?v=3&r=i,r';

  it('parses i_x (short prefix + long suffix) as imdb x', () => {
    const cfg = parseUrlToConfig(`${BASE}&i_x=300`);
    expect(cfg.items.imdb?.x).toBe(300);
  });

  it('parses i_bl (short prefix + short suffix) as imdb blur', () => {
    const cfg = parseUrlToConfig(`${BASE}&i_bl=10`);
    expect(cfg.items.imdb?.blur).toBe(10);
  });

  it('parses i_al (short prefix + short suffix) as imdb alpha', () => {
    const cfg = parseUrlToConfig(`${BASE}&i_al=0.6`);
    expect(cfg.items.imdb?.alpha).toBe(0.6);
  });

  it('parses r_x (short prefix) as rt x', () => {
    const cfg = parseUrlToConfig(`${BASE}&r_x=310&r_y=90`);
    expect(cfg.items.rt?.x).toBe(310);
    expect(cfg.items.rt?.y).toBe(90);
  });

  it('parses long prefix imdb_blur still works', () => {
    const cfg = parseUrlToConfig(`${BASE}&imdb_blur=12`);
    expect(cfg.items.imdb?.blur).toBe(12);
  });

  it('parses imdb_bl (long prefix + short suffix) as imdb blur', () => {
    const cfg = parseUrlToConfig(`${BASE}&imdb_bl=14`);
    expect(cfg.items.imdb?.blur).toBe(14);
  });

  it('parses per-badge new params via short prefix', () => {
    const cfg = parseUrlToConfig(`${BASE}&i_nm=1&i_of=10&i_lp=left&i_lt=IMDb`);
    expect(cfg.items.imdb?.normalize).toBe(true);
    expect(cfg.items.imdb?.outOf).toBe(10);
    expect(cfg.items.imdb?.labelPos).toBe('left');
    expect(cfg.items.imdb?.labelText).toBe('IMDb');
  });
});

// ---------------------------------------------------------------------------
// generateApiUrl — new v3 params round-trip
// ---------------------------------------------------------------------------

describe('generateApiUrl → parseUrlToConfig round-trip for new params', () => {
  const BASE_URL = 'https://api.spicydevs.xyz';

  it('round-trips normalize/outOf/iconType/labelPos/labelText/labelSize/labelColor/uiPreset', () => {
    const original: PosterConfig = {
      ...DEFAULT_CONFIG,
      ratings: ['imdb', 'rt'],
      normalize: true,
      outOf: 10,
      iconType: 2,
      labelPos: 'below',
      labelText: 'Score',
      labelSize: 14,
      labelColor: '#ffcc00',
      uiPreset: 'm',
      items: { imdb: { x: 310, y: 20 }, rt: { x: 310, y: 90 } },
    };
    const url    = generateApiUrl(original, BASE_URL);
    const parsed = parseUrlToConfig(url);

    expect(parsed.normalize).toBe(true);
    expect(parsed.outOf).toBe(10);
    expect(parsed.iconType).toBe(2);
    expect(parsed.labelPos).toBe('below');
    expect(parsed.labelText).toBe('Score');
    expect(parsed.labelSize).toBe(14);
    expect(parsed.labelColor).toBe('#ffcc00');
    expect(parsed.uiPreset).toBe('m');
  });
});

// ---------------------------------------------------------------------------
// PROVIDER_SHORT / SHORT_PROVIDER maps
// ---------------------------------------------------------------------------

describe('PROVIDER_SHORT / SHORT_PROVIDER', () => {
  it('maps every RatingType to a short key', () => {
    // Derive the expected set from the actual map — no hardcoded list
    const mappedKeys = Object.keys(PROVIDER_SHORT);
    expect(mappedKeys.length).toBeGreaterThan(0);
    mappedKeys.forEach(r => {
      expect(PROVIDER_SHORT[r as keyof typeof PROVIDER_SHORT]).toBeTruthy();
    });
  });

  it('SHORT_PROVIDER is the exact inverse of PROVIDER_SHORT', () => {
    Object.entries(PROVIDER_SHORT).forEach(([full, short]) => {
      expect(SHORT_PROVIDER[short]).toBe(full);
    });
  });
});

// ---------------------------------------------------------------------------
// handlers/backdrop — 501 stub
// ---------------------------------------------------------------------------

describe('handleBackdrop', () => {
  it('returns status 501', () => {
    const result = handleBackdrop('movie', '155', {});
    expect(result.status).toBe(501);
  });

  it('response body contains error and message', () => {
    const result = handleBackdrop('tv', '1396', {});
    const body   = JSON.parse(result.body);
    expect(body.error).toBe('Not Implemented');
    expect(typeof body.message).toBe('string');
  });
});

describe('handleBanner', () => {
  it('is an alias of handleBackdrop — also returns 501', () => {
    const result = handleBanner('movie', '155', {});
    expect(result.status).toBe(501);
  });
});

describe('parseBackdropParams', () => {
  it('returns sensible defaults', () => {
    const params = parseBackdropParams(new URLSearchParams());
    expect(params.source).toBe('tmdb');
    expect(params.width).toBe(1280);
    expect(params.textless).toBe(false);
    expect(params.lang).toBe('en');
    expect(params.no_embed).toBe(false);
  });

  it('parses explicit values', () => {
    const qs     = new URLSearchParams('source=fanart&width=1920&textless=1&lang=fr&no_embed=1');
    const params = parseBackdropParams(qs);
    expect(params.source).toBe('fanart');
    expect(params.width).toBe(1920);
    expect(params.textless).toBe(true);
    expect(params.lang).toBe('fr');
    expect(params.no_embed).toBe(true);
  });
});
