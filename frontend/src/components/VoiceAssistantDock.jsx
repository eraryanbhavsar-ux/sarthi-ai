import React, { useState } from 'react';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import {
  Mic,
  MicOff,
  Volume2,
  BrainCircuit,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shield,
  HelpCircle,
  X,
} from 'lucide-react';

export default function VoiceAssistantDock() {
  const {
    assistantState,
    isEnabled,
    transcript,
    lastResponse,
    errorNotice,
    enableVoiceAssistant,
    disableVoiceAssistant,
    triggerPushToTalk,
    cancelCurrentInteraction,
    isSupported,
  } = useVoiceAssistant();

  const { blindMode, voiceMode, ttsNotice } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTips, setShowTips] = useState(false);

  // Status configuration mapping
  const statusConfig = {
    DISABLED: {
      badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      dotColor: 'bg-slate-400',
      title: 'Voice Assistant Off',
      subtitle: 'Microphone is disconnected for privacy',
      ariaText: 'SARTHI Voice Assistant is off. Microphone is inactive.',
    },
    IDLE: {
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      dotColor: 'bg-emerald-500 animate-pulse',
      title: 'Ready — Listening for "Hey Sarthi"',
      subtitle: 'Say "Hey Sarthi" or tap speak below',
      ariaText: 'SARTHI Voice Assistant is active and listening for wake word: Hey Sarthi.',
    },
    WAKE_WORD_DETECTED: {
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      dotColor: 'bg-amber-500 animate-ping',
      title: 'Wake Word Detected',
      subtitle: 'Listening...',
      ariaText: 'Hey Sarthi detected. Listening for command.',
    },
    LISTENING: {
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      dotColor: 'bg-sky-500 animate-ping',
      title: 'I\'m Listening...',
      subtitle: 'Speak your question or instruction naturally',
      ariaText: 'SARTHI is listening to your voice command now.',
    },
    PROCESSING: {
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
      dotColor: 'bg-purple-500 animate-spin',
      title: 'Thinking...',
      subtitle: 'SARTHI AI is analyzing your context',
      ariaText: 'SARTHI is thinking and processing your command.',
    },
    SPEAKING: {
      badgeColor: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border-brand-300 dark:border-brand-800',
      dotColor: 'bg-brand-500 animate-pulse',
      title: 'SARTHI is Speaking',
      subtitle: 'Tap stop or say "Hey Sarthi" to interrupt',
      ariaText: 'SARTHI is speaking the answer.',
    },
  };

  const currentStatus = statusConfig[assistantState] || statusConfig.DISABLED;

  const sampleCommands = [
    'What is the deadline?',
    'Translate this into Marathi',
    'What documents do I need?',
    'Explain this document',
    'What should I do first?',
  ];

  return (
    <aside
      aria-label="SARTHI Always-Ready Voice Assistant"
      className="fixed bottom-4 left-4 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-96 select-none font-sans"
    >
      {/* Universal Screen Reader Live Announcer */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="sarthi-voice-live-region"
      >
        {currentStatus.ariaText}
      </div>

      {/* Main Assistant Card */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 overflow-hidden">
        {/* Header Bar */}
        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isEnabled ? 'bg-brand-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}>
              <Mic className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  SARTHI Voice
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-sky-300 font-bold border border-brand-200 dark:border-brand-800">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Wake phrase: <strong className="text-brand-600 dark:text-brand-400 font-bold">"Hey Sarthi"</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowTips(!showTips)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Voice command help tips"
              title="Help & command tips"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              aria-label={isExpanded ? 'Collapse voice assistant dock' : 'Expand voice assistant dock'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        {isExpanded && (
          <div className="p-3.5 space-y-3">
            {/* Status Pill & Privacy Indicator */}
            <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${currentStatus.badgeColor}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${currentStatus.dotColor}`} />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {currentStatus.title}
                  </p>
                  <p className="text-[10px] opacity-80 truncate">
                    {currentStatus.subtitle}
                  </p>
                </div>
              </div>

              {/* State action icon */}
              {assistantState === 'SPEAKING' && (
                <button
                  type="button"
                  onClick={cancelCurrentInteraction}
                  className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-black uppercase hover:bg-rose-700 flex items-center gap-1 shadow-xs"
                  aria-label="Stop speaking"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>Stop</span>
                </button>
              )}
            </div>

            {/* Live Audio Waves when Listening */}
            {assistantState === 'LISTENING' && (
              <div className="flex items-center justify-center gap-1 py-1" aria-hidden="true">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-7 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-1.5 h-8 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <span className="w-1.5 h-3 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            )}

            {/* Live Transcript / Response display */}
            {(transcript || lastResponse) && isEnabled && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 max-h-32 overflow-y-auto">
                {transcript && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">You said:</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium italic">"{transcript}"</p>
                  </div>
                )}
                {lastResponse && (
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-brand-600 dark:text-sky-400 uppercase tracking-wider block">SARTHI:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-normal leading-relaxed">{lastResponse}</p>
                  </div>
                )}
              </div>
            )}

            {/* Error or TTS Notice banner */}
            {(errorNotice || ttsNotice) && (
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{errorNotice || ttsNotice}</span>
              </div>
            )}

            {/* Tips overlay */}
            {showTips && (
              <div className="p-2.5 bg-brand-50 dark:bg-slate-800 rounded-xl border border-brand-200 dark:border-slate-700 text-xs space-y-1.5 relative">
                <button
                  type="button"
                  onClick={() => setShowTips(false)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Close tips"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <p className="font-bold text-brand-900 dark:text-brand-300">Try saying:</p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                  {sampleCommands.map((cmd, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Sparkles className="w-2.5 h-2.5 text-brand-500 flex-shrink-0" />
                      <span>"Hey Sarthi, {cmd}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Controls Row */}
            <div className="flex items-center gap-2 pt-1">
              {/* Push-to-Talk button */}
              <button
                type="button"
                onClick={triggerPushToTalk}
                disabled={!isSupported}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                  assistantState === 'LISTENING'
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                    : 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white'
                }`}
                aria-label={assistantState === 'LISTENING' ? 'Listening to voice command' : 'Tap to speak a voice command'}
              >
                <Mic className="w-4 h-4" />
                <span>{assistantState === 'LISTENING' ? 'Listening...' : 'Tap to Speak'}</span>
              </button>

              {/* Always-on toggle */}
              <button
                type="button"
                onClick={isEnabled ? disableVoiceAssistant : enableVoiceAssistant}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border ${
                  isEnabled
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs'
                }`}
                aria-label={isEnabled ? 'Turn voice assistant off' : 'Enable voice assistant always ready'}
              >
                {isEnabled ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isEnabled ? 'Turn Off' : 'Enable'}</span>
              </button>
            </div>

            {/* Browser & Privacy Footer Notice */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-500" />
                Active while app is open &bull; Privacy preserved
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono border border-slate-200 dark:border-slate-700">
                Alt+V
              </kbd>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
