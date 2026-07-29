import { memo, useMemo, useCallback, useState } from 'react';
import { Copy, Download, Loader2, Check, ExternalLink } from 'lucide-react';
import type { ExtensionType, PosterConfig } from '@/types/poster';
import { generateApiUrl } from '@/builder/utils/url-generator';
import { DEFAULT_API_BASE } from '@/builder/utils/constants';
import { ProgressiveImage } from '@/ui/ProgressiveImage';
import { FilmCorners } from '@/ui/primitives';
import { StepTitle, StepSubtitle } from '../StepPrimitives';

interface ExportStepProps {
  config: PosterConfig;
}

const EXT_OPTIONS: { id: ExtensionType; label: string }[] = [
  { id: 'svg', label: 'SVG' },
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'webp', label: 'WEBP' },
];

const ExportStep = memo<ExportStepProps>(({ config }) => {
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

  const posterPreviewUrl = useMemo(() => {
    try {
      return generateApiUrl({ ...config, extension: 'webp' }, DEFAULT_API_BASE);
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

      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>
        {/* Left: export options */}
        <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
                onClick={() => {
                  const u = new URL(exportUrl || `${DEFAULT_API_BASE}/poster/{imdb_id}.${ext.id}`);
                  // Extension is baked into the URL from generateApiUrl
                  window.open(u.toString(), '_blank', 'noopener,noreferrer');
                }}
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
                  background: config.extension === ext.id ? 'rgba(196,124,46,0.12)' : 'rgba(255,255,255,0.03)',
                  border: config.extension === ext.id
                    ? '1px solid rgba(196,124,46,0.3)'
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
              icon={downloading ? <Loader2 size={12} style={{ animation: 'wt-spin 0.8s linear infinite' }} /> : <Download size={12} />}
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
            <ActionButton
              disabled={!hasPoster}
              icon={<ExternalLink size={12} />}
              label="Open in Builder"
              onClick={() => {
                if (exportUrl) {
                  window.open(`/build?url=${encodeURIComponent(exportUrl)}`, '_blank', 'noopener,noreferrer');
                }
              }}
            />
          </div>
        </div>

        {/* Right: large final preview */}
        <div
          style={{
            flex: '1 1 50%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
          className="max-[800px]:hidden"
        >
          <div
            className="syne-font"
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--film-text-ghost)', marginBottom: 10 }}
          >
            Final Preview
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid rgba(196,124,46,0.14)',
              background: 'rgba(14,13,11,0.72)',
              position: 'relative',
              minHeight: 200,
            }}
          >
            {posterPreviewUrl ? (
              <>
                <ProgressiveImage
                  src={posterPreviewUrl}
                  alt="Final poster preview"
                  containerStyle={{ width: '100%', height: '100%' }}
                  imageStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <FilmCorners />
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--film-text-ghost)',
                  fontSize: 11,
                }}
              >
                Search for a poster to see preview
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile preview */}
      <div className="min-[801px]:hidden" style={{ marginTop: 12 }}>
        <div
          style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(196,124,46,0.14)',
            background: 'rgba(14,13,11,0.72)',
            height: 180,
            position: 'relative',
          }}
        >
          {posterPreviewUrl ? (
            <>
              <ProgressiveImage
                src={posterPreviewUrl}
                alt="Final poster preview"
                containerStyle={{ width: '100%', height: '100%' }}
                imageStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <FilmCorners />
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--film-text-ghost)',
                fontSize: 11,
              }}
            >
              Search for a poster to see preview
            </div>
          )}
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
