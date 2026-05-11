// src/components/admin/AnalyticsDashboard.tsx
// ─── Posterium Analytics v4 ───────────────────────────────────────────────────
//
// What's new:
//   • Real live mode — actual setInterval polling, not a countdown gimmick
//   • "Requests" tab — user-facing analytics: top IDs, device breakdown,
//     country map, cache hit rate, format split, rating combos
//   • "DB Stats" tab — live D1 database information (total entries, unique IDs,
//     media type split, freshness bands)
//   • Poster thumbnails for top-requested IDs
//   • Dynamic recharts tick formatter that adapts to every time granularity
//   • Uses MainNavbar from shared components (removes code duplication)
//   • All data fetched concurrently; each tab only processes its own slice

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import MainNavbar from '@/components/shared/MainNavbar';
import { AmberTag } from '@/components/shared/primitives';

const API_BASE = 'https://api.spicydevs.xyz';
const POSTER_API = 'https://api.spicydevs.xyz';
const AUTH_KEY = 'posterium_analytics_auth_v4';
const CONFIG_KEY = 'posterium_dash_config_v4';
const CORRECT_PW = 'admin123';

// ── Palette ───────────────────────────────────────────────────────────────────
const CH = {
  amber: '#c47c2e',
  gold: '#d4a245',
  cream: '#f0e6cc',
  green: '#4ade80',
  red: '#f87171',
  orange: '#fb923c',
  yellow: '#facc15',
  blue: '#60a5fa',
  purple: '#a78bfa',
  teal: '#2dd4bf',
  pink: '#f472b6',
  ghost: 'rgba(140,130,112,0.45)',
  dim: 'rgba(180,168,148,0.65)',
};
const PIE_COLORS = [
  CH.amber,
  CH.blue,
  CH.green,
  CH.yellow,
  CH.orange,
  CH.purple,
  CH.teal,
  CH.red,
  CH.pink,
];
// HTTPS-only nodes we can poll from the browser
const LIVE_HEALTH_NODES = [
  { id:'washington', label:'US East', url:'https://us-r-vercel.vercel.app' },
  { id:'london',     label:'London',  url:'https://uk-r-vercel.vercel.app' },
  { id:'tokyo',      label:'Tokyo',   url:'https://jp-r-vercel.vercel.app' },
  { id:'mumbai',     label:'Mumbai',  url:'https://rasterize-node.vercel.app' },
  { id:'ohio',       label:'Ohio',    url:'https://r-netlify.netlify.app' },
  { id:'render_eu',  label:'EUC',     url:'https://euc-r-render.onrender.com' },
];

function nodeColor(n: string) {
  const MAP: Record<string, string> = {
    washington: CH.blue,
    london: CH.green,
    tokyo: CH.yellow,
    mumbai: CH.red,
    germany: CH.teal,
    france: CH.purple,
    wsrv: CH.orange,
    'render-eu': CH.pink,
    ohio: CH.purple,
    'cf-binding': CH.gold,
    render_eu: CH.pink,
  };
  return MAP[n] ?? CH.ghost;
}
function nodeLabel(n: string) {
  const MAP: Record<string, string> = {
    washington: 'Washington · Vercel',
    ohio: 'Ohio · Netlify',
    london: 'London · Vercel',
    tokyo: 'Tokyo · Vercel',
    mumbai: 'Mumbai · Vercel',
    germany: 'Germany · Spaceify',
    france: 'France · Spaceify',
    wsrv: 'wsrv.nl',
    'render-eu': 'EU Central · Render',
    'cf-binding': 'CF Binding',
    render_eu: 'EU Central · Render',
  };
  return MAP[n] ?? n;
}

const LANE_META: Record<string, { label: string; color: string }> = {
  geo: { label: 'Primary (geo)', color: CH.green },
  binding: { label: 'CF Binding', color: CH.teal },
  'geo-fallback': { label: 'Tier 1 Fallback', color: CH.yellow },
  'geo-t2': { label: 'Tier 2 Fallback', color: CH.orange },
  'wsrv-fallback': { label: 'wsrv (fallback)', color: CH.purple },
  'geo-t3': { label: 'Tier 3 Fallback', color: CH.red },
  'wsrv-t3': { label: 'wsrv (Tier 3)', color: '#dc2626' },
  bulk: { label: 'Bulk', color: CH.blue },
};

