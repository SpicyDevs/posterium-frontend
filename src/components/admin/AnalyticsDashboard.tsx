// src/components/admin/AnalyticsDashboard.tsx
// ─── Rasterizer analytics · Film aesthetic v3 ────────────────────────────────
// Changes from v2:
//  • Uses MainNavbar + film CSS variables (matches rest of Posterium site)
//  • Live mode: 10s auto-refresh option with pulsing indicator
//  • Fallbacks tab: shows tier usage, escalation rates, win distribution
//  • Wall Time tab: total request latency from poster handler metrics
//  • Sub-6h charts now work: analytics.js uses fine-grained bucket expressions
//  • Simplified settings (localStorage-persisted, popover panel)
//  • All chart colors pulled from amber/gold palette matching site theme

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, ReferenceLine,
} from 'recharts';
import MainNavbar from '@/components/shared/MainNavbar';
import { AmberTag } from '@/components/shared/primitives';

const API_BASE     = 'https://api.spicydevs.xyz';
const AUTH_KEY     = 'posterium_analytics_auth_v3';
const CONFIG_KEY   = 'posterium_dash_config_v3';
const CORRECT_PW   = 'admin123';

// ── Chart colours (amber/gold palette, work in both light & dark) ─────────────
const CH = {
  amber:  '#c47c2e',
  gold:   '#d4a245',
  cream:  '#f0e6cc',
  green:  '#4ade80',
  red:    '#f87171',
  orange: '#fb923c',
  yellow: '#facc15',
  blue:   '#60a5fa',
  purple: '#a78bfa',
  teal:   '#2dd4bf',
  ghost:  'rgba(140,130,112,0.45)',
  dim:    'rgba(180,168,148,0.65)',
};

const PIE_COLORS = [CH.amber, CH.blue, CH.green, CH.yellow, CH.orange, CH.purple, CH.teal, CH.red];

function nodeColor(n: string) {
  const MAP: Record<string, string> = {
    washington: CH.blue, london: CH.green, tokyo: CH.yellow,
    mumbai: CH.red, 'spaceify-germany': CH.teal, 'spaceify-france': CH.purple,
    wsrv: CH.orange, 'render-eu': '#ec4899', ohio: CH.purple,
  };
  return MAP[n] ?? CH.ghost;
}
function nodeLabel(n: string) {
  const MAP: Record<string, string> = {
    washington: 'Washington · Vercel', ohio: 'Ohio · Netlify',
    london: 'London · Vercel', tokyo: 'Tokyo · Vercel', mumbai: 'Mumbai · Vercel',
    'spaceify-germany': 'Germany · Spaceify', 'spaceify-france': 'France · Spaceify',
    wsrv: 'wsrv.nl', 'render-eu': 'EU Central · Render',
    'cf-binding': 'CF Binding', france: 'France · Spaceify', germany: 'Germany · Spaceify',
    'render_eu': 'EU Central · Render',
  };
  return MAP[n] ?? n;
}

// Lane metadata for fallback tier tab
const LANE_META: Record<string, { label: string; color: string; tier: number }> = {
  'geo':           { label: 'Primary (geo)',       color: CH.green,  tier: 1 },
  'binding':       { label: 'CF Binding',          color: CH.teal,   tier: 1 },
  'geo-fallback':  { label: 'Tier 1 Fallback',     color: CH.yellow, tier: 2 },
  'geo-t2':        { label: 'Tier 2 Fallback',     color: CH.orange, tier: 3 },
  'wsrv-fallback': { label: 'wsrv (fallback)',      color: CH.purple, tier: 2 },
  'geo-t3':        { label: 'Tier 3 Fallback',     color: CH.red,    tier: 4 },
  'wsrv-t3':       { label: 'wsrv (Tier 3)',        color: '#dc2626', tier: 4 },
  'bulk':          { label: 'Bulk',                color: CH.blue,   tier: 0 },
  'wall':          { label: 'Wall (request level)', color: CH.ghost,  tier: 0 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function num(v: any): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}
function nullableNum(v: any): number | null {
  if (v == null || (typeof v === 'string' && !v.trim())) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}
function fmtMs(ms: number | null) {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}
function fmtNum(n: number) {
  if (!n) return '0';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }
function relTime(iso: string) {
  const ms = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}
function fmtBucket(s: string) {
  if (!s) return '';
  try {
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return `${d.getUTCMonth()+1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
  } catch { return s.slice(0, 13); }
}
function msColor(ms: number | null) {
  if (ms === null) return CH.ghost;
  if (ms < 500)  return CH.green;
  if (ms < 1200) return CH.yellow;
  if (ms < 3000) return CH.orange;
  return CH.red;
}
function rateColor(pct: number) {
  if (pct >= 90) return CH.green;
  if (pct >= 70) return CH.yellow;
  if (pct >= 40) return CH.orange;
  return CH.red;
}
function healthScore(successPct: number, avgMs: number | null) {
  const latScore = avgMs === null ? 100 : avgMs < 500 ? 100 : avgMs < 1000 ? 80 : avgMs < 2000 ? 55 : avgMs < 4000 ? 30 : 10;
  return Math.round(successPct * 0.6 + latScore * 0.4);
}

const PERIODS: Record<string, { label: string; short: string }> = {
  '15m': { label: '15 Minutes', short: '15M' },
  '1h':  { label: '1 Hour',     short: '1H'  },
  '3h':  { label: '3 Hours',    short: '3H'  },
  '6h':  { label: '6 Hours',    short: '6H'  },
  '12h': { label: '12 Hours',   short: '12H' },
  '24h': { label: '24 Hours',   short: '24H' },
  '2d':  { label: '2 Days',     short: '2D'  },
  '7d':  { label: '7 Days',     short: '7D'  },
  '14d': { label: '14 Days',    short: '14D' },
  '30d': { label: '30 Days',    short: '30D' },
};

const REFRESH_OPTIONS = [
  { label: 'Off', ms: 0 },
  { label: '10s', ms: 10_000 },
  { label: '30s', ms: 30_000 },
  { label: '1m',  ms: 60_000 },
  { label: '5m',  ms: 300_000 },
];

const TABS = ['overview', 'nodes', 'traffic', 'fallbacks', 'errors', 'breakdown', 'wall-time'] as const;
type Tab = typeof TABS[number];

// ── Persisted config ──────────────────────────────────────────────────────────

interface DashConfig {
  period: string;
  refreshMs: number;
  alertRate: number;
  alertMs: number;
}

function loadCfg(): DashConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { period: '24h', refreshMs: 0, alertRate: 90, alertMs: 2000, ...JSON.parse(raw) };
  } catch {}
  return { period: '24h', refreshMs: 0, alertRate: 90, alertMs: 2000 };
}
function saveCfg(c: DashConfig) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)); } catch {}
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

const FilmTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--film-dark)', border: '1px solid var(--film-border)',
      borderRadius: 8, padding: '10px 14px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)', minWidth: 150,
    }}>
      {label && <div style={{ color: CH.amber, marginBottom: 6, fontWeight: 700 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? CH.cream, marginBottom: 3, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: CH.dim }}>{p.name}</span>
          <strong>{typeof p.value === 'number' ? fmtNum(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Skel = ({ h = 80 }: { h?: number }) => (
  <div style={{
    height: h, borderRadius: 6,
    background: 'linear-gradient(110deg,var(--film-dark) 25%,var(--film-char) 50%,var(--film-dark) 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.8s linear infinite',
  }} />
);

// ── Gauge ─────────────────────────────────────────────────────────────────────

const Gauge = ({ value, size = 44 }: { value: number; size?: number }) => {
  const r = size / 2 - 5, circ = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(value / 100, 1)) * circ;
  const color = value >= 90 ? CH.green : value >= 70 ? CH.yellow : value >= 40 ? CH.orange : CH.red;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fill={color} fontSize={9} fontWeight="700"
        fontFamily="JetBrains Mono, monospace">{value.toFixed(0)}%</text>
    </svg>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color = CH.amber, alert }: {
  label: string; value: string | number; sub?: string; color?: string; alert?: boolean;
}) => (
  <div style={{
    padding: '14px 16px',
    background: 'var(--film-char)', border: '1px solid var(--film-border)',
    borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 5,
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, ${alert ? CH.red : color}, transparent)` }} />
    {alert && <div style={{
      position: 'absolute', top: 8, right: 8, width: 6, height: 6,
      borderRadius: '50%', background: CH.red, boxShadow: `0 0 6px ${CH.red}`,
      animation: 'pulse-dot 2s ease-in-out infinite',
    }} />}
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost,
      letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>{label}</span>
    <span className="poster-font" style={{ fontSize: 36, color, lineHeight: 1, letterSpacing: '0.04em' }}>
      {value}
    </span>
    {sub && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost, lineHeight: 1.5 }}>{sub}</span>}
  </div>
);

