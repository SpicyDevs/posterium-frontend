import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/ui/Button';

interface WizardChromeProps {
  step: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  onSkipWalkthrough: () => void;
  nextLabel?: string;
}

const WizardChrome = memo<WizardChromeProps>(
  ({
    step,
    totalSteps,
    isFirstStep,
    isLastStep,
    onBack,
    onSkip,
    onNext,
    onSkipWalkthrough,
    nextLabel,
  }) => (
    <div
      style={{
        marginTop: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(196,124,46,0.08)',
        paddingTop: 16,
        flexShrink: 0,
      }}
    >
      <button
        onClick={onSkipWalkthrough}
        className="syne-font"
        style={{
          background: 'none',
          border: 'none',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--film-text-ghost)',
          cursor: 'pointer',
          transition: 'color 0.15s',
          padding: '6px 0',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--film-text-label)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--film-text-ghost)';
        }}
      >
        Skip walkthrough
      </button>

      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              transition: 'background 0.3s',
              background: i <= step ? 'var(--film-amber)' : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {!isFirstStep && (
          <Button variant="ghost" size="sm" leftIcon={<ChevronLeft size={12} />} onClick={onBack}>
            Back
          </Button>
        )}
        {!isLastStep && (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip step
          </Button>
        )}
        {!isLastStep ? (
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ChevronRight size={12} />}
            onClick={onNext}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ChevronRight size={12} />}
            onClick={onNext}
          >
            {nextLabel || 'Launch Builder'}
          </Button>
        )}
      </div>
    </div>
  )
);

WizardChrome.displayName = 'WizardChrome';
export default WizardChrome;
