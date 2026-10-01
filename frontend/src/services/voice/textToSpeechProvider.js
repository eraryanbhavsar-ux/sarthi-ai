/**
 * SARTHI Pluggable Text-to-Speech (TTS) Architecture
 *
 * TextToSpeechProvider
 * ├── BrowserTTSProvider   (Offline, zero-latency Web Speech API with sentence chunking & GC protection)
 * └── BackendTTSProvider   (Server-side cloud/regional audio fallback via POST /api/accessibility/tts)
 * └── TTSManager           (Single speech engine, IDLE/SPEAKING/PAUSED/STOPPED states, queue & deduplication)
 */

import { getLanguageInfo, LANGUAGE_CONFIG } from '../languageRegistry.js';

/**
 * Split long text into natural sentence/clause chunks.
 * Preserves sentence delimiters (., !, ?, ।, ॥, ;, \n) and never drops trailing text.
 * Target chunk size: 120–200 characters for optimal prosody and browser speech synthesis stability.
 */
export function chunkTextForSpeech(text = '', maxChunkLength = 180) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.replace(/[*#_`~]/g, '').trim();
  if (!clean) return [];
  if (clean.length <= maxChunkLength && !clean.includes('\n')) return [clean];

  // Regex to split on sentence boundaries including Hindi/Marathi danda (।), double danda (॥), ., !, ?, ;, \n
  const sentenceRegex = /[^.!?;\n।॥]+(?:[.!?;\n।॥]+|$)/g;
  const rawSentences = [];
  let match;
  while ((match = sentenceRegex.exec(clean)) !== null) {
    const s = match[0].trim();
    if (s) rawSentences.push(s);
  }

  if (rawSentences.length === 0) {
    rawSentences.push(clean);
  }

  const finalChunks = [];
  for (const sentence of rawSentences) {
    if (sentence.length <= maxChunkLength) {
      finalChunks.push(sentence);
    } else {
      // Split sentence that exceeds maxChunkLength by clause markers (,, ;, —, -)
      const subParts = sentence.split(/([,;—\-]+)/);
      let buffer = '';
      for (const part of subParts) {
        if (!part) continue;
        if ((buffer + part).length <= maxChunkLength) {
          buffer += part;
        } else {
          if (buffer.trim()) finalChunks.push(buffer.trim());
          if (part.length <= maxChunkLength) {
            buffer = part;
          } else {
            // Word-by-word fallback if even a single clause is > maxChunkLength
            const words = part.split(/\s+/);
            let wBuf = '';
            for (const w of words) {
              if ((wBuf + ' ' + w).length <= maxChunkLength) {
                wBuf = wBuf ? wBuf + ' ' + w : w;
              } else {
                if (wBuf.trim()) finalChunks.push(wBuf.trim());
                wBuf = w;
              }
            }
            buffer = wBuf;
          }
        }
      }
      if (buffer.trim()) finalChunks.push(buffer.trim());
    }
  }

  return finalChunks.filter((c) => Boolean(c && c.trim().length > 0));
}

// Global set to retain utterances and prevent Chromium/WebKit garbage-collection dropouts
if (typeof window !== 'undefined' && !window.__SARTHI_ACTIVE_UTTERANCES__) {
  window.__SARTHI_ACTIVE_UTTERANCES__ = new Set();
}

/**
 * 1. Browser SpeechSynthesis Provider
 * - Sequential sentence-by-sentence queue
 * - Natural 60ms pause between chunks for human-like cadence
 * - GC retention preventing audio cut-off after 5-10s
 * - Safe cancellation settlement avoiding browser race conditions
 */
export class BrowserTTSProvider {
  constructor() {
    this.currentUtterance = null;
    this.isPaused = false;
    this.activeChunks = [];
    this.currentChunkIndex = 0;
    this.isAborted = false;
    this.chunkTimeoutId = null;
  }

  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Find matching browser voice for language code
   */
  findVoice(langCode, customVoicesList = null) {
    if (!this.isSupported()) return null;
    const voices = customVoicesList || window.speechSynthesis.getVoices() || [];
    if (!voices || voices.length === 0) return null;

    const langInfo = getLanguageInfo(langCode);
    const targetCode = langInfo.code;
    const targetLocale = langInfo.locale.toLowerCase();
    const bcp47List = (langInfo.bcp47 || []).map((t) => t.toLowerCase());

    // 1. Exact BCP-47 match (e.g. 'mr-in', 'hi-in')
    const exact = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return bcp47List.includes(vLang) || vLang === targetLocale;
    });
    if (exact) return exact;

    // 2. Prefix match (e.g. 'mr', 'hi')
    const prefix = voices.find((v) => {
      const vLang = (v.lang || '').toLowerCase().replace('_', '-');
      return vLang === targetCode || vLang.startsWith(`${targetCode}-`);
    });
    if (prefix) return prefix;

    // 3. Keyword match in voice name
    const keyword = voices.find((v) => {
      const vName = (v.name || '').toLowerCase();
      return langInfo.keywords.some((kw) => vName.includes(kw.toLowerCase()));
    });
    if (keyword) return keyword;

    return null;
  }

  hasVoice(langCode, customVoicesList = null) {
    return Boolean(this.findVoice(langCode, customVoicesList));
  }

  /**
   * Speak text sequentially across chunks using native browser SpeechSynthesis
   */
  async speak(text, {
    lang = 'en',
    rate = 0.95,
    pitch = 1.0,
    volume = 1.0,
    voicesList = null,
    onStart,
    onEnd,
    onPause,
    onResume,
    onError,
    onChunkChange,
  } = {}) {
    if (!this.isSupported()) {
      const err = new Error('Browser SpeechSynthesis is not supported.');
      err.code = 'TTS_UNSUPPORTED';
      throw err;
    }

    const voice = this.findVoice(lang, voicesList);
    const langInfo = getLanguageInfo(lang);

    // Stop and settle previous speech
    this.stop();
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 50));
    }

    this.isAborted = false;
    this.isPaused = false;
    this.activeChunks = chunkTextForSpeech(text);
    this.currentChunkIndex = 0;

    if (this.activeChunks.length === 0) {
      if (onEnd) onEnd();
      return { completed: true };
    }

    if (onStart) {
      onStart({
        totalChunks: this.activeChunks.length,
        langInfo,
        voiceName: voice?.name || 'Default System Voice',
      });
    }

    return new Promise((resolve, reject) => {
      const speakNextChunk = () => {
        if (this.isAborted) {
          resolve({ stopped: true });
          return;
        }

        if (this.currentChunkIndex >= this.activeChunks.length) {
          this.cleanupUtterance();
          if (onEnd) onEnd();
          resolve({ completed: true });
          return;
        }

        const chunkText = this.activeChunks[this.currentChunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunkText);

        // Natural speech parameters: rate 0.9–1.0, pitch 1.0, volume 1.0
        utterance.rate = Math.min(Math.max(rate || 0.95, 0.85), 1.05);
        utterance.pitch = pitch || 1.0;
        utterance.volume = volume || 1.0;

        // Correctly set language locale — NEVER fall back to 'en-US' for regional speech!
        utterance.lang = voice ? (voice.lang || langInfo.locale) : langInfo.locale;
        if (voice) {
          utterance.voice = voice;
        }

        // Retain utterance in global Set to prevent Chromium garbage-collection dropouts
        if (typeof window !== 'undefined' && window.__SARTHI_ACTIVE_UTTERANCES__) {
          window.__SARTHI_ACTIVE_UTTERANCES__.add(utterance);
        }

        utterance.onstart = () => {
          if (this.isAborted) {
            try {
              window.speechSynthesis.cancel();
            } catch (_) {}
            return;
          }
        };

        utterance.onpause = () => {
          this.isPaused = true;
          if (onPause) onPause();
        };

        utterance.onresume = () => {
          this.isPaused = false;
          if (onResume) onResume();
        };

        utterance.onend = () => {
          if (typeof window !== 'undefined' && window.__SARTHI_ACTIVE_UTTERANCES__) {
            window.__SARTHI_ACTIVE_UTTERANCES__.delete(utterance);
          }
          if (this.isAborted) {
            resolve({ stopped: true });
            return;
          }

          this.currentChunkIndex++;

          // Natural breathing pause (60ms) between sentences to prevent audio clipping/stutter
          this.chunkTimeoutId = setTimeout(() => {
            speakNextChunk();
          }, 60);
        };

        utterance.onerror = (e) => {
          if (typeof window !== 'undefined' && window.__SARTHI_ACTIVE_UTTERANCES__) {
            window.__SARTHI_ACTIVE_UTTERANCES__.delete(utterance);
          }
          if (e.error === 'canceled' || e.error === 'interrupted' || this.isAborted) {
            resolve({ canceled: true });
            return;
          }
          console.warn('[BrowserTTS] Error during speech chunk:', e);
          if (onError) onError(e);
          reject(e);
        };

        this.currentUtterance = utterance;
        if (onChunkChange) {
          onChunkChange({
            currentIndex: this.currentChunkIndex,
            totalChunks: this.activeChunks.length,
            text: chunkText,
          });
        }

        window.speechSynthesis.speak(utterance);
      };

      speakNextChunk();
    });
  }

  cleanupUtterance() {
    if (this.chunkTimeoutId) {
      clearTimeout(this.chunkTimeoutId);
      this.chunkTimeoutId = null;
    }
    if (this.currentUtterance) {
      if (typeof window !== 'undefined' && window.__SARTHI_ACTIVE_UTTERANCES__) {
        window.__SARTHI_ACTIVE_UTTERANCES__.delete(this.currentUtterance);
      }
      this.currentUtterance = null;
    }
  }

  pause() {
    if (!this.isSupported()) return;
    this.isPaused = true;
    try {
      window.speechSynthesis.pause();
    } catch (_) {}
  }

  resume() {
    if (!this.isSupported()) return;
    this.isPaused = false;
    try {
      window.speechSynthesis.resume();
    } catch (_) {}
  }

  stop() {
    this.isAborted = true;
    this.isPaused = false;
    this.activeChunks = [];
    this.currentChunkIndex = 0;
    this.cleanupUtterance();

    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }
}

