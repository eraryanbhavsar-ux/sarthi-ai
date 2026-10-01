import { geminiService } from '../services/ai/geminiService.js';
import { sessionRepo } from '../models/sessionRepo.js';
import { visionSessionRepo } from '../models/visionSessionRepo.js';
import { userRepo } from '../models/userRepo.js';
import { routeVoiceCommand } from '../services/ai/voiceCommandRouter.js';
import { extractTextFromPdf } from '../utils/pdfExtractor.js';
import {
  SAMPLE_DOCUMENT_TITLE,
  SAMPLE_DOCUMENT_TEXT,
  SAMPLE_STRUCTURED_ANALYSIS,
} from '../utils/sampleDocument.js';

export async function analyzeContent(req, res, next) {
  try {
    const file = req.file;
    const { text, title, language = 'en', guestId } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    let extractedText = '';
    let contentType = 'text';
    let fileMetadata = { fileName: '', fileType: '', fileSize: 0, pageCount: 1 };
    let imageBuffer = null;
    let imageMimeType = null;

    if (file) {
      fileMetadata = {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        pageCount: 1,
      };

      if (file.mimetype === 'application/pdf') {
        contentType = 'pdf';
        const pdfData = await extractTextFromPdf(file.buffer);
        extractedText = pdfData.text;
        fileMetadata.pageCount = pdfData.pageCount;
      } else if (file.mimetype.startsWith('image/')) {
        contentType = 'image';
        imageBuffer = file.buffer;
        imageMimeType = file.mimetype;
        extractedText = `[Image Document: ${file.originalname}]`;
      }
    } else if (text) {
      contentType = 'text';
      extractedText = text;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a PDF, an image file, or text content to analyze.',
      });
    }

    // Run AI analysis
    const analysis = await geminiService.analyzeContent({
      text: extractedText,
      imageBuffer,
      imageMimeType,
      contentType,
      userLanguage: language,
    });

    const sessionTitle = title || analysis.title || fileMetadata.fileName || 'Accessibility Analysis';

    // Persist session
    const session = await sessionRepo.create({
      userId,
      guestId: guestId || (userId ? null : 'guest_' + Math.random().toString(36).substring(2, 9)),
      title: sessionTitle,
      contentType,
      summary: analysis.summary,
      simpleExplanation: analysis.simpleExplanation,
      keyPoints: analysis.keyPoints,
      requiredActions: analysis.requiredActions,
      steps: analysis.steps,
      deadlines: analysis.deadlines,
      requiredDocuments: analysis.requiredDocuments,
      importantWarnings: analysis.importantWarnings,
      missingInformation: analysis.missingInformation,
      visualDescription: analysis.visualDescription || '',
      difficultyLevel: analysis.difficultyLevel,
      suggestedQuestions: analysis.suggestedQuestions,
      originalText: extractedText,
      fileMetadata,
      activeLanguage: language,
    });

    // Update user stats
    if (userId) {
      await userRepo.incrementStat(userId, 'documentsAnalyzed', 1);
    }

    res.status(201).json({
      success: true,
      message: 'Content analyzed successfully.',
      session,
      analysis,
    });
  } catch (error) {
    next(error);
  }
}

export async function askQuestion(req, res, next) {
  try {
    const { sessionId, question, language = 'en' } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Accessibility session not found.',
      });
    }

    const qnaResponse = await geminiService.answerQuestion({
      documentContent: session.originalText || session.simpleExplanation,
      question,
      previousQnA: session.qnaHistory || [],
      userLanguage: language,
    });

    const newQnA = {
      question,
      answer: qnaResponse.answer,
      timestamp: new Date(),
    };

    const updatedQnA = [...(session.qnaHistory || []), newQnA];
    await sessionRepo.update(sessionId, { qnaHistory: updatedQnA });

    if (userId) {
      await userRepo.incrementStat(userId, 'questionsAnswered', 1);
    }

    res.status(200).json({
      success: true,
      answer: qnaResponse.answer,
      sourceFound: qnaResponse.sourceFound,
      relevantSection: qnaResponse.relevantSection,
      suggestedFollowUp: qnaResponse.suggestedFollowUp,
      qnaHistory: updatedQnA,
    });
  } catch (error) {
    next(error);
  }
}

export async function translateContent(req, res, next) {
  try {
    const { sessionId, targetLanguage } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Accessibility session not found.',
      });
    }

    const translated = await geminiService.translateContent({
      sessionData: session,
      targetLanguage,
    });

    const existingTranslations = session.translations || [];
    const filtered = existingTranslations.filter(t => t.language !== targetLanguage);
    filtered.push({
      language: targetLanguage,
      simpleExplanation: translated.simpleExplanation,
      keyPoints: translated.keyPoints,
      requiredActions: translated.requiredActions,
      steps: translated.steps,
      translatedAt: new Date(),
    });

    await sessionRepo.update(sessionId, {
      translations: filtered,
      activeLanguage: targetLanguage,
    });

    if (userId) {
      await userRepo.incrementStat(userId, 'translationsCount', 1);
    }

    res.status(200).json({
      success: true,
      targetLanguage,
      translation: translated,
    });
  } catch (error) {
    next(error);
  }
}

