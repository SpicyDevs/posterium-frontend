// src/components/admin/TestBenchmark.tsx
//
// v6 — Server-side fleet benchmark + real LB ladder:
//   • NODES registry matches rasterise/assets/nodes.config.js (washington,
//     ohio, midas, germany, danbot, wsrv, france, render_eu) with real tiers
//   • Node bench runs entirely server-side (POST /admin/nodes/benchmark) —
//     browsers cannot reach the fleet directly (mixed-content http nodes,
//     opaque cross-origin 302s, CORS), so no client-side node probes
//   • Health merged from GET /admin/nodes/health (server-side probes)
//   • Production LB ladder test: POST /admin/nodes/lb relays the same SVG
//     through the RASTERIZER service binding (Worker B) with
//     X-Fallback-Image-Url set; reports attempts/source/wall/colo, and the
//     X-Fallback-Fired header when the 302 original-poster fallback fired
//   • Cache-bust toggle: unique cb param = fresh renders (cf-cache-status
//     shown on the SVG fetches); fixed cb = tier cache HIT on re-runs
//   • wsrv special-cased (output= param, no /health endpoint)

import React, { useState, useCallback, useRef, useEffect } from 'react';
import MainNavbar from '@/modules/MainNavbar';
import { AmberTag } from '@/ui/primitives';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';

const API_BASE   = DEFAULT_API_BASE;
const LB_BASE    = `${API_BASE}/admin/nodes/lb?pass=Aayush1234`;
const TIMEOUT_MS = 25_000;

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  amber:  '#c47c2e', gold:   '#d4a245', cream: '#f0e6cc',
  green:  '#4ade80', red:    '#f87171', orange:'#fb923c',
  yellow: '#facc15', blue:   '#60a5fa', purple:'#a78bfa',
  teal:   '#2dd4bf', pink:   '#f472b6', ghost: 'rgba(140,130,112,0.45)',
  dim:    'rgba(180,168,148,0.65)',
  bg:     'var(--film-dark)',  mid:    'var(--film-mid)',
  char:   'var(--film-char)', border: 'var(--film-border)',
};

// ── Node registry — mirrors rasterize-node fleet ──────────────────────────────
const NODES = [
  { id:'washington', label:'US East (Vercel)',     tier:1, tag:'vercel',   region:'Virginia, US', url:'https://us-r-vercel.vercel.app',     path:'/api/rasterize', http:false, color:'#a78bfa', health:true },
  { id:'ohio',       label:'US Central (Netlify)', tier:1, tag:'netlify',  region:'Ohio, US',     url:'https://r-netlify.netlify.app',      path:'/api/rasterize', http:false, color:'#f472b6', health:true },
  { id:'midas',      label:'DE 2 (Midas)',         tier:1, tag:'midas',    region:'Germany',      url:'http://node-3.midas.host:25108',     path:'',               http:true,  color:'#4ade80', health:true },
  { id:'germany',    label:'DE 20 (Spaceify)',     tier:1, tag:'spaceify', region:'Germany',      url:'http://de20.spaceify.eu:26100',      path:'',               http:true,  color:'#60a5fa', health:true },
  { id:'danbot',     label:'DanBot EU',            tier:1, tag:'danbot',   region:'EU',           url:'http://dono-01.danbot.host:1751',    path:'',               http:true,  color:'#fb923c', health:true },
  { id:'wsrv',       label:'wsrv.nl (CDN)',        tier:1, tag:'wsrv',     region:'Global (CDN)', url:'https://wsrv.nl',                    path:'',               http:false, color:'#facc15', health:false },
  { id:'france',     label:'FR 1 (Spaceify)',      tier:2, tag:'spaceify', region:'France',       url:'http://fr1.spaceify.eu:25980',       path:'',               http:true,  color:'#2dd4bf', health:true },
  { id:'render_eu',  label:'EUC (Render)',         tier:2, tag:'render',   region:'EU Central',   url:'https://euc-r-render.onrender.com',  path:'',               http:false, color:'#fb923c', health:true },
] as const;

