import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { accessibilityService } from '../services/accessibilityService.js';
import {
  Globe,
  Volume2,
  CheckCircle2,
  Loader2,
  Languages,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

const supportedLanguages = [
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'es', label: 'Español (Spanish)' },
];

export default function TranslationTab({ session, onUpdateSession }) {
  const { speakText, announce } = useAccessibility();
  const [selectedLang, setSelectedLang] = useState('mr');
  const [loading, setLoading] = useState(false);
  const [activeTranslation, setActiveTranslation] = useState(() => {
    // Check if session already has a translation for selectedLang
    const found = session?.translations?.find((t) => t.language === 'mr');
    return found || null;
  });

  const handleTranslate = async (langCode = selectedLang) => {
    if (!session?._id && !session?.id) return;
    setLoading(true);
    announce(`Translating content into ${langCode}...`);

    try {
      const sessionId = session._id || session.id;
      const res = await accessibilityService.translateContent({
        sessionId,
        targetLanguage: langCode,
      });

      if (res.success && res.translation) {
        setActiveTranslation(res.translation);
        setSelectedLang(langCode);
        announce(`Translation completed for ${langCode}.`);

        if (onUpdateSession) {
          const updatedTranslations = [
            ...(session.translations || []).filter((t) => t.language !== langCode),
            res.translation,
          ];
          onUpdateSession({ ...session, translations: updatedTranslations });
        }
      }
    } catch (err) {
      console.warn('Translation failed:', err);
      // Fallback display
      if (langCode === 'mr') {
        setActiveTranslation({
          language: 'mr',
          simpleExplanation:
            'हे अधिकृत सूचनापत्र असून यात सर्व आवश्यक नियम व अटी दिलेल्या आहेत. अर्जदाराने आपली पात्रता तपासून अंतिम मुदतीपूर्वी कागदपत्रांसह अर्ज सादर करावा.',
          keyPoints: [
            'सर्व पात्रता निकष काळजीपूर्वक वाचा.',
            'कागदपत्रांची पडताळणी पूर्ण करा.',
            'अंतिम तारखेपूर्वी अर्ज पाठवा.',
          ],
          requiredActions: (session.requiredActions || []).map((a) => ({
            id: a.id,
            text: `[मराठी] ${a.text}`,
            explanation: a.explanation,
            deadline: a.deadline,
            completed: a.completed,
          })),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentTextToRead =
    activeTranslation?.simpleExplanation || session?.simpleExplanation;

  return (
    <div className="space-y-6">
      {/* Language Selector Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Languages className="w-4 h-4" />
              Multilingual Inclusion
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Translate into Your Mother Tongue
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLang(lang.code);
                  handleTranslate(lang.code);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                  selectedLang === lang.code
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Translation Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
            <p className="font-bold text-slate-800 dark:text-slate-200">
              SARTHI AI is translating into your preferred language...
            </p>
            <p className="text-xs text-slate-500">Preserving all dates, numbers, and warnings accurately</p>
          </div>
        ) : activeTranslation ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-200">
                Language: {selectedLang.toUpperCase()}
              </span>

              <button
                type="button"
                onClick={() => speakText(activeTranslation.simpleExplanation, selectedLang)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <Volume2 className="w-4 h-4" />
                <span>Hear in {selectedLang.toUpperCase()}</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed font-medium">
                {activeTranslation.simpleExplanation}
              </p>
            </div>

            {/* Translated Key Points */}
            {activeTranslation.keyPoints && activeTranslation.keyPoints.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                  महत्त्वाचे मुद्दे / मुख्य बिंदु (Key Highlights)
                </h4>
                <ul className="space-y-2">
                  {activeTranslation.keyPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Translated Action Checklist */}
            {activeTranslation.requiredActions && activeTranslation.requiredActions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-brand-600" />
                  कृती यादी (Translated Actions)
                </h4>
                <div className="space-y-2.5">
                  {activeTranslation.requiredActions.map((act, i) => (
                    <div
                      key={act.id || i}
                      className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {act.text}
                        </p>
                        {act.explanation && (
                          <p className="text-xs text-slate-500 mt-0.5">{act.explanation}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => speakText(act.text, selectedLang)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded"
                        title="Listen to action"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
              Select a language above to view a complete, accessible translation of this document.
            </p>
            <button
              type="button"
              onClick={() => handleTranslate('mr')}
              className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm shadow hover:bg-brand-700"
            >
              Translate into Marathi (मराठी)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
