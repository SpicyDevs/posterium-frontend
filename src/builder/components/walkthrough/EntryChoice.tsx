import { memo } from 'react';
import { BookOpen, Layout, Sliders, Grid3x3 } from 'lucide-react';

interface EntryChoiceProps {
  onChoose: (choice: 'walkthrough' | 'simple' | 'advanced' | 'community') => void;
}

const OPTIONS = [
  {
    id: 'walkthrough' as const,
    icon: <BookOpen size={18} />,
    title: 'Guided Walkthrough',
    description:
      'Step-by-step poster builder. Choose a poster source, theme, ratings, and export format.',
  },
  {
    id: 'simple' as const,
    icon: <Layout size={18} />,
    title: 'Simple Builder',
    description: 'Jump straight into the streamlined builder with unified panels.',
  },
  {
    id: 'advanced' as const,
    icon: <Sliders size={18} />,
    title: 'Advanced Builder',
    description:
      'Full panel navigation with dedicated source, layers, badges, and selection panels.',
  },
  {
    id: 'community' as const,
    icon: <Grid3x3 size={18} />,
    title: 'Community Presets',
    description: 'Start from a curated example gallery and jump straight into the builder.',
  },
];

const EntryChoice = memo<EntryChoiceProps>(({ onChoose }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}
  >
    <h1
      className="poster-font"
      style={{
        fontSize: 36,
        fontWeight: 400,
        color: 'var(--film-cream)',
        marginBottom: 8,
        textAlign: 'center',
      }}
    >
      Welcome to Posterium
    </h1>
    <p
      className="body-font"
      style={{
        fontSize: 13,
        color: 'var(--film-text-dim)',
        marginBottom: 32,
        textAlign: 'center',
        maxWidth: 400,
      }}
    >
      Choose how you'd like to start building your poster.
    </p>

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        maxWidth: 420,
      }}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChoose(opt.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 16,
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            textAlign: 'left',
            width: '100%',
            fontFamily: 'inherit',
            background: 'rgba(14,13,11,0.72)',
            border: '1px solid rgba(196,124,46,0.14)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(196,124,46,0.35)';
            e.currentTarget.style.background = 'rgba(196,124,46,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(196,124,46,0.14)';
            e.currentTarget.style.background = 'rgba(14,13,11,0.72)';
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(196,124,46,0.1)',
              border: '1px solid rgba(196,124,46,0.2)',
              flexShrink: 0,
              color: 'var(--film-amber)',
            }}
          >
            {opt.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="syne-font"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--film-cream)',
                marginBottom: 3,
              }}
            >
              {opt.title}
            </div>
            <div
              className="body-font"
              style={{ fontSize: 10, color: 'var(--film-text-ghost)', lineHeight: 1.3 }}
            >
              {opt.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
));

EntryChoice.displayName = 'EntryChoice';
export default EntryChoice;
