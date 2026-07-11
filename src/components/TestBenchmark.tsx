// src/components/admin/TestBenchmark.tsx
//
// v4 — Full redesign:
//   • Detailed health parsing: icon cache, font, workers, queue, uptime, version
//   • POST URL-SVG vs POST B64-SVG side-by-side comparison with delta annotation
//   • GET rasterisation moved to bottom (slowest, URL-fetch path)
//   • HTTP nodes benchmarked via CF Worker /proxy endpoint
//   • Icon cache status prominently shown per node
//   • Comprehensive timing analytics + payload size analysis

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import MainNavbar from '@/modules/MainNavbar';
import { AmberTag } from '@/ui/primitives';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';

const API_BASE      = DEFAULT_API_BASE;
const CF_PROXY_BASE = 'https://r-cf.spicydevs.xyz/proxy';
const TIMEOUT_MS    = 14_000;

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

const EXAMPLES = [
  { label:'Inception',      type:'movie', id:'tt1375666',  params:'r=imdb,rt' },
  { label:'Breaking Bad',   type:'tv',    id:'tt0903747',  params:'r=imdb,tmdb' },
  { label:'Attack on Titan',type:'anime', id:'16498',       params:'r=mal,anilist' },
  { label:'Dune: Part Two', type:'movie', id:'tt15239678', params:'r=imdb,rt,age' },
  { label:'The Bear',       type:'tv',    id:'136315',      params:'r=imdb,tmdb,rt' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface FetchResult { ok:boolean; ms:number; status:number; note:string; imageUrl:string|null }
interface HealthData {
  reachable: boolean;
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
  nodes: NodeResult[];
  summary: { fastestMs:number|null; fastestLabel:string|null; successCount:number };
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

function proxyUrl(node: typeof NODES[number], targetUrl:string): string {
  if (!node.http) return targetUrl;
  return `${CF_PROXY_BASE}?url=${encodeURIComponent(targetUrl)}`;
}

async function fetchWithImage(url:string, opts:RequestInit={}): Promise<FetchResult> {
  const t0 = performance.now();
  try {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(url, { ...opts, signal: ac.signal });
    clearTimeout(tm);
    const ms = Math.round(performance.now() - t0);
    if (!res.ok) {
      await res.body?.cancel().catch(()=>{});
      return { ok:false, ms, status:res.status, note:`HTTP ${res.status}`, imageUrl:null };
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) {
      const txt = await res.text();
      return { ok:false, ms, status:res.status, note:`Non-image (${ct.split(';')[0]}): ${txt.slice(0,80)}`, imageUrl:null };
    }
    const buf = await res.arrayBuffer();
    return { ok:true, ms, status:res.status, note:'', imageUrl: URL.createObjectURL(new Blob([buf],{type:ct})) };
  } catch(e:any) {
    return { ok:false, ms:Math.round(performance.now()-t0), status:0,
      note: e.name==='AbortError' ? `Timeout ${TIMEOUT_MS}ms` : e.message, imageUrl:null };
  }
}

async function fetchHealth(node: typeof NODES[number]): Promise<HealthData> {
  const healthTarget = proxyUrl(node, `${node.url}/health`);
  try {
    const res = await fetch(healthTarget, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return { reachable:false, error:`HTTP ${res.status}` };
    const data = await res.json();
    return { reachable:true, ...data };
  } catch(e:any) {
    return { reachable:false, error: e.message };
  }
}

async function benchNode(
  node: typeof NODES[number],
  urlSvg:string, b64Svg:string, svgUrlRef:string, format:string,
): Promise<NodeResult> {
  const base       = `${node.url}${node.path}?format=${format}`;
  const postTarget = proxyUrl(node, base);
  const getRasterTarget = proxyUrl(node, `${node.url}${node.path}?format=${format}&url=${encodeURIComponent(svgUrlRef)}`);
  const headers    = { 'Content-Type':'image/svg+xml', 'X-Format':format };

  const [health, postUrl, postB64, getRaster] = await Promise.all([
    fetchHealth(node),
    urlSvg
      ? fetchWithImage(postTarget, { method:'POST', body:urlSvg, headers })
      : Promise.resolve({ ok:false, ms:0, status:0, note:'SVG unavailable', imageUrl:null }),
    b64Svg
      ? fetchWithImage(postTarget, { method:'POST', body:b64Svg, headers })
      : Promise.resolve({ ok:false, ms:0, status:0, note:'SVG unavailable', imageUrl:null }),
    // GET rasterisation — last, slowest path
    fetchWithImage(getRasterTarget),
  ]);

  return { ...node, health, postUrl, postB64, getRaster };
}

async function runBenchmark(
  inputType:string, rawId:string, params:string, format:string,
  onStep:(s:string)=>void,
): Promise<Benchmark> {
  const cb = Date.now();
  const qs = `${params ? params+'&' : ''}cb=${cb}`;
  const svgUrlRef = `${API_BASE}/${inputType}/${rawId}.svg?${qs}&no_embed=1`;
  const svgUrlB64 = `${API_BASE}/${inputType}/${rawId}.svg?${qs}`;

  onStep('Fetching SVG variants…');
  const [urlRes, b64Res] = await Promise.all([
    fetch(svgUrlRef, { signal:AbortSignal.timeout(8_000) }).catch(()=>null),
    fetch(svgUrlB64, { signal:AbortSignal.timeout(8_000) }).catch(()=>null),
  ]);
  const urlSvg = urlRes?.ok ? await urlRes.text() : '';
  const b64Svg = b64Res?.ok ? await b64Res.text() : '';
  const urlKb  = urlSvg ? Math.round(new Blob([urlSvg]).size/1024) : 0;
  const b64Kb  = b64Svg ? Math.round(new Blob([b64Svg]).size/1024) : 0;

  onStep('Benchmarking all nodes in parallel…');
  const nodes = await Promise.all(NODES.map(n => benchNode(n, urlSvg, b64Svg, svgUrlRef, format)));

  const allMs = nodes.flatMap(n =>
    [n.postUrl, n.postB64].filter(r => r.ok).map(r => r.ms)
  );
  const fastestMs = allMs.length ? Math.min(...allMs) : null;
  const fastestLabel = fastestMs != null
    ? (nodes.find(n => [n.postUrl,n.postB64].some(r=>r.ok&&r.ms===fastestMs))?.label ?? null)
    : null;

  return {
    inputType, rawId, queryParams:params, format,
    svgUrlRef, svgUrlB64: svgUrlB64.replace(`&cb=${cb}`,''),
    urlKb, b64Kb, nodes,
    summary: { fastestMs, fastestLabel, successCount: nodes.filter(n=>n.postUrl.ok||n.postB64.ok).length },
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
            <div style={{ position:'absolute', bottom:4, right:4, ...MONO, fontSize:8, fontWeight:700,
              color:msColor(result.ms), background:'rgba(0,0,0,0.85)', padding:'2px 5px', borderRadius:3 }}>
              {result.ms}ms
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
              {node.http && <span style={{ color:C.teal, marginLeft:5 }}>· via proxy</span>}
            </div>
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
            <Pill color={node.color}>{node.tag}</Pill>
            {!reachable && <Pill color={C.red}>offline</Pill>}
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
  const postMs = bench.nodes.filter(n=>n.postUrl.ok).map(n=>n.postUrl.ms);
  const b64Ms  = bench.nodes.filter(n=>n.postB64.ok).map(n=>n.postB64.ms);
  const getMs  = bench.nodes.filter(n=>n.getRaster.ok).map(n=>n.getRaster.ms);

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
              <StatusDot ok={h.reachable} />
            </div>
            {!h.reachable ? (
              <span style={{ ...MONO, fontSize:7, color:C.red }}>{h.error?.slice(0,60)}</span>
            ) : (
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
            )}
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
          ].map(({ r, label, color }) => (
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
function SearchForm({ onRun }:{ onRun:(t:string,i:string,p:string,f:string)=>void }) {
  const [type,   setType]   = useState('movie');
  const [id,     setId]     = useState('');
  const [params, setParams] = useState('r=imdb,rt');
  const [format, setFormat] = useState('png');

  const run = () => id.trim() && onRun(type, id.trim(), params.trim(), format);
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
        <button onClick={onRerun} style={{ marginLeft:'auto', padding:'5px 12px', background:C.amber,
          border:'none', borderRadius:6, color:'#070706', fontSize:10, cursor:'pointer',
          ...SYNE, fontWeight:700 }}>↻ Re-run</button>
      </div>

      {/* Quick stat row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
        {[
          { l:'Fastest POST', v: fmtMs(bench.summary.fastestMs), c: msColor(bench.summary.fastestMs) },
          { l:'Best Node',    v: bench.summary.fastestLabel ?? '—', c: C.gold },
          { l:'Nodes OK',     v: `${bench.summary.successCount}/${NODES.length}`, c:'var(--film-cream)' },
          { l:'URL-SVG',      v: bench.urlKb ? `${bench.urlKb}KB` : '—', c:C.green },
          { l:'B64-SVG',      v: bench.b64Kb ? `${bench.b64Kb}KB` : '—', c:C.orange },
          { l:'B64 overhead', v: bench.urlKb && bench.b64Kb
              ? `+${bench.b64Kb-bench.urlKb}KB` : '—',
            c: (bench.b64Kb-bench.urlKb) > 10 ? C.orange : C.ghost },
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
                {bench.nodes.flatMap(n => [
                  { node:n.label, color:n.color, via: n.http?'proxy':'direct', mode:'POST URL-SVG', ...n.postUrl },
                  { node:n.label, color:n.color, via: n.http?'proxy':'direct', mode:'POST B64-SVG', ...n.postB64 },
                  { node:n.label, color:n.color, via: n.http?'proxy':'direct', mode:'GET ?url=',   ...n.getRaster },
                ]).map((r, i) => (
                  <tr key={i} style={{ background: i%2===0?'rgba(255,255,255,0.01)':'transparent',
                    borderBottom:`1px solid rgba(255,255,255,0.025)` }}>
                    <td style={{ padding:'5px 12px', color:'var(--film-cream)', fontWeight:600,
                      borderLeft:`2px solid ${r.color}` }}>{r.node}</td>
                    <td style={{ padding:'5px 12px', color: r.via==='proxy' ? C.teal : C.ghost, fontSize:8 }}>{r.via}</td>
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
        client-side timing via performance.now() ·
        HTTP nodes routed via CF proxy ·
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
  const [lastRun, setLastRun] = useState<{type:string;id:string;params:string;format:string}|null>(null);
  const blobUrls = useRef<string[]>([]);

  const cleanupBlobs = useCallback(() => {
    blobUrls.current.forEach(u => URL.revokeObjectURL(u));
    blobUrls.current = [];
  }, []);

  useEffect(() => () => cleanupBlobs(), [cleanupBlobs]);

  const go = useCallback(async (type:string, id:string, params:string, format:string) => {
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
              ? 'POST URL · POST B64 · GET raster · node health'
              : 'HTTP nodes via CF proxy · icons embedded server-side (v9)'}
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
              <AmberTag style={{ marginBottom:8 }}>Client-Side Node Benchmark v4</AmberTag>
              <p className="body-font" style={{ fontSize:13, color:'var(--film-text-dim)', maxWidth:620, lineHeight:1.7 }}>
                Benchmarks all rasterizer nodes with <strong>POST URL-SVG</strong> and <strong>POST B64-SVG</strong> side-by-side,
                plus <strong>GET ?url=</strong> at the bottom (slowest path). HTTP nodes routed via CF proxy.
                Icons are now embedded server-side before dispatching — nodes no longer need icon-cache network access.
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
            onRerun={() => lastRun && go(lastRun.type, lastRun.id, lastRun.params, lastRun.format)} />
        )}
      </main>
    </div>
  );
}