const EXAMPLES = [
  { label:'Inception',      type:'movie', id:'tt1375666',  params:'r=imdb,rt' },
  { label:'Breaking Bad',   type:'tv',    id:'tt0903747',  params:'r=imdb,tmdb' },
  { label:'Attack on Titan',type:'anime', id:'16498',       params:'r=mal,anilist' },
  { label:'Dune: Part Two', type:'movie', id:'tt15239678', params:'r=imdb,rt,age' },
  { label:'The Bear',       type:'tv',    id:'136315',      params:'r=imdb,tmdb,rt' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FetchResult {
  ok:boolean; ms:number; status:number; note:string; imageUrl:string|null;
  fallback?:string|null;
  attempts?:number|null; rasterSource?:string|null; wallMs?:number|null;
  colo?:string|null; cacheStatus?:string|null;
}
interface LbResult {
  ok:boolean; ms:number; status:number; note:string; imageUrl:string|null;
  attempts:number|null; rasterSource:string|null; wallMs:number|null;
  colo:string|null; cacheStatus:string|null; fallback:string|null;
}
interface HealthData {
  reachable: boolean;
  skipped?: boolean;
  status?: string; version?: string; node?: string;
  activeJobs?: number; queuedJobs?: number; workerCount?: number;
  pendingRespawns?: number; uptime?: number; maxConcurrent?: number;
  fontReady?: boolean; fontDefault?: string; fontFiles?: string[];
  iconCache?: { loaded:boolean; iconCount:number; fetchedAt:number|null; ageMs:number|null; lastError:string|null; inflight:boolean };
  error?: string;
}
interface NodeResult {
  id: string; label: string; url: string; tier: number; tag: string;
  region: string; http: boolean; color: string;
  health: HealthData;
  postUrl: FetchResult;
  postB64: FetchResult;
  getRaster: FetchResult;
}
interface Benchmark {
  inputType:string; rawId:string; queryParams:string; format:string;
  svgUrlRef:string; svgUrlB64:string; urlKb:number; b64Kb:number;
  svgRefCacheStatus:string|null; svgB64CacheStatus:string|null;
  bustCache:boolean;
  lb: LbResult;
  nodes: NodeResult[];
  summary: { fastestMs:number|null; fastestLabel:string|null; successCount:number };
  serverNote: string;
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMs = (ms:number|null) =>
  ms == null || ms <= 0 ? '—' : ms >= 1000 ? `${(ms/1000).toFixed(2)}s` : `${ms}ms`;

const msColor = (ms:number|null) => {
  if (!ms) return C.ghost;
  if (ms < 500)  return C.green;
  if (ms < 1200) return C.yellow;
  if (ms < 3000) return C.orange;
  return C.red;
};

async function fetchWithImage(url:string, opts:RequestInit={}): Promise<FetchResult> {
  const t0 = performance.now();
  try {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(url, { ...opts, signal: ac.signal });
    clearTimeout(tm);
    const ms = Math.round(performance.now() - t0);
    // LB/node diagnostics headers (absent on plain node responses)
    const cacheStatus   = res.headers.get('cf-cache-status');
    const rasterSource  = res.headers.get('x-raster-source');
    const attemptsRaw   = res.headers.get('x-attempt-count');
    const wallMsRaw     = res.headers.get('x-wall-ms');
    const colo          = res.headers.get('x-cf-colo');
    const renderFb      = res.headers.get('x-render-fallback');
    const fbFired       = res.headers.get('x-fallback-fired');
    const attempts      = attemptsRaw ? parseInt(attemptsRaw, 10) || null : null;
    const wallMs        = wallMsRaw ? parseInt(wallMsRaw, 10) || null : null;
    const meta = {
      cacheStatus, rasterSource, attempts, wallMs, colo,
      fallback: renderFb || (fbFired ? 'poster fallback' : null),
    };
    if (!res.ok) {
      await res.body?.cancel().catch(()=>{});
      return { ok:false, ms, status:res.status, note:`HTTP ${res.status}`, imageUrl:null, ...meta };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      const txt = await res.text();
      return { ok:false, ms, status:res.status, note:`Non-image (${ct.split(';')[0]}): ${txt.slice(0,80)}`, imageUrl:null, ...meta };
    }
    const buf = await res.arrayBuffer();
    return { ok:true, ms, status:res.status, note:'', imageUrl: URL.createObjectURL(new Blob([buf],{type:ct})), ...meta };
  } catch(e:any) {
    return { ok:false, ms:Math.round(performance.now()-t0), status:0,
      note: e.name==='AbortError' ? `Timeout ${TIMEOUT_MS}ms` : e.message, imageUrl:null };
  }
}

// Server-side fleet health —  backend probes every node (/admin/nodes/health),
// browsers can't reach the raw fleet directly (mixed-content http nodes, CORS).
async function fetchFleetHealth(): Promise<Record<string, HealthData>> {
  try {
    const res = await fetch(`${API_BASE}/admin/nodes/health?pass=Aayush1234`, {
      headers: { 'X-Admin-Token': 'Aayush1234' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.health || {}) as Record<string, HealthData>;
  } catch {
    return {};
  }
}

// Production LB ladder test via the backend relay (/admin/nodes/lb): the
// backend re-fetches the fresh SVG + original poster URL, POSTs them to
// Worker B through the RASTERIZER service binding with X-Fallback-Image-Url
// set, and streams back the raster — or, when the whole fleet fails, the
// original poster with X-Fallback-Fired: 1 (fallback protection, never 502).
async function benchLb(
  inputType:string, rawId:string, params:string, format:string,
): Promise<LbResult> {
  const r = await fetchWithImage(LB_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputType, rawId, format, params }),
  });
  return {
    ok: r.ok,
    ms: r.ms,
    status: r.status,
    note: r.ok
      ? (r.fallback
          ? 'All nodes exhausted → served original poster (fallback protection OK)'
          : 'Ladder served a raster')
      : r.note.slice(0, 120) || `HTTP ${r.status}`,
    imageUrl: r.imageUrl,
    attempts: r.attempts ?? null,
    rasterSource: r.rasterSource ?? null,
    wallMs: r.wallMs ?? null,
    colo: r.colo ?? null,
    cacheStatus: r.cacheStatus ?? null,
    fallback: r.fallback ?? null,
  };
}

async function runBenchmark(
  inputType:string, rawId:string, params:string, format:string, bustCache:boolean,
  onStep:(s:string)=>void,
): Promise<Benchmark> {
  const cb = bustCache ? Date.now() : 'fixed';
  const qs = `${params ? params+'&' : ''}cb=${cb}`;
  const svgUrlRef = `${API_BASE}/${inputType}/${rawId}.svg?${qs}&no_embed=1`;
  const svgUrlB64 = `${API_BASE}/${inputType}/${rawId}.svg?${qs}`;

  onStep('Fetching SVG variants…');
  const [urlRes, b64Res] = await Promise.all([
    fetch(svgUrlRef, { signal:AbortSignal.timeout(8_000) }).catch(()=>null),
    fetch(svgUrlB64, { signal:AbortSignal.timeout(8_000) }).catch(()=>null),
  ]);
  const svgRefCacheStatus = urlRes?.ok ? urlRes.headers.get('cf-cache-status') : null;
  const svgB64CacheStatus = b64Res?.ok ? b64Res.headers.get('cf-cache-status') : null;
  const urlSvg  = urlRes?.ok ? await urlRes.text() : '';
  const b64Svg  = b64Res?.ok ? await b64Res.text() : '';
  const urlKb   = urlSvg ? Math.round(new Blob([urlSvg]).size/1024) : 0;
  const b64Kb   = b64Svg ? Math.round(new Blob([b64Svg]).size/1024) : 0;

  onStep('Probing fleet health server-side…');
  const healthMap = await fetchFleetHealth();

  onStep('Benchmarking nodes via server-side balancer…');
  let nodes: NodeResult[] = [];
  let serverNote = '';
  let serverUrlKb: number | undefined;
  let serverB64Kb: number | undefined;
  try {
    const res = await fetch(`${API_BASE}/admin/nodes/benchmark?pass=Aayush1234`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputType, rawId, format, params }),
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      const data = await res.json();
      serverUrlKb = data.urlKb;
      serverB64Kb = data.b64Kb;
      nodes = (data.nodes || []).map((n: any): NodeResult => {
        const reg = NODES.find(x => x.id === n.id);
        return {
          ...n,
          url: reg?.url ?? n.url ?? '',
          http: reg?.http ?? false,
          health: healthMap[n.id] ?? { reachable: false, error: 'no health data' },
          postUrl: n.postUrl || { ok: false, ms: 0, status: 0, note: 'Unavailable', imageUrl: null },
          postB64: n.postB64 || { ok: false, ms: 0, status: 0, note: 'Unavailable', imageUrl: null },
          getRaster: n.getRaster || { ok: false, ms: 0, status: 0, note: 'Unavailable', imageUrl: null },
        };
      });
    } else {
      serverNote = `benchmark: HTTP ${res.status}`;
    }
  } catch(e:any) {
    serverNote = `benchmark: ${e.message}`;
  }

  // Fallback: no server-side bench available — still show health + LB ladder.
  if (!nodes.length) {
    nodes = NODES.map((n): NodeResult => ({
      id: n.id, label: n.label, url: n.url, tier: n.tier, tag: n.tag,
      region: n.region, http: n.http, color: n.color,
      health: healthMap[n.id]
        ?? (n.health
            ? { reachable: false, error: serverNote || 'unreachable' }
            : { reachable: false, skipped: true, error: 'no /health endpoint' }),
      postUrl:   { ok: false, ms: 0, status: 0, note: serverNote || 'server-side benchmark unavailable', imageUrl: null },
      postB64:   { ok: false, ms: 0, status: 0, note: serverNote || 'server-side benchmark unavailable', imageUrl: null },
      getRaster: { ok: false, ms: 0, status: 0, note: serverNote || 'server-side benchmark unavailable', imageUrl: null },
    }));
  }

  onStep('Testing production LB ladder (via Worker B relay)…');
  const lb = await benchLb(inputType, rawId, params, format);

  const allMs = nodes.flatMap(n =>
    [n.postUrl, n.postB64].filter(r => r.ok).map(r => r.ms)
  );
  const fastestMs = allMs.length ? Math.min(...allMs) : null;
  const fastestLabel = fastestMs != null
    ? (nodes.find(n => [n.postUrl,n.postB64].some(r=>r.ok&&r.ms===fastestMs))?.label ?? null)
    : null;

  return {
    inputType, rawId, queryParams:params, format,
    svgUrlRef, svgUrlB64,
    urlKb: serverUrlKb ?? urlKb, b64Kb: serverB64Kb ?? b64Kb,
    svgRefCacheStatus, svgB64CacheStatus, bustCache,
    lb, nodes,
    summary: { fastestMs, fastestLabel, successCount: nodes.filter(n=>n.postUrl.ok||n.postB64.ok).length },
    serverNote,
    timestamp: new Date().toISOString(),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily:'JetBrains Mono, monospace' };
const SYNE: React.CSSProperties = { fontFamily:'Syne, sans-serif' };

function Label({ children, size=7 }:{ children:React.ReactNode; size?:number }) {
  return <span style={{...MONO, fontSize:size, color:C.ghost, letterSpacing:'0.14em', textTransform:'uppercase'}}>{children}</span>;
}

function Pill({ color, children }:{ color:string; children:React.ReactNode }) {
  return (
    <span style={{...MONO, fontSize:7, color, background:`${color}18`, border:`1px solid ${color}30`,
      borderRadius:3, padding:'1px 5px', whiteSpace:'nowrap'}}>
      {children}
    </span>
  );
}

function StatusDot({ ok, size=6 }:{ ok:boolean; size?:number }) {
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%',
    background: ok ? C.green : C.red, flexShrink:0 }} />;
}

