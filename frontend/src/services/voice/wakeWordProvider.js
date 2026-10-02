/**
 * SARTHI AI - Wake Word & Voice Recognition Architecture
 *
 * WakeWordProvider
 * ├── BrowserWakeWordProvider (Native Web Speech API with continuous wake-word & command recognition)
 * └── DedicatedWakeWordProvider (Extensible interface for Picovoice Porcupine / OpenWakeWord WASM)
 */

export class WakeWordProvider {
  constructor() {
    this.listeners = new Map();
    this.isActive = false;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[WakeWordProvider] Event listener error (${event}):`, err);
        }
      }
    }
  }

  start() {
    throw new Error('start() must be implemented by subclass');
  }

  stop() {
    throw new Error('stop() must be implemented by subclass');
  }

  isSupported() {
    throw new Error('isSupported() must be implemented by subclass');
  }
}

/**
 * Normalize spoken speech recognition text:
 * - lowercase
 * - trim whitespace
 * - remove unnecessary punctuation
 * - normalize repeated spaces
 */
export function normalizeRecognitionText(rawText = '') {
  if (!rawText) return '';
  return rawText
    .toLowerCase()
    .replace(/[,\.\?!:;\-_"'\(\)\[\]\{\}\/\\~`।॥]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust wake-word regex matching variations of "Hey Sarthi":
 * - "hey sarthi", "Hey Sarthi", "hey, Sarthi", "hey sarathi", "he sarthi"
 * - "hi sarthi", "hello sarthi", "ok sarthi", "okay sarthi"
 * - "हे सारथी", "सार्थी"
 */
export const WAKE_PHRASE_REGEX = /(?:^|\s)(?:hey|he|hi|hello|ok|okay|हे|हाय|हॅलो)\s+(?:sarthi|sarathi|saarthi|सारथी|सार्थी|सारथि)(?:\s|$)/i;

/**
 * BrowserWakeWordProvider
 * Lightweight, zero-dependency browser implementation utilizing standard SpeechRecognition.
 * Real-time pattern matching for "Hey Sarthi" variations without sending ambient audio to servers.
 */
export class BrowserWakeWordProvider extends WakeWordProvider {
  constructor(options = {}) {
    super();
    this.options = {
      lang: options.lang || 'en-IN',
      commandTimeoutMs: options.commandTimeoutMs || 8000,
      ...options,
    };

    this.recognition = null;
    this.mode = 'DISABLED'; // 'DISABLED' | 'READY' | 'LISTENING_FOR_WAKE_WORD' | 'WAKE_DETECTED' | 'LISTENING_FOR_COMMAND' | 'PROCESSING' | 'SPEAKING' | 'ERROR'
    this.isManualStop = false;
    this.isSpeaking = false;
    this.isProcessing = false;
    this.permissionDenied = false;
    this.isRecognizing = false;
    this.restartTimer = null;
    this.commandTimer = null;
  }

  isSupported() {
    return Boolean(
      typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  setLanguage(newLang) {
    if (newLang && this.options.lang !== newLang) {
      this.options.lang = newLang;
      if (this.mode === 'LISTENING_FOR_WAKE_WORD') {
        this.startWakeWordListening();
      }
    }
  }

  setSpeaking(isSpeaking) {
    this.isSpeaking = Boolean(isSpeaking);
    if (this.isSpeaking) {
      this.stopActiveRecognition();
      this.mode = 'SPEAKING';
      this.emit('stateChange', { mode: 'SPEAKING', isListening: false });
    }
  }

  setProcessing(isProcessing) {
    this.isProcessing = Boolean(isProcessing);
    if (this.isProcessing) {
      this.stopActiveRecognition();
      this.mode = 'PROCESSING';
      this.emit('stateChange', { mode: 'PROCESSING', isListening: false });
    }
  }

  stopActiveRecognition() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.commandTimer) {
      clearTimeout(this.commandTimer);
      this.commandTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }
    this.isRecognizing = false;
  }

