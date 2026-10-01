import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
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

  // Assistant states: 'DISABLED' | 'IDLE' | 'WAKE_WORD_DETECTED' | 'LISTENING' | 'PROCESSING' | 'SPEAKING'
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
    currentSection: null,
  });

  const providerRef = useRef(null);
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

  // Synchronize with external TTS speaking state
  useEffect(() => {
    if (isSpeaking && assistantState !== 'SPEAKING') {
      setAssistantState('SPEAKING');
    } else if (!isSpeaking && assistantState === 'SPEAKING' && isEnabled) {
      setAssistantState('IDLE');
      if (providerRef.current) {
        providerRef.current.resumeWakeListening();
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
          setAssistantState('IDLE');
          providerRef.current.resumeWakeListening();
        }
        return;
      }

      setTranscript(commandText);
      setAssistantState('PROCESSING');
      announce(`Processing: "${commandText}"`);

      try {
        const payload = {
          transcript: commandText,
          sessionId: voiceContextRef.current.sessionId,
          visionSessionId: voiceContextRef.current.visionSessionId,
          activePage: voiceContextRef.current.activePage,
          language: activeLangRef.current || 'en',
        };

        const res = await axios.post('/api/accessibility/voice', payload);
        const data = res.data;

        if (data.success && data.spokenResponse) {
          playEarcon('success');
          setLastResponse(data.spokenResponse);
          setAssistantState('SPEAKING');

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
              setAssistantState('IDLE');
              if (providerRef.current) providerRef.current.resumeWakeListening();
              return;
            }
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
          if (speakText) speakText(fallbackMsg, activeLangRef.current);
        }
      } catch (err) {
        console.warn('[VoiceAssistant] Command execution error:', err);
        const errorMsg = 'I had trouble processing that request. Please try again.';
        setErrorNotice(errorMsg);
        setLastResponse(errorMsg);
        setAssistantState('SPEAKING');
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
      setAssistantState('WAKE_WORD_DETECTED');

      if (hasImmediateCommand && immediateCommand) {
        // User already gave command: "Hey Sarthi, what is the deadline?"
        processCommand(immediateCommand);
      } else {
        // User just said: "Hey Sarthi"
        setAssistantState('LISTENING');
        announce("Hey Sarthi detected. I'm listening.");
      }
    },
    [announce, processCommand, stopSpeaking]
  );

  /**
   * Initialize Wake Word Provider and wire events
   */
  useEffect(() => {
    const provider = getWakeWordProvider({
      lang: activeLanguage === 'hi' ? 'hi-IN' : activeLanguage === 'mr' ? 'mr-IN' : 'en-US',
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
      setAssistantState('IDLE');
    });

    const unbindError = provider.on('error', ({ message }) => {
      setErrorNotice(message);
      announce(message);
      setAssistantState('DISABLED');
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
   * Enable Voice Assistant
   */
  const enableVoiceAssistant = async () => {
    setErrorNotice('');
    if (!providerRef.current || !providerRef.current.isSupported()) {
      const msg = 'Speech recognition is not supported in this browser. You can type or use the push-to-talk button.';
      setErrorNotice(msg);
      announce(msg);
      return false;
    }

    try {
      // Request mic permission explicitly
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Close temporary stream immediately; provider manages SpeechRecognition
        stream.getTracks().forEach((track) => track.stop());
      }

      setIsEnabled(true);
      setAssistantState('IDLE');
      providerRef.current.start();

      const welcomeMsg = "SARTHI Voice Assistant active. Say 'Hey Sarthi' to ask a question.";
      announce(welcomeMsg);
      if (blindMode || voiceMode) {
        if (speakText) speakText("SARTHI is ready. Say 'Hey Sarthi'.", activeLanguage);
      }
      return true;
    } catch (err) {
      console.warn('[VoiceAssistant] Microphone access error:', err);
      let msg = 'Microphone permission was denied. Please allow microphone access in your browser settings to use "Hey Sarthi".';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone was found on your device.';
      }
      setErrorNotice(msg);
      announce(msg);
      setIsEnabled(false);
      setAssistantState('DISABLED');
      return false;
    }
  };

  /**
   * Disable Voice Assistant (full privacy, mic release)
   */
  const disableVoiceAssistant = () => {
    setIsEnabled(false);
    setAssistantState('DISABLED');
    setTranscript('');
    setErrorNotice('');

    if (stopSpeaking) {
      stopSpeaking();
    }
    if (providerRef.current) {
      providerRef.current.stop();
    }
    announce('SARTHI Voice Assistant disabled.');
  };

  /**
   * Push-to-talk trigger (manual wake-up fallback)
   */
  const triggerPushToTalk = () => {
    if (stopSpeaking) stopSpeaking();
    playEarcon('wake');

    if (!isEnabled) {
      enableVoiceAssistant().then((ok) => {
        if (ok && providerRef.current) {
          providerRef.current.startCommandListening();
        }
      });
    } else if (providerRef.current) {
      providerRef.current.startCommandListening();
    }
  };

  /**
   * Cancel current speech / listening and return to IDLE
   */
  const cancelCurrentInteraction = () => {
    if (stopSpeaking) stopSpeaking();
    setTranscript('');
    if (isEnabled && providerRef.current) {
      setAssistantState('IDLE');
      providerRef.current.resumeWakeListening();
    } else {
      setAssistantState('DISABLED');
    }
  };

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
        // If user is inside an input, only trigger if it's Cmd+K or Option+V
        e.preventDefault();
        if (!isEnabled) {
          enableVoiceAssistant();
        } else if (assistantState === 'SPEAKING' || assistantState === 'LISTENING') {
          cancelCurrentInteraction();
        } else {
          triggerPushToTalk();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, assistantState]);

  return (
    <VoiceAssistantContext.Provider
      value={{
        assistantState,
        isEnabled,
        transcript,
        lastResponse,
        errorNotice,
        voiceContext,
        setVoiceContext,
        enableVoiceAssistant,
        disableVoiceAssistant,
        triggerPushToTalk,
        cancelCurrentInteraction,
        isSupported: providerRef.current ? providerRef.current.isSupported() : false,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};
