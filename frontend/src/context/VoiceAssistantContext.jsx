import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api.js';
import { useAccessibility } from './AccessibilityContext.jsx';
import { getWakeWordProvider } from '../services/voice/wakeWordProvider.js';

const VoiceAssistantContext = createContext(null);

export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};

// Subtle Web Audio earcons for voice assistant state transitions
function playEarcon(type = 'wake') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'wake') {
      // Double upbeat chime: C5 (523Hz) -> G5 (784Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'success') {
      // Gentle confirmation chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (_) {}
}

export const VoiceAssistantProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    speakText,
    stopSpeaking,
    isSpeaking,
    activeLanguage,
    setActiveLanguage,
    announce,
    ttsNotice,
    blindMode,
    voiceMode,
  } = useAccessibility();

  // Assistant states:
  // 'DISABLED' | 'REQUESTING_PERMISSION' | 'READY' | 'LISTENING_FOR_WAKE_WORD' |
  // 'WAKE_DETECTED' | 'LISTENING_FOR_COMMAND' | 'PROCESSING' | 'SPEAKING' | 'ERROR'
  const [assistantState, setAssistantState] = useState('DISABLED');
  const [isEnabled, setIsEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [voiceContext, setVoiceContext] = useState({
    activePage: 'landing',
    sessionId: null,
    session: null,
    visionSessionId: null,
    visionSession: null,
    visionContext: null,
    currentSection: null,
  });

  const providerRef = useRef(null);
  const pendingCommandListenRef = useRef(false);
  const activeLangRef = useRef(activeLanguage);
  activeLangRef.current = activeLanguage;

  const voiceContextRef = useRef(voiceContext);
  voiceContextRef.current = voiceContext;

  // Track active page automatically from location
  useEffect(() => {
    const pathname = location.pathname;
    let pageName = 'landing';
    if (pathname.includes('/workspace')) pageName = 'workspace';
    else if (pathname.includes('/vision')) pageName = 'vision';
    else if (pathname.includes('/dashboard')) pageName = 'dashboard';

    setVoiceContext((prev) => ({
      ...prev,
      activePage: pageName,
    }));
  }, [location.pathname]);

  // Synchronize with external TTS speaking state & prevent speech recognition conflict
  useEffect(() => {
    if (isSpeaking) {
      if (assistantState !== 'SPEAKING') {
        setAssistantState('SPEAKING');
      }
      if (providerRef.current) {
        providerRef.current.setSpeaking(true);
      }
    } else if (!isSpeaking && assistantState === 'SPEAKING' && isEnabled) {
      // Speech playback just finished
      if (providerRef.current) {
        providerRef.current.setSpeaking(false);
      }

      if (pendingCommandListenRef.current) {
        // Just finished saying "Yes? How can I help?" -> Start listening for command!
        pendingCommandListenRef.current = false;
        setAssistantState('LISTENING_FOR_COMMAND');
        if (providerRef.current) {
          providerRef.current.startCommandListening();
        }
      } else {
        // Finished speaking answer to a command -> Return to wake-word listening!
        setAssistantState('LISTENING_FOR_WAKE_WORD');
        if (providerRef.current) {
          providerRef.current.setProcessing(false);
          providerRef.current.resumeWakeListening();
        }
      }
    }
  }, [isSpeaking, assistantState, isEnabled]);

  /**
   * Process and execute user command via backend AI
   */
  const processCommand = useCallback(
    async (commandText) => {
      if (!commandText || !commandText.trim()) {
        if (isEnabled && providerRef.current) {
          setAssistantState('LISTENING_FOR_WAKE_WORD');
          providerRef.current.resumeWakeListening();
        }
        return;
      }

      const cleanCmd = commandText.trim();
      setTranscript(cleanCmd);
      setAssistantState('PROCESSING');
      if (providerRef.current) {
        providerRef.current.setProcessing(true);
      }
      announce(`Processing: "${cleanCmd}"`);

      try {
        const payload = {
          transcript: cleanCmd,
          sessionId: voiceContextRef.current.sessionId,
          visionSessionId: voiceContextRef.current.visionSessionId,
          activePage: voiceContextRef.current.activePage,
          currentSection: voiceContextRef.current.currentSection,
          visionContext: voiceContextRef.current.visionContext,
          language: activeLangRef.current || 'en',
        };

        const res = await api.post('/accessibility/voice', payload);
        const data = res.data;

        if (data.success && data.spokenResponse) {
          playEarcon('success');
          setLastResponse(data.spokenResponse);
          setAssistantState('SPEAKING');
          if (providerRef.current) {
            providerRef.current.setSpeaking(true);
          }

          // Handle client-side action if returned by router
          if (data.action) {
            if (data.action.type === 'NAVIGATE' && data.action.payload?.path) {
              navigate(data.action.payload.path);
            } else if (data.action.type === 'SWITCH_LANGUAGE' && data.action.payload?.language) {
              if (setActiveLanguage) {
                setActiveLanguage(data.action.payload.language);
              }
            } else if (data.action.type === 'STOP_AUDIO') {
              if (stopSpeaking) stopSpeaking();
              setAssistantState('LISTENING_FOR_WAKE_WORD');
              if (providerRef.current) {
                providerRef.current.setSpeaking(false);
                providerRef.current.setProcessing(false);
                providerRef.current.resumeWakeListening();
              }
              return;
            }

            // Broadcast action to listening components (e.g., VisionPage)
            window.dispatchEvent(new CustomEvent('sarthi-vision-action', { detail: data.action }));
          }

          // Speak the result in the target language
          const targetLang = data.targetLanguage || activeLangRef.current || 'en';
          if (speakText) {
            speakText(data.spokenResponse, targetLang);
          }
        } else {
          const fallbackMsg = "I'm not sure how to help with that yet. Try asking: 'What is the deadline?' or 'Explain this document.'";
          setLastResponse(fallbackMsg);
          setAssistantState('SPEAKING');
          if (providerRef.current) {
            providerRef.current.setSpeaking(true);
          }
          if (speakText) speakText(fallbackMsg, activeLangRef.current);
        }
      } catch (err) {
        console.warn('[VoiceAssistant] Command execution error:', err);
        const errorMsg = 'I had trouble processing that request. Please try again.';
        setErrorNotice(errorMsg);
        setLastResponse(errorMsg);
        setAssistantState('SPEAKING');
        if (providerRef.current) {
          providerRef.current.setSpeaking(true);
        }
        if (speakText) speakText(errorMsg, activeLangRef.current);
      }
    },
    [announce, isEnabled, navigate, setActiveLanguage, speakText, stopSpeaking]
  );

  /**
   * Handle wake-word detection event
   */
  const handleWakeDetected = useCallback(
    ({ immediateCommand, hasImmediateCommand }) => {
      // 1. Interruption: If currently speaking, immediately stop
      if (stopSpeaking) {
        stopSpeaking();
      }

      playEarcon('wake');
      setAssistantState('WAKE_DETECTED');

      if (hasImmediateCommand && immediateCommand && immediateCommand.trim().length > 1) {
        // User said: "Hey Sarthi, what is the deadline?" in one breath!
        processCommand(immediateCommand.trim());
      } else {
        // User just said: "Hey Sarthi"
        // Respond with "Yes? How can I help?" in the active language
        const greetingMap = {
          hi: 'हाँ? मैं सुन रहा हूँ। मैं क्या मदद करूँ?',
          mr: 'हो? मी ऐकत आहे. काय मदत करू?',
          gu: 'હા? હું સાંભળી રહ્યો છું. હું શું મદદ કરી શકું?',
          bn: 'হ্যাঁ? আমি শুনছি। কীভাবে সাহায্য করব?',
          ta: 'ஆம்? நான் கேட்கிறேன். என்ன உதவி வேண்டும்?',
          te: 'అవును? నేను వింటున్నాను. ఏమి సహాయం కావాలి?',
          kn: 'ಹೌದು? ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ. ಏನು ಸಹಾಯ ಮಾಡಲಿ?',
          ml: 'അതെ? ഞാൻ കേൾക്കുന്നു. എന്ത് സഹായം വേണം?',
          pa: 'ਹਾਂ? ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ। ਕੀ ਮਦਦ ਕਰਾਂ?',
          or: 'ହଁ? ମୁଁ ଶୁଣୁଛି। କଣ ସାହାଯ୍ୟ କରିବି?',
          en: 'Yes? How can I help?',
        };
        const lang = activeLangRef.current || 'en';
        const greeting = greetingMap[lang] || greetingMap.en;

        setLastResponse(greeting);
        setAssistantState('SPEAKING');

        // Stop microphone recognition while greeting is speaking so it doesn't hear itself
        if (providerRef.current) {
          providerRef.current.setSpeaking(true);
        }

        // Set pending flag so on TTS end, we enter LISTENING_FOR_COMMAND
        pendingCommandListenRef.current = true;

        if (speakText) {
          speakText(greeting, lang);
        }
      }
    },
    [processCommand, speakText, stopSpeaking]
  );

  /**
   * Initialize Wake Word Provider and wire events
   */
  useEffect(() => {
    const langMap = {
      hi: 'hi-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      en: 'en-IN',
    };
    const targetLang = langMap[activeLanguage] || 'en-IN';

    const provider = getWakeWordProvider({
      lang: targetLang,
      commandTimeoutMs: 8000,
    });
    providerRef.current = provider;

    const unbindWake = provider.on('wake', (data) => {
      handleWakeDetected(data);
    });

    const unbindCommand = provider.on('command', ({ transcript }) => {
      processCommand(transcript);
    });

    const unbindInterim = provider.on('interimCommand', ({ transcript }) => {
      setTranscript(transcript);
    });

    const unbindTimeout = provider.on('commandTimeout', ({ message }) => {
      announce(message);
      setAssistantState('LISTENING_FOR_WAKE_WORD');
    });

    const unbindError = provider.on('error', ({ message }) => {
      setErrorNotice(message);
      announce(message);
      setAssistantState('ERROR');
      setIsEnabled(false);
    });

    return () => {
      unbindWake();
      unbindCommand();
      unbindInterim();
      unbindTimeout();
      unbindError();
      provider.stop();
    };
  }, [activeLanguage, announce, handleWakeDetected, processCommand]);

  /**
   * Enable Voice Assistant with robust mic permission handling
   */
  const enableVoiceAssistant = useCallback(async () => {
    setErrorNotice('');
    if (typeof window === 'undefined') return false;

    // 1. Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = 'Voice recognition is not supported in this browser. Please use a supported browser or use the Listen button.';
      setErrorNotice(msg);
      setAssistantState('ERROR');
      announce(msg);
      return false;
    }

    // 2. Check secure context
    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const msg = 'Microphone access requires a secure (HTTPS) connection.';
      setErrorNotice(msg);
      setAssistantState('ERROR');
      announce(msg);
      return false;
    }

    // 3. Request microphone permission via navigator.mediaDevices.getUserMedia
    setAssistantState('REQUESTING_PERMISSION');
    announce('Requesting microphone permission');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        // Immediately stop temporary stream tracks to free the audio device
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      console.warn('[VoiceAssistant] getUserMedia error:', err);
      let msg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone was found on your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Microphone is already in use by another application.';
      }
      setErrorNotice(msg);
      announce(msg);
      setAssistantState('ERROR');
      setIsEnabled(false);
      return false;
    }

    // 4. Permission granted: Initialize and start continuous wake word listening
    try {
      setIsEnabled(true);
      setAssistantState('READY');
      announce('Voice Assistant is ready');

      // Controlled transition to LISTENING_FOR_WAKE_WORD
      setTimeout(() => {
        setAssistantState('LISTENING_FOR_WAKE_WORD');
        if (providerRef.current) {
          providerRef.current.start();
        }
      }, 250);

      const welcomeMsg = "SARTHI Voice Assistant active. Say 'Hey Sarthi' to ask a question.";
      announce(welcomeMsg);
      if (blindMode || voiceMode) {
        if (speakText) speakText("SARTHI is ready. Say 'Hey Sarthi'.", activeLanguage);
      }
      return true;
    } catch (err) {
      console.warn('[VoiceAssistant] Start error:', err);
      const msg = err.message || 'Failed to start Voice Assistant';
      setErrorNotice(msg);
      setAssistantState('ERROR');
      setIsEnabled(false);
      return false;
    }
  }, [activeLanguage, announce, blindMode, speakText, voiceMode]);

  /**
   * Disable Voice Assistant (full privacy, mic release)
   */
  const disableVoiceAssistant = useCallback(() => {
    setIsEnabled(false);
    setAssistantState('DISABLED');
    setTranscript('');
    setErrorNotice('');
    pendingCommandListenRef.current = false;

    if (stopSpeaking) {
      stopSpeaking();
    }
    if (providerRef.current) {
      providerRef.current.stop();
    }
    announce('SARTHI Voice Assistant disabled.');
  }, [announce, stopSpeaking]);

  /**
   * Toggle Voice Assistant on / off
   */
  const toggleVoiceAssistant = useCallback(() => {
    if (isEnabled) {
      disableVoiceAssistant();
    } else {
      enableVoiceAssistant();
    }
  }, [disableVoiceAssistant, enableVoiceAssistant, isEnabled]);

  /**
   * Push-to-talk trigger (manual wake-up fallback)
   */
  const triggerPushToTalk = useCallback(async () => {
    if (stopSpeaking) stopSpeaking();
    pendingCommandListenRef.current = false;
    playEarcon('wake');

    if (!isEnabled) {
      const ok = await enableVoiceAssistant();
      if (ok && providerRef.current) {
        setAssistantState('LISTENING_FOR_COMMAND');
        providerRef.current.startCommandListening();
      }
    } else if (providerRef.current) {
      setAssistantState('LISTENING_FOR_COMMAND');
      providerRef.current.startCommandListening();
    }
  }, [enableVoiceAssistant, isEnabled, stopSpeaking]);

  /**
   * Cancel current speech / listening and return to LISTENING_FOR_WAKE_WORD
   */
  const cancelCurrentInteraction = useCallback(() => {
    if (stopSpeaking) stopSpeaking();
    setTranscript('');
    pendingCommandListenRef.current = false;
    if (isEnabled && providerRef.current) {
      setAssistantState('LISTENING_FOR_WAKE_WORD');
      providerRef.current.setSpeaking(false);
      providerRef.current.setProcessing(false);
      providerRef.current.resumeWakeListening();
    } else {
      setAssistantState('DISABLED');
    }
  }, [isEnabled, stopSpeaking]);

  // Global keyboard shortcuts:
  // - Mac: ⌘K or Option+V (⌥V) or ⌘Shift+V
  // - Windows/Linux: Alt+V or Ctrl+Shift+V
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable;

      const isMacOptionV = e.altKey && e.key.toLowerCase() === 'v';
      const isMacCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const isShiftV = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v';

      if (isMacOptionV || isMacCmdK || isShiftV) {
        e.preventDefault();
        if (!isEnabled) {
          enableVoiceAssistant();
        } else if (assistantState === 'SPEAKING' || assistantState === 'LISTENING_FOR_COMMAND') {
          cancelCurrentInteraction();
        } else {
          triggerPushToTalk();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, assistantState, cancelCurrentInteraction, enableVoiceAssistant, triggerPushToTalk]);

  return (
    <VoiceAssistantContext.Provider
      value={{
        assistantState,
        isEnabled,
        isAssistantEnabled: isEnabled, // Ensures Navbar.jsx works seamlessly
        toggleVoiceAssistant,          // Ensures Navbar.jsx button works seamlessly
        transcript,
        lastResponse,
        errorNotice,
        voiceContext,
        setVoiceContext,
        enableVoiceAssistant,
        disableVoiceAssistant,
        triggerPushToTalk,
        cancelCurrentInteraction,
        isSupported: providerRef.current ? providerRef.current.isSupported() : Boolean(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)),
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};
