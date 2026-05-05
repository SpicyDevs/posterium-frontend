// src/components/admin/TestBenchmark.tsx
// Rasterizer benchmark interface — film-noir aesthetic, matches AnalyticsDashboard

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import MainNavbar from '@/components/shared/MainNavbar';
import { AmberTag } from '@/components/shared/primitives';

const API_BASE = 'https://api.spicydevs.xyz';

// ── Palette ────────────────────────────────────────────────────────────────────
const CH = {
  amber: '#c47c2e', gold: '#d4a245', cream: '#f0e6cc',
  green: '#4ade80', red: '#f87171', orange: '#fb923c',
  yellow: '#facc15', blue: '#60a5fa', purple: '#a78bfa',
  teal: '#2dd4bf', pink: '#f472b6', ghost: 'rgba(140,130,112,0.45)',
  dim: 'rgba(180,168,148,0.65)',
};

const TIER_META: Record<number, { title: string; badge: string; color: string }> = {
  1: { title: 'Serverless', badge: 'T1', color: CH.teal },
  2: { title: 'Dedicated', badge: 'T2', color: CH.blue },
  3: { title: 'Legacy',    badge: 'T3', color: CH.ghost },
};

const TAG_META: Record<string, { color: string }> = {
  vercel:   { color: CH.blue },
  netlify:  { color: CH.purple },
  spaceify: { color: CH.teal },
  render:   { color: CH.orange },
  worker:   { color: CH.yellow },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtMs(ms: number | null | undefined) {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}
function msColor(ms: number | null | undefined) {
  if (!ms) return CH.ghost;
  if (ms < 500) return CH.green;
  if (ms < 1200) return CH.yellow;
  if (ms < 3000) return CH.orange;
  return CH.red;
}

const QUICK_EXAMPLES = [
  { label: 'Inception', type: 'movie', id: 'tt1375666', params: 'r=imdb,rt' },
  { label: 'Breaking Bad', type: 'tv', id: 'tt0903747', params: 'r=imdb,tmdb' },
  { label: 'Attack on Titan', type: 'anime', id: '16498', params: 'r=mal,anilist' },
  { label: 'Dune: Part Two', type: 'movie', id: 'tt15239678', params: 'r=imdb,rt,age' },
  { label: 'The Bear', type: 'tv', id: '136315', params: 'r=imdb,tmdb,rt' },
];

interface NodeResult {
  id: string;
  label: string;
  tier: number;
  tag: string;
  region: string;
  url: { ok: boolean; ms: number; status: number; note: string };
  b64: { ok: boolean; ms: number; status: number; note: string };
  health: Record<string, any> | null;
}

interface BenchmarkResult {
  inputType: string;
  rawId: string;
  queryParams: string;
  svgFetchOk: boolean;
  svgFetchMs: number;
  svgStatus: number;
  payloadKb: number;
  nodes: NodeResult[];
  tierGroups: { tier: number; meta: any; nodes: NodeResult[] }[];
  wsrv: { ok: boolean; ms: number; note: string };
  cloudinary: { ok: boolean; ms: number; note: string };
  summary: {
    fastestMs: number | null;
    avgMs: number | null;
    fastestNodeMs: number | null;
    successCount: number;
    totalCount: number;
  };
  urls: { svg: string; png: string };
  timestamp: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const TimingBar = ({ ms, max, color }: { ms: number; max: number; color: string }) => (
  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flex: 1 }}>
    <div style={{
      height: '100%',
      width: `${Math.min((ms / Math.max(max, 1)) * 100, 100)}%`,
      background: color,
      borderRadius: 2,
      transition: 'width 0.5s ease',
    }} />
  </div>
);

