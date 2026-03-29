// src/components/admin/AnalyticsDashboard.tsx
//
// Rasterizer Analytics Dashboard — film design system
// Uses Cloudflare Analytics Engine data via /analytics API
// ─────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE = 'https://api.spicydevs.xyz';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeRow {
  node: string;
  total_attempts: number;
  successes: number;
  failures: number;
  success_rate_pct: number;
  avg_ms: number;
  race_wins: number;
}

interface HourRow {
  hour: string;
  attempts: number;
  successes: number;
  failures: number;
}

interface FormatRow {
  format: string;
  attempts: number;
  successes: number;
  avg_ms: number;
}

interface TypeRow {
  input_type: string;
  attempts: number;
  successes: number;
  avg_ms: number;
}

interface ColoRow {
  colo: string;
  attempts: number;
  successes: number;
  avg_ms: number;
}

interface WinRow {
  node: string;
  wins: number;
  successes: number;
  win_rate_pct: number;
}

interface FailureRow {
  node: string;
  error: string;
  status_code: number;
  timestamp: string;
}

interface AnalyticsData {
  node_performance?: { data: NodeRow[] };
  node_performance_7d?: { data: NodeRow[] };
  hourly_traffic?: { data: HourRow[] };
  recent_failures?: { data: FailureRow[] };
  format_breakdown?: { data: FormatRow[] };
  type_breakdown?: { data: TypeRow[] };
  colo_breakdown?: { data: ColoRow[] };
  win_rate?: { data: WinRow[] };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  black:   '#070706',
  dark:    '#0e0d0b',
  mid:     '#181612',
  char:    '#222018',
  amber:   '#c47c2e',
  gold:    '#d4a245',
  pale:    '#e8d8a8',
  cream:   '#f0e6cc',
  silver:  '#b0a898',
  ghost:   'rgba(140,130,112,0.38)',
  dim:     'rgba(180,168,148,0.62)',
  label:   'rgba(212,198,172,0.82)',
  body:    'rgba(230,218,196,0.92)',
  green:   '#36A240',
  red:     '#f87171',
  border:  'rgba(196,124,46,0.12)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msColor(ms: number): string {
  if (!ms) return C.ghost;
  if (ms < 500)  return C.green;
  if (ms < 1500) return '#facc15';
  if (ms < 3500) return '#fb923c';
  return C.red;
}

function rateColor(pct: number): string {
  if (pct >= 95) return C.green;
  if (pct >= 80) return '#facc15';
  if (pct >= 60) return '#fb923c';
  return C.red;
}

function fmtMs(ms: number): string {
  if (!ms) return '—';
  return `${Math.round(ms)}ms`;
}

