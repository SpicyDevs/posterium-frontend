// src/components/admin/AnalyticsDashboard.tsx
// ─── Rasterizer analytics · Grafana-style · v2 ────────────────────────────────
// Improvements over v1:
//  • Persistent config (default tab, period, refresh, node filters, alert
//    thresholds, compact mode, chart style) stored in localStorage
//  • Settings panel (⚙) accessible from the header
//  • Removed DB Stats link
//  • Better text/label visibility (raised contrast on dim/ghost tokens)
//  • Shared style tokens (S) and extracted sub-components → far less repetition
//  • Extreme-detail node cards: health score, P50/P95 estimates, alert badges
//  • Lane comparison grouped bar chart
//  • Error spike annotation on traffic chart
//  • Collapsible panels in compact mode
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = 'https://api.spicydevs.xyz';
const AUTH_KEY = 'posterium_analytics_auth_v1';
const CONFIG_KEY = 'posterium_dash_config_v2';
const CORRECT_PASSWORD = 'admin123';

interface DashConfig {
  defaultTab: string;
  defaultPeriod: string;
  defaultRefreshMs: number;
  compactMode: boolean;
  hiddenNodes: string[];
  alertSuccessRate: number; // warn below this %
  alertAvgMs: number; // warn above this ms
  chartStyle: 'area' | 'line';
  showLanePanel: boolean;
  showWinPie: boolean;
}

const DEFAULT_CONFIG: DashConfig = {
  defaultTab: 'overview',
  defaultPeriod: '24h',
  defaultRefreshMs: 0,
  compactMode: false,
  hiddenNodes: [],
  alertSuccessRate: 90,
  alertAvgMs: 2000,
  chartStyle: 'area',
  showLanePanel: true,
  showWinPie: true,
};

function loadConfig(): DashConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}
function saveConfig(c: DashConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
  } catch {}
}

const PERIODS: Record<string, { label: string; short: string }> = {
  '15m': { label: 'Last 15 Min', short: '15M' },
  '1h': { label: 'Last 1 Hour', short: '1H' },
  '3h': { label: 'Last 3 Hours', short: '3H' },
  '6h': { label: 'Last 6 Hours', short: '6H' },
  '12h': { label: 'Last 12 Hours', short: '12H' },
  '24h': { label: 'Last 24 Hours', short: '24H' },
  '2d': { label: 'Last 2 Days', short: '2D' },
  '7d': { label: 'Last 7 Days', short: '7D' },
  '14d': { label: 'Last 14 Days', short: '14D' },
  '30d': { label: 'Last 30 Days', short: '30D' },
};

const REFRESH_INTERVALS = [
  { label: 'Off', ms: 0 },
  { label: '30s', ms: 30_000 },
  { label: '1m', ms: 60_000 },
  { label: '2m', ms: 120_000 },
  { label: '5m', ms: 300_000 },
];

const NODE_COLORS: Record<string, string> = {
  washington: '#3b82f6',
  ohio: '#8b5cf6',
  london: '#10b981',
  tokyo: '#f59e0b',
  mumbai: '#ef4444',
  'spaceify-germany': '#06b6d4',
  'spaceify-france': '#84cc16',
  wsrv: '#f97316',
  'render-singapore-1': '#ec4899',
  'render-singapore-2': '#a78bfa',
  'render-eu-central': '#14b8a6',
  'render-us-west': '#78716c',
  'simple-worker (binding)': '#c47c2e',
  'simple-worker (http)': '#92400e',
};
const PIE_COLORS = [
  '#c47c2e',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
];

function nodeColor(n: string) {
  return NODE_COLORS[n] ?? '#71717a';
}
function nodeShortName(n: string): string {
  const MAP: Record<string, string> = {
    wsrv: 'wsrv.nl',
    ohio: 'Ohio · Netlify',
    washington: 'Washington · Vercel',
    london: 'London · Vercel',
    tokyo: 'Tokyo · Vercel',
    mumbai: 'Mumbai · Vercel',
    'spaceify-germany': 'Germany · Spaceify',
    'spaceify-france': 'France · Spaceify',
    'render-singapore-1': 'Singapore 1 · Render',
    'render-singapore-2': 'Singapore 2 · Render',
    'render-eu-central': 'EU Central · Render',
    'render-us-west': 'US West · Render',
    'simple-worker (binding)': 'Simple Worker (bind)',
    'simple-worker (http)': 'Simple Worker (http)',
  };
  return MAP[n] ?? n;
}

// ── Number helpers ────────────────────────────────────────────────────────────

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
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}
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
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  } catch {
    return s.slice(0, 13);
  }
}

// Estimate percentile bucket from latency counts
function estimateP50(row: any): string {
  const total = num(row.total_success);
  if (!total) return '—';
  const half = total / 2;
  const u500 = num(row.under_500ms);
  const u1s = num(row.under_1s);
  const u2s = num(row.under_2s);
  const u4s = num(row.under_4s);
  if (half <= u500) return '< 500ms';
  if (half <= u1s) return '500ms – 1s';
  if (half <= u2s) return '1s – 2s';
  if (half <= u4s) return '2s – 4s';
  return '> 4s';
}
function estimateP95(row: any): string {
  const total = num(row.total_success);
  if (!total) return '—';
  const thresh = total * 0.95;
  const u500 = num(row.under_500ms);
  const u1s = num(row.under_1s);
  const u2s = num(row.under_2s);
  const u4s = num(row.under_4s);
  if (thresh <= u500) return '< 500ms';
  if (thresh <= u1s) return '< 1s';
  if (thresh <= u2s) return '< 2s';
  if (thresh <= u4s) return '< 4s';
  return '> 4s';
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  black: '#070706',
  dark: '#0e0d0b',
  mid: '#141210',
  char: '#1a1814',
  border: 'rgba(196,124,46,0.18)',
  borderFaint: 'rgba(255,255,255,0.07)',
  amber: '#c47c2e',
  gold: '#d4a245',
  cream: '#f0e6cc',
  // Raised contrast vs v1 — was 0.38/0.55 for ghost/dim
  ghost: 'rgba(160,150,130,0.65)',
  dim: 'rgba(200,188,168,0.75)',
  label: 'rgba(220,208,184,0.90)',
  body: 'rgba(238,226,204,0.96)',
  green: '#4ade80',
  yellow: '#facc15',
  orange: '#fb923c',
  red: '#f87171',
  blue: '#60a5fa',
  purple: '#a78bfa',
};

function msColor(ms: number | null) {
  if (ms === null) return C.ghost;
  if (ms < 500) return C.green;
  if (ms < 1200) return C.yellow;
  if (ms < 3000) return C.orange;
  return C.red;
}
function rateColor(pct: number) {
  if (pct >= 90) return C.green;
  if (pct >= 70) return C.yellow;
  if (pct >= 40) return C.orange;
  return C.red;
}

// Health score 0-100 composite: 60% success rate + 40% latency score
function healthScore(successPct: number, avgMs: number | null): number {
  const latScore =
    avgMs === null
      ? 100
      : avgMs < 500
        ? 100
        : avgMs < 1000
          ? 80
          : avgMs < 2000
            ? 55
            : avgMs < 4000
              ? 30
              : 10;
  return Math.round(successPct * 0.6 + latScore * 0.4);
}

// ── Shared style helpers ───────────────────────────────────────────────────────

const S = {
  monoXs: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 8,
    color: C.ghost,
    letterSpacing: '0.12em',
  } as React.CSSProperties,
  monoSm: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 9,
    color: C.dim,
    letterSpacing: '0.06em',
  } as React.CSSProperties,
  label: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 8,
    color: C.ghost,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
  },
  syneXs: {
    fontFamily: 'Syne, sans-serif',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  flex: { display: 'flex', alignItems: 'center' } as React.CSSProperties,
  card: {
    background: C.mid,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    overflow: 'hidden',
  } as React.CSSProperties,
  charBg: {
    background: C.char,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
  } as React.CSSProperties,
};

// ── Primitive UI components ───────────────────────────────────────────────────

const Skel = ({ h = 80 }: { h?: number }) => (
  <div
    style={{
      height: h,
      borderRadius: 6,
      background: 'linear-gradient(110deg,#141210 25%,#1e1b16 50%,#141210 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.8s linear infinite',
    }}
  />
);

