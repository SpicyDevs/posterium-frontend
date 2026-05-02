// src/components/admin/analytics/constants.ts
// Shared constants extracted from AnalyticsDashboard for Phase 10 decomposition.

export const API_BASE = 'https://api.spicydevs.xyz';
export const POSTER_API = 'https://api.spicydevs.xyz';
export const AUTH_KEY = 'posterium_analytics_auth_v4';
export const CONFIG_KEY = 'posterium_dash_config_v4';

/**
 * P0 SECURITY FIX (Phase 10):
 * The password is now read from a Vite env variable injected at build time.
 * Set VITE_ANALYTICS_PW in your .env file.
 * Fallback is an empty string so login never works without the env var.
 */
export const CORRECT_PW: string = (import.meta as any).env.VITE_ANALYTICS_PW ?? '';

// ── Chart palette ─────────────────────────────────────────────────────────────
export const CH = {
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
} as const;

export const PIE_COLORS = [
  CH.amber, CH.blue, CH.green, CH.yellow,
  CH.orange, CH.purple, CH.teal, CH.red, CH.pink,
];

// ── Node metadata ─────────────────────────────────────────────────────────────
const NODE_COLOR_MAP: Record<string, string> = {
  washington: CH.blue, london: CH.green, tokyo: CH.yellow,
  mumbai: CH.red, germany: CH.teal, france: CH.purple,
  wsrv: CH.orange, 'render-eu': CH.pink, ohio: CH.purple,
  'cf-binding': CH.gold, render_eu: CH.pink,
};
export function nodeColor(n: string) { return NODE_COLOR_MAP[n] ?? CH.ghost; }

const NODE_LABEL_MAP: Record<string, string> = {
  washington: 'Washington · Vercel', ohio: 'Ohio · Netlify',
  london: 'London · Vercel', tokyo: 'Tokyo · Vercel',
  mumbai: 'Mumbai · Vercel', germany: 'Germany · Spaceify',
  france: 'France · Spaceify', wsrv: 'wsrv.nl',
  'render-eu': 'EU Central · Render', 'cf-binding': 'CF Binding',
  render_eu: 'EU Central · Render',
};
export function nodeLabel(n: string) { return NODE_LABEL_MAP[n] ?? n; }

export const LANE_META: Record<string, { label: string; color: string }> = {
  geo: { label: 'Primary (geo)', color: CH.green },
  binding: { label: 'CF Binding', color: CH.teal },
  'geo-fallback': { label: 'Tier 1 Fallback', color: CH.yellow },
  'geo-t2': { label: 'Tier 2 Fallback', color: CH.orange },
  'wsrv-fallback': { label: 'wsrv (fallback)', color: CH.purple },
  'geo-t3': { label: 'Tier 3 Fallback', color: CH.red },
  'wsrv-t3': { label: 'wsrv (Tier 3)', color: '#dc2626' },
  bulk: { label: 'Bulk', color: CH.blue },
};

export const DEVICE_META: Record<string, { label: string; icon: string; color: string }> = {
  desktop: { label: 'Desktop', icon: '🖥️', color: CH.blue },
  mobile: { label: 'Mobile', icon: '📱', color: CH.green },
  tablet: { label: 'Tablet', icon: '📲', color: CH.yellow },
  tv: { label: 'Smart TV', icon: '📺', color: CH.purple },
};

export const PERIODS: Record<string, { label: string; short: string }> = {
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

export const TABS = [
  'overview', 'nodes', 'traffic', 'fallbacks',
  'requests', 'devices', 'db', 'errors', 'breakdown', 'wall-time',
] as const;
export type Tab = (typeof TABS)[number];

export interface DashConfig {
  period: string;
  alertRate: number;
  alertMs: number;
}

export function loadCfg(): DashConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return { period: '24h', alertRate: 90, alertMs: 2000, ...JSON.parse(raw) };
  } catch {}
  return { period: '24h', alertRate: 90, alertMs: 2000 };
}
export function saveCfg(c: DashConfig) {
  try { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)); } catch {}
}