const DEVICE_META: Record<string, { label: string; icon: string; color: string }> = {
  desktop: { label: 'Desktop', icon: '🖥️', color: CH.blue },
  mobile: { label: 'Mobile', icon: '📱', color: CH.green },
  tablet: { label: 'Tablet', icon: '📲', color: CH.yellow },
  tv: { label: 'Smart TV', icon: '📺', color: CH.purple },
};

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
function msColor(ms: number | null) {
  if (ms === null) return CH.ghost;
  if (ms < 500) return CH.green;
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

/** Dynamic bucket label based on current granularity */
function fmtBucket(s: string, granularity: string) {
  if (!s) return '';
  try {
    const d = new Date(s.replace(' ', 'T') + 'Z');
    if (granularity === 'day') return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    if (granularity === 'hour')
      return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}h`;
    // 5min / 15min / 30min / minute
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  } catch {
    return s.slice(0, 13);
  }
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// ── Period config ─────────────────────────────────────────────────────────────
const PERIODS: Record<string, { label: string; short: string }> = {
  '15m': { label: '15 Minutes', short: '15M' },
  '1h': { label: '1 Hour', short: '1H' },
  '3h': { label: '3 Hours', short: '3H' },
  '6h': { label: '6 Hours', short: '6H' },
  '12h': { label: '12 Hours', short: '12H' },
  '24h': { label: '24 Hours', short: '24H' },
  '2d': { label: '2 Days', short: '2D' },
  '7d': { label: '7 Days', short: '7D' },
  '14d': { label: '14 Days', short: '14D' },
  '30d': { label: '30 Days', short: '30D' },
};

const TABS = [
  'overview', 'nodes', 'traffic', 'fallbacks',
  'requests', 'devices', 'db', 'errors', 'breakdown', 'wall-time', 'svg', // ← add 'svg'
] as const;
type Tab = (typeof TABS)[number];

interface DashConfig {
  period: string;
  alertRate: number;
  alertMs: number;
}

function loadCfg(): DashConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { period: '24h', alertRate: 90, alertMs: 2000, ...JSON.parse(raw) };
  } catch {}
  return { period: '24h', alertRate: 90, alertMs: 2000 };
}
function saveCfg(c: DashConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
  } catch {}
}

// ── Recharts shared components ────────────────────────────────────────────────
const FilmTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--film-dark)',
        border: '1px solid var(--film-border)',
        borderRadius: 8,
        padding: '10px 14px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        minWidth: 150,
      }}
    >
      {label && <div style={{ color: CH.amber, marginBottom: 6, fontWeight: 700 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          style={{
            color: p.color ?? CH.cream,
            marginBottom: 3,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ color: CH.dim }}>{p.name}</span>
          <strong>
            {typeof p.value === 'number'
              ? p.value > 10000
                ? fmtNum(p.value)
                : p.value % 1 !== 0
                  ? p.value.toFixed(1)
                  : p.value
              : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

const Skel = ({ h = 80 }: { h?: number }) => (
  <div
    style={{
      height: h,
      borderRadius: 6,
      background:
        'linear-gradient(110deg,var(--film-dark) 25%,var(--film-char) 50%,var(--film-dark) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.8s linear infinite',
    }}
  />
);

const Gauge = ({ value, size = 44 }: { value: number; size?: number }) => {
  const r = size / 2 - 5,
    circ = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(value / 100, 1)) * circ;
  const color = value >= 90 ? CH.green : value >= 70 ? CH.yellow : value >= 40 ? CH.orange : CH.red;
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
        fontSize={9}
        fontWeight="700"
        fontFamily="JetBrains Mono, monospace"
      >
        {value.toFixed(0)}%
      </text>
    </svg>
  );
};

const StatCard = ({
  label,
  value,
  sub,
  color = CH.amber,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  alert?: boolean;
}) => (
  <div
    style={{
      padding: '14px 16px',
      background: 'var(--film-char)',
      border: '1px solid var(--film-border)',
      borderRadius: 10,
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
        background: `linear-gradient(90deg, ${alert ? CH.red : color}, transparent)`,
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
          background: CH.red,
          boxShadow: `0 0 6px ${CH.red}`,
          animation: 'pulse-dot 2s ease-in-out infinite',
        }}
      />
    )}
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 8,
        color: CH.ghost,
        letterSpacing: '0.16em',
        textTransform: 'uppercase' as const,
      }}
    >
      {label}
    </span>
    <span
      className="poster-font"
      style={{ fontSize: 36, color, lineHeight: 1, letterSpacing: '0.04em' }}
    >
      {value}
    </span>
    {sub && (
      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 8,
          color: CH.ghost,
          lineHeight: 1.5,
        }}
      >
        {sub}
      </span>
    )}
  </div>
);

const Card = ({
  title,
  tag,
  children,
  noPad,
  fullWidth,
}: {
  title: string;
  tag?: string;
  children: React.ReactNode;
  noPad?: boolean;
  fullWidth?: boolean;
}) => (
  <div
    style={{
      background: 'var(--film-mid)',
      border: '1px solid var(--film-border)',
      borderRadius: 10,
      overflow: 'hidden',
      gridColumn: fullWidth ? '1 / -1' : undefined,
    }}
  >
    <div
      style={{
        padding: '9px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(196,124,46,0.025)',
      }}
    >
      <span
        className="syne-font"
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          color: CH.amber,
        }}
      >
        {title}
      </span>
      {tag && (
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 7,
            color: CH.ghost,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 3,
            padding: '2px 6px',
          }}
        >
          {tag}
        </span>
      )}
    </div>
    <div style={noPad ? undefined : { padding: 14 }}>{children}</div>
  </div>
);

const NodeCard = ({ row, latRow, alertRate, alertMs }: any) => {
  const pct = num(row.success_rate_pct);
  const avgMs = nullableNum(row.avg_ms);
  const score = healthScore(pct, avgMs);
  const health = pct >= alertRate ? 'healthy' : pct >= 10 ? 'degraded' : 'down';
  const hc = health === 'healthy' ? CH.green : health === 'degraded' ? CH.yellow : CH.red;
  const alertMs_ = avgMs !== null && avgMs > alertMs;
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--film-char)',
        border: '1px solid var(--film-border)',
        borderRadius: 8,
        borderLeft: `3px solid ${nodeColor(row.node)}`,
        position: 'relative',
      }}
    >
      {alertMs_ && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: CH.red,
            boxShadow: `0 0 6px ${CH.red}`,
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: 'var(--film-cream)',
              fontWeight: 600,
            }}
          >
            {nodeLabel(row.node).split(' ·')[0]}
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 7,
                color: hc,
                textTransform: 'uppercase' as const,
              }}
            >
              {health}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost }}>
              · {score}/100
            </span>
          </div>
        </div>
        <Gauge value={pct} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {[
          { l: 'Avg', v: fmtMs(avgMs), c: alertMs_ ? CH.red : msColor(avgMs) },
          {
            l: 'Wins',
            v: fmtNum(num(row.race_wins)),
            c: num(row.race_wins) > 0 ? CH.gold : CH.ghost,
          },
          {
            l: 'Fails',
            v: fmtNum(num(row.failures)),
            c: num(row.failures) > 0 ? CH.red : CH.ghost,
          },
        ].map((m) => (
          <div key={m.l}>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 7,
                color: CH.ghost,
                marginBottom: 1,
              }}
            >
              {m.l}
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: m.c,
                fontWeight: 700,
              }}
            >
              {m.v}
            </div>
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

const LatDist = ({ row }: { row: any }) => {
  const total = num(row.total_success) || 1;
  const segs = [
    { n: num(row.under_500ms), c: CH.green, l: '<500ms' },
    { n: num(row.under_1s) - num(row.under_500ms), c: CH.yellow, l: '<1s' },
    { n: num(row.under_2s) - num(row.under_1s), c: CH.orange, l: '<2s' },
    { n: num(row.under_4s) - num(row.under_2s), c: CH.red, l: '<4s' },
    { n: Math.max(0, total - num(row.under_4s)), c: '#7f1d1d', l: '>4s' },
  ].filter((s) => s.n > 0);
  return (
    <div style={{ display: 'flex', height: 5, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
      {segs.map((s, i) => (
        <div
          key={i}
          title={`${s.l}: ${Math.round((s.n / total) * 100)}%`}
          style={{ flex: s.n / total, background: s.c, minWidth: 2 }}
        />
      ))}
    </div>
  );
};

// ── Poster thumbnail for top-ID grid ─────────────────────────────────────────
const PosterThumb = ({
  id,
  type,
  hits,
  hitRate,
}: {
  id: string;
  type: string;
  hits: number;
  hitRate: number;
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [nodeHealth, setNodeHealth] = useState<Record<string, any>>({});
  const [healthLoading, setHealthLoading] = useState(false);

  const fetchNodeHealth = useCallback(async () => {
    setHealthLoading(true);
    const results = await Promise.allSettled(
      LIVE_HEALTH_NODES.map(async n => {
        const res = await fetch(`${n.url}/health`, { signal: AbortSignal.timeout(4000) });
        return [n.id, res.ok ? await res.json() : { error: `HTTP ${res.status}` }] as const;
      })
    );
    setNodeHealth(Object.fromEntries(
      results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : [LIVE_HEALTH_NODES[i].id, { error: 'unreachable' }]
      )
    ));
    setHealthLoading(false);
  }, []);

  // Fetch health on auth + every 30s when live mode is active
  useEffect(() => { if (authed) fetchNodeHealth(); }, [authed]);
  useEffect(() => {
    if (!live) return;
    const iv = setInterval(fetchNodeHealth, 30_000);
    return () => clearInterval(iv);
  }, [live, fetchNodeHealth]);
  const src = `${POSTER_API}/${type}/${id}.svg?source=tmdb`;
  return (
    <a
      href={`https://api.spicydevs.xyz/test/${type}/${id}.png`}
      target="_blank"
      rel="noreferrer"
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '2/3',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid var(--film-border)',
          background: '#111009',
        }}
      >
        {!loaded && !errored && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(110deg,#111009 25%,#1a1712 50%,#111009 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s linear infinite',
            }}
          />
        )}
        {errored ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontSize: 20,
            }}
          >
            🎞
          </div>
        ) : (
          <img
            src={src}
            alt={id}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 6px 4px',
            background: 'linear-gradient(to top,rgba(0,0,0,0.9),transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8,
              color: CH.gold,
              fontWeight: 700,
            }}
          >
            {fmtNum(hits)}
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 7,
              color: rateColor(hitRate),
              background: 'rgba(0,0,0,0.7)',
              padding: '1px 4px',
              borderRadius: 2,
            }}
          >
            {hitRate.toFixed(0)}% cache
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 7,
            color: type === 'movie' ? CH.blue : type === 'tv' ? CH.green : CH.purple,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 2,
            padding: '1px 4px',
            textTransform: 'uppercase' as const,
          }}
        >
          {type}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 8,
            color: CH.dim,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {id}
        </span>
      </div>
    </a>
  );
};