/**
 * Resolve the canonical backend TTS endpoint URL dynamically from environment configuration
 */
export function getDefaultTtsEndpoint() {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
  if (base && base.trim() !== '') {
    return `${base.trim().replace(/\/+$/, '')}/accessibility/tts`;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://sarthi-ai-szqy.onrender.com/api/accessibility/tts';
    }
  }
  return '/api/accessibility/tts';
}

/**
 * 2. Backend Cloud TTS Provider
 * - Server-side regional streaming (Hindi, Marathi, Gujarati, etc.)
 * - AbortController on fetch to ensure canceled requests NEVER start playing audio
 * - Full HTMLAudioElement event lifecycle management
 */
export class BackendTTSProvider {
  constructor(endpointUrl = null) {
    this.endpointUrl = endpointUrl || getDefaultTtsEndpoint();
    this.currentAudio = null;
    this.isPaused = false;
    this.abortController = null;
    this.isAborted = false;
  }

  async isConfigured() {
    try {
      const res = await fetch(`${this.endpointUrl}/status`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data?.configured);
    } catch (_) {
      return false;
    }
  }

  async speak(text, {
    lang = 'mr',
    rate = 1.0,
    onStart,
    onEnd,
    onPause,
    onResume,
    onError,
  } = {}) {
    this.stop();
    this.isAborted = false;
    const langInfo = getLanguageInfo(lang);

    const abortController = new AbortController();
    this.abortController = abortController;

    let response;
    try {
      response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: langInfo.code,
          locale: langInfo.locale,
        }),
        signal: abortController.signal,
      });
    } catch (fetchErr) {
      if (fetchErr.name === 'AbortError' || this.isAborted) {
        return { stopped: true };
      }
      throw fetchErr;
    }

    if (this.isAborted) return { stopped: true };

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const err = new Error(errorJson.message || errorJson.error || `Regional speech service error (${response.status})`);
      err.code = errorJson.code || 'BACKEND_TTS_ERROR';
      throw err;
    }

    const data = await response.json();
    if (this.isAborted) return { stopped: true };

    if (!data.success || !data.audioBase64) {
      throw new Error(data.message || data.error || 'No audio returned from regional speech service.');
    }

    const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
    const audio = new Audio(audioSrc);
    audio.playbackRate = Math.min(Math.max(rate || 1.0, 0.85), 1.15);
    audio.volume = 1.0;
    this.currentAudio = audio;

    return new Promise((resolve, reject) => {
      audio.onplay = () => {
        if (this.isAborted) {
          audio.pause();
          resolve({ stopped: true });
          return;
        }
        if (onStart) onStart({ provider: data.provider || 'backend', langInfo });
      };

      audio.onpause = () => {
        if (!this.isAborted) {
          this.isPaused = true;
          if (onPause) onPause();
        }
      };

      audio.onended = () => {
        this.cleanupAudio();
        if (onEnd) onEnd();
        resolve({ completed: true });
      };

      audio.onerror = (e) => {
        this.cleanupAudio();
        if (this.isAborted) {
          resolve({ stopped: true });
          return;
        }
        console.warn('[BackendTTS] Audio playback error:', e);
        if (onError) onError(e);
        reject(e);
      };

      audio.play().catch((playErr) => {
        if (this.isAborted || playErr.name === 'AbortError') {
          resolve({ stopped: true });
          return;
        }
        console.warn('[BackendTTS] Audio play() promise rejected:', playErr);
        this.cleanupAudio();
        reject(playErr);
      });
    });
  }

  cleanupAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
        this.currentAudio.onplay = null;
        this.currentAudio.onpause = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
      } catch (_) {}
      this.currentAudio = null;
    }
  }

  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch((err) => console.warn('[BackendTTS] Resume play error:', err));
      this.isPaused = false;
    }
  }

  stop() {
    this.isAborted = true;
    this.isPaused = false;
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (_) {}
      this.abortController = null;
    }
    this.cleanupAudio();
  }
}

