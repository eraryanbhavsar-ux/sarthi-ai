import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderOpen,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

export default function AccessibilitySummaryCard({ analysis }) {
  if (!analysis) return null;

  const getDifficultyBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'high':
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
    }
  };

  const actionsCount = analysis.requiredActions?.length || 0;
  const docsCount = analysis.requiredDocuments?.length || 0;
  const deadlinesCount = analysis.deadlines?.length || 0;
  const warningsCount = analysis.importantWarnings?.length || 0;

  return (
    <section
      aria-label="Accessibility Executive Summary"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm mb-6 transition-colors"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            ACCESSIBILITY SUMMARY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {analysis.title || 'Document Accessibility Breakdown'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {analysis.contentType || 'Official Notice'}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getDifficultyBadge(analysis.difficultyLevel)}`}>
            Difficulty: {analysis.difficultyLevel || 'Medium'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Action Steps
          </div>
          <p className="text-2xl font-extrabold text-blue-900 dark:text-blue-100">
            {actionsCount}
          </p>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-400">To complete</p>
        </div>

        <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">
            <FolderOpen className="w-4 h-4" />
            Documents
          </div>
          <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
            {docsCount}
          </p>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400">Required proofs</p>
        </div>

        <div className="p-3.5 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/50">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4" />
            Deadlines
          </div>
          <p className="text-2xl font-extrabold text-rose-900 dark:text-rose-100">
            {deadlinesCount}
          </p>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400">Critical cutoffs</p>
        </div>

        <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-1">
            <ShieldAlert className="w-4 h-4" />
            Warnings
          </div>
          <p className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">
            {warningsCount}
          </p>
          <p className="text-[11px] text-purple-600/80 dark:text-purple-400">Compliance notes</p>
        </div>
      </div>

      {/* Visual / Executive Summary Text */}
      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
        <strong className="text-slate-900 dark:text-white">What this is: </strong>
        {analysis.summary}
      </p>

      {/* Important Warnings Banner if present */}
      {analysis.importantWarnings && analysis.importantWarnings.length > 0 && (
        <div className="mt-3.5 p-3 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded-r-xl">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Critical Caution
              </p>
              <ul className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 list-disc list-inside space-y-0.5">
                {analysis.importantWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