export async function simplifyContent(req, res, next) {
  try {
    const { sessionId, level = 'evenSimpler' } = req.body;

    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Accessibility session not found.',
      });
    }

    const result = await geminiService.makeEvenSimpler({
      simpleExplanation: session.simpleExplanation,
      level,
    });

    await sessionRepo.update(sessionId, {
      evenSimplerExplanation: result.evenSimplerExplanation,
    });

    res.status(200).json({
      success: true,
      evenSimplerExplanation: result.evenSimplerExplanation,
      analogyOrExample: result.analogyOrExample,
      bulletTakeaways: result.bulletTakeaways,
    });
  } catch (error) {
    next(error);
  }
}

export async function describeImage(req, res, next) {
  try {
    const file = req.file;
    if (!file || !file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a valid image file (PNG, JPG, WebP) to describe.',
      });
    }

    const analysis = await geminiService.analyzeContent({
      imageBuffer: file.buffer,
      imageMimeType: file.mimetype,
      contentType: 'image',
      userLanguage: 'en',
    });

    res.status(200).json({
      success: true,
      description: analysis.visualDescription || analysis.summary,
      analysis,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSampleData(req, res, next) {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const { guestId } = req.query;

    const session = await sessionRepo.create({
      userId,
      guestId: guestId || (userId ? null : 'guest_sample'),
      title: SAMPLE_DOCUMENT_TITLE,
      contentType: 'pdf',
      summary: SAMPLE_STRUCTURED_ANALYSIS.summary,
      simpleExplanation: SAMPLE_STRUCTURED_ANALYSIS.simpleExplanation,
      evenSimplerExplanation: SAMPLE_STRUCTURED_ANALYSIS.evenSimplerExplanation,
      keyPoints: SAMPLE_STRUCTURED_ANALYSIS.keyPoints,
      requiredActions: SAMPLE_STRUCTURED_ANALYSIS.requiredActions,
      steps: SAMPLE_STRUCTURED_ANALYSIS.steps,
      deadlines: SAMPLE_STRUCTURED_ANALYSIS.deadlines,
      requiredDocuments: SAMPLE_STRUCTURED_ANALYSIS.requiredDocuments,
      importantWarnings: SAMPLE_STRUCTURED_ANALYSIS.importantWarnings,
      missingInformation: SAMPLE_STRUCTURED_ANALYSIS.missingInformation,
      visualDescription: SAMPLE_STRUCTURED_ANALYSIS.visualDescription,
      difficultyLevel: SAMPLE_STRUCTURED_ANALYSIS.difficultyLevel,
      suggestedQuestions: SAMPLE_STRUCTURED_ANALYSIS.suggestedQuestions,
      originalText: SAMPLE_DOCUMENT_TEXT,
      fileMetadata: {
        fileName: 'National_Higher_Education_Grant_Notice_2026.pdf',
        fileType: 'application/pdf',
        fileSize: 420000,
        pageCount: 3,
      },
      activeLanguage: 'en',
    });

    res.status(200).json({
      success: true,
      message: 'Sample loaded successfully.',
      session,
      analysis: SAMPLE_STRUCTURED_ANALYSIS,
      originalText: SAMPLE_DOCUMENT_TEXT,
    });
  } catch (error) {
    next(error);
  }
}

export async function processVoice(req, res, next) {
  try {
    const {
      transcript,
      sessionId,
      visionSessionId,
      activePage = 'workspace',
      language = 'en',
      visionContext = null,
    } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No voice transcript received.',
      });
    }

    let session = null;
    if (sessionId) {
      session = await sessionRepo.findById(sessionId);
    }

    let visionSession = null;
    if (visionSessionId) {
      visionSession = await visionSessionRepo.findById(visionSessionId);
    }
    if (!visionSession && visionContext) {
      visionSession = visionContext;
    }

    const commandResult = await routeVoiceCommand({
      transcript,
      activePage,
      session,
      visionSession,
      language,
    });

    if (session && commandResult.intent === 'QUESTION') {
      const newQnA = {
        question: transcript,
        answer: commandResult.spokenResponse,
        timestamp: new Date(),
      };
      const updatedQnA = [...(session.qnaHistory || []), newQnA];
      await sessionRepo.update(sessionId, { qnaHistory: updatedQnA });
    }

    if (userId) {
      await userRepo.incrementStat(userId, 'questionsAnswered', 1);
    }

    return res.status(200).json({
      success: true,
      transcript,
      ...commandResult,
    });
  } catch (error) {
    next(error);
  }
}
