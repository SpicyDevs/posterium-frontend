// src/components/shared/Skeleton.tsx
/**
 * Named skeleton exports for loading states.
 * All aria-hidden. No shimmer under prefers-reduced-motion.
 */
import React from 'react';

const SHIMMER_STYLE: React.CSSProperties = {
  background: 'linear-gradient(110deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.6s linear infinite',
};

const BASE: React.CSSProperties = {
  borderRadius: 'var(--radius-xs)',
  background: 'rgba(255,255,255,0.06)',
};

interface SkeletonBaseProps {
  style?: React.CSSProperties;
  className?: string;
}

/** 2:3 aspect ratio poster placeholder */
export const SkeletonPoster: React.FC<SkeletonBaseProps & { width?: number | string }> = ({
  width = 180,
  style,
  className,
}) => (
  <div
    aria-hidden="true"
    className={`motion-safe:animate-shimmer ${className ?? ''}`}
    style={{
      ...BASE,
      ...SHIMMER_STYLE,
      width,
      aspectRatio: '2/3',
      flexShrink: 0,
      ...style,
    }}
  />
);

/** Single badge-sized rectangle */
export const SkeletonBadge: React.FC<SkeletonBaseProps> = ({ style, className }) => (
  <div
    aria-hidden="true"
    className={className}
    style={{
      ...BASE,
      ...SHIMMER_STYLE,
      width: 72,
      height: 36,
      ...style,
    }}
  />
);

/** Text line — pass width as a percentage string for fluid sizing */
export const SkeletonText: React.FC<SkeletonBaseProps & { lines?: number; width?: string }> = ({
  lines = 1,
  width = '100%',
  style,
  className,
}) => (
  <div aria-hidden="true" className={className} style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
          ...BASE,
          ...SHIMMER_STYLE,
          height: 12,
          width: i === lines - 1 && lines > 1 ? '65%' : width,
          borderRadius: 6,
        }}
      />
    ))}
  </div>
);

/** Full panel skeleton — a block with stacked text lines */
export const SkeletonPanel: React.FC<SkeletonBaseProps & { rows?: number }> = ({
  rows = 5,
  style,
  className,
}) => (
  <div
    aria-hidden="true"
    className={className}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      padding: 'var(--space-4)',
      ...style,
    }}
  >
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          ...BASE,
          ...SHIMMER_STYLE,
          height: 12,
          width: `${[80, 60, 95, 70, 50][i % 5]}%`,
          borderRadius: 6,
        }}
      />
    ))}
  </div>
);

/** Card-shaped skeleton */
export const SkeletonCard: React.FC<SkeletonBaseProps & { height?: number | string }> = ({
  height = 160,
  style,
  className,
}) => (
  <div
    aria-hidden="true"
    className={className}
    style={{
      ...BASE,
      ...SHIMMER_STYLE,
      height,
      width: '100%',
      ...style,
    }}
  />
);