const PanelHdr = ({
  title,
  tag,
  action,
}: {
  title: string;
  tag?: string;
  action?: React.ReactNode;
}) => (
  <div
    style={{
      padding: '9px 14px',
      borderBottom: `1px solid ${C.borderFaint}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(196,124,46,0.025)',
    }}
  >
    <span style={{ ...S.syneXs, color: C.amber }}>{title}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {tag && (
        <span
          style={{
            ...S.monoXs,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${C.borderFaint}`,
            borderRadius: 3,
            padding: '2px 6px',
          }}
        >
          {tag}
        </span>
      )}
      {action}
    </div>
  </div>
);

interface CardProps {
  title: string;
  tag?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  noPad?: boolean;
}
const Card = ({ title, tag, action, children, fullWidth, noPad }: CardProps) => (
  <div style={{ ...S.card, gridColumn: fullWidth ? '1 / -1' : undefined }}>
    <PanelHdr title={title} tag={tag} action={action} />
    <div style={noPad ? undefined : { padding: 14 }}>{children}</div>
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  accent?: string;
  alert?: boolean;
}
const StatCard = ({
  label,
  value,
  sub,
  color = C.cream,
  accent = C.amber,
  alert,
}: StatCardProps) => (
  <div
    style={{
      padding: '14px 16px',
      ...S.charBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${alert ? C.red : accent}, transparent)`,
        opacity: 0.7,
      }}
    />
    {alert && (
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: C.red,
          boxShadow: `0 0 6px ${C.red}`,
          animation: 'pulse-dot 2s ease-in-out infinite',
        }}
      />
    )}
    <span style={S.label}>{label}</span>
    <span
      style={{
        fontSize: 30,
        fontWeight: 800,
        color,
        fontFamily: 'Bebas Neue, cursive',
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    {sub && <span style={{ ...S.monoXs, lineHeight: 1.5 }}>{sub}</span>}
  </div>
);

const Gauge = ({
  value,
  size = 48,
  thresholds,
}: {
  value: number;
  size?: number;
  thresholds?: { warn: number; ok: number };
}) => {
  const r = size / 2 - 5,
    circ = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(value / 100, 1)) * circ;
  const warnAt = thresholds?.warn ?? 90;
  const color = value >= warnAt ? C.green : value >= 70 ? C.yellow : value >= 40 ? C.orange : C.red;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        {value.toFixed(0)}%
      </text>
    </svg>
  );
};

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: C.char,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '10px 14px',
        ...S.monoSm,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        minWidth: 160,
      }}
    >
      {label && <div style={{ color: C.amber, marginBottom: 6, fontWeight: 700 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          style={{
            color: p.color ?? C.cream,
            marginBottom: 3,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span>{p.name}</span>
          <strong>{typeof p.value === 'number' ? fmtNum(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── Latency distribution bar ──────────────────────────────────────────────────

const LatencyDistBar = ({ row, showLabels }: { row: any; showLabels?: boolean }) => {
  const total = num(row.total_success) || 1;
  const u500 = num(row.under_500ms);
  const u1s = num(row.under_1s) - u500;
  const u2s = num(row.under_2s) - num(row.under_1s);
  const u4s = num(row.under_4s) - num(row.under_2s);
  const over = Math.max(0, total - num(row.under_4s));
  const segs = [
    { n: u500, c: C.green, label: '<500ms' },
    { n: u1s, c: C.yellow, label: '<1s' },
    { n: u2s, c: C.orange, label: '<2s' },
    { n: u4s, c: C.red, label: '<4s' },
    { n: over, c: '#7f1d1d', label: '>4s' },
  ].filter((s) => s.n > 0);
  return (
    <div>
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ flex: s.n / total, background: s.c, minWidth: 2 }} />
        ))}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
          {segs.map((s, i) => (
            <span key={i} style={{ ...S.monoXs, color: s.c, fontSize: 7 }}>
              {s.label} {fmtPct((s.n / total) * 100)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Heatmap ───────────────────────────────────────────────────────────────────

const HourHeatmap = ({ data }: { data: any[] }) => {
  const { hours, hourKeys, nodes } = useMemo(() => {
    const map: Record<string, Record<string, { failures: number; attempts: number }>> = {};
    data.forEach((r) => {
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
      nodes: [...new Set(data.map((r) => r.node ?? ''))].filter(Boolean),
    };
  }, [data]);
  if (!hourKeys.length || !nodes.length)
    return (
      <div style={{ ...S.monoSm, color: C.ghost, padding: 20, textAlign: 'center' }}>
        No heatmap data
      </div>
    );
  const CELL_W = 28,
    CELL_H = 20,
    LABEL_W = 140,
    LABEL_H = 30;
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        width={LABEL_W + hourKeys.length * CELL_W}
        height={LABEL_H + nodes.length * CELL_H}
        style={{ display: 'block' }}
      >
        {hourKeys.map((h, i) => (
          <text
            key={h}
            x={LABEL_W + i * CELL_W + CELL_W / 2}
            y={LABEL_H - 4}
            textAnchor="middle"
            fill={C.ghost}
            fontSize={7}
            fontFamily="JetBrains Mono, monospace"
            transform={`rotate(-45, ${LABEL_W + i * CELL_W + CELL_W / 2}, ${LABEL_H - 4})`}
          >
            {h.slice(-5)}
          </text>
        ))}
        {nodes.map((node, ni) => (
          <g key={node}>
            <text
              x={LABEL_W - 4}
              y={LABEL_H + ni * CELL_H + CELL_H / 2 + 3}
              textAnchor="end"
              fill={C.dim}
              fontSize={8}
              fontFamily="JetBrains Mono, monospace"
            >
              {nodeShortName(node).split(' ')[0]}
            </text>
            {hourKeys.map((h, hi) => {
              const cell = hours[h]?.[node];
              const rate = cell && cell.attempts > 0 ? cell.failures / cell.attempts : 0;
              const fill =
                rate === 0
                  ? 'rgba(74,222,128,0.18)'
                  : `rgba(248,113,113,${0.15 + Math.min(rate * 4, 1) * 0.75})`;
              return (
                <rect
                  key={h}
                  x={LABEL_W + hi * CELL_W + 1}
                  y={LABEL_H + ni * CELL_H + 1}
                  width={CELL_W - 2}
                  height={CELL_H - 2}
                  rx={2}
                  fill={fill}
                >
                  <title>{`${nodeShortName(node)} @ ${h}\n${cell?.failures ?? 0} fail / ${cell?.attempts ?? 0} total`}</title>
                </rect>
              );
            })}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'center', ...S.monoXs }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(74,222,128,0.22)' }}
          />
          <span>No failures</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(248,113,113,0.55)' }}
          />
          <span>Some failures</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(248,113,113,0.9)' }}
          />
          <span>High failure rate</span>
        </div>
      </div>
    </div>
  );
};

// ── Node health card ──────────────────────────────────────────────────────────

interface NodeRowData {
  node: string;
  total_attempts: number;
  successes: number;
  failures: number;
  success_rate_pct: number;
  avg_ms: number | null;
  race_wins: number;
}
interface LatRowData {
  node: string;
  total_success: number;
  avg_ms: number | null;
  under_500ms: number;
  under_1s: number;
  under_2s: number;
  under_4s: number;
}

const NodeCard = ({
  row,
  latRow,
  compact,
  alertSuccessRate,
  alertAvgMs,
}: {
  row: NodeRowData;
  latRow?: LatRowData;
  compact: boolean;
  alertSuccessRate: number;
  alertAvgMs: number;
}) => {
  const health =
    row.success_rate_pct >= alertSuccessRate
      ? 'healthy'
      : row.success_rate_pct >= 10
        ? 'degraded'
        : 'down';
  const hc = health === 'healthy' ? C.green : health === 'degraded' ? C.yellow : C.red;
  const score = healthScore(row.success_rate_pct, row.avg_ms);
  const isAlertMs = row.avg_ms !== null && row.avg_ms > alertAvgMs;
  const isAlertRate = row.success_rate_pct < alertSuccessRate && row.total_attempts > 0;
  return (
    <div
      style={{
        padding: compact ? '8px 10px' : '12px 14px',
        ...S.charBg,
        borderLeft: `3px solid ${nodeColor(row.node)}`,
        position: 'relative',
      }}
    >
      {(isAlertMs || isAlertRate) && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: C.red,
            boxShadow: `0 0 6px ${C.red}`,
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: compact ? 4 : 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              color: C.label,
              fontWeight: 600,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {nodeShortName(row.node).split(' ·')[0]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ ...S.monoXs, color: hc, textTransform: 'uppercase', fontSize: 7 }}>
              {health}
            </span>
            <span style={{ ...S.monoXs, color: C.ghost, fontSize: 7 }}>· score {score}</span>
          </div>
        </div>
        <Gauge
          value={row.success_rate_pct}
          size={compact ? 32 : 38}
          thresholds={{ warn: alertSuccessRate, ok: 100 }}
        />
      </div>
      {!compact && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginBottom: latRow && latRow.under_4s > 0 ? 8 : 0,
            }}
          >
            {[
              { l: 'Avg', v: fmtMs(row.avg_ms), c: isAlertMs ? C.red : msColor(row.avg_ms) },
              { l: 'Wins', v: fmtNum(row.race_wins), c: row.race_wins > 0 ? C.gold : C.ghost },
              {
                l: 'Fails',
                v: fmtNum(row.failures),
                c: row.failures > 0 ? (row.failures > 50 ? C.red : C.orange) : C.ghost,
              },
            ].map((m) => (
              <div key={m.l}>
                <div style={{ ...S.monoXs, fontSize: 7, marginBottom: 1 }}>{m.l}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: m.c,
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {m.v}
                </div>
              </div>
            ))}
          </div>
          {latRow && latRow.under_4s > 0 && (
            <div>
              <LatencyDistBar row={latRow} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ ...S.monoXs, fontSize: 7 }}>P50: {estimateP50(latRow)}</span>
                <span style={{ ...S.monoXs, fontSize: 7 }}>P95: {estimateP95(latRow)}</span>
              </div>
            </div>
          )}
        </>
      )}
      {compact && (
        <div style={{ display: 'flex', gap: 12 }}>
          <span
            style={{ ...S.monoXs, color: isAlertMs ? C.red : msColor(row.avg_ms), fontSize: 7 }}
          >
            {fmtMs(row.avg_ms)}
          </span>
          <span style={{ ...S.monoXs, color: row.failures > 0 ? C.red : C.ghost, fontSize: 7 }}>
            {row.failures} fail
          </span>
        </div>
      )}
    </div>
  );
};

// ── Settings panel ────────────────────────────────────────────────────────────

const SettingsPanel = ({
  config,
  nodeList,
  onSave,
  onClose,
}: {
  config: DashConfig;
  nodeList: string[];
  onSave: (c: DashConfig) => void;
  onClose: () => void;
}) => {
  const [local, setLocal] = useState<DashConfig>({ ...config });
  const set = (k: keyof DashConfig, v: any) => setLocal((p) => ({ ...p, [k]: v }));
  const toggleNode = (node: string) => {
    const hn = local.hiddenNodes.includes(node)
      ? local.hiddenNodes.filter((n) => n !== node)
      : [...local.hiddenNodes, node];
    set('hiddenNodes', hn);
  };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: 480,
          maxHeight: '85vh',
          overflowY: 'auto',
          ...S.card,
          boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${C.borderFaint}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ ...S.syneXs, color: C.amber, fontSize: 11 }}>⚙ Dashboard Settings</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: C.ghost,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Defaults */}
          <Section label="Startup Defaults">
            <Row label="Default tab">
              <select
                value={local.defaultTab}
                onChange={(e) => set('defaultTab', e.target.value)}
                style={selectStyle}
              >
                {['overview', 'nodes', 'traffic', 'errors', 'breakdown'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Default period">
              <select
                value={local.defaultPeriod}
                onChange={(e) => set('defaultPeriod', e.target.value)}
                style={selectStyle}
              >
                {Object.entries(PERIODS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Auto-refresh">
              <select
                value={local.defaultRefreshMs}
                onChange={(e) => set('defaultRefreshMs', Number(e.target.value))}
                style={selectStyle}
              >
                {REFRESH_INTERVALS.map((r) => (
                  <option key={r.ms} value={r.ms}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          {/* Display */}
          <Section label="Display">
            <Row label="Compact mode">
              <Toggle value={local.compactMode} onChange={(v) => set('compactMode', v)} />
            </Row>
            <Row label="Chart style">
              <select
                value={local.chartStyle}
                onChange={(e) => set('chartStyle', e.target.value as any)}
                style={selectStyle}
              >
                <option value="area">Area charts</option>
                <option value="line">Line charts</option>
              </select>
            </Row>
            <Row label="Show win distribution pie">
              <Toggle value={local.showWinPie} onChange={(v) => set('showWinPie', v)} />
            </Row>
            <Row label="Show lane panel">
              <Toggle value={local.showLanePanel} onChange={(v) => set('showLanePanel', v)} />
            </Row>
          </Section>

          {/* Alert thresholds */}
          <Section label="Alert Thresholds">
            <Row label={`Success rate warn < ${local.alertSuccessRate}%`}>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={local.alertSuccessRate}
                onChange={(e) => set('alertSuccessRate', Number(e.target.value))}
                style={{ width: 120, accentColor: C.amber }}
              />
            </Row>
            <Row label={`Latency warn > ${local.alertAvgMs}ms`}>
              <input
                type="range"
                min={500}
                max={5000}
                step={100}
                value={local.alertAvgMs}
                onChange={(e) => set('alertAvgMs', Number(e.target.value))}
                style={{ width: 120, accentColor: C.amber }}
              />
            </Row>
          </Section>

          {/* Node visibility */}
          {nodeList.length > 0 && (
            <Section label="Node Visibility">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {nodeList.map((n) => (
                  <Row
                    key={n}
                    label={
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: nodeColor(n),
                            display: 'inline-block',
                          }}
                        />
                        {nodeShortName(n).split(' ·')[0]}
                      </span>
                    }
                  >
                    <Toggle value={!local.hiddenNodes.includes(n)} onChange={() => toggleNode(n)} />
                  </Row>
                ))}
              </div>
            </Section>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                ...btnStyle,
                background: 'transparent',
                color: C.ghost,
                border: `1px solid ${C.borderFaint}`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                saveConfig(local);
                onSave(local);
                onClose();
              }}
              style={{ ...btnStyle, background: C.amber, color: '#070706' }}
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div
      style={{
        ...S.monoXs,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottom: `1px solid ${C.borderFaint}`,
      }}
    >
      {label}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
  </div>
);
const Row = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ ...S.monoSm, color: C.label, fontSize: 9 }}>{label}</span>
    {children}
  </div>
);
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 36,
      height: 18,
      borderRadius: 9,
      border: 'none',
      cursor: 'pointer',
      background: value ? C.amber : 'rgba(255,255,255,0.1)',
      transition: 'background 0.2s',
      position: 'relative',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 2,
        left: value ? 18 : 2,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.2s',
      }}
    />
  </button>
);
const selectStyle: React.CSSProperties = {
  background: C.char,
  border: `1px solid ${C.borderFaint}`,
  color: C.cream,
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
  outline: 'none',
};
const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 10,
  fontWeight: 700,
  fontFamily: 'Syne, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

// ── Auth screen ───────────────────────────────────────────────────────────────

const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (pw === CORRECT_PASSWORD) {
      try {
        localStorage.setItem(AUTH_KEY, '1');
      } catch {}
      onAuth();
    } else {
      setErr('Incorrect password');
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setPw('');
    }
  };
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: C.black,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div
        style={{
          width: 380,
          ...S.card,
          boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.borderFaint}` }}>
          <div style={{ ...S.monoXs, color: C.amber, marginBottom: 4 }}>◆ POSTERIUM</div>
          <div
            style={{
              fontSize: 22,
              color: C.cream,
              fontFamily: 'Bebas Neue, cursive',
              letterSpacing: '0.06em',
            }}
          >
            ANALYTICS ACCESS
          </div>
          <div style={{ ...S.monoXs, marginTop: 4 }}>
            Rasterizer node · D1 database · 30-day data
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <label style={{ display: 'block', ...S.label, marginBottom: 6 }}>Admin Password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Enter password"
            autoFocus
            style={{
              width: '100%',
              height: 40,
              padding: '0 12px',
              background: C.char,
              border: `1px solid ${err ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 7,
              color: C.cream,
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {err && <div style={{ marginTop: 5, ...S.monoXs, color: C.red }}>✕ {err}</div>}
          <button
            onClick={submit}
            style={{
              width: '100%',
              height: 40,
              marginTop: 14,
              background: `linear-gradient(90deg,${C.amber},${C.gold})`,
              color: '#070706',
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'Syne, sans-serif',
            }}
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [authed, setAuthed] = useState(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [config, setConfig] = useState<DashConfig>(loadConfig);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(() => loadConfig().defaultPeriod);
  const [tab, setTab] = useState(() => loadConfig().defaultTab);
  const [refreshMs, setRefreshMs] = useState(() => loadConfig().defaultRefreshMs);
  const [countdown, setCountdown] = useState(0);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const rTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyConfig = (c: DashConfig) => {
    setConfig(c);
    setPeriod(c.defaultPeriod);
    setTab(c.defaultTab);
    setRefreshMs(c.defaultRefreshMs);
  };
  const logout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {}
    setAuthed(false);
    setData(null);
  };

  const fetchData = useCallback(
    async (p?: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/analytics?period=${p ?? period}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json.data ?? null);
        setLastFetch(new Date());
      } catch (e: any) {
        setError(e.message ?? 'Fetch failed');
      } finally {
        setLoading(false);
      }
    },
    [period]
  );

  useEffect(() => {
    if (authed) fetchData();
  }, [authed]);

  useEffect(() => {
    if (rTimer.current) clearInterval(rTimer.current);
    if (cTimer.current) clearInterval(cTimer.current);
    if (!authed || refreshMs === 0) {
      setCountdown(0);
      return;
    }
    setCountdown(refreshMs / 1000);
    rTimer.current = setInterval(() => {
      fetchData();
      setCountdown(refreshMs / 1000);
    }, refreshMs);
    cTimer.current = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => {
      if (rTimer.current) clearInterval(rTimer.current);
      if (cTimer.current) clearInterval(cTimer.current);
    };
  }, [refreshMs, authed, fetchData]);

  // ── Data normalization ──────────────────────────────────────────────────────

  const allNodeRows: NodeRowData[] = useMemo(
    () =>
      (data?.node_performance?.data ?? []).map((r: any) => ({
        node: String(r.node ?? ''),
        total_attempts: num(r.total_attempts),
        successes: num(r.successes),
        failures: num(r.failures),
        success_rate_pct: num(r.success_rate_pct),
        avg_ms: nullableNum(r.avg_ms),
        race_wins: num(r.race_wins),
      })),
    [data]
  );

  const nodeRows = useMemo(
    () => allNodeRows.filter((r) => !config.hiddenNodes.includes(r.node)),
    [allNodeRows, config.hiddenNodes]
  );

  const globalRow = useMemo(() => {
    const raw = data?.global_summary?.data?.[0];
    if (raw && num(raw.total_attempts) > 0)
      return {
        total_attempts: num(raw.total_attempts),
        successes: num(raw.successes),
        failures: num(raw.failures),
        race_wins: num(raw.race_wins),
        success_rate_pct: num(raw.success_rate_pct),
        avg_ms: nullableNum(raw.avg_ms),
      };
    if (!nodeRows.length)
      return {
        total_attempts: 0,
        successes: 0,
        failures: 0,
        race_wins: 0,
        success_rate_pct: 0,
        avg_ms: null,
      };
    const total = nodeRows.reduce((s, r) => s + r.total_attempts, 0);
    const succ = nodeRows.reduce((s, r) => s + r.successes, 0);
    const wAvg = nodeRows.reduce((s, r) => s + (r.avg_ms ?? 0) * r.successes, 0);
    return {
      total_attempts: total,
      successes: succ,
      failures: nodeRows.reduce((s, r) => s + r.failures, 0),
      race_wins: nodeRows.reduce((s, r) => s + r.race_wins, 0),
      success_rate_pct: total > 0 ? (succ / total) * 100 : 0,
      avg_ms: succ > 0 ? wAvg / succ : null,
    };
  }, [data, nodeRows]);

  const trafficData = useMemo(
    () =>
      (data?.traffic_timeseries?.data ?? []).map((r: any) => ({
        bucket: fmtBucket(r.bucket ?? ''),
        attempts: num(r.attempts),
        successes: num(r.successes),
        failures: num(r.failures),
        wins: num(r.wins),
        avg_ms: num(r.avg_ms),
        error_rate: num(r.attempts) > 0 ? (num(r.failures) / num(r.attempts)) * 100 : 0,
      })),
    [data]
  );

  const failRows = useMemo(
    () =>
      (data?.recent_failures?.data ?? []).map((r: any) => ({
        node: String(r.node ?? ''),
        error: String(r.error ?? ''),
        status_code: num(r.status_code),
        timestamp: String(r.timestamp ?? ''),
      })),
    [data]
  );
  const formatRows = useMemo(
    () =>
      (data?.format_breakdown?.data ?? []).map((r: any) => ({
        format: String(r.format ?? '?'),
        attempts: num(r.attempts),
        successes: num(r.successes),
        avg_ms: nullableNum(r.avg_ms),
      })),
    [data]
  );
  const coloRows = useMemo(
    () =>
      (data?.colo_breakdown?.data ?? []).map((r: any) => ({
        colo: String(r.colo ?? ''),
        attempts: num(r.attempts),
        successes: num(r.successes),
        avg_ms: nullableNum(r.avg_ms),
      })),
    [data]
  );
  const winRows = useMemo(
    () =>
      (data?.win_rate?.data ?? [])
        .filter((r: any) => !config.hiddenNodes.includes(r.node))
        .map((r: any) => ({
          node: String(r.node ?? ''),
          wins: num(r.wins),
          successes: num(r.successes),
          win_rate_pct: num(r.win_rate_pct),
        })),
    [data, config.hiddenNodes]
  );
  const laneRows = useMemo(
    () =>
      (data?.lane_performance?.data ?? []).map((r: any) => ({
        lane: String(r.lane ?? ''),
        attempts: num(r.attempts),
        successes: num(r.successes),
        success_rate_pct: num(r.success_rate_pct),
        avg_ms: nullableNum(r.avg_ms),
        wins: num(r.wins),
      })),
    [data]
  );

  const latencyRows: LatRowData[] = useMemo(() => {
    const rows = data?.latency_percentiles?.data ?? [];
    if (rows.length)
      return rows
        .filter((r: any) => !config.hiddenNodes.includes(r.node))
        .map((r: any) => ({
          node: String(r.node ?? ''),
          total_success: num(r.total_success),
          avg_ms: nullableNum(r.avg_ms),
          under_500ms: num(r.under_500ms),
          under_1s: num(r.under_1s),
          under_2s: num(r.under_2s),
          under_4s: num(r.under_4s),
        }));
    return nodeRows.map((r) => ({
      node: r.node,
      total_success: r.successes,
      avg_ms: r.avg_ms,
      under_500ms: 0,
      under_1s: 0,
      under_2s: 0,
      under_4s: 0,
    }));
  }, [data, nodeRows, config.hiddenNodes]);

  const heatmapData = useMemo(() => data?.error_heatmap?.data ?? [], [data]);
  const winPieData = useMemo(
    () =>
      winRows
        .filter((r) => r.wins > 0)
        .map((r) => ({
          name: nodeShortName(r.node).split(' ')[0],
          value: r.wins,
          color: nodeColor(r.node),
        })),
    [winRows]
  );
  const formatPieData = useMemo(
    () =>
      formatRows.map((r, i) => ({
        name: r.format.toUpperCase(),
        value: r.attempts,
        color: PIE_COLORS[i % PIE_COLORS.length],
      })),
    [formatRows]
  );

  const allNodeNames = useMemo(() => allNodeRows.map((r) => r.node), [allNodeRows]);

  // Alert summary
  const alertNodes = useMemo(
    () =>
      nodeRows.filter(
        (r) =>
          r.total_attempts > 0 &&
          (r.success_rate_pct < config.alertSuccessRate ||
            (r.avg_ms !== null && r.avg_ms > config.alertAvgMs))
      ),
    [nodeRows, config]
  );

  const pLabel = PERIODS[period]?.label ?? period;
  const TABS = ['overview', 'nodes', 'traffic', 'errors', 'breakdown'];

  const chartTag = {
    fill: config.chartStyle === 'area' ? 'url(#gAt)' : 'none',
    strokeWidth: config.chartStyle === 'area' ? 2 : 1.5,
  };

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: C.black,
        color: C.body,
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#070706}
        ::-webkit-scrollbar-thumb{background:rgba(196,124,46,0.22);border-radius:99px}
        .recharts-text{font-family:'JetBrains Mono',monospace!important;font-size:9px!important;fill:rgba(200,188,168,0.75)!important}
        .recharts-legend-item-text{font-size:9px!important;font-family:'JetBrains Mono',monospace!important;color:rgba(200,188,168,0.75)!important}
        select option{background:#0e0d0b;color:#f0e6cc}
        input[type=range]{accent-color:#c47c2e}
      `}</style>

      {showSettings && (
        <SettingsPanel
          config={config}
          nodeList={allNodeNames}
          onSave={applyConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* HEADER */}
      <header
        style={{
          background: C.dark,
          borderBottom: `1px solid ${C.border}`,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 16,
              fontFamily: 'Bebas Neue, cursive',
              letterSpacing: '0.1em',
              color: C.cream,
            }}
          >
            POSTERIUM
          </span>
          <div style={{ width: 1, height: 14, background: C.border }} />
          <span style={{ ...S.syneXs, color: C.amber }}>Analytics</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: loading ? C.yellow : error ? C.red : C.green,
                animation: 'pulse-dot 2s ease-in-out infinite',
                boxShadow: `0 0 5px ${loading ? C.yellow : error ? C.red : C.green}`,
              }}
            />
            <span style={{ ...S.monoXs, fontSize: 7 }}>
              {loading ? 'LOADING' : error ? 'ERROR' : 'LIVE'}
            </span>
          </div>
          {alertNodes.length > 0 && (
            <span
              style={{
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: C.red,
                fontSize: 8,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 3,
                letterSpacing: '0.08em',
              }}
            >
              ⚠ {alertNodes.length} alert{alertNodes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Period selector */}
          <div
            style={{
              display: 'flex',
              gap: 1,
              padding: 3,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.borderFaint}`,
              borderRadius: 7,
            }}
          >
            {Object.entries(PERIODS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  setPeriod(k);
                  fetchData(k);
                }}
                style={{
                  padding: '3px 9px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: 'Syne, sans-serif',
                  textTransform: 'uppercase',
                  background: period === k ? 'rgba(196,124,46,0.18)' : 'transparent',
                  color: period === k ? C.amber : C.ghost,
                }}
              >
                {v.short}
              </button>
            ))}
          </div>
          {/* Refresh selector */}
          <div
            style={{
              display: 'flex',
              gap: 1,
              padding: 3,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.borderFaint}`,
              borderRadius: 7,
            }}
          >
            {REFRESH_INTERVALS.map((ri) => (
              <button
                key={ri.label}
                onClick={() => setRefreshMs(ri.ms)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: 'Syne, sans-serif',
                  background: refreshMs === ri.ms ? 'rgba(196,124,46,0.18)' : 'transparent',
                  color: refreshMs === ri.ms ? C.amber : C.ghost,
                }}
              >
                {ri.label}
              </button>
            ))}
          </div>
          {refreshMs > 0 && countdown > 0 && <span style={{ ...S.monoXs }}>↺{countdown}s</span>}
          <button
            onClick={() => fetchData()}
            disabled={loading}
            style={{
              height: 28,
              padding: '0 12px',
              background: loading ? 'rgba(196,124,46,0.3)' : C.amber,
              color: '#070706',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'Syne, sans-serif',
              textTransform: 'uppercase',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '…' : '↻'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            style={{
              height: 28,
              width: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)',
              color: C.dim,
              border: `1px solid ${C.borderFaint}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ⚙
          </button>
          <button
            onClick={logout}
            style={{
              height: 28,
              padding: '0 10px',
              background: 'transparent',
              color: C.ghost,
              border: `1px solid ${C.borderFaint}`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 9,
              fontFamily: 'Syne, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* TABS */}
      <nav
        style={{
          background: C.dark,
          borderBottom: `1px solid ${C.borderFaint}`,
          padding: '0 16px',
          display: 'flex',
          overflowX: 'auto',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '11px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tab === t ? C.amber : C.ghost,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Syne, sans-serif',
              borderBottom: tab === t ? `2px solid ${C.amber}` : '2px solid transparent',
              marginBottom: -1,
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
            }}
          >
            {t}
          </button>
        ))}
      </nav>

      {error && (
        <div
          style={{
            margin: '16px 16px 0',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(248,113,113,0.07)',
            border: '1px solid rgba(248,113,113,0.2)',
            color: C.red,
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          ✕ {error} — Check API_BASE / network.
        </div>
      )}

      <main style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>
        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Alert banner */}
            {alertNodes.length > 0 && !loading && (
              <div
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'rgba(248,113,113,0.07)',
                  border: '1px solid rgba(248,113,113,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: C.red, ...S.monoXs, fontWeight: 700 }}>⚠ ALERTS</span>
                {alertNodes.map((n) => (
                  <span
                    key={n.node}
                    style={{
                      ...S.monoXs,
                      color: C.label,
                      background: 'rgba(248,113,113,0.1)',
                      padding: '2px 8px',
                      borderRadius: 3,
                    }}
                  >
                    {nodeShortName(n.node).split(' ·')[0]} —{' '}
                    {n.success_rate_pct < config.alertSuccessRate
                      ? `rate ${n.success_rate_pct.toFixed(0)}%`
                      : ''}
                    {n.avg_ms !== null && n.avg_ms > config.alertAvgMs
                      ? ` latency ${fmtMs(n.avg_ms)}`
                      : ''}
                  </span>
                ))}
              </div>
            )}

            {/* Stat cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: 10,
              }}
            >
              {loading ? (
                Array(8)
                  .fill(0)
                  .map((_, i) => <Skel key={i} h={90} />)
              ) : (
                <>
                  <StatCard
                    label="Total Attempts"
                    value={fmtNum(globalRow.total_attempts)}
                    sub={pLabel}
                    color={C.amber}
                    accent={C.amber}
                  />
                  <StatCard
                    label="Race Wins"
                    value={fmtNum(globalRow.race_wins)}
                    sub="Posters served"
                    color={C.gold}
                    accent={C.gold}
                  />
                  <StatCard
                    label="Successes"
                    value={fmtNum(globalRow.successes)}
                    sub={fmtPct(globalRow.success_rate_pct) + ' success rate'}
                    color={C.green}
                    accent={C.green}
                  />
                  <StatCard
                    label="Failures"
                    value={fmtNum(globalRow.failures)}
                    sub={
                      fmtPct(
                        globalRow.total_attempts > 0
                          ? (globalRow.failures / globalRow.total_attempts) * 100
                          : 0
                      ) + ' failure rate'
                    }
                    color={globalRow.failures > 50 ? C.red : C.dim}
                    accent={C.red}
                    alert={globalRow.failures > 50}
                  />
                  <StatCard
                    label="Avg Latency"
                    value={fmtMs(globalRow.avg_ms)}
                    sub="Weighted across nodes"
                    color={msColor(globalRow.avg_ms)}
                    accent={C.blue}
                    alert={globalRow.avg_ms !== null && globalRow.avg_ms > config.alertAvgMs}
                  />
                  <StatCard
                    label="Active Nodes"
                    value={nodeRows.filter((r) => r.total_attempts > 0).length}
                    sub={`of ${allNodeRows.length} total`}
                    color={C.cream}
                    accent={C.purple}
                  />
                  <StatCard
                    label="Healthy"
                    value={
                      nodeRows.filter(
                        (r) => r.success_rate_pct >= config.alertSuccessRate && r.total_attempts > 0
                      ).length
                    }
                    sub={`≥${config.alertSuccessRate}% success`}
                    color={C.green}
                    accent={C.green}
                  />
                  <StatCard
                    label="Degraded / Down"
                    value={
                      nodeRows.filter(
                        (r) => r.success_rate_pct < config.alertSuccessRate && r.total_attempts > 0
                      ).length
                    }
                    sub={`<${config.alertSuccessRate}% success`}
                    color={C.orange}
                    accent={C.orange}
                    alert={alertNodes.length > 0}
                  />
                </>
              )}
            </div>

            {/* Traffic chart */}
            <Card title="Traffic Over Time" tag={pLabel}>
              {loading ? (
                <Skel h={200} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={trafficData}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="gAt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.amber} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: C.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: C.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<TT />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono, monospace',
                        paddingTop: 8,
                      }}
                    />
                    {config.chartStyle === 'area' ? (
                      <Area
                        type="monotone"
                        dataKey="attempts"
                        name="Attempts"
                        stroke={C.amber}
                        fill="url(#gAt)"
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="attempts"
                        name="Attempts"
                        stroke={C.amber}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {config.chartStyle === 'area' ? (
                      <Area
                        type="monotone"
                        dataKey="successes"
                        name="Successes"
                        stroke={C.green}
                        fill="url(#gSc)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="successes"
                        name="Successes"
                        stroke={C.green}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="failures"
                      name="Failures"
                      stroke={C.red}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Node health + Win pie */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: config.showWinPie ? '1fr 300px' : '1fr',
                gap: 14,
              }}
            >
              <Card title="Node Health Matrix" tag={pLabel}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${config.compactMode ? 180 : 210}px, 1fr))`,
                    gap: config.compactMode ? 6 : 10,
                  }}
                >
                  {loading ? (
                    Array(4)
                      .fill(0)
                      .map((_, i) => <Skel key={i} h={80} />)
                  ) : nodeRows.length === 0 ? (
                    <div style={{ ...S.monoSm, color: C.ghost, padding: 20 }}>
                      No data for this period.
                    </div>
                  ) : (
                    nodeRows.map((row) => {
                      const latRow = latencyRows.find((r) => r.node === row.node);
                      return (
                        <NodeCard
                          key={row.node}
                          row={row}
                          latRow={latRow}
                          compact={config.compactMode}
                          alertSuccessRate={config.alertSuccessRate}
                          alertAvgMs={config.alertAvgMs}
                        />
                      );
                    })
                  )}
                </div>
              </Card>

              {config.showWinPie && (
                <Card title="Race Win Distribution">
                  {loading ? (
                    <Skel h={180} />
                  ) : winPieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie
                            data={winPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={42}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {winPieData.map((e, i) => (
                              <Cell
                                key={i}
                                fill={e.color}
                                stroke="rgba(0,0,0,0.3)"
                                strokeWidth={1}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: any) => [fmtNum(v), 'Wins']}
                            contentStyle={{
                              background: C.char,
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              fontSize: 10,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}
                      >
                        {winRows
                          .filter((r) => r.wins > 0)
                          .sort((a, b) => b.wins - a.wins)
                          .map((r) => (
                            <div
                              key={r.node}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    background: nodeColor(r.node),
                                  }}
                                />
                                <span style={{ ...S.monoXs, color: C.label, fontSize: 8 }}>
                                  {nodeShortName(r.node).split(' ')[0]}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ ...S.monoXs, color: C.ghost, fontSize: 7 }}>
                                  {r.win_rate_pct.toFixed(0)}% rate
                                </span>
                                <span style={{ ...S.monoXs, color: C.gold, fontWeight: 700 }}>
                                  ⚡ {fmtNum(r.wins)}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ ...S.monoSm, color: C.ghost, textAlign: 'center', padding: 40 }}>
                      No win data
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Lane performance */}
            {config.showLanePanel && laneRows.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Card title="Lane Performance" tag="A=WA+Ohio  B=DE+Ohio  C=WA+DE">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {laneRows.map((lane) => (
                      <div
                        key={lane.lane}
                        style={{
                          padding: 12,
                          ...S.charBg,
                          borderTop: `2px solid ${rateColor(lane.success_rate_pct)}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 22,
                            fontFamily: 'Bebas Neue, cursive',
                            color: C.amber,
                            letterSpacing: '0.1em',
                            marginBottom: 8,
                          }}
                        >
                          Lane {lane.lane}
                        </div>
                        {[
                          { l: 'Attempts', v: fmtNum(lane.attempts), c: C.cream },
                          {
                            l: 'Success',
                            v: fmtPct(lane.success_rate_pct),
                            c: rateColor(lane.success_rate_pct),
                          },
                          { l: 'Avg Latency', v: fmtMs(lane.avg_ms), c: msColor(lane.avg_ms) },
                          { l: 'Wins', v: fmtNum(lane.wins), c: C.gold },
                        ].map((m) => (
                          <div key={m.l} style={{ marginBottom: 5 }}>
                            <div style={{ ...S.monoXs, fontSize: 7 }}>{m.l}</div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: m.c,
                                fontFamily: 'JetBrains Mono, monospace',
                              }}
                            >
                              {m.v}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
                <Card title="Lane Comparison">
                  {loading ? (
                    <Skel h={180} />
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={laneRows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="lane"
                          tick={{ fill: C.ghost, fontSize: 9 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(l) => `Lane ${l}`}
                        />
                        <YAxis
                          tick={{ fill: C.ghost, fontSize: 8 }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                        />
                        <Tooltip content={<TT />} />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        <Bar
                          dataKey="attempts"
                          name="Attempts"
                          fill={C.amber}
                          opacity={0.7}
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="successes"
                          name="Successes"
                          fill={C.green}
                          opacity={0.7}
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="wins"
                          name="Wins"
                          fill={C.gold}
                          opacity={0.7}
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ── NODES ────────────────────────────────────────────────────────── */}
        {tab === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Node Performance Table" tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', padding: 14 }}>
                {loading ? (
                  <Skel h={300} />
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {[
                          'Node',
                          'Status',
                          'Attempts',
                          'Succ. Rate',
                          'Avg Latency',
                          'P50 est',
                          'P95 est',
                          'Wins',
                          'Health',
                          'Dist',
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '7px 12px',
                              textAlign: h === 'Node' || h === 'Status' ? 'left' : 'right',
                              ...S.label,
                              borderBottom: `1px solid ${C.borderFaint}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodeRows.map((row, i) => {
                        const health =
                          row.success_rate_pct >= config.alertSuccessRate
                            ? 'healthy'
                            : row.success_rate_pct >= 10
                              ? 'degraded'
                              : 'down';
                        const hc =
                          health === 'healthy' ? C.green : health === 'degraded' ? C.yellow : C.red;
                        const lRow = latencyRows.find((r) => r.node === row.node);
                        const score = healthScore(row.success_rate_pct, row.avg_ms);
                        return (
                          <tr
                            key={row.node}
                            style={{
                              background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                              borderBottom: `1px solid rgba(255,255,255,0.03)`,
                            }}
                          >
                            <td style={{ padding: '9px 12px', minWidth: 170 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: nodeColor(row.node),
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    ...S.monoSm,
                                    color: C.label,
                                    fontWeight: 600,
                                    fontSize: 10,
                                  }}
                                >
                                  {nodeShortName(row.node)}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              <span
                                style={{
                                  ...S.monoXs,
                                  color: hc,
                                  textTransform: 'uppercase',
                                  background: `${hc}18`,
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                }}
                              >
                                {health}
                              </span>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', ...S.monoSm }}>
                              {fmtNum(row.total_attempts)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                              <Gauge
                                value={row.success_rate_pct}
                                size={36}
                                thresholds={{ warn: config.alertSuccessRate, ok: 100 }}
                              />
                            </td>
                            <td
                              style={{
                                padding: '9px 12px',
                                textAlign: 'right',
                                color: msColor(row.avg_ms),
                                fontFamily: 'JetBrains Mono, monospace',
                                fontWeight: 700,
                              }}
                            >
                              {fmtMs(row.avg_ms)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', ...S.monoXs }}>
                              {lRow ? estimateP50(lRow) : '—'}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', ...S.monoXs }}>
                              {lRow ? estimateP95(lRow) : '—'}
                            </td>
                            <td
                              style={{
                                padding: '9px 12px',
                                textAlign: 'right',
                                color: row.race_wins > 0 ? C.gold : C.ghost,
                                fontFamily: 'JetBrains Mono, monospace',
                                fontWeight: 700,
                              }}
                            >
                              {row.race_wins > 0 ? `⚡${fmtNum(row.race_wins)}` : '—'}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  fontFamily: 'JetBrains Mono, monospace',
                                  color: score >= 80 ? C.green : score >= 60 ? C.yellow : C.red,
                                }}
                              >
                                {score}
                              </span>
                            </td>
                            <td style={{ padding: '9px 12px', minWidth: 120 }}>
                              {lRow && lRow.under_4s > 0 ? (
                                <LatencyDistBar row={lRow} showLabels={false} />
                              ) : (
                                <span style={{ ...S.monoXs }}>{fmtMs(row.avg_ms)} avg</span>
                              )}
                            </td>
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
                {loading ? (
                  <Skel h={220} />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[...nodeRows].sort((a, b) => (a.avg_ms ?? 9999) - (b.avg_ms ?? 9999))}
                      layout="vertical"
                      margin={{ left: 0, right: 36, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: C.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmtMs(v)}
                      />
                      <YAxis
                        type="category"
                        dataKey="node"
                        tick={{ fill: C.dim, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tickFormatter={(n) => nodeShortName(n).split(' ')[0]}
                      />
                      <Tooltip content={<TT />} formatter={(v: any) => [fmtMs(v), 'Avg Latency']} />
                      <ReferenceLine
                        x={config.alertAvgMs}
                        stroke={C.red}
                        strokeDasharray="4 3"
                        strokeWidth={1}
                        label={{ value: 'Alert', fill: C.red, fontSize: 7 }}
                      />
                      <Bar dataKey="avg_ms" name="Avg Latency" radius={[0, 4, 4, 0]}>
                        {nodeRows.map((row, i) => (
                          <Cell key={i} fill={msColor(row.avg_ms)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card title="Health Score by Node">
                {loading ? (
                  <Skel h={220} />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[...nodeRows]
                        .filter((r) => r.total_attempts > 0)
                        .sort(
                          (a, b) =>
                            healthScore(b.success_rate_pct, b.avg_ms) -
                            healthScore(a.success_rate_pct, a.avg_ms)
                        )}
                      layout="vertical"
                      margin={{ left: 0, right: 36, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fill: C.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="node"
                        tick={{ fill: C.dim, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tickFormatter={(n) => nodeShortName(n).split(' ')[0]}
                      />
                      <Tooltip
                        content={<TT />}
                        formatter={(v: any) => [`${v}/100`, 'Health Score']}
                      />
                      <ReferenceLine
                        x={80}
                        stroke={C.green}
                        strokeDasharray="4 3"
                        strokeWidth={1}
                        label={{ value: 'Good', fill: C.green, fontSize: 7 }}
                      />
                      <Bar
                        dataKey={(r) => healthScore(r.success_rate_pct, r.avg_ms)}
                        name="Health Score"
                        radius={[0, 4, 4, 0]}
                      >
                        {[...nodeRows]
                          .filter((r) => r.total_attempts > 0)
                          .sort(
                            (a, b) =>
                              healthScore(b.success_rate_pct, b.avg_ms) -
                              healthScore(a.success_rate_pct, a.avg_ms)
                          )
                          .map((row, i) => {
                            const s = healthScore(row.success_rate_pct, row.avg_ms);
                            return (
                              <Cell key={i} fill={s >= 80 ? C.green : s >= 60 ? C.yellow : C.red} />
                            );
                          })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* Latency percentile breakdown per node */}
            <Card title="Latency Percentile Breakdown" tag="P50 / P95 estimates from bucket data">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 10,
                }}
              >
                {loading
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => <Skel key={i} h={80} />)
                  : latencyRows
                      .filter((r) => r.under_4s > 0)
                      .map((lRow) => (
                        <div key={lRow.node} style={{ padding: 12, ...S.charBg }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: nodeColor(lRow.node),
                              }}
                            />
                            <span
                              style={{ ...S.monoSm, color: C.label, fontWeight: 600, fontSize: 9 }}
                            >
                              {nodeShortName(lRow.node).split(' ·')[0]}
                            </span>
                          </div>
                          <LatencyDistBar row={lRow} showLabels />
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: 6,
                              marginTop: 8,
                            }}
                          >
                            {[
                              { l: 'Avg', v: fmtMs(lRow.avg_ms) },
                              { l: 'P50', v: estimateP50(lRow) },
                              { l: 'P95', v: estimateP95(lRow) },
                            ].map((m) => (
                              <div key={m.l}>
                                <div style={{ ...S.monoXs, fontSize: 7 }}>{m.l}</div>
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: C.label,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    marginTop: 1,
                                  }}
                                >
                                  {m.v}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── TRAFFIC ──────────────────────────────────────────────────────── */}
        {tab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 10,
              }}
            >
              {loading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => <Skel key={i} h={88} />)
              ) : (
                <>
                  <StatCard
                    label="Total (period)"
                    value={fmtNum(globalRow.total_attempts)}
                    sub={pLabel}
                    color={C.amber}
                  />
                  <StatCard
                    label="Peak Bucket"
                    value={fmtNum(Math.max(...trafficData.map((d) => d.attempts), 0))}
                    sub="Highest single bucket"
                    color={C.gold}
                  />
                  <StatCard
                    label="Avg / Bucket"
                    value={fmtNum(
                      trafficData.length
                        ? Math.round(
                            trafficData.reduce((s, d) => s + d.attempts, 0) / trafficData.length
                          )
                        : 0
                    )}
                    sub="Mean bucket rate"
                    color={C.cream}
                  />
                  <StatCard
                    label="Peak Error Rate"
                    value={fmtPct(Math.max(...trafficData.map((d) => d.error_rate), 0))}
                    sub="Worst bucket"
                    color={C.red}
                    alert={Math.max(...trafficData.map((d) => d.error_rate), 0) > 5}
                  />
                  <StatCard
                    label="Win Rate"
                    value={fmtPct(
                      globalRow.total_attempts > 0
                        ? (globalRow.race_wins / globalRow.total_attempts) * 100
                        : 0
                    )}
                    sub="Wins / attempts"
                    color={C.green}
                  />
                  <StatCard
                    label="Avg Latency"
                    value={fmtMs(globalRow.avg_ms)}
                    sub="Global weighted avg"
                    color={msColor(globalRow.avg_ms)}
                    alert={globalRow.avg_ms !== null && globalRow.avg_ms > config.alertAvgMs}
                  />
                </>
              )}
            </div>

            <Card title="Attempts · Successes · Failures · Wins" tag={pLabel}>
              {loading ? (
                <Skel h={240} />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart
                    data={trafficData}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="gA2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.amber} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gS2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.green} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gW2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.gold} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: C.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: C.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<TT />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono, monospace',
                        paddingTop: 8,
                      }}
                    />
                    {config.chartStyle === 'area' ? (
                      <Area
                        type="monotone"
                        dataKey="attempts"
                        name="Attempts"
                        stroke={C.amber}
                        fill="url(#gA2)"
                        strokeWidth={2}
                        dot={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="attempts"
                        name="Attempts"
                        stroke={C.amber}
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {config.chartStyle === 'area' ? (
                      <Area
                        type="monotone"
                        dataKey="wins"
                        name="Race Wins"
                        stroke={C.gold}
                        fill="url(#gW2)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="wins"
                        name="Race Wins"
                        stroke={C.gold}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="failures"
                      name="Failures"
                      stroke={C.red}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card title="Avg Latency Over Time">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fill: C.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: C.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        tickFormatter={(v) => fmtMs(v)}
                      />
                      <Tooltip content={<TT />} formatter={(v: any) => [fmtMs(v), 'Avg latency']} />
                      <ReferenceLine
                        y={1000}
                        stroke={C.yellow}
                        strokeDasharray="4 3"
                        strokeWidth={1}
                        label={{ value: '1s', fill: C.yellow, fontSize: 8 }}
                      />
                      <ReferenceLine
                        y={config.alertAvgMs}
                        stroke={C.red}
                        strokeDasharray="4 3"
                        strokeWidth={1}
                        label={{ value: 'Alert', fill: C.red, fontSize: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_ms"
                        name="Avg Latency"
                        stroke={C.blue}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card title="Error Rate Over Time">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={trafficData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fill: C.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: C.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        width={36}
                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                        domain={[0, 'auto']}
                      />
                      <Tooltip
                        content={<TT />}
                        formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Error Rate']}
                      />
                      <ReferenceLine
                        y={10}
                        stroke={C.red}
                        strokeDasharray="4 3"
                        strokeWidth={1}
                        label={{ value: '10%', fill: C.red, fontSize: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="error_rate"
                        name="Error Rate"
                        stroke={C.red}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── ERRORS ───────────────────────────────────────────────────────── */}
        {tab === 'errors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))',
                gap: 10,
              }}
            >
              {loading ? (
                Array(4)
                  .fill(0)
                  .map((_, i) => <Skel key={i} h={88} />)
              ) : (
                <>
                  <StatCard
                    label="Total Failures"
                    value={fmtNum(globalRow.failures)}
                    sub={pLabel}
                    color={globalRow.failures > 0 ? C.red : C.green}
                    accent={C.red}
                    alert={globalRow.failures > 50}
                  />
                  <StatCard
                    label="Failure Rate"
                    value={fmtPct(
                      globalRow.total_attempts > 0
                        ? (globalRow.failures / globalRow.total_attempts) * 100
                        : 0
                    )}
                    sub="Global average"
                    color={globalRow.failures > 0 ? C.orange : C.green}
                    accent={C.red}
                  />
                  <StatCard
                    label="Affected Nodes"
                    value={nodeRows.filter((r) => r.failures > 0).length}
                    sub="Nodes with any failures"
                    color={C.orange}
                    accent={C.orange}
                  />
                  <StatCard
                    label="Most Failures"
                    value={
                      nodeRows.sort((a, b) => b.failures - a.failures)[0]?.node
                        ? nodeShortName(
                            nodeRows.sort((a, b) => b.failures - a.failures)[0].node
                          ).split(' ')[0]
                        : '—'
                    }
                    sub={`${fmtNum(nodeRows.reduce((s, r) => s + (r.failures > s ? r.failures : s), 0))} max`}
                    color={C.label}
                  />
                </>
              )}
            </div>

            <Card title="Failure Heatmap — Node × Time" tag="colour = failure intensity">
              {loading ? (
                <Skel h={160} />
              ) : (
                <HourHeatmap
                  data={
                    heatmapData.length > 0
                      ? heatmapData
                      : trafficData.map((d) => ({ ...d, node: 'global' }))
                  }
                />
              )}
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card title="Failures by Node">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={[...nodeRows]
                        .filter((r) => r.failures > 0)
                        .sort((a, b) => b.failures - a.failures)}
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: C.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="node"
                        tick={{ fill: C.dim, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tickFormatter={(n) => nodeShortName(n).split(' ')[0]}
                      />
                      <Tooltip content={<TT />} />
                      <Bar dataKey="failures" name="Failures" fill={C.red} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card title="Error Breakdown">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(data?.error_breakdown?.data ?? []).map((r: any, i: number) => {
                      const maxOcc = Math.max(
                        ...(data?.error_breakdown?.data ?? []).map((x: any) => num(x.occurrences)),
                        1
                      );
                      return (
                        <div key={i} style={{ padding: '10px 12px', ...S.charBg }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 6,
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontFamily: 'JetBrains Mono, monospace',
                                  color: C.red,
                                  marginRight: 8,
                                }}
                              >
                                {r.error}
                              </span>
                              <span style={{ ...S.monoXs }}>
                                {nodeShortName(String(r.node ?? '')).split(' ')[0]}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                fontFamily: 'Bebas Neue, cursive',
                                color: C.red,
                                letterSpacing: '0.04em',
                              }}
                            >
                              {fmtNum(num(r.occurrences))}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 4,
                              borderRadius: 2,
                              background: 'rgba(255,255,255,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 2,
                                background: C.red,
                                width: `${(num(r.occurrences) / maxOcc) * 100}%`,
                                opacity: 0.7,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(data?.error_breakdown?.data ?? []).length === 0 && (
                      <div
                        style={{ ...S.monoSm, color: C.green, textAlign: 'center', padding: 20 }}
                      >
                        ✓ No errors recorded
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <Card title={`Recent Failures (${failRows.length})`} tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: 14 }}>
                    <Skel h={200} />
                  </div>
                ) : failRows.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', ...S.monoSm, color: C.green }}>
                    ✓ No failures in this period
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead style={{ position: 'sticky', top: 0, background: C.mid, zIndex: 1 }}>
                      <tr>
                        {['Time', 'Node', 'Status', 'Error'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '7px 12px',
                              textAlign: 'left',
                              ...S.label,
                              borderBottom: `1px solid ${C.borderFaint}`,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {failRows.slice(0, 100).map((r, i) => (
                        <tr
                          key={i}
                          style={{
                            background: i % 2 === 0 ? 'rgba(248,113,113,0.025)' : 'transparent',
                            borderBottom: `1px solid rgba(255,255,255,0.025)`,
                          }}
                        >
                          <td style={{ padding: '6px 12px', ...S.monoXs, whiteSpace: 'nowrap' }}>
                            {relTime(r.timestamp)}
                          </td>
                          <td style={{ padding: '6px 12px', ...S.monoSm, color: C.label }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: nodeColor(r.node),
                                }}
                              />
                              {nodeShortName(r.node).split(' ')[0]}
                            </div>
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <span
                              style={{
                                ...S.monoXs,
                                color: r.status_code === 0 ? C.orange : C.red,
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${C.borderFaint}`,
                                borderRadius: 3,
                                padding: '1px 5px',
                              }}
                            >
                              {r.status_code === 0
                                ? 'TIMEOUT'
                                : `HTTP ${Math.round(r.status_code)}`}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '6px 12px',
                              ...S.monoXs,
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: C.dim,
                            }}
                          >
                            {r.error}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ── BREAKDOWN ────────────────────────────────────────────────────── */}
        {tab === 'breakdown' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))',
                gap: 14,
              }}
            >
              <Card title="Format Distribution">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={110}>
                      <PieChart>
                        <Pie
                          data={formatPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={48}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {formatPieData.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) => [fmtNum(v), 'Attempts']}
                          contentStyle={{
                            background: C.char,
                            border: `1px solid ${C.border}`,
                            borderRadius: 6,
                            fontSize: 10,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {formatRows.map((r, i) => (
                        <div
                          key={r.format}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 2,
                                background: PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                            <span style={{ ...S.monoSm, fontWeight: 700, color: C.label }}>
                              {r.format.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <span style={{ ...S.monoXs }}>{fmtNum(r.attempts)} req</span>
                            <span style={{ ...S.monoXs, color: msColor(r.avg_ms) }}>
                              {fmtMs(r.avg_ms)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>

              <Card title="Input Type Distribution">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  (() => {
                    const typeRows = (data?.type_breakdown?.data ?? []).map(
                      (r: any, i: number) => ({
                        input_type: String(r.input_type ?? ''),
                        attempts: num(r.attempts),
                        avg_ms: nullableNum(r.avg_ms),
                        color: PIE_COLORS[(i + 3) % PIE_COLORS.length],
                      })
                    );
                    const maxA = Math.max(...typeRows.map((r) => r.attempts), 1);
                    if (!typeRows.length)
                      return (
                        <div
                          style={{ ...S.monoSm, color: C.ghost, padding: 20, textAlign: 'center' }}
                        >
                          No data
                        </div>
                      );
                    return (
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}
                      >
                        {typeRows.map((r) => (
                          <div key={r.input_type}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 5,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: C.amber,
                                  fontFamily: 'Bebas Neue, cursive',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                {(r.input_type || 'UNKNOWN').toUpperCase()}
                              </span>
                              <div style={{ display: 'flex', gap: 10 }}>
                                <span style={{ ...S.monoXs }}>{fmtNum(r.attempts)} req</span>
                                <span style={{ ...S.monoXs, color: msColor(r.avg_ms) }}>
                                  {fmtMs(r.avg_ms)}
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                height: 5,
                                borderRadius: 2.5,
                                background: 'rgba(255,255,255,0.06)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  borderRadius: 2.5,
                                  background: r.color,
                                  width: `${(r.attempts / maxA) * 100}%`,
                                  transition: 'width 0.6s ease',
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </Card>

              <Card title="Top Datacenters">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {coloRows.map((r) => {
                      const rate = r.attempts > 0 ? (r.successes / r.attempts) * 100 : 0;
                      const maxA = Math.max(...coloRows.map((c) => c.attempts), 1);
                      return (
                        <div key={r.colo}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 3,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: C.cream,
                                fontFamily: 'JetBrains Mono, monospace',
                                fontWeight: 700,
                              }}
                            >
                              {r.colo}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <span style={{ ...S.monoXs, color: rateColor(rate) }}>
                                {fmtPct(rate)}
                              </span>
                              <span style={{ ...S.monoXs, color: msColor(r.avg_ms) }}>
                                {fmtMs(r.avg_ms)}
                              </span>
                              <span style={{ ...S.monoXs }}>{fmtNum(r.attempts)}</span>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 3,
                              borderRadius: 2,
                              background: 'rgba(255,255,255,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                borderRadius: 2,
                                background: rateColor(rate),
                                width: `${(r.attempts / maxA) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {!coloRows.length && (
                      <div style={{ ...S.monoSm, color: C.ghost, padding: 10 }}>No colo data</div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <Card title="Datacenter Volume · Colour = Success Rate">
              {loading ? (
                <Skel h={200} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={coloRows.slice(0, 20)}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="colo"
                      tick={{ fill: C.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: C.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <Tooltip content={<TT />} />
                    <Bar dataKey="attempts" name="Attempts" radius={[4, 4, 0, 0]}>
                      {coloRows.map((r, i) => {
                        const rate = r.attempts > 0 ? (r.successes / r.attempts) * 100 : 0;
                        return <Cell key={i} fill={rateColor(rate)} fillOpacity={0.7} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        <div
          style={{
            marginTop: 28,
            paddingTop: 14,
            borderTop: `1px solid ${C.borderFaint}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ ...S.monoXs, fontSize: 7 }}>
            POSTERIUM · raster_metrics · CF Analytics Engine · v2
          </span>
          <span style={{ ...S.monoXs, fontSize: 7 }}>
            {lastFetch ? `Refreshed ${lastFetch.toLocaleTimeString()}` : ''} · {pLabel} ·{' '}
            {config.compactMode ? 'compact' : 'full'} view
          </span>
        </div>
      </main>
    </div>
  );
}
