/**
 * SARTHI Pluggable Text-to-Speech (TTS) Architecture
 *
 * TextToSpeechProvider
 * ├── BrowserTTSProvider   (Offline, zero-latency Web Speech API with sentence chunking)
 * └── BackendTTSProvider   (Server-side cloud regional audio fallback via POST /api/accessibility/tts)
 */

import { getLanguageInfo } from '../languageRegistry.js';

/**
 * Split long text into natural sentence/phrase chunks to avoid browser SpeechSynthesis cutoffs.
 */
export function chunkTextForSpeech(text = '', maxChunkLength = 160) {
  if (!text || text.length <= maxChunkLength) return [text.trim()];

  // Split on paragraph boundaries, or punctuation (. ! ? । ; \n)
  const regex = /([^.!?:;\n।]+[.!?;\n।]+)/g;
  const matches = text.match(regex);

  if (!matches) {
    // Fallback: split by comma or words
    const words = text.split(' ');
    const chunks = [];
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).length > maxChunkLength) {
        if (current) chunks.push(current.trim());
        current = w;
      } else {
        current = current ? current + ' ' + w : w;
      }
    }
    if (current) chunks.push(current.trim());
    return chunks;
  }

  const chunks = [];
  let buffer = '';

  for (const match of matches) {
    if ((buffer + ' ' + match).length <= maxChunkLength) {
      buffer = buffer ? buffer + ' ' + match.trim() : match.trim();
    } else {
      if (buffer) chunks.push(buffer);
      buffer = match.trim();
    }
  }
  if (buffer) chunks.push(buffer);

  return chunks.filter(Boolean);
}

/**
 * 1. Browser SpeechSynthesis Provider
 */