// ── Card wrapper ──────────────────────────────────────────────────────────────

const Card = ({ title, tag, children, noPad, fullWidth }: {
  title: string; tag?: string; children: React.ReactNode; noPad?: boolean; fullWidth?: boolean;
}) => (
  <div style={{
    background: 'var(--film-mid)', border: '1px solid var(--film-border)',
    borderRadius: 10, overflow: 'hidden',
    gridColumn: fullWidth ? '1 / -1' : undefined,
  }}>
    <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(196,124,46,0.025)' }}>
      <span className="syne-font" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase' as const, color: CH.amber }}>{title}</span>
      {tag && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 3, padding: '2px 6px' }}>{tag}</span>}
    </div>
    <div style={noPad ? undefined : { padding: 14 }}>{children}</div>
  </div>
);

// ── Node card ─────────────────────────────────────────────────────────────────

const NodeCard = ({ row, latRow, alertRate, alertMs }: {
  row: any; latRow?: any; alertRate: number; alertMs: number;
}) => {
  const pct    = num(row.success_rate_pct);
  const avgMs  = nullableNum(row.avg_ms);
  const score  = healthScore(pct, avgMs);
  const health = pct >= alertRate ? 'healthy' : pct >= 10 ? 'degraded' : 'down';
  const hc     = health === 'healthy' ? CH.green : health === 'degraded' ? CH.yellow : CH.red;
  const alertMs_ = avgMs !== null && avgMs > alertMs;
  const alertPct = pct < alertRate && num(row.total_attempts) > 0;
  return (
    <div style={{ padding: '12px 14px', background: 'var(--film-char)', border: '1px solid var(--film-border)',
      borderRadius: 8, borderLeft: `3px solid ${nodeColor(row.node)}`, position: 'relative' }}>
      {(alertMs_ || alertPct) && <div style={{
        position: 'absolute', top: 8, right: 8, width: 6, height: 6,
        borderRadius: '50%', background: CH.red, boxShadow: `0 0 6px ${CH.red}`,
        animation: 'pulse-dot 2s ease-in-out infinite' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--film-cream)', fontWeight: 600 }}>
            {nodeLabel(row.node).split(' ·')[0]}
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: hc, textTransform: 'uppercase' as const }}>{health}</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost }}>· {score}/100</span>
          </div>
        </div>
        <Gauge value={pct} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {[
          { l: 'Avg', v: fmtMs(avgMs), c: alertMs_ ? CH.red : msColor(avgMs) },
          { l: 'Wins', v: fmtNum(num(row.race_wins)), c: num(row.race_wins) > 0 ? CH.gold : CH.ghost },
          { l: 'Fails', v: fmtNum(num(row.failures)), c: num(row.failures) > 0 ? CH.red : CH.ghost },
        ].map(m => (
          <div key={m.l}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, marginBottom: 1 }}>{m.l}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: m.c, fontWeight: 700 }}>{m.v}</div>
          </div>
        ))}
      </div>
      {latRow && num(latRow.under_4s) > 0 && (
        <div style={{ marginTop: 8 }}>
          <LatDist row={latRow} />
        </div>
      )}
    </div>
  );
};

