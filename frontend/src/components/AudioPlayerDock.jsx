import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import {
  Play,
  Pause,
  Square,
  Volume2,
  Gauge,
  AlertTriangle,
  X,
  Info,
} from 'lucide-react';

export default function AudioPlayerDock({ textToRead, title = 'Audio Narration', lang }) {
  const {
    isSpeaking,
    isPaused,
    speakText,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    speechRate,
    setSpeechRate,
    activeLanguage,
    ttsNotice,
    clearTtsNotice,
    isVoiceAvailable,
    getVoiceStatus,
  } = useAccessibility();

  const currentLang = lang || activeLanguage;
  const voiceStatus = getVoiceStatus(currentLang);

  if (!isSpeaking && !isPaused && !textToRead && !ttsNotice) return null;

  const handleTogglePlay = () => {
    if (isSpeaking && !isPaused) {
      pauseSpeaking();
    } else if (isPaused) {
      resumeSpeaking();
    } else if (textToRead) {
      speakText(textToRead, currentLang);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeechRate(newSpeed);
    if (isSpeaking && textToRead) {
      speakText(textToRead, currentLang);
    }
  };

  return (
    <div
      role="region"
      aria-label="Audio Playback Bar"
      className="sticky bottom-0 z-30 w-full bg-slate-900/95 text-white backdrop-blur border-t border-slate-800 shadow-2xl py-3 px-4 sm:px-6 transition-all"
    >
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Device TTS Notice Banner if voice is missing */}
        {ttsNotice && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs sm:text-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong className="font-bold">{ttsNotice}</strong>
                <span className="hidden sm:inline text-amber-300/80 ml-2">
                  (Install language speech pack in device/OS settings to enable native pronunciation)
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={clearTtsNotice}
              className="p-1 hover:bg-amber-500/30 rounded text-amber-300"
              aria-label="Dismiss speech notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Indicator & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-6 px-2 bg-brand-600/40 rounded-full border border-brand-500/50">
              {isSpeaking && !isPaused ? (
                <div className="flex items-center gap-1">
                  <span className="w-1 bg-sky-400 rounded-full audio-bar-1" />
                  <span className="w-1 bg-sky-400 rounded-full audio-bar-2" />
                  <span className="w-1 bg-sky-400 rounded-full audio-bar-3" />
                  <span className="w-1 bg-sky-400 rounded-full audio-bar-4" />
                  <span className="w-1 bg-sky-400 rounded-full audio-bar-5" />
                </div>
              ) : (
                <Volume2 className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-sky-400 font-bold uppercase tracking-wider">
                  {isSpeaking && !isPaused ? 'Playing Voice' : isPaused ? 'Audio Paused' : 'Voice Ready'}
                </p>
                {/* Voice Status Pill */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    voiceStatus.available
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                  title={voiceStatus.message}
                >
                  {voiceStatus.available ? 'Voice Installed' : 'Voice Missing on Device'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-200 line-clamp-1 max-w-[240px] sm:max-w-md">
                {title}
              </p>
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs sm:text-sm shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 ${
                !voiceStatus.available && (currentLang === 'mr' || currentLang === 'hi')
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer'
                  : 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white'
              }`}
              aria-label={
                isSpeaking && !isPaused
                  ? 'Pause Speech'
                  : isPaused
                  ? 'Resume Speech'
                  : `Listen in ${currentLang.toUpperCase()}`
              }
            >
              {isSpeaking && !isPaused ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isPaused ? 'Resume' : 'Listen'}</span>
                </>
              )}
            </button>

            {(isSpeaking || isPaused) && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-semibold text-xs border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                aria-label="Stop Speech"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            )}
          </div>

          {/* Right: Speed Multiplier */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 hidden md:inline flex items-center gap-1 mr-1">
              <Gauge className="w-3.5 h-3.5" />
              Speed:
            </span>
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-1 rounded font-bold transition-colors ${
                  speechRate === rate
                    ? 'bg-sky-500 text-black'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
