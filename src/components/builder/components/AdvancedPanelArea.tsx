// src/components/builder/components/AdvancedPanelArea.tsx
import React, { Suspense } from 'react';
import { HelpCircle } from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import type { AdvancedPanelId } from '../context/EditorContext';
import type { PosterConfig, RatingType } from '../types';

// Shared props passed to all panels
export interface PanelProps {
  config: PosterConfig;
  setConfig: React.Dispatch<React.SetStateAction<PosterConfig>>;
  selectedIds: Set<RatingType>;
  onSelect: (id: RatingType, multi: boolean) => void;
}

// Eager panels (loaded immediately — most commonly needed)
import SourcePanelAdvanced from '../panels/SourcePanelAdvanced';
import BadgesPanelAdvanced from '../panels/BadgesPanelAdvanced';
import LogoPanelAdvanced from '../panels/LogoPanelAdvanced';
import SelectedPanelAdvanced from '../panels/SelectedPanelAdvanced';

// Lazy panels (loaded on first activation)
const PosterPanelAdvanced = React.lazy(() => import('../panels/PosterPanelAdvanced'));
const LayoutPanelAdvanced = React.lazy(() => import('../panels/LayoutPanelAdvanced'));
const FallbacksPanelAdvanced = React.lazy(() => import('../panels/FallbacksPanelAdvanced'));
const AdvancedParamsPanel = React.lazy(() => import('../panels/AdvancedParamsPanel'));
const PresetsTabAdvanced = React.lazy(() => import('../panels/PresetsTabAdvanced'));

const PANEL_LABELS: Record<AdvancedPanelId, string> = {
  source:    'Source',
  poster:    'Poster',
  badges:    'Badges',
  logo:      'Logo',
  layout:    'Layout',
  selected:  'Selection',
  fallbacks: 'Fallbacks',
  advanced:  'Advanced Params',
  presets:   'Presets',
};

const PANEL_HELP: Record<AdvancedPanelId, string> = {
  source:    'Configure the media source, IMDB/TMDB ID, media type, and API keys.',
  poster:    'Apply effects to the background poster image: blur, grayscale, textless, and embed options.',
  badges:    'Style all badges globally — shape, colour, shadow, border, and typography.',
  logo:      'Configure the network/studio logo overlay — position, size, opacity, and border.',
  layout:    'Set badge arrangement: flow direction, preset position, scale, and uniform width.',
  selected:  'Override properties on the currently selected badge(s).',
  fallbacks: 'Configure which providers serve as fallbacks when primary data is unavailable.',
  advanced:  'V3 API parameters: decimal places, MAL ID override, font override, and more.',
  presets:   'Apply a saved configuration preset to the current poster.',
};

interface AdvancedPanelAreaProps extends PanelProps {}

const PanelSkeleton: React.FC = () => (
  <div
    style={{
      flex: 1,
      padding: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}
  >
    {[80, 60, 100, 60, 80].map((w, i) => (
      <div
        key={i}
        style={{
          height: 12,
          width: `${w}%`,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-xs)',
          animation: 'shimmer 1.5s ease infinite',
        }}
      />
    ))}
  </div>
);

/**
 * Routes the right sidebar to the correct advanced panel
 * based on `advancedPanel` from EditorContext.
 * Eagerly loads the 4 most common panels; the rest are lazy.
 */
export const AdvancedPanelArea: React.FC<AdvancedPanelAreaProps> = (props) => {
  const { advancedPanel } = useEditor();
  const [helpVisible, setHelpVisible] = React.useState(false);
  const label = PANEL_LABELS[advancedPanel];
  const helpText = PANEL_HELP[advancedPanel];

  const renderPanel = () => {
    switch (advancedPanel) {
      case 'source':   return <SourcePanelAdvanced {...props} />;
      case 'badges':   return <BadgesPanelAdvanced {...props} />;
      case 'logo':     return <LogoPanelAdvanced {...props} />;
      case 'selected': return <SelectedPanelAdvanced {...props} />;
      case 'poster':   return <Suspense fallback={<PanelSkeleton />}><PosterPanelAdvanced {...props} /></Suspense>;
      case 'layout':   return <Suspense fallback={<PanelSkeleton />}><LayoutPanelAdvanced {...props} /></Suspense>;
      case 'fallbacks':return <Suspense fallback={<PanelSkeleton />}><FallbacksPanelAdvanced {...props} /></Suspense>;
      case 'advanced': return <Suspense fallback={<PanelSkeleton />}><AdvancedParamsPanel {...props} /></Suspense>;
      case 'presets':  return <Suspense fallback={<PanelSkeleton />}><PresetsTabAdvanced {...props} /></Suspense>;
      default:         return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Sticky panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: '1px solid rgba(196,124,46,0.07)',
          background: 'var(--film-dark)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-above)' as unknown as number,
        }}
      >
        <span
          className="syne-font"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--film-amber)',
          }}
        >
          {label}
        </span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setHelpVisible((v) => !v)}
            aria-label={`Help for ${label}`}
            aria-expanded={helpVisible}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--film-text-ghost)',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
              borderRadius: 4,
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--film-text-dim)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--film-text-ghost)')}
          >
            <HelpCircle size={14} />
          </button>
          {helpVisible && (
            <div
              role="tooltip"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 220,
                background: 'var(--film-mid)',
                border: '1px solid rgba(196,124,46,0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-3)',
                fontSize: 11,
                color: 'var(--film-text-label)',
                lineHeight: 1.5,
                boxShadow: 'var(--shadow-sm)',
                zIndex: 'var(--z-top)' as unknown as number,
              }}
            >
              {helpText}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable panel body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {renderPanel()}
      </div>
    </div>
  );
};

export default AdvancedPanelArea;
