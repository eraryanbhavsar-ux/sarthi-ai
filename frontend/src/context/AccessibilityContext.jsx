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
  const [activeLanguage, setActiveLanguage] = useState(() => localStorage.getItem('sarthi_language') || 'en');

  // Screen reader live region announcement
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);

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

    localStorage.setItem('sarthi_voice_mode', String(voiceMode));
    localStorage.setItem('sarthi_language', activeLanguage);
  }, [textSize, highContrast, readingMode, reducedMotion, simplifiedInterface, voiceMode, activeLanguage]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Announce messages to screen readers
  const announce = (message) => {
    setLiveAnnouncement(message);
    setTimeout(() => setLiveAnnouncement(''), 3000);
  };

  // Text-To-Speech functions
  const speakText = (text, lang = activeLanguage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      announce('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;

    // Pick best matching voice for language
    if (availableVoices.length > 0) {
      const langPrefix = lang.split('-')[0].toLowerCase();
      const match = availableVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
      if (match) utterance.voice = match;
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

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      announce('Audio stopped.');
    }
  };

  const pauseSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      announce('Audio paused.');
    }
  };

  const resumeSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      announce('Audio resumed.');
    }
  };

  // Speech-To-Text (Microphone) functions
  const startListening = (onResultCallback, onErrorCallback) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = 'Microphone speech recognition is not supported in this browser. You can type your question directly.';
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
        const msg = event.error === 'not-allowed'
          ? 'Microphone access was denied. Please allow microphone permissions in your browser settings.'
          : `Speech input error: ${event.error}`;
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
    } else if (key === 'activeLanguage') {
      setActiveLanguage(value);
      prefObj.preferredLanguage = value;
      announce(`Language set to ${value}`);
    }
    updateUserPreferences(prefObj);
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
        activeLanguage,
        setActiveLanguage: (val) => updatePreferenceAndSync('activeLanguage', val),
        liveAnnouncement,
        announce,
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
