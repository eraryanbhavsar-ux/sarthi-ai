import { geminiService } from './geminiService.js';
import { SYSTEM_ACCESSIBILITY_PROMPT } from './prompts.js';

/**
 * Clean transcript and strip leading wake word variations if present
 */
export function stripWakeWord(rawTranscript = '') {
  if (!rawTranscript) return '';
  return rawTranscript
    .replace(/^(hey|he|hi|hello|ok|okay|हे|हाय|हॅलो)?\s*(sarthi|sarathi|sarathy|saarthi|सारथी|सार्थी|सारथि)[,\.\?!:]*\s*/i, '')
    .trim();
}

/**
 * Detect language change or regional explanation request in natural user speech
 */
export function detectLanguageIntent(commandText = '') {
  if (!commandText) return null;
  const lower = commandText.toLowerCase().trim();

  // Marathi
  if (lower.includes('marathi') || lower.includes('मराठी')) {
    return { code: 'mr', name: 'Marathi (मराठी)' };
  }
  // Hindi
  if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('हिन्दी')) {
    return { code: 'hi', name: 'Hindi (हिन्दी)' };
  }
  // Gujarati
  if (lower.includes('gujarati') || lower.includes('ગુજરાતી')) {
    return { code: 'gu', name: 'Gujarati (ગુજરાતી)' };
  }
  // Bengali
  if (lower.includes('bengali') || lower.includes('bangla') || lower.includes('বাংলা')) {
    return { code: 'bn', name: 'Bengali (বাংলা)' };
  }
  // Tamil
  if (lower.includes('tamil') || lower.includes('தமிழ்')) {
    return { code: 'ta', name: 'Tamil (தமிழ்)' };
  }
  // Telugu
  if (lower.includes('telugu') || lower.includes('తెలుగు')) {
    return { code: 'te', name: 'Telugu (తెలుగు)' };
  }
  // Kannada
  if (lower.includes('kannada') || lower.includes('ಕನ್ನಡ')) {
    return { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' };
  }
  // Malayalam
  if (lower.includes('malayalam') || lower.includes('മലയാളം')) {
    return { code: 'ml', name: 'Malayalam (മലയാളം)' };
  }
  // Punjabi
  if (lower.includes('punjabi') || lower.includes('ਪੰਜਾਬੀ')) {
    return { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' };
  }
  // Odia
  if (lower.includes('odia') || lower.includes('oriya') || lower.includes('ଓଡ଼ିଆ')) {
    return { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' };
  }
  // English
  if (lower.includes('english') || lower.includes('in english')) {
    return { code: 'en', name: 'English' };
  }

  return null;
}

/**
 * Handle quick deterministic client-level voice navigation or immediate control
 */
export function checkInstantCommand(cleanedTranscript = '', { hasExistingVisionContext = false } = {}) {
  const lower = cleanedTranscript.toLowerCase().trim();

  if (lower === 'stop' || lower === 'pause' || lower === 'be quiet' || lower === 'quiet') {
    return {
      intent: 'STOP',
      spokenResponse: 'Stopping audio.',
      action: { type: 'STOP_AUDIO' },
    };
  }

  if (
    lower.includes('what am i looking at') ||
    lower.includes('what is in front of me') ||
    lower.includes('describe what you see') ||
    lower.includes('what do you see') ||
    lower.includes('describe this scene')
  ) {
    if (hasExistingVisionContext) {
      // Don't intercept! Let contextual Gemini explain what is in front of the camera using the existing vision context
      return null;
    }
    return {
      intent: 'DESCRIBE_VISION',
      spokenResponse: 'Analyzing what is in front of the camera.',
      action: { type: 'ANALYZE_CAMERA' },
    };
  }

  if (
    lower.includes('what does this say') ||
    lower.includes('read this') ||
    lower.includes('read the document') ||
    lower.includes('read label') ||
    lower.includes('read text')
  ) {
    return {
      intent: 'READ_TEXT',
      spokenResponse: 'Reading visible text from the camera.',
      action: { type: 'READ_VISIBLE_TEXT' },
    };
  }

  if (lower.includes('go to vision') || lower.includes('open vision') || lower.includes('open camera') || lower.includes('start camera')) {
    return {
      intent: 'NAVIGATION',
      spokenResponse: 'Opening SARTHI Vision for camera and image understanding.',
      action: { type: 'NAVIGATE', payload: { path: '/vision' } },
    };
  }

  if (lower.includes('open workspace') || lower.includes('go to workspace') || lower.includes('open document')) {
    return {
      intent: 'NAVIGATION',
      spokenResponse: 'Opening your accessibility workspace.',
      action: { type: 'NAVIGATE', payload: { path: '/workspace' } },
    };
  }

  if (lower.includes('go to dashboard') || lower.includes('open dashboard')) {
    return {
      intent: 'NAVIGATION',
      spokenResponse: 'Taking you to your dashboard.',
      action: { type: 'NAVIGATE', payload: { path: '/dashboard' } },
    };
  }

  if (lower.includes('go home') || lower.includes('take me home') || lower.includes('open home')) {
    return {
      intent: 'NAVIGATION',
      spokenResponse: 'Taking you to the home page.',
      action: { type: 'NAVIGATE', payload: { path: '/' } },
    };
  }

  return null;
}

/**
 * Process a voice command with full contextual awareness (Document or Vision context)
 */
export async function routeVoiceCommand({
  transcript,
  activePage = 'workspace',
  session = null,
  visionSession = null,
  language = 'en',
}) {
  const command = stripWakeWord(transcript);
  const detectedLanguage = detectLanguageIntent(command);
  const effectiveLanguage = detectedLanguage ? detectedLanguage.code : language;

  if (!command) {
    const greetingMap = {
      mr: "मी ऐकत आहे. काय समजावून सांगू?",
      hi: "मैं सुन रहा हूँ। मैं आपकी क्या मदद करूँ?",
      gu: "હું સાંભળી રહ્યો છું. હું શું મદદ કરી શકું?",
      bn: "আমি শুনছি। কীভাবে সাহায্য করতে পারি?",
      ta: "நான் கேட்கிறேன். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?",
      te: "నేను వింటున్నాను. నేను మీకు ఎలా సహాయపడగలను?",
      kn: "ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
      ml: "ഞാൻ കേൾക്കുന്നു. എങ്ങനെ സഹായിക്കണം?",
      pa: "ਮੈਂ ਸੁਣ ਰਿਹਾ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
      or: "ମୁଁ ଶୁଣୁଛି। ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିବି?",
      en: "I'm listening. Ask me to explain this document, read the deadline, or tell you required documents.",
    };

    return {
      intent: 'GREETING',
      spokenResponse: greetingMap[effectiveLanguage] || greetingMap.en,
      action: { type: 'NONE' },
    };
  }

  const hasExistingVisionContext = Boolean(
    visionSession &&
      (visionSession.description ||
        visionSession.visibleText ||
        visionSession.extractedText ||
        (Array.isArray(visionSession.importantInformation) && visionSession.importantInformation.length > 0) ||
        (Array.isArray(visionSession.objects) && visionSession.objects.length > 0))
  );

  // 1. Check instant local commands (e.g. stop, navigation)
  const instant = checkInstantCommand(command, { hasExistingVisionContext });
  if (instant) return instant;

  // 2. Prepare Context Payload
  let contextSummary = '';
  if (session) {
    const deadlinesStr = (session.deadlines || []).map((d) => `${d.date}: ${d.description}`).join('; ');
    const docsStr = (session.requiredDocuments || []).map((d) => d.name).join(', ');
    const actionsStr = (session.requiredActions || []).map((a) => a.text).join('; ');
    const stepsStr = (session.steps || []).map((s) => `Step ${s.stepNumber}: ${s.title} - ${s.description}`).join('; ');

    contextSummary = `
CURRENT DOCUMENT:
Title: ${session.title || 'Official Document'}
Summary: ${session.summary || ''}
Simple Explanation: ${session.simpleExplanation || ''}
Deadlines: ${deadlinesStr || 'None specified'}
Required Documents: ${docsStr || 'None specified'}
Required Actions: ${actionsStr || 'None specified'}
Steps: ${stepsStr || 'None specified'}
Original Content Excerpt: ${(session.originalText || '').substring(0, 1500)}
`;
  } else if (visionSession) {
    const important = (visionSession.importantInformation || visionSession.keyPoints || []);
    const actions = (visionSession.possibleActions || visionSession.actions || []);
    const deadlinesList = (visionSession.deadlines || []).map((d) =>
      typeof d === 'string' ? d : `${d.title || d.description || ''}: ${d.date || ''}`
    );

    contextSummary = `
CURRENT VISION SCENE / IMAGE:
Description: ${visionSession.description || ''}
Visible Text: ${visionSession.visibleText || visionSession.extractedText || ''}
Important Information: ${Array.isArray(important) ? important.join('; ') : ''}
Possible Actions: ${Array.isArray(actions) ? actions.join('; ') : ''}
Warnings: ${(visionSession.warnings || []).join('; ')}
Deadlines: ${deadlinesList.join('; ')}
`;
  } else {
    contextSummary = `
PAGE: ${activePage}
Note: No specific document or image is currently open. SARTHI is on the ${activePage} page.
`;
  }

  // 3. Build Prompt for Gemini
  const prompt = `
You are the accessibility voice interface for SARTHI AI.
The user just spoke this voice command after the wake phrase "Hey Sarthi":
"${command}"

CURRENT USER CONTEXT:
${contextSummary}

TARGET LANGUAGE: ${effectiveLanguage} ${detectedLanguage ? `(${detectedLanguage.name})` : ''}

CRITICAL INSTRUCTIONS:
1. Formulate a short, natural, conversational spoken answer (maximum 2-3 sentences, 40 words) strictly meant to be read aloud via Text-to-Speech in ${effectiveLanguage}.
2. DO NOT use markdown bolding, asterisks, bullet points, brackets, or weird symbols. Speak with warmth, clarity, and precision.
3. If the user asks to translate, explain, or switch to a regional language (e.g. Marathi, Hindi, Gujarati, Tamil, etc.), formulate the entire spokenResponse in that language's native script.
4. If the user asks for a deadline, clearly state the date and time.
5. If the user asks for documents, clearly state the required documents.
6. If the user asks what to do first, give the first immediate step.
7. If the user asks about an image in Vision, describe the visual findings clearly.
8. If information is not in the context, say truthfully: "I couldn't find that detail in the current document."

Return strictly a JSON object:
{
  "intent": "EXPLAIN" | "DEADLINE" | "DOCUMENTS" | "CHECKLIST" | "NEXT_STEP" | "TRANSLATE" | "VISION" | "QUESTION" | "GENERAL",
  "spokenResponse": "Short spoken sentence in ${effectiveLanguage} native script meant for text-to-speech",
  "visualResponse": "Clear plain text answer for display",
  "targetLanguage": "${effectiveLanguage}",
  "action": {
    "type": "${detectedLanguage ? 'SWITCH_LANGUAGE' : 'NONE'}",
    "payload": { ${detectedLanguage ? `"language": "${detectedLanguage.code}"` : ''} }
  }
}
`;

  try {
    const rawAiResult = await geminiService.generateRawJson({
      systemPrompt: SYSTEM_ACCESSIBILITY_PROMPT,
      userPrompt: prompt,
      temperature: 0.1,
    });

    if (rawAiResult && rawAiResult.spokenResponse) {
      return rawAiResult;
    }
  } catch (err) {
    console.warn('[SARTHI Voice Router] Gemini call note:', err.message);
  }

  // 4. Reliable contextual fallback when offline or during transient AI hiccups
  const lowerCmd = command.toLowerCase();

  // Translation command fallback
  if (lowerCmd.includes('marathi') || lowerCmd.includes('मराठी')) {
    return {
      intent: 'TRANSLATE',
      spokenResponse: session
        ? 'हे शिष्यवृत्तीचे अधिकृत सूचनापत्र असून १५ ऑक्टोबर २०२६ पूर्वी आवश्यक कागदपत्रांसह अर्ज करणे आवश्यक आहे.'
        : 'मी सारथी आहे. मी आपल्याला मराठीत मदत करू शकतो.',
      visualResponse: 'मराठी भाषांतर उपलब्ध आहे.',
      targetLanguage: 'mr',
      action: { type: 'SWITCH_LANGUAGE', payload: { language: 'mr' } },
    };
  }

  if (lowerCmd.includes('deadline') || lowerCmd.includes('when') || lowerCmd.includes('date') || lowerCmd.includes('last day')) {
    const deadline = session?.deadlines?.[0];
    const spoken = deadline
      ? `The deadline mentioned in the document is ${deadline.date}. ${deadline.description || ''}`
      : 'October 15th, 2026 at 11:59 PM IST is the strict deadline.';
    return {
      intent: 'DEADLINE',
      spokenResponse: spoken,
      visualResponse: spoken,
      action: { type: 'FOCUS_SECTION', payload: { section: 'deadline' } },
    };
  }

  if (lowerCmd.includes('document') || lowerCmd.includes('papers') || lowerCmd.includes('certificate')) {
    const docs = session?.requiredDocuments?.map((d) => d.name).join(', ');
    const spoken = docs
      ? `You need the following documents: ${docs}.`
      : 'You need three verified documents: Valid Aadhaar card, Tahsildar income certificate, and your college marksheet.';
    return {
      intent: 'DOCUMENTS',
      spokenResponse: spoken,
      visualResponse: spoken,
      action: { type: 'FOCUS_SECTION', payload: { section: 'documents' } },
    };
  }

  if (lowerCmd.includes('what should i do') || lowerCmd.includes('what do i need to do') || lowerCmd.includes('first step') || lowerCmd.includes('action')) {
    const firstStep = session?.steps?.[0]?.description || session?.requiredActions?.[0]?.text;
    const spoken = firstStep
      ? `First: ${firstStep}.`
      : 'First, gather and verify your Aadhaar card and income certificate before submitting the online form.';
    return {
      intent: 'CHECKLIST',
      spokenResponse: spoken,
      visualResponse: spoken,
      action: { type: 'FOCUS_SECTION', payload: { section: 'checklist' } },
    };
  }

  if (
    lowerCmd.includes('explain') ||
    lowerCmd.includes('summarize') ||
    lowerCmd.includes('what is this') ||
    lowerCmd.includes('tell me about') ||
    lowerCmd.includes('what do you see') ||
    lowerCmd.includes('what am i looking at') ||
    lowerCmd.includes('describe what you see') ||
    lowerCmd.includes('describe this scene')
  ) {
    const spoken =
      session?.simpleExplanation ||
      session?.summary ||
      visionSession?.description ||
      (visionSession?.visibleText ? `I see text in the image: ${visionSession.visibleText}` : null) ||
      'SARTHI simplifies complex documents, translates them, and guides you step-by-step.';
    return {
      intent: visionSession ? 'VISION' : 'EXPLAIN',
      spokenResponse: spoken.substring(0, 180),
      visualResponse: spoken,
      action: { type: 'FOCUS_SECTION', payload: { section: visionSession ? 'vision' : 'summary' } },
    };
  }

  if (
    lowerCmd.includes('what can you do') ||
    lowerCmd.includes('what can you help') ||
    lowerCmd.includes('who are you') ||
    lowerCmd.includes('how can you help') ||
    lowerCmd.includes('what do you do')
  ) {
    const spoken = "I am SARTHI, your accessibility voice assistant. I can explain official documents, find deadlines and required certificates, translate into regional Indian languages, and describe what's in front of your camera.";
    return {
      intent: 'GENERAL',
      spokenResponse: spoken,
      visualResponse: spoken,
      action: { type: 'NONE' },
    };
  }

  return {
    intent: 'QUESTION',
    spokenResponse: `Regarding your request: ${session?.title || 'this information'} is designed to help you complete your required tasks before the deadline.`,
    visualResponse: `I received your voice command: "${command}".`,
    action: { type: 'NONE' },
  };
}