  start() {
    if (!this.isSupported()) {
      this.emit('error', {
        code: 'UNSUPPORTED',
        message: 'Speech recognition is not supported in this browser.',
      });
      return false;
    }

    this.isActive = true;
    this.isManualStop = false;
    this.permissionDenied = false;
    this.startWakeWordListening();
    return true;
  }

  stop() {
    this.isActive = false;
    this.isManualStop = true;
    this.isSpeaking = false;
    this.isProcessing = false;
    this.mode = 'DISABLED';

    this.stopActiveRecognition();
    this.emit('stateChange', { mode: 'DISABLED', isListening: false });
  }

  startWakeWordListening() {
    if (!this.isActive || this.isManualStop || this.isSpeaking || this.isProcessing || this.permissionDenied) {
      return;
    }

    this.stopActiveRecognition();

    this.mode = 'LISTENING_FOR_WAKE_WORD';
    this.emit('stateChange', { mode: 'LISTENING_FOR_WAKE_WORD', isListening: true });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = this.options.lang;

      rec.onstart = () => {
        this.isRecognizing = true;
        this.emit('start', { mode: this.mode });
      };

      rec.onresult = (event) => {
        if (this.mode !== 'LISTENING_FOR_WAKE_WORD' || this.isSpeaking || this.isProcessing) return;

        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += ' ' + event.results[i][0].transcript;
        }

        const normalized = normalizeRecognitionText(fullTranscript);
        if (!normalized) return;

        // Check for wake word
        const match = WAKE_PHRASE_REGEX.exec(normalized);
        if (match) {
          const wakePhrase = match[0];
          // Extract any immediate command following the wake word
          const postMatch = normalized.substring(match.index + wakePhrase.length).trim();
          const cleanImmediate = postMatch.replace(/^[,:\.\s]+/, '').trim();

          this.handleWakeDetected(cleanImmediate);
        }
      };

      rec.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.permissionDenied = true;
          this.stop();
          this.emit('error', {
            code: 'PERMISSION_DENIED',
            message: 'Microphone permission was denied. Please allow microphone access in your browser settings.',
          });
          return;
        }
        if (event.error === 'audio-capture') {
          this.emit('error', {
            code: 'AUDIO_CAPTURE',
            message: 'No microphone was found or microphone is unavailable.',
          });
          return;
        }

