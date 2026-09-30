import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  HelpCircle,
  Sparkles,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';

export default function StepByStepCard({ steps = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);
  const { speakText, announce } = useAccessibility();

  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        No specific procedural steps detected for this document.
      </div>
    );
  }

  const currentStep = steps[currentIndex];
  const total = steps.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  const handleNext = () => {
    if (!isLast) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      announce(`Step ${nextIdx + 1} of ${total}: ${steps[nextIdx].title}`);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      announce(`Step ${prevIdx + 1} of ${total}: ${steps[prevIdx].title}`);
    }
  };

  const handleHearStep = () => {
    const text = `Step ${currentIndex + 1} of ${total}: ${currentStep.title}. ${currentStep.description}. ${
      currentStep.tip ? `Helpful tip: ${currentStep.tip}` : ''
    }`;
    speakText(text);
  };

  return (
    <div
      role="region"
      aria-label="Step by Step Guidance"
      className="bg-white dark:bg-slate-900 border-2 border-brand-200 dark:border-brand-900/60 rounded-3xl p-6 sm:p-10 shadow-lg transition-colors"
    >
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-extrabold flex items-center justify-center text-sm">
            {currentIndex + 1}
          </span>
          <span className="text-sm font-black tracking-wider uppercase text-brand-600 dark:text-brand-400">
            STEP {currentIndex + 1} OF {total}
          </span>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-8 bg-brand-600 dark:bg-brand-400'
                  : 'w-2.5 bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Main Large Typography Step Title */}
      <div className="my-6">
        <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
          "{currentStep.title}"
        </h3>

        {showExplanation && (
          <div className="mt-4 p-5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/40 text-slate-800 dark:text-slate-200 text-base sm:text-xl leading-relaxed">
            {currentStep.description}
          </div>
        )}

        {currentStep.tip && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-sm">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Helpful Tip: </strong>
              <span>{currentStep.tip}</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHearStep}
            className="flex items-center gap-2 px-4 py-3 bg-brand-100 hover:bg-brand-200 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-800 dark:text-brand-200 rounded-xl font-bold text-sm sm:text-base transition-colors focus:outline-none focus:ring-4 focus:ring-amber-400"
            aria-label="Hear this step read aloud"
          >
            <Volume2 className="w-5 h-5" />
            <span>Hear This</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm sm:text-base transition-colors focus:outline-none focus:ring-4 focus:ring-amber-400"
            aria-label="Toggle step explanation text"
          >
            <HelpCircle className="w-5 h-5" />
            <span>{showExplanation ? 'Hide Details' : 'Explain'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirst}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm sm:text-base transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 ${
              isFirst
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
            }`}
            aria-label="Go to previous step"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isLast}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm sm:text-base transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-amber-400 ${
              isLast
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-brand-600 hover:bg-brand-700 text-white hover:scale-105'
            }`}
            aria-label={isLast ? 'Last step reached' : 'Go to next step'}
          >
            {isLast ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>All Steps Finished</span>
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
