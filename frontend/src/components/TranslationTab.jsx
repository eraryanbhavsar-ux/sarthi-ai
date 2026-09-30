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
  AlertTriangle,
  FileText,
  RefreshCw,
  Info,
} from 'lucide-react';

const supportedLanguages = [
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'es', label: 'Español (Spanish)' },
];

export default function TranslationTab({ session, onUpdateSession }) {
  const { speakText, announce, isVoiceAvailable, getVoiceStatus } = useAccessibility();
  const [selectedLang, setSelectedLang] = useState('mr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeTranslation, setActiveTranslation] = useState(() => {
    // Check if session already has a translation for selectedLang
    const found = session?.translations?.find((t) => t.language === 'mr');
    return found || null;
  });

  const voiceStatus = getVoiceStatus(selectedLang);

  const handleTranslate = async (langCode = selectedLang) => {
    if (!session?._id && !session?.id) return;
    setLoading(true);
    setError('');
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
      } else {
        throw new Error(res.error || 'Failed to generate translation.');
      }
    } catch (err) {
      console.warn('Translation failed:', err);
      // Clean, honest error message — NEVER fake data
      setError(
        err.message ||
          `Unable to translate into ${langCode.toUpperCase()}. Please check your connection or ensure GEMINI_API_KEY is configured on the backend.`
      );
      announce(`Translation error: ${err.message || 'service unavailable'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHearSpeech = (text) => {
    if (!text) return;
    const result = speakText(text, selectedLang);
    if (!result?.success && result?.code === 'VOICE_NOT_AVAILABLE') {
      announce(`${selectedLang === 'mr' ? 'Marathi' : 'Hindi'} voice is not available on this device/browser.`);
    }
  };

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
                  // Check existing translation in session first
                  const existing = session?.translations?.find((t) => t.language === lang.code);
                  if (existing) {
                    setActiveTranslation(existing);
                  } else {
                    handleTranslate(lang.code);
                  }
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

        {/* Device Voice Availability Notice */}
        {!voiceStatus.available && (selectedLang === 'mr' || selectedLang === 'hi') && (
          <div
            role="status"
            className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-800 dark:text-amber-200 text-xs sm:text-sm"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {selectedLang === 'mr' ? 'Marathi' : 'Hindi'} voice is not available on this device/browser.
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
                The visual translation is fully readable below. To listen aloud in native{' '}
                {selectedLang === 'mr' ? 'Marathi' : 'Hindi'}, add the speech pack in your operating system
                settings (Windows Settings &gt; Time &amp; Language &gt; Speech, or Android Google TTS settings).
              </p>
            </div>
          </div>
        )}

        {/* Translation Error Banner */}
        {error && (
          <div
            role="alert"
            className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start justify-between gap-3 text-rose-800 dark:text-rose-200 text-sm"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Translation Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTranslate(selectedLang)}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
            <p className="font-bold text-slate-800 dark:text-slate-200">
              SARTHI AI is translating into your preferred language...
            </p>
            <p className="text-xs text-slate-500 mt-1">Preserving all dates, numbers, and warnings accurately</p>
          </div>
        ) : activeTranslation ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-200">
                  Language: {selectedLang.toUpperCase()}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    voiceStatus.available
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {voiceStatus.available ? '● Native Voice Ready' : '○ Voice Unavailable on Device'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Original Text */}
                <button
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showOriginal ? 'Hide Original' : 'Compare Original'}</span>
                </button>

                {/* Speak in Translated Language */}
                <button
                  type="button"
                  onClick={() => handleHearSpeech(activeTranslation.simpleExplanation)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  aria-label={`Listen in ${selectedLang.toUpperCase()}`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Hear in {selectedLang.toUpperCase()}</span>
                </button>
              </div>
            </div>

            {/* Compare Original Panel if toggled */}
            {showOriginal && (
              <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold uppercase text-slate-500 mb-1 block">Original English Content:</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {session?.simpleExplanation || session?.originalText || session?.summary}
                </p>
              </div>
            )}

            {/* Translated Explanation */}
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
                        onClick={() => handleHearSpeech(act.text)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
                        title="Listen to action"
                        aria-label={`Listen to action: ${act.text}`}
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
              className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm shadow hover:bg-brand-700 transition-colors"
            >
              Translate into Marathi (मराठी)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
