// components/QuickBuilder.tsx
import { memo, useState } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import { API } from '../constants';

// ── Types ─────────────────────────────────────────────────────────

type MediaType = 'movie' | 'tv';

interface BadgeOption {
  id: string;
  label: string;
  color: string;
}

interface QuickBuilderProps {
  defaultTmdbId?: string;
  defaultMediaType?: MediaType;
  defaultBadges?: string[];
}

// ── Constants ─────────────────────────────────────────────────────

const BADGE_OPTIONS: BadgeOption[] = [
  { id: 'imdb', label: 'IMDb',       color: '#E8B848' },
  { id: 'rt',   label: 'RT',         color: '#DC4040' },
  { id: 'meta', label: 'Metacritic', color: '#8aaaee' },
  { id: 'tmdb', label: 'TMDB',       color: '#3cb371' },
];

const MEDIA_TYPES: MediaType[] = ['movie', 'tv'];

// ── Component ─────────────────────────────────────────────────────

export const QuickBuilder = memo<QuickBuilderProps>(({
  defaultTmdbId    = '155',
  defaultMediaType = 'movie',
  defaultBadges    = ['imdb', 'rt'],
}) => {
  const [tmdbId, setTmdbId]           = useState(defaultTmdbId);
  const [mediaType, setMediaType]     = useState<MediaType>(defaultMediaType);
  const [selectedBadges, setSelected] = useState<Set<string>>(new Set(defaultBadges));
  const [copied, setCopied]           = useState(false);

  const toggleBadge = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resolvedId = tmdbId || defaultTmdbId;
  const badgeStr   = BADGE_OPTIONS.filter(b => selectedBadges.has(b.id)).map(b => b.id).join(',');
  const url        = badgeStr
    ? `${API}/${mediaType}/${resolvedId}.svg?r=${badgeStr}&source=tmdb`
    : `${API}/${mediaType}/${resolvedId}.svg?source=tmdb`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div style={{
      background: 'rgba(14,13,11,0.8)',
      border: '1px solid rgba(196,124,46,0.14)',
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 40,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(196,124,46,0.04)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--film-amber)',
          boxShadow: '0 0 6px rgba(196,124,46,0.5)',
          display: 'inline-block',
        }} />
        <span className="mono-font" style={{
          fontSize: 8, color: 'rgba(196,124,46,0.55)',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Quick URL Builder
        </span>
      </div>

      {/* ── Controls ── */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>

        {/* TMDB ID */}
        <ControlGroup label="TMDB ID">
          <input
            type="text"
            value={tmdbId}
            onChange={e => setTmdbId(e.target.value.replace(/\D/g, ''))}
            placeholder={`e.g. ${defaultTmdbId}`}
            maxLength={8}
            style={{
              background: 'rgba(7,7,6,0.8)',
              border: '1px solid rgba(196,124,46,0.18)',
              borderRadius: 3,
              color: 'var(--film-cream)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              padding: '5px 10px',
              width: 90,
              outline: 'none',
            }}
          />
        </ControlGroup>

        {/* Media type */}
        <ControlGroup label="Type">
          <div style={{ display: 'flex', gap: 2 }}>
            {MEDIA_TYPES.map(t => {
              const active = mediaType === t;
              return (
                <button
                  key={t}
                  onClick={() => setMediaType(t)}
                  className="mono-font"
                  style={{
                    background: active ? 'rgba(196,124,46,0.18)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${active ? 'rgba(196,124,46,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 3, cursor: 'pointer', padding: '5px 10px',
                    fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: active ? 'var(--film-amber)' : 'rgba(122,117,110,0.5)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </ControlGroup>

        {/* Badges */}
        <ControlGroup label="Badges">
          <div style={{ display: 'flex', gap: 2 }}>
            {BADGE_OPTIONS.map(b => {
              const on = selectedBadges.has(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => toggleBadge(b.id)}
                  className="mono-font"
                  style={{
                    background: on ? `${b.color}22` : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${on ? `${b.color}55` : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 3, cursor: 'pointer', padding: '5px 9px',
                    fontSize: 7, letterSpacing: '0.1em',
                    color: on ? b.color : 'rgba(122,117,110,0.45)',
                    transition: 'all 0.15s',
                  }}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </ControlGroup>
      </div>

      {/* ── Generated URL ── */}
      <div style={{
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <code className="mono-font" style={{
          fontSize: 9, flex: 1, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: 'rgba(240,230,204,0.6)', letterSpacing: '0.02em',
        }}>
          <span style={{ color: 'rgba(196,124,46,0.5)' }}>api.spicydevs.xyz</span>
          <span style={{ color: 'rgba(240,230,204,0.4)' }}>/{mediaType}/{resolvedId}.svg</span>
          {badgeStr && <span style={{ color: '#DC4040' }}>?r={badgeStr}</span>}
          {badgeStr && <span style={{ color: 'rgba(240,230,204,0.3)' }}>&source=tmdb</span>}
        </code>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="Open in new tab"
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            color: 'rgba(122,117,110,0.5)',
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <ArrowUpRight size={12} />
        </a>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(54,162,64,0.12)' : 'rgba(196,124,46,0.08)',
            border: `1px solid ${copied ? 'rgba(54,162,64,0.3)' : 'rgba(196,124,46,0.18)'}`,
            borderRadius: 3,
            color: copied ? '#36A240' : 'var(--film-amber)',
            cursor: 'pointer', padding: '3px 8px',
            display: 'flex', alignItems: 'center', gap: 3,
            transition: 'all 0.2s', flexShrink: 0,
          }}
        >
          {copied ? <Check size={9} /> : <Copy size={9} />}
          <span className="mono-font" style={{ fontSize: 7, letterSpacing: '0.1em' }}>
            {copied ? 'COPIED' : 'COPY'}
          </span>
        </button>
      </div>
    </div>
  );
});

QuickBuilder.displayName = 'QuickBuilder';

// ── Helper ────────────────────────────────────────────────────────

const ControlGroup = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <div
      className="mono-font"
      style={{
        fontSize: 7, color: 'rgba(122,117,110,0.4)',
        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5,
      }}
    >
      {label}
    </div>
    {children}
  </div>
);