function fmtNum(n: number): string {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────

interface BarChartProps {
  data: { label: string; value: number; color?: string; sub?: string }[];
  maxValue?: number;
  height?: number;
  unit?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, maxValue, height = 140, unit = '' }) => {
  if (!data.length) return null;
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(12, Math.floor(280 / data.length) - 6);
  const gap = 6;
  const totalW = data.length * (barW + gap);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        width={Math.max(totalW + 32, 300)}
        height={height + 44}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const y = Math.round((1 - frac) * height) + 1;
          return (
            <g key={frac}>
              <line x1={0} y1={y} x2={totalW + 32} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <text x={0} y={y - 3} fill={C.ghost}
                fontSize={8} fontFamily="JetBrains Mono,monospace">
                {Math.round(max * frac)}{unit}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d.value / max) * height));
          const x = i * (barW + gap) + 24;
          const y = height - barH + 1;
          const color = d.color ?? C.amber;
          return (
            <g key={d.label}>
              <rect
                x={x} y={y} width={barW} height={barH}
                fill={color} opacity={0.85} rx={2}
              />
              {/* Value above bar */}
              <text x={x + barW / 2} y={y - 5}
                textAnchor="middle" fill={C.dim}
                fontSize={8} fontFamily="JetBrains Mono,monospace">
                {d.value > 0 ? `${d.value}${unit}` : ''}
              </text>
              {/* Label below */}
              <text x={x + barW / 2} y={height + 14}
                textAnchor="middle" fill={C.ghost}
                fontSize={8} fontFamily="JetBrains Mono,monospace"
                style={{ textOverflow: 'ellipsis' }}>
                {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
              </text>
              {d.sub && (
                <text x={x + barW / 2} y={height + 26}
                  textAnchor="middle" fill="rgba(122,117,110,0.3)"
                  fontSize={7} fontFamily="JetBrains Mono,monospace">
                  {d.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─── Line / Area Chart (Hourly Traffic) ────────────────────────────────────

interface LineChartProps {
  data: HourRow[];
  height?: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, height = 120 }) => {
  if (!data.length) return null;
  const W = 560;
  const maxVal = Math.max(...data.map(d => d.attempts), 1);
  const pts = (arr: number[]) =>
    arr.map((v, i) => {
      const x = (i / (arr.length - 1)) * W;
      const y = height - (v / maxVal) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

  const attempts = data.map(d => d.attempts);
  const successes = data.map(d => d.successes);
  const failures  = data.map(d => d.failures);

  // Build area path for attempts
  const areaPath = (() => {
    const top = attempts.map((v, i) => ({
      x: (i / (attempts.length - 1)) * W,
      y: height - (v / maxVal) * height,
    }));
    const pathD = top.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      + ` L${W},${height} L0,${height} Z`;
    return pathD;
  })();

  const labels = data
    .filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0)
    .map((d, i, arr) => {
      const idx = data.indexOf(arr[i] ?? d);
      const x = (idx / (data.length - 1)) * W;
      const hour = new Date(d.hour).getHours();
      return { x, label: `${hour}:00` };
    });

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W + 8} height={height + 28} style={{ display: 'block' }}>
        {/* Grid */}
        {[0.25, 0.5, 0.75].map(f => {
          const y = height - f * height;
          return (
            <g key={f}>
              <line x1={0} y1={y} x2={W} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <text x={2} y={y - 3} fill={C.ghost} fontSize={8}
                fontFamily="JetBrains Mono,monospace">
                {Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={C.amber} opacity={0.06} />

        {/* Lines */}
        <polyline points={pts(attempts)} fill="none"
          stroke={C.amber} strokeWidth={1.5} strokeLinejoin="round" />
        <polyline points={pts(successes)} fill="none"
          stroke={C.green} strokeWidth={1} strokeLinejoin="round" opacity={0.7} />
        <polyline points={pts(failures)} fill="none"
          stroke={C.red} strokeWidth={1} strokeLinejoin="round" opacity={0.7} />

        {/* X labels */}
        {labels.map(({ x, label }) => (
          <text key={label} x={x} y={height + 18}
            textAnchor="middle" fill={C.ghost} fontSize={8}
            fontFamily="JetBrains Mono,monospace">
            {label}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        {[
          { color: C.amber, label: 'Total' },
          { color: C.green, label: 'Success' },
          { color: C.red,   label: 'Failures' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 2, background: color, borderRadius: 1 }} />
            <span style={{ fontSize: 9, color: C.ghost, fontFamily: 'JetBrains Mono,monospace',
              letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Gauge (success rate) ─────────────────────────────────────────────────

const Gauge: React.FC<{ value: number; size?: number }> = ({ value, size = 56 }) => {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const color = rateColor(value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2 + 4}
        textAnchor="middle" fill={color}
        fontSize={11} fontWeight="bold" fontFamily="JetBrains Mono,monospace">
        {value}%
      </text>
    </svg>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────

const Card: React.FC<{
  title: string;
  tag?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}> = ({ title, tag, children, fullWidth }) => (
  <div style={{
    background: C.mid,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    overflow: 'hidden',
    gridColumn: fullWidth ? '1 / -1' : undefined,
  }}>
    <div style={{
      padding: '10px 16px',
      borderBottom: `1px solid rgba(255,255,255,0.04)`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: C.amber,
        fontFamily: 'Syne, sans-serif',
      }}>
        {title}
      </span>
      {tag && (
        <span style={{
          fontSize: 7, color: C.ghost, letterSpacing: '0.12em',
          fontFamily: 'JetBrains Mono,monospace',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 3, padding: '2px 6px',
        }}>
          {tag}
        </span>
      )}
    </div>
    <div style={{ padding: 16 }}>
      {children}
    </div>
  </div>
);

// ─── Stat chip ────────────────────────────────────────────────────────────

const StatChip: React.FC<{
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}> = ({ label, value, sub, color = C.cream }) => (
  <div style={{
    padding: '14px 16px',
    background: C.char,
    border: `1px solid rgba(255,255,255,0.04)`,
    borderRadius: 8,
    display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <span style={{ fontSize: 8, color: C.ghost, letterSpacing: '0.14em',
      textTransform: 'uppercase', fontFamily: 'JetBrains Mono,monospace' }}>
      {label}
    </span>
    <span style={{ fontSize: 24, fontWeight: 800, color,
      fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.04em', lineHeight: 1 }}>
      {value}
    </span>
    {sub && (
      <span style={{ fontSize: 9, color: C.ghost, fontFamily: 'JetBrains Mono,monospace' }}>
        {sub}
      </span>
    )}
  </div>
);

// ─── Node Table ───────────────────────────────────────────────────────────

const NodeTable: React.FC<{ rows: NodeRow[]; showWins?: boolean }> = ({ rows, showWins }) => {
  const sorted = [...rows].sort((a, b) => (a.avg_ms ?? 9999) - (b.avg_ms ?? 9999));
  const maxAttempts = Math.max(...rows.map(r => r.total_attempts), 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            {['Node', 'Attempts', 'Rate', 'Avg ms', showWins && 'Wins'].filter(Boolean).map(h => (
              <th key={String(h)} style={{
                padding: '6px 8px', textAlign: 'left',
                color: C.ghost, fontSize: 8, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                fontFamily: 'JetBrains Mono,monospace',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.node} style={{
              background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
            }}>
              <td style={{ padding: '8px 8px', color: C.label,
                fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: rateColor(row.success_rate_pct),
                    boxShadow: `0 0 5px ${rateColor(row.success_rate_pct)}`,
                    flexShrink: 0,
                  }} />
                  {row.node}
                </div>
              </td>
              <td style={{ padding: '8px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    height: 4, borderRadius: 2, background: C.amber,
                    opacity: 0.6,
                    width: Math.max(4, (row.total_attempts / maxAttempts) * 80),
                  }} />
                  <span style={{ color: C.dim, fontSize: 10,
                    fontFamily: 'JetBrains Mono,monospace' }}>
                    {fmtNum(row.total_attempts)}
                  </span>
                </div>
              </td>
              <td style={{ padding: '8px 8px' }}>
                <Gauge value={Math.round(row.success_rate_pct ?? 0)} size={42} />
              </td>
              <td style={{ padding: '8px 8px',
                color: msColor(row.avg_ms), fontFamily: 'JetBrains Mono,monospace',
                fontSize: 11, fontWeight: 700 }}>
                {fmtMs(row.avg_ms)}
              </td>
              {showWins && (
                <td style={{ padding: '8px 8px', color: C.gold,
                  fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>
                  {row.race_wins > 0 ? `⚡ ${row.race_wins}` : '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Auth screen ──────────────────────────────────────────────────────────

const AuthScreen: React.FC<{ onAuth: (pw: string) => void; error?: string }> = ({ onAuth, error }) => {
  const [pw, setPw] = useState('');
  return (
    <div style={{
      minHeight: '100dvh', background: C.black, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        width: 360, background: C.mid,
        border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid rgba(255,255,255,0.06)`,
          background: 'rgba(196,124,46,0.04)',
        }}>
          <div style={{ fontSize: 9, color: C.amber, letterSpacing: '0.16em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono,monospace',
            marginBottom: 4 }}>
            ◆ POSTERIUM ANALYTICS
          </div>
          <div style={{ fontSize: 18, color: C.cream,
            fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.06em' }}>
            ACCESS REQUIRED
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAuth(pw); }}
            placeholder="Enter admin password"
            autoFocus
            style={{
              width: '100%', height: 40, padding: '0 12px',
              background: C.char, border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 6, color: C.cream, fontSize: 12,
              fontFamily: 'JetBrains Mono,monospace', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ marginTop: 8, fontSize: 11, color: C.red,
              fontFamily: 'JetBrains Mono,monospace' }}>
              ✕ {error}
            </p>
          )}
          <button
            onClick={() => onAuth(pw)}
            style={{
              width: '100%', height: 38, marginTop: 12,
              background: C.amber, color: '#070706',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
            }}
          >
            Enter Dashboard
          </button>
          <p style={{ marginTop: 16, fontSize: 10, color: C.ghost,
            fontFamily: 'JetBrains Mono,monospace', lineHeight: 1.6,
            textAlign: 'center' }}>
            Analytics data is read-only. Cloudflare Analytics Engine retains 90 days of data.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────

const Skeleton: React.FC<{ h?: number }> = ({ h = 80 }) => (
  <div style={{
    height: h, borderRadius: 6,
    background: 'linear-gradient(110deg,#181612 25%,#222018 50%,#181612 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.8s linear infinite',
  }} />
);

// ─── Main Dashboard ───────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [activeSection, setActiveSection] = useState<'overview' | 'nodes' | 'traffic' | 'failures'>('overview');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleAuth = useCallback((pw: string) => {
    if (pw === 'admin123') {
      setAuthed(true);
    } else {
      setAuthError('Incorrect password');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? null);
      setLastUpdated(new Date());
    } catch (e: any) {
      setFetchError(e.message ?? 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  // ── Derived metrics ───────────────────────────────────────────────────
  const nodeData = useMemo((): NodeRow[] =>
    (timeRange === '7d' ? data?.node_performance_7d?.data : data?.node_performance?.data) ?? [],
    [data, timeRange]
  );

  const summary = useMemo(() => {
    const total  = nodeData.reduce((s, r) => s + (r.total_attempts ?? 0), 0);
    const wins   = nodeData.reduce((s, r) => s + (r.race_wins ?? 0), 0);
    const succ   = nodeData.reduce((s, r) => s + (r.successes  ?? 0), 0);
    const rate   = total > 0 ? Math.round((succ / total) * 100) : 0;
    const best   = nodeData.sort((a, b) => a.avg_ms - b.avg_ms)[0];
    const winner = (data?.win_rate?.data ?? []).sort((a, b) => b.win_rate_pct - a.win_rate_pct)[0];
    return { total, wins, succ, rate, best, winner };
  }, [nodeData, data]);

  const hourlyData = data?.hourly_traffic?.data ?? [];
  const formatData = data?.format_breakdown?.data ?? [];
  const typeData   = data?.type_breakdown?.data ?? [];
  const coloData   = data?.colo_breakdown?.data?.slice(0, 10) ?? [];
  const failures   = data?.recent_failures?.data?.slice(0, 25) ?? [];
  const winData    = data?.win_rate?.data ?? [];

  if (!authed) {
    return <AuthScreen onAuth={handleAuth} error={authError} />;
  }

  // ── Sections ──────────────────────────────────────────────────────────
  const NAV = [
    { id: 'overview', label: 'Overview' },
    { id: 'nodes',    label: 'Nodes'    },
    { id: 'traffic',  label: 'Traffic'  },
    { id: 'failures', label: 'Failures' },
  ] as const;

  return (
    <div style={{
      minHeight: '100dvh', background: C.black,
      color: C.body, fontFamily: 'DM Sans, sans-serif',
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        background: C.dark, borderBottom: `1px solid ${C.border}`,
        padding: '0 24px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 16, fontFamily: 'Bebas Neue, cursive',
            letterSpacing: '0.1em', color: C.cream }}>
            POSTERIUM
          </span>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <span style={{ fontSize: 9, color: C.amber, letterSpacing: '0.16em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono,monospace' }}>
            Rasterizer Analytics
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: 8, color: C.ghost,
              fontFamily: 'JetBrains Mono,monospace' }}>
              Updated {relativeTime(lastUpdated.toISOString())}
            </span>
          )}
          {/* Time range toggle */}
          <div style={{ display: 'flex', gap: 2, padding: 2,
            background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)`,
            borderRadius: 5 }}>
            {(['24h', '7d'] as const).map(t => (
              <button key={t} onClick={() => setTimeRange(t)} style={{
                padding: '4px 12px', borderRadius: 3, border: 'none', cursor: 'pointer',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                fontFamily: 'Syne, sans-serif', textTransform: 'uppercase',
                background: timeRange === t ? 'rgba(196,124,46,0.15)' : 'transparent',
                color: timeRange === t ? C.amber : C.ghost,
              }}>
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              height: 30, padding: '0 14px',
              background: loading ? 'rgba(196,124,46,0.3)' : C.amber,
              color: '#070706', border: 'none', borderRadius: 5, cursor: 'pointer',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
              fontFamily: 'Syne, sans-serif', textTransform: 'uppercase',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {/* ── Section nav ────────────────────────────────────────────────── */}
      <nav style={{
        background: C.dark, borderBottom: `1px solid rgba(255,255,255,0.04)`,
        padding: '0 24px', display: 'flex', gap: 0,
      }}>
        {NAV.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveSection(id)} style={{
            padding: '10px 18px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: activeSection === id ? C.amber : C.ghost,
            fontSize: 11, fontWeight: 600, fontFamily: 'Syne, sans-serif',
            borderBottom: activeSection === id ? `2px solid ${C.amber}` : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.15s',
          }}>
            {label}
          </button>
        ))}
      </nav>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <main style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        {fetchError && (
          <div style={{
            padding: '12px 16px', borderRadius: 6, marginBottom: 20,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: C.red, fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
          }}>
            ✕ {fetchError} — Is the API running?
          </div>
        )}

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Summary chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
              {loading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} h={88} />)
              ) : (
                <>
                  <StatChip label="Total Requests" value={fmtNum(summary.total)}
                    sub={`${timeRange} window`} color={C.amber} />
                  <StatChip label="Success Rate" value={`${summary.rate}%`}
                    sub="across all nodes" color={rateColor(summary.rate)} />
                  <StatChip label="Successful" value={fmtNum(summary.succ)}
                    sub="rendered OK" color={C.green} />
                  <StatChip label="Race Wins" value={fmtNum(summary.wins)}
                    sub="first to respond" color={C.gold} />
                  <StatChip label="Fastest" value={summary.best?.node?.replace(/-/g,' ')?.slice(0,12) ?? '—'}
                    sub={fmtMs(summary.best?.avg_ms)} color={C.cream} />
                </>
              )}
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Node latency bar chart */}
              <Card title="Avg Latency per Node" tag={timeRange}>
                {loading ? <Skeleton h={180} /> : (
                  <BarChart
                    data={nodeData.slice(0, 12).map(r => ({
                      label: r.node,
                      value: Math.round(r.avg_ms ?? 0),
                      color: msColor(r.avg_ms),
                    }))}
                    unit="ms"
                    height={140}
                  />
                )}
              </Card>

              {/* Win rate bar chart */}
              <Card title="Race Wins per Node" tag="24h">
                {loading ? <Skeleton h={180} /> : (
                  <BarChart
                    data={winData.slice(0, 10).map(r => ({
                      label: r.node,
                      value: r.wins,
                      color: C.amber,
                      sub: `${r.win_rate_pct}%`,
                    }))}
                    height={140}
                  />
                )}
              </Card>

              {/* Format breakdown */}
              <Card title="Format Breakdown" tag="24h">
                {loading ? <Skeleton h={120} /> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {formatData.map(r => (
                      <div key={r.format} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 40, fontSize: 10, color: C.amber,
                          fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
                          textTransform: 'uppercase' }}>
                          {r.format || '?'}
                        </span>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)',
                          borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', background: C.amber, borderRadius: 3,
                            width: `${(r.attempts / Math.max(...formatData.map(x => x.attempts), 1)) * 100}%`,
                          }} />
                        </div>
                        <span style={{ width: 48, textAlign: 'right', fontSize: 10,
                          color: C.dim, fontFamily: 'JetBrains Mono,monospace' }}>
                          {fmtNum(r.attempts)}
                        </span>
                        <span style={{ width: 52, textAlign: 'right', fontSize: 10,
                          color: msColor(r.avg_ms), fontFamily: 'JetBrains Mono,monospace' }}>
                          {fmtMs(r.avg_ms)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Type + colo breakdown */}
              <Card title="Media Type + Top Colos" tag="24h">
                {loading ? <Skeleton h={120} /> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {typeData.map(r => (
                      <div key={r.input_type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 50, fontSize: 10, color: C.label,
                          fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>
                          {r.input_type || '?'}
                        </span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)',
                          borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', background: C.gold, borderRadius: 2,
                            width: `${(r.attempts / Math.max(...typeData.map(x => x.attempts), 1)) * 100}%`,
                          }} />
                        </div>
                        <span style={{ width: 40, textAlign: 'right', fontSize: 10,
                          color: C.dim, fontFamily: 'JetBrains Mono,monospace' }}>
                          {fmtNum(r.attempts)}
                        </span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '6px 0' }} />
                    <div style={{ fontSize: 8, color: C.ghost, letterSpacing: '0.1em',
                      textTransform: 'uppercase', fontFamily: 'JetBrains Mono,monospace',
                      marginBottom: 4 }}>
                      Top Datacenters
                    </div>
                    {coloData.slice(0, 6).map(r => (
                      <div key={r.colo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 36, fontSize: 10, color: C.silver,
                          fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>
                          {r.colo}
                        </span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)',
                          borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', background: C.silver, opacity: 0.6, borderRadius: 2,
                            width: `${(r.attempts / Math.max(...coloData.map(x => x.attempts), 1)) * 100}%`,
                          }} />
                        </div>
                        <span style={{ width: 40, textAlign: 'right', fontSize: 10,
                          color: C.dim, fontFamily: 'JetBrains Mono,monospace' }}>
                          {fmtNum(r.attempts)}
                        </span>
                        <span style={{ width: 52, textAlign: 'right', fontSize: 10,
                          color: msColor(r.avg_ms), fontFamily: 'JetBrains Mono,monospace' }}>
                          {fmtMs(r.avg_ms)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── NODES ────────────────────────────────────────────────────── */}
        {activeSection === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title={`Node Performance — ${timeRange}`} fullWidth>
              {loading ? <Skeleton h={300} /> : <NodeTable rows={nodeData} showWins />}
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Latency Distribution" tag={timeRange}>
                <BarChart
                  data={nodeData.map(r => ({
                    label: r.node,
                    value: Math.round(r.avg_ms ?? 0),
                    color: msColor(r.avg_ms),
                  }))}
                  unit="ms" height={160}
                />
              </Card>
              <Card title="Success Rate" tag={timeRange}>
                <BarChart
                  data={nodeData.map(r => ({
                    label: r.node,
                    value: Math.round(r.success_rate_pct ?? 0),
                    color: rateColor(r.success_rate_pct),
                  }))}
                  maxValue={100}
                  unit="%" height={160}
                />
              </Card>
            </div>
          </div>
        )}

        {/* ── TRAFFIC ──────────────────────────────────────────────────── */}
        {activeSection === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="Hourly Traffic — Last 24h" fullWidth>
              {loading ? <Skeleton h={180} /> : (
                hourlyData.length ? <LineChart data={hourlyData} height={150} />
                  : <p style={{ color: C.ghost, fontSize: 11 }}>No hourly data available.</p>
              )}
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {loading
                ? Array(3).fill(0).map((_, i) => <Skeleton key={i} h={80} />)
                : (() => {
                    const total   = hourlyData.reduce((s, r) => s + r.attempts, 0);
                    const success = hourlyData.reduce((s, r) => s + r.successes, 0);
                    const fail    = hourlyData.reduce((s, r) => s + r.failures, 0);
                    const peak    = hourlyData.reduce((best, r) =>
                      r.attempts > best.attempts ? r : best, hourlyData[0] ?? { attempts: 0, hour: '' }
                    );
                    return (
                      <>
                        <StatChip label="24h Total" value={fmtNum(total)} color={C.amber} />
                        <StatChip label="24h Success" value={fmtNum(success)} color={C.green} />
                        <StatChip label="24h Failures" value={fmtNum(fail)} color={fail > 0 ? C.red : C.ghost} />
                      </>
                    );
                  })()
              }
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Format Mix" tag="24h">
                <BarChart
                  data={formatData.map(r => ({ label: r.format || '?', value: r.attempts, color: C.amber }))}
                  height={120}
                />
              </Card>
              <Card title="Datacenter Heatmap" tag="Top 10">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {coloData.map(r => {
                    const pct = (r.attempts / Math.max(...coloData.map(x => x.attempts), 1)) * 100;
                    return (
                      <div key={r.colo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 36, fontFamily: 'JetBrains Mono,monospace',
                          fontSize: 10, fontWeight: 700, color: C.label }}>{r.colo}</span>
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)',
                          borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: `linear-gradient(90deg,${C.amber},${C.gold})`,
                            width: `${pct}%`,
                          }} />
                        </div>
                        <span style={{ width: 40, textAlign: 'right', fontSize: 10,
                          color: C.dim, fontFamily: 'JetBrains Mono,monospace' }}>
                          {fmtNum(r.attempts)}
                        </span>
                        <span style={{ width: 52, textAlign: 'right', fontSize: 10,
                          color: rateColor(Math.round((r.successes / r.attempts) * 100)),
                          fontFamily: 'JetBrains Mono,monospace' }}>
                          {Math.round((r.successes / Math.max(r.attempts, 1)) * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── FAILURES ─────────────────────────────────────────────────── */}
        {activeSection === 'failures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%',
                background: failures.length > 0 ? C.red : C.green,
                boxShadow: `0 0 6px ${failures.length > 0 ? C.red : C.green}` }} />
              <span style={{ fontSize: 11, color: failures.length > 0 ? C.red : C.green,
                fontFamily: 'JetBrains Mono,monospace' }}>
                {failures.length > 0
                  ? `${failures.length} recent failures detected`
                  : 'No recent failures — all nodes healthy'}
              </span>
            </div>
            <Card title="Recent Failures — Last 24h" fullWidth>
              {loading ? <Skeleton h={300} /> : failures.length === 0 ? (
                <p style={{ color: C.ghost, fontSize: 11, textAlign: 'center', padding: '32px 0' }}>
                  ✓ No failures in the last 24 hours
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['When', 'Node', 'Status', 'Error'].map(h => (
                          <th key={h} style={{
                            padding: '6px 10px', textAlign: 'left',
                            color: C.ghost, fontSize: 8, fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            fontFamily: 'JetBrains Mono,monospace',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {failures.map((r, i) => (
                        <tr key={i} style={{
                          background: i % 2 === 0 ? 'rgba(248,113,113,0.02)' : 'transparent',
                        }}>
                          <td style={{ padding: '7px 10px', color: C.ghost,
                            fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
                            whiteSpace: 'nowrap' }}>
                            {relativeTime(r.timestamp)}
                          </td>
                          <td style={{ padding: '7px 10px', color: C.label,
                            fontFamily: 'JetBrains Mono,monospace', fontSize: 10 }}>
                            {r.node}
                          </td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{
                              fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
                              color: r.status_code === 0 ? '#fb923c' : C.red,
                              background: 'rgba(248,113,113,0.08)',
                              border: '1px solid rgba(248,113,113,0.15)',
                              borderRadius: 3, padding: '2px 6px',
                            }}>
                              {r.status_code === 0 ? 'TIMEOUT' : `HTTP ${r.status_code}`}
                            </span>
                          </td>
                          <td style={{ padding: '7px 10px', color: C.dim,
                            fontFamily: 'JetBrains Mono,monospace', fontSize: 9,
                            maxWidth: 340, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.error || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Failure breakdown by node */}
            {!loading && failures.length > 0 && (() => {
              const byNode: Record<string, number> = {};
              failures.forEach(f => { byNode[f.node] = (byNode[f.node] ?? 0) + 1; });
              const nodeFailData = Object.entries(byNode)
                .sort((a, b) => b[1] - a[1])
                .map(([label, value]) => ({ label, value, color: C.red }));
              return (
                <Card title="Failures by Node" tag="breakdown">
                  <BarChart data={nodeFailData} height={100} />
                </Card>
              );
            })()}
          </div>
        )}

        {/* ── Footer note ──────────────────────────────────────────────── */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 8, color: C.ghost,
            fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.12em' }}>
            POSTERIUM ANALYTICS ENGINE · 90 DAY RETENTION · APPEND-ONLY
          </span>
          <span style={{ fontSize: 8, color: 'rgba(122,117,110,0.2)',
            fontFamily: 'JetBrains Mono,monospace' }}>
            raster_metrics dataset · Cloudflare Analytics Engine
          </span>
        </div>
      </main>
    </div>
  );
}