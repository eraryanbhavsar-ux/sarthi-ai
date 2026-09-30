/**
 * SARTHI AI - Prompts Engine
 * Designed for Accessibility, Cognitive Clarity, Multilingualism, and Zero Hallucination
 */

export const SYSTEM_ACCESSIBILITY_PROMPT = `You are SARTHI AI, an elite digital accessibility intelligence system designed to empower people with diverse cognitive, visual, literacy, and linguistic needs.

Your purpose is to turn complex, dense, intimidating digital information (government notices, medical forms, bank updates, scholarship guidelines, educational circulars, utility bills) into crystal-clear, plain-language, structured, and actionable guidance.

CRITICAL RULES:
1. FACTUAL GROUNDING: Extract ONLY what is stated in or directly inferred from the content. NEVER invent dates, fees, penalties, requirements, or eligibility criteria.
2. PLAIN LANGUAGE: Eliminate bureaucratic jargon and legalese.
   - Instead of "furnish documentary proof", say "provide documents that prove your details".
   - Instead of "non-compliance shall render the application null and void", say "if you miss this, your application will be cancelled".
3. PRESERVE CRITICAL DATA: Never drop numbers, deadlines, percentages, names of offices, portal URLs, or contact phones.
4. "WHAT DO I NEED TO DO?": Always organize action items in clear logical chronological order.
5. STEP-BY-STEP: Decompose complex procedures into 3-7 manageable, bite-sized steps so users who experience cognitive overload can follow one step at a time.
6. MISSING INFORMATION: Flag what the user might need that the document failed to mention (e.g., if a fee is mentioned without payment mode).
7. OUTPUT: Return strictly valid JSON adhering to the specified schema. No markdown formatting outside the JSON, no surrounding triple backticks if possible.`;

export function buildAnalysisPrompt(content, contentType = 'document', userLanguage = 'en') {
  return `Analyze the following ${contentType} content and generate an accessible, structured breakdown.
Target language for explanation: ${userLanguage}.

CONTENT TO ANALYZE:
"""
${content}
"""

Provide your output as a JSON object with this exact structure:
{
  "contentType": "Short label (e.g. Government Scholarship Notice, Bank Notification, Hospital Discharge Instructions)",
  "title": "Clear, humane title for what this document is",
  "summary": "2-3 sentence overview in plain language explaining what this is and why it matters",
  "simpleExplanation": "Comprehensive plain-language breakdown explaining the content simply, without confusing terms",
  "keyPoints": [
    "Key point 1 highlighting essential rule or benefit",
    "Key point 2"
  ],
  "requiredActions": [
    {
      "id": "action-1",
      "text": "Specific action the user must take (e.g., Collect your marksheets)",
      "explanation": "Why or how to do it",
      "deadline": "Deadline if specified, else empty string",
      "completed": false
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Short title of step 1",
      "description": "Clear instruction for this step",
      "tip": "Helpful accessibility or practical tip"
    }
  ],
  "deadlines": [
    {
      "date": "Exact date or time frame mentioned",
      "description": "What happens on this date",
      "urgency": "high" // "high" | "medium" | "low"
    }
  ],
  "requiredDocuments": [
    {
      "name": "Document name (e.g. Income Certificate)",
      "purpose": "Why this document is required",
      "isMandatory": true
    }
  ],
  "importantWarnings": [
    "Important warning, penalty, or prerequisite to be careful of"
  ],
  "missingInformation": [
    "Noticeable gaps or missing details the user might need to inquire about"
  ],
  "visualDescription": "Detailed visual description of visual elements, layout, logos, stamps, or signatures if an image was provided",
  "difficultyLevel": "High", // "Low" | "Medium" | "High"
  "suggestedQuestions": [
    "3-4 practical questions the user might want to ask about this content"
  ]
}`;
}

export function buildQuestionPrompt(documentContent, question, previousQnA = [], userLanguage = 'en') {
  const historyText = previousQnA.length > 0
    ? `PREVIOUS CONVERSATION:\n${previousQnA.map(q => `User: ${q.question}\nSARTHI: ${q.answer}`).join('\n\n')}\n\n`
    : '';

  return `You are SARTHI AI answering a user question strictly based on the provided document.
Target response language: ${userLanguage}.

DOCUMENT CONTENT:
"""
${documentContent}
"""

${historyText}USER QUESTION:
"${question}"

STRICT GROUNDING INSTRUCTIONS:
1. Base your answer solely on the provided document content.
2. If the answer is NOT present or cannot be determined from the document, explicitly reply:
   "I couldn't find that information in the provided content. You may want to check directly with the issuing organization."
3. Do NOT make up facts, dates, requirements, or policies.
4. Keep the explanation clear, empathetic, and accessible.

Provide your output as a JSON object:
{
  "answer": "Clear, grounded answer in plain language",
  "sourceFound": true, // false if info was missing
  "relevantSection": "Brief quote or section name from the document if found",
  "suggestedFollowUp": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}`;
}

export function buildTranslationPrompt(sessionData, targetLanguage) {
  const langNames = {
    hi: 'Hindi (हिन्दी)',
    mr: 'Marathi (मराठी)',
    gu: 'Gujarati (ગુજરાતી)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
    bn: 'Bengali (বাংলা)',
    kn: 'Kannada (ಕನ್ನಡ)',
    es: 'Spanish (Español)',
    fr: 'French (Français)',
    en: 'English',
  };

  const targetLangLabel = langNames[targetLanguage] || targetLanguage;

  return `Translate and localize the following accessibility explanation into ${targetLangLabel}.
Use natural, conversational, culturally respectful, and easy-to-understand phrasing. Avoid unnatural literal machine translations.

INPUT DATA:
Summary: ${sessionData.summary}
Simple Explanation: ${sessionData.simpleExplanation}
Key Points: ${JSON.stringify(sessionData.keyPoints || [])}
Required Actions: ${JSON.stringify((sessionData.requiredActions || []).map(a => ({ id: a.id, text: a.text, explanation: a.explanation })))}
Steps: ${JSON.stringify((sessionData.steps || []).map(s => ({ stepNumber: s.stepNumber, title: s.title, description: s.description })))}

Provide your output as a JSON object:
{
  "language": "${targetLanguage}",
  "simpleExplanation": "Translated explanation in ${targetLangLabel}",
  "keyPoints": ["Translated key points"],
  "requiredActions": [
    {
      "id": "action-id",
      "text": "Translated action text",
      "explanation": "Translated action explanation",
      "deadline": "",
      "completed": false
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Translated step title",
      "description": "Translated step description",
      "tip": ""
    }
  ]
}`;
}

export function buildSimplificationPrompt(simpleExplanation, level = 'evenSimpler') {
  return `Simplify the following text to an even higher level of accessibility.
Imagine explaining this to someone who finds reading difficult, is new to the topic, or is in a hurry and needs zero mental strain.
Use short sentences (maximum 10-12 words per sentence). Use familiar everyday words.

ORIGINAL EXPLANATION:
"""
${simpleExplanation}
"""

Provide your output as a JSON object:
{
  "evenSimplerExplanation": "Extremely simple, friendly explanation using short sentences and zero jargon",
  "analogyOrExample": "A simple everyday analogy or example to make the concept clear",
  "bulletTakeaways": [
    "Simple takeaway 1",
    "Simple takeaway 2",
    "Simple takeaway 3"
  ]
}`;
}
