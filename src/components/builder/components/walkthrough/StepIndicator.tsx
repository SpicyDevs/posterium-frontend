import React from 'react';
import clsx from 'clsx';

interface Props {
  currentStep: number;
  steps: string[];
}

const StepIndicator: React.FC<Props> = ({ currentStep, steps }) => {
  const progress = steps.length <= 1 ? 0 : currentStep / (steps.length - 1);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="w-full max-w-3xl h-1 rounded-full bg-white/10 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            background: 'var(--film-amber)',
          }}
        />
      </div>
      <div className="flex items-center justify-between w-full max-w-3xl">
        {steps.map((label, idx) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={clsx(
                'h-2.5 w-2.5 rounded-full transition-all duration-300',
                idx <= currentStep ? 'scale-110' : 'scale-100'
              )}
              style={{
                background: idx <= currentStep ? 'var(--film-amber)' : 'rgba(255,255,255,0.18)',
                boxShadow: idx === currentStep ? '0 0 12px rgba(196,124,46,0.45)' : 'none',
              }}
            />
            <span
              className="syne-font uppercase tracking-[0.25em]"
              style={{
                fontSize: 9,
                color: idx === currentStep ? 'var(--film-cream)' : 'var(--film-text-dim)',
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
