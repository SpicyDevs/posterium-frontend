// src/components/admin/analytics/helpers.ts
// Number formatters and derived-value helpers shared across analytics panels.

export function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return isNaN(n) ? 0 : n;
}
export function nullableNum(v: unknown): number | null {
  if (v == null || (typeof v === 'string' && !v.trim())) return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}
export function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}
export function fmtNum(n: number): string {
  if (!n) return '0';
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(Math.round(n));
}
export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
export function msColor(ms: number | null): string {
  const CH_GREEN = '#4ade80', CH_YELLOW = '#facc15', CH_ORANGE = '#fb923c', CH_RED = '#f87171', CH_GHOST = 'rgba(140,130,112,0.45)';
  if (ms === null) return CH_GHOST;
  if (ms < 500) return CH_GREEN;
  if (ms < 1200) return CH_YELLOW;
  if (ms < 3000) return CH_ORANGE;
  return CH_RED;
}
export function rateColor(pct: number): string {
  const CH_GREEN = '#4ade80', CH_YELLOW = '#facc15', CH_ORANGE = '#fb923c', CH_RED = '#f87171';
  if (pct >= 90) return CH_GREEN;
  if (pct >= 70) return CH_YELLOW;
  if (pct >= 40) return CH_ORANGE;
  return CH_RED;
}
export function healthScore(successPct: number, avgMs: number | null): number {
  const latScore =
    avgMs === null ? 100
    : avgMs < 500 ? 100
    : avgMs < 1000 ? 80
    : avgMs < 2000 ? 55
    : avgMs < 4000 ? 30
    : 10;
  return Math.round(successPct * 0.6 + latScore * 0.4);
}
export function fmtBucket(s: string, granularity: string): string {
  if (!s) return '';
  try {
    const d = new Date(s.replace(' ', 'T') + 'Z');
    if (granularity === 'day') return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    if (granularity === 'hour')
      return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}h`;
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  } catch {
    return s.slice(0, 13);
  }
}
export function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}