/**
 * 3. Unified TTS Manager (Single Speech Engine)
 * - Guarantees only ONE speech instance plays at a time
 * - Explicit IDLE, SPEAKING, PAUSED, STOPPED state machine
 * - Unique activeSessionId invalidating superseded playback
 * - Supports clean speech replacement (default) or sequential speechQueue
 */
export class TTSManager {
  constructor() {
    this.browserTTS = new BrowserTTSProvider();
    this.backendTTS = new BackendTTSProvider();
    this.activeProvider = null;
    this.speechState = 'IDLE'; // 'IDLE' | 'SPEAKING' | 'PAUSED' | 'STOPPED'
    this.speechQueue = [];
    this.activeSessionId = 0;
    this.listeners = new Set();
  }

  get isSpeaking() {
    return this.speechState === 'SPEAKING';
  }

  get isPaused() {
    return this.speechState === 'PAUSED';
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyState(state, details = {}) {
    this.speechState = state;
    for (const listener of this.listeners) {
      try {
        listener(state, details);
      } catch (err) {
        console.warn('[TTSManager] Listener notification error:', err);
      }
    }
  }

  /**
   * Determine voice status and provider for any given language
   */
  getVoiceStatus(langCode, customVoicesList = null) {
    const langInfo = getLanguageInfo(langCode);
    const hasBrowser = this.browserTTS.hasVoice(langCode, customVoicesList);

    if (hasBrowser) {
      const voice = this.browserTTS.findVoice(langCode, customVoicesList);
      return {
        hasVoice: true,
        available: true,
        provider: 'browser',
        voiceName: voice?.name,
        locale: voice?.lang || langInfo.locale,
        message: `${langInfo.nativeName} (${langInfo.englishName}) device voice ready.`,
      };
    }

    // Supported regional languages for backend audio streaming
    const backendSupported = ['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'pa'];
    if (backendSupported.includes(langInfo.code)) {
      return {
        hasVoice: true,
        available: true,
        provider: 'backend',
        voiceName: 'SARTHI Regional Voice',
        locale: langInfo.locale,
        message: `${langInfo.nativeName} (${langInfo.englishName}) voice ready via SARTHI Regional Voice service.`,
      };
    }

    // Odia or unsupported OS voice
    return {
      hasVoice: false,
      available: false,
      provider: null,
      voiceName: null,
      locale: langInfo.locale,
      message: `${langInfo.nativeName} (${langInfo.englishName}) voice is not currently installed on your operating system.`,
    };
  }

  /**
   * Speak text with single-instance enforcement and automatic provider selection.
   * If queue=true and currently speaking, queues behind active item.
   * If queue=false (default for user taps like Listen/Speak), cleanly stops and replaces prior speech.
   */
  async speak(text, {
    lang = 'en',
    rate = 0.95,
    pitch = 1.0,
    volume = 1.0,
    voicesList = null,
    queue = false,
    onStateChange,
    onChunkChange,
  } = {}) {
    if (!text || !text.trim()) {
      return { completed: true };
    }

    // If queue is requested and already speaking, push to queue
    if (queue && this.isSpeaking) {
      return new Promise((resolve, reject) => {
        this.speechQueue.push({
          text,
          options: { lang, rate, pitch, volume, voicesList, onStateChange, onChunkChange },
          resolve,
          reject,
        });
      });
    }

    // Single speech engine: stop any existing speech and supersede prior session
    this.stop();
    const sessionId = ++this.activeSessionId;

    const langInfo = getLanguageInfo(lang);
    const status = this.getVoiceStatus(lang, voicesList);

    const updateState = (state, details = {}) => {
      if (this.activeSessionId !== sessionId) return;
      this.notifyState(state, { langInfo, status, ...details });
      if (onStateChange) onStateChange(state, { langInfo, status, ...details });
    };

    // 1. Browser SpeechSynthesis (if a genuine device voice exists)
    if (status.provider === 'browser') {
      this.activeProvider = this.browserTTS;
      try {
        const result = await this.browserTTS.speak(text, {
          lang,
          rate,
          pitch,
          volume,
          voicesList,
          onStart: (info) => updateState('SPEAKING', info),
          onEnd: () => {
            updateState('IDLE');
            this.processNextInQueue();
          },
          onPause: () => updateState('PAUSED'),
          onResume: () => updateState('SPEAKING'),
          onError: (err) => {
            updateState('IDLE');
            this.processNextInQueue();
          },
          onChunkChange,
        });

        if (this.activeSessionId === sessionId) {
          updateState('IDLE');
        }
        return result;
      } catch (browserErr) {
        if (this.activeSessionId !== sessionId) return { stopped: true };
        console.warn('[TTSManager] Browser voice failed, falling back to Backend Regional TTS:', browserErr.message);
      }
    }

    // 2. Backend Regional TTS (for regional languages without browser voice)
    if (this.activeSessionId !== sessionId) return { stopped: true };
    this.activeProvider = this.backendTTS;

    try {
      const result = await this.backendTTS.speak(text, {
        lang,
        rate,
        onStart: (info) => updateState('SPEAKING', info),
        onEnd: () => {
          updateState('IDLE');
          this.processNextInQueue();
        },
        onPause: () => updateState('PAUSED'),
        onResume: () => updateState('SPEAKING'),
        onError: (err) => {
          updateState('IDLE');
          this.processNextInQueue();
        },
      });

      if (this.activeSessionId === sessionId) {
        updateState('IDLE');
      }
      return result;
    } catch (backendErr) {
      if (this.activeSessionId !== sessionId) return { stopped: true };
      updateState('IDLE');
      const userMessage = backendErr.message || `${langInfo.nativeName} voice is not available.`;
      const finalError = new Error(userMessage);
      finalError.code = backendErr.code || 'VOICE_UNAVAILABLE';
      finalError.langInfo = langInfo;
      throw finalError;
    }
  }

  processNextInQueue() {
    if (this.speechQueue.length > 0) {
      const nextItem = this.speechQueue.shift();
      if (nextItem) {
        this.speak(nextItem.text, nextItem.options)
          .then(nextItem.resolve)
          .catch(nextItem.reject);
      }
    }
  }

  pause() {
    if (this.activeProvider && this.isSpeaking) {
      this.activeProvider.pause();
      this.notifyState('PAUSED');
    }
  }

  resume() {
    if (this.activeProvider && this.isPaused) {
      this.activeProvider.resume();
      this.notifyState('SPEAKING');
    }
  }

  stop() {
    this.activeSessionId++;
    this.speechQueue = [];
    if (this.browserTTS) this.browserTTS.stop();
    if (this.backendTTS) this.backendTTS.stop();
    this.activeProvider = null;
    this.notifyState('STOPPED');
  }
}

export const ttsManager = new TTSManager();
