import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '../services/languageRegistry.js';
import { ttsManager } from '../services/voice/textToSpeechProvider.js';

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
  const [speechState, setSpeechState] = useState('IDLE'); // 'IDLE' | 'SPEAKING' | 'PAUSED' | 'STOPPED'
  const [speechQueue, setSpeechQueue] = useState([]);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [ttsNotice, setTtsNotice] = useState('');
  const [currentSpokenLang, setCurrentSpokenLang] = useState('');

  // Stable refs to prevent recreation of callbacks and consumer re-render loops
  const activeLanguageRef = useRef(activeLanguage);
  activeLanguageRef.current = activeLanguage;
  const blindModeRef = useRef(blindMode);
  blindModeRef.current = blindMode;
  const voiceModeRef = useRef(voiceMode);
  voiceModeRef.current = voiceMode;
  const speechRateRef = useRef(speechRate);
  speechRateRef.current = speechRate;
  const availableVoicesRef = useRef(availableVoices);
  availableVoicesRef.current = availableVoices;

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
  const announce = useCallback((message) => {
    if (!message) return;
    setLiveAnnouncement(message);
    setTimeout(() => setLiveAnnouncement(''), 4000);
  }, []);

  /**
   * Find best matching voice dynamically without hardcoding specific voice names.
   */
  const findBestVoice = useCallback((lang = null) => {
    return ttsManager.browserTTS.findVoice(lang || activeLanguageRef.current, availableVoicesRef.current);
  }, []);

  const isVoiceAvailable = useCallback((lang = null) => {
    return ttsManager.browserTTS.hasVoice(lang || activeLanguageRef.current, availableVoicesRef.current);
  }, []);

  const getVoiceStatus = useCallback((lang = null) => {
    return ttsManager.getVoiceStatus(lang || activeLanguageRef.current, availableVoicesRef.current);
  }, []);

  const clearTtsNotice = useCallback(() => setTtsNotice(''), []);

  // Subscribe to Unified TTSManager state machine & queue
  useEffect(() => {
    const unsubscribe = ttsManager.subscribe((state, details) => {
      setSpeechState(state);
      setIsSpeaking(state === 'SPEAKING');
      setIsPaused(state === 'PAUSED');
      setSpeechQueue([...(ttsManager.speechQueue || [])]);
      if (details?.error?.message) {
        setTtsNotice(details.error.message);
        setLiveAnnouncement(details.error.message);
      }
    });
    return unsubscribe;
  }, []);

  // Text-To-Speech function with strict single-instance management & natural chunking
  const speakText = useCallback(async (text, lang = null, options = {}) => {
    if (!text || !text.trim()) {
      return { success: false, error: 'No text provided to read.', code: 'EMPTY_TEXT' };
    }

    const targetLang = lang || activeLanguageRef.current;
    const langInfo = getLanguageInfo(targetLang);
    setCurrentSpokenLang(langInfo.code);
    setTtsNotice('');

    try {
      await ttsManager.speak(text, {
        lang: langInfo.code,
        rate: speechRateRef.current,
        voicesList: availableVoicesRef.current,
        queue: options.queue || false,
      });

      return { success: true };
    } catch (err) {
      console.warn('[AccessibilityContext] Speech playback notice:', err.message);
      const msg = err.message || `${langInfo.nativeName} voice is not available.`;
      setTtsNotice(msg);
      setLiveAnnouncement(msg);
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeechState('STOPPED');
      return { success: false, error: msg, code: err.code || 'VOICE_NOT_AVAILABLE' };
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    ttsManager.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeechState('STOPPED');
    setSpeechQueue([]);
  }, []);

  const pauseSpeaking = useCallback(() => {
    ttsManager.pause();
    setIsPaused(true);
    setSpeechState('PAUSED');
  }, []);

  const resumeSpeaking = useCallback(() => {
    ttsManager.resume();
    setIsPaused(false);
    setSpeechState('SPEAKING');
  }, []);

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
      stopSpeaking();
      setActiveLanguage(value);
      prefObj.preferredLanguage = value;
      announce(`Language set to ${value}`);
    }
    updateUserPreferences(prefObj);
  };

  // High-priority spoken status announcement for voice-first / blind mode
  const speakAnnouncement = useCallback((message, forceSpeak = false) => {
    announce(message);
    if (blindModeRef.current || voiceModeRef.current || forceSpeak) {
      speakText(message, activeLanguageRef.current);
    }
  }, [announce, speakText]);

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
        speechState,
        speechQueue,
        speechRate,
        setSpeechRate,
        availableVoices,
        isVoiceAvailable,
        getVoiceStatus,
        ttsNotice,
        clearTtsNotice,
        currentSpokenLang,
        // Language Center & Registry
        supportedLanguages: SUPPORTED_LANGUAGES,
        getLanguageInfo,
        currentLanguageInfo: getLanguageInfo(activeLanguage),
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
