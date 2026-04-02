// src/components/admin/AnalyticsDashboard.tsx
//
// Grafana-style rasterizer analytics dashboard.
// Derives global_summary + latency_percentiles client-side when backend returns empty rows
// (CF AE SQL doesn't support minIf/maxIf, so we aggregate node_performance data locally).

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, ReferenceLine,
} from 'recharts';

const API_BASE         = 'https://api.spicydevs.xyz';
const AUTH_STORAGE_KEY = 'posterium_analytics_auth_v1';
const CORRECT_PASSWORD = 'admin123';

const PERIODS: Record<string, { label: string; short: string }> = {
  '15m': { label: 'Last 15 Min',   short: '15M' },
  '1h':  { label: 'Last 1 Hour',   short: '1H'  },
  '3h':  { label: 'Last 3 Hours',  short: '3H'  },
  '6h':  { label: 'Last 6 Hours',  short: '6H'  },
  '12h': { label: 'Last 12 Hours', short: '12H' },
  '24h': { label: 'Last 24 Hours', short: '24H' },
  '2d':  { label: 'Last 2 Days',   short: '2D'  },
  '7d':  { label: 'Last 7 Days',   short: '7D'  },
  '14d': { label: 'Last 14 Days',  short: '14D' },
  '30d': { label: 'Last 30 Days',  short: '30D' },
};

const REFRESH_INTERVALS = [
  { label: 'Off', ms: 0 },
  { label: '30s', ms: 30_000 },
  { label: '1m',  ms: 60_000 },
  { label: '2m',  ms: 120_000 },
  { label: '5m',  ms: 300_000 },
];

