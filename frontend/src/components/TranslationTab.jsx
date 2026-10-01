import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { accessibilityService } from '../services/accessibilityService.js';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '../services/languageRegistry.js';
import {
  Globe,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  CheckCircle2,
  Loader2,
  Languages,
  CheckSquare,
  AlertTriangle,
  FileText,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function TranslationTab({ session, onUpdateSession }) {
  const {
    activeLanguage,
    setActiveLanguage,
    speakText,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    isSpeaking,
    isPaused,
    speechState,
    announce,
    isVoiceAvailable,
    getVoiceStatus,
  } = useAccessibility();

  const [selectedLang, setSelectedLang] = useState(activeLanguage !== 'en' ? activeLanguage : 'mr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  // Sync if activeLanguage changes from Language Center or Voice Assistant
  useEffect(() => {
    if (activeLanguage && activeLanguage !== 'en' && activeLanguage !== selectedLang) {
      setSelectedLang(activeLanguage);
    }
  }, [activeLanguage]);

  const langInfo = getLanguageInfo(selectedLang);
  const voiceStatus = getVoiceStatus(selectedLang);

  // Find existing translation in session
  const activeTranslation = session?.translations?.find((t) => t.language === selectedLang) || null;

  // Auto-fetch translation if not already in session
  useEffect(() => {
    if (session && selectedLang && !activeTranslation && !loading && !error) {
      handleTranslate(selectedLang);
    }
  }, [session?._id, session?.id, selectedLang]);

  const handleTranslate = async (langCode = selectedLang) => {
    if (!session?._id && !session?.id) return;
    setLoading(true);
    setError('');
    announce(`Translating content into ${getLanguageInfo(langCode).nativeName}...`);

    try {
      const sessionId = session._id || session.id;
      const res = await accessibilityService.translateContent({
        sessionId,
        targetLanguage: langCode,
      });

      if (res.success && res.translation) {
        setSelectedLang(langCode);
        announce(`Translation completed for ${getLanguageInfo(langCode).englishName}.`);

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
      setError(
        err.message ||
          `Unable to translate into ${getLanguageInfo(langCode).englishName}. Please check your connection or verify backend configuration.`
      );
      announce(`Translation error: ${err.message || 'service unavailable'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHearSpeech = (text) => {
    if (!text) return;
    speakText(text, selectedLang);
  };

  return (
    <div className="space-y-6">
      {/* Language Selector Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Languages className="w-4 h-4" />
              Multilingual Regional Inclusion
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              {langInfo.nativeName} ({langInfo.englishName}) Translation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Understand every deadline, required document, and step in regional script with accurate preservation of dates and values.
            </p>
          </div>

          {/* Quick Language Pill Selector (All 11 Languages) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLang(lang.code);
                  setActiveLanguage(lang.code);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedLang === lang.code
                    ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Device Voice Availability Notice */}
        {!voiceStatus.hasVoice && (
          <div
            role="status"
            className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs sm:text-sm"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {langInfo.nativeName} ({langInfo.englishName}) voice is not installed on this device/browser.
              </p>
              <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-1">
                The visual {langInfo.nativeName} translation below is 100% complete and verified. To hear speech aloud in {langInfo.englishName}, add the speech language pack in your OS settings (Windows Settings &gt; Time &amp; Language &gt; Speech, macOS Voice Settings, or Android Google TTS).
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
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
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
              SARTHI AI is translating into {langInfo.nativeName} ({langInfo.englishName})...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Preserving all dates, numbers, rupees (₹), criteria, and required documents accurately
            </p>
          </div>
        ) : activeTranslation ? (
          <div>
            {/* Action Bar: Compare Original & Regional Audio Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-200">
                  {langInfo.nativeName} &bull; {selectedLang.toUpperCase()}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    voiceStatus.hasVoice
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {voiceStatus.hasVoice ? '● Voice Ready' : '○ Visual Text Available'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Original Text */}
                <button
                  type="button"
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showOriginal ? 'Hide English' : 'Compare with English'}</span>
                </button>

                {/* Primary Regional Listen Button */}
                <button
                  type="button"
                  onClick={() => handleHearSpeech(activeTranslation.simpleExplanation)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  aria-label={langInfo.listenLabel}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{langInfo.listenLabel}</span>
                </button>

                {/* Audio Playback Controls (if speaking or paused) */}
                {(isSpeaking || isPaused) && (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                    {isSpeaking ? (
                      <button
                        type="button"
                        onClick={pauseSpeaking}
                        className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title={langInfo.pauseLabel}
                        aria-label={langInfo.pauseLabel}
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resumeSpeaking}
                        className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title={langInfo.resumeLabel}
                        aria-label={langInfo.resumeLabel}
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      title={langInfo.stopLabel}
                      aria-label={langInfo.stopLabel}
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Compare Original Panel */}
            {showOriginal && (
              <div className="mb-5 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                  Original English Content:
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {session?.simpleExplanation || session?.originalText || session?.summary}
                </p>
              </div>
            )}

            {/* Translated Explanation Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                {langInfo.nativeName} Explanation
              </h4>
              <p className="text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed font-medium">
                {activeTranslation.simpleExplanation}
              </p>
            </div>

            {/* Translated Deadlines Section */}
            {activeTranslation.deadlines && activeTranslation.deadlines.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  अंतिम मुदत / महत्वपूर्ण तिथियाँ (Deadlines)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeTranslation.deadlines.map((dl, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl"
                    >
                      <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-400">
                        {dl.date}
                      </span>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {dl.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Translated Required Documents Section */}
            {activeTranslation.requiredDocuments && activeTranslation.requiredDocuments.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  आवश्यक कागदपत्रे / जरूरी दस्तावेज़ (Required Documents)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTranslation.requiredDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {doc.name}
                        </p>
                        {doc.purpose && (
                          <p className="text-xs text-slate-500 mt-0.5">{doc.purpose}</p>
                        )}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                        {doc.isMandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Translated Key Points */}
            {activeTranslation.keyPoints && activeTranslation.keyPoints.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2.5">
                  महत्त्वाचे मुद्दे / मुख्य बिंदु (Key Highlights)
                </h4>
                <ul className="space-y-2">
                  {activeTranslation.keyPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Translated Action Checklist */}
            {activeTranslation.requiredActions && activeTranslation.requiredActions.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-brand-600" />
                  कृती यादी (Translated Actions Checklist)
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
                        {act.deadline && (
                          <p className="text-[11px] text-rose-600 font-semibold mt-1">
                            Due: {act.deadline}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleHearSpeech(act.text)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                        title={`Listen to: ${act.text}`}
                        aria-label={`Listen to: ${act.text}`}
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
              Select a regional language above to generate a complete, accessible translation.
            </p>
            <button
              type="button"
              onClick={() => handleTranslate(selectedLang)}
              className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm shadow-xs hover:bg-brand-700 transition-colors"
            >
              Translate into {langInfo.nativeName} ({langInfo.englishName})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
