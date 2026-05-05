// src/components/admin/TestBenchmark.tsx
// v2 — client-side benchmark with rendered poster image display
//      Tests each node with 3 modes: GET ?url=, POST URL-SVG, POST B64-SVG
//      HTTP nodes (Spaceify) are skipped due to browser mixed-content policy.

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import MainNavbar from '@/components/shared/MainNavbar';
import { AmberTag } from '@/components/shared/primitives';

const API_BASE   = 'https://api.spicydevs.xyz';
const TIMEOUT_MS = 14_000;

const CH = {
  amber: '#c47c2e', gold: '#d4a245', cream: '#f0e6cc',
  green: '#4ade80', red: '#f87171', orange: '#fb923c',
  yellow: '#facc15', blue: '#60a5fa', purple: '#a78bfa',
  teal: '#2dd4bf', ghost: 'rgba(140,130,112,0.45)',
};

// ── Node registry ─────────────────────────────────────────────────────────────
const NODES = [
  { id: 'washington', label: 'US East',  url: 'https://us-r-vercel.vercel.app',       path: '/api/rasterize', tier: 1, tag: 'vercel',   region: 'Virginia, US',  health: true,  http: false },
  { id: 'london',     label: 'London',   url: 'https://uk-r-vercel.vercel.app',       path: '/api/rasterize', tier: 1, tag: 'vercel',   region: 'London, UK',    health: true,  http: false },
  { id: 'tokyo',      label: 'Tokyo',    url: 'https://jp-r-vercel.vercel.app',       path: '/api/rasterize', tier: 1, tag: 'vercel',   region: 'Tokyo, JP',     health: true,  http: false },
  { id: 'mumbai',     label: 'Mumbai',   url: 'https://rasterize-node.vercel.app',   path: '/api/rasterize', tier: 1, tag: 'vercel',   region: 'Mumbai, IN',    health: true,  http: false },
  { id: 'ohio',       label: 'Ohio',     url: 'https://r-netlify.netlify.app',        path: '/api/rasterize', tier: 1, tag: 'netlify',  region: 'Ohio, US',      health: true,  http: false },
  { id: 'france',     label: 'FR 1',     url: 'http://fr1.spaceify.eu:25980',        path: '',               tier: 2, tag: 'spaceify', region: 'France',         health: false, http: true  },
  { id: 'germany',    label: 'DE 20',    url: 'http://de20.spaceify.eu:26100',       path: '',               tier: 2, tag: 'spaceify', region: 'Germany',        health: false, http: true  },
  { id: 'cf_worker',  label: 'Simple',   url: 'https://r-cf.spicydevs.xyz',          path: '',               tier: 3, tag: 'worker',   region: 'Global (WASM)', health: false, http: false },
  { id: 'render_eu',  label: 'EUC',      url: 'https://euc-r-render.onrender.com',   path: '',               tier: 3, tag: 'render',   region: 'EU Central',    health: true,  http: false },
] as const;

const EXAMPLES = [
  { label: 'Inception',       type: 'movie', id: 'tt1375666',  params: 'r=imdb,rt' },
  { label: 'Breaking Bad',    type: 'tv',    id: 'tt0903747',  params: 'r=imdb,tmdb' },
  { label: 'Attack on Titan', type: 'anime', id: '16498',      params: 'r=mal,anilist' },
  { label: 'Dune: Part Two',  type: 'movie', id: 'tt15239678', params: 'r=imdb,rt,age' },
  { label: 'The Bear',        type: 'tv',    id: '136315',      params: 'r=imdb,tmdb,rt' },
];