const NODE_COLORS: Record<string, string> = {
  'washington':              '#3b82f6',
  'ohio':                    '#8b5cf6',
  'london':                  '#10b981',
  'tokyo':                   '#f59e0b',
  'mumbai':                  '#ef4444',
  'spaceify-germany':        '#06b6d4',
  'spaceify-france':         '#84cc16',
  'wsrv':                    '#f97316',
  'render-singapore-1':      '#ec4899',
  'render-singapore-2':      '#a78bfa',
  'render-eu-central':       '#14b8a6',
  'render-us-west':          '#78716c',
  'simple-worker (binding)': '#c47c2e',
  'simple-worker (http)':    '#92400e',
};
const PIE_COLORS = ['#c47c2e','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

function nodeColor(n: string) { return NODE_COLORS[n] ?? '#71717a'; }

function num(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}
function nullableNum(v: any): number | null {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}
function fmtNum(n: number): string {
  if (n === 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}
function fmtPct(n: number): string { return `${n.toFixed(1)}%`; }
function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function fmtBucket(s: string): string {
  if (!s) return '';
  try {
    const d = new Date(s.replace(' ', 'T') + 'Z');
    return `${d.getUTCMonth()+1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
  } catch { return s.slice(0, 13); }
}

const C = {
  black: '#070706', dark: '#0e0d0b', mid: '#141210', char: '#1a1814',
  border: 'rgba(196,124,46,0.16)', borderFaint: 'rgba(255,255,255,0.05)',
  amber: '#c47c2e', gold: '#d4a245', cream: '#f0e6cc',
  ghost: 'rgba(140,130,112,0.38)', dim: 'rgba(180,168,148,0.55)',
  label: 'rgba(212,198,172,0.82)', body: 'rgba(230,218,196,0.92)',
  green: '#4ade80', yellow: '#facc15', orange: '#fb923c', red: '#f87171',
  blue: '#60a5fa', purple: '#a78bfa',
};

function msColor(ms: number | null): string {
  if (ms === null) return C.ghost;
  if (ms < 500)  return C.green;
  if (ms < 1200) return C.yellow;
  if (ms < 3000) return C.orange;
  return C.red;
}
function rateColor(pct: number): string {
  if (pct >= 90) return C.green;
  if (pct >= 70) return C.yellow;
  if (pct >= 40) return C.orange;
  return C.red;
}
function nodeShortName(n: string): string {
  const MAP: Record<string,string> = {
    'wsrv': 'wsrv.nl', 'ohio': 'Ohio · Netlify', 'washington': 'Washington · Vercel',
    'london': 'London · Vercel', 'tokyo': 'Tokyo · Vercel', 'mumbai': 'Mumbai · Vercel',
    'spaceify-germany': 'Germany · Spaceify', 'spaceify-france': 'France · Spaceify',
    'render-singapore-1': 'Singapore 1 · Render', 'render-singapore-2': 'Singapore 2 · Render',
    'render-eu-central': 'EU Central · Render', 'render-us-west': 'US West · Render',
    'simple-worker (binding)': 'Simple Worker', 'simple-worker (http)': 'Simple Worker · HTTP',
  };
  return MAP[n] ?? n;
}

// ── UI primitives ─────────────────────────────────────────────────────────────

const Skel = ({ h = 80 }: { h?: number }) => (
  <div style={{ height: h, borderRadius: 6, background: 'linear-gradient(110deg,#141210 25%,#1a1814 50%,#141210 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.8s linear infinite' }}/>
);

const PanelHdr = ({ title, tag }: { title: string; tag?: string }) => (
  <div style={{ padding: '9px 14px', borderBottom: `1px solid ${C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(196,124,46,0.02)' }}>
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.amber, fontFamily: 'Syne, sans-serif' }}>{title}</span>
    {tag && <span style={{ fontSize: 7, color: C.ghost, letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderFaint}`, borderRadius: 3, padding: '2px 6px' }}>{tag}</span>}
  </div>
);

const Card = ({ title, tag, children, fullWidth = false, noPad = false }: { title: string; tag?: string; children: React.ReactNode; fullWidth?: boolean; noPad?: boolean }) => (
  <div style={{ background: C.mid, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', gridColumn: fullWidth ? '1 / -1' : undefined }}>
    <PanelHdr title={title} tag={tag}/>
    <div style={noPad ? undefined : { padding: 14 }}>{children}</div>
  </div>
);

const StatCard = ({ label, value, sub, color = C.cream, accent = C.amber }: { label: string; value: string|number; sub?: string; color?: string; accent?: string }) => (
  <div style={{ padding: '14px 16px', background: C.char, border: `1px solid ${C.border}`, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 5, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, opacity: 0.6 }}/>
    <span style={{ fontSize: 8, color: C.ghost, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
    <span style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.04em', lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: 9, color: C.ghost, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.4 }}>{sub}</span>}
  </div>
);

const Gauge = ({ value, size = 48 }: { value: number; size?: number }) => {
  const r = size/2 - 5, circ = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(value/100, 1)) * circ;
  const color = rateColor(value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fill={color} fontSize={10} fontWeight="700" fontFamily="JetBrains Mono, monospace">
        {value.toFixed(0)}%
      </text>
    </svg>
  );
};

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.char, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      {label && <div style={{ color: C.amber, marginBottom: 6, fontWeight: 700 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? C.cream, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === 'number' ? fmtNum(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Heatmap ───────────────────────────────────────────────────────────────────

const HourHeatmap = ({ data }: { data: any[] }) => {
  const { hours, hourKeys, nodes } = useMemo(() => {
    const map: Record<string, Record<string, { failures: number; attempts: number }>> = {};
    data.forEach(r => {
      const h = fmtBucket(r.bucket ?? '');
      if (!h) return;
      if (!map[h]) map[h] = {};
      const node = r.node ?? '';
      if (!map[h][node]) map[h][node] = { failures: 0, attempts: 0 };
      map[h][node].failures += num(r.failures);
      map[h][node].attempts += num(r.attempts);
    });
    return {
      hours: map,
      hourKeys: Object.keys(map).slice(-24),
      nodes: [...new Set(data.map(r => r.node ?? ''))].filter(Boolean),
    };
  }, [data]);

  if (!hourKeys.length || !nodes.length) {
    return <div style={{ color: C.ghost, fontSize: 11, padding: 20, textAlign: 'center' }}>No heatmap data</div>;
  }

  const CELL_W = 28, CELL_H = 20, LABEL_W = 140, LABEL_H = 30;
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={LABEL_W + hourKeys.length * CELL_W} height={LABEL_H + nodes.length * CELL_H} style={{ display: 'block' }}>
        {hourKeys.map((h, i) => (
          <text key={h} x={LABEL_W + i * CELL_W + CELL_W/2} y={LABEL_H - 4} textAnchor="middle" fill={C.ghost} fontSize={7} fontFamily="JetBrains Mono, monospace" transform={`rotate(-45, ${LABEL_W + i * CELL_W + CELL_W/2}, ${LABEL_H - 4})`}>{h.slice(-5)}</text>
        ))}
        {nodes.map((node, ni) => (
          <g key={node}>
            <text x={LABEL_W - 4} y={LABEL_H + ni * CELL_H + CELL_H/2 + 3} textAnchor="end" fill={C.dim} fontSize={8} fontFamily="JetBrains Mono, monospace">{nodeShortName(node).split(' ')[0]}</text>
            {hourKeys.map((h, hi) => {
              const cell = hours[h]?.[node];
              const rate = cell && cell.attempts > 0 ? cell.failures / cell.attempts : 0;
              const fill = rate === 0 ? 'rgba(74,222,128,0.15)' : `rgba(248,113,113,${0.15 + Math.min(rate * 4, 1) * 0.7})`;
              return (
                <rect key={h} x={LABEL_W + hi * CELL_W + 1} y={LABEL_H + ni * CELL_H + 1} width={CELL_W-2} height={CELL_H-2} rx={2} fill={fill}>
                  <title>{`${nodeShortName(node)} @ ${h}\n${cell?.failures ?? 0} failures / ${cell?.attempts ?? 0} attempts`}</title>
                </rect>
              );
            })}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center', fontSize: 8, color: C.ghost, fontFamily: 'JetBrains Mono, monospace' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(74,222,128,0.2)' }}/><span>No failures</span>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(248,113,113,0.5)' }}/><span>Some failures</span>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(248,113,113,0.85)' }}/><span>High failure rate</span>
      </div>
    </div>
  );
};

// ── Latency dist bar ──────────────────────────────────────────────────────────

const LatencyDistBar = ({ row }: { row: any }) => {
  const total = num(row.total_success) || 1;
  const u500  = num(row.under_500ms);
  const u1000 = num(row.under_1s) - u500;
  const u2000 = num(row.under_2s) - num(row.under_1s);
  const u4000 = num(row.under_4s) - num(row.under_2s);
  const over  = Math.max(0, total - num(row.under_4s));
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
      {[{ n: u500, c: C.green }, { n: u1000, c: C.yellow }, { n: u2000, c: C.orange }, { n: u4000, c: C.red }, { n: over, c: '#7f1d1d' }]
        .filter(s => s.n > 0).map((s, i) => (
        <div key={i} style={{ flex: s.n / total, background: s.c, minWidth: 2 }}/>
      ))}
    </div>
  );
};

// ── Auth screen ───────────────────────────────────────────────────────────────

const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [pw, setPw]       = useState('');
  const [err, setErr]     = useState('');
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (pw === CORRECT_PASSWORD) { try { localStorage.setItem(AUTH_STORAGE_KEY, '1'); } catch {} onAuth(); }
    else { setErr('Incorrect password'); setShake(true); setTimeout(() => setShake(false), 450); setPw(''); }
  };
  return (
    <div style={{ minHeight: '100dvh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ width: 380, background: C.mid, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.9)', animation: shake ? 'shake 0.4s ease' : 'none' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.borderFaint}` }}>
          <div style={{ fontSize: 8, color: C.amber, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>◆ POSTERIUM</div>
          <div style={{ fontSize: 22, color: C.cream, fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.06em' }}>ANALYTICS ACCESS</div>
          <div style={{ fontSize: 10, color: C.ghost, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>Rasterizer node · D1 database · 30-day data</div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <label style={{ display: 'block', fontSize: 8, color: C.ghost, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>Admin Password</label>
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(''); }} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Enter password" autoFocus
            style={{ width: '100%', height: 40, padding: '0 12px', background: C.char, border: `1px solid ${err ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, color: C.cream, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', outline: 'none', boxSizing: 'border-box' }}/>
          {err && <div style={{ marginTop: 5, fontSize: 10, color: C.red, fontFamily: 'JetBrains Mono, monospace' }}>✕ {err}</div>}
          <button onClick={submit} style={{ width: '100%', height: 40, marginTop: 14, background: `linear-gradient(90deg,${C.amber},${C.gold})`, color: '#070706', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Syne, sans-serif' }}>
            Enter Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [authed, setAuthed] = useState(() => { try { return localStorage.getItem(AUTH_STORAGE_KEY) === '1'; } catch { return false; } });
  const [data, setData]     = useState<Record<string, any> | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [period, setPeriod]       = useState('24h');
  const [tab, setTab]             = useState('overview');
  const [refreshMs, setRefreshMs] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const rTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = () => { try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {} setAuthed(false); setData(null); };

  const fetchData = useCallback(async (p?: string) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/analytics?period=${p ?? period}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? null);
      setLastFetch(new Date());
    } catch (e: any) { setError(e.message ?? 'Fetch failed'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { if (authed) fetchData(); }, [authed]);

  useEffect(() => {
    if (rTimer.current) clearInterval(rTimer.current);
    if (cTimer.current) clearInterval(cTimer.current);
    if (!authed || refreshMs === 0) { setCountdown(0); return; }
    setCountdown(refreshMs / 1000);
    rTimer.current = setInterval(() => { fetchData(); setCountdown(refreshMs / 1000); }, refreshMs);
    cTimer.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => { if (rTimer.current) clearInterval(rTimer.current); if (cTimer.current) clearInterval(cTimer.current); };
  }, [refreshMs, authed, fetchData]);

  // ── Data normalization ──────────────────────────────────────────────────────

  const nodeRows = useMemo(() => (data?.node_performance?.data ?? []).map((r: any) => ({
    node:             String(r.node ?? ''),
    total_attempts:   num(r.total_attempts),
    successes:        num(r.successes),
    failures:         num(r.failures),
    success_rate_pct: num(r.success_rate_pct),
    avg_ms:           nullableNum(r.avg_ms),
    race_wins:        num(r.race_wins),
  })), [data]);

  // ── Client-side global_summary derivation ───────────────────────────────────
  // If backend returns empty rows (query failed), sum up node_performance instead.
  // This ensures the overview stat cards always populate.
  const globalRow = useMemo(() => {
    const raw = data?.global_summary?.data?.[0];
    if (raw && (num(raw.total_attempts) > 0)) {
      return {
        total_attempts:   num(raw.total_attempts),
        successes:        num(raw.successes),
        failures:         num(raw.failures),
        race_wins:        num(raw.race_wins),
        success_rate_pct: num(raw.success_rate_pct),
        avg_ms:           nullableNum(raw.avg_ms),
      };
    }
    // Derive from node_performance (client-side aggregation)
    if (nodeRows.length === 0) return { total_attempts: 0, successes: 0, failures: 0, race_wins: 0, success_rate_pct: 0, avg_ms: null };
    const total  = nodeRows.reduce((s, r) => s + r.total_attempts, 0);
    const succ   = nodeRows.reduce((s, r) => s + r.successes, 0);
    const fail   = nodeRows.reduce((s, r) => s + r.failures, 0);
    const wins   = nodeRows.reduce((s, r) => s + r.race_wins, 0);
    // Weighted average latency across nodes (weight = successes)
    const wAvg   = nodeRows.reduce((s, r) => s + (r.avg_ms ?? 0) * r.successes, 0);
    return {
      total_attempts:   total,
      successes:        succ,
      failures:         fail,
      race_wins:        wins,
      success_rate_pct: total > 0 ? (succ / total) * 100 : 0,
      avg_ms:           succ > 0 ? wAvg / succ : null,
    };
  }, [data, nodeRows]);

  const trafficData = useMemo(() => (data?.traffic_timeseries?.data ?? []).map((r: any) => ({
    bucket:    fmtBucket(r.bucket ?? ''),
    attempts:  num(r.attempts),
    successes: num(r.successes),
    failures:  num(r.failures),
    wins:      num(r.wins),
    avg_ms:    num(r.avg_ms),
  })), [data]);

  const failRows = useMemo(() => (data?.recent_failures?.data ?? []).map((r: any) => ({
    node:        String(r.node ?? ''),
    error:       String(r.error ?? ''),
    status_code: num(r.status_code),
    timestamp:   String(r.timestamp ?? ''),
  })), [data]);

  const formatRows = useMemo(() => (data?.format_breakdown?.data ?? []).map((r: any) => ({
    format:    String(r.format ?? '(unknown)'),
    attempts:  num(r.attempts),
    successes: num(r.successes),
    avg_ms:    nullableNum(r.avg_ms),
  })), [data]);

  const coloRows = useMemo(() => (data?.colo_breakdown?.data ?? []).map((r: any) => ({
    colo:      String(r.colo ?? ''),
    attempts:  num(r.attempts),
    successes: num(r.successes),
    avg_ms:    nullableNum(r.avg_ms),
  })), [data]);

  const winRows = useMemo(() => (data?.win_rate?.data ?? []).map((r: any) => ({
    node:         String(r.node ?? ''),
    wins:         num(r.wins),
    successes:    num(r.successes),
    win_rate_pct: num(r.win_rate_pct),
  })), [data]);

  const laneRows = useMemo(() => (data?.lane_performance?.data ?? []).map((r: any) => ({
    lane:             String(r.lane ?? ''),
    attempts:         num(r.attempts),
    successes:        num(r.successes),
    success_rate_pct: num(r.success_rate_pct),
    avg_ms:           nullableNum(r.avg_ms),
    wins:             num(r.wins),
  })), [data]);

  // ── Client-side latency_percentiles derivation ──────────────────────────────
  // Backend latency_percentiles uses avgIf + countIf — should work now.
  // But if it returns empty, fall back to node_performance (no bucket counts available then).
  const latencyRows = useMemo(() => {
    const rows = data?.latency_percentiles?.data ?? [];
    if (rows.length > 0) {
      return rows.map((r: any) => ({
        node:          String(r.node ?? ''),
        total_success: num(r.total_success),
        avg_ms:        nullableNum(r.avg_ms),
        under_500ms:   num(r.under_500ms),
        under_1s:      num(r.under_1s),
        under_2s:      num(r.under_2s),
        under_4s:      num(r.under_4s),
      }));
    }
    // Fallback: derive from node_performance (no bucket breakdown, just avg_ms)
    return nodeRows.map(r => ({
      node:          r.node,
      total_success: r.successes,
      avg_ms:        r.avg_ms,
      under_500ms:   0, under_1s: 0, under_2s: 0, under_4s: 0,
    }));
  }, [data, nodeRows]);

  const heatmapData  = useMemo(() => data?.error_heatmap?.data  ?? [], [data]);
  const winPieData   = useMemo(() => winRows.filter(r => r.wins > 0).map(r => ({ name: nodeShortName(r.node).split(' ')[0], value: r.wins, color: nodeColor(r.node) })), [winRows]);
  const formatPieData = useMemo(() => formatRows.map((r, i) => ({ name: r.format.toUpperCase() || 'UNK', value: r.attempts, color: PIE_COLORS[i % PIE_COLORS.length] })), [formatRows]);

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)}/>;

  const TABS = ['overview', 'nodes', 'traffic', 'errors', 'breakdown'];
  const pLabel = PERIODS[period]?.label ?? period;

  return (
    <div style={{ minHeight: '100dvh', background: C.black, color: C.body, fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#070706}
        ::-webkit-scrollbar-thumb{background:rgba(196,124,46,0.2);border-radius:99px}
        .recharts-text{font-family:'JetBrains Mono',monospace!important;font-size:9px!important}
        .recharts-legend-item-text{font-size:9px!important;font-family:'JetBrains Mono',monospace!important}
      `}</style>

      {/* HEADER */}
      <header style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.1em', color: C.cream }}>POSTERIUM</span>
          <div style={{ width: 1, height: 14, background: C.border }}/>
          <span style={{ fontSize: 8, color: C.amber, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Analytics</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: loading ? C.yellow : C.green, animation: 'pulse-dot 2s ease-in-out infinite', boxShadow: `0 0 5px ${loading ? C.yellow : C.green}` }}/>
            <span style={{ fontSize: 8, color: C.ghost, fontFamily: 'JetBrains Mono, monospace' }}>{loading ? 'LOADING' : 'LIVE'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 1, padding: 3, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.borderFaint}`, borderRadius: 7 }}>
            {Object.entries(PERIODS).map(([k, v]) => (
              <button key={k} onClick={() => { setPeriod(k); fetchData(k); }} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', background: period === k ? 'rgba(196,124,46,0.18)' : 'transparent', color: period === k ? C.amber : C.ghost }}>{v.short}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 1, padding: 3, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.borderFaint}`, borderRadius: 7 }}>
            {REFRESH_INTERVALS.map(ri => (
              <button key={ri.label} onClick={() => setRefreshMs(ri.ms)} style={{ padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 9, fontWeight: 700, fontFamily: 'Syne, sans-serif', background: refreshMs === ri.ms ? 'rgba(196,124,46,0.18)' : 'transparent', color: refreshMs === ri.ms ? C.amber : C.ghost }}>{ri.label}</button>
            ))}
          </div>
          {refreshMs > 0 && countdown > 0 && <span style={{ fontSize: 9, color: C.ghost, fontFamily: 'JetBrains Mono, monospace' }}>↺{countdown}s</span>}
          <button onClick={() => fetchData()} disabled={loading} style={{ height: 28, padding: '0 12px', background: loading ? 'rgba(196,124,46,0.3)' : C.amber, color: '#070706', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 800, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', opacity: loading ? 0.7 : 1 }}>{loading ? '…' : '↻'}</button>
          <a href="/admin/db-stats" style={{ height: 28, padding: '0 12px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', color: C.dim, border: `1px solid ${C.borderFaint}`, borderRadius: 6, fontSize: 9, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', textDecoration: 'none' }}>DB Stats</a>
          <button onClick={logout} style={{ height: 28, padding: '0 10px', background: 'transparent', color: C.ghost, border: `1px solid ${C.borderFaint}`, borderRadius: 6, cursor: 'pointer', fontSize: 9, fontFamily: 'Syne, sans-serif', textTransform: 'uppercase' }}>Logout</button>
        </div>
      </header>

      {/* TABS */}
      <nav style={{ background: C.dark, borderBottom: `1px solid ${C.borderFaint}`, padding: '0 16px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '11px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: tab === t ? C.amber : C.ghost, fontSize: 11, fontWeight: 600, fontFamily: 'Syne, sans-serif', borderBottom: tab === t ? `2px solid ${C.amber}` : '2px solid transparent', marginBottom: -1, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </nav>

      {error && <div style={{ margin: '16px 16px 0', padding: '10px 14px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', color: C.red, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>✕ {error} — Check CF_ACCOUNT_ID / CF_API_TOKEN secrets.</div>}

      <main style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
              {loading ? Array(8).fill(0).map((_,i) => <Skel key={i} h={90}/>) : (<>
                <StatCard label="Total Attempts"  value={fmtNum(globalRow.total_attempts)}  sub={pLabel} color={C.amber} accent={C.amber}/>
                <StatCard label="Race Wins"        value={fmtNum(globalRow.race_wins)}        sub="Posters served"  color={C.gold}  accent={C.gold}/>
                <StatCard label="Successes"        value={fmtNum(globalRow.successes)}        sub={fmtPct(globalRow.success_rate_pct) + ' rate'} color={C.green} accent={C.green}/>
                <StatCard label="Failures"         value={fmtNum(globalRow.failures)}         sub={fmtPct(globalRow.total_attempts > 0 ? globalRow.failures/globalRow.total_attempts*100 : 0) + ' rate'} color={globalRow.failures > 50 ? C.red : C.dim} accent={C.red}/>
                <StatCard label="Avg Latency"      value={fmtMs(globalRow.avg_ms)}            sub="Weighted across nodes" color={msColor(globalRow.avg_ms)} accent={C.blue}/>
                <StatCard label="Active Nodes"     value={nodeRows.filter(r => r.total_attempts > 0).length} sub={`${nodeRows.filter(r => r.success_rate_pct >= 90).length} healthy`} color={C.cream} accent={C.purple}/>
                <StatCard label="Healthy"          value={nodeRows.filter(r => r.success_rate_pct >= 90).length} sub="≥90% success rate" color={C.green} accent={C.green}/>
                <StatCard label="Degraded / Down"  value={nodeRows.filter(r => r.success_rate_pct < 90 && r.total_attempts > 0).length} sub="<90% success" color={C.orange} accent={C.orange}/>
              </>)}
            </div>

            {/* Traffic chart */}
            <Card title="Traffic Over Time" tag={pLabel}>
              {loading ? <Skel h={200}/> : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gAt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.3}/><stop offset="95%" stopColor={C.amber} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gSc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.2}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="bucket" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={40}/>
                    <Tooltip content={<TT/>}/>
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }}/>
                    <Area type="monotone" dataKey="attempts"  name="Attempts"  stroke={C.amber} fill="url(#gAt)" strokeWidth={2}   dot={false}/>
                    <Area type="monotone" dataKey="successes" name="Successes" stroke={C.green} fill="url(#gSc)" strokeWidth={1.5} dot={false}/>
                    <Line type="monotone" dataKey="failures"  name="Failures"  stroke={C.red}                    strokeWidth={1.5} dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Node health + Win pie */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
              <Card title="Node Health Matrix" tag={pLabel}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {loading ? Array(4).fill(0).map((_,i) => <Skel key={i} h={80}/>) :
                    nodeRows.length === 0
                      ? <div style={{ color: C.ghost, fontSize: 11, padding: 20 }}>No data for this period.</div>
                      : nodeRows.map(row => {
                          const health = row.success_rate_pct >= 90 ? 'healthy' : row.success_rate_pct >= 10 ? 'degraded' : 'down';
                          const hc = health === 'healthy' ? C.green : health === 'degraded' ? C.yellow : C.red;
                          return (
                            <div key={row.node} style={{ padding: '10px 12px', background: C.char, border: `1px solid ${health === 'down' ? 'rgba(248,113,113,0.2)' : C.borderFaint}`, borderRadius: 8, borderLeft: `3px solid ${nodeColor(row.node)}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <div>
                                  <div style={{ fontSize: 10, color: C.label, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{nodeShortName(row.node).split(' ·')[0]}</div>
                                  <div style={{ fontSize: 8, color: hc, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>{health}</div>
                                </div>
                                <Gauge value={row.success_rate_pct} size={38}/>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                                {[
                                  { l: 'Avg',   v: fmtMs(row.avg_ms),      c: msColor(row.avg_ms) },
                                  { l: 'Wins',  v: fmtNum(row.race_wins),  c: row.race_wins > 0 ? C.gold : C.ghost },
                                  { l: 'Fails', v: fmtNum(row.failures),   c: row.failures > 50 ? C.red : C.ghost },
                                ].map(m => (
                                  <div key={m.l}>
                                    <div style={{ fontSize: 7, color: C.ghost, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>{m.l}</div>
                                    <div style={{ fontSize: 12, color: m.c, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{m.v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                </div>
              </Card>

              <Card title="Race Win Distribution">
                {loading ? <Skel h={180}/> : winPieData.length > 0 ? (<>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={winPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {winPieData.map((e, i) => <Cell key={i} fill={e.color} stroke="rgba(0,0,0,0.3)" strokeWidth={1}/>)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [fmtNum(v), 'Wins']} contentStyle={{ background: C.char, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 10 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {winRows.filter(r => r.wins > 0).sort((a,b) => b.wins - a.wins).map(r => (
                      <div key={r.node} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: nodeColor(r.node), flexShrink: 0 }}/>
                          <span style={{ fontSize: 9, color: C.label, fontFamily: 'JetBrains Mono, monospace' }}>{nodeShortName(r.node).split(' ')[0]}</span>
                        </div>
                        <span style={{ fontSize: 9, color: C.gold, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>⚡ {fmtNum(r.wins)}</span>
                      </div>
                    ))}
                  </div>
                </>) : <div style={{ color: C.ghost, fontSize: 11, textAlign: 'center', padding: 40 }}>No win data</div>}
              </Card>
            </div>

            {/* Lane performance */}
            {laneRows.length > 0 && (
              <Card title="Lane Performance (A/B/C)" tag="A=WA+Ohio  B=DE+Ohio  C=WA+DE">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                  {laneRows.map(lane => (
                    <div key={lane.lane} style={{ padding: 14, background: C.char, border: `1px solid ${C.borderFaint}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 24, fontFamily: 'Bebas Neue, cursive', color: C.amber, letterSpacing: '0.1em', marginBottom: 8 }}>Lane {lane.lane}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          { l: 'Attempts',     v: fmtNum(lane.attempts),         c: C.cream },
                          { l: 'Success Rate', v: fmtPct(lane.success_rate_pct), c: rateColor(lane.success_rate_pct) },
                          { l: 'Avg Latency',  v: fmtMs(lane.avg_ms),            c: msColor(lane.avg_ms) },
                          { l: 'Wins',         v: fmtNum(lane.wins),             c: C.gold },
                        ].map(m => (
                          <div key={m.l}>
                            <div style={{ fontSize: 7, color: C.ghost, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>{m.l}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: m.c, fontFamily: 'JetBrains Mono, monospace' }}>{m.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── NODES ────────────────────────────────────────────────────────── */}
        {tab === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Node Performance Table" tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', padding: 14 }}>
                {loading ? <Skel h={300}/> : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['Node','Status','Attempts','Success Rate','Avg Latency','Race Wins','Latency Dist'].map(h => (
                          <th key={h} style={{ padding: '7px 12px', textAlign: h==='Node'||h==='Status' ? 'left' : 'right', color: C.ghost, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', borderBottom: `1px solid ${C.borderFaint}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodeRows.map((row, i) => {
                        const health = row.success_rate_pct >= 90 ? 'healthy' : row.success_rate_pct >= 10 ? 'degraded' : 'down';
                        const hc = health === 'healthy' ? C.green : health === 'degraded' ? C.yellow : C.red;
                        const lRow = latencyRows.find(r => r.node === row.node);
                        return (
                          <tr key={row.node} style={{ background: i%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                            <td style={{ padding: '9px 12px', minWidth: 160 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: nodeColor(row.node), flexShrink: 0 }}/>
                                <span style={{ color: C.label, fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{nodeShortName(row.node)}</span>
                              </div>
                            </td>
                            <td style={{ padding: '9px 12px' }}><span style={{ fontSize: 8, color: hc, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', background: `${hc}18`, padding: '2px 6px', borderRadius: 3 }}>{health}</span></td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: C.dim, fontFamily: 'JetBrains Mono, monospace' }}>{fmtNum(row.total_attempts)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}><Gauge value={row.success_rate_pct} size={36}/></td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: msColor(row.avg_ms), fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{fmtMs(row.avg_ms)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: row.race_wins > 0 ? C.gold : C.ghost, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{row.race_wins > 0 ? `⚡ ${fmtNum(row.race_wins)}` : '—'}</td>
                            <td style={{ padding: '9px 12px', minWidth: 120 }}>{lRow && lRow.under_4s > 0 ? <LatencyDistBar row={lRow}/> : <span style={{ color: C.ghost, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}>{fmtMs(row.avg_ms)} avg</span>}</td>
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
                    <BarChart data={[...nodeRows].sort((a,b) => (a.avg_ms??9999)-(b.avg_ms??9999))} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} tickFormatter={v => fmtMs(v)}/>
                      <YAxis type="category" dataKey="node" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={80} tickFormatter={n => nodeShortName(n).split(' ')[0]}/>
                      <Tooltip content={<TT/>} formatter={(v: any) => [fmtMs(v), 'Avg Latency']}/>
                      <Bar dataKey="avg_ms" name="Avg Latency" radius={[0, 4, 4, 0]}>
                        {nodeRows.map((row, i) => <Cell key={i} fill={msColor(row.avg_ms)}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card title="Success Rate by Node">
                {loading ? <Skel h={220}/> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[...nodeRows].sort((a,b) => b.success_rate_pct-a.success_rate_pct)} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" domain={[0,100]} tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`}/>
                      <YAxis type="category" dataKey="node" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={80} tickFormatter={n => nodeShortName(n).split(' ')[0]}/>
                      <Tooltip content={<TT/>} formatter={(v: any) => [fmtPct(v), 'Success Rate']}/>
                      <ReferenceLine x={90} stroke={C.green} strokeDasharray="4 3" strokeWidth={1} label={{ value: 'SLA', fill: C.green, fontSize: 8 }}/>
                      <Bar dataKey="success_rate_pct" name="Success Rate" radius={[0, 4, 4, 0]}>
                        {nodeRows.map((row, i) => <Cell key={i} fill={rateColor(row.success_rate_pct)}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── TRAFFIC ──────────────────────────────────────────────────────── */}
        {tab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {loading ? Array(4).fill(0).map((_,i) => <Skel key={i} h={88}/>) : (<>
                <StatCard label="Total (period)"  value={fmtNum(globalRow.total_attempts)} sub={pLabel} color={C.amber}/>
                <StatCard label="Peak Bucket"     value={fmtNum(Math.max(...trafficData.map(d => d.attempts), 0))} sub="Highest bucket" color={C.gold}/>
                <StatCard label="Avg Per Bucket"  value={fmtNum(trafficData.length ? Math.round(trafficData.reduce((s,d)=>s+d.attempts,0)/trafficData.length) : 0)} sub="Mean rate" color={C.cream}/>
                <StatCard label="Win Rate"        value={fmtPct(globalRow.total_attempts > 0 ? globalRow.race_wins/globalRow.total_attempts*100 : 0)} sub="Wins / attempts" color={C.green}/>
              </>)}
            </div>
            <Card title="Attempts · Successes · Failures · Wins" tag={pLabel}>
              {loading ? <Skel h={240}/> : (
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="gA2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.25}/><stop offset="95%" stopColor={C.amber} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gS2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.15}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gW2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.gold} stopOpacity={0.2}/><stop offset="95%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="bucket" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={42}/>
                    <Tooltip content={<TT/>}/>
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }}/>
                    <Area type="monotone" dataKey="attempts"  name="Attempts"  stroke={C.amber} fill="url(#gA2)" strokeWidth={2}   dot={false}/>
                    <Area type="monotone" dataKey="successes" name="Successes" stroke={C.green} fill="url(#gS2)" strokeWidth={1.5} dot={false}/>
                    <Area type="monotone" dataKey="wins"      name="Race Wins" stroke={C.gold}  fill="url(#gW2)" strokeWidth={1.5} dot={false}/>
                    <Line  type="monotone" dataKey="failures"  name="Failures"  stroke={C.red}                    strokeWidth={1.5} dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card title="Avg Latency Over Time">
              {loading ? <Skel h={180}/> : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="bucket" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={50} tickFormatter={v => fmtMs(v)}/>
                    <Tooltip content={<TT/>} formatter={(v: any) => [fmtMs(v), 'Avg latency']}/>
                    <ReferenceLine y={1000} stroke={C.yellow} strokeDasharray="4 3" strokeWidth={1} label={{ value: '1s', fill: C.yellow, fontSize: 8 }}/>
                    <Line type="monotone" dataKey="avg_ms" name="Avg Latency" stroke={C.blue} strokeWidth={2} dot={false} connectNulls/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ── ERRORS ───────────────────────────────────────────────────────── */}
        {tab === 'errors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Failure Heatmap — Node × Time" tag="colour = failure intensity">
              {loading ? <Skel h={160}/> : <HourHeatmap data={heatmapData.length > 0 ? heatmapData : trafficData.map(d => ({ ...d, node: 'global' }))}/>}
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card title="Failures by Node">
                {loading ? <Skel h={180}/> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[...nodeRows].filter(r => r.failures > 0).sort((a,b) => b.failures-a.failures)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false}/>
                      <YAxis type="category" dataKey="node" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={80} tickFormatter={n => nodeShortName(n).split(' ')[0]}/>
                      <Tooltip content={<TT/>}/>
                      <Bar dataKey="failures" name="Failures" fill={C.red} radius={[0, 4, 4, 0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card title="Error Rate Over Time">
                {loading ? <Skel h={180}/> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trafficData.map(d => ({ ...d, error_rate: d.attempts > 0 ? (d.failures/d.attempts)*100 : 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="bucket" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                      <YAxis tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={36} tickFormatter={v => `${v.toFixed(0)}%`} domain={[0,'auto']}/>
                      <Tooltip content={<TT/>} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Error Rate']}/>
                      <ReferenceLine y={10} stroke={C.red} strokeDasharray="4 3" strokeWidth={1} label={{ value: '10%', fill: C.red, fontSize: 8 }}/>
                      <Line type="monotone" dataKey="error_rate" name="Error Rate" stroke={C.red} strokeWidth={2} dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>
            <Card title={`Recent Failures (${failRows.length})`} tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                {loading ? <div style={{ padding: 14 }}><Skel h={200}/></div> :
                  failRows.length === 0
                    ? <div style={{ padding: 20, textAlign: 'center', color: C.green, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>✓ No failures in this period</div>
                    : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead style={{ position: 'sticky', top: 0, background: C.mid, zIndex: 1 }}>
                          <tr>
                            {['Time','Node','Status','Error'].map(h => (
                              <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: C.ghost, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', borderBottom: `1px solid ${C.borderFaint}` }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {failRows.slice(0,100).map((r, i) => (
                            <tr key={i} style={{ background: i%2===0 ? 'rgba(248,113,113,0.02)' : 'transparent', borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                              <td style={{ padding: '6px 12px', color: C.ghost, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', fontSize: 9 }}>{relTime(r.timestamp)}</td>
                              <td style={{ padding: '6px 12px', color: C.label, fontFamily: 'JetBrains Mono, monospace' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: nodeColor(r.node), flexShrink: 0 }}/>
                                  {nodeShortName(r.node).split(' ')[0]}
                                </div>
                              </td>
                              <td style={{ padding: '6px 12px' }}>
                                <span style={{ fontSize: 9, color: r.status_code === 0 ? C.orange : C.red, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.borderFaint}`, borderRadius: 3, padding: '1px 5px' }}>
                                  {r.status_code === 0 ? 'TIMEOUT' : `HTTP ${Math.round(r.status_code)}`}
                                </span>
                              </td>
                              <td style={{ padding: '6px 12px', color: C.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>}
              </div>
            </Card>
          </div>
        )}

        {/* ── BREAKDOWN ────────────────────────────────────────────────────── */}
        {tab === 'breakdown' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

              <Card title="Format Distribution">
                {loading ? <Skel h={180}/> : (<>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={formatPieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                        {formatPieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip formatter={(v: any) => [fmtNum(v), 'Attempts']} contentStyle={{ background: C.char, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 10 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {formatRows.map((r, i) => (
                      <div key={r.format} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i%PIE_COLORS.length] }}/>
                          <span style={{ fontSize: 10, color: C.label, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{r.format.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 9, color: C.dim, fontFamily: 'JetBrains Mono, monospace' }}>{fmtNum(r.attempts)}</span>
                          <span style={{ fontSize: 9, color: msColor(r.avg_ms), fontFamily: 'JetBrains Mono, monospace' }}>{fmtMs(r.avg_ms)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>)}
              </Card>

              <Card title="Input Type Distribution">
                {loading ? <Skel h={180}/> : (() => {
                  const typeRows = (data?.type_breakdown?.data ?? []).map((r: any, i: number) => ({ input_type: String(r.input_type ?? ''), attempts: num(r.attempts), avg_ms: nullableNum(r.avg_ms), color: PIE_COLORS[(i+3)%PIE_COLORS.length] }));
                  const maxA = Math.max(...typeRows.map(r => r.attempts), 1);
                  if (!typeRows.length) return <div style={{ color: C.ghost, fontSize: 11, padding: 20, textAlign: 'center' }}>No data</div>;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                      {typeRows.map(r => (
                        <div key={r.input_type}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: C.amber, fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.08em' }}>{(r.input_type || 'UNKNOWN').toUpperCase()}</span>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <span style={{ fontSize: 9, color: C.dim, fontFamily: 'JetBrains Mono, monospace' }}>{fmtNum(r.attempts)}</span>
                              <span style={{ fontSize: 9, color: msColor(r.avg_ms), fontFamily: 'JetBrains Mono, monospace' }}>{fmtMs(r.avg_ms)}</span>
                            </div>
                          </div>
                          <div style={{ height: 5, borderRadius: 2.5, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                            <div style={{ height: '100%', borderRadius: 2.5, background: r.color, width: `${(r.attempts/maxA)*100}%`, transition: 'width 0.6s ease' }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </Card>

              <Card title="Top Datacenters">
                {loading ? <Skel h={180}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {coloRows.slice(0,12).map(r => {
                      const rate = r.attempts > 0 ? (r.successes/r.attempts)*100 : 0;
                      const maxA = Math.max(...coloRows.map(c => c.attempts), 1);
                      return (
                        <div key={r.colo}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: C.cream, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{r.colo}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span style={{ fontSize: 9, color: rateColor(rate), fontFamily: 'JetBrains Mono, monospace' }}>{fmtPct(rate)}</span>
                              <span style={{ fontSize: 9, color: msColor(r.avg_ms), fontFamily: 'JetBrains Mono, monospace' }}>{fmtMs(r.avg_ms)}</span>
                              <span style={{ fontSize: 9, color: C.ghost, fontFamily: 'JetBrains Mono, monospace' }}>{fmtNum(r.attempts)}</span>
                            </div>
                          </div>
                          <div style={{ height: 3, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: rateColor(rate), width: `${(r.attempts/maxA)*100}%` }}/>
                          </div>
                        </div>
                      );
                    })}
                    {coloRows.length === 0 && <div style={{ color: C.ghost, fontSize: 11, padding: 10 }}>No colo data</div>}
                  </div>
                )}
              </Card>
            </div>

            <Card title="Datacenter Volume · Colour = Success Rate">
              {loading ? <Skel h={200}/> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={coloRows.slice(0,20)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="colo" tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false}/>
                    <YAxis tick={{ fill: C.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={40}/>
                    <Tooltip content={<TT/>}/>
                    <Bar dataKey="attempts" name="Attempts" radius={[4, 4, 0, 0]}>
                      {coloRows.map((r, i) => { const rate = r.attempts > 0 ? (r.successes/r.attempts)*100 : 0; return <Cell key={i} fill={rateColor(rate)} fillOpacity={0.7}/>; })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        <div style={{ marginTop: 28, paddingTop: 14, borderTop: `1px solid ${C.borderFaint}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 8, color: C.ghost, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>POSTERIUM · raster_metrics · CF Analytics Engine · global_summary derived client-side when empty</span>
          <span style={{ fontSize: 8, color: C.ghost, fontFamily: 'JetBrains Mono, monospace' }}>{lastFetch ? `Refreshed: ${lastFetch.toLocaleTimeString()}` : ''} · {pLabel}</span>
        </div>
      </main>
    </div>
  );
}