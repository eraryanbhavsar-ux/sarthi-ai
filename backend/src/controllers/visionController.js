import { geminiService } from '../services/ai/geminiService.js';
import { visionSessionRepo } from '../models/visionSessionRepo.js';
import { userRepo } from '../models/userRepo.js';

/**
 * Controller for SARTHI Vision: Blind & Low-Vision Assistive Vision System
 */

export async function analyzeVision(req, res, next) {
  try {
    const file = req.file;
    const { imageBase64, language = 'en', guestId, capturedViaCamera = false, fileName = 'Vision_Snapshot.jpg' } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    let imageBuffer = null;
    let imageMimeType = 'image/jpeg';
    let fileSize = 0;

    if (file) {
      imageBuffer = file.buffer;
      imageMimeType = file.mimetype;
      fileSize = file.size;
    } else if (imageBase64) {
      // Decode base64 data URL (e.g. data:image/jpeg;base64,...)
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        imageMimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        imageBuffer = Buffer.from(imageBase64, 'base64');
      }
      fileSize = imageBuffer.length;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please capture an image using your camera or upload a photo to analyze.',
      });
    }

    // Validate size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image file size must not exceed 10 MB.',
      });
    }

    // Validate image MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(imageMimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid JPEG, PNG, or WebP image.',
      });
    }

    // Run multimodal vision analysis
    const analysis = await geminiService.analyzeVision({
      imageBuffer,
      imageMimeType,
      userLanguage: language,
    });

    // Persist vision session
    const sessionData = {
      userId: userId || null,
      guestId: guestId || (userId ? null : `guest_${Date.now()}`),
      description: analysis.description,
      visibleText: analysis.visibleText,
      importantInformation: analysis.importantInformation,
      objects: analysis.objects,
      possibleActions: analysis.possibleActions,
      warnings: analysis.warnings,
      isDocument: analysis.isDocument,
      spatialLayout: analysis.spatialLayout,
      detectedForm: analysis.detectedForm,
      activeLanguage: language,
      fileMetadata: {
        fileName: file ? file.originalname : fileName,
        fileType: imageMimeType,
        fileSize,
        capturedViaCamera: Boolean(capturedViaCamera),
      },
    };

    const savedSession = await visionSessionRepo.create(sessionData);

    // Update user stats if authenticated
    if (userId) {
      await userRepo.update(userId, {
        $inc: { 'stats.visionScansCompleted': 1 },
      });
    }

    return res.status(200).json({
      success: true,
      session: savedSession,
      analysis,
    });
  } catch (err) {
    next(err);
  }
}

export async function askVisionQuestion(req, res, next) {
  try {
    const { sessionId, question, visionContext, language = 'en', isVoiceCommand = false } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a question to ask SARTHI.',
      });
    }

    let activeContext = visionContext;
    let session = null;

    if (sessionId) {
      session = await visionSessionRepo.findById(sessionId);
      if (session) {
        activeContext = {
          description: session.description,
          visibleText: session.visibleText,
          importantInformation: session.importantInformation,
          objects: session.objects,
          possibleActions: session.possibleActions,
          warnings: session.warnings,
          isDocument: session.isDocument,
          spatialLayout: session.spatialLayout,
          detectedForm: session.detectedForm,
        };
      }
    }

    if (!activeContext) {
      activeContext = {
        description: 'An official document with requirements, eligibility criteria, and deadlines.',
        visibleText: [],
        importantInformation: [],
      };
    }

    const answerResult = await geminiService.answerVisionQuestion({
      visionContext: activeContext,
      question: question.trim(),
      userLanguage: language,
    });

    // Save Q&A to session if session exists
    if (sessionId && session) {
      const qnaItem = {
        question: question.trim(),
        answer: answerResult.answer,
        timestamp: new Date(),
      };
      const updatedHistory = [...(session.qnaHistory || []), qnaItem];
      await visionSessionRepo.update(sessionId, { qnaHistory: updatedHistory });
    }

    // Record voice interaction
    if (isVoiceCommand) {
      await visionSessionRepo.recordVoiceInteraction({
        userId,
        sessionId: sessionId || null,
        command: question.trim(),
        response: answerResult.answer,
        actionTriggered: 'VOICE_QUERY',
        language,
      });
    }

    return res.status(200).json({
      success: true,
      answer: answerResult.answer,
      confident: answerResult.confident,
      suggestedFollowUp: answerResult.suggestedFollowUp || [],
    });
  } catch (err) {
    next(err);
  }
}

export async function guideForm(req, res, next) {
  try {
    const { sessionId, fields, currentFieldIndex = 0, language = 'en' } = req.body;

    let targetFields = fields;
    if (!targetFields && sessionId) {
      const session = await visionSessionRepo.findById(sessionId);
      if (session && session.detectedForm && session.detectedForm.fields) {
        targetFields = session.detectedForm.fields;
      }
    }

    if (!targetFields || targetFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No form fields found to guide.',
      });
    }

    const guidance = await geminiService.guideForm({
      fields: targetFields,
      currentFieldIndex: Number(currentFieldIndex),
      userLanguage: language,
    });

    return res.status(200).json({
      success: true,
      ...guidance,
    });
  } catch (err) {
    next(err);
  }
}

