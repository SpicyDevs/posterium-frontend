import { memo } from 'react';
import { ChevronLeft, Wand2, Grid3x3 } from 'lucide-react';

interface BranchChoiceProps {
  onChoose: (branch: 'guided' | 'community') => void;
  onBack: () => void;
}

const BranchChoice = memo<BranchChoiceProps>(({ onChoose, onBack }) => (
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
    <button
      type="button"
      onClick={onBack}
      style={{
        alignSelf: 'flex-start',
        background: 'none',
        border: 'none',
        color: 'var(--film-text-ghost)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 0,
        marginBottom: 24,
        fontFamily: 'inherit',
        fontSize: 11,
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--film-text-label)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--film-text-ghost)';
      }}
    >
      <ChevronLeft size={14} /> Back
    </button>

    <h1
      className="poster-font"
      style={{
        fontSize: 32,
        fontWeight: 400,
        color: 'var(--film-cream)',
        marginBottom: 8,
        textAlign: 'center',
      }}
    >
      How would you like to start?
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
      Configure every detail step by step, or browse community presets.
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
      <button
        type="button"
        onClick={() => onChoose('guided')}
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
          <Wand2 size={18} />
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
            Guided Setup
          </div>
          <div
            className="body-font"
            style={{ fontSize: 10, color: 'var(--film-text-ghost)', lineHeight: 1.3 }}
          >
            Configure every aspect of your poster one step at a time.
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChoose('community')}
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
          <Grid3x3 size={18} />
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
            Community Presets
          </div>
          <div
            className="body-font"
            style={{ fontSize: 10, color: 'var(--film-text-ghost)', lineHeight: 1.3 }}
          >
            Start from a curated example gallery and jump straight into the builder.
          </div>
        </div>
      </button>
    </div>
  </div>
));

BranchChoice.displayName = 'BranchChoice';
export default BranchChoice;
