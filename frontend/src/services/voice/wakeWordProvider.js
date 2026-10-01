/**
 * SARTHI AI - Wake Word & Voice Recognition Architecture
 *
 * WakeWordProvider
 * ├── BrowserWakeWordProvider (Native Web Speech API with continuous loop)
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
 * BrowserWakeWordProvider
 * Lightweight, zero-dependency browser implementation utilizing standard SpeechRecognition.
 * Real-time pattern matching for "Hey Sarthi" variations without sending ambient audio to servers.
 */
export class BrowserWakeWordProvider extends WakeWordProvider {
  constructor(options = {}) {
    super();
    this.options = {
      lang: options.lang || 'en-US',
      commandTimeoutMs: options.commandTimeoutMs || 7000,
      ...options,
    };

    this.recognition = null;
    this.mode = 'IDLE'; // 'WAKE_WORD_LISTENING' | 'COMMAND_LISTENING' | 'IDLE'
    this.isManualStop = false;
    this.restartTimer = null;
    this.commandTimer = null;

    // Wake phrase regex: matches "Hey Sarthi", "Hi Sarthi", "Sarthi", "हे सारथी", and Indian English/Hindi variants
    this.wakeWordRegex = /\b(hey|hi|hello|ok|okay|ay|aye|oye|arre|bolo|suno|सुनो|हे|अरे)?\s*(sarthi|sarathi|sarathy|saarthi|sharthi|sathi|saathi|sarthee|sarthe|सारथी|सार्थी|सारथि|सारथीजी)\b/i;
  }

  isSupported() {
    return Boolean(
      typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  start() {
    if (!this.isSupported()) {
      this.emit('error', {
        code: 'UNSUPPORTED',
        message: 'Speech recognition is not supported in this browser.',
      });
      return false;
    }

    if (this.isActive) return true;

    this.isActive = true;
    this.isManualStop = false;
    this.startWakeWordListening();
    return true;
  }

  stop() {
    this.isActive = false;
    this.isManualStop = true;
    this.mode = 'IDLE';

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
        this.recognition.abort();
      } catch (_) {}
      this.recognition = null;
    }

    this.emit('stateChange', { mode: 'DISABLED', isListening: false });
  }

  startWakeWordListening() {
    if (!this.isActive || this.isManualStop) return;

    this.mode = 'WAKE_WORD_LISTENING';
    this.emit('stateChange', { mode: 'WAKE_WORD_LISTENING', isListening: true });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      if (this.recognition) {
        try { this.recognition.abort(); } catch (_) {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.lang;

      this.recognition.onstart = () => {
        this.emit('start', { mode: this.mode });
      };

      this.recognition.onresult = (event) => {
        if (this.mode !== 'WAKE_WORD_LISTENING') return;

        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += ' ' + event.results[i][0].transcript;
        }

        const trimmed = fullTranscript.trim();
        if (!trimmed) return;

        // Check for wake word
        const match = this.wakeWordRegex.exec(trimmed);
        if (match) {
          const wakePhrase = match[0];
          // Extract any immediate command following the wake word
          const postMatch = trimmed.substring(match.index + wakePhrase.length).trim();
          const cleanImmediate = postMatch.replace(/^[,:\.\s]+/, '').trim();

          this.handleWakeDetected(cleanImmediate);
        }
      };

      this.recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          // Normal background silence, continue
          return;
        }
        if (event.error === 'not-allowed') {
          this.isActive = false;
          this.emit('error', {
            code: 'PERMISSION_DENIED',
            message: 'Microphone permission was denied. Please allow microphone access.',
          });
          return;
        }

        console.warn('[BrowserWakeWordProvider] Recognition error:', event.error);
      };

      this.recognition.onend = () => {
        // Automatic restart loop for continuous wake word detection
        if (this.isActive && !this.isManualStop && this.mode === 'WAKE_WORD_LISTENING') {
          this.restartTimer = setTimeout(() => {
            this.startWakeWordListening();
          }, 250);
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn('[BrowserWakeWordProvider] Start failed:', err);
      if (this.isActive && !this.isManualStop) {
        this.restartTimer = setTimeout(() => this.startWakeWordListening(), 1000);
      }
    }
  }

  handleWakeDetected(immediateCommand = '') {
    // 1. Temporarily abort wake recognition
    if (this.recognition) {
      try { this.recognition.abort(); } catch (_) {}
    }

    // 2. Notify system that wake word was detected
    this.emit('wake', {
      wakeWord: 'Hey Sarthi',
      immediateCommand,
      hasImmediateCommand: Boolean(immediateCommand && immediateCommand.length > 2),
    });

    if (immediateCommand && immediateCommand.length > 2) {
      // User said: "Hey Sarthi, what is the deadline?" in one breath!
      this.emit('command', { transcript: immediateCommand });
      // Return to wake listening
      setTimeout(() => {
        if (this.isActive && !this.isManualStop) {
          this.startWakeWordListening();
        }
      }, 500);
    } else {
      // Switch into dedicated command capture mode
      this.startCommandListening();
    }
  }

  startCommandListening() {
    this.mode = 'COMMAND_LISTENING';
    this.emit('stateChange', { mode: 'COMMAND_LISTENING', isListening: true });

    // Set timeout in case user says nothing after "Hey Sarthi"
    if (this.commandTimer) clearTimeout(this.commandTimer);
    this.commandTimer = setTimeout(() => {
      this.emit('commandTimeout', {
        message: "I didn't hear a command. Say 'Hey Sarthi' when you're ready.",
      });
      if (this.isActive && !this.isManualStop) {
        this.startWakeWordListening();
      }
    }, this.options.commandTimeoutMs);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.options.lang;

      let finalTranscript = '';
      let lastInterim = '';
      let commandEmitted = false;

      this.recognition.onresult = (event) => {
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
          this.emit('command', { transcript: currentText });
        }
      };

      this.recognition.onerror = (event) => {
        if (this.commandTimer) clearTimeout(this.commandTimer);
        if (event.error !== 'no-speech') {
          console.warn('[CommandCapture] Error:', event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.commandTimer) clearTimeout(this.commandTimer);
        const cleanCmd = (finalTranscript || lastInterim || '').trim();
        if (!commandEmitted && cleanCmd) {
          commandEmitted = true;
          this.emit('command', { transcript: cleanCmd });
        }

        // Return to wake listening after brief pause
        setTimeout(() => {
          if (this.isActive && !this.isManualStop && this.mode !== 'PROCESSING') {
            this.startWakeWordListening();
          }
        }, 600);
      };

      this.recognition.start();
    } catch (err) {
      console.warn('[CommandCapture] Failed to start command recognition:', err);
      if (this.isActive && !this.isManualStop) {
        this.startWakeWordListening();
      }
    }
  }

  resumeWakeListening() {
    if (this.isActive && !this.isManualStop) {
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
