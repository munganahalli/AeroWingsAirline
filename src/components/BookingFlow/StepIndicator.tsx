import React from 'react';
import { Check } from 'lucide-react';
import type { BookingStep } from '../../types/index.ts';

interface StepIndicatorProps {
  currentStep: BookingStep;
  onStepClick: (step: BookingStep) => void;
  maxAccessibleStep: BookingStep;
  isConfirmed?: boolean;
}

const STEPS: { number: BookingStep; label: string; description: string }[] = [
  { number: 1, label: 'Flight Selection', description: 'Choose flight route' },
  { number: 2, label: 'Seat Selection', description: 'Select aircraft seats' },
  { number: 3, label: 'Traveler Details', description: 'Passenger information' },
  { number: 4, label: 'Booking Confirmation', description: 'Review details' },
  { number: 5, label: 'Pay & Verify OTP', description: 'Payment & security' },
];

export function StepIndicator({ currentStep, onStepClick, maxAccessibleStep, isConfirmed }: StepIndicatorProps) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {STEPS.map((step) => {
          const isCurrent = currentStep === step.number;
          const isCompleted = isConfirmed ? true : currentStep > step.number;
          // Once booking is confirmed, do NOT allow returning to steps 1-4!
          const isClickable = !isConfirmed && step.number <= maxAccessibleStep;

          return (
            <button
              key={step.number}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.number)}
              className={`text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                isConfirmed && isCurrent
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-400'
                  : isCurrent
                  ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs ring-1 ring-blue-500'
                  : isCompleted
                  ? isConfirmed
                    ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-75'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 cursor-pointer'
                  : 'bg-white border-transparent text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isConfirmed && isCurrent
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-900 text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isConfirmed && step.number === 5 ? 'Confirmed' : `Step ${step.number}`}
                </div>
                <div
                  className={`text-xs font-bold truncate ${
                    isConfirmed && isCurrent
                      ? 'text-emerald-950'
                      : isCurrent
                      ? 'text-blue-950'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-500'
                  }`}
                >
                  {isConfirmed && step.number === 5 ? 'Ticket Issued' : step.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                  {isConfirmed && step.number === 5 ? 'Valid for travel' : step.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