export class BrowserTTSProvider {
  constructor() {
    this.currentUtterance = null;
    this.isPaused = false;
    this.activeChunks = [];
    this.currentChunkIndex = 0;
    this.abortController = false;
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

    // 1. Exact BCP-47 match
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
   * Speak text sequentially across chunks
   */
  async speak(text, {
    lang = 'en',
    rate = 1.0,
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

    // Strict validation: Don't pretend a regional voice exists if browser doesn't have it
    if (!voice && langInfo.code !== 'en') {
      const err = new Error(`${langInfo.nativeName} (${langInfo.englishName}) voice is not available on this device/browser.`);
      err.code = 'VOICE_NOT_AVAILABLE';
      err.langInfo = langInfo;
      throw err;
    }

    this.stop();
    this.abortController = false;
    this.isPaused = false;
    this.activeChunks = chunkTextForSpeech(text);
    this.currentChunkIndex = 0;

    if (this.activeChunks.length === 0) return;

    if (onStart) onStart({ totalChunks: this.activeChunks.length, langInfo });

    return new Promise((resolve, reject) => {
      const speakNextChunk = () => {
        if (this.abortController) {
          resolve({ stopped: true });
          return;
        }

        if (this.currentChunkIndex >= this.activeChunks.length) {
          if (onEnd) onEnd();
          resolve({ completed: true });
          return;
        }

        const chunkText = this.activeChunks[this.currentChunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.rate = rate;

        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || langInfo.locale;
        } else {
          utterance.lang = 'en-US';
        }

        utterance.onpause = () => {
          this.isPaused = true;
          if (onPause) onPause();
        };

        utterance.onresume = () => {
          this.isPaused = false;
          if (onResume) onResume();
        };

        utterance.onend = () => {
          if (this.abortController) return;
          this.currentChunkIndex++;
          speakNextChunk();
        };

        utterance.onerror = (e) => {
          if (e.error === 'canceled' || e.error === 'interrupted') {
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
    this.abortController = true;
    this.isPaused = false;
    this.activeChunks = [];
    this.currentChunkIndex = 0;
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }
}

/**
 * 2. Backend Cloud TTS Provider (Pluggable Google Cloud / Regional TTS via Node/Express)
 */
export class BackendTTSProvider {
  constructor(endpointUrl = '/api/accessibility/tts') {
    this.endpointUrl = endpointUrl;
    this.currentAudio = null;
    this.isPaused = false;
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

  async speak(text, { lang = 'mr', onStart, onEnd, onPause, onResume, onError } = {}) {
    this.stop();
    const langInfo = getLanguageInfo(lang);

    const response = await fetch(this.endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language: langInfo.code,
        locale: langInfo.locale,
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const err = new Error(errorJson.message || `Cloud TTS server returned error (${response.status})`);
      err.code = errorJson.code || 'BACKEND_TTS_ERROR';
      throw err;
    }

    const data = await response.json();
    if (!data.success || !data.audioBase64) {
      throw new Error(data.message || 'No audio returned from Cloud TTS service.');
    }

    const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
    const audio = new Audio(audioSrc);
    this.currentAudio = audio;

    return new Promise((resolve, reject) => {
      audio.onplay = () => {
        if (onStart) onStart({ provider: 'cloud', langInfo });
      };

      audio.onpause = () => {
        this.isPaused = true;
        if (onPause) onPause();
      };

      audio.onended = () => {
        this.currentAudio = null;
        if (onEnd) onEnd();
        resolve({ completed: true });
      };

      audio.onerror = (e) => {
        console.warn('[BackendTTS] Audio playback error:', e);
        if (onError) onError(e);
        reject(e);
      };

      audio.play().catch(reject);
    });
  }

  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      this.isPaused = false;
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPaused = false;
  }
}

/**
 * 3. Unified TTS Manager (Coordinates Browser & Backend TTS)
 */
export class TTSManager {
  constructor() {
    this.browserTTS = new BrowserTTSProvider();
    this.backendTTS = new BackendTTSProvider();
    this.activeProvider = null;
    this.speechState = 'IDLE'; // 'IDLE' | 'PREPARING' | 'SPEAKING' | 'PAUSED' | 'STOPPED' | 'ERROR'
  }

  getVoiceStatus(langCode, customVoicesList = null) {
    const langInfo = getLanguageInfo(langCode);
    const hasBrowser = this.browserTTS.hasVoice(langCode, customVoicesList);

    if (hasBrowser) {
      const voice = this.browserTTS.findVoice(langCode, customVoicesList);
      return {
        hasVoice: true,
        provider: 'browser',
        voiceName: voice?.name,
        locale: voice?.lang || langInfo.locale,
        message: `${langInfo.nativeName} (${langInfo.englishName}) voice ready on device.`,
      };
    }

    return {
      hasVoice: false,
      provider: null,
      voiceName: null,
      locale: langInfo.locale,
      message: `${langInfo.nativeName} (${langInfo.englishName}) voice is not available on this device/browser.`,
    };
  }

  async speak(text, {
    lang = 'en',
    rate = 1.0,
    voicesList = null,
    onStateChange,
    onChunkChange,
  } = {}) {
    const langInfo = getLanguageInfo(lang);
    const status = this.getVoiceStatus(lang, voicesList);

    if (onStateChange) onStateChange('PREPARING', { langInfo, status });
    this.speechState = 'PREPARING';

    // 1. Try Browser TTS first
    if (status.hasVoice) {
      this.activeProvider = this.browserTTS;
      try {
        return await this.browserTTS.speak(text, {
          lang,
          rate,
          voicesList,
          onStart: (info) => {
            this.speechState = 'SPEAKING';
            if (onStateChange) onStateChange('SPEAKING', { ...info, status });
          },
          onEnd: () => {
            this.speechState = 'IDLE';
            if (onStateChange) onStateChange('IDLE', { status });
          },
          onPause: () => {
            this.speechState = 'PAUSED';
            if (onStateChange) onStateChange('PAUSED', { status });
          },
          onResume: () => {
            this.speechState = 'SPEAKING';
            if (onStateChange) onStateChange('SPEAKING', { status });
          },
          onError: (err) => {
            this.speechState = 'ERROR';
            if (onStateChange) onStateChange('ERROR', { error: err, status });
          },
          onChunkChange,
        });
      } catch (err) {
        this.speechState = 'ERROR';
        if (onStateChange) onStateChange('ERROR', { error: err, status });
        throw err;
      }
    }

    // 2. Browser voice not available -> Check if backend TTS is configured
    try {
      this.activeProvider = this.backendTTS;
      return await this.backendTTS.speak(text, {
        lang,
        onStart: (info) => {
          this.speechState = 'SPEAKING';
          if (onStateChange) onStateChange('SPEAKING', { ...info, status });
        },
        onEnd: () => {
          this.speechState = 'IDLE';
          if (onStateChange) onStateChange('IDLE', { status });
        },
        onPause: () => {
          this.speechState = 'PAUSED';
          if (onStateChange) onStateChange('PAUSED', { status });
        },
        onResume: () => {
          this.speechState = 'SPEAKING';
          if (onStateChange) onStateChange('SPEAKING', { status });
        },
        onError: (err) => {
          this.speechState = 'ERROR';
          if (onStateChange) onStateChange('ERROR', { error: err, status });
        },
      });
    } catch (backendErr) {
      this.speechState = 'ERROR';
      const userMessage = `${langInfo.nativeName} (${langInfo.englishName}) voice is not installed on this browser/device.`;
      const finalError = new Error(userMessage);
      finalError.code = 'VOICE_UNAVAILABLE';
      finalError.langInfo = langInfo;
      if (onStateChange) onStateChange('ERROR', { error: finalError, status });
      throw finalError;
    }
  }

  pause() {
    if (this.activeProvider) {
      this.activeProvider.pause();
      this.speechState = 'PAUSED';
    }
  }

  resume() {
    if (this.activeProvider) {
      this.activeProvider.resume();
      this.speechState = 'SPEAKING';
    }
  }

  stop() {
    if (this.browserTTS) this.browserTTS.stop();
    if (this.backendTTS) this.backendTTS.stop();
    this.speechState = 'STOPPED';
  }
}

export const ttsManager = new TTSManager();
