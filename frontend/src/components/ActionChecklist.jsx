import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import {
  CheckSquare,
  Square,
  Volume2,
  Calendar,
  AlertCircle,
  Sparkles,
  Trophy,
} from 'lucide-react';

export default function ActionChecklist({
  actions = [],
  onToggleAction,
  sessionId,
}) {
  const { speakText, announce } = useAccessibility();

  const total = actions.length;
  const completed = actions.filter((a) => a.completed).length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleToggle = (action) => {
    const nextState = !action.completed;
    onToggleAction(action.id, nextState);
    announce(
      nextState
        ? `Checked off: ${action.text}. ${completed + 1} of ${total} actions completed.`
        : `Unchecked: ${action.text}.`
    );
  };

  const handleHearAction = (action, e) => {
    e.stopPropagation();
    const speech = `Action: ${action.text}. Explanation: ${action.explanation || 'No additional instructions.'} ${
      action.deadline ? `Deadline: ${action.deadline}` : ''
    }`;
    speakText(speech);
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Action Mode
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              WHAT DO I NEED TO DO?
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {completed} of {total} Completed
            </span>
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Visual Progress Track */}
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Action Checklist Completion Progress"
          className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700"
        >
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-sky-500 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {completed === total && total > 0 && (
          <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
            <Trophy className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Outstanding! All actions completed.</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                You have fulfilled all required action steps identified by SARTHI AI.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3" role="list" aria-label="Required Actions Checklist">
        {actions.map((act, index) => {
          const isDone = act.completed;
          return (
            <div
              key={act.id || index}
              role="listitem"
              onClick={() => handleToggle(act)}
              className={`group flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none ${
                isDone
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-emerald-300 dark:border-emerald-800 opacity-80'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm'
              }`}
            >
              {/* Accessible Checkbox */}
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                aria-label={`Mark "${act.text}" as ${isDone ? 'incomplete' : 'completed'}`}
                className="mt-0.5 flex-shrink-0 text-brand-600 dark:text-brand-400 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(act);
                }}
              >
                {isDone ? (
                  <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400 fill-emerald-50 dark:fill-emerald-950" />
                ) : (
                  <Square className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-brand-500" />
                )}
              </button>

              {/* Action Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={`text-base sm:text-lg font-bold leading-snug ${
                      isDone
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {act.text}
                  </p>
                </div>

                {act.explanation && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {act.explanation}
                  </p>
                )}

                {act.deadline && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Deadline: {act.deadline}</span>
                  </div>
                )}
              </div>

              {/* Individual Voice Read Button */}
              <button
                type="button"
                onClick={(e) => handleHearAction(act, e)}
                className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label={`Listen to action: ${act.text}`}
                title="Hear this action aloud"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