// Icon cache badge — prominently shows cache health
function IconCacheStatus({ h }:{ h:HealthData }) {
  if (!h.reachable) return <Pill color={C.ghost}>offline</Pill>;
  const ic = h.iconCache;
  if (!ic) return <Pill color={C.orange}>no cache data</Pill>;
  if (!ic.loaded) {
    const err = ic.lastError ? ic.lastError.slice(0,40) : 'not loaded';
    return <Pill color={C.red}>icons: ✗ {err}</Pill>;
  }
  const ageMin = ic.ageMs ? Math.round(ic.ageMs/60000) : null;
  const ageStr = ageMin !== null ? (ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin/60)}h ago`) : '';
  return <Pill color={C.green}>icons: {ic.iconCount} {ageStr && `· ${ageStr}`}</Pill>;
}

function FontStatus({ h }:{ h:HealthData }) {
  if (!h.reachable) return null;
  const ready = h.fontReady ?? (h.fontFiles ? h.fontFiles.length > 0 : h.fontDefault ? true : undefined);
  if (ready === undefined) return <Pill color={C.ghost}>font: ?</Pill>;
  return <Pill color={ready ? C.green : C.red}>font: {ready ? h.fontDefault?.split(',')[0] || '✓' : '✗'}</Pill>;
}

function WorkerStatus({ h }:{ h:HealthData }) {
  if (!h.reachable || h.workerCount === undefined) return null;
  const busy = h.activeJobs ?? 0;
  const queue = h.queuedJobs ?? 0;
  const respawn = h.pendingRespawns ?? 0;
  const color = respawn > 0 ? C.orange : busy > 0 ? C.yellow : C.teal;
  const txt = [
    `${h.workerCount}w`,
    busy > 0 && `${busy} active`,
    queue > 0 && `${queue} queued`,
    respawn > 0 && `⚠ ${respawn} respawn`,
  ].filter(Boolean).join(' · ');
  return <Pill color={color}>{txt}</Pill>;
}

function UptimeStatus({ h }:{ h:HealthData }) {
  if (!h.uptime) return null;
  const hr = Math.floor(h.uptime/3600);
  const min = Math.floor((h.uptime%3600)/60);
  return <Pill color={C.blue}>up {hr>0?`${hr}h ${min}m`:`${min}m`}</Pill>;
}

// Compact image cell showing the poster + timing badge
function PosterCell({ result, label, badge }:{ result:FetchResult; label:string; badge?:string }) {
  return (
    <div style={{ flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
        <Label>{label}</Label>
        {badge && <span style={{...MONO, fontSize:7, color:C.ghost}}>{badge}</span>}
      </div>
      <div style={{ position:'relative', aspectRatio:'2/3', borderRadius:6, overflow:'hidden',
        background:'#0a0a09', border:`1px solid ${C.border}` }}>
        {result.ok && result.imageUrl ? (
          <>
            <img src={result.imageUrl} alt={label}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            <div style={{ position:'absolute', bottom:4, right:4, display:'flex', gap:3 }}>
              {result.fallback && (
                <span style={{ ...MONO, fontSize:7, fontWeight:700,
                  color:'#f59e0b', background:'rgba(0,0,0,0.85)',
                  padding:'2px 5px', borderRadius:3 }}>
                  ⚠ {result.fallback}
                </span>
              )}
              <span style={{ ...MONO, fontSize:8, fontWeight:700,
                color:msColor(result.ms), background:'rgba(0,0,0,0.85)',
                padding:'2px 5px', borderRadius:3 }}>
                {result.ms}ms
              </span>
            </div>
          </>
        ) : (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:4 }}>
            <span style={{ color:C.red, fontSize:16 }}>✗</span>
            <span style={{ ...MONO, fontSize:7, color:C.red, textAlign:'center',
              padding:'0 6px', lineHeight:1.5 }}>
              {result.note.slice(0,60)}
            </span>
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        <Pill color={result.ok ? msColor(result.ms) : C.red}>
          {result.ok ? `${result.ms}ms` : 'FAIL'}
        </Pill>
        {result.ok && <Pill color={C.ghost}>HTTP {result.status}</Pill>}
        {result.cacheStatus && (
          <Pill color={result.cacheStatus === 'HIT' ? C.green : C.orange}>{result.cacheStatus}</Pill>
        )}
        {result.fallback && <Pill color="#f59e0b">wsrv fallback</Pill>}
      </div>
    </div>
  );
}

// Per-node card — the main display unit
function NodeCard({ node, urlKb, b64Kb }:{ node:NodeResult; urlKb:number; b64Kb:number }) {
  const h = node.health;
  const reachable = h.reachable;
  const delta = (node.postUrl.ok && node.postB64.ok) ? node.postB64.ms - node.postUrl.ms : null;
  const hasAny = node.postUrl.ok || node.postB64.ok || node.getRaster.ok;

  return (
    <div style={{ background:C.char, border:`1px solid ${hasAny ? C.border : 'rgba(248,113,113,0.2)'}`,
      borderLeft:`3px solid ${node.color}`, borderRadius:8, overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'10px 12px', borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
          <div>
            <div style={{ ...MONO, fontSize:11, fontWeight:700, color:'var(--film-cream)' }}>
              {node.label}
            </div>
            <div style={{ ...MONO, fontSize:7, color:C.ghost, marginTop:1 }}>
              {node.region}
              <span style={{ color:C.teal, marginLeft:5 }}>· server-side probe</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
            <Pill color={node.color}>{node.tag}</Pill>
            <Pill color={node.tier === 1 ? C.blue : C.purple}>T{node.tier}</Pill>
            {h.skipped && <Pill color={C.ghost}>no health</Pill>}
            {!reachable && !h.skipped && <Pill color={C.red}>offline</Pill>}
          </div>
        </div>

        {/* Health badges row */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          <IconCacheStatus h={h} />
          <FontStatus h={h} />
          <WorkerStatus h={h} />
          <UptimeStatus h={h} />
          {reachable && h.version && <Pill color={C.ghost}>v{h.version}</Pill>}
          {!reachable && h.error && (
            <span style={{ ...MONO, fontSize:7, color:C.red }}>{h.error.slice(0,60)}</span>
        )}
      </div>
      </div>

      {/* Poster comparison: POST URL-SVG vs POST B64-SVG */}
      <div style={{ padding:'10px 12px', borderBottom:`1px solid rgba(255,255,255,0.05)` }}>
        <div style={{ display:'flex', gap:10 }}>
          <PosterCell result={node.postUrl} label="POST URL-SVG" badge={`${urlKb}KB`} />
          <PosterCell result={node.postB64} label="POST B64-SVG" badge={`${b64Kb}KB`} />
        </div>

        {/* Delta annotation */}
        {delta !== null && (
          <div style={{ marginTop:8, padding:'6px 8px', borderRadius:4,
            background: Math.abs(delta) > 200 ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.03)',
            border:`1px solid ${Math.abs(delta) > 200 ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <span style={{ ...MONO, fontSize:8, color: delta > 0 ? C.orange : C.green }}>
              B64 is {delta > 0 ? `+${delta}ms slower` : `${Math.abs(delta)}ms faster`} than URL-SVG
            </span>
            <span style={{ ...MONO, fontSize:7, color:C.ghost, marginLeft:8 }}>
              (+{b64Kb-urlKb}KB overhead)
            </span>
          </div>
        )}
      </div>

      {/* GET rasterisation — bottom, slowest path */}
      <div style={{ padding:'10px 12px' }}>
        <Label size={7}>GET ?url= (node fetches SVG)</Label>
        <div style={{ marginTop:6, display:'flex', gap:10, alignItems:'flex-start' }}>
          <div style={{ flex:'0 0 80px', position:'relative', aspectRatio:'2/3', borderRadius:4,
            overflow:'hidden', background:'#0a0a09', border:`1px solid ${C.border}` }}>
            {node.getRaster.ok && node.getRaster.imageUrl ? (
              <>
                <img src={node.getRaster.imageUrl} alt="GET"
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                <div style={{ position:'absolute', bottom:2, right:2, ...MONO, fontSize:7, fontWeight:700,
                  color:msColor(node.getRaster.ms), background:'rgba(0,0,0,0.9)', padding:'1px 3px', borderRadius:2 }}>
                  {node.getRaster.ms}ms
                </div>
              </>
            ) : (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
                justifyContent:'center', color:C.red, fontSize:14 }}>✗</div>
            )}
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
            <Pill color={node.getRaster.ok ? msColor(node.getRaster.ms) : C.red}>
              {node.getRaster.ok ? `${node.getRaster.ms}ms` : 'FAIL'}
            </Pill>
            {!node.getRaster.ok && node.getRaster.note && (
              <span style={{ ...MONO, fontSize:7, color:C.red, lineHeight:1.5 }}>
                {node.getRaster.note.slice(0,80)}
              </span>
            )}
            {node.getRaster.ok && node.postUrl.ok && (
              <span style={{ ...MONO, fontSize:7, color:C.ghost }}>
                {node.getRaster.ms - node.postUrl.ms > 0
                  ? `+${node.getRaster.ms - node.postUrl.ms}ms vs POST URL`
                  : `${Math.abs(node.getRaster.ms - node.postUrl.ms)}ms faster than POST URL`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary panel
function SummaryPanel({ bench }:{ bench:Benchmark }) {
  const postMs = bench.nodes.filter(n=>n.postUrl.ok && !n.postUrl.fallback).map(n=>n.postUrl.ms);
  const b64Ms  = bench.nodes.filter(n=>n.postB64.ok && !n.postB64.fallback).map(n=>n.postB64.ms);
  const getMs  = bench.nodes.filter(n=>n.getRaster.ok && !n.getRaster.fallback).map(n=>n.getRaster.ms);
  const fallbackNodes = bench.nodes.filter(n=>n.postUrl.fallback || n.postB64.fallback || n.getRaster.fallback);

  const avg = (arr:number[]) => arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : null;
  const min = (arr:number[]) => arr.length ? Math.min(...arr) : null;
  const max = (arr:number[]) => arr.length ? Math.max(...arr) : null;

  const rows = [
    { label:'POST URL-SVG', ms:postMs, kb:bench.urlKb, color:C.blue },
    { label:'POST B64-SVG', ms:b64Ms,  kb:bench.b64Kb, color:C.orange },
    { label:'GET ?url=',    ms:getMs,  kb:0,            color:C.ghost },
  ];

  return (
    <div style={{ background:C.char, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
      <div style={{ padding:'8px 12px', borderBottom:`1px solid rgba(255,255,255,0.05)`,
        ...SYNE, fontSize:8, fontWeight:700, letterSpacing:'0.14em',
        textTransform:'uppercase', color:C.amber }}>
        Method Comparison
      </div>
      <div style={{ padding:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, marginBottom:8 }}>
          {['Method','Avg','Min','Max','Size','OK'].map(h => (
            <span key={h} style={{ ...MONO, fontSize:6, color:C.ghost, padding:'3px 0' }}>{h}</span>
          ))}
          {/* spacer for 6 cols */}
          {rows.map(r => [
            <span key={r.label+'l'} style={{ ...MONO, fontSize:8, color:r.color, gridColumn:'1/4' }}>{r.label}</span>,
          ])}
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:9 }}>
          <thead>
            <tr>
              {['Method','Avg','Min','Max','Payload','Nodes OK'].map(h=>(
                <th key={h} style={{ ...MONO, fontSize:6, color:C.ghost, textAlign:'left',
                  padding:'4px 6px', borderBottom:`1px solid rgba(255,255,255,0.05)` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label}>
                <td style={{ ...MONO, fontSize:8, color:r.color, padding:'5px 6px' }}>{r.label}</td>
                <td style={{ ...MONO, fontSize:9, color:msColor(avg(r.ms)), padding:'5px 6px', fontWeight:700 }}>{fmtMs(avg(r.ms))}</td>
                <td style={{ ...MONO, fontSize:9, color:msColor(min(r.ms)), padding:'5px 6px' }}>{fmtMs(min(r.ms))}</td>
                <td style={{ ...MONO, fontSize:9, color:msColor(max(r.ms)), padding:'5px 6px' }}>{fmtMs(max(r.ms))}</td>
                <td style={{ ...MONO, fontSize:8, color:r.kb > 0 ? (r.kb > 20 ? C.orange : C.green) : C.ghost, padding:'5px 6px' }}>
                  {r.kb > 0 ? `${r.kb}KB` : '—'}
                </td>
                <td style={{ ...MONO, fontSize:9, color:'var(--film-cream)', padding:'5px 6px' }}>
                  {r.ms.length}/{NODES.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Overhead row */}
        {bench.urlKb > 0 && bench.b64Kb > 0 && (
          <div style={{ marginTop:10, padding:'6px 8px', borderRadius:4,
            background:'rgba(251,146,60,0.05)', border:'1px solid rgba(251,146,60,0.15)' }}>
            <span style={{ ...MONO, fontSize:8, color:C.orange }}>
              B64 payload is {bench.b64Kb - bench.urlKb}KB larger (+{Math.round((bench.b64Kb/bench.urlKb-1)*100)}%)
            </span>
            <span style={{ ...MONO, fontSize:7, color:C.ghost, marginLeft:8 }}>
              · {bench.urlKb}KB (URL-SVG) vs {bench.b64Kb}KB (B64-SVG)
            </span>
          </div>
        )}

        {/* Fallback warning — excluded from clean averages */}
        {fallbackNodes.length > 0 && (
          <div style={{ marginTop:10, padding:'6px 8px', borderRadius:4,
            background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
            <span style={{ ...MONO, fontSize:8, color:'#f59e0b' }}>
              ⚠ {fallbackNodes.length} node{fallbackNodes.length > 1 ? 's' : ''} used wsrv fallback — excluded from averages
            </span>
            <span style={{ ...MONO, fontSize:7, color:C.ghost, marginLeft:8 }}>
              · {fallbackNodes.map(n => n.label).join(' · ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Health grid — shows all nodes' health data in a dense grid
function HealthGrid({ nodes }:{ nodes:NodeResult[] }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
      {nodes.map(n => {
        const h = n.health;
        const ic = h.iconCache;
        return (
          <div key={n.id} style={{ padding:'10px 12px', background:C.char,
            border:`1px solid ${h.reachable ? C.border : 'rgba(248,113,113,0.2)'}`,
            borderLeft:`3px solid ${n.color}`, borderRadius:7 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ ...MONO, fontSize:10, fontWeight:700, color:'var(--film-cream)' }}>{n.label}</span>
              {h.skipped ? <Pill color={C.ghost}>no health</Pill> : <StatusDot ok={h.reachable} />}
            </div>
            {!h.reachable && !h.skipped && (
              <span style={{ ...MONO, fontSize:7, color:C.red }}>{h.error?.slice(0,60)}</span>
            )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 8px' }}>
                {[
                  { l:'Status',   v: h.status || 'ok',            c: h.status==='ok' ? C.green : C.orange },
                  { l:'Version',  v: h.version || '—',            c: C.ghost },
                  { l:'Icons',    v: ic?.loaded ? `✓ ${ic.iconCount}` : ic ? `✗ ${ic.lastError?.slice(0,20)||'missing'}` : '—',
                                  c: ic?.loaded ? C.green : ic ? C.red : C.ghost },
                  { l:'Icon age', v: ic?.ageMs ? (ic.ageMs<3600000 ? `${Math.round(ic.ageMs/60000)}m` : `${Math.round(ic.ageMs/3600000)}h`) : '—',
                                  c: ic?.ageMs && ic.ageMs > 23*3600000 ? C.orange : C.ghost },
                  { l:'Font',     v: h.fontReady !== undefined
                                    ? (h.fontReady ? (h.fontDefault?.split(',')[0]||'✓') : '✗')
                                    : (h.fontDefault ? h.fontDefault.split(',')[0] : h.fontFiles?.length ? '✓' : '—'),
                                  c: (h.fontReady ?? (h.fontDefault||h.fontFiles?.length)) ? C.green : C.red },
                  { l:'Workers',  v: h.workerCount !== undefined ? String(h.workerCount) : '—', c: C.blue },
                  { l:'Active',   v: h.activeJobs  !== undefined ? String(h.activeJobs)  : '—',
                                  c: (h.activeJobs||0) > 0 ? C.yellow : C.ghost },
                  { l:'Queue',    v: h.queuedJobs  !== undefined ? String(h.queuedJobs)  : '—',
                                  c: (h.queuedJobs||0) > 0 ? C.orange : C.ghost },
                  { l:'Respawns', v: h.pendingRespawns !== undefined ? String(h.pendingRespawns) : '—',
                                  c: (h.pendingRespawns||0) > 0 ? C.red : C.ghost },
                  { l:'Uptime',   v: h.uptime ? (h.uptime>=3600 ? `${Math.floor(h.uptime/3600)}h` : `${Math.floor(h.uptime/60)}m`) : '—',
                                  c: C.teal },
                  { l:'Max conc', v: h.maxConcurrent !== undefined ? String(h.maxConcurrent) : '—', c: C.ghost },
                  { l:'Node ID',  v: h.node || '—', c: C.dim },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ display:'flex', flexDirection:'column', gap:1 }}>
                    <span style={{ ...MONO, fontSize:6, color:C.ghost, letterSpacing:'0.1em' }}>{l}</span>
                    <span style={{ ...MONO, fontSize:8, color:c, fontWeight:600, overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
                  </div>
                ))}
              </div>
          </div>
        );
      })}
    </div>
  );
}

// Timing bar chart (pure CSS, no library dependency)
function TimingBars({ nodes }:{ nodes:NodeResult[] }) {
  const maxMs = Math.max(
    ...nodes.flatMap(n => [n.postUrl, n.postB64, n.getRaster].filter(r=>r.ok).map(r=>r.ms)),
    1,
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {nodes.map(n => (
        <div key={n.id}>
          <div style={{ ...MONO, fontSize:8, color:'var(--film-cream)', marginBottom:4, fontWeight:600 }}>
            {n.label}
            <span style={{ color:C.ghost, fontWeight:400, marginLeft:6 }}>{n.region}</span>
          </div>
          {[
            { r:n.postUrl,   label:'POST URL', color:C.blue },
            { r:n.postB64,   label:'POST B64', color:C.orange },
            { r:n.getRaster, label:'GET',       color:C.ghost },
          ].map(({ r, label }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              <span style={{ ...MONO, fontSize:7, color:C.ghost, minWidth:54 }}>{label}</span>
              <div style={{ flex:1, height:8, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                {r.ok && (
                  <div style={{ height:'100%', width:`${(r.ms/maxMs)*100}%`,
                    background:msColor(r.ms), borderRadius:2,
                    transition:'width 0.5s ease' }} />
                )}
              </div>
              <span style={{ ...MONO, fontSize:8, fontWeight:700, minWidth:50, textAlign:'right',
                color: r.ok ? msColor(r.ms) : C.red }}>
                {r.ok ? fmtMs(r.ms) : 'FAIL'}
              </span>
              {!r.ok && <span style={{ ...MONO, fontSize:7, color:C.red }}>{r.note.slice(0,40)}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Search form
function SearchForm({ onRun }:{ onRun:(t:string,i:string,p:string,f:string,bust:boolean)=>void }) {
  const [type,   setType]   = useState('movie');
  const [id,     setId]     = useState('');
  const [params, setParams] = useState('r=imdb,rt');
  const [format, setFormat] = useState('png');
  const [bustCache, setBustCache] = useState(true);

  const run = () => id.trim() && onRun(type, id.trim(), params.trim(), format, bustCache);
  const base: React.CSSProperties = {
    width:'100%', height:38, padding:'0 12px', boxSizing:'border-box',
    background:'var(--film-char)', border:'1px solid rgba(255,255,255,0.12)',
    borderRadius:7, color:'var(--film-cream)', fontSize:12, ...MONO, outline:'none',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:580 }}>
      <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 90px', gap:10 }}>
        {[
          { label:'Type', el:<select value={type} onChange={e=>setType(e.target.value)} style={{...base,cursor:'pointer'}}>
              {['movie','tv','anime','poster'].map(t=><option key={t} value={t}>{t}</option>)}
            </select> },
          { label:'ID (TMDB / IMDb tt… / MAL)', el:<input value={id} onChange={e=>setId(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&run()} placeholder="e.g. tt1375666" style={base} /> },
          { label:'Format', el:<select value={format} onChange={e=>setFormat(e.target.value)} style={{...base,cursor:'pointer'}}>
              {['png','webp','jpg'].map(f=><option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select> },
        ].map(({ label, el }) => (
          <div key={label}>
            <div style={{ ...MONO, fontSize:7, color:C.ghost, letterSpacing:'0.16em',
              textTransform:'uppercase', marginBottom:5 }}>{label}</div>
            {el}
          </div>
        ))}
      </div>
      <div>
        <div style={{ ...MONO, fontSize:7, color:C.ghost, letterSpacing:'0.16em',
          textTransform:'uppercase', marginBottom:5 }}>Query params</div>
        <input value={params} onChange={e=>setParams(e.target.value)}
          placeholder="r=imdb,rt&source=fanart" style={base} />
      </div>
      <button onClick={run} disabled={!id.trim()} style={{
        height:42, background:`linear-gradient(90deg,${C.amber},${C.gold})`, color:'#070706',
        border:'none', borderRadius:8, cursor:id.trim()?'pointer':'not-allowed',
        fontSize:12, fontWeight:800, ...SYNE, letterSpacing:'0.12em', textTransform:'uppercase',
        opacity:id.trim()?1:0.5 }}>
        Run Benchmark
      </button>
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', ...MONO, fontSize:9, color:C.ghost }}>
        <input type="checkbox" checked={bustCache} onChange={e=>setBustCache(e.target.checked)}
          style={{ accentColor:C.amber, cursor:'pointer' }} />
        Cache-bust (unique cb → fresh renders, tier cache MISS)
        {!bustCache && <span style={{ color:C.orange }}>— off: re-runs hit the Workers Cache (HIT)</span>}
      </label>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {EXAMPLES.map(ex=>(
          <button key={ex.id} onClick={()=>{ setType(ex.type); setId(ex.id); setParams(ex.params); }}
            style={{ padding:'4px 10px', background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.08)', borderRadius:5,
              color:C.ghost, fontSize:9, cursor:'pointer', ...SYNE, fontWeight:600 }}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Loading screen
function LoadingView({ type, id, step }:{ type:string; id:string; step:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'80px 20px', border:'1px dashed rgba(196,124,46,0.3)', borderRadius:12,
      marginTop:24, background:'rgba(196,124,46,0.02)' }}>
      <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
      <div style={{ width:44, height:44, border:'3px solid rgba(255,255,255,0.07)',
        borderTopColor:C.amber, borderRadius:'50%', animation:'spin 0.8s linear infinite', marginBottom:20 }} />
      <div className="poster-font" style={{ fontSize:20, color:C.amber, letterSpacing:'0.06em', marginBottom:14 }}>
        {type}/{id}
      </div>
      <div style={{ ...MONO, fontSize:9, color:C.dim }}>{step}</div>
    </div>
  );
}

// Results view
function ResultsView({ bench, onBack, onRerun }:{ bench:Benchmark; onBack:()=>void; onRerun:()=>void }) {
  const [section, setSection] = useState<'nodes'|'health'|'timing'|'log'>('nodes');
  const SECTIONS = [
    { key:'nodes',  label:'Node Results' },
    { key:'health', label:'Health Grid' },
    { key:'timing', label:'Timing Chart' },
    { key:'log',    label:'Full Log' },
  ] as const;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Header */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={onBack} style={{ padding:'5px 12px', background:'transparent',
          border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:C.ghost,
          fontSize:10, cursor:'pointer', ...SYNE }}>← Back</button>
        <div className="poster-font" style={{ fontSize:18, color:C.amber, letterSpacing:'0.06em' }}>
          {bench.inputType}/{bench.rawId}
        </div>
        {bench.queryParams && (
          <code style={{ fontSize:9, color:C.ghost, background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.07)', borderRadius:4, padding:'2px 7px' }}>
            ?{bench.queryParams}
          </code>
        )}
        <Pill color={C.ghost}>{bench.format.toUpperCase()}</Pill>
        <Pill color={bench.svgRefCacheStatus === 'HIT' ? C.green : C.orange}>
          SVG ref: {bench.svgRefCacheStatus ?? '—'}
        </Pill>
        <Pill color={bench.svgB64CacheStatus === 'HIT' ? C.green : C.orange}>
          SVG b64: {bench.svgB64CacheStatus ?? '—'}
        </Pill>
        <button onClick={onRerun} style={{ marginLeft:'auto', padding:'5px 12px', background:C.amber,
          border:'none', borderRadius:6, color:'#070706', fontSize:10, cursor:'pointer',
          ...SYNE, fontWeight:700 }}>↻ Re-run</button>
      </div>

      {/* Server-side benchmark partial failure banner */}
      {bench.serverNote && (
        <div style={{ padding:'8px 12px', borderRadius:8,
          background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)',
          color:'#fbbf24', fontSize:10, ...MONO }}>
          ⚠ server-side benchmark partially failed — {bench.serverNote}. Node cards below show fallback state.
        </div>
      )}

      {/* LB Ladder — production fallback-protection test */}
      <div style={{ background:C.char, border:`1px solid ${bench.lb.ok ? C.border : 'rgba(248,113,113,0.25)'}`,
        borderRadius:8, overflow:'hidden' }}>
        <div style={{ padding:'8px 12px', borderBottom:`1px solid rgba(255,255,255,0.05)`,
          display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
          ...SYNE, fontSize:8, fontWeight:700, letterSpacing:'0.14em',
          textTransform:'uppercase', color:C.amber }}>
          Production LB Ladder
          <Pill color={C.ghost}>via Worker B relay</Pill>
          <Pill color={bench.lb.ok ? C.green : C.red}>{bench.lb.ok ? 'SERVED' : 'FAILED'}</Pill>
          {bench.lb.fallback && <Pill color="#f59e0b">fallback fired</Pill>}
        </div>
        <div style={{ padding:12, display:'flex', gap:14, flexWrap:'wrap' }}>
          <div style={{ flex:'0 0 110px', position:'relative', aspectRatio:'2/3', borderRadius:6,
            overflow:'hidden', background:'#0a0a09', border:`1px solid ${C.border}` }}>
            {bench.lb.imageUrl ? (
              <>
                <img src={bench.lb.imageUrl} alt="LB"
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                <div style={{ position:'absolute', bottom:3, right:3, ...MONO, fontSize:8, fontWeight:700,
                  color:msColor(bench.lb.ms), background:'rgba(0,0,0,0.9)', padding:'2px 4px', borderRadius:2 }}>
                  {bench.lb.ms}ms
                </div>
              </>
            ) : (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
                justifyContent:'center', color:C.red, fontSize:14 }}>✗</div>
            )}
          </div>
          <div style={{ flex:1, minWidth:220, display:'flex', flexDirection:'column', gap:6 }}>
            {bench.lb.note && (
              <span style={{ ...MONO, fontSize:8, color: bench.lb.ok ? C.green : C.red }}>
                {bench.lb.note}
              </span>
            )}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              <Pill color={C.blue}>attempts: {bench.lb.attempts ?? '—'}</Pill>
              <Pill color={C.purple}>wall: {bench.lb.wallMs ? `${bench.lb.wallMs}ms` : '—'}</Pill>
              <Pill color={C.gold}>source: {bench.lb.rasterSource ?? '—'}</Pill>
              <Pill color={C.teal}>colo: {bench.lb.colo ?? '—'}</Pill>
              {bench.lb.cacheStatus && (
                <Pill color={bench.lb.cacheStatus === 'HIT' ? C.green : C.orange}>cf: {bench.lb.cacheStatus}</Pill>
              )}
            </div>
            <span style={{ ...MONO, fontSize:7, color:C.ghost, lineHeight:1.6 }}>
              Relays the fresh SVG through Worker B (RASTERIZER service binding via /admin/nodes/lb)
              with X-Fallback-Image-Url set. Verifies the single → pair → serial ladder and the 5s
              hard wall: if every node fails you should get the original poster with
              X-Fallback-Fired instead of a 502 — nodes are never skipped, just demoted.
            </span>
          </div>
        </div>
      </div>

      {/* Quick stat row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
        {[
          { l:'Fastest POST', v: fmtMs(bench.summary.fastestMs), c: msColor(bench.summary.fastestMs) },
          { l:'Best Node',    v: bench.summary.fastestLabel ?? '—', c: C.gold },
          { l:'Nodes OK',     v: `${bench.summary.successCount}/${NODES.length}`,
            c: bench.summary.successCount === 0 ? C.red
              : bench.summary.successCount < NODES.length ? C.yellow : C.green },
          { l:'LB Attempts',  v: bench.lb.attempts != null ? String(bench.lb.attempts) : '—', c: C.blue },
          { l:'LB Wall',      v: bench.lb.wallMs ? `${bench.lb.wallMs}ms` : '—', c: C.purple },
          { l:'LB Source',    v: bench.lb.rasterSource ?? '—', c: C.gold },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ padding:'10px 12px', background:C.char,
            border:`1px solid ${C.border}`, borderRadius:8 }}>
            <div style={{ ...MONO, fontSize:7, color:C.ghost, letterSpacing:'0.12em',
              textTransform:'uppercase', marginBottom:4 }}>{l}</div>
            <div className="poster-font" style={{ fontSize:20, color:c, lineHeight:1 }}>{v}</div>
          </div>
        ))}
      </div>

      <SummaryPanel bench={bench} />

      {/* Section tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={()=>setSection(s.key)}
            style={{ padding:'8px 14px', background:'transparent', border:'none', cursor:'pointer',
              color: section===s.key ? C.amber : C.ghost, fontSize:11, fontWeight:600, ...SYNE,
              borderBottom: section===s.key ? `2px solid ${C.amber}` : '2px solid transparent',
              marginBottom:-1 }}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'nodes' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>
          {bench.nodes.map(n => (
            <NodeCard key={n.id} node={n} urlKb={bench.urlKb} b64Kb={bench.b64Kb} />
          ))}
        </div>
      )}

      {section === 'health' && <HealthGrid nodes={bench.nodes} />}

      {section === 'timing' && (
        <div style={{ background:C.mid, border:`1px solid ${C.border}`, borderRadius:10, padding:16 }}>
          <div style={{ ...SYNE, fontSize:8, fontWeight:700, letterSpacing:'0.14em',
            textTransform:'uppercase', color:C.amber, marginBottom:14 }}>
            Render Timing
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
            {[{ c:C.blue, k:'POST URL-SVG' },{ c:C.orange, k:'POST B64-SVG' },{ c:C.ghost, k:'GET ?url=' }].map(({ c, k }) => (
              <span key={k} style={{ display:'flex', alignItems:'center', gap:5, ...MONO, fontSize:8, color:C.ghost }}>
                <span style={{ width:10, height:10, borderRadius:2, background:c, display:'inline-block' }} />
                {k}
              </span>
            ))}
          </div>
          <TimingBars nodes={bench.nodes} />
        </div>
      )}

      {section === 'log' && (
        <div style={{ background:C.mid, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:10, ...MONO }}>
              <thead>
                <tr style={{ background:C.mid }}>
                  {['Node','Via','Mode','Status','Time','Note'].map(h=>(
                    <th key={h} style={{ padding:'7px 12px', textAlign:'left', fontSize:7, color:C.ghost,
                      letterSpacing:'0.14em', textTransform:'uppercase',
                      borderBottom:`1px solid rgba(255,255,255,0.05)` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background:'rgba(255,255,255,0.01)', borderBottom:`1px solid rgba(255,255,255,0.025)` }}>
                  <td style={{ padding:'5px 12px', color:C.amber, fontWeight:700, borderLeft:`2px solid ${C.gold}` }}>LB LADDER</td>
                  <td style={{ padding:'5px 12px', color:C.teal, fontSize:8 }}>worker</td>
                  <td style={{ padding:'5px 12px', color:C.ghost }}>POST B64-SVG</td>
                  <td style={{ padding:'5px 12px' }}>
                    <span style={{ color:bench.lb.ok?C.green:C.red, fontWeight:700 }}>{bench.lb.ok?'✓ OK':'✗ FAIL'}</span>
                  </td>
                  <td style={{ padding:'5px 12px', color:bench.lb.ok?msColor(bench.lb.ms):C.ghost, fontWeight:bench.lb.ok?700:400 }}>
                    {bench.lb.ok ? `${bench.lb.ms}ms` : '—'}
                  </td>
                  <td style={{ padding:'5px 12px', color:C.ghost, maxWidth:280,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {bench.lb.note || `HTTP ${bench.lb.status}`}
                  </td>
                </tr>
                {bench.nodes.flatMap(n => [
                  { node:n.label, color:n.color, mode:'POST URL-SVG', ...n.postUrl },
                  { node:n.label, color:n.color, mode:'POST B64-SVG', ...n.postB64 },
                  { node:n.label, color:n.color, mode:'GET ?url=',   ...n.getRaster },
                ]).map((r, i) => (
                  <tr key={i} style={{ background: i%2===0?'rgba(255,255,255,0.01)':'transparent',
                    borderBottom:`1px solid rgba(255,255,255,0.025)` }}>
                    <td style={{ padding:'5px 12px', color:'var(--film-cream)', fontWeight:600,
                      borderLeft:`2px solid ${r.color}` }}>{r.node}</td>
                    <td style={{ padding:'5px 12px', color:C.ghost, fontSize:8 }}>server</td>
                    <td style={{ padding:'5px 12px', color:C.ghost }}>{r.mode}</td>
                    <td style={{ padding:'5px 12px' }}>
                      <span style={{ color:r.ok?C.green:C.red, fontWeight:700 }}>{r.ok?'✓ OK':'✗ FAIL'}</span>
                    </td>
                    <td style={{ padding:'5px 12px', color:r.ok?msColor(r.ms):C.ghost, fontWeight:r.ok?700:400 }}>
                      {r.ok ? `${r.ms}ms` : '—'}
                    </td>
                    <td style={{ padding:'5px 12px', color:C.ghost, maxWidth:280,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {r.note || (r.ok?`HTTP ${r.status}`:'')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SVG URLs */}
      <div style={{ padding:14, background:C.char, border:`1px solid ${C.border}`,
        borderRadius:8, display:'flex', flexDirection:'column', gap:8 }}>
        {[
          { label:'URL-SVG (no_embed=1, icons placeholder)', href:bench.svgUrlRef },
          { label:'B64-SVG (embedded images)',               href:bench.svgUrlB64 },
        ].map(({ label, href }) => (
          <div key={label}>
            <div style={{ ...MONO, fontSize:7, color:C.ghost, textTransform:'uppercase',
              letterSpacing:'0.1em', marginBottom:3 }}>{label}</div>
            <a href={href} target="_blank" rel="noreferrer"
              style={{ ...MONO, fontSize:8, color:C.amber, wordBreak:'break-all',
                textDecoration:'none', lineHeight:1.6 }}>{href}</a>
          </div>
        ))}
      </div>

      <div style={{ paddingTop:10, borderTop:`1px solid rgba(255,255,255,0.05)`,
        ...MONO, fontSize:7, color:C.ghost }}>
        Completed {new Date(bench.timestamp).toLocaleTimeString()} ·
        fleet probes + LB ladder run server-side ·
        HTTP nodes never touch the browser (mixed-content-safe) ·
        {bench.bustCache ? 'cache-busted (fresh renders)' : 'fixed cb — tier cache HIT expected'} ·
        Icons embedded server-side (v9 — no node icon-cache dependency)
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TestBenchmark() {
  const [mode,    setMode]    = useState<'search'|'loading'|'results'>('search');
  const [bench,   setBench]   = useState<Benchmark|null>(null);
  const [step,    setStep]    = useState('');
  const [error,   setError]   = useState('');
  const [lastRun, setLastRun] = useState<{type:string;id:string;params:string;format:string;bust:boolean}|null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const blobUrls = useRef<string[]>([]);

  const cleanupBlobs = useCallback(() => {
    blobUrls.current.forEach(u => URL.revokeObjectURL(u));
    blobUrls.current = [];
  }, []);

  useEffect(() => () => cleanupBlobs(), [cleanupBlobs]);

  // Stale-bundle hint: surface a reload toast when a new service-worker build is waiting.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    let removeUpdateFound: (() => void) | undefined;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'SKIP_WAITING') setUpdateReady(true);
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;
      if (reg.waiting) { setUpdateReady(true); return; }
      const onUpdate = () => { if (reg.waiting) setUpdateReady(true); };
      reg.addEventListener('updatefound', onUpdate);
      removeUpdateFound = () => reg.removeEventListener('updatefound', onUpdate);
    });
    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
      removeUpdateFound?.();
    };
  }, []);

  const go = useCallback(async (type:string, id:string, params:string, format:string, bust:boolean) => {
    cleanupBlobs();
    setMode('loading');
    setError('');
    setBench(null);
    setLastRun({ type, id, params, format, bust });
    try {
      const result = await runBenchmark(type, id, params, format, bust, setStep);
      blobUrls.current = result.nodes.flatMap(n =>
        [n.postUrl.imageUrl, n.postB64.imageUrl, n.getRaster.imageUrl]
      ).filter(Boolean) as string[];
      if (result.lb.imageUrl) blobUrls.current.push(result.lb.imageUrl);
      setBench(result);
      setMode('results');
    } catch(e:any) {
      setError(e.message ?? 'Benchmark failed');
      setMode('search');
    }
  }, [cleanupBlobs]);

  return (
    <div style={{ minHeight:'100dvh', background:'var(--film-black)',
      color:'var(--film-cream)', paddingTop:56 }}>
      <MainNavbar fixed compactLogo />

      <div style={{ position:'sticky', top:56, zIndex:40,
        background:'rgba(7,7,6,0.97)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--film-border)',
        padding:'10px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <div className="poster-font" style={{ fontSize:15, color:C.amber, letterSpacing:'0.06em' }}>
          Rasterizer Benchmark
        </div>
        <span style={{ ...MONO, fontSize:7, color:C.ghost }}>
          {mode==='loading'
            ? `TESTING · ${lastRun?.type}/${lastRun?.id}`
            : mode==='results'
              ? 'POST URL · POST B64 · GET raster · LB ladder · node health'
              : 'server-side node probes · LB ladder via Worker B · cache-bust toggle'}
        </span>
        {mode === 'results' && (
          <button onClick={() => { setMode('search'); setBench(null); }}
            style={{ marginLeft:'auto', padding:'4px 10px', background:'transparent',
              border:'1px solid rgba(255,255,255,0.1)', borderRadius:5, color:C.ghost,
              fontSize:9, cursor:'pointer', ...SYNE }}>
            ← New test
          </button>
        )}
      </div>

      <main style={{ padding:16, maxWidth:1280, margin:'0 auto' }}>
        {error && (
          <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:8,
            background:'rgba(248,113,113,0.07)', border:'1px solid rgba(248,113,113,0.2)',
            color:C.red, fontSize:11, ...MONO }}>
            ✕ {error}
          </div>
        )}

        {mode === 'search' && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <AmberTag style={{ marginBottom:8 }}>Server-Side Node Benchmark v6</AmberTag>
              <p className="body-font" style={{ fontSize:13, color:'var(--film-text-dim)', maxWidth:620, lineHeight:1.7 }}>
                Benchmarks all 8 fleet nodes (<strong>POST URL-SVG</strong> vs <strong>POST B64-SVG</strong>, plus <strong>GET ?url=</strong>)
                entirely server-side — the backend probes each node, so no mixed-content http
                blocks, CORS failures, or opaque redirects. Then pushes the same poster through the
                <strong> production LB ladder</strong> (Worker B via the RASTERIZER binding) to verify fallback
                protection — with <strong>cache-busting</strong> for fresh renders and cf-cache-status surfaced on
                every fetch. Node health merges in from the server-side fleet probe. Icons are embedded server-side —
                nodes never need icon-cache network access.
              </p>
            </div>
            <SearchForm onRun={go} />
          </div>
        )}

        {mode === 'loading' && lastRun && (
          <LoadingView type={lastRun.type} id={lastRun.id} step={step} />
        )}

        {mode === 'results' && bench && (
          <ResultsView bench={bench} onBack={() => { setMode('search'); setBench(null); }}
            onRerun={() => lastRun && go(lastRun.type, lastRun.id, lastRun.params, lastRun.format, lastRun.bust)} />
        )}
      </main>

      {updateReady && (
        <button onClick={() => window.location.reload()}
          style={{ position:'fixed', right:16, bottom:16, zIndex:80,
            padding:'10px 16px', background:C.amber, border:'none', borderRadius:8,
            color:'#070706', fontSize:11, cursor:'pointer', ...SYNE, fontWeight:700,
            boxShadow:'0 8px 24px rgba(0,0,0,0.45)' }}>
          New version available — tap to reload
        </button>
      )}
    </div>
  );
}