const NodeCard = ({ node, fastest }: { node: NodeResult; fastest: number | null }) => {
  const best = Math.min(
    node.url.ok ? node.url.ms : Infinity,
    node.b64.ok ? node.b64.ms : Infinity
  );
  const isFastest = fastest != null && best === fastest;
  const anyOk = node.url.ok || node.b64.ok;
  const tierMeta = TIER_META[node.tier] ?? TIER_META[3];
  const tagColor = TAG_META[node.tag]?.color ?? CH.ghost;

  const healthInfo = node.health ? (() => {
    const pts = [];
    if (node.health.activeJobs != null) pts.push(`active: ${node.health.activeJobs}`);
    if (node.health.queuedJobs != null) pts.push(`queue: ${node.health.queuedJobs}`);
    if (node.health.uptime != null) pts.push(`up: ${Math.floor(node.health.uptime / 3600)}h`);
    return pts.join(' · ');
  })() : node.region;

  return (
    <div style={{
      background: 'var(--film-char)',
      border: `1px solid ${isFastest ? 'rgba(196,124,46,0.4)' : 'var(--film-border)'}`,
      borderLeft: `3px solid ${anyOk ? tagColor : 'rgba(248,113,113,0.4)'}`,
      borderRadius: 8,
      padding: '12px 14px',
      position: 'relative',
    }}>
      {isFastest && (
        <div style={{
          position: 'absolute', top: 8, right: 8, fontSize: 8, fontFamily: 'Syne, sans-serif',
          fontWeight: 700, color: CH.gold, background: 'rgba(196,124,46,0.12)',
          border: '1px solid rgba(196,124,46,0.25)', borderRadius: 3, padding: '2px 6px',
          letterSpacing: '0.06em',
        }}>⚡ FASTEST</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--film-cream)' }}>
            {node.label}
          </div>
          <div style={{ fontSize: 9, color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
            {healthInfo}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{
            fontSize: 7, fontWeight: 700, fontFamily: 'Syne, sans-serif',
            color: tierMeta.color, background: `${tierMeta.color}18`,
            border: `1px solid ${tierMeta.color}28`, borderRadius: 3, padding: '2px 5px',
          }}>{tierMeta.badge}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: '📡 URL payload', result: node.url },
          { label: '💾 B64 payload', result: node.b64 },
        ].map(({ label, result }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost }}>{label}</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                color: result.ok ? msColor(result.ms) : CH.red,
              }}>
                {result.ok ? fmtMs(result.ms) : (result.note || '✗')}
              </span>
            </div>
            {result.ok && (
              <TimingBar ms={result.ms} max={4000} color={msColor(result.ms)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ThirdPartyCard = ({
  label, sublabel, result, posterUrl,
}: { label: string; sublabel: string; result: { ok: boolean; ms: number; note: string }; posterUrl?: string }) => (
  <div style={{
    background: 'var(--film-char)',
    border: `1px solid ${result.ok ? 'var(--film-border)' : 'rgba(248,113,113,0.2)'}`,
    borderRadius: 8,
    overflow: 'hidden',
  }}>
    <div style={{
      padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700, color: 'var(--film-cream)' }}>{label}</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: CH.ghost, marginTop: 2 }}>{sublabel}</div>
      </div>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700,
        color: result.ok ? msColor(result.ms) : CH.red,
      }}>
        {result.ok ? fmtMs(result.ms) : '✗'}
      </span>
    </div>
    {result.ok && posterUrl ? (
      <div style={{ background: '#000', aspectRatio: '2/3', maxHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={posterUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      </div>
    ) : !result.ok ? (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: CH.red }}>{result.note}</div>
      </div>
    ) : null}
  </div>
);

const StatCard = ({ label, value, color = CH.amber }: { label: string; value: string; color?: string }) => (
  <div style={{
    padding: '12px 14px', background: 'var(--film-char)',
    border: '1px solid var(--film-border)', borderRadius: 8,
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
      {label}
    </div>
    <div className="poster-font" style={{ fontSize: 28, color, lineHeight: 1, letterSpacing: '0.04em' }}>
      {value}
    </div>
  </div>
);

const FilmTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--film-dark)', border: '1px solid var(--film-border)',
      borderRadius: 8, padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    }}>
      <div style={{ color: CH.amber, marginBottom: 4, fontWeight: 700 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color ?? CH.cream }}>
          {p.value != null ? `${p.value}ms` : '—'}
        </div>
      ))}
    </div>
  );
};

