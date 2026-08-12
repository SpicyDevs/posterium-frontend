import { memo, useMemo, useCallback, useState } from 'react';
import { Copy, Download, LoaderCircle, Check, Layout, Sliders } from 'lucide-react';
import type { BuilderMode } from '@/builder/components/ModeToggle';
import type { ExtensionType, PosterConfig } from '@/types/poster';
import { generateApiUrl } from '@/builder/utils/url-generator';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface ExportStepProps {
  config: PosterConfig;
  onChange: (updates: Partial<PosterConfig>) => void;
  builderMode: BuilderMode;
  setBuilderMode: (mode: BuilderMode) => void;
}

const EXT_OPTIONS: { id: ExtensionType; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'webp', label: 'WEBP' },
];

const ExportStep = memo<ExportStepProps>(({ config, onChange, builderMode, setBuilderMode }) => {
  const [copied, setCopied] = useState(false);
  const [aioCopied, setAioCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const exportUrl = useMemo(() => {
    try {
      return generateApiUrl(config, DEFAULT_API_BASE);
    } catch {
      return '';
    }
  }, [config]);

  const handleCopyUrl = useCallback(async () => {
    if (!exportUrl) return;
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  }, [exportUrl]);

  const handleDownload = useCallback(() => {
    if (!exportUrl) return;
    setDownloading(true);
    try {
      const u = new URL(exportUrl);
      u.searchParams.set('download', '');
      window.open(u.toString(), '_blank', 'noopener,noreferrer');
    } catch { /* */ }
    setTimeout(() => setDownloading(false), 800);
  }, [exportUrl]);

  const handleAioCopy = useCallback(async () => {
    if (!exportUrl) return;
    try {
      const templateUrl = exportUrl.replace(/\/poster\/[^.]+\./, '/poster/{imdb_id}.');
      const safe = templateUrl.includes('{imdb_id}') ? templateUrl : exportUrl;
      await navigator.clipboard.writeText(safe);
      setAioCopied(true);
      setTimeout(() => setAioCopied(false), 2000);
    } catch { /* */ }
  }, [exportUrl]);

  const hasPoster = Boolean(config.imdbId || config.tmdbId);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <StepTitle>Export Your Poster</StepTitle>
      <StepSubtitle>
        Your poster is ready. Choose an export format and copy the URL or download.
      </StepSubtitle>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          className="syne-font"
          style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 10 }}
        >
          Format
        </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {EXT_OPTIONS.map((ext) => (
              <button
                key={ext.id}
                type="button"
                onClick={() => onChange({ extension: ext.id })}
                className="syne-font"
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: config.extension === ext.id ? 'rgba(196,124,46,0.14)' : 'rgba(255,255,255,0.03)',
                  border: config.extension === ext.id
                    ? '1px solid rgba(196,124,46,0.35)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: config.extension === ext.id ? 'var(--film-pale)' : 'var(--film-text-dim)',
                }}
              >
                {ext.label}
              </button>
            ))}
          </div>

          <div
            className="syne-font"
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 10 }}
          >
            Actions
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
            <ActionButton
              disabled={!hasPoster}
              icon={copied ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
              label={copied ? 'Copied' : 'Copy URL'}
              onClick={handleCopyUrl}
            />
            <ActionButton
              disabled={!hasPoster}
              icon={downloading ? <LoaderCircle size={12} style={{ animation: 'wt-spin 0.8s linear infinite' }} /> : <Download size={12} />}
              label={downloading ? '...' : 'Download'}
              onClick={handleDownload}
              amber
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <ActionButton
              disabled={!hasPoster}
              icon={aioCopied ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
              label={aioCopied ? 'Copied' : 'Copy for AIO'}
              onClick={handleAioCopy}
            />
          </div>

          {/* Builder mode selection — integrated into the export step */}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <div
              className="syne-font"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 10 }}
            >
              Builder Mode
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'simple' as BuilderMode, label: 'Simple Builder', desc: 'Unified panels with source search, layers, and badge editing.' },
                { value: 'advanced' as BuilderMode, label: 'Advanced Builder', desc: 'Dedicated panel navigation for source, layers, badges, and selection.' },
              ].map((option) => {
                const active = builderMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBuilderMode(option.value)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      fontFamily: 'inherit',
                      background: active ? 'rgba(196,124,46,0.08)' : 'rgba(14,13,11,0.72)',
                      border: active
                        ? '1px solid rgba(196,124,46,0.35)'
                        : '1px solid rgba(196,124,46,0.14)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = 'rgba(196,124,46,0.24)';
                        e.currentTarget.style.background = 'rgba(24,22,18,0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = 'rgba(196,124,46,0.14)';
                        e.currentTarget.style.background = 'rgba(14,13,11,0.72)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      {option.value === 'simple' ? <Layout size={13} style={{ color: active ? 'var(--film-amber)' : 'var(--film-text-dim)' }} /> : <Sliders size={13} style={{ color: active ? 'var(--film-amber)' : 'var(--film-text-dim)' }} />}
                      <span className="syne-font" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', color: active ? 'var(--film-cream)' : 'var(--film-text-label)' }}>
                        {option.label}
                      </span>
                    </div>
                    <span className="body-font" style={{ fontSize: 8, color: 'var(--film-text-ghost)', lineHeight: 1.3, display: 'block' }}>
                      {option.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
});

ExportStep.displayName = 'ExportStep';
export default ExportStep;

/* ─── Action Button helper ────────────────────────────────────────────── */

interface ActionButtonProps {
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  amber?: boolean;
}

const ActionButton = memo<ActionButtonProps>(({ disabled, icon, label, onClick, amber }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="syne-font"
    style={{
      height: 34,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      transition: 'all 0.15s',
      background: amber ? 'var(--film-amber)' : 'rgba(255,255,255,0.03)',
      border: amber ? '1px solid rgba(196,124,46,0.3)' : '1px solid rgba(255,255,255,0.08)',
      color: amber ? '#070706' : 'var(--film-text-dim)',
    }}
  >
    {icon}
    {label}
  </button>
));

ActionButton.displayName = 'ActionButton';