export async function getVisionSessions(req, res, next) {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const { guestId } = req.query;

    if (!userId && !guestId) {
      return res.status(400).json({
        success: false,
        error: 'User ID or Guest ID is required to fetch vision sessions.',
      });
    }

    const sessions = await visionSessionRepo.findByUserOrGuest(userId, guestId);
    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (err) {
    next(err);
  }
}

function isAuthorizedForVisionSession(session, req) {
  if (!session) return false;
  const requestingUserId = req.user ? (req.user._id || req.user.id)?.toString() : null;
  const requestingGuestId = req.query.guestId || req.headers['x-guest-id'] || req.body?.guestId;

  if (session.userId) {
    return requestingUserId && session.userId.toString() === requestingUserId;
  }
  if (session.guestId && requestingGuestId) {
    return session.guestId === requestingGuestId;
  }
  return true;
}

export async function getVisionSessionById(req, res, next) {
  try {
    const { id } = req.params;
    const session = await visionSessionRepo.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Vision session not found.',
      });
    }

    if (!isAuthorizedForVisionSession(session, req)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to view this vision session.',
      });
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteVisionSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await visionSessionRepo.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Vision session not found or already deleted.',
      });
    }

    if (!isAuthorizedForVisionSession(session, req)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to delete this vision session.',
      });
    }

    const success = await visionSessionRepo.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Vision session not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Vision session deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getVisionSample(req, res, next) {
  try {
    const { language = 'en' } = req.query;

    const sampleAnalysis = {
      description: "I can see an official printed scholarship notification and application circular from the Directorate of Higher Education. The document has an official header, strict eligibility clauses, and a required credentials table.",
      visibleText: [
        "GOVERNMENT DIRECTORATE OF HIGHER EDUCATION",
        "CIRCULAR NO. 44/ESW/2026: MANDATORY COMPLIANCE & ELIGIBILITY GUIDELINES",
        "Application window shall remain open strictly until 15th October 2026 at 23:59 IST.",
        "Required Credentials: Valid Aadhaar Number, certified Annual Family Income Certificate (Form 16-B) from Tahsildar establishing aggregate household income not exceeding INR 3,50,000 per annum.",
        "Original Grade Statement with CGPA of at least 75%.",
        "Under no circumstances shall tardy submissions or condonation requests be entertained by the Directorate.",
        "Candidate Signature: __________________ Date: ____________"
      ],
      importantInformation: [
        "Strict Deadline: October 15, 2026 at 23:59 IST.",
        "Income Limit: Family income must be under ₹3,50,000 per year.",
        "Academic Eligibility: Minimum CGPA of 75% or higher.",
        "3 Required Documents: Aadhaar Card, Form 16-B Tahsildar Income Proof, College Marksheet."
      ],
      objects: [
        "Printed Official Document",
        "Official Emblem Header",
        "Application Form Table",
        "Signature and Verification Block"
      ],
      possibleActions: [
        "Verify your Aadhaar card and family income certificate.",
        "Fill out the online application before the October 15 deadline.",
        "Submit a signed physical copy to your college office within 7 days."
      ],
      warnings: [
        "Late submissions will be rejected without appeal.",
        "Income proof must specifically be Form 16-B issued by the Tahsildar."
      ],
      isDocument: true,
      spatialLayout: "Official government circular header at top center, eligibility clauses in the middle paragraphs, required documents listed in bullet points, and applicant signature block at the bottom right.",
      detectedForm: {
        hasForm: true,
        fields: [
          {
            name: "applicant_name",
            label: "Full Name of Candidate",
            explanation: "Write your complete legal name as registered on your official Aadhaar card.",
            isRequired: true,
            fieldIndex: 0
          },
          {
            name: "aadhaar_number",
            label: "Aadhaar Identification Number",
            explanation: "Enter your 12-digit unique Aadhaar number without hyphens or spaces.",
            isRequired: true,
            fieldIndex: 1
          },
          {
            name: "annual_income",
            label: "Annual Household Income",
            explanation: "Enter your family's annual income as certified on Form 16-B by your local Tahsildar. Must not exceed ₹3,50,000.",
            isRequired: true,
            fieldIndex: 2
          },
          {
            name: "cgpa_score",
            label: "Academic CGPA / Percentage",
            explanation: "Enter your cumulative grade point average from your previous academic year. Must be 75% or higher.",
            isRequired: true,
            fieldIndex: 3
          },
          {
            name: "applicant_signature",
            label: "Applicant Signature & Date",
            explanation: "Sign your name and date the submission before handing it to your college administration.",
            isRequired: true,
            fieldIndex: 4
          }
        ]
      }
    };

    return res.status(200).json({
      success: true,
      isSample: true,
      analysis: sampleAnalysis,
    });
  } catch (err) {
    next(err);
  }
}
