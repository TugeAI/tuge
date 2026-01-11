'use client';

import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[var(--brand-violet)] text-white'
                    : isCurrent
                    ? 'bg-gradient-to-r from-[var(--brand-violet)] to-[var(--brand-purple)] text-white shadow-lg'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                }`}
              >
                {isCompleted ? <Check size={18} strokeWidth={3} /> : step.id}
              </div>
              <span
                className={`text-xs mt-2 transition-colors duration-300 ${
                  isCurrent
                    ? 'text-[var(--brand-violet)] font-medium'
                    : isCompleted
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 mb-6 transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-[var(--brand-violet)]'
                    : 'bg-[var(--bg-muted)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;