// ── Search form ─────────────────────────────────────────────────────────────
const SearchForm = ({ onRun, loading }: { onRun: (type: string, id: string, params: string) => void; loading: boolean }) => {
  const [type, setType] = useState('movie');
  const [id, setId] = useState('');
  const [params, setParams] = useState('r=imdb,rt');

  const handleSubmit = () => {
    if (!id.trim()) return;
    onRun(type, id.trim(), params.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>
            Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={{
              width: '100%', height: 38, padding: '0 10px',
              background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 7, color: 'var(--film-cream)', fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace', outline: 'none', cursor: 'pointer',
            }}
          >
            {['movie', 'tv', 'anime', 'poster'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>
            ID (TMDB / IMDb / MAL)
          </label>
          <input
            type="text"
            value={id}
            onChange={e => setId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. tt1375666 or 27205"
            style={{
              width: '100%', height: 38, padding: '0 12px',
              background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 7, color: 'var(--film-cream)', fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace', outline: 'none',
              boxSizing: 'border-box' as const,
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 5 }}>
          Query params (optional)
        </label>
        <input
          type="text"
          value={params}
          onChange={e => setParams(e.target.value)}
          placeholder="r=imdb,rt&source=fanart"
          style={{
            width: '100%', height: 38, padding: '0 12px',
            background: 'var(--film-char)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 7, color: 'var(--film-cream)', fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace', outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !id.trim()}
        style={{
          height: 42, background: loading ? 'rgba(196,124,46,0.3)' : `linear-gradient(90deg,${CH.amber},${CH.gold})`,
          color: '#070706', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
          fontSize: 12, fontWeight: 800, fontFamily: 'Syne, sans-serif',
          letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          opacity: loading || !id.trim() ? 0.6 : 1, transition: 'opacity 0.2s',
        }}
      >
        {loading ? 'Running benchmark…' : 'Run Benchmark'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Quick examples
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {QUICK_EXAMPLES.map(ex => (
            <button
              key={ex.id}
              onClick={() => { setType(ex.type); setId(ex.id); setParams(ex.params); }}
              style={{
                padding: '5px 10px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.09)', borderRadius: 5,
                color: CH.dim, fontSize: 9, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                fontWeight: 600, letterSpacing: '0.04em', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(196,124,46,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Loading screen ─────────────────────────────────────────────────────────────
const LoadingView = ({ type, id }: { type: string; id: string }) => {
  const [step, setStep] = useState(0);
  const steps = [
    'Fetching SVG from API…',
    'Sending to rasterizer nodes…',
    'Testing wsrv.nl + Cloudinary…',
    'Collecting health data…',
    'Compiling results…',
  ];

  useEffect(() => {
    const iv = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 20px', border: '1px dashed rgba(196,124,46,0.3)', borderRadius: 12,
      marginTop: 24, background: 'rgba(196,124,46,0.02)',
    }}>
      <div style={{
        width: 44, height: 44, border: '3px solid rgba(255,255,255,0.07)',
        borderTopColor: CH.amber, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', marginBottom: 20,
      }} />
      <div className="poster-font" style={{ fontSize: 20, color: CH.amber, letterSpacing: '0.06em', marginBottom: 8 }}>
        {type}/{id}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
        {steps.map((s, i) => (
          <div key={s} style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
            color: i === step ? CH.cream : i < step ? CH.green : CH.ghost,
            letterSpacing: '0.05em',
            transition: 'color 0.3s',
          }}>
            {i < step ? '✓ ' : i === step ? '› ' : '  '}{s}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Results view ───────────────────────────────────────────────────────────────
const ResultsView = ({
  data, onBack, onRerun,
}: { data: BenchmarkResult; onBack: () => void; onRerun: () => void }) => {
  const { summary, nodes, tierGroups, wsrv, cloudinary, urls, svgFetchOk, svgFetchMs, payloadKb } = data;

  // Chart data: all nodes sorted by fastest timing
  const chartData = useMemo(() => {
    return nodes.map(n => ({
      label: n.label.split(' ')[0],
      url: n.url.ok ? n.url.ms : null,
      b64: n.b64.ok ? n.b64.ms : null,
      fastest: Math.min(n.url.ok ? n.url.ms : Infinity, n.b64.ok ? n.b64.ms : Infinity),
    })).sort((a, b) => a.fastest - b.fastest);
  }, [nodes]);

  const maxMs = Math.max(...chartData.map(d => Math.max(d.url ?? 0, d.b64 ?? 0)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{
            padding: '5px 12px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
            color: CH.ghost, fontSize: 10, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
          }}
        >
          ← Back
        </button>
        <div className="poster-font" style={{ fontSize: 18, color: CH.amber, letterSpacing: '0.06em' }}>
          {data.inputType}/{data.rawId}
        </div>
        {data.queryParams && (
          <code style={{
            fontSize: 9, color: CH.ghost, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '2px 8px',
          }}>
            ?{data.queryParams}
          </code>
        )}
        <button
          onClick={onRerun}
          style={{
            marginLeft: 'auto', padding: '5px 12px', background: CH.amber,
            border: 'none', borderRadius: 6, color: '#070706', fontSize: 10,
            cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 700,
          }}
        >
          ↻ Re-run
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
        <StatCard label="Fastest node" value={fmtMs(summary.fastestNodeMs)} color={msColor(summary.fastestNodeMs)} />
        <StatCard label="Average" value={fmtMs(summary.avgMs)} color={CH.gold} />
        <StatCard label="Nodes OK" value={`${summary.successCount}/${summary.totalCount}`} color={summary.successCount === summary.totalCount ? CH.green : CH.yellow} />
        <StatCard label="SVG fetch" value={fmtMs(svgFetchMs)} color={svgFetchOk ? msColor(svgFetchMs) : CH.red} />
        <StatCard label="SVG size" value={payloadKb > 0 ? `${payloadKb}KB` : '—'} color={CH.blue} />
        <StatCard label="wsrv.nl" value={wsrv.ok ? fmtMs(wsrv.ms) : '✗'} color={wsrv.ok ? msColor(wsrv.ms) : CH.red} />
      </div>

      {/* Live poster + chart side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14, alignItems: 'start' }}>
        {/* Live poster */}
        <div style={{ background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Live Poster</span>
            <a href={urls.png} target="_blank" rel="noreferrer" style={{ fontSize: 8, color: CH.amber, textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>PNG ↗</a>
          </div>
          <div style={{ background: '#000' }}>
            <img src={urls.svg} alt="Live poster" style={{ width: '100%', display: 'block' }} />
          </div>
        </div>

        {/* Timing chart */}
        <div style={{ background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="syne-font" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: CH.amber }}>
              Node Timing Comparison
            </span>
          </div>
          <div style={{ padding: 14 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: CH.ghost, fontSize: 8 }} tickLine={false} axisLine={false} width={50} tickFormatter={v => `${v}ms`} />
                  <Tooltip content={<FilmTooltip />} />
                  <Bar dataKey="url" name="URL" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.url ? msColor(entry.url) : 'rgba(255,255,255,0.1)'} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: CH.ghost, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textAlign: 'center', padding: 40 }}>
                No timing data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node grid by tier */}
      {tierGroups.map(group => (
        <div key={group.tier}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase' as const, color: CH.ghost, marginBottom: 10,
            paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: TIER_META[group.tier]?.color ?? CH.ghost }}>
              {TIER_META[group.tier]?.title ?? `Tier ${group.tier}`}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 7 }}>·</span>
            <span>{group.nodes.length} nodes</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
            {group.nodes.map(node => (
              <NodeCard key={node.id} node={node} fastest={summary.fastestNodeMs} />
            ))}
          </div>
        </div>
      ))}

      {/* Third-party section */}
      <div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase' as const, color: CH.ghost, marginBottom: 10,
          paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          Third-party rasterizers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          <ThirdPartyCard label="wsrv.nl" sublabel="librsvg · GET ?url=" result={wsrv} posterUrl={wsrv.ok ? urls.svg : undefined} />
          <ThirdPartyCard label="Cloudinary" sublabel="ImageMagick · fetch transform" result={cloudinary} posterUrl={cloudinary.ok ? urls.svg : undefined} />
        </div>
      </div>

      {/* SVG source URL box */}
      <div style={{ padding: 14, background: 'var(--film-char)', border: '1px solid var(--film-border)', borderRadius: 8 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
          SVG source
        </div>
        <a href={urls.svg} target="_blank" rel="noreferrer" style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: CH.amber,
          wordBreak: 'break-all', textDecoration: 'none', lineHeight: 1.6,
        }}>
          {urls.svg}
        </a>
      </div>

      <div style={{
        paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost,
      }}>
        Benchmark completed {new Date(data.timestamp).toLocaleTimeString()} · {nodes.length} nodes · timing-only mode
      </div>
    </div>
  );
};

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function TestBenchmark() {
  const [mode, setMode] = useState<'search' | 'loading' | 'results'>('search');
  const [benchType, setBenchType] = useState('movie');
  const [benchId, setBenchId] = useState('');
  const [benchParams, setBenchParams] = useState('');
  const [results, setResults] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState('');

  // Read URL params on load to auto-run if params present
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get('type');
      const i = sp.get('id');
      const p = sp.get('params') ?? '';
      if (t && i) {
        setBenchType(t);
        setBenchId(i);
        setBenchParams(p);
        runBenchmark(t, i, p);
      }
    } catch {}
  }, []);

  const runBenchmark = useCallback(async (type: string, id: string, params: string) => {
    setMode('loading');
    setBenchType(type);
    setBenchId(id);
    setBenchParams(params);
    setError('');
    setResults(null);

    // Update URL for shareable links
    try {
      const sp = new URLSearchParams({ type, id, ...(params ? { params } : {}) });
      history.pushState({}, '', `?${sp.toString()}`);
    } catch {}

    try {
      const qs = params ? `?${params.replace(/^\?/, '')}` : '';
      const benchUrl = `${API_BASE}/test/${type}/${id}.png${qs}&output=json`;
      const res = await fetch(benchUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as BenchmarkResult;
      setResults(data);
      setMode('results');
    } catch (e: any) {
      setError(e.message ?? 'Benchmark failed');
      setMode('search');
    }
  }, []);

  const handleBack = () => {
    setMode('search');
    setResults(null);
    try { history.pushState({}, '', window.location.pathname); } catch {}
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--film-black)', color: 'var(--film-cream)', paddingTop: 56 }}>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .recharts-text { font-family: 'JetBrains Mono', monospace !important; font-size: 9px !important; fill: rgba(180,168,148,0.65) !important; }
      `}</style>

      <MainNavbar fixed={true} compactLogo />

      {/* Page header */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 40,
        background: 'rgba(7,7,6,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--film-border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div className="poster-font" style={{ fontSize: 16, color: CH.amber, letterSpacing: '0.06em' }}>
          Rasterizer Benchmark
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: CH.ghost, letterSpacing: '0.12em' }}>
          {mode === 'loading' ? `TESTING ${benchType}/${benchId}` : mode === 'results' ? `RESULTS · ${results?.nodes.length ?? 0} nodes` : 'READY'}
        </span>
        {mode === 'results' && (
          
           <a href={`https://api.spicydevs.xyz/admin/test/${benchType}/${benchId}.png${benchParams ? '?' + benchParams : ''}`}
            target="_blank" rel="noreferrer"
            style={{
              marginLeft: 'auto', fontSize: 9, color: CH.amber, textDecoration: 'none',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.06em',
            }}
          >
            Legacy HTML view ↗
          </a>
        )}
      </div>

      <main style={{ padding: 16, maxWidth: 1280, margin: '0 auto' }}>
        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 8,
            background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)',
            color: CH.red, fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          }}>
            ✕ {error}
          </div>
        )}

        {mode === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <AmberTag style={{ marginBottom: 8 }}>Node Benchmark</AmberTag>
              <p className="body-font" style={{ fontSize: 14, color: 'var(--film-text-dim)', marginBottom: 20 }}>
                Test all rasterizer nodes with a real poster — measures SVG fetch time, per-node render latency, and health status.
              </p>
              <SearchForm onRun={runBenchmark} loading={false} />
            </div>
          </div>
        )}

        {mode === 'loading' && <LoadingView type={benchType} id={benchId} />}

        {mode === 'results' && results && (
          <ResultsView
            data={results}
            onBack={handleBack}
            onRerun={() => runBenchmark(benchType, benchId, benchParams)}
          />
        )}
      </main>
    </div>
  );
}