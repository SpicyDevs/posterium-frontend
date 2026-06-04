// src/components/admin/TestBenchmark.tsx
// v5 — Expanded benchmark suite:
//   • Response size (KB) tracked on every fetch
//   • SVG Inspector — dimensions, element count, image embeds, complexity score
//   • Format Comparison tab — PNG / WebP / JPG side-by-side on winner node
//   • Concurrent Burst test — N parallel requests with waterfall timing
//   • Multi-run mode — 3× per node, min/avg/max statistics
//   • Mobile-responsive search form, scrollable tables, full mobile CSS
//   • Bug fix: SummaryPanel table has proper horizontal scroll

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import MainNavbar from '@/components/shared/MainNavbar';
import { AmberTag } from '@/components/shared/primitives';

const API_BASE      = 'https://api.posterium.xyz';
const CF_PROXY_BASE = 'https://r-cf.spicydevs.xyz/proxy';
const TIMEOUT_MS    = 14_000;

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  amber: '#c47c2e', gold: '#d4a245', cream: '#f0e6cc',
  green: '#4ade80', red: '#f87171', orange: '#fb923c',
  yellow: '#facc15', blue: '#60a5fa', purple: '#a78bfa',
  teal: '#2dd4bf', pink: '#f472b6',
  ghost: 'rgba(140,130,112,0.45)', dim: 'rgba(180,168,148,0.65)',
};

// ── Node registry ─────────────────────────────────────────────────────────────
const NODES = [
  { id:'fr1',       label:'FR 1',    url:'http://fr1.spaceify.eu:25980',      path:'',               tier:2, tag:'spaceify', region:'France',        http:true,  color:'#2dd4bf' },
  { id:'de20',      label:'DE 20',   url:'http://de20.spaceify.eu:26100',     path:'',               tier:2, tag:'spaceify', region:'Germany',       http:true,  color:'#60a5fa' },
  { id:'de2',       label:'DE 2',    url:'http://node-3.midas.host:25108',    path:'',               tier:2, tag:'midas',    region:'Germany',       http:true,  color:'#4ade80' },
  { id:'euc',       label:'EUC',     url:'https://euc-r-render.onrender.com', path:'',               tier:3, tag:'render',   region:'EU Central',    http:false, color:'#fb923c' },
  { id:'usw',       label:'US East', url:'https://us-r-vercel.vercel.app',    path:'/api/rasterize', tier:1, tag:'vercel',   region:'Virginia, US',  http:false, color:'#a78bfa' },
  { id:'ohio',      label:'Ohio',    url:'https://r-netlify.netlify.app',     path:'/api/rasterize', tier:1, tag:'netlify',  region:'Ohio, US',      http:false, color:'#f472b6' },
  { id:'london',    label:'London',  url:'https://uk-r-vercel.vercel.app',    path:'/api/rasterize', tier:1, tag:'vercel',   region:'London, UK',    http:false, color:'#c47c2e' },
  { id:'cf_worker', label:'CF Edge', url:'https://r-cf.spicydevs.xyz',       path:'',               tier:0, tag:'worker',   region:'Global (WASM)', http:false, color:'#facc15' },
] as const;

const FORMATS = ['png', 'webp', 'jpg'] as const;
type FormatType = typeof FORMATS[number];

const EXAMPLES = [
  { label:'Inception',       type:'movie', id:'tt1375666',  params:'r=imdb,rt' },
  { label:'Breaking Bad',    type:'tv',    id:'tt0903747',  params:'r=imdb,tmdb' },
  { label:'Attack on Titan', type:'anime', id:'16498',       params:'r=mal,anilist' },
  { label:'Dune: Part Two',  type:'movie', id:'tt15239678', params:'r=imdb,rt,age' },
  { label:'The Bear',        type:'tv',    id:'136315',      params:'r=imdb,tmdb,rt' },
  { label:'Oppenheimer',     type:'movie', id:'tt15398776', params:'r=imdb,rt' },
  { label:'Demon Slayer',    type:'anime', id:'47778',       params:'r=mal' },
];

const BURST_SIZES = [3, 5, 10] as const;

// ── Types ─────────────────────────────────────────────────────────────────────
interface FetchResult {
  ok: boolean; ms: number; status: number; note: string;
  imageUrl: string | null; sizeKb: number | null; // sizeKb: actual response body size
}

interface HealthData {
  reachable: boolean; status?: string; version?: string; node?: string;
  activeJobs?: number; queuedJobs?: number; workerCount?: number;
  pendingRespawns?: number; uptime?: number; maxConcurrent?: number;
  fontReady?: boolean; fontDefault?: string; fontFiles?: string[];
  iconCache?: { loaded: boolean; iconCount: number; fetchedAt: number | null; ageMs: number | null; lastError: string | null; inflight: boolean };
  error?: string;
}

interface NodeResult {
  id: string; label: string; url: string; tier: number; tag: string;
  region: string; http: boolean; color: string;
  health: HealthData;
  postUrl: FetchResult; postB64: FetchResult; getRaster: FetchResult;
}

interface SvgInfo {
  urlKb: number; b64Kb: number; overheadKb: number; overheadPct: number;
  width: string | null; height: string | null; viewBox: string | null;
  embeddedImageCount: number; embeddedImageKb: number;
  elementCount: number; textCount: number; pathCount: number;
  complexityScore: number; // 0-100 heuristic
}

interface FormatResult {
  format: FormatType; ok: boolean; ms: number | null;
  sizeKb: number | null; imageUrl: string | null; note: string;
}

interface BurstShot { index: number; ms: number; ok: boolean; sizeKb: number | null; }
interface BurstResult {
  nodeId: string; nodeLabel: string; concurrency: number; format: FormatType;
  shots: BurstShot[]; wallMs: number; successCount: number;
  minMs: number; maxMs: number; avgMs: number;
}

interface MultiRunStats {
  times: number[]; min: number; max: number; avg: number; p50: number; variance: number;
}

interface Benchmark {
  inputType: string; rawId: string; queryParams: string; format: string;
  svgUrlRef: string; svgUrlB64: string; urlKb: number; b64Kb: number;
  svgInfo: SvgInfo | null;
  nodes: NodeResult[];
  summary: { fastestMs: number | null; fastestLabel: string | null; fastestNodeId: string | null; successCount: number };
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, monospace' };
const SYNE: React.CSSProperties = { fontFamily: 'Syne, sans-serif' };

const fmtMs = (ms: number | null) =>
  ms == null || ms <= 0 ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;

const fmtKb = (kb: number | null) =>
  kb == null ? '—' : kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;

const msColor = (ms: number | null) => {
  if (!ms) return C.ghost;
  if (ms < 500)  return C.green;
  if (ms < 1200) return C.yellow;
  if (ms < 3000) return C.orange;
  return C.red;
};

const sizeColor = (kb: number | null) => {
  if (!kb) return C.ghost;
  if (kb < 50)  return C.green;
  if (kb < 150) return C.yellow;
  if (kb < 400) return C.orange;
  return C.red;
};

function calcStats(times: number[]): MultiRunStats {
  if (!times.length) return { times: [], min: 0, max: 0, avg: 0, p50: 0, variance: 0 };
  const sorted = [...times].sort((a, b) => a - b);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const variance = Math.round(Math.sqrt(times.reduce((s, t) => s + (t - avg) ** 2, 0) / times.length));
  return {
    times, min: sorted[0], max: sorted[sorted.length - 1], avg,
    p50: sorted[Math.floor(sorted.length * 0.5)], variance,
  };
}

function parseSvgInfo(urlSvg: string, b64Svg: string): SvgInfo {
  const urlKb = urlSvg ? Math.round(new Blob([urlSvg]).size / 1024) : 0;
  const b64Kb = b64Svg ? Math.round(new Blob([b64Svg]).size / 1024) : 0;
  const overheadKb = b64Kb - urlKb;
  const overheadPct = urlKb > 0 ? Math.round((overheadKb / urlKb) * 100) : 0;

  const svgToAnalyze = b64Svg || urlSvg;
  let width: string | null = null, height: string | null = null, viewBox: string | null = null;
  let embeddedImageCount = 0, embeddedImageKb = 0;
  let elementCount = 0, textCount = 0, pathCount = 0;

  if (svgToAnalyze) {
    const wm = svgToAnalyze.match(/viewBox="([^"]+)"/);
    viewBox = wm ? wm[1] : null;
    const ww = svgToAnalyze.match(/<svg[^>]+width="([^"]+)"/);
    const wh = svgToAnalyze.match(/<svg[^>]+height="([^"]+)"/);
    width  = ww ? ww[1] : null;
    height = wh ? wh[1] : null;

    const imageMatches = svgToAnalyze.match(/<image[^>]*>/g) ?? [];
    embeddedImageCount = imageMatches.length;
    // Estimate embedded image KB from base64 data URIs
    const dataUriMatches = svgToAnalyze.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g) ?? [];
    embeddedImageKb = Math.round(
      dataUriMatches.reduce((s, m) => s + m.length * 0.75 / 1024, 0)
    );

    elementCount = (svgToAnalyze.match(/<[a-zA-Z][^>]*>/g) ?? []).length;
    textCount    = (svgToAnalyze.match(/<text[^>]*>/g) ?? []).length;
    pathCount    = (svgToAnalyze.match(/<path[^>]*>/g) ?? []).length;
  }

  // Complexity score: penalise large files, many images, many paths
  const complexityScore = Math.min(100, Math.round(
    (b64Kb / 4) + (embeddedImageCount * 8) + (pathCount * 0.5) + (elementCount * 0.1)
  ));

  return { urlKb, b64Kb, overheadKb, overheadPct, width, height, viewBox, embeddedImageCount, embeddedImageKb, elementCount, textCount, pathCount, complexityScore };
}

