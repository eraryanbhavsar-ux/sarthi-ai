/**
 * SARTHI Text-to-Speech (TTS) Architecture & Provider Adapter
 *
 * Primary Mode:
 *   - Client-side Web Speech API (SpeechSynthesis)
 *   - Zero latency, completely free, works offline when OS voices are present.
 *   - Handles asynchronous voice loading and exact/prefix matching for languages:
 *     - English: en-US, en-GB, en-IN
 *     - Hindi: hi-IN
 *     - Marathi: mr-IN (requires Marathi OS voice package or Android Google TTS)
 *
 * External Cloud TTS Architecture (Pluggable Backend Fallback):
 *   - In many desktop environments (macOS default, Windows without regional packs),
 *     browsers do not bundle a native Marathi speech synthesis voice.
 *   - When external Marathi synthesis is required, the backend TTS endpoint
 *     can be enabled without modifying any frontend component.
 *
 * External Provider Specification:
 *   - Provider: Google Cloud Text-to-Speech API (Chirp or Wavenet Voice: mr-IN-Wavenet-A / mr-IN-Standard-A)
 *   - Reason: Native high-fidelity Marathi prosody and natural Devanagari pronunciation.
 *   - Backend Environment Variable: GOOGLE_TTS_API_KEY or GOOGLE_APPLICATION_CREDENTIALS
 *   - Route: POST /api/accessibility/tts -> Streams audio/mp3 or returns base64 audio
 */

import { ttsManager } from './voice/textToSpeechProvider.js';
import { getLanguageInfo } from './languageRegistry.js';

class TTSService {
  constructor() {
    this.manager = ttsManager;
  }

  hasBrowserVoice(langCode, voices = []) {
    return this.manager.browserTTS.hasVoice(langCode, voices);
  }

  getVoiceStatus(langCode, voices = []) {
    return this.manager.getVoiceStatus(langCode, voices);
  }

  async playCloudTTS(text, lang = 'mr-IN') {
    return this.manager.backendTTS.speak(text, { lang });
  }

  async speak(text, options = {}) {
    return this.manager.speak(text, options);
  }

  pause() {
    this.manager.pause();
  }

  resume() {
    this.manager.resume();
  }

  stop() {
    this.manager.stop();
  }
}

export const ttsService = new TTSService();
export { ttsManager };
