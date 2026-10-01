import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import {
  Globe,
  Check,
  Volume2,
  VolumeX,
  X,
  Search,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';

export default function LanguageCenterModal({ isOpen, onClose }) {
  const {
    activeLanguage,
    setActiveLanguage,
    supportedLanguages,
    isVoiceAvailable,
    getVoiceStatus,
    announce,
  } = useAccessibility();

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredLanguages = supportedLanguages.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      l.englishName.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const handleSelectLanguage = (langCode) => {
    setActiveLanguage(langCode);
    const langInfo = supportedLanguages.find((l) => l.code === langCode);
    announce(`Language switched to ${langInfo?.nativeName} (${langInfo?.englishName})`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-center-title"
      ref={modalRef}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 id="language-center-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🌐 SARTHI Language Center</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold">
                  11 Indian Languages
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Understand, translate, and listen to official documents in your mother tongue
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close language selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by language (e.g. Marathi, हिन्दी, தமிழ், Gujarati)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Language Grid / List */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredLanguages.map((lang) => {
            const isSelected = activeLanguage === lang.code;
            const hasVoice = isVoiceAvailable(lang.code);
            const voiceStatus = getVoiceStatus(lang.code);

            return (
              <div
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectLanguage(lang.code);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                className={`pt-2.5 first:pt-0 p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 border ${
                  isSelected
                    ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/50 shadow-xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang.code.toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900 dark:text-white font-sans">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        ({lang.englishName})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {/* Translation Capability Badge */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>AI Translation</span>
                      </span>

                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>

                      {/* Device Voice Status Badge */}
                      {hasVoice ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 dark:text-sky-400" title={voiceStatus.message}>
                          <Volume2 className="w-3 h-3" />
                          <span>Voice Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400/90" title={voiceStatus.message}>
                          <VolumeX className="w-3 h-3" />
                          <span>Visual Text (No device voice)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelected && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 text-white text-xs font-bold shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Notice */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p>
            <strong>Transparent Accessibility:</strong> SARTHI translates full explanations, steps, and deadlines into all 11 languages. Spoken voice relies on your device&apos;s speech synthesizer (e.g. Marathi <code>mr-IN</code>). If your OS lacks a voice package, visual text is always 100% available.
          </p>
        </div>
      </div>
    </div>
  );
}
