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

class TTSService {
  constructor() {
    this.backendTtsUrl = import.meta.env.VITE_BACKEND_TTS_URL || null;
  }

  /**
   * Check if the current browser environment has an installed voice for the language.
   */
  hasBrowserVoice(langCode, voices = []) {
    if (!voices || voices.length === 0) return false;
    const target = (langCode || '').toLowerCase().trim();
    const prefix = target.split(/[-_]/)[0];

    return voices.some((v) => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      const vName = (v.name || '').toLowerCase();
      if (vLang === target || vLang === prefix || vLang.startsWith(`${prefix}-`)) {
        return true;
      }
      if (prefix === 'mr' && (vName.includes('marathi') || vName.includes('mr-in'))) return true;
      if (prefix === 'hi' && (vName.includes('hindi') || vName.includes('hi-in'))) return true;
      return false;
    });
  }

  /**
   * Play audio from an external TTS endpoint if configured
   */
  async playCloudTTS(text, lang = 'mr-IN') {
    if (!this.backendTtsUrl) {
      throw new Error('Cloud TTS endpoint is not configured.');
    }

    const response = await fetch(this.backendTtsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language: lang }),
    });

    if (!response.ok) {
      throw new Error(`TTS server error (${response.status})`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    return new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      audio.play();
    });
  }
}

export const ttsService = new TTSService();