        console.warn('[BrowserWakeWordProvider] Recognition error:', event.error);
      };

      rec.onend = () => {
        this.isRecognizing = false;
        // Controlled restart loop for continuous wake word detection
        if (
          this.isActive &&
          !this.isManualStop &&
          !this.isSpeaking &&
          !this.isProcessing &&
          !this.permissionDenied &&
          this.mode === 'LISTENING_FOR_WAKE_WORD'
        ) {
          if (this.restartTimer) clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            this.startWakeWordListening();
          }, 300);
        }
      };

      this.recognition = rec;
      rec.start();
    } catch (err) {
      this.isRecognizing = false;
      console.warn('[BrowserWakeWordProvider] Start failed:', err);
      if (
        this.isActive &&
        !this.isManualStop &&
        !this.isSpeaking &&
        !this.isProcessing &&
        !this.permissionDenied
      ) {
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => this.startWakeWordListening(), 1000);
      }
    }
  }

  handleWakeDetected(immediateCommand = '') {
    this.stopActiveRecognition();
    this.mode = 'WAKE_DETECTED';
    this.emit('stateChange', { mode: 'WAKE_DETECTED', isListening: false });

    const hasImmediateCommand = Boolean(immediateCommand && immediateCommand.trim().length > 1);

    // Notify listeners that wake word was detected
    this.emit('wake', {
      wakeWord: 'Hey Sarthi',
      immediateCommand: immediateCommand || '',
      hasImmediateCommand,
    });

    if (hasImmediateCommand) {
      // User said: "Hey Sarthi, what is the deadline?" in one breath!
      this.emit('command', { transcript: immediateCommand });
    }
    // Note: If no immediate command was spoken, the caller (VoiceAssistantContext)
    // will speak "Yes? How can I help?" and then invoke startCommandListening()
    // AFTER TTS has completed!
  }

  startCommandListening() {
    if (!this.isActive || this.isManualStop || this.isSpeaking) return;

    this.stopActiveRecognition();
    this.mode = 'LISTENING_FOR_COMMAND';
    this.emit('stateChange', { mode: 'LISTENING_FOR_COMMAND', isListening: true });

    // Set timeout in case user says nothing after "Hey Sarthi"
    if (this.commandTimer) clearTimeout(this.commandTimer);
    this.commandTimer = setTimeout(() => {
      this.emit('commandTimeout', {
        message: "I didn't catch that. Please try again.",
      });
      this.resumeWakeListening();
    }, this.options.commandTimeoutMs);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false; // Capture command utterance
      rec.interimResults = true;
      rec.lang = this.options.lang;

      let finalTranscript = '';
      let lastInterim = '';
      let commandEmitted = false;

      rec.onstart = () => {
        this.isRecognizing = true;
        this.emit('start', { mode: this.mode });
      };

      rec.onresult = (event) => {
        if (this.mode !== 'LISTENING_FOR_COMMAND' || this.isSpeaking) return;

        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const part = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += part;
          } else {
            interim += part;
          }
        }
        lastInterim = interim;

        const currentText = (finalTranscript || interim).trim();
        this.emit('interimCommand', { transcript: currentText });

        if (event.results[0]?.isFinal && currentText && !commandEmitted) {
          commandEmitted = true;
          if (this.commandTimer) clearTimeout(this.commandTimer);
          this.stopActiveRecognition();
          this.mode = 'PROCESSING';
          this.emit('command', { transcript: currentText });
        }
      };

      rec.onerror = (event) => {
        if (this.commandTimer) clearTimeout(this.commandTimer);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('[CommandCapture] Error:', event.error);
        }
      };

      rec.onend = () => {
        this.isRecognizing = false;
        if (this.commandTimer) clearTimeout(this.commandTimer);

        const cleanCmd = (finalTranscript || lastInterim || '').trim();
        if (!commandEmitted && cleanCmd) {
          commandEmitted = true;
          this.stopActiveRecognition();
          this.mode = 'PROCESSING';
          this.emit('command', { transcript: cleanCmd });
        } else if (!commandEmitted) {
          // No command detected, return to wake listening
          this.resumeWakeListening();
        }
      };

      this.recognition = rec;
      rec.start();
    } catch (err) {
      this.isRecognizing = false;
      console.warn('[CommandCapture] Failed to start command recognition:', err);
      this.resumeWakeListening();
    }
  }

  resumeWakeListening() {
    if (this.isActive && !this.isManualStop && !this.isSpeaking && !this.isProcessing) {
      this.startWakeWordListening();
    }
  }
}

/**
 * DedicatedWakeWordProvider (Future Expansion)
 * Architecture stub for integrating offline on-device DSP engines
 * (e.g. Picovoice Porcupine WASM, OpenWakeWord ONNX) for hardware-accelerated wake words.
 */
export class DedicatedWakeWordProvider extends WakeWordProvider {
  constructor(engineConfig = {}) {
    super();
    this.engineConfig = engineConfig;
    this.isLoaded = false;
  }

  isSupported() {
    return Boolean(typeof window !== 'undefined' && window.AudioContext && window.Worker);
  }

  async start() {
    console.info(
      '[DedicatedWakeWordProvider] Dedicated wake-word engine placeholder. To deploy an offline engine, configure Picovoice Porcupine / OpenWakeWord WebAssembly module.'
    );
    return false;
  }

  stop() {
    this.isActive = false;
  }
}

// Default singleton factory
let defaultProviderInstance = null;

export function getWakeWordProvider(options = {}) {
  if (!defaultProviderInstance) {
    defaultProviderInstance = new BrowserWakeWordProvider(options);
  }
  return defaultProviderInstance;
}