const TIER_META: Record<number, { label: string; color: string }> = {
  1: { label: 'Serverless', color: '#2dd4bf' },
  2: { label: 'Dedicated',  color: '#60a5fa' },
  3: { label: 'Legacy',     color: 'rgba(140,130,112,0.45)' },
};
const TAG_COLOR: Record<string, string> = {
  vercel: CH.blue, netlify: CH.purple, spaceify: CH.teal, render: CH.orange, worker: CH.yellow,
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface FetchResult { ok: boolean; ms: number; status: number; note: string; imageUrl: string | null }
interface NodeResult extends Omit<(typeof NODES)[number], 'health'> {
  health: Record<string, any> | null;
  getUrl:  FetchResult;  // GET ?url=svgUrlRef (node fetches SVG)
  postUrl: FetchResult;  // POST URL-reference SVG body
  postB64: FetchResult;  // POST base64-embedded SVG body
}
interface Benchmark {
  inputType: string; rawId: string; queryParams: string; format: string;
  svgUrlRef: string; svgUrlB64: string;
  urlKb: number; b64Kb: number;
  nodes: NodeResult[];
  wsrv: FetchResult;
  summary: { fastestMs: number | null; fastestLabel: string | null; successCount: number };
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMs = (ms: number | null) =>
  ms == null || ms <= 0 ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

const msColor = (ms: number | null) => {
  if (!ms) return CH.ghost;
  if (ms < 500)  return CH.green;
  if (ms < 1200) return CH.yellow;
  if (ms < 3000) return CH.orange;
  return CH.red;
};

const STEPS = [
  'Fetching SVG variants from API…',
  'Testing all nodes: GET · POST URL-SVG · POST B64-SVG…',
  'Testing wsrv.nl…',
  'Fetching node health…',
];

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function fetchWithImage(url: string, opts: RequestInit = {}): Promise<FetchResult> {
  const t0 = performance.now();
  try {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(url, { ...opts, signal: ac.signal });
    clearTimeout(tm);
    const ms = Math.round(performance.now() - t0);
    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      return { ok: false, ms, status: res.status, note: `HTTP ${res.status}`, imageUrl: null };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      const txt = await res.text();
      return { ok: false, ms, status: res.status, note: `Non-image (${ct}): ${txt.slice(0, 60)}`, imageUrl: null };
    }
    const buf = await res.arrayBuffer();
    return { ok: true, ms, status: res.status, note: '', imageUrl: URL.createObjectURL(new Blob([buf], { type: ct })) };
  } catch (e: any) {
    return { ok: false, ms: Math.round(performance.now() - t0), status: 0,
      note: e.name === 'AbortError' ? `Timeout ${TIMEOUT_MS}ms` : e.message, imageUrl: null };
  }
}

const SKIPPED: FetchResult = { ok: false, ms: 0, status: 0, note: 'HTTP — browser mixed-content block', imageUrl: null };

async function benchNode(
  node: typeof NODES[number],
  urlSvg: string, b64Svg: string, svgUrlRef: string, format: string,
): Promise<NodeResult> {
  if (node.http) return { ...node, health: null, getUrl: SKIPPED, postUrl: SKIPPED, postB64: SKIPPED };

  const base = `${node.url}${node.path}?format=${format}`;
  const headers = { 'Content-Type': 'image/svg+xml', 'X-Format': format };

  const [getUrl, postUrl, postB64, health] = await Promise.all([
    fetchWithImage(`${node.url}${node.path}?format=${format}&url=${encodeURIComponent(svgUrlRef)}`),
    urlSvg ? fetchWithImage(base, { method: 'POST', body: urlSvg,  headers }) : Promise.resolve({ ...SKIPPED, note: 'SVG unavailable' }),
    b64Svg ? fetchWithImage(base, { method: 'POST', body: b64Svg, headers }) : Promise.resolve({ ...SKIPPED, note: 'SVG unavailable' }),
    node.health ? fetch(`${node.url}/health`, { signal: AbortSignal.timeout(3_000) })
        .then(r => r.ok ? r.json() : null).catch(() => null)
      : Promise.resolve(null),
  ]);

  return { ...node, health, getUrl, postUrl, postB64 };
}

async function runBenchmark(
  inputType: string, rawId: string, params: string, format: string,
  onStep: (s: string) => void,
): Promise<Benchmark> {
  const cb = Date.now();
  const qs = `${params ? params + '&' : ''}cb=${cb}`;
  const svgUrlRef = `${API_BASE}/${inputType}/${rawId}.svg?${qs}&no_embed=1`;
  const svgUrlB64 = `${API_BASE}/${inputType}/${rawId}.svg?${qs}`;

  onStep(STEPS[0]);
  const [urlRes, b64Res] = await Promise.all([
    fetch(svgUrlRef, { signal: AbortSignal.timeout(8_000) }).catch(() => null),
    fetch(svgUrlB64, { signal: AbortSignal.timeout(8_000) }).catch(() => null),
  ]);
  const urlSvg = urlRes?.ok ? await urlRes.text() : '';
  const b64Svg = b64Res?.ok ? await b64Res.text() : '';
  const urlKb  = urlSvg ? Math.round(new Blob([urlSvg]).size / 1024) : 0;
  const b64Kb  = b64Svg ? Math.round(new Blob([b64Svg]).size / 1024) : 0;

  onStep(STEPS[1]);
  const nodes = await Promise.all(NODES.map(n => benchNode(n, urlSvg, b64Svg, svgUrlRef, format)));

  onStep(STEPS[2]);
  const wsrv = await fetchWithImage(`https://wsrv.nl/?url=${encodeURIComponent(svgUrlRef)}&output=${format === 'webp' ? 'webp' : 'png'}&q=100`);

  const allMs = nodes.flatMap(n => [n.getUrl, n.postUrl, n.postB64].filter(r => r.ok).map(r => r.ms));
  const fastestMs = allMs.length ? Math.min(...allMs) : null;
  const fastestLabel = fastestMs != null
    ? (nodes.find(n => [n.getUrl, n.postUrl, n.postB64].some(r => r.ok && r.ms === fastestMs))?.label ?? null)
    : null;

  return {
    inputType, rawId, queryParams: params, format,
    svgUrlRef, svgUrlB64: svgUrlB64.replace(`&cb=${cb}`, ''),
    urlKb, b64Kb, nodes, wsrv,
    summary: { fastestMs, fastestLabel, successCount: nodes.filter(n => !n.http && (n.getUrl.ok || n.postUrl.ok || n.postB64.ok)).length },
    timestamp: new Date().toISOString(),
  };
}

// ── UI Components ─────────────────────────────────────────────────────────────

const FilmTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--film-dark)', border: '1px solid var(--film-border)', borderRadius: 8, padding: '8px 12px', fontFamily: 'JetBrains Mono,monospace', fontSize: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
      <div style={{ color: CH.amber, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? CH.cream }}>{p.name}: {p.value != null ? `${p.value}ms` : '—'}</div>
      ))}
    </div>
  );
};

