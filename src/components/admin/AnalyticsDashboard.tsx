// src/components/admin/AnalyticsDashboard.tsx
//
// Posterium Rasterizer Analytics — Film Noir Edition
// Full analytics dashboard with persistent auth, fixed number parsing,
// hourly traffic charts, node health matrix, failure analysis, and colo heatmap.

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';

const API_BASE = 'https://api.spicydevs.xyz';
const AUTH_STORAGE_KEY = 'posterium_analytics_auth_v1';
const CORRECT_PASSWORD = 'admin123';

// ── Type definitions ──────────────────────────────────────────────────────────

interface NodeRow {
  node: string;
  total_attempts: number;
  successes: number;
  failures: number;
  success_rate_pct: number;
  avg_ms: number | null;
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
  avg_ms: number | null;
}

interface TypeRow {
  input_type: string;
  attempts: number;
  successes: number;
  avg_ms: number | null;
}

interface ColoRow {
  colo: string;
  attempts: number;
  successes: number;
  avg_ms: number | null;
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

interface QueryResult {
  data: any[];
  rows?: number;
  rows_before_limit_at_least?: number;
}

interface AnalyticsData {
  node_performance?: QueryResult;
  node_performance_7d?: QueryResult;
  hourly_traffic?: QueryResult;
  recent_failures?: QueryResult;
  format_breakdown?: QueryResult;
  type_breakdown?: QueryResult;
  colo_breakdown?: QueryResult;
  win_rate?: QueryResult;
}

// ── Number parsing — API returns all values as strings ────────────────────────

function num(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}

function nullableNum(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

// ── Row normalisers ───────────────────────────────────────────────────────────

function normalizeNodeRows(raw: any[]): NodeRow[] {
  return (raw ?? []).map(r => ({
    node:             String(r.node ?? ''),
    total_attempts:   num(r.total_attempts),
    successes:        num(r.successes),
    failures:         num(r.failures),
    success_rate_pct: num(r.success_rate_pct),
    avg_ms:           nullableNum(r.avg_ms),
    race_wins:        num(r.race_wins),
  }));
}

function normalizeHourRows(raw: any[]): HourRow[] {
  return (raw ?? []).map(r => ({
    hour:      String(r.hour ?? ''),
    attempts:  num(r.attempts),
    successes: num(r.successes),
    failures:  num(r.failures),
  }));
}

function normalizeFormatRows(raw: any[]): FormatRow[] {
  return (raw ?? []).map(r => ({
    format:    String(r.format ?? '(unknown)'),
    attempts:  num(r.attempts),
    successes: num(r.successes),
    avg_ms:    nullableNum(r.avg_ms),
  }));
}

function normalizeColoRows(raw: any[]): ColoRow[] {
  return (raw ?? []).map(r => ({
    colo:      String(r.colo ?? ''),
    attempts:  num(r.attempts),
    successes: num(r.successes),
    avg_ms:    nullableNum(r.avg_ms),
  }));
}

function normalizeWinRows(raw: any[]): WinRow[] {
  return (raw ?? []).map(r => ({
    node:        String(r.node ?? ''),
    wins:        num(r.wins),
    successes:   num(r.successes),
    win_rate_pct: num(r.win_rate_pct),
  }));
}

function normalizeFailureRows(raw: any[]): FailureRow[] {
  return (raw ?? []).map(r => ({
    node:       String(r.node ?? ''),
    error:      String(r.error ?? ''),
    status_code: num(r.status_code),
    timestamp:  String(r.timestamp ?? ''),
  }));
}

// ── Design tokens (matches Posterium film system) ─────────────────────────────

const C = {
  black:  '#070706',
  dark:   '#0e0d0b',
  mid:    '#181612',
  char:   '#222018',
  amber:  '#c47c2e',
  gold:   '#d4a245',
  cream:  '#f0e6cc',
  silver: '#b0a898',
  ghost:  'rgba(140,130,112,0.38)',
  dim:    'rgba(180,168,148,0.62)',
  label:  'rgba(212,198,172,0.82)',
  body:   'rgba(230,218,196,0.92)',
  green:  '#4ade80',
  yellow: '#facc15',
  orange: '#fb923c',
  red:    '#f87171',
  border: 'rgba(196,124,46,0.14)',
  borderFaint: 'rgba(255,255,255,0.04)',
};

// ── Utility helpers ───────────────────────────────────────────────────────────

function msColor(ms: number | null): string {
  if (ms === null) return C.ghost;
  if (ms < 400)  return C.green;
  if (ms < 900)  return C.yellow;
  if (ms < 2000) return C.orange;
  return C.red;
}

function rateColor(pct: number): string {
  if (pct >= 90) return C.green;
  if (pct >= 70) return C.yellow;
  if (pct >= 40) return C.orange;
  return C.red;
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

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function relTime(iso: string): string {
  const ms   = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusColor(code: number): string {
  if (code === 0)           return C.orange;
  if (code >= 500)          return C.red;
  if (code >= 400)          return C.yellow;
  return C.ghost;
}

function nodeShortName(n: string): string {
  const MAP: Record<string, string> = {
    'wsrv':                    'wsrv.nl',
    'ohio':                    'Ohio (Netlify)',
    'washington':              'Washington (Vercel)',
    'spaceify-germany':        'Germany (Spaceify)',
    'spaceify-france':         'France (Spaceify)',
    'simple-worker (binding)': 'Simple Worker',
    'simple-worker (http)':    'Simple Worker (HTTP)',
  };
  return MAP[n] ?? n;
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

const Sparkline: React.FC<{ values: number[]; color?: string; width?: number; height?: number }> = ({
  values, color = C.amber, width = 80, height = 24,
}) => {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * width;
    const y = height - (v / max) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" opacity={0.8}/>
      {/* Fill area */}
      <polyline
        points={`0,${height} ${pts} ${width},${height}`}
        fill={color} opacity={0.08}
        stroke="none"
      />
    </svg>
  );
};

// ── Gauge ring ────────────────────────────────────────────────────────────────

const Gauge: React.FC<{ value: number; size?: number; label?: string }> = ({
  value, size = 52, label,
}) => {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(value / 100, 1)) * circ;
  const color = rateColor(value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4}/>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}/>
        <text x={size/2} y={size/2 + 4.5}
          textAnchor="middle" fill={color}
          fontSize={11} fontWeight="700"
          fontFamily="JetBrains Mono, monospace">
          {value.toFixed(0)}%
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 8, color: C.ghost, letterSpacing: '0.1em',
          textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
          {label}
        </span>
      )}
    </div>
  );
};

// ── Mini stat pill ────────────────────────────────────────────────────────────

