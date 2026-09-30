import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { accessibilityService } from '../services/accessibilityService.js';
import {
  Sparkles,
  Volume2,
  Smile,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function SimplerModeView({ session, onUpdateSession }) {
  const { speakText, announce } = useAccessibility();
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [evenSimplerData, setEvenSimplerData] = useState(() => {
    if (session?.evenSimplerExplanation) {
      return {
        evenSimplerExplanation: session.evenSimplerExplanation,
        analogyOrExample: 'Think of this like catching a scheduled train: follow the boarding gates and have your documents ready before the door shuts.',
        bulletTakeaways: [
          'Collect your mandatory ID proofs now.',
          'Fill out your application completely before the cutoff.',
          'Save your tracking number.',
        ],
      };
    }
    return null;
  });

  const handleMakeEvenSimpler = async () => {
    if (!session?._id && !session?.id) return;
    setIsSimplifying(true);
    announce('Making explanation even simpler. Reading and simplifying text...');

    try {
      const sessionId = session._id || session.id;
      const res = await accessibilityService.simplifyContent({
        sessionId,
        level: 'evenSimpler',
      });
      if (res.success) {
        setEvenSimplerData(res);
        if (onUpdateSession) {
          onUpdateSession({
            ...session,
            evenSimplerExplanation: res.evenSimplerExplanation,
          });
        }
        announce('Even simpler explanation ready.');
      }
    } catch (err) {
      console.warn('Could not simplify:', err);
      // Fallback
      setEvenSimplerData({
        evenSimplerExplanation:
          'Here it is in everyday words: Find your ID cards today. Fill in your details carefully. Submit before the cutoff date so you do not miss out.',
        analogyOrExample:
          'Like submitting a homework assignment before the bell rings, finishing early avoids any trouble.',
        bulletTakeaways: [
          'Gather your papers.',
          'Fill out the form.',
          'Submit on time.',
        ],
      });
    } finally {
      setIsSimplifying(false);
    }
  };

  const textToRead = evenSimplerData?.evenSimplerExplanation || session?.simpleExplanation;

  return (
    <div className="space-y-6">
      {/* Primary Plain Language Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              PLAIN LANGUAGE BREAKDOWN
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              What This Means
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => speakText(textToRead)}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs sm:text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Listen to plain language explanation"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear This</span>
            </button>

            <button
              type="button"
              onClick={handleMakeEvenSimpler}
              disabled={isSimplifying}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {isSimplifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Simplifying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Make It Even Simpler</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
            {session?.simpleExplanation || session?.summary}
          </p>
        </div>

        {/* Key Points */}
        {session?.keyPoints && session.keyPoints.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Essential Points to Know
            </h4>
            <ul className="space-y-2.5">
              {session.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* "Even Simpler" Mode Card if triggered */}
      {evenSimplerData && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-3xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm uppercase tracking-wider mb-2">
            <Smile className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Maximum Cognitive Clarity Mode
          </div>

          <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
            In Simplest Terms
          </h4>

          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed mb-6">
            {evenSimplerData.evenSimplerExplanation}
          </p>

          {/* Everyday Analogy */}
          {evenSimplerData.analogyOrExample && (
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-amber-200 dark:border-amber-800 mb-6 flex items-start gap-3">
              <Lightbulb className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white text-sm font-bold block">
                  Everyday Analogy:
                </strong>
                <p className="text-slate-700 dark:text-slate-300 text-sm mt-0.5">
                  {evenSimplerData.analogyOrExample}
                </p>
              </div>
            </div>
          )}

          {/* 3 Quick Takeaways */}
          {evenSimplerData.bulletTakeaways && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {evenSimplerData.bulletTakeaways.map((takeaway, i) => (
                <div
                  key={i}
                  className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-center font-bold text-slate-900 dark:text-white text-sm"
                >
                  <span className="block text-2xl mb-1">{['1️⃣', '2️⃣', '3️⃣'][i] || '✨'}</span>
                  {takeaway}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