function proxyUrl(node: typeof NODES[number], targetUrl: string): string {
  if (!node.http) return targetUrl;
  return `${CF_PROXY_BASE}?url=${encodeURIComponent(targetUrl)}`;
}

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
      return { ok: false, ms, status: res.status, note: `HTTP ${res.status}`, imageUrl: null, sizeKb: null };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      const txt = await res.text();
      return { ok: false, ms, status: res.status, note: `Non-image (${ct.split(';')[0]}): ${txt.slice(0, 80)}`, imageUrl: null, sizeKb: null };
    }
    const buf = await res.arrayBuffer();
    const sizeKb = parseFloat((buf.byteLength / 1024).toFixed(1));
    return { ok: true, ms, status: res.status, note: '', imageUrl: URL.createObjectURL(new Blob([buf], { type: ct })), sizeKb };
  } catch (e: any) {
    return { ok: false, ms: Math.round(performance.now() - t0), status: 0, note: e.name === 'AbortError' ? `Timeout ${TIMEOUT_MS}ms` : e.message, imageUrl: null, sizeKb: null };
  }
}

async function fetchHealth(node: typeof NODES[number]): Promise<HealthData> {
  const healthTarget = proxyUrl(node, `${node.url}/health`);
  try {
    const res = await fetch(healthTarget, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return { reachable: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { reachable: true, ...data };
  } catch (e: any) {
    return { reachable: false, error: e.message };
  }
}

async function benchNode(
  node: typeof NODES[number],
  urlSvg: string, b64Svg: string, svgUrlRef: string, format: string,
): Promise<NodeResult> {
  const base = `${node.url}${node.path}?format=${format}`;
  const postTarget = proxyUrl(node, base);
  const getRasterTarget = proxyUrl(node, `${node.url}${node.path}?format=${format}&url=${encodeURIComponent(svgUrlRef)}`);
  const headers = { 'Content-Type': 'image/svg+xml', 'X-Format': format };
  const [health, postUrl, postB64, getRaster] = await Promise.all([
    fetchHealth(node),
    urlSvg ? fetchWithImage(postTarget, { method: 'POST', body: urlSvg, headers }) : Promise.resolve({ ok: false, ms: 0, status: 0, note: 'SVG unavailable', imageUrl: null, sizeKb: null }),
    b64Svg ? fetchWithImage(postTarget, { method: 'POST', body: b64Svg, headers }) : Promise.resolve({ ok: false, ms: 0, status: 0, note: 'SVG unavailable', imageUrl: null, sizeKb: null }),
    fetchWithImage(getRasterTarget),
  ]);
  return { ...node, health, postUrl, postB64, getRaster };
}

// ── New: Format comparison benchmark ─────────────────────────────────────────
async function benchFormats(
  node: typeof NODES[number], urlSvg: string, svgUrlRef: string,
  onProgress: (f: string) => void,
): Promise<FormatResult[]> {
  const results: FormatResult[] = [];
  for (const fmt of FORMATS) {
    onProgress(fmt);
    const target = proxyUrl(node, `${node.url}${node.path}?format=${fmt}`);
    const headers = { 'Content-Type': 'image/svg+xml', 'X-Format': fmt };
    const r = await fetchWithImage(target, { method: 'POST', body: urlSvg, headers });
    results.push({ format: fmt, ok: r.ok, ms: r.ok ? r.ms : null, sizeKb: r.sizeKb, imageUrl: r.imageUrl, note: r.note });
  }
  return results;
}

// ── New: Concurrent burst benchmark ──────────────────────────────────────────
async function benchBurst(
  node: typeof NODES[number], urlSvg: string, format: FormatType,
  concurrency: number, onProgress: (n: number) => void,
): Promise<BurstResult> {
  const target = proxyUrl(node, `${node.url}${node.path}?format=${format}`);
  const headers = { 'Content-Type': 'image/svg+xml', 'X-Format': format };
  const wallStart = performance.now();
  const shots = await Promise.all(
    Array.from({ length: concurrency }, async (_, i): Promise<BurstShot> => {
      const r = await fetchWithImage(target, { method: 'POST', body: urlSvg, headers });
      onProgress(i + 1);
      // revoke blob immediately to save memory
      if (r.imageUrl) URL.revokeObjectURL(r.imageUrl);
      return { index: i, ms: r.ms, ok: r.ok, sizeKb: r.sizeKb };
    })
  );
  const wallMs = Math.round(performance.now() - wallStart);
  const successShots = shots.filter(s => s.ok);
  const times = successShots.map(s => s.ms);
  return {
    nodeId: node.id, nodeLabel: node.label, concurrency, format,
    shots, wallMs, successCount: successShots.length,
    minMs: times.length ? Math.min(...times) : 0,
    maxMs: times.length ? Math.max(...times) : 0,
    avgMs: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
  };
}

// ── New: Multi-run (3×) per node ──────────────────────────────────────────────
async function benchMultiRun(
  node: typeof NODES[number], urlSvg: string, format: string,
  runs: number, onProgress: (r: number) => void,
): Promise<{ postUrl: MultiRunStats; postB64: MultiRunStats }> {
  const urlTimes: number[] = [], b64Times: number[] = [];
  const b64Svg = urlSvg; // for multi-run, use same SVG
  const base = `${node.url}${node.path}?format=${format}`;
  const target = proxyUrl(node, base);
  const headers = { 'Content-Type': 'image/svg+xml', 'X-Format': format };
  for (let i = 0; i < runs; i++) {
    const [rU, rB] = await Promise.all([
      fetchWithImage(target, { method: 'POST', body: urlSvg, headers }),
      fetchWithImage(target, { method: 'POST', body: b64Svg, headers }),
    ]);
    if (rU.ok) urlTimes.push(rU.ms);
    if (rB.ok) b64Times.push(rB.ms);
    if (rU.imageUrl) URL.revokeObjectURL(rU.imageUrl);
    if (rB.imageUrl) URL.revokeObjectURL(rB.imageUrl);
    onProgress(i + 1);
  }
  return { postUrl: calcStats(urlTimes), postB64: calcStats(b64Times) };
}

async function runBenchmark(
  inputType: string, rawId: string, params: string, format: string,
  onStep: (s: string) => void,
): Promise<Benchmark> {
  const cb = Date.now();
  const qs = `${params ? params + '&' : ''}cb=${cb}`;
  const svgUrlRef = `${API_BASE}/${inputType}/${rawId}.svg?${qs}&no_embed=1`;
  const svgUrlB64 = `${API_BASE}/${inputType}/${rawId}.svg?${qs}`;

  onStep('Fetching SVG variants…');
  const [urlRes, b64Res] = await Promise.all([
    fetch(svgUrlRef, { signal: AbortSignal.timeout(8_000) }).catch(() => null),
    fetch(svgUrlB64, { signal: AbortSignal.timeout(8_000) }).catch(() => null),
  ]);
  const urlSvg = urlRes?.ok ? await urlRes.text() : '';
  const b64Svg = b64Res?.ok ? await b64Res.text() : '';
  const svgInfo = (urlSvg || b64Svg) ? parseSvgInfo(urlSvg, b64Svg) : null;

  onStep('Benchmarking all nodes in parallel…');
  const nodes = await Promise.all(NODES.map(n => benchNode(n, urlSvg, b64Svg, svgUrlRef, format)));

  const allMs = nodes.flatMap(n => [n.postUrl, n.postB64].filter(r => r.ok).map(r => r.ms));
  const fastestMs = allMs.length ? Math.min(...allMs) : null;
  const fastestNode = fastestMs != null
    ? nodes.find(n => [n.postUrl, n.postB64].some(r => r.ok && r.ms === fastestMs)) ?? null
    : null;

  return {
    inputType, rawId, queryParams: params, format,
    svgUrlRef, svgUrlB64: svgUrlB64.replace(`&cb=${cb}`, ''),
    urlKb: svgInfo?.urlKb ?? 0, b64Kb: svgInfo?.b64Kb ?? 0,
    svgInfo, nodes,
    summary: {
      fastestMs, fastestLabel: fastestNode?.label ?? null,
      fastestNodeId: fastestNode?.id ?? null,
      successCount: nodes.filter(n => n.postUrl.ok || n.postB64.ok).length,
    },
    timestamp: new Date().toISOString(),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Label({ children, size = 7 }: { children: React.ReactNode; size?: number }) {
  return <span style={{ ...MONO, fontSize: size, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{children}</span>;
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ ...MONO, fontSize: 7, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function StatusDot({ ok, size = 6 }: { ok: boolean; size?: number }) {
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: ok ? C.green : C.red, flexShrink: 0 }} />;
}

function IconCacheStatus({ h }: { h: HealthData }) {
  if (!h.reachable) return <Pill color={C.ghost}>offline</Pill>;
  const ic = h.iconCache;
  if (!ic) return <Pill color={C.orange}>no cache data</Pill>;
  if (!ic.loaded) return <Pill color={C.red}>icons: ✗ {(ic.lastError ?? 'not loaded').slice(0, 40)}</Pill>;
  const ageMin = ic.ageMs ? Math.round(ic.ageMs / 60000) : null;
  const ageStr = ageMin !== null ? (ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin / 60)}h ago`) : '';
  return <Pill color={C.green}>icons: {ic.iconCount} {ageStr && `· ${ageStr}`}</Pill>;
}

function FontStatus({ h }: { h: HealthData }) {
  if (!h.reachable) return null;
  const ready = h.fontReady ?? (h.fontFiles ? h.fontFiles.length > 0 : h.fontDefault ? true : undefined);
  if (ready === undefined) return <Pill color={C.ghost}>font: ?</Pill>;
  return <Pill color={ready ? C.green : C.red}>font: {ready ? h.fontDefault?.split(',')[0] || '✓' : '✗'}</Pill>;
}

function WorkerStatus({ h }: { h: HealthData }) {
  if (!h.reachable || h.workerCount === undefined) return null;
  const busy = h.activeJobs ?? 0, queue = h.queuedJobs ?? 0, respawn = h.pendingRespawns ?? 0;
  const color = respawn > 0 ? C.orange : busy > 0 ? C.yellow : C.teal;
  const txt = [`${h.workerCount}w`, busy > 0 && `${busy} active`, queue > 0 && `${queue} queued`, respawn > 0 && `⚠ ${respawn} respawn`].filter(Boolean).join(' · ');
  return <Pill color={color}>{txt}</Pill>;
}

function UptimeStatus({ h }: { h: HealthData }) {
  if (!h.uptime) return null;
  const hr = Math.floor(h.uptime / 3600), min = Math.floor((h.uptime % 3600) / 60);
  return <Pill color={C.blue}>up {hr > 0 ? `${hr}h ${min}m` : `${min}m`}</Pill>;
}

// ── PosterCell — now shows response size ──────────────────────────────────────
function PosterCell({ result, label, badge }: { result: FetchResult; label: string; badge?: string }) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <Label>{label}</Label>
        {badge && <span style={{ ...MONO, fontSize: 7, color: C.ghost }}>{badge}</span>}
      </div>
      <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', background: '#0a0a09', border: `1px solid var(--film-border)` }}>
        {result.ok && result.imageUrl ? (
          <>
            <img src={result.imageUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 4, right: 4, ...MONO, fontSize: 8, fontWeight: 700, color: msColor(result.ms), background: 'rgba(0,0,0,0.85)', padding: '2px 5px', borderRadius: 3 }}>
              {result.ms}ms
            </div>
            {result.sizeKb != null && (
              <div style={{ position: 'absolute', bottom: 4, left: 4, ...MONO, fontSize: 7, color: sizeColor(result.sizeKb), background: 'rgba(0,0,0,0.85)', padding: '2px 4px', borderRadius: 3 }}>
                {fmtKb(result.sizeKb)}
              </div>
            )}
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ color: C.red, fontSize: 16 }}>✗</span>
            <span style={{ ...MONO, fontSize: 7, color: C.red, textAlign: 'center', padding: '0 6px', lineHeight: 1.5 }}>{result.note.slice(0, 60)}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Pill color={result.ok ? msColor(result.ms) : C.red}>{result.ok ? `${result.ms}ms` : 'FAIL'}</Pill>
        {result.sizeKb != null && <Pill color={sizeColor(result.sizeKb)}>{fmtKb(result.sizeKb)}</Pill>}
        {result.ok && <Pill color={C.ghost}>HTTP {result.status}</Pill>}
      </div>
    </div>
  );
}

function NodeCard({ node, urlKb, b64Kb }: { node: NodeResult; urlKb: number; b64Kb: number }) {
  const h = node.health;
  const delta = (node.postUrl.ok && node.postB64.ok) ? node.postB64.ms - node.postUrl.ms : null;
  const hasAny = node.postUrl.ok || node.postB64.ok || node.getRaster.ok;
  return (
    <div style={{ background: 'var(--film-char)', border: `1px solid ${hasAny ? 'var(--film-border)' : 'rgba(248,113,113,0.2)'}`, borderLeft: `3px solid ${node.color}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ ...MONO, fontSize: 11, fontWeight: 700, color: 'var(--film-cream)' }}>{node.label}</div>
            <div style={{ ...MONO, fontSize: 7, color: C.ghost, marginTop: 1 }}>
              {node.region}{node.http && <span style={{ color: C.teal, marginLeft: 5 }}>· via proxy</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Pill color={node.color}>{node.tag}</Pill>
            {!h.reachable && <Pill color={C.red}>offline</Pill>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <IconCacheStatus h={h} />
          <FontStatus h={h} />
          <WorkerStatus h={h} />
          <UptimeStatus h={h} />
          {h.reachable && h.version && <Pill color={C.ghost}>v{h.version}</Pill>}
          {!h.reachable && h.error && <span style={{ ...MONO, fontSize: 7, color: C.red }}>{h.error.slice(0, 60)}</span>}
        </div>
      </div>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <PosterCell result={node.postUrl} label="POST URL-SVG" badge={`${urlKb}KB`} />
          <PosterCell result={node.postB64} label="POST B64-SVG" badge={`${b64Kb}KB`} />
        </div>
        {delta !== null && (
          <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 4, background: Math.abs(delta) > 200 ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${Math.abs(delta) > 200 ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span style={{ ...MONO, fontSize: 8, color: delta > 0 ? C.orange : C.green }}>
              B64 is {delta > 0 ? `+${delta}ms slower` : `${Math.abs(delta)}ms faster`} than URL-SVG
            </span>
            <span style={{ ...MONO, fontSize: 7, color: C.ghost, marginLeft: 8 }}>(+{b64Kb - urlKb}KB overhead)</span>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <Label size={7}>GET ?url= (node fetches SVG)</Label>
        <div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 80px', position: 'relative', aspectRatio: '2/3', borderRadius: 4, overflow: 'hidden', background: '#0a0a09', border: `1px solid var(--film-border)` }}>
            {node.getRaster.ok && node.getRaster.imageUrl ? (
              <>
                <img src={node.getRaster.imageUrl} alt="GET" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 2, right: 2, ...MONO, fontSize: 7, fontWeight: 700, color: msColor(node.getRaster.ms), background: 'rgba(0,0,0,0.9)', padding: '1px 3px', borderRadius: 2 }}>{node.getRaster.ms}ms</div>
              </>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red, fontSize: 14 }}>✗</div>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Pill color={node.getRaster.ok ? msColor(node.getRaster.ms) : C.red}>{node.getRaster.ok ? `${node.getRaster.ms}ms` : 'FAIL'}</Pill>
            {node.getRaster.sizeKb != null && <Pill color={sizeColor(node.getRaster.sizeKb)}>{fmtKb(node.getRaster.sizeKb)}</Pill>}
            {!node.getRaster.ok && node.getRaster.note && <span style={{ ...MONO, fontSize: 7, color: C.red, lineHeight: 1.5 }}>{node.getRaster.note.slice(0, 80)}</span>}
            {node.getRaster.ok && node.postUrl.ok && (
              <span style={{ ...MONO, fontSize: 7, color: C.ghost }}>
                {node.getRaster.ms - node.postUrl.ms > 0 ? `+${node.getRaster.ms - node.postUrl.ms}ms vs POST URL` : `${Math.abs(node.getRaster.ms - node.postUrl.ms)}ms faster than POST URL`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SVG Inspector panel ────────────────────────────────────────────────────────
function SvgInspectorPanel({ info, bench }: { info: SvgInfo; bench: Benchmark }) {
  const complexColor = info.complexityScore < 30 ? C.green : info.complexityScore < 60 ? C.yellow : info.complexityScore < 80 ? C.orange : C.red;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
        {[
          { l: 'URL-SVG size',   v: `${info.urlKb} KB`,    c: info.urlKb > 50 ? C.orange : C.green },
          { l: 'B64-SVG size',   v: `${info.b64Kb} KB`,    c: info.b64Kb > 100 ? C.orange : C.green },
          { l: 'B64 overhead',   v: `+${info.overheadKb} KB (+${info.overheadPct}%)`, c: info.overheadPct > 50 ? C.orange : C.yellow },
          { l: 'Embed images',   v: String(info.embeddedImageCount), c: info.embeddedImageCount > 3 ? C.orange : C.teal },
          { l: 'Embed img size', v: `${info.embeddedImageKb} KB`,    c: info.embeddedImageKb > 50 ? C.orange : C.green },
          { l: 'Complexity',     v: `${info.complexityScore}/100`, c: complexColor },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ padding: '12px 14px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
            <div style={{ ...MONO, fontSize: 7, color: C.ghost, marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>{l}</div>
            <div style={{ ...MONO, fontSize: 18, color: c, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
        <div style={{ padding: '12px 14px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
          <div style={{ ...MONO, fontSize: 7, color: C.ghost, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>SVG Dimensions</div>
          {info.viewBox ? <div style={{ ...MONO, fontSize: 11, color: C.amber, marginBottom: 4 }}>viewBox: {info.viewBox}</div> : null}
          {info.width  ? <div style={{ ...MONO, fontSize: 10, color: C.dim }}>width: {info.width}</div> : null}
          {info.height ? <div style={{ ...MONO, fontSize: 10, color: C.dim }}>height: {info.height}</div> : null}
          {!info.viewBox && !info.width && <div style={{ ...MONO, fontSize: 9, color: C.ghost }}>Could not parse dimensions</div>}
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
          <div style={{ ...MONO, fontSize: 7, color: C.ghost, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>DOM Breakdown</div>
          {[
            { l: 'Total elements', v: info.elementCount, c: C.cream },
            { l: 'Path elements',  v: info.pathCount,    c: C.blue },
            { l: 'Text elements',  v: info.textCount,    c: C.amber },
            { l: 'Image elements', v: info.embeddedImageCount, c: info.embeddedImageCount > 2 ? C.orange : C.teal },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ ...MONO, fontSize: 8, color: C.ghost }}>{l}</span>
              <span style={{ ...MONO, fontSize: 9, color: c, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
          <div style={{ ...MONO, fontSize: 7, color: C.ghost, marginBottom: 8, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Payload Split</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { l: 'SVG markup', kb: info.urlKb - info.embeddedImageKb, c: C.blue },
              { l: 'Embedded imgs', kb: info.embeddedImageKb, c: C.amber },
            ].map(({ l, kb, c }) => {
              const total = info.urlKb || 1;
              return (
                <div key={l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ ...MONO, fontSize: 8, color: C.ghost }}>{l}</span>
                    <span style={{ ...MONO, fontSize: 8, color: c, fontWeight: 700 }}>{kb} KB</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: c, width: `${Math.max(0, (kb / total) * 100)}%`, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complexity gauge */}
      <div style={{ padding: '12px 14px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Render Complexity Score</span>
          <span style={{ ...MONO, fontSize: 10, color: complexColor, fontWeight: 700 }}>{info.complexityScore}/100 — {info.complexityScore < 30 ? 'Light' : info.complexityScore < 60 ? 'Medium' : info.complexityScore < 80 ? 'Heavy' : 'Very Heavy'}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: complexColor, width: `${info.complexityScore}%`, borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ ...MONO, fontSize: 7, color: C.ghost, marginTop: 6 }}>
          Score = file size + (embedded images × 8) + (path count × 0.5) + (element count × 0.1)
        </div>
      </div>
    </div>
  );
}

// ── Format comparison panel ────────────────────────────────────────────────────
function FormatComparePanel({ bench }: { bench: Benchmark }) {
  const [results, setResults] = useState<FormatResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [targetNodeId, setTargetNodeId] = useState(bench.summary.fastestNodeId ?? bench.nodes[0]?.id ?? '');
  const blobUrls = useRef<string[]>([]);

  const run = useCallback(async () => {
    const node = NODES.find(n => n.id === targetNodeId);
    if (!node) return;
    setRunning(true);
    setResults(null);

    // Fetch fresh URL-SVG
    const svgRes = await fetch(bench.svgUrlRef + `&cb=${Date.now()}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
    const urlSvg = svgRes?.ok ? await svgRes.text() : '';
    if (!urlSvg) { setRunning(false); setProgress('Could not fetch SVG'); return; }

    blobUrls.current.forEach(u => URL.revokeObjectURL(u));
    blobUrls.current = [];

    const fmtResults = await benchFormats(node, urlSvg, bench.svgUrlRef, f => setProgress(`Testing ${f.toUpperCase()}…`));
    blobUrls.current = fmtResults.map(r => r.imageUrl).filter(Boolean) as string[];
    setResults(fmtResults);
    setRunning(false);
    setProgress('');
  }, [targetNodeId, bench]);

  useEffect(() => () => { blobUrls.current.forEach(u => URL.revokeObjectURL(u)); }, []);

  const bestMs   = results ? Math.min(...results.filter(r => r.ok && r.ms != null).map(r => r.ms!)) : null;
  const smallestKb = results ? Math.min(...results.filter(r => r.ok && r.sizeKb != null).map(r => r.sizeKb!)) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Target Node</div>
          <select value={targetNodeId} onChange={e => setTargetNodeId(e.target.value)} style={{
            height: 34, padding: '0 10px', background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 7, color: 'var(--film-cream)', fontSize: 11, ...MONO, outline: 'none', cursor: 'pointer',
          }}>
            {NODES.map(n => <option key={n.id} value={n.id}>{n.label} · {n.region}</option>)}
          </select>
        </div>
        <button onClick={run} disabled={running} style={{
          alignSelf: 'flex-end', height: 34, padding: '0 18px',
          background: running ? 'rgba(196,124,46,0.3)' : C.amber, color: '#070706',
          border: 'none', borderRadius: 7, cursor: running ? 'wait' : 'pointer',
          fontSize: 11, fontWeight: 800, ...SYNE, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>{running ? progress || 'Running…' : '▶ Run Format Test'}</button>
        {bench.summary.fastestNodeId === targetNodeId && (
          <Pill color={C.gold}>★ Fastest node</Pill>
        )}
      </div>

      {results && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
            {results.map(r => (
              <div key={r.format} style={{
                background: 'var(--film-char)', border: `1px solid var(--film-border)`,
                borderRadius: 8, overflow: 'hidden',
                outline: (r.ms === bestMs && r.ok) ? `1px solid ${C.green}` : (r.sizeKb === smallestKb && r.ok) ? `1px solid ${C.teal}` : 'none',
              }}>
                <div style={{ position: 'relative', aspectRatio: '2/3', background: '#0a0a09' }}>
                  {r.ok && r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.format} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <span style={{ color: C.red, fontSize: 16 }}>✗</span>
                      <span style={{ ...MONO, fontSize: 7, color: C.red, textAlign: 'center', padding: '0 6px' }}>{r.note.slice(0, 50)}</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...SYNE, fontSize: 13, fontWeight: 800, color: C.amber, letterSpacing: '0.08em' }}>{r.format.toUpperCase()}</span>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {r.ms === bestMs && r.ok && <Pill color={C.green}>⚡ fastest</Pill>}
                      {r.sizeKb === smallestKb && r.ok && <Pill color={C.teal}>🗜 smallest</Pill>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Pill color={r.ok ? msColor(r.ms) : C.red}>{r.ok ? `${r.ms}ms` : 'FAIL'}</Pill>
                    {r.sizeKb != null && <Pill color={sizeColor(r.sizeKb)}>{fmtKb(r.sizeKb)}</Pill>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ background: 'var(--film-mid)', border: '1px solid var(--film-border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', ...SYNE, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.amber }}>
              Format Comparison
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO, fontSize: 10, minWidth: 380 }}>
                <thead>
                  <tr>
                    {['Format', 'Render Time', 'File Size', 'vs PNG', 'Result'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 7, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const pngResult = results.find(x => x.format === 'png');
                    const vsMs   = pngResult?.ms   && r.ms   ? r.ms - pngResult.ms : null;
                    const vsKb   = pngResult?.sizeKb && r.sizeKb ? r.sizeKb - pngResult.sizeKb : null;
                    return (
                      <tr key={r.format} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '7px 12px', ...SYNE, fontWeight: 800, color: C.amber, fontSize: 11 }}>{r.format.toUpperCase()}</td>
                        <td style={{ padding: '7px 12px', color: r.ok ? msColor(r.ms) : C.red, fontWeight: 700 }}>{fmtMs(r.ms)}</td>
                        <td style={{ padding: '7px 12px', color: r.sizeKb != null ? sizeColor(r.sizeKb) : C.ghost, fontWeight: 700 }}>{fmtKb(r.sizeKb)}</td>
                        <td style={{ padding: '7px 12px' }}>
                          {r.format === 'png' ? <span style={{ color: C.ghost }}>baseline</span>
                            : vsKb != null ? <span style={{ color: vsKb < 0 ? C.green : C.orange }}>{vsKb < 0 ? `${Math.abs(vsKb).toFixed(0)} KB smaller` : `${vsKb.toFixed(0)} KB larger`}</span>
                            : '—'}
                        </td>
                        <td style={{ padding: '7px 12px', color: r.ok ? C.green : C.red }}>{r.ok ? '✓ OK' : `✗ ${r.note.slice(0, 30)}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!results && !running && (
        <div style={{ padding: 32, textAlign: 'center', color: C.ghost, ...MONO, fontSize: 11, border: '1px dashed rgba(196,124,46,0.2)', borderRadius: 8 }}>
          Select a node and run the format test to compare PNG / WebP / JPG side-by-side
        </div>
      )}
    </div>
  );
}

// ── Concurrent burst panel ─────────────────────────────────────────────────────
function BurstPanel({ bench }: { bench: Benchmark }) {
  const [result, setResult] = useState<BurstResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetNodeId, setTargetNodeId] = useState(bench.summary.fastestNodeId ?? bench.nodes[0]?.id ?? '');
  const [concurrency, setConcurrency] = useState<number>(5);
  const [format, setFormat] = useState<FormatType>('webp');

  const run = useCallback(async () => {
    const node = NODES.find(n => n.id === targetNodeId);
    if (!node) return;
    setRunning(true); setResult(null); setProgress(0);
    const svgRes = await fetch(bench.svgUrlRef + `&cb=${Date.now()}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
    const urlSvg = svgRes?.ok ? await svgRes.text() : '';
    if (!urlSvg) { setRunning(false); return; }
    const r = await benchBurst(node, urlSvg, format, concurrency, n => setProgress(n));
    setResult(r);
    setRunning(false);
  }, [targetNodeId, concurrency, format, bench]);

  const efficiency = result && result.wallMs > 0
    ? Math.round((result.avgMs * result.concurrency) / result.wallMs * 10) / 10
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Target Node</div>
          <select value={targetNodeId} onChange={e => setTargetNodeId(e.target.value)} style={{ height: 34, padding: '0 10px', background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'var(--film-cream)', fontSize: 11, ...MONO, outline: 'none', cursor: 'pointer' }}>
            {NODES.map(n => <option key={n.id} value={n.id}>{n.label} · {n.region}</option>)}
          </select>
        </div>
        <div>
          <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Concurrency</div>
          <div style={{ display: 'flex', gap: 1, padding: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7 }}>
            {BURST_SIZES.map(n => (
              <button key={n} onClick={() => setConcurrency(n)} style={{ padding: '3px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, ...SYNE, background: concurrency === n ? 'rgba(196,124,46,0.18)' : 'transparent', color: concurrency === n ? C.amber : C.ghost }}>
                {n}×
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Format</div>
          <div style={{ display: 'flex', gap: 1, padding: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7 }}>
            {FORMATS.map(f => (
              <button key={f} onClick={() => setFormat(f)} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, ...SYNE, background: format === f ? 'rgba(196,124,46,0.18)' : 'transparent', color: format === f ? C.amber : C.ghost }}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <button onClick={run} disabled={running} style={{
          height: 34, padding: '0 18px', background: running ? 'rgba(196,124,46,0.3)' : C.amber,
          color: '#070706', border: 'none', borderRadius: 7, cursor: running ? 'wait' : 'pointer',
          fontSize: 11, fontWeight: 800, ...SYNE, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>
          {running ? `${progress}/${concurrency} done…` : `▶ Burst ${concurrency}×`}
        </button>
      </div>

      {running && (
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: C.amber, width: `${(progress / concurrency) * 100}%`, transition: 'width 0.2s ease', borderRadius: 3 }} />
        </div>
      )}

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
            {[
              { l: 'Wall Time',   v: `${result.wallMs}ms`,           c: msColor(result.wallMs) },
              { l: 'Avg Per Req', v: fmtMs(result.avgMs),            c: msColor(result.avgMs) },
              { l: 'Fastest',     v: fmtMs(result.minMs),            c: C.green },
              { l: 'Slowest',     v: fmtMs(result.maxMs),            c: C.red },
              { l: 'Success',     v: `${result.successCount}/${result.concurrency}`, c: result.successCount === result.concurrency ? C.green : C.orange },
              { l: 'Parallelism', v: efficiency != null ? `${efficiency}×` : '—', c: efficiency && efficiency > 1.5 ? C.green : C.yellow },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ padding: '10px 12px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
                <div style={{ ...MONO, fontSize: 7, color: C.ghost, marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{l}</div>
                <div style={{ ...MONO, fontSize: 18, color: c, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Waterfall bars */}
          <div style={{ background: 'var(--film-mid)', border: '1px solid var(--film-border)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ ...SYNE, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.amber, marginBottom: 12 }}>
              Request Waterfall
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.shots.map(s => (
                <div key={s.index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...MONO, fontSize: 8, color: C.ghost, minWidth: 22 }}>#{s.index + 1}</span>
                  <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      background: s.ok ? msColor(s.ms) : C.red,
                      width: `${Math.min(100, (s.ms / (result.maxMs || 1)) * 100)}%`,
                      opacity: 0.8,
                    }} />
                    <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', ...MONO, fontSize: 7, color: '#000', fontWeight: 700, pointerEvents: 'none' }}>
                      {s.ok ? `${s.ms}ms${s.sizeKb ? ` · ${fmtKb(s.sizeKb)}` : ''}` : 'FAIL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {efficiency != null && (
              <div style={{ marginTop: 10, ...MONO, fontSize: 8, color: C.ghost }}>
                Parallelism efficiency: <span style={{ color: efficiency > 1.5 ? C.green : C.yellow, fontWeight: 700 }}>{efficiency}×</span>
                <span style={{ marginLeft: 6 }}>(ideal = {concurrency}×, wall {result.wallMs}ms vs sequential ~{result.avgMs * concurrency}ms)</span>
              </div>
            )}
          </div>
        </>
      )}

      {!result && !running && (
        <div style={{ padding: 32, textAlign: 'center', color: C.ghost, ...MONO, fontSize: 11, border: '1px dashed rgba(196,124,46,0.2)', borderRadius: 8 }}>
          Fire N concurrent requests to a single node to measure queue depth and parallelism efficiency
        </div>
      )}
    </div>
  );
}

// ── Multi-run stats panel ──────────────────────────────────────────────────────
function MultiRunPanel({ bench }: { bench: Benchmark }) {
  const [results, setResults] = useState<Record<string, { postUrl: MultiRunStats; postB64: MultiRunStats }>>({});
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [runs] = useState(3);

  const run = useCallback(async () => {
    setRunning(true);
    setResults({});
    const svgRes = await fetch(bench.svgUrlRef + `&cb=${Date.now()}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
    const urlSvg = svgRes?.ok ? await svgRes.text() : '';
    if (!urlSvg) { setRunning(false); return; }

    const newResults: typeof results = {};
    for (const node of NODES) {
      setProgress(`${node.label} (${runs}× runs)…`);
      try {
        const r = await benchMultiRun(node, urlSvg, bench.format, runs, () => {});
        newResults[node.id] = r;
      } catch {
        // node failed, skip
      }
    }
    setResults(newResults);
    setRunning(false);
    setProgress('');
  }, [bench, runs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ ...MONO, fontSize: 9, color: C.dim }}>
          Runs each node {runs}× and shows min / avg / max / variance. Takes ~{NODES.length * runs * 2}s.
        </div>
        <button onClick={run} disabled={running} style={{
          height: 34, padding: '0 18px', background: running ? 'rgba(196,124,46,0.3)' : C.amber,
          color: '#070706', border: 'none', borderRadius: 7, cursor: running ? 'wait' : 'pointer',
          fontSize: 11, fontWeight: 800, ...SYNE, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
        }}>{running ? progress || 'Running…' : `▶ Run ${runs}× Multi-Run`}</button>
      </div>

      {Object.keys(results).length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO, fontSize: 10, minWidth: 560 }}>
            <thead>
              <tr>
                {['Node', 'Method', 'Min', 'Avg', 'Max', 'σ Variance', 'Runs'].map(h => (
                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 7, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NODES.flatMap(n => {
                const r = results[n.id];
                if (!r) return [];
                return [
                  { label: n.label, color: n.color, method: 'POST URL-SVG', stats: r.postUrl },
                  { label: '',       color: n.color, method: 'POST B64-SVG', stats: r.postB64 },
                ].map((row, i) => (
                  <tr key={`${n.id}-${i}`} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '7px 12px', borderLeft: `2px solid ${row.color}` }}>
                      {row.label && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.color }} />
                        <span style={{ fontWeight: 700, color: 'var(--film-cream)', fontSize: 10 }}>{row.label}</span>
                      </div>}
                    </td>
                    <td style={{ padding: '7px 12px', color: C.ghost, fontSize: 8 }}>{row.method}</td>
                    <td style={{ padding: '7px 12px', color: msColor(row.stats.min), fontWeight: 700 }}>{fmtMs(row.stats.min)}</td>
                    <td style={{ padding: '7px 12px', color: msColor(row.stats.avg), fontWeight: 700 }}>{fmtMs(row.stats.avg)}</td>
                    <td style={{ padding: '7px 12px', color: msColor(row.stats.max) }}>{fmtMs(row.stats.max)}</td>
                    <td style={{ padding: '7px 12px', color: row.stats.variance > 500 ? C.orange : C.ghost }}>±{row.stats.variance}ms</td>
                    <td style={{ padding: '7px 12px', color: C.ghost }}>{row.stats.times.join(', ')}ms</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(results).length === 0 && !running && (
        <div style={{ padding: 32, textAlign: 'center', color: C.ghost, ...MONO, fontSize: 11, border: '1px dashed rgba(196,124,46,0.2)', borderRadius: 8 }}>
          Runs each node 3× to expose latency variance — useful for spotting cold-start issues
        </div>
      )}
    </div>
  );
}

// ── Summary panel ─────────────────────────────────────────────────────────────
function SummaryPanel({ bench }: { bench: Benchmark }) {
  const postMs = bench.nodes.filter(n => n.postUrl.ok).map(n => n.postUrl.ms);
  const b64Ms  = bench.nodes.filter(n => n.postB64.ok).map(n => n.postB64.ms);
  const getMs  = bench.nodes.filter(n => n.getRaster.ok).map(n => n.getRaster.ms);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const min = (arr: number[]) => arr.length ? Math.min(...arr) : null;
  const max = (arr: number[]) => arr.length ? Math.max(...arr) : null;

  const postSizeKbs = bench.nodes.filter(n => n.postUrl.ok && n.postUrl.sizeKb != null).map(n => n.postUrl.sizeKb!);
  const avgSizeKb = (arr: number[]) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null;

  const rows = [
    { label: 'POST URL-SVG', ms: postMs, kb: bench.urlKb, avgSize: avgSizeKb(postSizeKbs), color: C.blue },
    { label: 'POST B64-SVG', ms: b64Ms,  kb: bench.b64Kb, avgSize: null,                   color: C.orange },
    { label: 'GET ?url=',    ms: getMs,  kb: 0,            avgSize: null,                   color: C.ghost },
  ];

  return (
    <div style={{ background: 'var(--film-char)', border: `1px solid var(--film-border)`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', ...SYNE, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.amber }}>
        Method Comparison
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, ...MONO, minWidth: 460 }}>
          <thead>
            <tr>
              {['Method','Avg','Min','Max','Payload','Avg Size','Nodes OK'].map(h => (
                <th key={h} style={{ ...MONO, fontSize: 6, color: C.ghost, textAlign: 'left', padding: '4px 6px', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label}>
                <td style={{ ...MONO, fontSize: 8, color: r.color, padding: '5px 6px' }}>{r.label}</td>
                <td style={{ ...MONO, fontSize: 9, color: msColor(avg(r.ms)), padding: '5px 6px', fontWeight: 700 }}>{fmtMs(avg(r.ms))}</td>
                <td style={{ ...MONO, fontSize: 9, color: msColor(min(r.ms)), padding: '5px 6px' }}>{fmtMs(min(r.ms))}</td>
                <td style={{ ...MONO, fontSize: 9, color: msColor(max(r.ms)), padding: '5px 6px' }}>{fmtMs(max(r.ms))}</td>
                <td style={{ ...MONO, fontSize: 8, color: r.kb > 0 ? (r.kb > 20 ? C.orange : C.green) : C.ghost, padding: '5px 6px' }}>{r.kb > 0 ? `${r.kb}KB` : '—'}</td>
                <td style={{ ...MONO, fontSize: 8, color: r.avgSize != null ? sizeColor(r.avgSize) : C.ghost, padding: '5px 6px' }}>{r.avgSize != null ? fmtKb(r.avgSize) : '—'}</td>
                <td style={{ ...MONO, fontSize: 9, color: 'var(--film-cream)', padding: '5px 6px' }}>{r.ms.length}/{NODES.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bench.urlKb > 0 && bench.b64Kb > 0 && (
        <div style={{ margin: '0 12px 10px', padding: '6px 8px', borderRadius: 4, background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)' }}>
          <span style={{ ...MONO, fontSize: 8, color: C.orange }}>
            B64 payload is {bench.b64Kb - bench.urlKb}KB larger (+{Math.round((bench.b64Kb / bench.urlKb - 1) * 100)}%)
          </span>
          <span style={{ ...MONO, fontSize: 7, color: C.ghost, marginLeft: 8 }}>
            · {bench.urlKb}KB (URL-SVG) vs {bench.b64Kb}KB (B64-SVG)
          </span>
        </div>
      )}
    </div>
  );
}

// ── HealthGrid ─────────────────────────────────────────────────────────────────
function HealthGrid({ nodes }: { nodes: NodeResult[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
      {nodes.map(n => {
        const h = n.health;
        const ic = h.iconCache;
        return (
          <div key={n.id} style={{ padding: '10px 12px', background: 'var(--film-char)', border: `1px solid ${h.reachable ? 'var(--film-border)' : 'rgba(248,113,113,0.2)'}`, borderLeft: `3px solid ${n.color}`, borderRadius: 7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: 'var(--film-cream)' }}>{n.label}</span>
              <StatusDot ok={h.reachable} />
            </div>
            {!h.reachable ? (
              <span style={{ ...MONO, fontSize: 7, color: C.red }}>{h.error?.slice(0, 60)}</span>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
                {[
                  { l: 'Status',  v: h.status || 'ok', c: h.status === 'ok' ? C.green : C.orange },
                  { l: 'Version', v: h.version || '—', c: C.ghost },
                  { l: 'Icons',   v: ic?.loaded ? `✓ ${ic.iconCount}` : ic ? `✗ ${ic.lastError?.slice(0, 20) || 'missing'}` : '—', c: ic?.loaded ? C.green : ic ? C.red : C.ghost },
                  { l: 'Icon age',v: ic?.ageMs ? (ic.ageMs < 3600000 ? `${Math.round(ic.ageMs / 60000)}m` : `${Math.round(ic.ageMs / 3600000)}h`) : '—', c: ic?.ageMs && ic.ageMs > 23 * 3600000 ? C.orange : C.ghost },
                  { l: 'Font',    v: h.fontReady !== undefined ? (h.fontReady ? h.fontDefault?.split(',')[0] || '✓' : '✗') : (h.fontDefault ? h.fontDefault.split(',')[0] : h.fontFiles?.length ? '✓' : '—'), c: (h.fontReady ?? (h.fontDefault || h.fontFiles?.length)) ? C.green : C.red },
                  { l: 'Workers', v: h.workerCount !== undefined ? String(h.workerCount) : '—', c: C.blue },
                  { l: 'Active',  v: h.activeJobs  !== undefined ? String(h.activeJobs)  : '—', c: (h.activeJobs || 0) > 0 ? C.yellow : C.ghost },
                  { l: 'Queue',   v: h.queuedJobs  !== undefined ? String(h.queuedJobs)  : '—', c: (h.queuedJobs || 0) > 0 ? C.orange : C.ghost },
                  { l: 'Respawns',v: h.pendingRespawns !== undefined ? String(h.pendingRespawns) : '—', c: (h.pendingRespawns || 0) > 0 ? C.red : C.ghost },
                  { l: 'Uptime',  v: h.uptime ? (h.uptime >= 3600 ? `${Math.floor(h.uptime / 3600)}h` : `${Math.floor(h.uptime / 60)}m`) : '—', c: C.teal },
                  { l: 'Max conc',v: h.maxConcurrent !== undefined ? String(h.maxConcurrent) : '—', c: C.ghost },
                  { l: 'Node ID', v: h.node || '—', c: C.dim },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ ...MONO, fontSize: 6, color: C.ghost, letterSpacing: '0.1em' }}>{l}</span>
                    <span style={{ ...MONO, fontSize: 8, color: c, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Timing bars ───────────────────────────────────────────────────────────────
function TimingBars({ nodes }: { nodes: NodeResult[] }) {
  const maxMs = Math.max(...nodes.flatMap(n => [n.postUrl, n.postB64, n.getRaster].filter(r => r.ok).map(r => r.ms)), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {nodes.map(n => (
        <div key={n.id}>
          <div style={{ ...MONO, fontSize: 8, color: 'var(--film-cream)', marginBottom: 4, fontWeight: 600 }}>
            {n.label}<span style={{ color: C.ghost, fontWeight: 400, marginLeft: 6 }}>{n.region}</span>
          </div>
          {[
            { r: n.postUrl,   label: 'POST URL', color: C.blue },
            { r: n.postB64,   label: 'POST B64', color: C.orange },
            { r: n.getRaster, label: 'GET',       color: C.ghost },
          ].map(({ r, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ ...MONO, fontSize: 7, color: C.ghost, minWidth: 54 }}>{label}</span>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                {r.ok && <div style={{ height: '100%', width: `${(r.ms / maxMs) * 100}%`, background: msColor(r.ms), borderRadius: 2, transition: 'width 0.5s ease' }} />}
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', minWidth: 100 }}>
                <span style={{ ...MONO, fontSize: 8, fontWeight: 700, color: r.ok ? msColor(r.ms) : C.red }}>{r.ok ? fmtMs(r.ms) : 'FAIL'}</span>
                {r.sizeKb != null && <span style={{ ...MONO, fontSize: 7, color: sizeColor(r.sizeKb) }}>{fmtKb(r.sizeKb)}</span>}
              </div>
              {!r.ok && r.note && <span style={{ ...MONO, fontSize: 7, color: C.red }}>{r.note.slice(0, 30)}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Search form ───────────────────────────────────────────────────────────────
// FIX: was hardcoded `gridTemplateColumns: '110px 1fr 90px'` → now responsive
function SearchForm({ onRun }: { onRun: (t: string, i: string, p: string, f: string) => void }) {
  const [type,   setType]   = useState('movie');
  const [id,     setId]     = useState('');
  const [params, setParams] = useState('r=imdb,rt');
  const [format, setFormat] = useState('png');

  const run = () => id.trim() && onRun(type, id.trim(), params.trim(), format);
  const base: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px', boxSizing: 'border-box',
    background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 7, color: 'var(--film-cream)', fontSize: 12, ...MONO, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 580 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
        {[
          { label: 'Type', el: (
            <select value={type} onChange={e => setType(e.target.value)} style={{ ...base, cursor: 'pointer' }}>
              {['movie','tv','anime','poster'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )},
          { label: 'Format', el: (
            <select value={format} onChange={e => setFormat(e.target.value)} style={{ ...base, cursor: 'pointer' }}>
              {['png','webp','jpg'].map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          )},
        ].map(({ label, el }) => (
          <div key={label}>
            <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>{label}</div>
            {el}
          </div>
        ))}
      </div>
      <div>
        <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>ID (TMDB / IMDb tt… / MAL)</div>
        <input value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} placeholder="e.g. tt1375666 or 136315" style={base} />
      </div>
      <div>
        <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>Query params</div>
        <input value={params} onChange={e => setParams(e.target.value)} placeholder="r=imdb,rt&source=fanart" style={base} />
      </div>
      <button onClick={run} disabled={!id.trim()} style={{
        height: 42, background: `linear-gradient(90deg,${C.amber},${C.gold})`, color: '#070706',
        border: 'none', borderRadius: 8, cursor: id.trim() ? 'pointer' : 'not-allowed',
        fontSize: 12, fontWeight: 800, ...SYNE, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
        opacity: id.trim() ? 1 : 0.5,
      }}>Run Benchmark</button>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {EXAMPLES.map(ex => (
          <button key={ex.id} onClick={() => { setType(ex.type); setId(ex.id); setParams(ex.params); }} style={{
            padding: '4px 10px', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5,
            color: C.ghost, fontSize: 9, cursor: 'pointer', ...SYNE, fontWeight: 600,
          }}>{ex.label}</button>
        ))}
      </div>
    </div>
  );
}

// ── Loading screen ─────────────────────────────────────────────────────────────
function LoadingView({ type, id, step }: { type: string; id: string; step: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', border: '1px dashed rgba(196,124,46,0.3)', borderRadius: 12, marginTop: 24, background: 'rgba(196,124,46,0.02)' }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.07)', borderTopColor: C.amber, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 20 }} />
      <div className="poster-font" style={{ fontSize: 20, color: C.amber, letterSpacing: '0.06em', marginBottom: 14 }}>{type}/{id}</div>
      <div style={{ ...MONO, fontSize: 9, color: C.dim }}>{step}</div>
    </div>
  );
}

// ── Results view ───────────────────────────────────────────────────────────────
const RESULT_SECTIONS = [
  { key: 'nodes',    label: 'Nodes' },
  { key: 'format',   label: '★ Formats' },
  { key: 'burst',    label: '★ Burst' },
  { key: 'multirun', label: '★ Multi-Run' },
  { key: 'svg',      label: '★ SVG Info' },
  { key: 'health',   label: 'Health' },
  { key: 'timing',   label: 'Timing' },
  { key: 'log',      label: 'Log' },
] as const;
type ResultSection = typeof RESULT_SECTIONS[number]['key'];

function ResultsView({ bench, onBack, onRerun }: { bench: Benchmark; onBack: () => void; onRerun: () => void }) {
  const [section, setSection] = useState<ResultSection>('nodes');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={onBack} style={{ padding: '5px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: C.ghost, fontSize: 10, cursor: 'pointer', ...SYNE }}>← Back</button>
        <div className="poster-font" style={{ fontSize: 18, color: C.amber, letterSpacing: '0.06em' }}>{bench.inputType}/{bench.rawId}</div>
        {bench.queryParams && <code style={{ fontSize: 9, color: C.ghost, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 7px' }}>?{bench.queryParams}</code>}
        <Pill color={C.ghost}>{bench.format.toUpperCase()}</Pill>
        <button onClick={onRerun} style={{ marginLeft: 'auto', padding: '5px 12px', background: C.amber, border: 'none', borderRadius: 6, color: '#070706', fontSize: 10, cursor: 'pointer', ...SYNE, fontWeight: 700 }}>↻ Re-run</button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
        {[
          { l: 'Fastest POST', v: bench.summary.fastestMs != null ? `${bench.summary.fastestMs}ms` : '—', c: msColor(bench.summary.fastestMs) },
          { l: 'Best Node',    v: bench.summary.fastestLabel ?? '—', c: C.gold },
          { l: 'Nodes OK',     v: `${bench.summary.successCount}/${NODES.length}`, c: 'var(--film-cream)' },
          { l: 'URL-SVG',      v: bench.urlKb ? `${bench.urlKb}KB` : '—', c: C.green },
          { l: 'B64-SVG',      v: bench.b64Kb ? `${bench.b64Kb}KB` : '—', c: C.orange },
          { l: 'Complexity',   v: bench.svgInfo ? `${bench.svgInfo.complexityScore}/100` : '—', c: bench.svgInfo && bench.svgInfo.complexityScore > 60 ? C.orange : C.teal },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ padding: '10px 12px', background: 'var(--film-char)', border: `1px solid var(--film-border)`, borderRadius: 8 }}>
            <div style={{ ...MONO, fontSize: 7, color: C.ghost, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{l}</div>
            <div className="poster-font" style={{ fontSize: 18, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      <SummaryPanel bench={bench} />

      {/* Section tabs — scrollable */}
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none' as const }}>
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', minWidth: 'max-content' }}>
          {RESULT_SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)} style={{
              padding: '8px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: section === s.key ? C.amber : C.ghost, fontSize: 11, fontWeight: 600, ...SYNE,
              borderBottom: section === s.key ? `2px solid ${C.amber}` : '2px solid transparent', marginBottom: -1,
              whiteSpace: 'nowrap' as const,
            }}>{s.label}</button>
          ))}
        </div>
      </div>

      {section === 'nodes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
          {bench.nodes.map(n => <NodeCard key={n.id} node={n} urlKb={bench.urlKb} b64Kb={bench.b64Kb} />)}
        </div>
      )}

      {section === 'format' && <FormatComparePanel bench={bench} />}
      {section === 'burst'  && <BurstPanel bench={bench} />}
      {section === 'multirun' && <MultiRunPanel bench={bench} />}

      {section === 'svg' && (
        bench.svgInfo
          ? <SvgInspectorPanel info={bench.svgInfo} bench={bench} />
          : <div style={{ padding: 32, textAlign: 'center', color: C.ghost, ...MONO, fontSize: 11, border: '1px dashed rgba(196,124,46,0.2)', borderRadius: 8 }}>SVG could not be fetched — no inspector data available.</div>
      )}

      {section === 'health' && <HealthGrid nodes={bench.nodes} />}

      {section === 'timing' && (
        <div style={{ background: 'var(--film-mid)', border: `1px solid var(--film-border)`, borderRadius: 10, padding: 16 }}>
          <div style={{ ...SYNE, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.amber, marginBottom: 14 }}>Render Timing</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            {[{ c: C.blue, k: 'POST URL-SVG' }, { c: C.orange, k: 'POST B64-SVG' }, { c: C.ghost, k: 'GET ?url=' }].map(({ c, k }) => (
              <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, ...MONO, fontSize: 8, color: C.ghost }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                {k}
              </span>
            ))}
          </div>
          <TimingBars nodes={bench.nodes} />
        </div>
      )}

      {section === 'log' && (
        <div style={{ background: 'var(--film-mid)', border: `1px solid var(--film-border)`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, ...MONO, minWidth: 540 }}>
              <thead>
                <tr style={{ background: 'var(--film-mid)' }}>
                  {['Node','Via','Mode','Status','Time','Size','Note'].map(h => (
                    <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 7, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bench.nodes.flatMap(n => [
                  { node: n.label, color: n.color, via: n.http ? 'proxy' : 'direct', mode: 'POST URL-SVG', ...n.postUrl },
                  { node: n.label, color: n.color, via: n.http ? 'proxy' : 'direct', mode: 'POST B64-SVG', ...n.postB64 },
                  { node: n.label, color: n.color, via: n.http ? 'proxy' : 'direct', mode: 'GET ?url=',   ...n.getRaster },
                ]).map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                    <td style={{ padding: '5px 12px', color: 'var(--film-cream)', fontWeight: 600, borderLeft: `2px solid ${r.color}` }}>{r.node}</td>
                    <td style={{ padding: '5px 12px', color: r.via === 'proxy' ? C.teal : C.ghost, fontSize: 8 }}>{r.via}</td>
                    <td style={{ padding: '5px 12px', color: C.ghost }}>{r.mode}</td>
                    <td style={{ padding: '5px 12px' }}><span style={{ color: r.ok ? C.green : C.red, fontWeight: 700 }}>{r.ok ? '✓ OK' : '✗ FAIL'}</span></td>
                    <td style={{ padding: '5px 12px', color: r.ok ? msColor(r.ms) : C.ghost, fontWeight: r.ok ? 700 : 400 }}>{r.ok ? `${r.ms}ms` : '—'}</td>
                    <td style={{ padding: '5px 12px', color: r.sizeKb != null ? sizeColor(r.sizeKb) : C.ghost }}>{fmtKb(r.sizeKb)}</td>
                    <td style={{ padding: '5px 12px', color: C.ghost, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.note || (r.ok ? `HTTP ${r.status}` : '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SVG links */}
      <div style={{ padding: 14, background: 'var(--film-char)', border: `1px solid var(--film-border)`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'URL-SVG (no_embed=1)', href: bench.svgUrlRef },
          { label: 'B64-SVG (embedded)',   href: bench.svgUrlB64 },
        ].map(({ label, href }) => (
          <div key={label}>
            <div style={{ ...MONO, fontSize: 7, color: C.ghost, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
            <a href={href} target="_blank" rel="noreferrer" style={{ ...MONO, fontSize: 8, color: C.amber, wordBreak: 'break-all' as const, textDecoration: 'none', lineHeight: 1.6 }}>{href}</a>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', ...MONO, fontSize: 7, color: C.ghost }}>
        Completed {new Date(bench.timestamp).toLocaleTimeString()} · client-side timing via performance.now() · HTTP nodes via CF proxy · response sizes from ArrayBuffer.byteLength
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TestBenchmark() {
  const [mode,    setMode]    = useState<'search' | 'loading' | 'results'>('search');
  const [bench,   setBench]   = useState<Benchmark | null>(null);
  const [step,    setStep]    = useState('');
  const [error,   setError]   = useState('');
  const [lastRun, setLastRun] = useState<{ type: string; id: string; params: string; format: string } | null>(null);
  const blobUrls = useRef<string[]>([]);

  const cleanupBlobs = useCallback(() => {
    blobUrls.current.forEach(u => URL.revokeObjectURL(u));
    blobUrls.current = [];
  }, []);

  useEffect(() => () => cleanupBlobs(), [cleanupBlobs]);

  const go = useCallback(async (type: string, id: string, params: string, format: string) => {
    cleanupBlobs();
    setMode('loading');
    setError('');
    setBench(null);
    setLastRun({ type, id, params, format });
    try {
      const result = await runBenchmark(type, id, params, format, setStep);
      blobUrls.current = result.nodes.flatMap(n =>
        [n.postUrl.imageUrl, n.postB64.imageUrl, n.getRaster.imageUrl]
      ).filter(Boolean) as string[];
      setBench(result);
      setMode('results');
    } catch (e: any) {
      setError(e.message ?? 'Benchmark failed');
      setMode('search');
    }
  }, [cleanupBlobs]);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)', paddingTop: 56 }}>
      <style>{`
        @keyframes spin{100%{transform:rotate(360deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}

        /* Mobile responsive */
        @media(max-width:640px){
          .bench-main{padding:10px!important}
          .bench-header{padding:0 10px!important;gap:6px!important}
          .bench-node-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <MainNavbar fixed compactLogo />

      <div className="bench-header" style={{
        position: 'sticky', top: 56, zIndex: 40,
        background: 'rgba(7,7,6,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--film-border)',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div className="poster-font" style={{ fontSize: 15, color: C.amber, letterSpacing: '0.06em' }}>
          Rasterizer Benchmark
        </div>
        <span style={{ ...MONO, fontSize: 7, color: C.ghost }}>
          {mode === 'loading' ? `TESTING · ${lastRun?.type}/${lastRun?.id}`
            : mode === 'results' ? 'POST URL · POST B64 · GET · Formats · Burst · Multi-run'
            : 'v5 — response sizes · SVG inspector · format compare · burst test · multi-run'}
        </span>
        {mode === 'results' && (
          <button onClick={() => { setMode('search'); setBench(null); }} style={{
            marginLeft: 'auto', padding: '4px 10px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, color: C.ghost,
            fontSize: 9, cursor: 'pointer', ...SYNE,
          }}>← New test</button>
        )}
      </div>

      <main className="bench-main" style={{ padding: 16, maxWidth: 1280, margin: '0 auto' }}>
        {error && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', color: C.red, fontSize: 11, ...MONO }}>
            ✕ {error}
          </div>
        )}

        {mode === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <AmberTag style={{ marginBottom: 8 }}>Client-Side Node Benchmark v5</AmberTag>
              <p className="body-font" style={{ fontSize: 13, color: 'var(--film-text-dim)', maxWidth: 640, lineHeight: 1.7 }}>
                Tests all rasterizer nodes with <strong>POST URL-SVG</strong> and <strong>POST B64-SVG</strong>, plus <strong>GET ?url=</strong>. Then dive into <strong>Format Compare</strong> (PNG/WebP/JPG timing + sizes), <strong>Burst Test</strong> (N concurrent requests waterfall), <strong>Multi-Run Stats</strong> (variance analysis), and the <strong>SVG Inspector</strong> (payload breakdown, complexity score).
              </p>
            </div>
            <SearchForm onRun={go} />
          </div>
        )}

        {mode === 'loading' && lastRun && <LoadingView type={lastRun.type} id={lastRun.id} step={step} />}

        {mode === 'results' && bench && (
          <ResultsView bench={bench}
            onBack={() => { setMode('search'); setBench(null); }}
            onRerun={() => lastRun && go(lastRun.type, lastRun.id, lastRun.params, lastRun.format)} />
        )}
      </main>
    </div>
  );
}
