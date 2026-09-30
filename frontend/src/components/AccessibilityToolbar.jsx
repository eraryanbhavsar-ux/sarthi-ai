import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import {
  Settings,
  Type,
  Sun,
  Moon,
  Eye,
  Volume2,
  Globe,
  SlidersHorizontal,
  Sparkles,
  ZapOff,
  Minimize2,
  X,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

export default function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    readingMode,
    setReadingMode,
    reducedMotion,
    setReducedMotion,
    simplifiedInterface,
    setSimplifiedInterface,
    voiceMode,
    setVoiceMode,
    activeLanguage,
    setActiveLanguage,
    announce,
  } = useAccessibility();

  // Close on Escape key for keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const resetAll = () => {
    setTextSize('normal');
    setHighContrast('none');
    setReadingMode(false);
    setReducedMotion(false);
    setSimplifiedInterface(false);
    setVoiceMode(false);
    announce('All accessibility preferences reset to default.');
  };

  return (
    <>
      {/* Floating Toolbar Trigger Button - Intentionally positioned and elevated */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-full shadow-2xl transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-400 font-bold text-xs sm:text-sm border-2 border-white/20"
        aria-label="Open Accessibility Controls Toolbar"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        <span className="hidden sm:inline">Accessibility Controls</span>
        <span className="sm:hidden">A11y Controls</span>
        {isOpen && <X className="w-4 h-4 ml-1" aria-hidden="true" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over / Modal Controls Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-toolbar-title"
          className="fixed inset-x-4 bottom-20 sm:inset-auto sm:bottom-24 sm:right-6 z-50 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 overflow-y-auto max-h-[82vh] transition-all"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              <h2 id="a11y-toolbar-title" className="font-bold text-slate-900 dark:text-white text-base">
                Accessibility Toolbar
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAll}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
                title="Reset all settings to default"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1 rounded"
                aria-label="Close accessibility controls"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            {/* 1. Text Sizing */}
            <div>
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Type className="w-4 h-4 text-brand-600" aria-hidden="true" />
                Text Sizing
              </label>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Text Size Selection">
                <button
                  type="button"
                  onClick={() => setTextSize('normal')}
                  className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors ${
                    textSize === 'normal'
                      ? 'bg-brand-600 text-white border-brand-600 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={textSize === 'normal'}
                >
                  Standard (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('large')}
                  className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors ${
                    textSize === 'large'
                      ? 'bg-brand-600 text-white border-brand-600 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={textSize === 'large'}
                >
                  Large (115%)
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('xlarge')}
                  className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors ${
                    textSize === 'xlarge'
                      ? 'bg-brand-600 text-white border-brand-600 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={textSize === 'xlarge'}
                >
                  X-Large (130%)
                </button>
              </div>
            </div>

            {/* 2. High Contrast */}
            <div>
              <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />
                Contrast Themes
              </label>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Contrast Mode Selection">
                <button
                  type="button"
                  onClick={() => setHighContrast('none')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                    highContrast === 'none'
                      ? 'bg-brand-600 text-white border-brand-600 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                  aria-pressed={highContrast === 'none'}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setHighContrast('dark')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                    highContrast === 'dark'
                      ? 'bg-amber-400 text-black border-amber-500 font-bold'
                      : 'bg-slate-900 text-amber-400 border-slate-700 hover:bg-black'
                  }`}
                  aria-pressed={highContrast === 'dark'}
                >
                  <Moon className="w-3 h-3" />
                  Dark Amber
                </button>
                <button
                  type="button"
                  onClick={() => setHighContrast('light')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                    highContrast === 'light'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-black border-black hover:bg-slate-100'
                  }`}
                  aria-pressed={highContrast === 'light'}
                >
                  <Sun className="w-3 h-3" />
                  High Light
                </button>
              </div>
            </div>

            {/* 3. Dyslexia / Cognitive Reading Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-600" aria-hidden="true" />
                  Dyslexia Reading Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enhanced letter, word, and line spacing for easier reading
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={readingMode}
                onClick={() => setReadingMode(!readingMode)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  readingMode ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    readingMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Reduced Motion */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ZapOff className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Reduced Motion
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stops animations, transitions, and pulsing effects
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reducedMotion}
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  reducedMotion ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    reducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 5. Simplified Interface Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Minimize2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  Simplified Interface
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hides secondary cards and background decorations
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={simplifiedInterface}
                onClick={() => setSimplifiedInterface(!simplifiedInterface)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  simplifiedInterface ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    simplifiedInterface ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 6. Voice Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-600" aria-hidden="true" />
                  Voice Narration Mode
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reads out important alerts and screen updates
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={voiceMode}
                onClick={() => setVoiceMode(!voiceMode)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  voiceMode ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    voiceMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 7. Language Selector */}
            <div>
              <label htmlFor="pref-lang" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Globe className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                Interface & Translation Language
              </label>
              <select
                id="pref-lang"
                value={activeLanguage}
                onChange={(e) => setActiveLanguage(e.target.value)}
                className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-400"
              >
                <option value="en">English (Default)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="es">Español (Spanish)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