// ── Latency distribution bar ──────────────────────────────────────────────────

const LatDist = ({ row }: { row: any }) => {
  const total = num(row.total_success) || 1;
  const segs = [
    { n: num(row.under_500ms),                       c: CH.green,  l: '<500ms' },
    { n: num(row.under_1s) - num(row.under_500ms),   c: CH.yellow, l: '<1s' },
    { n: num(row.under_2s) - num(row.under_1s),      c: CH.orange, l: '<2s' },
    { n: num(row.under_4s) - num(row.under_2s),      c: CH.red,    l: '<4s' },
    { n: Math.max(0, total - num(row.under_4s)),      c: '#7f1d1d', l: '>4s' },
  ].filter(s => s.n > 0);
  return (
    <div style={{ display: 'flex', height: 5, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
      {segs.map((s, i) => (
        <div key={i} title={`${s.l}: ${Math.round(s.n/total*100)}%`}
          style={{ flex: s.n / total, background: s.c, minWidth: 2 }} />
      ))}
    </div>
  );
};

// ── Auth screen ───────────────────────────────────────────────────────────────

const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (pw === CORRECT_PW) {
      try { localStorage.setItem(AUTH_KEY, '1'); } catch {}
      onAuth();
    } else {
      setErr('Incorrect password');
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setPw('');
    }
  };
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--film-black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{
        width: 360, background: 'var(--film-mid)', border: '1px solid var(--film-border)',
        borderRadius: 12, overflow: 'hidden', animation: shake ? 'shake 0.4s ease' : 'none',
        boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
      }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <AmberTag style={{ marginBottom: 8 }}>Posterium</AmberTag>
          <div className="poster-font" style={{ fontSize: 28, color: 'var(--film-cream)', letterSpacing: '0.06em' }}>Analytics</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost, marginTop: 4 }}>raster_metrics · CF Analytics Engine</div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 6 }}>Admin Password</label>
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Enter password" autoFocus
            style={{ width: '100%', height: 40, padding: '0 12px', background: 'var(--film-char)',
              border: `1px solid ${err ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 7, color: 'var(--film-cream)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
              outline: 'none', boxSizing: 'border-box' as const }} />
          {err && <div style={{ marginTop: 5, fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.red }}>✕ {err}</div>}
          <button onClick={submit} style={{
            width: '100%', height: 40, marginTop: 14,
            background: `linear-gradient(90deg,${CH.amber},${CH.gold})`,
            color: '#070706', border: 'none', borderRadius: 7, cursor: 'pointer',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            fontFamily: 'Syne, sans-serif',
          }}>Enter Dashboard</button>
        </div>
      </div>
    </div>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [authed, setAuthed] = useState(() => { try { return localStorage.getItem(AUTH_KEY) === '1'; } catch { return false; } });
  const [cfg, setCfg] = useState<DashConfig>(loadCfg);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [countdown, setCountdown] = useState(0);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [live, setLive] = useState(false);
  const rTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateCfg = (next: Partial<DashConfig>) => {
    const c = { ...cfg, ...next };
    setCfg(c);
    saveCfg(c);
  };

  const fetchData = useCallback(async (p?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/analytics?period=${p ?? cfg.period}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? null);
      setLastFetch(new Date());
    } catch (e: any) {
      setError(e.message ?? 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [cfg.period]);

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  const effectiveRefreshMs = live ? 10_000 : cfg.refreshMs;

  useEffect(() => {
    if (rTimerRef.current) clearInterval(rTimerRef.current);
    if (cTimerRef.current) clearInterval(cTimerRef.current);
    if (!authed || effectiveRefreshMs === 0) { setCountdown(0); return; }
    setCountdown(effectiveRefreshMs / 1000);
    rTimerRef.current = setInterval(() => { fetchData(); setCountdown(effectiveRefreshMs / 1000); }, effectiveRefreshMs);
    cTimerRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => {
      if (rTimerRef.current) clearInterval(rTimerRef.current);
      if (cTimerRef.current) clearInterval(cTimerRef.current);
    };
  }, [effectiveRefreshMs, authed, fetchData]);

  // ── Data normalization ─────────────────────────────────────────────────────

  const nodeRows = useMemo(() => (data?.node_performance?.data ?? []).map((r: any) => ({
    node: String(r.node ?? ''),
    total_attempts: num(r.total_attempts), successes: num(r.successes), failures: num(r.failures),
    success_rate_pct: num(r.success_rate_pct), avg_ms: nullableNum(r.avg_ms), race_wins: num(r.race_wins),
  })), [data]);

  const globalRow = useMemo(() => {
    const raw = data?.global_summary?.data?.[0];
    if (raw && num(raw.total_attempts) > 0) return {
      total_attempts: num(raw.total_attempts), successes: num(raw.successes),
      failures: num(raw.failures), race_wins: num(raw.race_wins),
      success_rate_pct: num(raw.success_rate_pct), avg_ms: nullableNum(raw.avg_ms),
    };
    const total = nodeRows.reduce((s, r) => s + r.total_attempts, 0);
    const succ  = nodeRows.reduce((s, r) => s + r.successes, 0);
    const wAvg  = nodeRows.reduce((s, r) => s + (r.avg_ms ?? 0) * r.successes, 0);
    return { total_attempts: total, successes: succ,
      failures: nodeRows.reduce((s, r) => s + r.failures, 0),
      race_wins: nodeRows.reduce((s, r) => s + r.race_wins, 0),
      success_rate_pct: total > 0 ? (succ / total) * 100 : 0,
      avg_ms: succ > 0 ? wAvg / succ : null };
  }, [data, nodeRows]);

  const trafficData = useMemo(() => (data?.traffic_timeseries?.data ?? []).map((r: any) => ({
    bucket: fmtBucket(r.bucket ?? ''), attempts: num(r.attempts), successes: num(r.successes),
    failures: num(r.failures), wins: num(r.wins), avg_ms: num(r.avg_ms),
    error_rate: num(r.attempts) > 0 ? (num(r.failures) / num(r.attempts)) * 100 : 0,
  })), [data]);

  const fallbackTierRows = useMemo(() => (data?.fallback_tiers?.data ?? [])
    .filter((r: any) => r.lane && r.lane !== 'wall')
    .map((r: any) => ({
      lane: String(r.lane), attempts: num(r.attempts), successes: num(r.successes),
      success_rate_pct: num(r.success_rate_pct), avg_ms: nullableNum(r.avg_ms),
      wins: num(r.wins), win_rate_pct: num(r.win_rate_pct),
    })), [data]);

  const fallbackTimeseries = useMemo(() => (data?.fallback_timeseries?.data ?? []).map((r: any) => ({
    bucket: fmtBucket(r.bucket ?? ''), primary_hits: num(r.primary_hits),
    t1_fallbacks: num(r.t1_fallbacks), t2_fallbacks: num(r.t2_fallbacks), t3_fallbacks: num(r.t3_fallbacks),
  })), [data]);

  const wallStats = useMemo(() => (data?.wall_time_stats?.data ?? [])[0] ?? null, [data]);
  const wallTimeseries = useMemo(() => (data?.wall_time_timeseries?.data ?? []).map((r: any) => ({
    bucket: fmtBucket(r.bucket ?? ''), requests: num(r.requests), avg_wall_ms: num(r.avg_wall_ms),
  })), [data]);

  const latencyRows = useMemo(() => (data?.latency_percentiles?.data ?? []).map((r: any) => ({
    node: String(r.node ?? ''), total_success: num(r.total_success),
    avg_ms: nullableNum(r.avg_ms), under_500ms: num(r.under_500ms),
    under_1s: num(r.under_1s), under_2s: num(r.under_2s), under_4s: num(r.under_4s),
  })), [data]);

  const failRows = useMemo(() => (data?.recent_failures?.data ?? []).map((r: any) => ({
    node: String(r.node ?? ''), error: String(r.error ?? ''),
    status_code: num(r.status_code), timestamp: String(r.timestamp ?? ''),
  })), [data]);

  const formatRows = useMemo(() => (data?.format_breakdown?.data ?? []).map((r: any) => ({
    format: String(r.format ?? '?'), attempts: num(r.attempts),
    successes: num(r.successes), avg_ms: nullableNum(r.avg_ms),
  })), [data]);

  const coloRows = useMemo(() => (data?.colo_breakdown?.data ?? []).map((r: any) => ({
    colo: String(r.colo ?? ''), attempts: num(r.attempts),
    successes: num(r.successes), avg_ms: nullableNum(r.avg_ms),
  })), [data]);

  const winRows = useMemo(() => (data?.win_rate?.data ?? []).map((r: any) => ({
    node: String(r.node ?? ''), wins: num(r.wins),
    successes: num(r.successes), win_rate_pct: num(r.win_rate_pct),
  })), [data]);

  const alertNodes = useMemo(() => nodeRows.filter(r =>
    r.total_attempts > 0 && (r.success_rate_pct < cfg.alertRate || (r.avg_ms !== null && r.avg_ms > cfg.alertMs))
  ), [nodeRows, cfg]);

  const pLabel = PERIODS[cfg.period]?.label ?? cfg.period;

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  const isLiveActive = live || cfg.refreshMs > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes live-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(1.2)}}
        .recharts-text{font-family:'JetBrains Mono',monospace!important;font-size:9px!important;fill:rgba(180,168,148,0.65)!important}
        .recharts-legend-item-text{font-size:9px!important;font-family:'JetBrains Mono',monospace!important}
        select option{background:var(--film-dark);color:var(--film-cream)}
      `}</style>

      <MainNavbar fixed={true} compactLogo />

      {/* Controls bar */}
      <div style={{ position: 'sticky', top: 56, zIndex: 40, background: 'rgba(7,7,6,0.97)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--film-border)',
        padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minHeight: 48 }}>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%',
            background: loading ? CH.yellow : error ? CH.red : CH.green,
            boxShadow: `0 0 5px ${loading ? CH.yellow : error ? CH.red : CH.green}`,
            animation: isLiveActive ? 'live-pulse 1.5s ease-in-out infinite' : 'pulse-dot 2s ease-in-out infinite',
          }}/>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.12em' }}>
            {loading ? 'LOADING' : error ? 'ERROR' : isLiveActive ? 'LIVE' : 'CACHED'}
          </span>
          {alertNodes.length > 0 && (
            <span style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
              color: CH.red, fontSize: 7, fontFamily: 'Syne, sans-serif', fontWeight: 700,
              padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em' }}>
              ⚠ {alertNodes.length}
            </span>
          )}
        </div>

        {/* Live toggle */}
        <button onClick={() => setLive(v => !v)} style={{
          background: live ? 'rgba(196,124,46,0.2)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${live ? 'rgba(196,124,46,0.4)' : 'rgba(255,255,255,0.07)'}`,
          color: live ? CH.amber : CH.ghost, borderRadius: 6, padding: '4px 10px',
          fontSize: 9, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', letterSpacing: '0.1em',
        }}>
          {live ? '● LIVE (10s)' : '◌ LIVE'}
        </button>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 1, padding: 3,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7 }}>
          {Object.entries(PERIODS).map(([k, v]) => (
            <button key={k} onClick={() => { updateCfg({ period: k }); fetchData(k); }} style={{
              padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontSize: 9, fontWeight: 700, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' as const,
              background: cfg.period === k ? 'rgba(196,124,46,0.18)' : 'transparent',
              color: cfg.period === k ? CH.amber : CH.ghost,
            }}>{v.short}</button>
          ))}
        </div>

        {/* Refresh selector */}
        <div style={{ display: 'flex', gap: 1, padding: 3,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7 }}>
          {REFRESH_OPTIONS.map(ri => (
            <button key={ri.label} onClick={() => updateCfg({ refreshMs: ri.ms })} style={{
              padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontSize: 9, fontWeight: 700, fontFamily: 'Syne, sans-serif',
              background: cfg.refreshMs === ri.ms && !live ? 'rgba(196,124,46,0.18)' : 'transparent',
              color: cfg.refreshMs === ri.ms && !live ? CH.amber : CH.ghost,
            }}>{ri.label}</button>
          ))}
        </div>

        {countdown > 0 && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost }}>↺{countdown}s</span>}

        <button onClick={() => fetchData()} disabled={loading} style={{
          height: 28, padding: '0 12px',
          background: loading ? 'rgba(196,124,46,0.3)' : CH.amber,
          color: '#070706', border: 'none', borderRadius: 6, cursor: 'pointer',
          fontSize: 11, fontWeight: 800, fontFamily: 'Syne, sans-serif', opacity: loading ? 0.7 : 1,
        }}>{loading ? '…' : '↻'}</button>

        <button onClick={() => { try { localStorage.removeItem(AUTH_KEY); } catch {} setAuthed(false); setData(null); }}
          style={{ height: 28, padding: '0 10px', background: 'transparent', color: CH.ghost,
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, cursor: 'pointer',
            fontSize: 9, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' as const, marginLeft: 'auto' }}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <nav style={{ background: 'var(--film-dark)', borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 16px', display: 'flex', overflowX: 'auto', gap: 0, scrollbarWidth: 'none' as const }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '11px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? CH.amber : CH.ghost, fontSize: 11, fontWeight: 600,
            fontFamily: 'Syne, sans-serif',
            borderBottom: tab === t ? `2px solid ${CH.amber}` : '2px solid transparent',
            marginBottom: -1, textTransform: 'capitalize' as const, whiteSpace: 'nowrap' as const,
          }}>
            {t === 'wall-time' ? 'Wall Time' : t === 'fallbacks' ? 'Fallbacks ✦' : t}
          </button>
        ))}
      </nav>

      {error && (
        <div style={{ margin: '16px 16px 0', padding: '10px 14px', borderRadius: 8,
          background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)',
          color: CH.red, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          ✕ {error}
        </div>
      )}

      <main style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {alertNodes.length > 0 && !loading && (
              <div style={{ padding: '10px 16px', borderRadius: 8,
                background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.22)',
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: CH.red, fontFamily: 'JetBrains Mono, monospace', fontSize: 7, fontWeight: 700 }}>⚠ ALERTS</span>
                {alertNodes.map(n => (
                  <span key={n.node} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: 'var(--film-cream)',
                    background: 'rgba(248,113,113,0.1)', padding: '2px 8px', borderRadius: 3 }}>
                    {nodeLabel(n.node).split(' ·')[0]} — {n.success_rate_pct < cfg.alertRate ? `rate ${n.success_rate_pct.toFixed(0)}%` : ''}{n.avg_ms && n.avg_ms > cfg.alertMs ? ` ${fmtMs(n.avg_ms)}` : ''}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              {loading ? Array(6).fill(0).map((_,i) => <Skel key={i} h={90}/>) : (<>
                <StatCard label="Total Attempts" value={fmtNum(globalRow.total_attempts)} sub={pLabel} />
                <StatCard label="Race Wins" value={fmtNum(globalRow.race_wins)} sub="Posters served" color={CH.gold} />
                <StatCard label="Success Rate" value={fmtPct(globalRow.success_rate_pct)} sub="of all attempts" color={rateColor(globalRow.success_rate_pct)} />
                <StatCard label="Failures" value={fmtNum(globalRow.failures)} sub={fmtPct(globalRow.total_attempts > 0 ? globalRow.failures/globalRow.total_attempts*100 : 0)} color={globalRow.failures > 50 ? CH.red : 'var(--film-cream)'} alert={globalRow.failures > 50} />
                <StatCard label="Avg Latency" value={fmtMs(globalRow.avg_ms)} sub="Weighted avg" color={msColor(globalRow.avg_ms)} alert={globalRow.avg_ms !== null && globalRow.avg_ms > cfg.alertMs} />
                <StatCard label="Active Nodes" value={nodeRows.filter(r=>r.total_attempts>0).length} sub={`of ${nodeRows.length} total`} color="var(--film-cream)" />
              </>)}
            </div>

            <Card title="Traffic Over Time" tag={pLabel}>
              {loading ? <Skel h={200}/> : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CH.amber} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CH.amber} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="bucket" tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={42}/>
                    <Tooltip content={<FilmTooltip/>}/>
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }}/>
                    <Area type="monotone" dataKey="attempts" name="Attempts" stroke={CH.amber} fill="url(#gA)" strokeWidth={2} dot={false}/>
                    <Line type="monotone" dataKey="successes" name="Successes" stroke={CH.green} strokeWidth={1.5} dot={false}/>
                    <Line type="monotone" dataKey="failures" name="Failures" stroke={CH.red} strokeWidth={1.5} dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 10 }}>
              {loading ? Array(4).fill(0).map((_,i) => <Skel key={i} h={110}/>) : nodeRows.map(row => (
                <NodeCard key={row.node} row={row} latRow={latencyRows.find(r=>r.node===row.node)}
                  alertRate={cfg.alertRate} alertMs={cfg.alertMs} />
              ))}
            </div>
          </div>
        )}

        {/* ── NODES ────────────────────────────────────────────────────────── */}
        {tab === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Node Performance" tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', padding: 14 }}>
                {loading ? <Skel h={300}/> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>{['Node','Health','Attempts','Success Rate','Avg Latency','Wins','Score'].map(h => (
                        <th key={h} style={{ padding: '7px 12px', textAlign: h === 'Node' || h === 'Health' ? 'left' : 'right',
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em',
                          textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {nodeRows.map((row, i) => {
                        const pct = row.success_rate_pct;
                        const health = pct >= cfg.alertRate ? 'healthy' : pct >= 10 ? 'degraded' : 'down';
                        const hc = health === 'healthy' ? CH.green : health === 'degraded' ? CH.yellow : CH.red;
                        const score = healthScore(pct, row.avg_ms);
                        return (
                          <tr key={row.node} style={{ background: i%2===0 ? 'rgba(255,255,255,0.012)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '9px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: nodeColor(row.node) }}/>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--film-cream)', fontWeight: 600 }}>{nodeLabel(row.node)}</span>
                              </div>
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: hc, textTransform: 'uppercase' as const, background: `${hc}18`, padding: '2px 6px', borderRadius: 3 }}>{health}</span>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--film-cream)' }}>{fmtNum(row.total_attempts)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}><Gauge value={pct} size={36}/></td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: msColor(row.avg_ms), fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmtMs(row.avg_ms)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: row.race_wins > 0 ? CH.gold : CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{row.race_wins > 0 ? `⚡${fmtNum(row.race_wins)}` : '—'}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: score >= 80 ? CH.green : score >= 60 ? CH.yellow : CH.red }}>{score}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card title="Avg Latency by Node">
                {loading ? <Skel h={220}/> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[...nodeRows].sort((a,b)=>(a.avg_ms??9999)-(b.avg_ms??9999))} layout="vertical" margin={{ left:0,right:36,top:0,bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                      <XAxis type="number" tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} tickFormatter={v=>fmtMs(v)}/>
                      <YAxis type="category" dataKey="node" tick={{ fill:CH.dim,fontSize:8 }} tickLine={false} axisLine={false} width={80} tickFormatter={n=>nodeLabel(n).split(' ')[0]}/>
                      <Tooltip content={<FilmTooltip/>} formatter={(v:any)=>[fmtMs(v),'Avg Latency']}/>
                      <ReferenceLine x={cfg.alertMs} stroke={CH.red} strokeDasharray="4 3" strokeWidth={1}/>
                      <Bar dataKey="avg_ms" name="Avg Latency" radius={[0,4,4,0]}>
                        {nodeRows.map((r,i)=><Cell key={i} fill={msColor(r.avg_ms)}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card title="Race Win Distribution">
                {loading ? <Skel h={220}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
                    {winRows.filter(r=>r.wins>0).sort((a,b)=>b.wins-a.wins).map(r => {
                      const maxW = Math.max(...winRows.map(x=>x.wins), 1);
                      return (
                        <div key={r.node}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--film-cream)' }}>{nodeLabel(r.node).split(' ·')[0]}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost }}>{r.win_rate_pct.toFixed(0)}%</span>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.gold, fontWeight: 700 }}>⚡{fmtNum(r.wins)}</span>
                            </div>
                          </div>
                          <div style={{ height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: nodeColor(r.node), width: `${(r.wins/maxW)*100}%`, borderRadius: 2 }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── TRAFFIC ──────────────────────────────────────────────────────── */}
        {tab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              {loading ? Array(4).fill(0).map((_,i)=><Skel key={i} h={90}/>) : (<>
                <StatCard label="Total (period)" value={fmtNum(globalRow.total_attempts)} sub={pLabel}/>
                <StatCard label="Peak Bucket" value={fmtNum(Math.max(...trafficData.map(d=>d.attempts),0))} sub="Highest single bucket" color={CH.gold}/>
                <StatCard label="Peak Error Rate" value={fmtPct(Math.max(...trafficData.map(d=>d.error_rate),0))} sub="Worst bucket" color={CH.red} alert={Math.max(...trafficData.map(d=>d.error_rate),0)>5}/>
                <StatCard label="Avg Latency" value={fmtMs(globalRow.avg_ms)} sub="Global weighted avg" color={msColor(globalRow.avg_ms)} alert={globalRow.avg_ms !== null && globalRow.avg_ms > cfg.alertMs}/>
              </>)}
            </div>
            <Card title="Attempts · Successes · Failures · Wins" tag={pLabel}>
              {loading ? <Skel h={240}/> : (
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={trafficData} margin={{ top:4,right:4,bottom:0,left:0 }}>
                    <defs>
                      <linearGradient id="gA2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CH.amber} stopOpacity={0.25}/><stop offset="95%" stopColor={CH.amber} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gW2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CH.gold} stopOpacity={0.2}/><stop offset="95%" stopColor={CH.gold} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="bucket" tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} width={42}/>
                    <Tooltip content={<FilmTooltip/>}/>
                    <Legend wrapperStyle={{ fontSize:9,fontFamily:'JetBrains Mono,monospace',paddingTop:8 }}/>
                    <Area type="monotone" dataKey="attempts" name="Attempts" stroke={CH.amber} fill="url(#gA2)" strokeWidth={2} dot={false}/>
                    <Area type="monotone" dataKey="wins" name="Wins" stroke={CH.gold} fill="url(#gW2)" strokeWidth={1.5} dot={false}/>
                    <Line type="monotone" dataKey="failures" name="Failures" stroke={CH.red} strokeWidth={1.5} dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ── FALLBACKS ────────────────────────────────────────────────────── */}
        {tab === 'fallbacks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '8px 0' }}>
              <AmberTag>Fallback Tier Analysis</AmberTag>
              <p className="body-font" style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8 }}>
                Tracks which rasterization tier serves each request. Primary (Tier 1) = geo-matched node. Higher tiers = escalations. High Tier 2/3 usage signals primary node issues.
              </p>
            </div>

            {/* Tier summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
              {loading ? Array(4).fill(0).map((_,i)=><Skel key={i} h={90}/>) : (() => {
                const primary   = fallbackTierRows.filter(r => r.lane === 'geo' || r.lane === 'binding');
                const t1fb      = fallbackTierRows.filter(r => r.lane === 'geo-fallback' || r.lane === 'wsrv-fallback');
                const t2fb      = fallbackTierRows.filter(r => r.lane === 'geo-t2');
                const t3fb      = fallbackTierRows.filter(r => r.lane === 'geo-t3' || r.lane === 'wsrv-t3');
                const total     = fallbackTierRows.reduce((s,r)=>s+r.attempts,0);
                const primaryN  = primary.reduce((s,r)=>s+r.attempts,0);
                const t1fbN     = t1fb.reduce((s,r)=>s+r.attempts,0);
                const t2fbN     = t2fb.reduce((s,r)=>s+r.attempts,0);
                const t3fbN     = t3fb.reduce((s,r)=>s+r.attempts,0);
                const pct = (n: number) => total > 0 ? `${(n/total*100).toFixed(1)}%` : '—';
                return (<>
                  <StatCard label="Primary (Tier 1)" value={fmtNum(primaryN)} sub={`${pct(primaryN)} of requests`} color={CH.green}/>
                  <StatCard label="T1 Fallback" value={fmtNum(t1fbN)} sub={`${pct(t1fbN)} escalated`} color={t1fbN > primaryN * 0.1 ? CH.yellow : CH.dim}/>
                  <StatCard label="T2 Fallback" value={fmtNum(t2fbN)} sub={`${pct(t2fbN)} reached`} color={t2fbN > 0 ? CH.orange : CH.dim} alert={t2fbN > primaryN * 0.05}/>
                  <StatCard label="T3 Fallback" value={fmtNum(t3fbN)} sub={`${pct(t3fbN)} — critical`} color={t3fbN > 0 ? CH.red : CH.dim} alert={t3fbN > 0}/>
                </>);
              })()}
            </div>

            {/* Tier breakdown table */}
            <Card title="Lane Breakdown" tag={pLabel}>
              {loading ? <Skel h={200}/> : fallbackTierRows.length === 0 ? (
                <div style={{ color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', padding: 24 }}>No fallback data — check that rasterBalancer is writing blob7 values</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fallbackTierRows.map(row => {
                    const meta = LANE_META[row.lane] ?? { label: row.lane, color: CH.ghost, tier: 0 };
                    const total = fallbackTierRows.reduce((s,r)=>s+r.attempts,0) || 1;
                    return (
                      <div key={row.lane} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span className="syne-font" style={{ fontSize: 11, fontWeight: 700, color: 'var(--film-cream)' }}>{meta.label}</span>
                            <div style={{ display: 'flex', gap: 10 }}>
                              {row.avg_ms && <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: msColor(row.avg_ms) }}>{fmtMs(row.avg_ms)}</span>}
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: rateColor(row.success_rate_pct) }}>{row.success_rate_pct.toFixed(0)}% ok</span>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost }}>{fmtNum(row.attempts)}</span>
                            </div>
                          </div>
                          <div style={{ height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: meta.color, opacity: 0.7, width: `${(row.attempts/total)*100}%`, borderRadius: 2 }}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Fallback escalation timeseries */}
            <Card title="Fallback Escalation Over Time" tag="tier 2+ only">
              {loading ? <Skel h={200}/> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={fallbackTimeseries} margin={{ top:4,right:4,bottom:0,left:0 }}>
                    <defs>
                      <linearGradient id="gPrim" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CH.green} stopOpacity={0.2}/><stop offset="95%" stopColor={CH.green} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gT1"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CH.yellow} stopOpacity={0.2}/><stop offset="95%" stopColor={CH.yellow} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gT2"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CH.orange} stopOpacity={0.25}/><stop offset="95%" stopColor={CH.orange} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gT3"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CH.red} stopOpacity={0.25}/><stop offset="95%" stopColor={CH.red} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="bucket" tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} width={42}/>
                    <Tooltip content={<FilmTooltip/>}/>
                    <Legend wrapperStyle={{ fontSize:9,fontFamily:'JetBrains Mono,monospace',paddingTop:8 }}/>
                    <Area type="monotone" dataKey="primary_hits"  name="Primary"     stroke={CH.green}  fill="url(#gPrim)" strokeWidth={1.5} dot={false}/>
                    <Area type="monotone" dataKey="t1_fallbacks"  name="T1 Fallback" stroke={CH.yellow} fill="url(#gT1)"   strokeWidth={1.5} dot={false}/>
                    <Area type="monotone" dataKey="t2_fallbacks"  name="T2 Fallback" stroke={CH.orange} fill="url(#gT2)"   strokeWidth={1.5} dot={false}/>
                    <Area type="monotone" dataKey="t3_fallbacks"  name="T3 Fallback" stroke={CH.red}    fill="url(#gT3)"   strokeWidth={1.5} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ── ERRORS ───────────────────────────────────────────────────────── */}
        {tab === 'errors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              {loading ? Array(3).fill(0).map((_,i)=><Skel key={i} h={90}/>) : (<>
                <StatCard label="Total Failures" value={fmtNum(globalRow.failures)} sub={pLabel} color={globalRow.failures > 0 ? CH.red : CH.green} alert={globalRow.failures > 50}/>
                <StatCard label="Failure Rate" value={fmtPct(globalRow.total_attempts > 0 ? globalRow.failures/globalRow.total_attempts*100 : 0)} sub="Global average" color={CH.orange}/>
                <StatCard label="Affected Nodes" value={nodeRows.filter(r=>r.failures>0).length} sub="Nodes with failures" color="var(--film-cream)"/>
              </>)}
            </div>
            <Card title={`Recent Failures (${failRows.length})`} tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
                {loading ? <div style={{ padding: 14 }}><Skel h={200}/></div> : failRows.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: CH.green }}>✓ No failures in this period</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead><tr style={{ background: 'var(--film-mid)', position: 'sticky', top: 0 }}>
                      {['Time','Node','Status','Error'].map(h=><th key={h} style={{ padding:'7px 12px',textAlign:'left',fontFamily:'JetBrains Mono,monospace',fontSize:7,color:CH.ghost,letterSpacing:'0.16em',textTransform:'uppercase' as const,borderBottom:'1px solid rgba(255,255,255,0.05)'}}>{h}</th>)}
                    </tr></thead>
                    <tbody>{failRows.slice(0,100).map((r,i)=>(
                      <tr key={i} style={{ background:i%2===0?'rgba(248,113,113,0.025)':'transparent',borderBottom:'1px solid rgba(255,255,255,0.025)' }}>
                        <td style={{ padding:'6px 12px',fontFamily:'JetBrains Mono,monospace',fontSize:8,color:CH.ghost,whiteSpace:'nowrap' as const }}>{relTime(r.timestamp)}</td>
                        <td style={{ padding:'6px 12px' }}>
                          <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                            <div style={{ width:6,height:6,borderRadius:'50%',background:nodeColor(r.node) }}/>
                            <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:9,color:'var(--film-cream)' }}>{nodeLabel(r.node).split(' ')[0]}</span>
                          </div>
                        </td>
                        <td style={{ padding:'6px 12px' }}>
                          <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:8,color:r.status_code===0?CH.orange:CH.red,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:3,padding:'1px 5px' }}>
                            {r.status_code===0?'TIMEOUT':`HTTP ${Math.round(r.status_code)}`}
                          </span>
                        </td>
                        <td style={{ padding:'6px 12px',fontFamily:'JetBrains Mono,monospace',fontSize:8,color:CH.dim,maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const }}>{r.error}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ── BREAKDOWN ────────────────────────────────────────────────────── */}
        {tab === 'breakdown' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              <Card title="Format Distribution">
                {loading ? <Skel h={180}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {formatRows.map((r, i) => {
                      const total = formatRows.reduce((s,x)=>s+x.attempts,0)||1;
                      return (
                        <div key={r.format}>
                          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                            <span className="syne-font" style={{ fontSize:12,fontWeight:700,color:CH.amber,letterSpacing:'0.08em' }}>{r.format.toUpperCase()}</span>
                            <div style={{ display:'flex',gap:10 }}>
                              <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:8,color:CH.ghost }}>{fmtNum(r.attempts)}</span>
                              <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:8,color:msColor(r.avg_ms) }}>{fmtMs(r.avg_ms)}</span>
                            </div>
                          </div>
                          <div style={{ height:5,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                            <div style={{ height:'100%',background:PIE_COLORS[i%PIE_COLORS.length],width:`${(r.attempts/total)*100}%`,borderRadius:2 }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
              <Card title="Top Datacenters">
                {loading ? <Skel h={180}/> : (
                  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                    {coloRows.map(r => {
                      const rate = r.attempts > 0 ? (r.successes/r.attempts)*100 : 0;
                      const maxA = Math.max(...coloRows.map(c=>c.attempts),1);
                      return (
                        <div key={r.colo}>
                          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:3 }}>
                            <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:11,color:'var(--film-cream)',fontWeight:700 }}>{r.colo}</span>
                            <div style={{ display:'flex',gap:8 }}>
                              <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:8,color:rateColor(rate) }}>{fmtPct(rate)}</span>
                              <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:8,color:msColor(r.avg_ms) }}>{fmtMs(r.avg_ms)}</span>
                              <span style={{ fontFamily:'JetBrains Mono,monospace',fontSize:8,color:CH.ghost }}>{fmtNum(r.attempts)}</span>
                            </div>
                          </div>
                          <div style={{ height:3,borderRadius:2,background:'rgba(255,255,255,0.06)',overflow:'hidden' }}>
                            <div style={{ height:'100%',background:rateColor(rate),width:`${(r.attempts/maxA)*100}%` }}/>
                          </div>
                        </div>
                      );
                    })}
                    {!coloRows.length && <div style={{ color:CH.ghost,fontFamily:'JetBrains Mono,monospace',fontSize:11 }}>No colo data</div>}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── WALL TIME ────────────────────────────────────────────────────── */}
        {tab === 'wall-time' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '8px 0' }}>
              <AmberTag>Request-Level Wall Time</AmberTag>
              <p className="body-font" style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8 }}>
                End-to-end request duration from the poster handler — includes SVG generation, rasterization, and response time. Written by the poster handler with <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>blob1='req'</code>.
              </p>
            </div>
            {loading ? <Skel h={100}/> : !wallStats || !num(wallStats.total_requests) ? (
              <div style={{ padding: 20, color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, background: 'var(--film-char)', borderRadius: 8, border: '1px solid var(--film-border)' }}>
                No wall time data yet — add <code>writeWallTime()</code> calls to <code>handlers/poster.js</code> for this tab to populate. See the implementation guide in the PR.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
                  <StatCard label="Total Requests" value={fmtNum(num(wallStats.total_requests))} sub={pLabel}/>
                  <StatCard label="Avg Wall Time" value={fmtMs(nullableNum(wallStats.avg_wall_ms))} sub="End-to-end" color={msColor(nullableNum(wallStats.avg_wall_ms))}/>
                  <StatCard label="Under 1s" value={fmtPct(num(wallStats.total_requests)>0?num(wallStats.under_1s)/num(wallStats.total_requests)*100:0)} sub="of requests" color={CH.green}/>
                  <StatCard label="Under 2s" value={fmtPct(num(wallStats.total_requests)>0?num(wallStats.under_2s)/num(wallStats.total_requests)*100:0)} sub="cumulative" color={CH.yellow}/>
                </div>
                <Card title="Wall Time Over Time" tag={pLabel}>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={wallTimeseries} margin={{ top:4,right:4,bottom:0,left:0 }}>
                      <defs>
                        <linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CH.amber} stopOpacity={0.25}/><stop offset="95%" stopColor={CH.amber} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="bucket" tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                      <YAxis yAxisId="left" tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} width={42}/>
                      <YAxis yAxisId="right" orientation="right" tick={{ fill:CH.ghost,fontSize:8 }} tickLine={false} axisLine={false} width={50} tickFormatter={v=>fmtMs(v)}/>
                      <Tooltip content={<FilmTooltip/>}/>
                      <Legend wrapperStyle={{ fontSize:9,fontFamily:'JetBrains Mono,monospace',paddingTop:8 }}/>
                      <Area yAxisId="left" type="monotone" dataKey="requests" name="Requests" stroke={CH.amber} fill="url(#gWall)" strokeWidth={2} dot={false}/>
                      <Line yAxisId="right" type="monotone" dataKey="avg_wall_ms" name="Avg Wall ms" stroke={CH.blue} strokeWidth={1.5} dot={false}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost }}>POSTERIUM · raster_metrics · CF Analytics Engine · v3</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost }}>
            {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : ''} · {pLabel}
          </span>
        </div>
      </main>
    </div>
  );
}