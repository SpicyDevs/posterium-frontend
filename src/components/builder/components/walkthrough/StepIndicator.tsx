import React, { memo } from 'react';

interface Props {
  currentStep: number;
  steps: readonly string[];
}

const StepIndicator: React.FC<Props> = memo(({ currentStep, steps }) => (
  <div className="px-4 sm:px-6 pt-4">
    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${((currentStep + 1) / steps.length) * 100}%`,
          background: 'var(--film-amber)',
        }}
      />
    </div>
    <div className="mt-2 text-[11px] syne-font uppercase tracking-wider text-[var(--film-text-dim)]">
      Step {currentStep + 1} · {steps[currentStep]}
    </div>
  </div>
));

StepIndicator.displayName = 'StepIndicator';
export default StepIndicator;