const StatPill: React.FC<{
  label: string; value: string | number; sub?: string;
  color?: string; accent?: string; trend?: number[];
}> = ({ label, value, sub, color = C.cream, accent = C.amber, trend }) => (
  <div style={{
    padding: '14px 18px',
    background: C.char,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Accent top strip */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, ${accent}, transparent)`,
      opacity: 0.5,
    }}/>
    <span style={{
      fontSize: 8, color: C.ghost, letterSpacing: '0.16em',
      textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace',
    }}>
      {label}
    </span>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
      <span style={{
        fontSize: 28, fontWeight: 800, color,
        fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.03em', lineHeight: 1,
      }}>
        {value}
      </span>
      {trend && trend.length > 1 && (
        <Sparkline values={trend} color={accent} width={60} height={24}/>
      )}
    </div>
    {sub && (
      <span style={{ fontSize: 9, color: C.ghost, fontFamily: 'JetBrains Mono, monospace' }}>
        {sub}
      </span>
    )}
  </div>
);

// ── Card container ────────────────────────────────────────────────────────────

const Card: React.FC<{
  title: string; tag?: string; tagColor?: string;
  children: React.ReactNode; fullWidth?: boolean;
  noPad?: boolean; extra?: React.ReactNode;
}> = ({ title, tag, tagColor = C.amber, children, fullWidth, noPad, extra }) => (
  <div style={{
    background: C.mid,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    overflow: 'hidden',
    gridColumn: fullWidth ? '1 / -1' : undefined,
  }}>
    <div style={{
      padding: '10px 16px',
      borderBottom: `1px solid ${C.borderFaint}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(196,124,46,0.025)',
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: C.amber,
        fontFamily: 'Syne, sans-serif',
      }}>
        {title}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {extra}
        {tag && (
          <span style={{
            fontSize: 7, color: tagColor, letterSpacing: '0.12em',
            fontFamily: 'JetBrains Mono, monospace',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.borderFaint}`,
            borderRadius: 3, padding: '2px 7px',
          }}>
            {tag}
          </span>
        )}
      </div>
    </div>
    <div style={noPad ? undefined : { padding: 16 }}>
      {children}
    </div>
  </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Skel: React.FC<{ h?: number; w?: string }> = ({ h = 80, w = '100%' }) => (
  <div style={{
    height: h, borderRadius: 6, width: w,
    background: 'linear-gradient(110deg,#181612 25%,#222018 50%,#181612 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.8s linear infinite',
  }}/>
);

// ── Horizontal bar row ────────────────────────────────────────────────────────

const HBar: React.FC<{
  label: string; value: number; max: number; color: string;
  subLeft?: string; subRight?: string; subColor?: string;
}> = ({ label, value, max, color, subLeft, subRight, subColor = C.dim }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 28 }}>
    <span style={{ width: 80, fontSize: 10, color: C.label, fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 600, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)',
      borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
      <div style={{
        height: '100%', background: color, borderRadius: 3,
        width: `${Math.min((value / Math.max(max, 1)) * 100, 100)}%`,
        transition: 'width 0.6s ease',
      }}/>
    </div>
    {subLeft && (
      <span style={{ width: 46, textAlign: 'right', fontSize: 10, color: subColor,
        fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        {subLeft}
      </span>
    )}
    {subRight && (
      <span style={{ width: 52, textAlign: 'right', fontSize: 10, color: subColor,
        fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
        {subRight}
      </span>
    )}
  </div>
);

// ── Hourly area chart ─────────────────────────────────────────────────────────

const HourlyChart: React.FC<{ data: HourRow[]; height?: number }> = ({ data, height = 140 }) => {
  if (!data.length) return <p style={{ color: C.ghost, fontSize: 11, padding: '20px 0' }}>No hourly data.</p>;

  const W = 540;
  const PAD_L = 36;
  const PAD_B = 24;
  const chartW = W - PAD_L;
  const chartH = height - PAD_B;
  const maxVal = Math.max(...data.map(d => d.attempts), 1);

  const pts = (arr: number[]) =>
    arr.map((v, i) => {
      const x = PAD_L + (i / Math.max(arr.length - 1, 1)) * chartW;
      const y = chartH - (v / maxVal) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

  const areaPath = (() => {
    const topPts = data.map((d, i) => ({
      x: PAD_L + (i / Math.max(data.length - 1, 1)) * chartW,
      y: chartH - (d.attempts / maxVal) * chartH,
    }));
    return topPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
      + ` L${PAD_L + chartW},${chartH} L${PAD_L},${chartH} Z`;
  })();

  const gridLines = [0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.floor(data.length / 7));

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={W} height={height} style={{ display: 'block', minWidth: W }}>
        {/* Grid */}
        {gridLines.map(f => {
          const y = chartH - f * chartH;
          return (
            <g key={f}>
              <line x1={PAD_L} y1={y} x2={W} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3,4"/>
              <text x={PAD_L - 4} y={y + 3.5}
                textAnchor="end" fill={C.ghost} fontSize={8}
                fontFamily="JetBrains Mono, monospace">
                {Math.round(maxVal * f)}
              </text>
            </g>
          );
        })}

        {/* Area + lines */}
        <path d={areaPath} fill={C.amber} opacity={0.07}/>
        <polyline points={pts(data.map(d => d.attempts))} fill="none"
          stroke={C.amber} strokeWidth={2} strokeLinejoin="round"/>
        <polyline points={pts(data.map(d => d.successes))} fill="none"
          stroke={C.green} strokeWidth={1.5} strokeLinejoin="round" opacity={0.75}/>
        <polyline points={pts(data.map(d => d.failures))} fill="none"
          stroke={C.red} strokeWidth={1.5} strokeLinejoin="round" opacity={0.65}/>

        {/* X labels */}
        {data.map((d, i) => {
          if (i % labelStep !== 0) return null;
          const x = PAD_L + (i / Math.max(data.length - 1, 1)) * chartW;
          const hour = new Date(d.hour.replace(' ', 'T') + 'Z').getUTCHours();
          return (
            <text key={i} x={x} y={height - 5}
              textAnchor="middle" fill={C.ghost} fontSize={8}
              fontFamily="JetBrains Mono, monospace">
              {`${hour.toString().padStart(2, '0')}:00`}
            </text>
          );
        })}

        {/* Data point dots for latest */}
        {data.map((d, i) => {
          const x = PAD_L + (i / Math.max(data.length - 1, 1)) * chartW;
          const y = chartH - (d.attempts / maxVal) * chartH;
          if (i !== data.length - 1) return null;
          return <circle key={i} cx={x} cy={y} r={3} fill={C.amber}/>;
        })}
      </svg>

      <div style={{ display: 'flex', gap: 18, marginTop: 8, paddingLeft: PAD_L }}>
        {[
          { color: C.amber, label: 'Total Rasterizations' },
          { color: C.green, label: 'Successes' },
          { color: C.red,   label: 'Failures' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 18, height: 2, background: color, borderRadius: 1 }}/>
            <span style={{ fontSize: 8, color: C.ghost, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Node performance table ────────────────────────────────────────────────────

const NodeTable: React.FC<{ rows: NodeRow[]; winRows?: WinRow[]; timeRange: string }> = ({
  rows, winRows, timeRange,
}) => {
  const [sort, setSort] = useState<'avg_ms' | 'success_rate_pct' | 'total_attempts' | 'race_wins'>('avg_ms');
  const [dir, setDir] = useState<1 | -1>(1);

  const winMap = useMemo(() => {
    const m: Record<string, WinRow> = {};
    (winRows ?? []).forEach(r => { m[r.node] = r; });
    return m;
  }, [winRows]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = sort === 'avg_ms' ? (a.avg_ms ?? 99999) : a[sort];
      const bv = sort === 'avg_ms' ? (b.avg_ms ?? 99999) : b[sort];
      return (av - bv) * dir;
    });
  }, [rows, sort, dir]);

  const toggleSort = (col: typeof sort) => {
    if (sort === col) setDir(d => d === 1 ? -1 : 1);
    else { setSort(col); setDir(1); }
  };

  const maxAttempts = Math.max(...rows.map(r => r.total_attempts), 1);

  const TH: React.FC<{ col: typeof sort; children: React.ReactNode; right?: boolean }> = ({
    col, children, right,
  }) => (
    <th
      onClick={() => toggleSort(col)}
      style={{
        padding: '8px 12px', textAlign: right ? 'right' : 'left',
        color: sort === col ? C.amber : C.ghost,
        fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
        fontFamily: 'JetBrains Mono, monospace',
        borderBottom: `1px solid ${C.borderFaint}`,
        cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      }}>
      {children} {sort === col ? (dir === 1 ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 8, color: C.ghost, fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 8, letterSpacing: '0.1em' }}>
        CLICK HEADER TO SORT · {timeRange.toUpperCase()} WINDOW · {rows.length} NODES
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', color: C.ghost,
              fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              borderBottom: `1px solid ${C.borderFaint}` }}>
              Node
            </th>
            <TH col="total_attempts">Attempts</TH>
            <th style={{ padding: '8px 12px', textAlign: 'right', color: C.ghost,
              fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              borderBottom: `1px solid ${C.borderFaint}` }}>
              Rate
            </th>
            <TH col="avg_ms" right>Avg Latency</TH>
            <TH col="race_wins" right>Race Wins</TH>
            <th style={{ padding: '8px 12px', textAlign: 'right', color: C.ghost,
              fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              borderBottom: `1px solid ${C.borderFaint}` }}>
              Win Rate
            </th>
            <th style={{ padding: '8px 12px', textAlign: 'right', color: C.ghost,
              fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
              borderBottom: `1px solid ${C.borderFaint}` }}>
              Failures
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const win = winMap[row.node];
            const isBest = row.avg_ms !== null && row.avg_ms === Math.min(
              ...rows.filter(r => r.avg_ms !== null && r.success_rate_pct > 10)
                .map(r => r.avg_ms as number)
            );
            const health = row.success_rate_pct >= 90 ? 'healthy'
              : row.success_rate_pct >= 50 ? 'degraded' : 'down';
            const healthColor = health === 'healthy' ? C.green
              : health === 'degraded' ? C.yellow : C.red;

            return (
              <tr key={row.node} style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                borderBottom: `1px solid rgba(255,255,255,0.02)`,
              }}>
                <td style={{ padding: '10px 12px', minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: healthColor,
                      boxShadow: `0 0 6px ${healthColor}`,
                      flexShrink: 0,
                    }}/>
                    <div>
                      <div style={{ color: C.label, fontSize: 11, fontWeight: 600,
                        fontFamily: 'JetBrains Mono, monospace' }}>
                        {nodeShortName(row.node)}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                        {isBest && (
                          <span style={{ fontSize: 7, color: C.amber, background: 'rgba(196,124,46,0.12)',
                            border: `1px solid rgba(196,124,46,0.25)`, borderRadius: 2,
                            padding: '1px 5px', fontFamily: 'JetBrains Mono, monospace',
                            letterSpacing: '0.08em' }}>
                            ⚡ FASTEST
                          </span>
                        )}
                        <span style={{ fontSize: 7, color: C.ghost,
                          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
                          background: 'rgba(255,255,255,0.04)', borderRadius: 2,
                          padding: '1px 5px', border: `1px solid ${C.borderFaint}` }}>
                          {health.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Attempts with bar */}
                <td style={{ padding: '10px 12px', minWidth: 120 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      height: 4, borderRadius: 2, background: 'rgba(196,124,46,0.5)',
                      width: Math.max(4, (row.total_attempts / maxAttempts) * 72),
                    }}/>
                    <span style={{ color: C.dim, fontSize: 10,
                      fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                      {fmtNum(row.total_attempts)}
                    </span>
                  </div>
                </td>

                {/* Rate gauge */}
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <Gauge value={row.success_rate_pct} size={44}/>
                </td>

                {/* Latency */}
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ color: msColor(row.avg_ms), fontSize: 13,
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                    {fmtMs(row.avg_ms)}
                  </span>
                </td>

                {/* Race wins */}
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ color: row.race_wins > 0 ? C.gold : C.ghost,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700 }}>
                    {row.race_wins > 0 ? `⚡ ${fmtNum(row.race_wins)}` : '—'}
                  </span>
                </td>

                {/* Win rate */}
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ color: win && win.win_rate_pct > 0 ? C.gold : C.ghost,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                    {win && win.successes > 0 ? fmtPct(win.win_rate_pct) : '—'}
                  </span>
                </td>

                {/* Failures */}
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ color: row.failures > 0 ? C.red : C.ghost,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                    {fmtNum(row.failures)}
                  </span>
                  {row.failures > 0 && row.total_attempts > 0 && (
                    <div style={{ fontSize: 8, color: C.ghost,
                      fontFamily: 'JetBrains Mono, monospace' }}>
                      {fmtPct(row.failures / row.total_attempts * 100)} err
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Failure log table ─────────────────────────────────────────────────────────

const FailureTable: React.FC<{ rows: FailureRow[] }> = ({ rows }) => {
  const [filter, setFilter] = useState<string>('all');

  const nodes = useMemo(() => {
    const s = new Set(rows.map(r => r.node));
    return ['all', ...Array.from(s)];
  }, [rows]);

  const filtered = filter === 'all' ? rows : rows.filter(r => r.node === filter);

  // Aggregate by node+error
  const aggregated = useMemo(() => {
    const m: Record<string, { node: string; error: string; status_code: number; count: number; last: string }> = {};
    filtered.forEach(r => {
      const key = `${r.node}|${r.status_code}`;
      if (!m[key]) m[key] = { node: r.node, error: r.error, status_code: r.status_code, count: 0, last: r.timestamp };
      m[key].count++;
      if (r.timestamp > m[key].last) m[key].last = r.timestamp;
    });
    return Object.values(m).sort((a, b) => b.count - a.count);
  }, [filtered]);

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {nodes.map(n => (
          <button key={n} onClick={() => setFilter(n)} style={{
            padding: '4px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
            fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: filter === n ? 'rgba(196,124,46,0.15)' : 'rgba(255,255,255,0.04)',
            color: filter === n ? C.amber : C.ghost,
            transition: 'all 0.15s',
          }}>
            {n === 'all' ? 'All nodes' : nodeShortName(n)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 9, color: C.ghost,
          fontFamily: 'JetBrains Mono, monospace', alignSelf: 'center',
          padding: '4px 0' }}>
          {filtered.length} events · {aggregated.length} distinct
        </span>
      </div>

      {/* Aggregated table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Node', 'Error', 'Count', 'Last seen'].map(h => (
                <th key={h} style={{ padding: '7px 12px', textAlign: h === 'Count' ? 'right' : 'left',
                  color: C.ghost, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace',
                  borderBottom: `1px solid ${C.borderFaint}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aggregated.map((r, i) => (
              <tr key={i} style={{
                background: i % 2 === 0 ? 'rgba(248,113,113,0.02)' : 'transparent',
                borderBottom: `1px solid rgba(255,255,255,0.02)`,
              }}>
                <td style={{ padding: '8px 12px', color: C.label,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                  {nodeShortName(r.node)}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                    color: statusColor(r.status_code),
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.borderFaint}`,
                    borderRadius: 3, padding: '2px 7px',
                  }}>
                    {r.status_code === 0 ? 'TIMEOUT' : `HTTP ${r.status_code}`}
                  </span>
                  <span style={{ marginLeft: 8, color: C.ghost, fontSize: 9,
                    fontFamily: 'JetBrains Mono, monospace' }}>
                    {r.error}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right',
                  color: r.count > 10 ? C.red : C.dim,
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                  {fmtNum(r.count)}
                </td>
                <td style={{ padding: '8px 12px', color: C.ghost,
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                  whiteSpace: 'nowrap' }}>
                  {relTime(r.last)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raw recent log (collapsed) */}
      <details style={{ marginTop: 14 }}>
        <summary style={{ cursor: 'pointer', fontSize: 9, color: C.ghost,
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
          textTransform: 'uppercase', padding: '6px 0' }}>
          Raw log ({filtered.length} events)
        </summary>
        <div style={{ maxHeight: 280, overflowY: 'auto', marginTop: 8,
          border: `1px solid ${C.borderFaint}`, borderRadius: 6 }}>
          {filtered.slice(0, 100).map((r, i) => (
            <div key={i} style={{
              padding: '5px 12px', fontSize: 9,
              fontFamily: 'JetBrains Mono, monospace',
              borderBottom: i < filtered.length - 1 ? `1px solid rgba(255,255,255,0.02)` : 'none',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <span style={{ color: C.ghost, flexShrink: 0, width: 90 }}>
                {relTime(r.timestamp)}
              </span>
              <span style={{ color: C.silver, flexShrink: 0, width: 140,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nodeShortName(r.node)}
              </span>
              <span style={{ color: statusColor(r.status_code), flexShrink: 0 }}>
                {r.status_code === 0 ? 'TIMEOUT' : `HTTP ${r.status_code}`}
              </span>
              <span style={{ color: C.ghost }}>
                {r.error}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

// ── Auth screen ───────────────────────────────────────────────────────────────

const AuthScreen: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);

  const submit = useCallback(() => {
    if (pw === CORRECT_PASSWORD) {
      try { localStorage.setItem(AUTH_STORAGE_KEY, '1'); } catch {}
      onAuth();
    } else {
      setErr('Incorrect password');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPw('');
    }
  }, [pw, onAuth]);

  return (
    <div style={{
      minHeight: '100dvh', background: C.black, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-8px); }
          40%,80% { transform: translateX(8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div style={{
        width: 380, background: C.mid, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.9), 0 0 80px rgba(196,124,46,0.04)',
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 26px 18px',
          borderBottom: `1px solid ${C.borderFaint}`,
          background: 'rgba(196,124,46,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(140deg,#c47c2e,#d4a245)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              📊
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.amber, letterSpacing: '0.18em',
                textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace',
                marginBottom: 2 }}>
                ◆ POSTERIUM
              </div>
              <div style={{ fontSize: 20, color: C.cream,
                fontFamily: 'Bebas Neue, cursive', letterSpacing: '0.06em' }}>
                ANALYTICS ACCESS
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '22px 26px' }}>
          <div style={{ fontSize: 10, color: C.ghost, lineHeight: 1.6,
            fontFamily: 'JetBrains Mono, monospace', marginBottom: 18 }}>
            Rasterizer node performance, failure analysis, and traffic data.
            90-day retention via Cloudflare Analytics Engine.
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 8, color: C.ghost,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace', marginBottom: 6 }}>
              Admin Password
            </label>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: '100%', height: 42, padding: '0 14px',
                background: C.char, border: `1px solid ${err ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 7, color: C.cream, fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
            />
            {err && (
              <div style={{ marginTop: 6, fontSize: 10, color: C.red,
                fontFamily: 'JetBrains Mono, monospace' }}>
                ✕ {err}
              </div>
            )}
          </div>

          <button onClick={submit} style={{
            width: '100%', height: 42,
            background: 'linear-gradient(90deg,#c47c2e,#d4a245)',
            color: '#070706', border: 'none', borderRadius: 7, cursor: 'pointer',
            fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontFamily: 'Syne, sans-serif',
            boxShadow: '0 0 24px rgba(196,124,46,0.2)',
            transition: 'opacity 0.15s',
          }}>
            Enter Dashboard
          </button>

          <div style={{ marginTop: 14, fontSize: 9, color: C.ghost,
            fontFamily: 'JetBrains Mono, monospace', textAlign: 'center',
            lineHeight: 1.6 }}>
            Session persists across page reloads
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [authed, setAuthed] = useState(() => {
    try { return localStorage.getItem(AUTH_STORAGE_KEY) === '1'; }
    catch { return false; }
  });
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');
  const [tab, setTab] = useState<'overview' | 'nodes' | 'traffic' | 'failures' | 'breakdown'>('overview');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(() => {
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
    setAuthed(false);
    setData(null);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      const json = await res.json();
      setData(json.data ?? null);
      setLastFetch(new Date());
    } catch (e: any) {
      setError(e.message ?? 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData();
    // Auto-refresh every 2 minutes
    refreshTimer.current = setInterval(fetchData, 120_000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [authed, fetchData]);

  // ── Normalised data ───────────────────────────────────────────────────────
  const nodeRows24  = useMemo(() => normalizeNodeRows(data?.node_performance?.data ?? []), [data]);
  const nodeRows7d  = useMemo(() => normalizeNodeRows(data?.node_performance_7d?.data ?? []), [data]);
  const nodeRows    = timeRange === '7d' ? nodeRows7d : nodeRows24;

  const hourlyRows  = useMemo(() => normalizeHourRows(data?.hourly_traffic?.data ?? []), [data]);
  const formatRows  = useMemo(() => normalizeFormatRows(data?.format_breakdown?.data ?? []), [data]);
  const coloRows    = useMemo(() => normalizeColoRows(data?.colo_breakdown?.data ?? []), [data]);
  const winRows     = useMemo(() => normalizeWinRows(data?.win_rate?.data ?? []), [data]);
  const failRows    = useMemo(() => normalizeFailureRows(data?.recent_failures?.data ?? []), [data]);

  // ── Summary metrics ───────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalAttempts  = nodeRows.reduce((s, r) => s + r.total_attempts, 0);
    const totalSuccesses = nodeRows.reduce((s, r) => s + r.successes, 0);
    const totalRaceWins  = nodeRows.reduce((s, r) => s + r.race_wins, 0);  // = actual poster renders
    const totalFailures  = nodeRows.reduce((s, r) => s + r.failures, 0);

    // Overall success rate across all node attempts
    const overallRate = totalAttempts > 0
      ? (totalSuccesses / totalAttempts) * 100 : 0;

    // Best performing node (fastest with >10% success rate)
    const candidateNodes = nodeRows.filter(r => r.avg_ms !== null && r.success_rate_pct > 10);
    const best = candidateNodes.sort((a, b) => (a.avg_ms ?? 99999) - (b.avg_ms ?? 99999))[0];

    // Dominant race winner
    const topWinner = [...winRows].sort((a, b) => b.wins - a.wins)[0];

    // Hourly summary
    const hourlyTotal    = hourlyRows.reduce((s, r) => s + r.attempts, 0);
    const hourlySuccess  = hourlyRows.reduce((s, r) => s + r.successes, 0);
    const hourlyFail     = hourlyRows.reduce((s, r) => s + r.failures, 0);
    const peakHour       = hourlyRows.reduce((best, r) =>
      r.attempts > best.attempts ? r : best, hourlyRows[0] ?? { hour: '', attempts: 0 }
    );

    // Unique requests ≈ race wins (each request → one winner)
    return {
      totalAttempts, totalSuccesses, totalRaceWins, totalFailures,
      overallRate, best, topWinner,
      hourlyTotal, hourlySuccess, hourlyFail, peakHour,
      totalNodes: nodeRows.length,
      healthyNodes: nodeRows.filter(r => r.success_rate_pct >= 90).length,
      degradedNodes: nodeRows.filter(r => r.success_rate_pct >= 10 && r.success_rate_pct < 90).length,
      downNodes: nodeRows.filter(r => r.success_rate_pct < 10).length,
    };
  }, [nodeRows, hourlyRows, winRows]);

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)}/>;

  const NAV_TABS = [
    { id: 'overview',   label: 'Overview'   },
    { id: 'nodes',      label: 'Nodes'      },
    { id: 'traffic',    label: 'Traffic'    },
    { id: 'failures',   label: 'Failures'   },
    { id: 'breakdown',  label: 'Breakdown'  },
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
        @keyframes pulse-dot {
          0%,100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: #070706; }
        ::-webkit-scrollbar-thumb { background: rgba(196,124,46,0.2); border-radius: 99px; }
        details summary { list-style: none; }
        details summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header style={{
        background: C.dark, borderBottom: `1px solid ${C.border}`,
        height: 52, display: 'flex', alignItems: 'center',
        padding: '0 20px', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 17, fontFamily: 'Bebas Neue, cursive',
              letterSpacing: '0.1em', color: C.cream }}>
              POSTERIUM
            </span>
          </a>
          <div style={{ width: 1, height: 14, background: C.border }}/>
          <span style={{ fontSize: 8, color: C.amber, letterSpacing: '0.2em',
            textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
            Rasterizer Analytics
          </span>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: loading ? C.yellow : C.green,
              animation: 'pulse-dot 2s ease-in-out infinite',
              boxShadow: `0 0 5px ${loading ? C.yellow : C.green}`,
            }}/>
            <span style={{ fontSize: 8, color: C.ghost,
              fontFamily: 'JetBrains Mono, monospace' }}>
              {loading ? 'UPDATING' : 'LIVE'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastFetch && (
            <span style={{ fontSize: 8, color: C.ghost,
              fontFamily: 'JetBrains Mono, monospace',
              display: 'none',
            }} className="hide-mobile">
              {lastFetch.toLocaleTimeString()}
            </span>
          )}

          {/* Time range */}
          <div style={{ display: 'flex', gap: 2, padding: 3,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.borderFaint}`,
            borderRadius: 6 }}>
            {(['24h', '7d'] as const).map(t => (
              <button key={t} onClick={() => setTimeRange(t)} style={{
                padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                fontFamily: 'Syne, sans-serif', textTransform: 'uppercase',
                background: timeRange === t ? 'rgba(196,124,46,0.15)' : 'transparent',
                color: timeRange === t ? C.amber : C.ghost,
                transition: 'all 0.15s',
              }}>
                {t}
              </button>
            ))}
          </div>

          <button onClick={fetchData} disabled={loading} style={{
            height: 30, padding: '0 14px',
            background: loading ? 'rgba(196,124,46,0.3)' : C.amber,
            color: '#070706', border: 'none', borderRadius: 6, cursor: loading ? 'default' : 'pointer',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
            fontFamily: 'Syne, sans-serif', textTransform: 'uppercase',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
          }}>
            {loading ? '…' : '↻ Refresh'}
          </button>

          <button onClick={logout} style={{
            height: 30, padding: '0 12px', background: 'transparent',
            color: C.ghost, border: `1px solid ${C.borderFaint}`,
            borderRadius: 6, cursor: 'pointer', fontSize: 9,
            fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em',
            textTransform: 'uppercase', transition: 'all 0.15s',
          }}>
            Logout
          </button>
        </div>
      </header>

      {/* ── NAV TABS ─────────────────────────────────────────────────────── */}
      <nav style={{
        background: C.dark, borderBottom: `1px solid ${C.borderFaint}`,
        padding: '0 20px', display: 'flex', gap: 0,
        overflowX: 'auto',
      }}>
        {NAV_TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '11px 18px', background: 'transparent', border: 'none',
            cursor: 'pointer', color: tab === id ? C.amber : C.ghost,
            fontSize: 11, fontWeight: 600, fontFamily: 'Syne, sans-serif',
            borderBottom: tab === id ? `2px solid ${C.amber}` : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.15s',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </button>
        ))}
      </nav>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <main style={{ padding: 20, maxWidth: 1320, margin: '0 auto' }}>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 20,
            background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)',
            color: C.red, fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          }}>
            ✕ {error} — Ensure the worker is running and CF_ACCOUNT_ID / CF_API_TOKEN secrets are set.
          </div>
        )}

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Node status row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: '✓ Healthy Nodes', value: summary.healthyNodes, color: C.green, accent: C.green },
                { label: '⚠ Degraded Nodes', value: summary.degradedNodes, color: C.yellow, accent: C.yellow },
                { label: '✕ Down Nodes', value: summary.downNodes, color: C.red, accent: C.red },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '12px 16px', background: C.char, border: `1px solid ${C.borderFaint}`,
                  borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `rgba(${s.color === C.green ? '74,222,128' : s.color === C.yellow ? '250,204,21' : '248,113,113'},0.1)`,
                    border: `1px solid ${s.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%',
                      background: s.color, boxShadow: `0 0 8px ${s.color}` }}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontFamily: 'Bebas Neue, cursive',
                      color: s.color, letterSpacing: '0.03em', lineHeight: 1 }}>
                      {loading ? '–' : s.value}
                    </div>
                    <div style={{ fontSize: 8, color: C.ghost, letterSpacing: '0.12em',
                      textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10 }}>
              {loading ? Array(8).fill(0).map((_, i) => <Skel key={i} h={96}/>) : (
                <>
                  <StatPill label="Poster Renders (wins)" value={fmtNum(summary.totalRaceWins)}
                    sub={`${timeRange} window · 1 win = 1 poster served`}
                    color={C.amber} accent={C.amber}
                    trend={hourlyRows.map(h => h.successes)}/>
                  <StatPill label="Total Node Attempts" value={fmtNum(summary.totalAttempts)}
                    sub={`Each request hits multiple nodes in parallel`}
                    color={C.cream} accent={C.gold}/>
                  <StatPill label="Node Success Rate" value={fmtPct(summary.overallRate)}
                    sub={`${fmtNum(summary.totalSuccesses)} successes / ${fmtNum(summary.totalAttempts)} attempts`}
                    color={rateColor(summary.overallRate)} accent={rateColor(summary.overallRate)}/>
                  <StatPill label="Node Failures" value={fmtNum(summary.totalFailures)}
                    sub={`${fmtPct(summary.totalAttempts > 0 ? summary.totalFailures / summary.totalAttempts * 100 : 0)} failure rate`}
                    color={summary.totalFailures > 100 ? C.red : C.dim} accent={C.red}/>
                  <StatPill label="Fastest Node" value={summary.best?.node ? nodeShortName(summary.best.node).split(' ')[0] : '—'}
                    sub={summary.best ? fmtMs(summary.best.avg_ms) + ' avg latency' : 'no data'}
                    color={C.green} accent={C.green}/>
                  <StatPill label="24h Traffic Peak" value={summary.peakHour ? fmtNum(summary.peakHour.attempts) : '—'}
                    sub={summary.peakHour?.hour ? `at ${new Date(summary.peakHour.hour.replace(' ','T')+'Z').getUTCHours()}:00 UTC` : ''}
                    color={C.gold} accent={C.gold}
                    trend={hourlyRows.map(h => h.attempts)}/>
                  <StatPill label="Hourly Attempts (24h)" value={fmtNum(summary.hourlyTotal)}
                    sub={`${fmtNum(summary.hourlySuccess)} success · ${fmtNum(summary.hourlyFail)} fail`}
                    color={C.cream} accent={C.amber}/>
                  <StatPill label="Race Win Leader"
                    value={summary.topWinner ? nodeShortName(summary.topWinner.node).split(' ')[0] : '—'}
                    sub={summary.topWinner ? `${fmtNum(summary.topWinner.wins)} wins · ${fmtPct(summary.topWinner.win_rate_pct)} rate` : ''}
                    color={C.gold} accent={C.gold}/>
                </>
              )}
            </div>

            {/* Node health matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
              {loading
                ? Array(6).fill(0).map((_, i) => <Skel key={i} h={88}/>)
                : nodeRows.map(row => {
                  const health = row.success_rate_pct >= 90 ? 'healthy'
                    : row.success_rate_pct >= 10 ? 'degraded' : 'down';
                  const hc = health === 'healthy' ? C.green : health === 'degraded' ? C.yellow : C.red;
                  return (
                    <div key={row.node} style={{
                      padding: '12px 14px', background: C.char,
                      border: `1px solid ${health === 'down' ? 'rgba(248,113,113,0.2)' : C.borderFaint}`,
                      borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 11, color: C.label, fontWeight: 600,
                            fontFamily: 'JetBrains Mono, monospace' }}>
                            {nodeShortName(row.node)}
                          </div>
                          <div style={{ fontSize: 8, color: hc, letterSpacing: '0.1em',
                            textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                            {health}
                          </div>
                        </div>
                        <Gauge value={row.success_rate_pct} size={40}/>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        {[
                          { label: 'Avg', value: fmtMs(row.avg_ms), color: msColor(row.avg_ms) },
                          { label: 'Wins', value: fmtNum(row.race_wins), color: row.race_wins > 0 ? C.gold : C.ghost },
                          { label: 'Fails', value: fmtNum(row.failures), color: row.failures > 50 ? C.red : C.ghost },
                        ].map(m => (
                          <div key={m.label}>
                            <div style={{ fontSize: 7, color: C.ghost, letterSpacing: '0.1em',
                              textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: 13, color: m.color, fontWeight: 700,
                              fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.3 }}>
                              {m.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Win rate chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Race Win Distribution" tag={timeRange}>
                {loading ? <Skel h={160}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {winRows.filter(r => r.wins > 0 || r.successes > 0).map(r => (
                      <div key={r.node}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                          marginBottom: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: C.label,
                            fontFamily: 'JetBrains Mono, monospace' }}>
                            {nodeShortName(r.node)}
                          </span>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span style={{ fontSize: 10, color: C.gold,
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              ⚡ {fmtNum(r.wins)}
                            </span>
                            <span style={{ fontSize: 9, color: C.ghost,
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtPct(r.win_rate_pct)} rate
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.05)',
                          borderRadius: 2.5, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 2.5,
                            background: `linear-gradient(90deg,${C.amber},${C.gold})`,
                            width: `${(r.wins / Math.max(...winRows.map(x => x.wins), 1)) * 100}%`,
                          }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Colo Distribution" tag="Top colos">
                {loading ? <Skel h={160}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {coloRows.map(r => {
                      const rate = r.attempts > 0 ? (r.successes / r.attempts) * 100 : 0;
                      return (
                        <HBar key={r.colo}
                          label={r.colo}
                          value={r.attempts}
                          max={Math.max(...coloRows.map(c => c.attempts), 1)}
                          color={rateColor(rate)}
                          subLeft={fmtNum(r.attempts)}
                          subRight={fmtMs(r.avg_ms)}
                          subColor={msColor(r.avg_ms)}
                        />
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── NODES ────────────────────────────────────────────────────── */}
        {tab === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title={`Node Performance Matrix — ${timeRange}`} fullWidth>
              {loading ? <Skel h={300}/> : (
                <NodeTable rows={nodeRows} winRows={winRows} timeRange={timeRange}/>
              )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="Latency by Node" tag={timeRange}>
                {loading ? <Skel h={180}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...nodeRows].sort((a, b) => (a.avg_ms ?? 99999) - (b.avg_ms ?? 99999)).map(r => (
                      <HBar key={r.node}
                        label={nodeShortName(r.node).split(' ')[0]}
                        value={r.avg_ms ?? 0}
                        max={Math.max(...nodeRows.map(n => n.avg_ms ?? 0), 1)}
                        color={msColor(r.avg_ms)}
                        subLeft={fmtMs(r.avg_ms)}
                        subColor={msColor(r.avg_ms)}
                      />
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Race Win Rate by Node" tag={timeRange}>
                {loading ? <Skel h={180}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...winRows].sort((a, b) => b.win_rate_pct - a.win_rate_pct).map(r => (
                      <HBar key={r.node}
                        label={nodeShortName(r.node).split(' ')[0]}
                        value={r.win_rate_pct}
                        max={100}
                        color={C.amber}
                        subLeft={`${r.win_rate_pct.toFixed(0)}%`}
                        subRight={fmtNum(r.wins)}
                        subColor={C.gold}
                      />
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── TRAFFIC ──────────────────────────────────────────────────── */}
        {tab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hourly summary chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
              {loading ? Array(4).fill(0).map((_,i) => <Skel key={i} h={88}/>) : (
                <>
                  <StatPill label="Total Rasterizations (24h)" value={fmtNum(summary.hourlyTotal)}
                    sub="All node attempts summed" color={C.amber}/>
                  <StatPill label="Successes (24h)" value={fmtNum(summary.hourlySuccess)}
                    sub={fmtPct(summary.hourlyTotal > 0 ? summary.hourlySuccess/summary.hourlyTotal*100 : 0)}
                    color={C.green}/>
                  <StatPill label="Failures (24h)" value={fmtNum(summary.hourlyFail)}
                    sub={fmtPct(summary.hourlyTotal > 0 ? summary.hourlyFail/summary.hourlyTotal*100 : 0)}
                    color={summary.hourlyFail > 200 ? C.red : C.dim}/>
                  <StatPill label="Peak Hour" value={summary.peakHour?.attempts ? fmtNum(summary.peakHour.attempts) : '—'}
                    sub={summary.peakHour?.hour
                      ? `${new Date(summary.peakHour.hour.replace(' ','T')+'Z').getUTCHours()}:00 UTC`
                      : 'no data'}
                    color={C.gold}/>
                </>
              )}
            </div>

            <Card title="Hourly Traffic — Last 24h" fullWidth tag="rasterizer node attempts">
              {loading ? <Skel h={200}/> : <HourlyChart data={hourlyRows} height={160}/>}
            </Card>

            {/* Per-hour table */}
            <Card title="Hourly Breakdown" fullWidth>
              {loading ? <Skel h={200}/> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['Hour (UTC)', 'Attempts', 'Successes', 'Failures', 'Fail Rate', 'Success Rate'].map(h => (
                          <th key={h} style={{ padding: '7px 12px',
                            textAlign: h === 'Hour (UTC)' ? 'left' : 'right',
                            color: C.ghost, fontSize: 8, fontWeight: 700,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            fontFamily: 'JetBrains Mono, monospace',
                            borderBottom: `1px solid ${C.borderFaint}` }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...hourlyRows].reverse().map((r, i) => {
                        const hr = new Date(r.hour.replace(' ','T')+'Z').getUTCHours();
                        const dt = new Date(r.hour.replace(' ','T')+'Z');
                        const rate = r.attempts > 0 ? r.successes/r.attempts*100 : 0;
                        const failRate = r.attempts > 0 ? r.failures/r.attempts*100 : 0;
                        return (
                          <tr key={i} style={{
                            background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            borderBottom: `1px solid rgba(255,255,255,0.02)`,
                          }}>
                            <td style={{ padding: '8px 12px', color: C.label,
                              fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                              {`${dt.toISOString().split('T')[0]} ${hr.toString().padStart(2,'0')}:00`}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: C.dim,
                              fontFamily: 'JetBrains Mono, monospace' }}>{fmtNum(r.attempts)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: C.green,
                              fontFamily: 'JetBrains Mono, monospace' }}>{fmtNum(r.successes)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right',
                              color: r.failures > 0 ? C.red : C.ghost,
                              fontFamily: 'JetBrains Mono, monospace' }}>{fmtNum(r.failures)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right',
                              color: failRate > 50 ? C.red : failRate > 20 ? C.yellow : C.ghost,
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtPct(failRate)}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right',
                              color: rateColor(rate),
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtPct(rate)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 12px', color: C.amber,
                          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 9 }}>
                          TOTAL
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.amber,
                          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                          {fmtNum(summary.hourlyTotal)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.green,
                          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                          {fmtNum(summary.hourlySuccess)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.red,
                          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                          {fmtNum(summary.hourlyFail)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: C.dim,
                          fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmtPct(summary.hourlyTotal > 0 ? summary.hourlyFail/summary.hourlyTotal*100 : 0)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right',
                          color: rateColor(summary.hourlyTotal > 0 ? summary.hourlySuccess/summary.hourlyTotal*100 : 0),
                          fontFamily: 'JetBrains Mono, monospace' }}>
                          {fmtPct(summary.hourlyTotal > 0 ? summary.hourlySuccess/summary.hourlyTotal*100 : 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── FAILURES ─────────────────────────────────────────────────── */}
        {tab === 'failures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status banner */}
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: failRows.length > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(74,222,128,0.06)',
              border: `1px solid ${failRows.length > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: failRows.length > 0 ? C.red : C.green,
                boxShadow: `0 0 8px ${failRows.length > 0 ? C.red : C.green}`,
              }}/>
              <span style={{ fontSize: 11, color: failRows.length > 0 ? C.red : C.green,
                fontFamily: 'JetBrains Mono, monospace' }}>
                {loading
                  ? 'Loading failure log…'
                  : failRows.length > 0
                    ? `${failRows.length} failure events in last 24h (showing most recent 100)`
                    : 'No failures — all nodes reporting healthy'}
              </span>
              {!loading && failRows.length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 9, color: C.ghost,
                  fontFamily: 'JetBrains Mono, monospace' }}>
                  {`${data?.recent_failures?.rows_before_limit_at_least ?? 0} total events`}
                </span>
              )}
            </div>

            {/* Failure breakdown by node */}
            {!loading && failRows.length > 0 && (() => {
              const byNode: Record<string, number> = {};
              failRows.forEach(f => { byNode[f.node] = (byNode[f.node] ?? 0) + 1; });
              const nodeFailData = Object.entries(byNode)
                .sort((a, b) => b[1] - a[1]);
              const maxFail = Math.max(...nodeFailData.map(d => d[1]), 1);

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Card title="Failures by Node" tag="24h sample">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {nodeFailData.map(([node, count]) => (
                        <HBar key={node}
                          label={nodeShortName(node).split(' ')[0]}
                          value={count} max={maxFail}
                          color={C.red}
                          subLeft={fmtNum(count)}
                          subColor={C.red}
                        />
                      ))}
                    </div>
                  </Card>

                  <Card title="Failures by Status Code" tag="24h sample">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(() => {
                        const byCode: Record<string, number> = {};
                        failRows.forEach(f => {
                          const k = f.status_code === 0 ? 'TIMEOUT' : `HTTP ${f.status_code}`;
                          byCode[k] = (byCode[k] ?? 0) + 1;
                        });
                        const maxC = Math.max(...Object.values(byCode), 1);
                        return Object.entries(byCode)
                          .sort((a, b) => b[1] - a[1])
                          .map(([code, count]) => (
                            <HBar key={code}
                              label={code}
                              value={count} max={maxC}
                              color={statusColor(parseInt(code.replace(/[^\d]/g,'')) || 0)}
                              subLeft={fmtNum(count)}
                              subColor={statusColor(parseInt(code.replace(/[^\d]/g,'')) || 0)}
                            />
                          ));
                      })()}
                    </div>
                  </Card>
                </div>
              );
            })()}

            <Card title="Failure Log — Aggregated + Raw" fullWidth>
              {loading ? <Skel h={300}/> : <FailureTable rows={failRows}/>}
            </Card>
          </div>
        )}

        {/* ── BREAKDOWN ────────────────────────────────────────────────── */}
        {tab === 'breakdown' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Format breakdown */}
              <Card title="Format Distribution" tag="24h">
                {loading ? <Skel h={200}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {formatRows.filter(r => r.format).map(r => {
                      const rate = r.attempts > 0 ? (r.successes / r.attempts) * 100 : 0;
                      const maxAtt = Math.max(...formatRows.map(f => f.attempts), 1);
                      return (
                        <div key={r.format || 'unknown'} style={{
                          padding: '12px 0',
                          borderBottom: `1px solid ${C.borderFaint}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontFamily: 'Bebas Neue, cursive',
                              color: C.amber, letterSpacing: '0.08em' }}>
                              {r.format.toUpperCase() || 'UNKNOWN'}
                            </span>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: C.dim,
                                fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmtNum(r.attempts)} attempts
                              </span>
                              <span style={{ fontSize: 10, color: msColor(r.avg_ms),
                                fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmtMs(r.avg_ms)}
                              </span>
                              <span style={{ fontSize: 10, color: rateColor(rate),
                                fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmtPct(rate)}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)',
                            borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 3,
                              background: `linear-gradient(90deg,${C.amber},${C.gold})`,
                              width: `${(r.attempts / maxAtt) * 100}%`,
                            }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Colo heatmap */}
              <Card title="Datacenter Heatmap" tag="top colos">
                {loading ? <Skel h={200}/> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {coloRows.map((r, i) => {
                      const rate = r.attempts > 0 ? (r.successes / r.attempts) * 100 : 0;
                      const max  = Math.max(...coloRows.map(c => c.attempts), 1);
                      return (
                        <div key={r.colo} style={{
                          padding: '10px 12px', borderRadius: 7,
                          background: 'rgba(255,255,255,0.02)',
                          border: `1px solid ${C.borderFaint}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 13, fontWeight: 700, color: C.cream }}>
                                {r.colo}
                              </span>
                              <span style={{ fontSize: 8, color: C.ghost,
                                fontFamily: 'JetBrains Mono, monospace',
                                letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                #{i + 1}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: rateColor(rate),
                                fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmtPct(rate)} ok
                              </span>
                              <span style={{ fontSize: 10, color: msColor(r.avg_ms),
                                fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmtMs(r.avg_ms)}
                              </span>
                              <span style={{ fontSize: 10, color: C.dim,
                                fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmtNum(r.attempts)}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: 'rgba(255,255,255,0.05)',
                            borderRadius: 2.5, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 2.5,
                              background: `linear-gradient(90deg,${rateColor(rate)},${rateColor(rate)}aa)`,
                              width: `${(r.attempts / max) * 100}%`,
                            }}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Full node comparison table */}
            <Card title="Complete Node Comparison — 24h vs 7d" fullWidth>
              {loading ? <Skel h={200}/> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: C.ghost,
                          fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
                          textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace',
                          borderBottom: `1px solid ${C.borderFaint}` }}>Node</th>
                        {['Attempts 24h', 'Rate 24h', 'Avg 24h',
                          'Attempts 7d', 'Rate 7d', 'Avg 7d', 'Wins 7d'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'right',
                            color: C.ghost, fontSize: 8, fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            fontFamily: 'JetBrains Mono, monospace',
                            borderBottom: `1px solid ${C.borderFaint}`, whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodeRows24.map((r24, i) => {
                        const r7 = nodeRows7d.find(n => n.node === r24.node);
                        return (
                          <tr key={r24.node} style={{
                            background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            borderBottom: `1px solid rgba(255,255,255,0.02)`,
                          }}>
                            <td style={{ padding: '9px 12px', color: C.label,
                              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                              fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {nodeShortName(r24.node)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: C.dim,
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtNum(r24.total_attempts)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right',
                              color: rateColor(r24.success_rate_pct),
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {fmtPct(r24.success_rate_pct)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right',
                              color: msColor(r24.avg_ms), fontFamily: 'JetBrains Mono, monospace',
                              fontWeight: 700 }}>
                              {fmtMs(r24.avg_ms)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: C.ghost,
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {r7 ? fmtNum(r7.total_attempts) : '—'}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right',
                              color: r7 ? rateColor(r7.success_rate_pct) : C.ghost,
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {r7 ? fmtPct(r7.success_rate_pct) : '—'}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right',
                              color: r7 ? msColor(r7.avg_ms) : C.ghost,
                              fontFamily: 'JetBrains Mono, monospace' }}>
                              {r7 ? fmtMs(r7.avg_ms) : '—'}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right',
                              color: r7 && r7.race_wins > 0 ? C.gold : C.ghost,
                              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                              {r7 ? (r7.race_wins > 0 ? `⚡ ${fmtNum(r7.race_wins)}` : '0') : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Analytics Engine data quality note */}
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: 'rgba(196,124,46,0.04)', border: `1px solid ${C.border}`,
              fontSize: 10, color: C.ghost, fontFamily: 'JetBrains Mono, monospace',
              lineHeight: 1.8,
            }}>
              <span style={{ color: C.amber, fontWeight: 700 }}>ℹ Data Notes: </span>
              <span>
                input_type is empty in current data — add{' '}
                <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>
                  inputType
                </code>{' '}
                to writeDataPoint blobs in rasterBalancer.js.
                "Total attempts" counts all parallel node races, not unique requests.
                Race wins ≈ actual poster renders served ({fmtNum(summary.totalRaceWins)} in {timeRange}).
                wsrv 404s indicate SVG fetch failed upstream, not rasterizer fault.
              </span>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 32, paddingTop: 16,
          borderTop: `1px solid ${C.borderFaint}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 8, color: C.ghost,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em' }}>
            POSTERIUM ANALYTICS · raster_metrics · 90-DAY RETENTION · AUTO-REFRESH 2 MIN
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {lastFetch && (
              <span style={{ fontSize: 8, color: C.ghost,
                fontFamily: 'JetBrains Mono, monospace' }}>
                Last refresh: {lastFetch.toLocaleTimeString()}
              </span>
            )}
            <span style={{ fontSize: 8, color: 'rgba(122,117,110,0.2)',
              fontFamily: 'JetBrains Mono, monospace' }}>
              Cloudflare Analytics Engine SQL API
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}