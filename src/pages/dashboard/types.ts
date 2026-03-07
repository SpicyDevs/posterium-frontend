// src/pages/dashboard/types.ts

export interface PosterItem {
  id: string;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  year: string;
  badges: string;
  badgeConfig?: string;
  accent: string;
}

export interface BadgeData {
  id: string;
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
}

export interface DemoConfig {
  label: string;
  poster: PosterItem;
  desc: string;
  accent: string;
}

export interface UseCase {
  icon: string;
  title: string;
  desc: string;
  tags: string[];
}

export interface ApiParam {
  p: string;
  d: string;
  e: string;
}

export interface Stat {
  v: string;
  l: string;
  icon: React.ReactNode;
}