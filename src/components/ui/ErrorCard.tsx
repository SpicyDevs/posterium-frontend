// src/components/ui/ErrorCard.tsx
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Additional container styles */
  style?: React.CSSProperties;
}

/**
 * Amber-bordered error card with icon, title, message and optional retry button.
 */
export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  style,
}) => (
  <div
    role="alert"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      padding: 'var(--space-5)',
      background: 'rgba(127,29,29,0.12)',
      border: '1px solid rgba(196,124,46,0.3)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-sm)',
      maxWidth: 520,
      ...style,
    }}
  >
    {/* Icon + title row */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'rgba(252,165,165,0.9)', flexShrink: 0, display: 'flex' }}>
        <AlertCircle size={18} />
      </span>
      <span
        className="syne-font"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--film-cream)',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </span>
    </div>

    {/* Message */}
    <p
      style={{
        margin: 0,
        fontSize: 12,
        color: 'var(--film-text-label)',
        lineHeight: 1.55,
      }}
    >
      {message}
    </p>

    {/* Retry */}
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          background: 'rgba(196,124,46,0.1)',
          border: '1px solid rgba(196,124,46,0.35)',
          borderRadius: 'var(--radius-xs)',
          color: 'var(--film-amber)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          fontFamily: 'Syne, sans-serif',
          transition: 'background var(--transition-fast)',
          minHeight: 36,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(196,124,46,0.18)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(196,124,46,0.1)')}
      >
        <RefreshCw size={12} />
        {retryLabel}
      </button>
    )}
  </div>
);

export default ErrorCard;