type Mode = 'getUrl' | 'postUrl' | 'postB64';
const MODE_META: { key: Mode; label: string; sub: string }[] = [
  { key: 'getUrl',  label: 'GET',  sub: '?url=' },
  { key: 'postUrl', label: 'POST', sub: 'URL-SVG' },
  { key: 'postB64', label: 'POST', sub: 'B64-SVG' },
];

const NodeCard: React.FC<{ result: NodeResult; fastestMs: number | null }> = ({ result, fastestMs }) => {
  const bestMode: Mode = (['getUrl', 'postUrl', 'postB64'] as Mode[])
    .filter(k => result[k].ok)
    .sort((a, b) => result[a].ms - result[b].ms)[0] ?? 'getUrl';
  const [mode, setMode] = useState<Mode>(bestMode);
  const active = result[mode];
  const isFastest = active.ok && fastestMs !== null && active.ms === fastestMs;
  const tagC = TAG_COLOR[result.tag] ?? CH.ghost;
  const tierC = TIER_META[result.tier]?.color ?? CH.ghost;

  return (
    <div style={{ background: 'var(--film-char)', border: `1px solid ${isFastest ? 'rgba(196,124,46,0.35)' : 'var(--film-border)'}`, borderLeft: `3px solid ${result.http ? CH.ghost : active.ok ? tagC : 'rgba(248,113,113,0.4)'}`, borderRadius: 8, overflow: 'hidden', opacity: result.http ? 0.5 : 1 }}>
      {/* Header */}
      <div style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: 'var(--film-cream)' }}>{result.label}</div>
          <div style={{ fontSize: 7, color: CH.ghost, fontFamily: 'JetBrains Mono,monospace', marginTop: 1 }}>{result.region}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isFastest && <span style={{ fontSize: 7, fontWeight: 700, color: CH.gold, background: 'rgba(196,124,46,0.12)', border: '1px solid rgba(196,124,46,0.25)', borderRadius: 3, padding: '2px 5px' }}>⚡</span>}
          <span style={{ fontSize: 7, fontWeight: 700, color: tierC, background: `${tierC}1a`, border: `1px solid ${tierC}30`, borderRadius: 3, padding: '2px 5px' }}>T{result.tier}</span>
        </div>
      </div>

      {/* Mode tabs */}
      {!result.http && (
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {MODE_META.map(({ key, label, sub }) => {
            const r = result[key];
            const isActive = mode === key;
            return (
              <button key={key} onClick={() => setMode(key)}
                style={{ flex: 1, padding: '5px 2px', background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent', border: 'none', borderRight: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: isActive ? 'var(--film-cream)' : CH.ghost, fontFamily: 'JetBrains Mono,monospace', boxShadow: isActive ? `inset 0 -2px 0 ${r.ok ? msColor(r.ms) : CH.red}` : 'none', transition: 'background 0.15s' }}>
                <div style={{ fontSize: 8, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 7, opacity: 0.7 }}>{sub}</div>
                <div style={{ fontSize: 8, color: r.ok ? msColor(r.ms) : CH.red, fontWeight: 700 }}>{r.ok ? `${r.ms}ms` : '✗'}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Poster image */}
      <div style={{ background: '#050504', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
        {result.http ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: CH.ghost, lineHeight: 1.6 }}>HTTP node<br/>browser blocked</div>
        ) : active.imageUrl ? (
          <>
            <img src={active.imageUrl} alt={result.label} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'contain', display: 'block', maxHeight: 220 }} />
            <div style={{ position: 'absolute', bottom: 5, right: 5, fontFamily: 'JetBrains Mono,monospace', fontSize: 9, fontWeight: 700, color: msColor(active.ms), background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: 3 }}>
              {active.ms}ms
            </div>
          </>
        ) : (
          <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: CH.red, lineHeight: 1.6 }}>
            ✗ {active.note.slice(0, 55)}
          </div>
        )}
      </div>

      {/* Health strip */}
      {result.health && (
        <div style={{ padding: '5px 10px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { l: 'active', v: result.health.activeJobs ?? '—', c: result.health.activeJobs > 0 ? CH.yellow : CH.ghost },
            { l: 'queue',  v: result.health.queuedJobs ?? '—', c: result.health.queuedJobs > 0 ? CH.orange : CH.ghost },
            { l: 'icons',  v: result.health.iconCache?.loaded ? `✓${result.health.iconCache.iconCount}` : '✗', c: result.health.iconCache?.loaded ? CH.green : CH.red },
            { l: 'font',   v: result.health.fontDefault ? '✓' : '—', c: result.health.fontDefault ? CH.green : CH.ghost },
          ].map(({ l, v, c }) => (
            <span key={l} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost }}>{l}: <span style={{ color: c }}>{String(v)}</span></span>
          ))}
        </div>
      )}
    </div>
  );
};

