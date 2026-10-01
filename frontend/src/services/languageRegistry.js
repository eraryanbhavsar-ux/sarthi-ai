/**
 * SARTHI Multilingual Regional Language Registry
 *
 * Supported Regional Languages:
 *   1. English (en / en-IN)
 *   2. हिन्दी — Hindi (hi / hi-IN)
 *   3. मराठी — Marathi (mr / mr-IN)
 *   4. ગુજરાતી — Gujarati (gu / gu-IN)
 *   5. বাংলা — Bengali (bn / bn-IN)
 *   6. தமிழ் — Tamil (ta / ta-IN)
 *   7. తెలుగు — Telugu (te / te-IN)
 *   8. ಕನ್ನಡ — Kannada (kn / kn-IN)
 *   9. മലയാളം — Malayalam (ml / ml-IN)
 *  10. ਪੰਜਾਬੀ — Punjabi (pa / pa-IN)
 *  11. ଓଡ଼ିଆ — Odia (or / or-IN)
 */

export const LANGUAGE_CONFIG = {
  en: { name: 'English', locale: 'en-IN', nativeName: 'English' },
  hi: { name: 'Hindi', locale: 'hi-IN', nativeName: 'हिन्दी' },
  mr: { name: 'Marathi', locale: 'mr-IN', nativeName: 'मराठी' },
  gu: { name: 'Gujarati', locale: 'gu-IN', nativeName: 'ગુજરાતી' },
  bn: { name: 'Bengali', locale: 'bn-IN', nativeName: 'বাংলা' },
  ta: { name: 'Tamil', locale: 'ta-IN', nativeName: 'தமிழ்' },
  te: { name: 'Telugu', locale: 'te-IN', nativeName: 'తెలుగు' },
  kn: { name: 'Kannada', locale: 'kn-IN', nativeName: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', locale: 'ml-IN', nativeName: 'മലയാളം' },
  pa: { name: 'Punjabi', locale: 'pa-IN', nativeName: 'ਪੰਜਾਬੀ' },
  or: { name: 'Odia', locale: 'or-IN', nativeName: 'ଓଡ଼ିଆ' },
};

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    locale: 'en-IN',
    bcp47: ['en-IN', 'en-US', 'en-GB'],
    nativeName: 'English',
    englishName: 'English',
    displayName: 'English',
    listenLabel: '🔊 Listen in English',
    pauseLabel: '⏸ Pause',
    resumeLabel: '▶ Resume',
    stopLabel: '■ Stop',
    preparingLabel: '⏳ Preparing audio...',
    speakingLabel: '🔊 Speaking English...',
    wakeAcknowledgment: "I'm listening.",
    keywords: ['english', 'en-in', 'en-us', 'en-gb'],
  },
  {
    code: 'hi',
    locale: 'hi-IN',
    bcp47: ['hi-IN', 'hi'],
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    displayName: 'हिन्दी — Hindi',
    listenLabel: '🔊 हिंदी में सुनें',
    pauseLabel: '⏸ रोकें',
    resumeLabel: '▶ फिर शुरू करें',
    stopLabel: '■ बंद करें',
    preparingLabel: '⏳ हिंदी ऑडियो तैयार हो रहा है...',
    speakingLabel: '🔊 हिंदी में बोल रहा हूँ...',
    wakeAcknowledgment: 'मैं सुन रहा हूँ।',
    keywords: ['hindi', 'hi-in', 'hi_in', 'हिन्दी', 'हिंदी'],
  },
  {
    code: 'mr',
    locale: 'mr-IN',
    bcp47: ['mr-IN', 'mr'],
    nativeName: 'मराठी',
    englishName: 'Marathi',
    displayName: 'मराठी — Marathi',
    listenLabel: '🔊 मराठीत ऐका',
    pauseLabel: '⏸ थांबवा',
    resumeLabel: '▶ पुन्हा सुरू करा',
    stopLabel: '■ बंद करा',
    preparingLabel: '⏳ मराठी ऑडिओ तयार करत आहे...',
    speakingLabel: '🔊 मराठीत बोलत आहे...',
    wakeAcknowledgment: 'मी ऐकत आहे.',
    keywords: ['marathi', 'mr-in', 'mr_in', 'मराठी'],
  },
  {
    code: 'gu',
    locale: 'gu-IN',
    bcp47: ['gu-IN', 'gu'],
    nativeName: 'ગુજરાતી',
    englishName: 'Gujarati',
    displayName: 'ગુજરાતી — Gujarati',
    listenLabel: '🔊 ગુજરાતીમાં સાંભળો',
    pauseLabel: '⏸ અટકાવો',
    resumeLabel: '▶ ફરી શરૂ કરો',
    stopLabel: '■ બંધ કરો',
    preparingLabel: '⏳ ગુજરાતી ઑડિઓ તૈયાર થઈ રહ્યો છે...',
    speakingLabel: '🔊 ગુજરાતીમાં બોલી રહ્યો છું...',
    wakeAcknowledgment: 'હું સાંભળી રહ્યો છું.',
    keywords: ['gujarati', 'gu-in', 'gu_in', 'ગુજરાતી'],
  },
  {
    code: 'bn',
    locale: 'bn-IN',
    bcp47: ['bn-IN', 'bn'],
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    displayName: 'বাংলা — Bengali',
    listenLabel: '🔊 বাংলায় শুনুন',
    pauseLabel: '⏸ থামান',
    resumeLabel: '▶ আবার চালান',
    stopLabel: '■ বন্ধ করুন',
    preparingLabel: '⏳ বাংলা অডিও প্রস্তুত হচ্ছে...',
    speakingLabel: '🔊 বাংলায় বলছি...',
    wakeAcknowledgment: 'আমি শুনছি।',
    keywords: ['bengali', 'bangla', 'bn-in', 'bn_in', 'বাংলা'],
  },
  {
    code: 'ta',
    locale: 'ta-IN',
    bcp47: ['ta-IN', 'ta'],
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    displayName: 'தமிழ் — Tamil',
    listenLabel: '🔊 தமிழில் கேளுங்கள்',
    pauseLabel: '⏸ இடைநிறுத்து',
    resumeLabel: '▶ மீண்டும் இயக்கு',
    stopLabel: '■ நிறுத்து',
    preparingLabel: '⏳ தமிழ் ஆடியோ தயாராகிறது...',
    speakingLabel: '🔊 தமிழில் பேசுகிறது...',
    wakeAcknowledgment: 'நான் கேட்கிறேன்.',
    keywords: ['tamil', 'ta-in', 'ta_in', 'தமிழ்'],
  },
  {
    code: 'te',
    locale: 'te-IN',
    bcp47: ['te-IN', 'te'],
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    displayName: 'తెలుగు — Telugu',
    listenLabel: '🔊 తెలుగులో వినండి',
    pauseLabel: '⏸ నిలిపివేయి',
    resumeLabel: '▶ పునఃప్రారంభించు',
    stopLabel: '■ ఆపు',
    preparingLabel: '⏳ తెలుగు ఆడియో సిద్ధమవుతోంది...',
    speakingLabel: '🔊 తెలుగులో మాట్లాడుతున్నాను...',
    wakeAcknowledgment: 'నేను వింటున్నాను.',
    keywords: ['telugu', 'te-in', 'te_in', 'తెలుగు'],
  },
  {
    code: 'kn',
    locale: 'kn-IN',
    bcp47: ['kn-IN', 'kn'],
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    displayName: 'ಕನ್ನಡ — Kannada',
    listenLabel: '🔊 ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ',
    pauseLabel: '⏸ ವಿರಾಮಗೊಳಿಸಿ',
    resumeLabel: '▶ ಪುನರಾರಂಭಿಸಿ',
    stopLabel: '■ ನಿಲ್ಲಿಸಿ',
    preparingLabel: '⏳ ಕನ್ನಡ ಆಡಿಯೋ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...',
    speakingLabel: '🔊 ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ...',
    wakeAcknowledgment: 'ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ.',
    keywords: ['kannada', 'kn-in', 'kn_in', 'ಕನ್ನಡ'],
  },
  {
    code: 'ml',
    locale: 'ml-IN',
    bcp47: ['ml-IN', 'ml'],
    nativeName: 'മലയാളം',
    englishName: 'Malayalam',
    displayName: 'മലയാളം — Malayalam',
    listenLabel: '🔊 മലയാളത്തിൽ കേൾക്കുക',
    pauseLabel: '⏸ താൽക്കാലികമായി നിർത്തുക',
    resumeLabel: '▶ പുനരാരംഭിക്കുക',
    stopLabel: '■ നിർത്തുക',
    preparingLabel: '⏳ മലയാളം ഓഡിയോ തയ്യാറാകുന്നു...',
    speakingLabel: '🔊 മലയാളത്തിൽ സംസാരിക്കുന്നു...',
    wakeAcknowledgment: 'ഞാൻ കേൾക്കുന്നു.',
    keywords: ['malayalam', 'ml-in', 'ml_in', 'മലയാളം'],
  },
  {
    code: 'pa',
    locale: 'pa-IN',
    bcp47: ['pa-IN', 'pa'],
    nativeName: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    displayName: 'ਪੰਜਾਬੀ — Punjabi',
    listenLabel: '🔊 ਪੰਜਾਬੀ ਵਿੱਚ ਸੁਣੋ',
    pauseLabel: '⏸ ਰੋਕੋ',
    resumeLabel: '▶ ਦੁਬਾਰਾ ਚਲਾਓ',
    stopLabel: '■ ਬੰਦ ਕਰੋ',
    preparingLabel: '⏳ ਪੰਜਾਬੀ ਆਡੀਓ ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ...',
    speakingLabel: '🔊 ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲ ਰਿਹਾ ਹਾਂ...',
    wakeAcknowledgment: 'ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ।',
    keywords: ['punjabi', 'pa-in', 'pa_in', 'ਪੰਜਾਬੀ'],
  },
  {
    code: 'or',
    locale: 'or-IN',
    bcp47: ['or-IN', 'or'],
    nativeName: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    displayName: 'ଓଡ଼ିଆ — Odia',
    listenLabel: '🔊 ଓଡ଼ିଆରେ ଶୁଣନ୍ତୁ',
    pauseLabel: '⏸ ବିରତି',
    resumeLabel: '▶ ପୁନଃ ଚଲାନ୍ତୁ',
    stopLabel: '■ ବନ୍ଦ କରନ୍ତୁ',
    preparingLabel: '⏳ ଓଡ଼ିଆ ଅଡିଓ ପ୍ରସ୍ତୁତ ହେଉଛି...',
    speakingLabel: '🔊 ଓଡ଼ିଆରେ କହୁଛି...',
    wakeAcknowledgment: 'ମୁଁ ଶୁଣୁଛି।',
    keywords: ['odia', 'oriya', 'or-in', 'or_in', 'ଓଡ଼ିଆ'],
  },
];

/**
 * Get language definition by code or locale (e.g. 'mr', 'mr-IN')
 */
export function getLanguageInfo(codeOrLocale = 'en') {
  if (!codeOrLocale) return SUPPORTED_LANGUAGES[0];
  const normalized = codeOrLocale.toLowerCase().trim();
  const prefix = normalized.split(/[-_]/)[0];

  const match = SUPPORTED_LANGUAGES.find(
    (l) => l.code === prefix || l.locale.toLowerCase() === normalized || l.bcp47.some((t) => t.toLowerCase() === normalized)
  );

  return match || SUPPORTED_LANGUAGES[0];
}

/**
 * Identify language from natural user text (voice command language intent detection)
 */
export function detectLanguageFromText(text = '') {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return lang;
    }
  }
  return null;
}
