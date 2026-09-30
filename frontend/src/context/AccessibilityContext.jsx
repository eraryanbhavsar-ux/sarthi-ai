import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const { user, updateUserPreferences } = useAuth();

  // Load initial preferences from localStorage or defaults
  const [textSize, setTextSize] = useState(() => localStorage.getItem('sarthi_text_size') || 'normal');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('sarthi_high_contrast') || 'none');
  const [readingMode, setReadingMode] = useState(() => localStorage.getItem('sarthi_reading_mode') === 'true');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('sarthi_reduced_motion') === 'true');
  const [simplifiedInterface, setSimplifiedInterface] = useState(() => localStorage.getItem('sarthi_simplified_ui') === 'true');
  const [voiceMode, setVoiceMode] = useState(() => localStorage.getItem('sarthi_voice_mode') === 'true');
  const [blindMode, setBlindMode] = useState(() => localStorage.getItem('sarthi_blind_mode') === 'true');
  const [lowVisionMode, setLowVisionMode] = useState(() => localStorage.getItem('sarthi_low_vision_mode') === 'true');
  const [activeLanguage, setActiveLanguage] = useState(() => localStorage.getItem('sarthi_language') || 'en');

  // Screen reader live region announcement
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [ttsNotice, setTtsNotice] = useState('');
  const [currentSpokenLang, setCurrentSpokenLang] = useState('');

  // Speech Recognition (STT) state
  const [isListening, setIsListening] = useState(false);
  const [recognitionTranscript, setRecognitionTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Sync with user profile on login
  useEffect(() => {
    if (user?.accessibilityPreferences) {
      const p = user.accessibilityPreferences;
      if (p.textSize) setTextSize(p.textSize);
      if (p.highContrast) setHighContrast(p.highContrast);
      if (typeof p.readingMode === 'boolean') setReadingMode(p.readingMode);
      if (typeof p.reducedMotion === 'boolean') setReducedMotion(p.reducedMotion);
      if (typeof p.simplifiedInterface === 'boolean') setSimplifiedInterface(p.simplifiedInterface);
      if (typeof p.voiceMode === 'boolean') setVoiceMode(p.voiceMode);
      if (typeof p.blindMode === 'boolean') setBlindMode(p.blindMode);
      if (typeof p.lowVisionMode === 'boolean') setLowVisionMode(p.lowVisionMode);
    }
    if (user?.preferredLanguage) {
      setActiveLanguage(user.preferredLanguage);
    }
  }, [user]);

  // Apply CSS classes to document.documentElement
  useEffect(() => {
    const root = document.documentElement;

    // Text size classes
    root.classList.remove('text-size-large', 'text-size-xlarge');
    if (textSize === 'large') root.classList.add('text-size-large');
    if (textSize === 'xlarge') root.classList.add('text-size-xlarge');
    localStorage.setItem('sarthi_text_size', textSize);

    // High contrast classes
    root.classList.remove('contrast-dark', 'contrast-light');
    if (highContrast === 'dark') root.classList.add('contrast-dark');
    if (highContrast === 'light') root.classList.add('contrast-light');
    localStorage.setItem('sarthi_high_contrast', highContrast);

    // Reading mode
    if (readingMode) {
      root.classList.add('reading-mode');
    } else {
      root.classList.remove('reading-mode');
    }
    localStorage.setItem('sarthi_reading_mode', String(readingMode));

    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    localStorage.setItem('sarthi_reduced_motion', String(reducedMotion));

    // Simplified UI
    if (simplifiedInterface) {
      root.classList.add('simplified-ui');
    } else {
      root.classList.remove('simplified-ui');
    }
    localStorage.setItem('sarthi_simplified_ui', String(simplifiedInterface));

    // Blind / Voice-First Mode
    if (blindMode) {
      root.classList.add('blind-voice-mode');
    } else {
      root.classList.remove('blind-voice-mode');
    }
    localStorage.setItem('sarthi_blind_mode', String(blindMode));

    // Low-Vision Mode
    if (lowVisionMode) {
      root.classList.add('low-vision-mode');
    } else {
      root.classList.remove('low-vision-mode');
    }
    localStorage.setItem('sarthi_low_vision_mode', String(lowVisionMode));

    localStorage.setItem('sarthi_voice_mode', String(voiceMode));
    localStorage.setItem('sarthi_language', activeLanguage);
  }, [textSize, highContrast, readingMode, reducedMotion, simplifiedInterface, voiceMode, blindMode, lowVisionMode, activeLanguage]);

  // Load available speech synthesis voices with robust async handling
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const populateVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      } catch (err) {
        console.warn('Voice loading exception:', err);
      }
    };

    // Initial check
    populateVoices();

    // Browser voiceschanged event
    window.speechSynthesis.onvoiceschanged = populateVoices;

    // Async polling fallback for browsers that do not fire onvoiceschanged immediately
    const t1 = setTimeout(populateVoices, 150);
    const t2 = setTimeout(populateVoices, 600);
    const t3 = setTimeout(populateVoices, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Announce messages to screen readers
  const announce = (message) => {
    setLiveAnnouncement(message);
    setTimeout(() => setLiveAnnouncement(''), 4000);
  };

  /**
   * Find best matching voice dynamically without hardcoding specific voice names.
   * Prefer mr-IN or any available Marathi voice.
   */
  const findBestVoice = (lang = activeLanguage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices() || [];
    if (!voices || voices.length === 0) return null;

    const target = (lang || '').toLowerCase().trim();
    const prefix = target.split(/[-_]/)[0]; // 'mr', 'hi', 'en', 'gu', 'ta', 'es'

    // 1. Exact BCP-47 match (e.g. 'mr-in', 'mr_in', 'hi-in')
    const exact = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === target);
    if (exact) return exact;

    // 2. Prefix match on voice language tag
    const prefixMatch = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      return vLang === prefix || vLang.startsWith(`${prefix}-`);
    });
    if (prefixMatch) return prefixMatch;

    // 3. Match by language keyword in voice name
    const keywordMatch = voices.find((v) => {
      const vName = (v.name || '').toLowerCase();
      if (prefix === 'mr' && (vName.includes('marathi') || vName.includes('mr-in') || vName.includes('mr_in'))) return true;
      if (prefix === 'hi' && (vName.includes('hindi') || vName.includes('hi-in') || vName.includes('hi_in'))) return true;
      if (prefix === 'gu' && vName.includes('gujarati')) return true;
      if (prefix === 'ta' && vName.includes('tamil')) return true;
      if (prefix === 'es' && vName.includes('spanish')) return true;
      return false;
    });
    if (keywordMatch) return keywordMatch;

    return null;
  };

  const isVoiceAvailable = (lang = activeLanguage) => {
    return Boolean(findBestVoice(lang));
  };

  const getVoiceStatus = (lang = activeLanguage) => {
    const voice = findBestVoice(lang);
    const prefix = (lang || '').toLowerCase().split(/[-_]/)[0];
    const langNames = {
      mr: 'Marathi',
      hi: 'Hindi',
      gu: 'Gujarati',
      ta: 'Tamil',
      es: 'Spanish',
      en: 'English',
    };
    const langName = langNames[prefix] || (lang ? lang.toUpperCase() : 'Selected language');

    if (voice) {
      return {
        available: true,
        voiceName: voice.name,
        lang: voice.lang,
        message: `${langName} voice ready: ${voice.name}`,
      };
    }
    return {
      available: false,
      voiceName: null,
      lang,
      message: `${langName} voice is not available on this device/browser.`,
    };
  };

  const clearTtsNotice = () => setTtsNotice('');

  // Text-To-Speech function with strict language validation
  const speakText = (text, lang = activeLanguage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      const msg = 'Speech synthesis is not supported on this browser.';
      setTtsNotice(msg);
      announce(msg);
      return { success: false, error: msg, code: 'TTS_UNSUPPORTED' };
    }

    if (!text || !text.trim()) {
      return { success: false, error: 'No text provided to read.', code: 'EMPTY_TEXT' };
    }

    const prefix = (lang || '').toLowerCase().split(/[-_]/)[0];
    const voice = findBestVoice(lang);

    // CRITICAL: If no voice exists for the requested language, DO NOT speak in English or pretend it works
    if (!voice && (prefix === 'mr' || prefix === 'hi')) {
      const msg = prefix === 'mr'
        ? 'Marathi voice is not available on this device/browser.'
        : 'Hindi voice is not available on this device/browser.';
      setTtsNotice(msg);
      announce(msg);

      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      setIsSpeaking(false);
      setIsPaused(false);
      return { success: false, error: msg, code: 'VOICE_NOT_AVAILABLE' };
    }

    // Clear previous notice
    setTtsNotice('');
    setCurrentSpokenLang(lang);

    // Cancel any previous speech
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || (prefix === 'mr' ? 'mr-IN' : prefix === 'hi' ? 'hi-IN' : 'en-US');
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      announce('Reading aloud started.');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      announce('Reading aloud completed.');
    };

    utterance.onpause = () => {
      setIsPaused(true);
      announce('Reading aloud paused.');
    };

    utterance.onresume = () => {
      setIsPaused(false);
      announce('Reading aloud resumed.');
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('Speech synthesis error:', e);
        const errMsg = `Speech synthesis issue: ${e.error || 'playback interrupted'}`;
        setTtsNotice(errMsg);
      }
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    return { success: true };
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      setIsSpeaking(false);
      setIsPaused(false);
      announce('Audio stopped.');
    }
  };

  const pauseSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isSpeaking) {
      try {
        window.speechSynthesis.pause();
        setIsPaused(true);
        announce('Audio paused.');
      } catch (_) {}
    }
  };

  const resumeSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPaused) {
      try {
        window.speechSynthesis.resume();
        setIsPaused(false);
        announce('Audio resumed.');
      } catch (_) {}
    }
  };

  // Speech-To-Text (Microphone) functions
  const startListening = (onResultCallback, onErrorCallback) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = "Voice input isn't supported in this browser. You can type your question instead.";
      announce(msg);
      if (onErrorCallback) onErrorCallback(msg);
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = activeLanguage === 'hi' ? 'hi-IN' : activeLanguage === 'mr' ? 'mr-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionTranscript('');
        announce('Listening for your voice. Speak now.');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setRecognitionTranscript(currentTranscript);
        if (event.results[0].isFinal && onResultCallback) {
          onResultCallback(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        let msg = `Speech input error: ${event.error}`;
        if (event.error === 'not-allowed') {
          msg = 'Microphone access was denied. Please allow microphone permissions in your browser settings or type your question.';
        } else if (event.error === 'no-speech') {
          msg = 'No speech detected. Please speak clearly into your microphone or type your question.';
        }
        announce(msg);
        if (onErrorCallback) onErrorCallback(msg);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err) {
      console.warn('Could not start recognition:', err);
      setIsListening(false);
      if (onErrorCallback) onErrorCallback(err.message);
      return false;
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      announce('Stopped listening.');
    }
  };

  // Sync preference change with user profile
  const updatePreferenceAndSync = (key, value) => {
    const prefObj = {};
    if (key === 'textSize') {
      setTextSize(value);
      prefObj.textSize = value;
      announce(`Text size set to ${value}`);
    } else if (key === 'highContrast') {
      setHighContrast(value);
      prefObj.highContrast = value;
      announce(`High contrast set to ${value}`);
    } else if (key === 'readingMode') {
      setReadingMode(value);
      prefObj.readingMode = value;
      announce(`Dyslexia reading mode ${value ? 'enabled' : 'disabled'}`);
    } else if (key === 'reducedMotion') {
      setReducedMotion(value);
      prefObj.reducedMotion = value;
      announce(`Reduced motion ${value ? 'enabled' : 'disabled'}`);
    } else if (key === 'simplifiedInterface') {
      setSimplifiedInterface(value);
      prefObj.simplifiedInterface = value;
      announce(`Simplified interface ${value ? 'enabled' : 'disabled'}`);
    } else if (key === 'voiceMode') {
      setVoiceMode(value);
      prefObj.voiceMode = value;
      announce(`Voice narration ${value ? 'enabled' : 'disabled'}`);
    } else if (key === 'blindMode') {
      setBlindMode(value);
      prefObj.blindMode = value;
      const msg = `Blind and Voice-First Mode ${value ? 'enabled. Large accessible controls and spoken guidance active.' : 'disabled.'}`;
      announce(msg);
      if (value) speakText(msg, activeLanguage);
    } else if (key === 'lowVisionMode') {
      setLowVisionMode(value);
      prefObj.lowVisionMode = value;
      const msg = `Low-vision high visibility mode ${value ? 'enabled' : 'disabled'}`;
      announce(msg);
      if (blindMode || voiceMode) speakText(msg, activeLanguage);
    } else if (key === 'activeLanguage') {
      setActiveLanguage(value);
      prefObj.preferredLanguage = value;
      announce(`Language set to ${value}`);
    }
    updateUserPreferences(prefObj);
  };

  // High-priority spoken status announcement for voice-first / blind mode
  const speakAnnouncement = (message, forceSpeak = false) => {
    announce(message);
    if (blindMode || voiceMode || forceSpeak) {
      speakText(message, activeLanguage);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize: (val) => updatePreferenceAndSync('textSize', val),
        highContrast,
        setHighContrast: (val) => updatePreferenceAndSync('highContrast', val),
        readingMode,
        setReadingMode: (val) => updatePreferenceAndSync('readingMode', val),
        reducedMotion,
        setReducedMotion: (val) => updatePreferenceAndSync('reducedMotion', val),
        simplifiedInterface,
        setSimplifiedInterface: (val) => updatePreferenceAndSync('simplifiedInterface', val),
        voiceMode,
        setVoiceMode: (val) => updatePreferenceAndSync('voiceMode', val),
        blindMode,
        setBlindMode: (val) => updatePreferenceAndSync('blindMode', val),
        lowVisionMode,
        setLowVisionMode: (val) => updatePreferenceAndSync('lowVisionMode', val),
        activeLanguage,
        setActiveLanguage: (val) => updatePreferenceAndSync('activeLanguage', val),
        liveAnnouncement,
        announce,
        speakAnnouncement,
        // Speech Synthesis
        speakText,
        stopSpeaking,
        pauseSpeaking,
        resumeSpeaking,
        isSpeaking,
        isPaused,
        speechRate,
        setSpeechRate,
        availableVoices,
        isVoiceAvailable,
        getVoiceStatus,
        ttsNotice,
        clearTtsNotice,
        currentSpokenLang,
        // Speech Recognition
        startListening,
        stopListening,
        isListening,
        recognitionTranscript,
      }}
    >
      {/* Universal Screen Reader Live Region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="sarthi-live-announcer"
      >
        {liveAnnouncement}
      </div>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