const RecommendationPanel: React.FC<{ bench: Benchmark }> = ({ bench }) => {
  const active = bench.nodes.filter(n => !n.http);

  const ranked = active
    .map(n => {
      const best = (['getUrl', 'postUrl', 'postB64'] as Mode[])
        .filter(k => n[k].ok)
        .sort((a, b) => n[a].ms - n[b].ms)[0];
      return best ? { label: n.label, mode: MODE_META.find(m => m.key === best)!, ms: n[best].ms } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a!.ms - b!.ms) as { label: string; mode: typeof MODE_META[number]; ms: number }[];

  const getVsPost = active
    .filter(n => n.getUrl.ok && n.postUrl.ok)
    .map(n => ({ label: n.label, delta: n.postUrl.ms - n.getUrl.ms }))
    .sort((a, b) => b.delta - a.delta);

  const b64Penalty = active
    .filter(n => n.postUrl.ok && n.postB64.ok)
    .map(n => n.postB64.ms - n.postUrl.ms);
  const avgB64Penalty = b64Penalty.length ? Math.round(b64Penalty.reduce((a, b) => a + b, 0) / b64Penalty.length) : null;
  const overhead = bench.b64Kb - bench.urlKb;

  return (
    <div style={{ padding: 14, background: 'rgba(196,124,46,0.04)', border: '1px solid rgba(196,124,46,0.15)', borderRadius: 10 }}>
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: CH.amber, marginBottom: 12 }}>Analysis & Recommendations</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: 10 }}>
        {/* Top 3 nodes */}
        {ranked.slice(0, 3).map((n, i) => (
          <div key={n.label} style={{ padding: '10px 12px', background: 'var(--film-char)', borderRadius: 7, borderLeft: `3px solid ${i === 0 ? CH.gold : i === 1 ? 'rgba(196,124,46,0.5)' : CH.ghost}` }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, marginBottom: 3 }}>#{i + 1} FASTEST</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 700, color: 'var(--film-cream)' }}>{n.label}</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: msColor(n.ms), marginTop: 2 }}>{n.mode.label} {n.mode.sub}: {n.ms}ms</div>
          </div>
        ))}

        {/* Payload size */}
        <div style={{ padding: '10px 12px', background: 'var(--film-char)', borderRadius: 7, borderLeft: `3px solid ${CH.teal}` }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, marginBottom: 3 }}>PAYLOAD SIZE</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: 'var(--film-cream)', lineHeight: 1.7 }}>
            URL-SVG: <span style={{ color: CH.green }}>{bench.urlKb}KB</span><br />
            B64-SVG: <span style={{ color: CH.orange }}>{bench.b64Kb}KB</span>{overhead > 0 && ` (+${overhead}KB)`}
          </div>
          {avgB64Penalty !== null && (
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: avgB64Penalty > 100 ? CH.orange : CH.ghost, marginTop: 4 }}>
              B64 adds avg +{avgB64Penalty}ms
            </div>
          )}
        </div>

        {/* GET advantage */}
        {getVsPost.length > 0 && (
          <div style={{ padding: '10px 12px', background: 'var(--film-char)', borderRadius: 7, borderLeft: `3px solid ${CH.green}` }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, marginBottom: 3 }}>GET vs POST ADVANTAGE</div>
            {getVsPost.slice(0, 2).map(n => (
              <div key={n.label} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: n.delta > 0 ? CH.green : CH.red, lineHeight: 1.7 }}>
                {n.label}: {n.delta > 0 ? `-${n.delta}ms` : `+${Math.abs(n.delta)}ms`} via GET
              </div>
            ))}
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, marginTop: 3 }}>
              {getVsPost[0]?.delta > 0 ? 'Prefer GET for URL-payload capable nodes' : 'POST is competitive for this poster'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TimingChart: React.FC<{ bench: Benchmark }> = ({ bench }) => {
  const data = bench.nodes
    .filter(n => !n.http)
    .map(n => ({
      label: n.label.split(' ')[0],
      GET:     n.getUrl.ok  ? n.getUrl.ms  : null,
      PostURL: n.postUrl.ok ? n.postUrl.ms : null,
      PostB64: n.postB64.ok ? n.postB64.ms : null,
    }))
    .sort((a, b) => Math.min(a.GET ?? Infinity, a.PostURL ?? Infinity, a.PostB64 ?? Infinity) - Math.min(b.GET ?? Infinity, b.PostURL ?? Infinity, b.PostB64 ?? Infinity));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={48} tickFormatter={v => `${v}ms`} />
        <Tooltip content={<FilmTip />} />
        <Bar dataKey="GET"     name="GET"      fill={CH.green}  radius={[2, 2, 0, 0]} opacity={0.8} />
        <Bar dataKey="PostURL" name="POST URL" fill={CH.blue}   radius={[2, 2, 0, 0]} opacity={0.8} />
        <Bar dataKey="PostB64" name="POST B64" fill={CH.orange} radius={[2, 2, 0, 0]} opacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ── Detailed log table ────────────────────────────────────────────────────────
const LogTable: React.FC<{ bench: Benchmark }> = ({ bench }) => {
  const rows = bench.nodes.map(n => [
    { mode: 'GET ?url=',  ...n.getUrl  },
    { mode: 'POST URL-SVG', ...n.postUrl },
    { mode: 'POST B64-SVG', ...n.postB64 },
  ].map(r => ({ node: n.label, tier: n.tier, http: n.http, ...r }))).flat();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
        <thead>
          <tr style={{ background: 'var(--film-mid)' }}>
            {['Node', 'Mode', 'Status', 'Time', 'Note'].map(h => (
              <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 7, color: CH.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.025)', opacity: r.http ? 0.4 : 1 }}>
              <td style={{ padding: '5px 12px', color: 'var(--film-cream)', fontWeight: 600 }}>{r.node}</td>
              <td style={{ padding: '5px 12px', color: CH.ghost }}>{r.mode}</td>
              <td style={{ padding: '5px 12px' }}>
                <span style={{ color: r.http ? CH.ghost : r.ok ? CH.green : CH.red, fontWeight: 700 }}>
                  {r.http ? 'SKIPPED' : r.ok ? '✓ OK' : '✗ FAIL'}
                </span>
              </td>
              <td style={{ padding: '5px 12px', color: r.ok ? msColor(r.ms) : CH.ghost, fontWeight: r.ok ? 700 : 400 }}>
                {r.ok ? `${r.ms}ms` : '—'}
              </td>
              <td style={{ padding: '5px 12px', color: CH.ghost, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {r.note || (r.ok ? `HTTP ${r.status}` : '')}
              </td>
            </tr>
          ))}
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(45,212,191,0.03)' }}>
            <td style={{ padding: '5px 12px', color: 'var(--film-cream)', fontWeight: 600 }}>wsrv.nl</td>
            <td style={{ padding: '5px 12px', color: CH.ghost }}>GET ?url= (librsvg)</td>
            <td style={{ padding: '5px 12px' }}><span style={{ color: bench.wsrv.ok ? CH.green : CH.red, fontWeight: 700 }}>{bench.wsrv.ok ? '✓ OK' : '✗ FAIL'}</span></td>
            <td style={{ padding: '5px 12px', color: bench.wsrv.ok ? msColor(bench.wsrv.ms) : CH.ghost, fontWeight: bench.wsrv.ok ? 700 : 400 }}>{bench.wsrv.ok ? `${bench.wsrv.ms}ms` : '—'}</td>
            <td style={{ padding: '5px 12px', color: CH.ghost }}>{bench.wsrv.note}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ── Loading ───────────────────────────────────────────────────────────────────
const LoadingView: React.FC<{ type: string; id: string; step: string }> = ({ type, id, step }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', border: '1px dashed rgba(196,124,46,0.3)', borderRadius: 12, marginTop: 24, background: 'rgba(196,124,46,0.02)' }}>
    <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.07)', borderTopColor: CH.amber, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 20 }} />
    <div className="poster-font" style={{ fontSize: 20, color: CH.amber, letterSpacing: '0.06em', marginBottom: 14 }}>{type}/{id}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
      {STEPS.map((s, i) => {
        const cur = STEPS.indexOf(step);
        return (
          <div key={s} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, transition: 'color 0.3s', color: i < cur ? CH.green : s === step ? CH.cream : CH.ghost }}>
            {i < cur ? '✓ ' : s === step ? '› ' : '  '}{s}
          </div>
        );
      })}
    </div>
  </div>
);

// ── Search form ───────────────────────────────────────────────────────────────
const SearchForm: React.FC<{ onRun: (t: string, i: string, p: string, f: string) => void }> = ({ onRun }) => {
  const [type, setType] = useState('movie');
  const [id, setId]     = useState('');
  const [params, setParams] = useState('r=imdb,rt');
  const [format, setFormat] = useState('png');

  const run = () => id.trim() && onRun(type, id.trim(), params.trim(), format);
  const base: React.CSSProperties = { width: '100%', height: 38, padding: '0 12px', background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'var(--film-cream)', fontSize: 12, fontFamily: 'JetBrains Mono,monospace', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px', gap: 10 }}>
        {[
          { label: 'Type', el: <select value={type} onChange={e => setType(e.target.value)} style={{ ...base, cursor: 'pointer' }}>{['movie', 'tv', 'anime', 'poster'].map(t => <option key={t} value={t}>{t}</option>)}</select> },
          { label: 'ID (TMDB / IMDb / MAL)', el: <input value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} placeholder="e.g. tt1375666" style={base} /> },
          { label: 'Format', el: <select value={format} onChange={e => setFormat(e.target.value)} style={{ ...base, cursor: 'pointer' }}>{['png', 'webp', 'jpg'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}</select> },
        ].map(({ label, el }) => (
          <div key={label}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>{label}</div>
            {el}
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Query params</div>
        <input value={params} onChange={e => setParams(e.target.value)} placeholder="r=imdb,rt&source=fanart" style={base} />
      </div>
      <button onClick={run} disabled={!id.trim()} style={{ height: 42, background: `linear-gradient(90deg,${CH.amber},${CH.gold})`, color: '#070706', border: 'none', borderRadius: 8, cursor: id.trim() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 800, fontFamily: 'Syne,sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase' as const, opacity: id.trim() ? 1 : 0.5 }}>
        Run Benchmark
      </button>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {EXAMPLES.map(ex => (
          <button key={ex.id} onClick={() => { setType(ex.type); setId(ex.id); setParams(ex.params); }}
            style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: CH.ghost, fontSize: 9, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Results ───────────────────────────────────────────────────────────────────
const ResultsView: React.FC<{ bench: Benchmark; onBack: () => void; onRerun: () => void }> = ({ bench, onBack, onRerun }) => {
  const tierGroups = useMemo(() => {
    const g: Record<number, NodeResult[]> = {};
    bench.nodes.forEach(n => { if (!g[n.tier]) g[n.tier] = []; g[n.tier].push(n); });
    return Object.entries(g).sort(([a], [b]) => Number(a) - Number(b));
  }, [bench]);

  const [logExpanded, setLogExpanded] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={onBack} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: CH.ghost, fontSize: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}>← Back</button>
        <div className="poster-font" style={{ fontSize: 18, color: CH.amber, letterSpacing: '0.06em' }}>{bench.inputType}/{bench.rawId}</div>
        {bench.queryParams && <code style={{ fontSize: 9, color: CH.ghost, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px' }}>?{bench.queryParams}</code>}
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: CH.ghost, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px' }}>{bench.format.toUpperCase()}</span>
        <button onClick={onRerun} style={{ marginLeft: 'auto', padding: '5px 12px', background: CH.amber, border: 'none', borderRadius: 6, color: '#070706', fontSize: 10, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>↻ Re-run</button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
        {[
          { l: 'Fastest',      v: fmtMs(bench.summary.fastestMs),       c: msColor(bench.summary.fastestMs) },
          { l: 'Best Node',    v: bench.summary.fastestLabel ?? '—',     c: CH.gold },
          { l: 'Nodes OK',     v: `${bench.summary.successCount}/${NODES.filter(n => !n.http).length}`, c: CH.cream },
          { l: 'URL-SVG Size', v: bench.urlKb ? `${bench.urlKb}KB` : '—', c: CH.green },
          { l: 'B64-SVG Size', v: bench.b64Kb ? `${bench.b64Kb}KB` : '—', c: CH.orange },
          { l: 'wsrv.nl',      v: bench.wsrv.ok ? fmtMs(bench.wsrv.ms) : '✗', c: bench.wsrv.ok ? msColor(bench.wsrv.ms) : CH.red },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ padding: '10px 12px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 5 }}>{l}</div>
            <div className="poster-font" style={{ fontSize: 22, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <RecommendationPanel bench={bench} />

      {/* Timing chart */}
      <div style={{ background: 'var(--film-mid)', border: '1px solid var(--film-border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'Syne,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: CH.amber, display: 'flex', gap: 10, alignItems: 'center' }}>
          Render Timing
          {[{k: 'GET', c: CH.green}, {k: 'POST URL-SVG', c: CH.blue}, {k: 'POST B64-SVG', c: CH.orange}].map(({k, c}) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, color: CH.ghost, fontWeight: 400, letterSpacing: 0, textTransform: 'none' as const }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: 'inline-block' }} />{k}
            </span>
          ))}
        </div>
        <div style={{ padding: 14 }}>
          <TimingChart bench={bench} />
        </div>
      </div>

      {/* Node cards by tier */}
      {tierGroups.map(([tier, nodes]) => (
        <div key={tier}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: TIER_META[Number(tier)]?.color ?? CH.ghost, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, alignItems: 'center', fontFamily: 'JetBrains Mono,monospace' }}>
            {TIER_META[Number(tier)]?.label ?? `Tier ${tier}`}
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 7 }}>·</span>
            {nodes.filter(n => !n.http).length} testable
            {nodes.filter(n => n.http).length > 0 && <><span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 7 }}>·</span><span style={{ color: CH.ghost }}>{nodes.filter(n => n.http).length} skipped (HTTP)</span></>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(185px,1fr))', gap: 10 }}>
            {nodes.map(n => <NodeCard key={n.id} result={n} fastestMs={bench.summary.fastestMs} />)}
          </div>
        </div>
      ))}

      {/* wsrv card */}
      {bench.wsrv.imageUrl && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: CH.ghost, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: 'JetBrains Mono,monospace' }}>Third-party · wsrv.nl (librsvg)</div>
          <div style={{ maxWidth: 200, background: 'var(--film-char)', border: '1px solid var(--film-border)', borderLeft: `3px solid ${CH.teal}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '9px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: 'var(--film-cream)' }}>wsrv.nl</span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, color: msColor(bench.wsrv.ms) }}>{bench.wsrv.ms}ms</span>
            </div>
            <img src={bench.wsrv.imageUrl} alt="wsrv" style={{ width: '100%', display: 'block' }} />
          </div>
        </div>
      )}

      {/* Detail log */}
      <div style={{ background: 'var(--film-mid)', border: '1px solid var(--film-border)', borderRadius: 10, overflow: 'hidden' }}>
        <button onClick={() => setLogExpanded(v => !v)} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' as const }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: CH.amber }}>Full Timing Log</span>
          <span style={{ color: CH.ghost, fontSize: 10 }}>{logExpanded ? '▲' : '▼'}</span>
        </button>
        {logExpanded && <LogTable bench={bench} />}
      </div>

      {/* SVG URLs */}
      <div style={{ padding: 14, background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'URL-SVG (no_embed=1)', href: bench.svgUrlRef },
          { label: 'B64-SVG (embedded)', href: bench.svgUrlB64 },
        ].map(({ label, href }) => (
          <div key={label}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
            <a href={href} target="_blank" rel="noreferrer" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: CH.amber, wordBreak: 'break-all' as const, textDecoration: 'none', lineHeight: 1.6 }}>{href}</a>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost }}>
        Completed {new Date(bench.timestamp).toLocaleTimeString()} · client-side via performance.now() · blob images auto-revoked on next run
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TestBenchmark() {
  const [mode, setMode]     = useState<'search' | 'loading' | 'results'>('search');
  const [bench, setBench]   = useState<Benchmark | null>(null);
  const [step, setStep]     = useState('');
  const [error, setError]   = useState('');
  const [lastRun, setLastRun] = useState<{ type: string; id: string; params: string; format: string } | null>(null);
  const blobUrls = useRef<string[]>([]);

  const cleanupBlobs = useCallback(() => {
    blobUrls.current.forEach(u => URL.revokeObjectURL(u));
    blobUrls.current = [];
  }, []);

  useEffect(() => () => cleanupBlobs(), [cleanupBlobs]);

  const go = useCallback(async (type: string, id: string, params: string, format: string) => {
    cleanupBlobs();
    setMode('loading'); setError(''); setBench(null); setLastRun({ type, id, params, format });
    try {
      const result = await runBenchmark(type, id, params, format, setStep);
      // Collect blob URLs for cleanup
      blobUrls.current = [
        ...result.nodes.flatMap(n => [n.getUrl.imageUrl, n.postUrl.imageUrl, n.postB64.imageUrl]),
        result.wsrv.imageUrl,
      ].filter(Boolean) as string[];
      setBench(result);
      setMode('results');
    } catch (e: any) {
      setError(e.message ?? 'Benchmark failed');
      setMode('search');
    }
  }, [cleanupBlobs]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)', paddingTop: 56 }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}} .recharts-text{font-family:'JetBrains Mono',monospace!important;font-size:9px!important;fill:rgba(140,130,112,0.45)!important}`}</style>
      <MainNavbar fixed compactLogo />

      <div style={{ position: 'sticky', top: 56, zIndex: 40, background: 'rgba(7,7,6,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--film-border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="poster-font" style={{ fontSize: 15, color: CH.amber, letterSpacing: '0.06em' }}>Rasterizer Benchmark</div>
        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost }}>
          {mode === 'loading' ? `TESTING · ${lastRun?.type}/${lastRun?.id}` : mode === 'results' ? `RESULTS · GET + POST URL + POST B64` : 'READY · client-side · image display'}
        </span>
      </div>

      <main style={{ padding: 16, maxWidth: 1280, margin: '0 auto' }}>
        {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', color: CH.red, fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>✕ {error}</div>}

        {mode === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <AmberTag style={{ marginBottom: 8 }}>Client-Side Node Benchmark v2</AmberTag>
              <p className="body-font" style={{ fontSize: 13, color: 'var(--film-text-dim)', maxWidth: 560, lineHeight: 1.7 }}>
                Tests each rasterizer with 3 modes: <strong>GET ?url=</strong> (node fetches SVG), <strong>POST URL-SVG</strong> (URL-reference poster), <strong>POST B64-SVG</strong> (embedded poster). Shows rendered output for visual comparison. HTTP nodes are skipped (browser mixed-content policy).
              </p>
            </div>
            <SearchForm onRun={go} />
          </div>
        )}
        {mode === 'loading' && lastRun && <LoadingView type={lastRun.type} id={lastRun.id} step={step} />}

        {mode === 'results' && bench && (
          <ResultsView
            bench={bench}
            onBack={() => { setMode('search'); setBench(null); }}
            onRerun={() => lastRun && go(lastRun.type, lastRun.id, lastRun.params, lastRun.format)}
          />
        )}
      </main>
    </div>
  );
}