// ── Auth screen ───────────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (pw === CORRECT_PW) {
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
        background: 'var(--film-black)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>
      <div
        style={{
          width: 360,
          background: 'var(--film-mid)',
          border: '1px solid var(--film-border)',
          borderRadius: 12,
          overflow: 'hidden',
          animation: shake ? 'shake 0.4s ease' : 'none',
          boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
        }}
      >
        <div
          style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <AmberTag style={{ marginBottom: 8 }}>Posterium Analytics</AmberTag>
          <div
            className="poster-font"
            style={{ fontSize: 28, color: 'var(--film-cream)', letterSpacing: '0.06em' }}
          >
            Dashboard v4
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8,
              color: CH.ghost,
              marginTop: 4,
            }}
          >
            raster_metrics + request_analytics + D1
          </div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <label
            style={{
              display: 'block',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 8,
              color: CH.ghost,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              marginBottom: 6,
            }}
          >
            Admin Password
          </label>
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
              background: 'var(--film-char)',
              border: `1px solid ${err ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 7,
              color: 'var(--film-cream)',
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              outline: 'none',
              boxSizing: 'border-box' as const,
            }}
          />
          {err && (
            <div
              style={{
                marginTop: 5,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 8,
                color: CH.red,
              }}
            >
              ✕ {err}
            </div>
          )}
          <button
            onClick={submit}
            style={{
              width: '100%',
              height: 40,
              marginTop: 14,
              background: `linear-gradient(90deg,${CH.amber},${CH.gold})`,
              color: '#070706',
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
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
  const [cfg, setCfg] = useState<DashConfig>(loadCfg);
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [live, setLive] = useState(false);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [liveCount, setLiveCount] = useState(0); // ticks since live started (for indicator pulse)

  const updateCfg = (next: Partial<DashConfig>) => {
    const c = { ...cfg, ...next };
    setCfg(c);
    saveCfg(c);
  };

  const fetchData = useCallback(
    async (p?: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/analytics?period=${p ?? cfg.period}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setLastFetch(new Date());
      } catch (e: any) {
        setError(e.message ?? 'Fetch failed');
      } finally {
        setLoading(false);
      }
    },
    [cfg.period]
  );

  // Initial fetch on auth
  useEffect(() => {
    if (authed) fetchData();
  }, [authed]);

  // ── Real live mode ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    if (!live || !authed) return;
    liveIntervalRef.current = setInterval(() => {
      fetchData();
      setLiveCount((c) => c + 1);
    }, 10_000);
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [live, authed, fetchData]);

  const granularity = data?.granularity ?? 'hour';

  const mkBucket = useCallback((s: string) => fmtBucket(s, granularity), [granularity]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const nodeRows = useMemo(
    () =>
      (data?.data?.node_performance?.data ?? []).map((r: any) => ({
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

  const globalRow = useMemo(() => {
    const raw = data?.data?.global_summary?.data?.[0];
    if (raw && num(raw.total_attempts) > 0)
      return {
        total_attempts: num(raw.total_attempts),
        successes: num(raw.successes),
        failures: num(raw.failures),
        race_wins: num(raw.race_wins),
        success_rate_pct: num(raw.success_rate_pct),
        avg_ms: nullableNum(raw.avg_ms),
      };
    const total = nodeRows.reduce((s, r) => s + r.total_attempts, 0);
    const succ = nodeRows.reduce((s, r) => s + r.successes, 0);
    return {
      total_attempts: total,
      successes: succ,
      failures: nodeRows.reduce((s, r) => s + r.failures, 0),
      race_wins: nodeRows.reduce((s, r) => s + r.race_wins, 0),
      success_rate_pct: total > 0 ? (succ / total) * 100 : 0,
      avg_ms: null,
    };
  }, [data, nodeRows]);

  const trafficData = useMemo(
    () =>
      (data?.data?.traffic_timeseries?.data ?? []).map((r: any) => ({
        bucket: mkBucket(r.bucket ?? ''),
        attempts: num(r.attempts),
        successes: num(r.successes),
        failures: num(r.failures),
        avg_ms: num(r.avg_ms),
      })),
    [data, mkBucket]
  );

  const latencyRows = useMemo(
    () =>
      (data?.data?.latency_percentiles?.data ?? []).map((r: any) => ({
        node: String(r.node ?? ''),
        total_success: num(r.total_success),
        avg_ms: nullableNum(r.avg_ms),
        under_500ms: num(r.under_500ms),
        under_1s: num(r.under_1s),
        under_2s: num(r.under_2s),
        under_4s: num(r.under_4s),
      })),
    [data]
  );

  const svgSummary = useMemo(() => (data?.data?.svg_summary?.data ?? [])[0] ?? null, [data]);

const svgTimeseries = useMemo(
  () => (data?.data?.svg_timeseries?.data ?? []).map((r: any) => ({
    bucket: mkBucket(r.bucket ?? ''),
    requests: num(r.requests),
    hits: num(r.hits),
    misses: num(r.misses),
  })),
  [data, mkBucket]
);

const svgPresetRows = useMemo(
  () => (data?.data?.svg_preset_breakdown?.data ?? []).map((r: any) => ({
    preset: String(r.preset ?? ''),
    requests: num(r.requests),
    cache_hits: num(r.cache_hits),
  })),
  [data]
);

const svgTopIds = useMemo(
  () => (data?.data?.svg_top_ids?.data ?? []).map((r: any) => ({
    id: String(r.id ?? ''),
    type: String(r.type ?? 'movie'),
    hits: num(r.hits),
    hit_rate_pct: num(r.hit_rate_pct),
  })),
  [data]
);

const svgRatingCombos = useMemo(
  () => (data?.data?.svg_ratings_combos?.data ?? []).map((r: any) => ({
    r_param: String(r.r_param ?? ''),
    requests: num(r.requests),
  })),
  [data]
);

const svgVsRaster = useMemo(
  () => (data?.data?.svg_vs_raster?.data ?? []).map((r: any) => ({
    category: String(r.category ?? ''),
    requests: num(r.requests),
    cache_hits: num(r.cache_hits),
  })),
  [data]
);

  const failRows = useMemo(
    () =>
      (data?.data?.recent_failures?.data ?? []).map((r: any) => ({
        node: String(r.node ?? ''),
        error: String(r.error ?? ''),
        status_code: num(r.status_code),
        timestamp: String(r.timestamp ?? ''),
      })),
    [data]
  );

  const fallbackTierRows = useMemo(
    () =>
      (data?.data?.fallback_tiers?.data ?? [])
        .filter((r: any) => r.lane && r.lane !== 'wall')
        .map((r: any) => ({
          lane: String(r.lane),
          attempts: num(r.attempts),
          successes: num(r.successes),
          success_rate_pct: num(r.success_rate_pct),
          avg_ms: nullableNum(r.avg_ms),
          wins: num(r.wins),
          win_rate_pct: num(r.win_rate_pct),
        })),
    [data]
  );

  const fallbackTimeseries = useMemo(
    () =>
      (data?.data?.fallback_timeseries?.data ?? []).map((r: any) => ({
        bucket: mkBucket(r.bucket ?? ''),
        primary_hits: num(r.primary_hits),
        t1_fallbacks: num(r.t1_fallbacks),
        t2_fallbacks: num(r.t2_fallbacks),
        t3_fallbacks: num(r.t3_fallbacks),
      })),
    [data, mkBucket]
  );

  const wallStats = useMemo(() => (data?.data?.wall_time_stats?.data ?? [])[0] ?? null, [data]);
  const wallTimeseries = useMemo(
    () =>
      (data?.data?.wall_time_timeseries?.data ?? []).map((r: any) => ({
        bucket: mkBucket(r.bucket ?? ''),
        requests: num(r.requests),
        avg_wall_ms: num(r.avg_wall_ms),
      })),
    [data, mkBucket]
  );

  const winRows = useMemo(
    () =>
      (data?.data?.win_rate?.data ?? []).map((r: any) => ({
        node: String(r.node ?? ''),
        wins: num(r.wins),
        successes: num(r.successes),
        win_rate_pct: num(r.win_rate_pct),
      })),
    [data]
  );

  const formatRows = useMemo(
    () =>
      (data?.data?.format_breakdown?.data ?? []).map((r: any) => ({
        format: String(r.format ?? '?'),
        attempts: num(r.attempts),
        successes: num(r.successes),
        avg_ms: nullableNum(r.avg_ms),
      })),
    [data]
  );

  const coloRows = useMemo(
    () =>
      (data?.data?.colo_breakdown?.data ?? []).map((r: any) => ({
        colo: String(r.colo ?? ''),
        attempts: num(r.attempts),
        successes: num(r.successes),
        avg_ms: nullableNum(r.avg_ms),
      })),
    [data]
  );

  // ── Request analytics data ─────────────────────────────────────────────────
  const reqSummary = useMemo(() => (data?.data?.req_summary?.data ?? [])[0] ?? null, [data]);

  const topIds = useMemo(
    () =>
      (data?.data?.req_top_ids?.data ?? []).map((r: any) => ({
        id: String(r.id ?? ''),
        type: String(r.type ?? 'movie'),
        hits: num(r.hits),
        hit_rate_pct: num(r.hit_rate_pct),
      })),
    [data]
  );

  const deviceRows = useMemo(
    () =>
      (data?.data?.req_device_breakdown?.data ?? []).map((r: any) => ({
        device: String(r.device ?? ''),
        requests: num(r.requests),
        cache_hits: num(r.cache_hits),
      })),
    [data]
  );

  const countryRows = useMemo(
    () =>
      (data?.data?.req_country_breakdown?.data ?? []).map((r: any) => ({
        country: String(r.country ?? ''),
        requests: num(r.requests),
        cache_hits: num(r.cache_hits),
      })),
    [data]
  );

  const reqTimeseries = useMemo(
    () =>
      (data?.data?.req_timeseries?.data ?? []).map((r: any) => ({
        bucket: mkBucket(r.bucket ?? ''),
        requests: num(r.requests),
        hits: num(r.hits),
        misses: num(r.misses),
      })),
    [data, mkBucket]
  );

  const cacheTimeseries = useMemo(
    () =>
      (data?.data?.req_cache_timeseries?.data ?? []).map((r: any) => ({
        bucket: mkBucket(r.bucket ?? ''),
        total: num(r.total),
        hits: num(r.hits),
        hit_rate_pct: num(r.hit_rate_pct),
      })),
    [data, mkBucket]
  );

  const reqFormatRows = useMemo(
    () =>
      (data?.data?.req_format_breakdown?.data ?? []).map((r: any) => ({
        format: String(r.format ?? ''),
        requests: num(r.requests),
      })),
    [data]
  );

  const reqTypeRows = useMemo(
    () =>
      (data?.data?.req_type_breakdown?.data ?? []).map((r: any) => ({
        type: String(r.type ?? ''),
        requests: num(r.requests),
      })),
    [data]
  );

  const topRatings = useMemo(
    () =>
      (data?.data?.req_top_ratings?.data ?? []).map((r: any) => ({
        r_param: String(r.r_param ?? ''),
        requests: num(r.requests),
      })),
    [data]
  );

  const dbStats = useMemo(() => data?.db_stats ?? null, [data]);

  const alertNodes = useMemo(
    () =>
      nodeRows.filter(
        (r) =>
          r.total_attempts > 0 &&
          (r.success_rate_pct < cfg.alertRate || (r.avg_ms !== null && r.avg_ms > cfg.alertMs))
      ),
    [nodeRows, cfg]
  );

  const pLabel = PERIODS[cfg.period]?.label ?? cfg.period;

  const totalDeviceReqs = useMemo(
    () => deviceRows.reduce((s, r) => s + r.requests, 0),
    [deviceRows]
  );

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--film-black)',
        color: 'var(--film-cream)',
        paddingTop: 56,
      }}
    >
      <style>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes live-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.5)}}
        .recharts-text{font-family:'JetBrains Mono',monospace!important;font-size:9px!important;fill:rgba(180,168,148,0.65)!important}
        .recharts-legend-item-text{font-size:9px!important;font-family:'JetBrains Mono',monospace!important}
      `}</style>

      <MainNavbar fixed={true} compactLogo />

      {/* ── Sticky controls ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 40,
          background: 'rgba(7,7,6,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--film-border)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          minHeight: 48,
        }}
      >
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: loading ? CH.yellow : error ? CH.red : live ? CH.green : CH.ghost,
              boxShadow: live ? `0 0 8px ${CH.green}` : 'none',
              animation: live
                ? 'live-pulse 1.5s ease-in-out infinite'
                : loading
                  ? 'pulse-dot 1s ease-in-out infinite'
                  : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 7,
              color: CH.ghost,
              letterSpacing: '0.12em',
            }}
          >
            {loading
              ? 'LOADING'
              : error
                ? 'ERROR'
                : live
                  ? `LIVE · ${liveCount > 0 ? `${liveCount} polls` : '10s'}`
                  : 'IDLE'}
          </span>
          {alertNodes.length > 0 && (
            <span
              style={{
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: CH.red,
                fontSize: 7,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 3,
                letterSpacing: '0.08em',
              }}
            >
              ⚠ {alertNodes.length}
            </span>
          )}
        </div>

        {/* Live toggle */}
        <button
          onClick={() => setLive((v) => !v)}
          style={{
            background: live ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${live ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.07)'}`,
            color: live ? CH.green : CH.ghost,
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: 'Syne, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          {live ? '⬤ LIVE (10s)' : '○ LIVE'}
        </button>

        {/* Period selector */}
        <div
          style={{
            display: 'flex',
            gap: 1,
            padding: 3,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 7,
          }}
        >
          {Object.entries(PERIODS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => {
                updateCfg({ period: k });
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
                textTransform: 'uppercase' as const,
                background: cfg.period === k ? 'rgba(196,124,46,0.18)' : 'transparent',
                color: cfg.period === k ? CH.amber : CH.ghost,
              }}
            >
              {v.short}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchData()}
          disabled={loading}
          style={{
            height: 28,
            padding: '0 12px',
            background: loading ? 'rgba(196,124,46,0.3)' : CH.amber,
            color: '#070706',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : '↻'}
        </button>

        <button
          onClick={() => {
            try {
              localStorage.removeItem(AUTH_KEY);
            } catch {}
            setAuthed(false);
            setData(null);
          }}
          style={{
            height: 28,
            padding: '0 10px',
            background: 'transparent',
            color: CH.ghost,
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 9,
            fontFamily: 'Syne, sans-serif',
            textTransform: 'uppercase' as const,
            marginLeft: 'auto',
          }}
        >
          Logout
        </button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <nav
        style={{
          background: 'var(--film-dark)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0 16px',
          display: 'flex',
          overflowX: 'auto',
          gap: 0,
          scrollbarWidth: 'none' as const,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '11px 14px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: tab === t ? CH.amber : CH.ghost,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'Syne, sans-serif',
              borderBottom: tab === t ? `2px solid ${CH.amber}` : '2px solid transparent',
              marginBottom: -1,
              whiteSpace: 'nowrap' as const,
              textTransform: 'capitalize' as const,
            }}
          >
            {t === 'wall-time'
              ? 'Wall Time'
              : t === 'fallbacks'
                ? 'Fallbacks'
                : t === 'requests'
                  ? '★ Requests'
                  : t === 'devices'
                    ? '★ Devices'
                    : t === 'db'
                      ? '★ DB Stats'
                      : t}
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
            color: CH.red,
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          ✕ {error}
        </div>
      )}

      <main id="main-content" style={{ padding: 16, maxWidth: 1400, margin: '0 auto' }}>
        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <span
                  style={{
                    color: CH.red,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 7,
                    fontWeight: 700,
                  }}
                >
                  ⚠ ALERTS
                </span>
                {alertNodes.map((n) => (
                  <span
                    key={n.node}
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 7,
                      color: 'var(--film-cream)',
                      background: 'rgba(248,113,113,0.1)',
                      padding: '2px 8px',
                      borderRadius: 3,
                    }}
                  >
                    {nodeLabel(n.node).split(' ·')[0]} —{' '}
                    {n.success_rate_pct < cfg.alertRate
                      ? `rate ${n.success_rate_pct.toFixed(0)}%`
                      : ''}
                    {n.avg_ms && n.avg_ms > cfg.alertMs ? ` ${fmtMs(n.avg_ms)}` : ''}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
                gap: 10,
              }}
            >
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => <Skel key={i} h={90} />)
              ) : (
                <>
                  <StatCard
                    label="Raster Attempts"
                    value={fmtNum(globalRow.total_attempts)}
                    sub={pLabel}
                  />
                  <StatCard
                    label="Race Wins"
                    value={fmtNum(globalRow.race_wins)}
                    sub="Posters served"
                    color={CH.gold}
                  />
                  <StatCard
                    label="Success Rate"
                    value={fmtPct(globalRow.success_rate_pct)}
                    sub="of raster attempts"
                    color={rateColor(globalRow.success_rate_pct)}
                  />
                  <StatCard
                    label="Failures"
                    value={fmtNum(globalRow.failures)}
                    sub="rasterizer"
                    color={globalRow.failures > 50 ? CH.red : 'var(--film-cream)'}
                    alert={globalRow.failures > 50}
                  />
                  <StatCard
                    label="User Requests"
                    value={fmtNum(num(reqSummary?.total_requests))}
                    sub={pLabel}
                    color={CH.teal}
                  />
                  <StatCard
                    label="Cache Hit Rate"
                    value={reqSummary ? fmtPct(num(reqSummary.hit_rate_pct)) : '—'}
                    sub="Edge cache"
                    color={rateColor(num(reqSummary?.hit_rate_pct))}
                  />
                </>
              )}
            </div>
            <Card title="Rasterizer Traffic" tag={pLabel}>
              {loading ? (
                <Skel h={200} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={trafficData}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CH.amber} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CH.amber} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<FilmTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono,monospace',
                        paddingTop: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="attempts"
                      name="Raster Attempts"
                      stroke={CH.amber}
                      fill="url(#gA)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="failures"
                      name="Failures"
                      stroke={CH.red}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
                gap: 10,
              }}
            >
              {loading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => <Skel key={i} h={120} />)
                : nodeRows.map((row) => (
                    <NodeCard
                      key={row.node}
                      row={row}
                      latRow={latencyRows.find((r) => r.node === row.node)}
                      alertRate={cfg.alertRate}
                      alertMs={cfg.alertMs}
                    />
                  ))}
            </div>
          </div>
        )}
        
        {/* ══ NODES ══════════════════════════════════════════════════════════ */}
        {tab === 'nodes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Node Performance" tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', padding: 14 }}>
                {loading ? (
                  <Skel h={300} />
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {[
                          'Node',
                          'Health',
                          'Attempts',
                          'Success Rate',
                          'Avg Latency',
                          'Wins',
                          'Score',
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '7px 12px',
                              textAlign: h === 'Node' || h === 'Health' ? 'left' : 'right',
                              fontFamily: 'JetBrains Mono,monospace',
                              fontSize: 7,
                              color: CH.ghost,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase' as const,
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodeRows.map((row, i) => {
                        const pct = row.success_rate_pct;
                        const health =
                          pct >= cfg.alertRate ? 'healthy' : pct >= 10 ? 'degraded' : 'down';
                        const hc =
                          health === 'healthy'
                            ? CH.green
                            : health === 'degraded'
                              ? CH.yellow
                              : CH.red;
                        const score = healthScore(pct, row.avg_ms);
                        return (
                          <tr
                            key={row.node}
                            style={{
                              background: i % 2 === 0 ? 'rgba(255,255,255,0.012)' : 'transparent',
                              borderBottom: '1px solid rgba(255,255,255,0.03)',
                            }}
                          >
                            <td style={{ padding: '9px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: nodeColor(row.node),
                                  }}
                                />
                                <span
                                  style={{
                                    fontFamily: 'JetBrains Mono,monospace',
                                    fontSize: 10,
                                    color: 'var(--film-cream)',
                                    fontWeight: 600,
                                  }}
                                >
                                  {nodeLabel(row.node)}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 7,
                                  color: hc,
                                  textTransform: 'uppercase' as const,
                                  background: `${hc}18`,
                                  padding: '2px 6px',
                                  borderRadius: 3,
                                }}
                              >
                                {health}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '9px 12px',
                                textAlign: 'right',
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 11,
                                color: 'var(--film-cream)',
                              }}
                            >
                              {fmtNum(row.total_attempts)}
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                              <Gauge value={pct} size={36} />
                            </td>
                            <td
                              style={{
                                padding: '9px 12px',
                                textAlign: 'right',
                                color: msColor(row.avg_ms),
                                fontFamily: 'JetBrains Mono,monospace',
                                fontWeight: 700,
                              }}
                            >
                              {fmtMs(row.avg_ms)}
                            </td>
                            <td
                              style={{
                                padding: '9px 12px',
                                textAlign: 'right',
                                color: row.race_wins > 0 ? CH.gold : CH.ghost,
                                fontFamily: 'JetBrains Mono,monospace',
                                fontWeight: 700,
                              }}
                            >
                              {row.race_wins > 0 ? `⚡${fmtNum(row.race_wins)}` : '—'}
                            </td>
                            <td
                              style={{
                                padding: '9px 12px',
                                textAlign: 'right',
                                fontFamily: 'JetBrains Mono,monospace',
                                fontWeight: 700,
                                color: score >= 80 ? CH.green : score >= 60 ? CH.yellow : CH.red,
                              }}
                            >
                              {score}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
            {/* Live Node Health — add after the existing NodePerformance Card */}
        <Card title="Live Node Health" tag={healthLoading ? 'refreshing…' : `${Object.keys(nodeHealth).length} nodes · 30s`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {LIVE_HEALTH_NODES.map(n => {
              const h = nodeHealth[n.id];
              if (!h) return (
                <div key={n.id} style={{ padding: '12px 14px', background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8, opacity: 0.4 }}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: CH.ghost }}>{n.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: CH.ghost, marginTop: 4 }}>not yet fetched</div>
                </div>
              );
              const isErr = !!h.error;
              const statusC = isErr ? CH.red : h.status === 'ok' ? CH.green : CH.yellow;
              return (
                <div key={n.id} style={{
                  padding: '12px 14px', background: 'var(--film-char)',
                  border: `1px solid ${isErr ? 'rgba(248,113,113,0.2)' : 'var(--film-border)'}`,
                  borderLeft: `3px solid ${statusC}`, borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700, color: 'var(--film-cream)' }}>{n.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: statusC, textTransform: 'uppercase' as const }}>
                      {isErr ? 'down' : h.status}
                    </span>
                  </div>
                  {isErr ? (
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 8, color: CH.red }}>{h.error}</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                      {[
                        { l: 'Active', v: h.activeJobs ?? '—', c: num(h.activeJobs) > 0 ? CH.yellow : CH.ghost },
                        { l: 'Queue',  v: h.queuedJobs ?? '—', c: num(h.queuedJobs) > 0 ? CH.orange : CH.ghost },
                        { l: 'Workers',v: h.workerCount ?? '—', c: CH.blue },
                        { l: 'Uptime', v: h.uptime ? `${Math.floor(h.uptime / 3600)}h` : '—', c: CH.teal },
                        { l: 'Icons',  v: h.iconCache?.loaded ? `✓${h.iconCache.iconCount}` : '✗', c: h.iconCache?.loaded ? CH.green : CH.red },
                        { l: 'Font',   v: h.fontDefault ? 'loaded' : '—', c: h.fontDefault ? CH.green : CH.ghost },
                      ].map(({ l, v, c }) => (
                        <div key={l}>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost, marginBottom: 1 }}>{l}</div>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: c, fontWeight: 700 }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost }}>
            Spaceify (HTTP) nodes excluded — browser cannot reach HTTP from HTTPS. Check analytics for their raster metrics.
          </div>
        </Card>
          </div>
        )}

        {/* ══ TRAFFIC ════════════════════════════════════════════════════════ */}
        {tab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title="Rasterizer Attempts Over Time" tag={pLabel}>
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
                        <stop offset="5%" stopColor={CH.amber} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CH.amber} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<FilmTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono,monospace',
                        paddingTop: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="attempts"
                      name="Attempts"
                      stroke={CH.amber}
                      fill="url(#gA2)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="successes"
                      name="Successes"
                      stroke={CH.green}
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="failures"
                      name="Failures"
                      stroke={CH.red}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card title="User Requests Over Time" tag={pLabel}>
              {loading ? (
                <Skel h={200} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={reqTimeseries}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CH.teal} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CH.teal} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<FilmTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono,monospace',
                        paddingTop: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="Total"
                      stroke={CH.teal}
                      fill="url(#gReq)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="hits"
                      name="Cache Hits"
                      stroke={CH.green}
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="misses"
                      name="Cache Misses"
                      stroke={CH.orange}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ══ FALLBACKS ══════════════════════════════════════════════════════ */}
        {tab === 'fallbacks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
                gap: 10,
              }}
            >
              {loading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => <Skel key={i} h={90} />)
                : (() => {
                    const primary = fallbackTierRows.filter(
                      (r) => r.lane === 'geo' || r.lane === 'binding'
                    );
                    const t1fb = fallbackTierRows.filter(
                      (r) => r.lane === 'geo-fallback' || r.lane === 'wsrv-fallback'
                    );
                    const t2fb = fallbackTierRows.filter((r) => r.lane === 'geo-t2');
                    const t3fb = fallbackTierRows.filter(
                      (r) => r.lane === 'geo-t3' || r.lane === 'wsrv-t3'
                    );
                    const total = fallbackTierRows.reduce((s, r) => s + r.attempts, 0);
                    const pct = (n: number) =>
                      total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';
                    const pN = primary.reduce((s, r) => s + r.attempts, 0);
                    const t1N = t1fb.reduce((s, r) => s + r.attempts, 0);
                    const t2N = t2fb.reduce((s, r) => s + r.attempts, 0);
                    const t3N = t3fb.reduce((s, r) => s + r.attempts, 0);
                    return (
                      <>
                        <StatCard
                          label="Primary (T1)"
                          value={fmtNum(pN)}
                          sub={`${pct(pN)}`}
                          color={CH.green}
                        />
                        <StatCard
                          label="T1 Fallback"
                          value={fmtNum(t1N)}
                          sub={pct(t1N)}
                          color={t1N > pN * 0.1 ? CH.yellow : CH.dim}
                        />
                        <StatCard
                          label="T2 Fallback"
                          value={fmtNum(t2N)}
                          sub={pct(t2N)}
                          color={t2N > 0 ? CH.orange : CH.dim}
                          alert={t2N > pN * 0.05}
                        />
                        <StatCard
                          label="T3 Fallback"
                          value={fmtNum(t3N)}
                          sub={pct(t3N)}
                          color={t3N > 0 ? CH.red : CH.dim}
                          alert={t3N > 0}
                        />
                      </>
                    );
                  })()}
            </div>
            <Card title="Lane Breakdown" tag={pLabel}>
              {loading ? (
                <Skel h={200} />
              ) : fallbackTierRows.length === 0 ? (
                <div
                  style={{
                    color: CH.ghost,
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 11,
                    textAlign: 'center',
                    padding: 24,
                  }}
                >
                  No fallback data yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fallbackTierRows.map((row) => {
                    const meta = LANE_META[row.lane] ?? { label: row.lane, color: CH.ghost };
                    const total = fallbackTierRows.reduce((s, r) => s + r.attempts, 0) || 1;
                    return (
                      <div
                        key={row.lane}
                        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: meta.color,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                            }}
                          >
                            <span
                              className="syne-font"
                              style={{ fontSize: 11, fontWeight: 700, color: 'var(--film-cream)' }}
                            >
                              {meta.label}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                              {row.avg_ms && (
                                <span
                                  style={{
                                    fontFamily: 'JetBrains Mono,monospace',
                                    fontSize: 8,
                                    color: msColor(row.avg_ms),
                                  }}
                                >
                                  {fmtMs(row.avg_ms)}
                                </span>
                              )}
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: rateColor(row.success_rate_pct),
                                }}
                              >
                                {row.success_rate_pct.toFixed(0)}% ok
                              </span>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: CH.ghost,
                                }}
                              >
                                {fmtNum(row.attempts)}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 5,
                              borderRadius: 2,
                              background: 'rgba(255,255,255,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                background: meta.color,
                                opacity: 0.7,
                                width: `${(row.attempts / total) * 100}%`,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <Card title="Fallback Escalation Over Time" tag={pLabel}>
              {loading ? (
                <Skel h={200} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={fallbackTimeseries}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <Tooltip content={<FilmTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono,monospace',
                        paddingTop: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="primary_hits"
                      name="Primary"
                      stroke={CH.green}
                      fill="rgba(74,222,128,0.1)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="t1_fallbacks"
                      name="T1 Fallback"
                      stroke={CH.yellow}
                      fill="rgba(250,204,21,0.08)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="t2_fallbacks"
                      name="T2 Fallback"
                      stroke={CH.orange}
                      fill="rgba(251,146,60,0.1)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="t3_fallbacks"
                      name="T3 Fallback"
                      stroke={CH.red}
                      fill="rgba(248,113,113,0.1)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        )}

        {/* ══ REQUESTS (NEW) ═════════════════════════════════════════════════ */}
        {tab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '6px 0' }}>
              <AmberTag>User Request Analytics</AmberTag>
              <p
                className="body-font"
                style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8 }}
              >
                Poster API calls from end users — cache performance, top content, rating badge
                usage, format split.
              </p>
            </div>

            {/* Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
                gap: 10,
              }}
            >
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => <Skel key={i} h={90} />)
              ) : (
                <>
                  <StatCard
                    label="Total Requests"
                    value={fmtNum(num(reqSummary?.total_requests))}
                    sub={pLabel}
                    color={CH.teal}
                  />
                  <StatCard
                    label="Cache Hits"
                    value={fmtNum(num(reqSummary?.cache_hits))}
                    sub="Edge cache"
                    color={CH.green}
                  />
                  <StatCard
                    label="Hit Rate"
                    value={reqSummary ? fmtPct(num(reqSummary.hit_rate_pct)) : '—'}
                    sub="Cache efficiency"
                    color={rateColor(num(reqSummary?.hit_rate_pct))}
                  />
                  <StatCard
                    label="Movies"
                    value={fmtNum(num(reqSummary?.movie_requests))}
                    sub="of requests"
                    color={CH.blue}
                  />
                  <StatCard
                    label="TV Shows"
                    value={fmtNum(num(reqSummary?.tv_requests))}
                    sub="of requests"
                    color={CH.green}
                  />
                  <StatCard
                    label="Anime"
                    value={fmtNum(num(reqSummary?.anime_requests))}
                    sub="of requests"
                    color={CH.purple}
                  />
                </>
              )}
            </div>

            {/* Cache hit rate over time */}
            <Card title="Cache Performance Over Time" tag={pLabel}>
              {loading ? (
                <Skel h={200} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={cacheTimeseries}
                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: CH.ghost, fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                      width={42}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<FilmTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono,monospace',
                        paddingTop: 8,
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="total"
                      name="Total Requests"
                      fill="rgba(196,124,46,0.2)"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="hits"
                      name="Cache Hits"
                      fill="rgba(74,222,128,0.35)"
                      radius={[2, 2, 0, 0]}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="hit_rate_pct"
                      name="Hit Rate %"
                      stroke={CH.green}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Top requested poster IDs */}
            <Card title="Top Requested Posters" tag={`top ${topIds.length}`}>
              {loading ? (
                <Skel h={320} />
              ) : topIds.length === 0 ? (
                <div
                  style={{
                    color: CH.ghost,
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: 11,
                    textAlign: 'center',
                    padding: 24,
                  }}
                >
                  No poster request data yet. Check your REQUEST_ANALYTICS dataset.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))',
                    gap: 12,
                  }}
                >
                  {topIds.map((row) => (
                    <PosterThumb
                      key={`${row.type}-${row.id}`}
                      id={row.id}
                      type={row.type}
                      hits={row.hits}
                      hitRate={row.hit_rate_pct}
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* Rating combos + format split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card title="Top Rating Combos (?r=)">
                {loading ? (
                  <Skel h={200} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topRatings.slice(0, 10).map((r, i) => {
                      const max = topRatings[0]?.requests || 1;
                      return (
                        <div key={r.r_param}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 3,
                            }}
                          >
                            <code
                              style={{
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 9,
                                color: CH.amber,
                                background: 'rgba(196,124,46,0.08)',
                                border: '1px solid rgba(196,124,46,0.14)',
                                borderRadius: 3,
                                padding: '1px 5px',
                              }}
                            >
                              {r.r_param}
                            </code>
                            <span
                              style={{
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 8,
                                color: CH.gold,
                                fontWeight: 700,
                              }}
                            >
                              {fmtNum(r.requests)}
                            </span>
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
                                background: PIE_COLORS[i % PIE_COLORS.length],
                                width: `${(r.requests / max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {topRatings.length === 0 && (
                      <div
                        style={{
                          color: CH.ghost,
                          fontFamily: 'JetBrains Mono,monospace',
                          fontSize: 11,
                        }}
                      >
                        No data
                      </div>
                    )}
                  </div>
                )}
              </Card>
              <Card title="Format Distribution">
                {loading ? (
                  <Skel h={200} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {reqFormatRows.map((r, i) => {
                      const total = reqFormatRows.reduce((s, x) => s + x.requests, 0) || 1;
                      return (
                        <div key={r.format}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 3,
                            }}
                          >
                            <span
                              className="syne-font"
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: CH.amber,
                                letterSpacing: '0.08em',
                              }}
                            >
                              {r.format.toUpperCase()}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: CH.ghost,
                                }}
                              >
                                {fmtNum(r.requests)}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: CH.dim,
                                }}
                              >
                                {fmtPct((r.requests / total) * 100)}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 5,
                              borderRadius: 2,
                              background: 'rgba(255,255,255,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                background: PIE_COLORS[i % PIE_COLORS.length],
                                width: `${(r.requests / total) * 100}%`,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {reqFormatRows.length === 0 && (
                      <div
                        style={{
                          color: CH.ghost,
                          fontFamily: 'JetBrains Mono,monospace',
                          fontSize: 11,
                        }}
                      >
                        No data
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Top countries */}
            <Card title="Top Countries" tag={`top ${countryRows.length}`}>
              {loading ? (
                <Skel h={200} />
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                    gap: 6,
                  }}
                >
                  {countryRows.slice(0, 20).map((r, i) => {
                    const max = countryRows[0]?.requests || 1;
                    const hitPct = r.requests > 0 ? (r.cache_hits / r.requests) * 100 : 0;
                    return (
                      <div
                        key={r.country}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono,monospace',
                            fontSize: 10,
                            color: 'var(--film-cream)',
                            fontWeight: 700,
                            minWidth: 28,
                          }}
                        >
                          {r.country}
                        </span>
                        <div style={{ flex: 1 }}>
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
                                background: PIE_COLORS[i % PIE_COLORS.length],
                                width: `${(r.requests / max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono,monospace',
                            fontSize: 8,
                            color: CH.ghost,
                            minWidth: 36,
                            textAlign: 'right',
                          }}
                        >
                          {fmtNum(r.requests)}
                        </span>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono,monospace',
                            fontSize: 7,
                            color: rateColor(hitPct),
                            minWidth: 30,
                            textAlign: 'right',
                          }}
                        >
                          {hitPct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                  {countryRows.length === 0 && (
                    <div
                      style={{
                        color: CH.ghost,
                        fontFamily: 'JetBrains Mono,monospace',
                        fontSize: 11,
                        gridColumn: '1/-1',
                        textAlign: 'center',
                        padding: 16,
                      }}
                    >
                      No country data
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ══ DEVICES (NEW) ══════════════════════════════════════════════════ */}
        {tab === 'devices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '6px 0' }}>
              <AmberTag>Device Analytics</AmberTag>
              <p
                className="body-font"
                style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8 }}
              >
                Device type breakdown inferred from User-Agent headers. Smart TV, mobile, tablet,
                and desktop classification.
              </p>
            </div>

            {/* Device stat cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
                gap: 10,
              }}
            >
              {loading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => <Skel key={i} h={90} />)
                : ['desktop', 'mobile', 'tablet', 'tv'].map((dev) => {
                    const row = deviceRows.find((r) => r.device === dev);
                    const meta = DEVICE_META[dev];
                    const reqs = row?.requests ?? 0;
                    const pct = totalDeviceReqs > 0 ? (reqs / totalDeviceReqs) * 100 : 0;
                    return (
                      <StatCard
                        key={dev}
                        label={`${meta.icon} ${meta.label}`}
                        value={fmtNum(reqs)}
                        sub={`${fmtPct(pct)} of traffic`}
                        color={meta.color}
                      />
                    );
                  })}
            </div>

            {/* Donut chart + bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Card title="Device Distribution">
                {loading ? (
                  <Skel h={260} />
                ) : deviceRows.length === 0 ? (
                  <div
                    style={{
                      color: CH.ghost,
                      fontFamily: 'JetBrains Mono,monospace',
                      fontSize: 11,
                      textAlign: 'center',
                      padding: 24,
                    }}
                  >
                    No device data yet. Deploy worker.js v3 to enable detection.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={deviceRows}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="requests"
                          nameKey="device"
                          paddingAngle={2}
                        >
                          {deviceRows.map((r, i) => (
                            <Cell
                              key={r.device}
                              fill={
                                DEVICE_META[r.device]?.color ?? PIE_COLORS[i % PIE_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, n: any) => [fmtNum(v), n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {deviceRows
                        .sort((a, b) => b.requests - a.requests)
                        .map((r) => {
                          const meta = DEVICE_META[r.device] ?? {
                            label: r.device,
                            icon: '?',
                            color: CH.ghost,
                          };
                          const pct =
                            totalDeviceReqs > 0 ? (r.requests / totalDeviceReqs) * 100 : 0;
                          const hitPct = r.requests > 0 ? (r.cache_hits / r.requests) * 100 : 0;
                          return (
                            <div
                              key={r.device}
                              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                              <span style={{ fontSize: 14 }}>{meta.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 2,
                                  }}
                                >
                                  <span
                                    className="syne-font"
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: 'var(--film-cream)',
                                    }}
                                  >
                                    {meta.label}
                                  </span>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <span
                                      style={{
                                        fontFamily: 'JetBrains Mono,monospace',
                                        fontSize: 8,
                                        color: meta.color,
                                        fontWeight: 700,
                                      }}
                                    >
                                      {fmtPct(pct)}
                                    </span>
                                    <span
                                      style={{
                                        fontFamily: 'JetBrains Mono,monospace',
                                        fontSize: 8,
                                        color: rateColor(hitPct),
                                      }}
                                    >
                                      {hitPct.toFixed(0)}% cache
                                    </span>
                                  </div>
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
                                      background: meta.color,
                                      width: `${pct}%`,
                                      borderRadius: 2,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </Card>
              <Card title="Media Type by Requests">
                {loading ? (
                  <Skel h={260} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={reqTypeRows}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="requests"
                          nameKey="type"
                          paddingAngle={2}
                        >
                          {reqTypeRows.map((r, i) => (
                            <Cell key={r.type} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, n: any) => [fmtNum(v), n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {reqTypeRows.map((r, i) => {
                        const total = reqTypeRows.reduce((s, x) => s + x.requests, 0) || 1;
                        return (
                          <div
                            key={r.type}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: PIE_COLORS[i % PIE_COLORS.length],
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginBottom: 2,
                                }}
                              >
                                <span
                                  className="syne-font"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'var(--film-cream)',
                                    textTransform: 'capitalize' as const,
                                  }}
                                >
                                  {r.type}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'JetBrains Mono,monospace',
                                    fontSize: 8,
                                    color: PIE_COLORS[i % PIE_COLORS.length],
                                    fontWeight: 700,
                                  }}
                                >
                                  {fmtPct((r.requests / total) * 100)}
                                </span>
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
                                    background: PIE_COLORS[i % PIE_COLORS.length],
                                    width: `${(r.requests / total) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {reqTypeRows.length === 0 && (
                        <div
                          style={{
                            color: CH.ghost,
                            fontFamily: 'JetBrains Mono,monospace',
                            fontSize: 11,
                          }}
                        >
                          No data
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ══ DB STATS (NEW) ═════════════════════════════════════════════════ */}
        {tab === 'db' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '6px 0' }}>
              <AmberTag>Database Statistics</AmberTag>
              <p
                className="body-font"
                style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8 }}
              >
                Live D1 database metrics — cached entries, unique IDs, media type distribution, and
                cache freshness. Queried directly from D1 on each analytics request; no counters
                written.
              </p>
            </div>

            {dbStats?.error ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 8,
                  background: 'rgba(248,113,113,0.07)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  color: CH.red,
                  fontFamily: 'JetBrains Mono,monospace',
                  fontSize: 11,
                }}
              >
                D1 query error: {dbStats.error}
              </div>
            ) : !dbStats ? (
              <div
                style={{
                  padding: 24,
                  borderRadius: 8,
                  background: 'var(--film-char)',
                  border: '1px solid var(--film-border)',
                  color: CH.ghost,
                  fontFamily: 'JetBrains Mono,monospace',
                  fontSize: 11,
                  textAlign: 'center',
                }}
              >
                {loading ? 'Querying D1…' : 'No DB stats — POSTER_CACHE binding may not be set.'}
              </div>
            ) : (
              <>
                {/* Totals */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
                    gap: 10,
                  }}
                >
                  <StatCard
                    label="Total Entries"
                    value={fmtNum(num(dbStats.totals?.total_entries))}
                    sub="poster_cache rows"
                    color={CH.amber}
                  />
                  <StatCard
                    label="Unique IMDb IDs"
                    value={fmtNum(num(dbStats.totals?.unique_imdb))}
                    sub="with IMDb ref"
                    color={CH.gold}
                  />
                  <StatCard
                    label="Unique TMDB IDs"
                    value={fmtNum(num(dbStats.totals?.unique_tmdb))}
                    sub="TMDB movies/TV"
                    color={CH.blue}
                  />
                  <StatCard
                    label="Unique MAL IDs"
                    value={fmtNum(num(dbStats.totals?.unique_mal))}
                    sub="anime entries"
                    color={CH.purple}
                  />
                  <StatCard
                    label="Updated 24h"
                    value={fmtNum(num(dbStats.cacheAge?.updated_24h))}
                    sub="fresh entries"
                    color={CH.green}
                  />
                  <StatCard
                    label="Updated 7d"
                    value={fmtNum(num(dbStats.cacheAge?.updated_7d))}
                    sub="recent entries"
                    color={CH.teal}
                  />
                </div>

                {/* By type */}
                <Card title="Entries by Media Type">
                  {loading ? (
                    <Skel h={160} />
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                        gap: 10,
                      }}
                    >
                      {(dbStats.byType ?? []).map((r: any, i: number) => {
                        const total =
                          (dbStats.byType ?? []).reduce(
                            (s: number, x: any) => s + num(x.count),
                            0
                          ) || 1;
                        return (
                          <div
                            key={r.type}
                            style={{
                              padding: '12px 14px',
                              background: 'var(--film-char)',
                              border: '1px solid var(--film-border)',
                              borderRadius: 8,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 8,
                              }}
                            >
                              <span
                                className="syne-font"
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: 'var(--film-cream)',
                                  textTransform: 'capitalize' as const,
                                }}
                              >
                                {r.type}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 10,
                                  color: PIE_COLORS[i % PIE_COLORS.length],
                                  fontWeight: 700,
                                }}
                              >
                                {fmtPct((num(r.count) / total) * 100)}
                              </span>
                            </div>
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 20,
                                color: PIE_COLORS[i % PIE_COLORS.length],
                                fontWeight: 700,
                                marginBottom: 8,
                              }}
                            >
                              {fmtNum(num(r.count))}
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
                                  background: PIE_COLORS[i % PIE_COLORS.length],
                                  width: `${(num(r.count) / total) * 100}%`,
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {(dbStats.byType ?? []).length === 0 && (
                        <div
                          style={{
                            color: CH.ghost,
                            fontFamily: 'JetBrains Mono,monospace',
                            fontSize: 11,
                          }}
                        >
                          No type data
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Cache freshness bands */}
                <Card title="Cache Freshness">
                  {loading ? (
                    <Skel h={120} />
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
                        gap: 10,
                      }}
                    >
                      {[
                        { label: 'Updated 24h', key: 'updated_24h', color: CH.green },
                        { label: 'Updated 7d', key: 'updated_7d', color: CH.yellow },
                        { label: 'Updated 30d', key: 'updated_30d', color: CH.orange },
                      ].map((band) => {
                        const total = num(dbStats.totals?.total_entries) || 1;
                        const count = num(dbStats.cacheAge?.[band.key]);
                        const stale = total - count;
                        const freshPct = (count / total) * 100;
                        return (
                          <div
                            key={band.key}
                            style={{
                              padding: '12px 14px',
                              background: 'var(--film-char)',
                              border: '1px solid var(--film-border)',
                              borderRadius: 8,
                            }}
                          >
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 8,
                                color: CH.ghost,
                                marginBottom: 4,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase' as const,
                              }}
                            >
                              {band.label}
                            </div>
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 22,
                                color: band.color,
                                fontWeight: 700,
                                marginBottom: 6,
                              }}
                            >
                              {fmtNum(count)}
                            </div>
                            <div
                              style={{
                                height: 5,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.06)',
                                overflow: 'hidden',
                                marginBottom: 4,
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  background: band.color,
                                  width: `${freshPct}%`,
                                  borderRadius: 2,
                                  transition: 'width 0.5s ease',
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 7,
                                color: CH.ghost,
                              }}
                            >
                              {freshPct.toFixed(1)}% fresh · {fmtNum(stale)} older
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}

        {/* ══ ERRORS ════════════════════════════════════════════════════════ */}
        {tab === 'errors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card title={`Recent Failures (${failRows.length})`} tag={pLabel} noPad>
              <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: 14 }}>
                    <Skel h={200} />
                  </div>
                ) : failRows.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      textAlign: 'center',
                      fontFamily: 'JetBrains Mono,monospace',
                      fontSize: 11,
                      color: CH.green,
                    }}
                  >
                    ✓ No failures in this period
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                    <thead>
                      <tr style={{ background: 'var(--film-mid)', position: 'sticky', top: 0 }}>
                        {['Time', 'Node', 'Status', 'Error'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '7px 12px',
                              textAlign: 'left',
                              fontFamily: 'JetBrains Mono,monospace',
                              fontSize: 7,
                              color: CH.ghost,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase' as const,
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
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
                            borderBottom: '1px solid rgba(255,255,255,0.025)',
                          }}
                        >
                          <td
                            style={{
                              padding: '6px 12px',
                              fontFamily: 'JetBrains Mono,monospace',
                              fontSize: 8,
                              color: CH.ghost,
                              whiteSpace: 'nowrap' as const,
                            }}
                          >
                            {relTime(r.timestamp)}
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: nodeColor(r.node),
                                }}
                              />
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 9,
                                  color: 'var(--film-cream)',
                                }}
                              >
                                {nodeLabel(r.node).split(' ')[0]}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <span
                              style={{
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 8,
                                color: r.status_code === 0 ? CH.orange : CH.red,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
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
                              fontFamily: 'JetBrains Mono,monospace',
                              fontSize: 8,
                              color: CH.dim,
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap' as const,
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

        {/* ══ BREAKDOWN ══════════════════════════════════════════════════════ */}
        {tab === 'breakdown' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
                gap: 14,
              }}
            >
              <Card title="Raster Format Distribution">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {formatRows.map((r, i) => {
                      const total = formatRows.reduce((s, x) => s + x.attempts, 0) || 1;
                      return (
                        <div key={r.format}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 4,
                            }}
                          >
                            <span
                              className="syne-font"
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: CH.amber,
                                letterSpacing: '0.08em',
                              }}
                            >
                              {r.format.toUpperCase()}
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: CH.ghost,
                                }}
                              >
                                {fmtNum(r.attempts)}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: msColor(r.avg_ms),
                                }}
                              >
                                {fmtMs(r.avg_ms)}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 5,
                              borderRadius: 2,
                              background: 'rgba(255,255,255,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                background: PIE_COLORS[i % PIE_COLORS.length],
                                width: `${(r.attempts / total) * 100}%`,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
              <Card title="Top Datacenters (Rasterizer)">
                {loading ? (
                  <Skel h={180} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {coloRows.map((r, i) => {
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
                                fontFamily: 'JetBrains Mono,monospace',
                                fontSize: 11,
                                color: 'var(--film-cream)',
                                fontWeight: 700,
                              }}
                            >
                              {r.colo}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: rateColor(rate),
                                }}
                              >
                                {fmtPct(rate)}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: msColor(r.avg_ms),
                                }}
                              >
                                {fmtMs(r.avg_ms)}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'JetBrains Mono,monospace',
                                  fontSize: 8,
                                  color: CH.ghost,
                                }}
                              >
                                {fmtNum(r.attempts)}
                              </span>
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
                                background: rateColor(rate),
                                width: `${(r.attempts / maxA) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {!coloRows.length && (
                      <div
                        style={{
                          color: CH.ghost,
                          fontFamily: 'JetBrains Mono,monospace',
                          fontSize: 11,
                        }}
                      >
                        No colo data
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ══ WALL TIME ══════════════════════════════════════════════════════ */}
        {tab === 'wall-time' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '6px 0' }}>
              <AmberTag>Request-Level Wall Time</AmberTag>
              <p
                className="body-font"
                style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8 }}
              >
                End-to-end latency from poster handler — SVG generation + rasterization + response
                time.
              </p>
            </div>
            {!wallStats || !num(wallStats.total_requests) ? (
              <div
                style={{
                  padding: 20,
                  color: CH.ghost,
                  fontFamily: 'JetBrains Mono,monospace',
                  fontSize: 11,
                  background: 'var(--film-char)',
                  borderRadius: 8,
                  border: '1px solid var(--film-border)',
                }}
              >
                No wall time data yet. Requires writeWallTime() calls in the poster handler.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
                    gap: 10,
                  }}
                >
                  <StatCard
                    label="Total Requests"
                    value={fmtNum(num(wallStats.total_requests))}
                    sub={pLabel}
                  />
                  <StatCard
                    label="Avg Wall Time"
                    value={fmtMs(nullableNum(wallStats.avg_wall_ms))}
                    sub="End-to-end"
                    color={msColor(nullableNum(wallStats.avg_wall_ms))}
                  />
                  <StatCard
                    label="Under 500ms"
                    value={fmtPct(
                      num(wallStats.total_requests) > 0
                        ? (num(wallStats.under_500ms) / num(wallStats.total_requests)) * 100
                        : 0
                    )}
                    sub="fastest"
                    color={CH.green}
                  />
                  <StatCard
                    label="Under 1s"
                    value={fmtPct(
                      num(wallStats.total_requests) > 0
                        ? (num(wallStats.under_1s) / num(wallStats.total_requests)) * 100
                        : 0
                    )}
                    sub="cumulative"
                    color={CH.yellow}
                  />
                  <StatCard
                    label="Under 2s"
                    value={fmtPct(
                      num(wallStats.total_requests) > 0
                        ? (num(wallStats.under_2s) / num(wallStats.total_requests)) * 100
                        : 0
                    )}
                    sub="cumulative"
                    color={CH.orange}
                  />
                  <StatCard
                    label="SVG Requests"
                    value={fmtNum(num(wallStats.svg_requests))}
                    sub="format split"
                  />
                </div>
                <Card title="Wall Time Over Time" tag={pLabel}>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart
                      data={wallTimeseries}
                      margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="bucket"
                        tick={{ fill: CH.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fill: CH.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        width={42}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: CH.ghost, fontSize: 8 }}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        tickFormatter={(v) => fmtMs(v)}
                      />
                      <Tooltip content={<FilmTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontSize: 9,
                          fontFamily: 'JetBrains Mono,monospace',
                          paddingTop: 8,
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="requests"
                        name="Requests"
                        fill="rgba(196,124,46,0.25)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avg_wall_ms"
                        name="Avg Wall ms"
                        stroke={CH.blue}
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ══ SVG ANALYTICS ═════════════════════════════════════════════════════ */}
{tab === 'svg' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ padding: '6px 0' }}>
      <AmberTag>SVG Request Analytics</AmberTag>
      <p className="body-font" style={{ fontSize: 13, color: 'var(--film-text-dim)', marginTop: 8 }}>
        SVG poster requests specifically — cache efficiency, preset distribution, and top requested titles as vector output.
      </p>
    </div>

    {/* SVG summary cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
      {loading ? Array(6).fill(0).map((_, i) => <Skel key={i} h={90} />) : (
        <>
          <StatCard label="SVG Requests" value={fmtNum(num(svgSummary?.total_svg_requests))} sub={pLabel} color={CH.blue} />
          <StatCard label="Cache Hits" value={fmtNum(num(svgSummary?.cache_hits))} sub="Edge cache" color={CH.green} />
          <StatCard label="Hit Rate" value={svgSummary ? fmtPct(num(svgSummary.hit_rate_pct)) : '—'} sub="SVG cache efficiency" color={rateColor(num(svgSummary?.hit_rate_pct))} />
          <StatCard label="Movies" value={fmtNum(num(svgSummary?.movie_svgs))} sub="SVG requests" color={CH.blue} />
          <StatCard label="TV Shows" value={fmtNum(num(svgSummary?.tv_svgs))} sub="SVG requests" color={CH.green} />
          <StatCard label="Anime" value={fmtNum(num(svgSummary?.anime_svgs))} sub="SVG requests" color={CH.purple} />
        </>
      )}
    </div>

    {/* SVG vs raster split */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Card title="Format Distribution">
        {loading ? <Skel h={180} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {svgVsRaster.map((r, i) => {
              const total = svgVsRaster.reduce((s, x) => s + x.requests, 0) || 1;
              const hitPct = r.requests > 0 ? (r.cache_hits / r.requests) * 100 : 0;
              return (
                <div key={r.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span className="syne-font" style={{ fontSize: 13, fontWeight: 700, color: CH.amber, letterSpacing: '0.06em' }}>
                      {r.category}
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: rateColor(hitPct) }}>
                        {fmtPct(hitPct)} cache
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost }}>
                        {fmtNum(r.requests)}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: PIE_COLORS[i % PIE_COLORS.length] }}>
                        {fmtPct((r.requests / total) * 100)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: PIE_COLORS[i % PIE_COLORS.length], width: `${(r.requests / total) * 100}%`, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
            {svgVsRaster.length === 0 && (
              <div style={{ color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', padding: 16 }}>
                No format data
              </div>
            )}
          </div>
        )}
      </Card>

      <Card title="SVG Preset Breakdown">
        {loading ? <Skel h={180} /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {svgPresetRows.map((r, i) => {
              const total = svgPresetRows.reduce((s, x) => s + x.requests, 0) || 1;
              const hitPct = r.requests > 0 ? (r.cache_hits / r.requests) * 100 : 0;
              return (
                <div key={r.preset}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span className="syne-font" style={{ fontSize: 12, fontWeight: 700, color: 'var(--film-cream)', textTransform: 'capitalize' as const }}>
                      {r.preset || 'badge'}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: rateColor(hitPct) }}>
                        {fmtPct(hitPct)} cached
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.gold, fontWeight: 700 }}>
                        {fmtNum(r.requests)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: PIE_COLORS[i % PIE_COLORS.length], width: `${(r.requests / total) * 100}%`, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
            {svgPresetRows.length === 0 && (
              <div style={{ color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>No preset data</div>
            )}
          </div>
        )}
      </Card>
    </div>

    {/* SVG requests over time */}
    <Card title="SVG Requests Over Time" tag={pLabel}>
      {loading ? <Skel h={200} /> : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={svgTimeseries} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gSvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CH.blue} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CH.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="bucket" tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={42} />
            <Tooltip content={<FilmTooltip />} />
            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8 }} />
            <Area type="monotone" dataKey="requests" name="SVG Requests" stroke={CH.blue} fill="url(#gSvg)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="hits" name="Cache Hits" stroke={CH.green} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="misses" name="Cache Misses" stroke={CH.orange} strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>

    {/* Top SVG IDs */}
    <Card title="Top Requested SVG Posters" tag={`top ${svgTopIds.length}`}>
      {loading ? <Skel h={280} /> : svgTopIds.length === 0 ? (
        <div style={{ color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', padding: 24 }}>
          No SVG request data — ensure blob3 = 'svg' is logged in REQUEST_ANALYTICS.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 12 }}>
          {svgTopIds.map(row => (
            <PosterThumb key={`${row.type}-${row.id}`} id={row.id} type={row.type} hits={row.hits} hitRate={row.hit_rate_pct} />
          ))}
        </div>
      )}
    </Card>

    {/* Top SVG rating combos */}
    <Card title="Top Rating Combos in SVG Requests">
      {loading ? <Skel h={160} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {svgRatingCombos.slice(0, 10).map((r, i) => {
            const max = svgRatingCombos[0]?.requests || 1;
            return (
              <div key={r.r_param}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <code style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: CH.amber,
                    background: 'rgba(196,124,46,0.08)', border: '1px solid rgba(196,124,46,0.14)',
                    borderRadius: 3, padding: '1px 5px',
                  }}>{r.r_param}</code>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.gold, fontWeight: 700 }}>
                    {fmtNum(r.requests)}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: PIE_COLORS[i % PIE_COLORS.length], width: `${(r.requests / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
          {svgRatingCombos.length === 0 && (
            <div style={{ color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>No data</div>
          )}
        </div>
      )}
    </Card>
  </div>
)}

        {/* Footer */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost }}>
            POSTERIUM · raster_metrics + request_analytics + D1 · Analytics Engine · v4
          </span>
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 7, color: CH.ghost }}>
            {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : ''} · {pLabel}
            {live ? ` · LIVE ↻` : ''}
          </span>
        </div>
      </main>
    </div>
  );
}
