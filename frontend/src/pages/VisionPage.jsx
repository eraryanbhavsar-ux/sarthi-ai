import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import { visionService } from '../services/visionService.js';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '../services/languageRegistry.js';
import {
  detectSceneChange,
  captureRepresentativeFrame,
  resetSceneDetector,
} from '../utils/sceneDetector.js';
import {
  Video,
  VideoOff,
  Upload,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  Mic,
  MicOff,
  Sparkles,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Globe,
  RotateCcw,
  ListChecks,
  Eye,
  EyeOff,
  Layers,
  ShieldCheck,
  Zap,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';

export default function VisionPage() {
  const { user } = useAuth();
  const { setVoiceContext } = useVoiceAssistant();
  const {
    activeLanguage,
    setActiveLanguage,
    blindMode,
    setBlindMode,
    speakAnnouncement,
    speakText,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    isSpeaking,
    isPaused,
    speechState,
    startListening,
    stopListening,
    isListening,
    recognitionTranscript,
    announce,
  } = useAccessibility();

  // Camera & Stream State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionState, setCameraPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied', 'error'
  const [cameraError, setCameraError] = useState('');
  const [isAnalysisPaused, setIsAnalysisPaused] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sceneStatus, setSceneStatus] = useState('IDLE'); // 'IDLE', 'OBSERVING', 'ANALYZING', 'STABLE'

  // Vision Analysis State
  const [analysis, setAnalysis] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [translatingLanguage, setTranslatingLanguage] = useState(false);

  // Auto-Speak Setting (Default OFF for sensible throttling)
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Active secondary feature tab ('overview', 'reader', 'qna', 'form')
  const [activeTab, setActiveTab] = useState('overview');

  // Q&A State
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qnaList, setQnaList] = useState([]);

  // Smart Form State
  const [formFieldIndex, setFormFieldIndex] = useState(0);
  const [formGuidance, setFormGuidance] = useState(null);
  const [loadingFormGuide, setLoadingFormGuide] = useState(false);

  // Keyboard Shortcuts Modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const lastSpokenTextRef = useRef('');
  const lastSpokenTimeRef = useRef(0);
  const fileInputRef = useRef(null);
  const liveRegionRef = useRef(null);
  const hasInitializedCameraRef = useRef(false);

  const currentLang = getLanguageInfo(activeLanguage);

  // Keep Voice Assistant synchronized with active Vision context
  useEffect(() => {
    setVoiceContext((prev) => ({
      ...prev,
      activePage: 'vision',
      visionSessionId: currentSession?._id || null,
      visionContext: analysis
        ? {
            description: analysis.description,
            visibleText: analysis.visibleText,
            documentHeading: analysis.documentHeading,
            isDocument: analysis.isDocument,
            importantInformation: analysis.importantInformation,
            objects: analysis.objects,
            warnings: analysis.warnings,
          }
        : null,
      currentSection: activeTab,
    }));

    return () => {
      setVoiceContext((prev) => ({
        ...prev,
        activePage: null,
        visionSessionId: null,
        visionContext: null,
      }));
    };
  }, [currentSession, analysis, activeTab, setVoiceContext]);

  /**
   * Initialize and request camera stream
   */
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setCameraPermissionState('granted');
      setSceneStatus('OBSERVING');
      resetSceneDetector();
      speakAnnouncement(
        'SARTHI Vision active. Point your camera at an object, document, or scene. SARTHI will automatically describe what it sees.'
      );
    } catch (err) {
      console.warn('[SARTHI Vision] Camera access error:', err);
      let errMessage = 'Unable to access camera on this device.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermissionState('denied');
        errMessage =
          'Camera access is disabled. Please allow camera access in your browser settings to use SARTHI Vision.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraPermissionState('error');
        errMessage = 'No camera found on this device. You can upload an image or explore the verified sample document.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraPermissionState('error');
        errMessage = 'Camera is already in use by another application. Please close other camera apps and retry.';
      }

      setCameraError(errMessage);
      setCameraActive(false);
      speakAnnouncement(errMessage);
    }
  }, [speakAnnouncement]);

  /**
   * Stop camera stream and free hardware
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setSceneStatus('IDLE');
    resetSceneDetector();
    speakAnnouncement('Camera stopped.');
  }, [speakAnnouncement]);

  // Clean up hardware stream completely on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      stopSpeaking();
      resetSceneDetector();
    };
  }, [stopSpeaking]);

  // Auto-start camera once on initial mount
  useEffect(() => {
    if (!hasInitializedCameraRef.current) {
      hasInitializedCameraRef.current = true;
      startCamera();
    }
  }, [startCamera]);

  /**
   * Analyze captured video frame with Gemini Vision backend
   */
  const analyzeCurrentFrame = useCallback(
    async (force = false) => {
      if (!videoRef.current || !cameraActive || isAnalyzingRef.current || isAnalysisPaused) {
        return;
      }

      // 1. Scene change detection (unless explicitly forced by user/voice command)
      if (!force) {
        const { hasChanged } = detectSceneChange(videoRef.current);
        if (!hasChanged && analysis) {
          setSceneStatus('STABLE');
          return;
        }
      }

      const frameBase64 = captureRepresentativeFrame(videoRef.current, 1280);
      if (!frameBase64) return;

      isAnalyzingRef.current = true;
      setAnalyzing(true);
      setSceneStatus('ANALYZING');
      setAnalysisError('');

      try {
        const res = await visionService.analyzeVision({
          imageBase64: frameBase64,
          language: activeLanguage,
          guestId: user ? null : `guest_${Date.now()}`,
          capturedViaCamera: true,
          fileName: 'live_vision_frame.jpg',
        });

        if (res.success && res.analysis) {
          setAnalysis(res.analysis);
          setCurrentSession(res.session);
          setUploadedImagePreview(null);
          setSceneStatus('OBSERVING');

          const newDesc = res.analysis.description || '';

          // Screen reader announcement
          announce(`SARTHI Vision update: ${newDesc}`);

          // Automatic Voice Handling with Duplicate Suppression & Cooldown
          if (autoSpeak && newDesc) {
            const now = Date.now();
            const isDifferent =
              newDesc.trim().toLowerCase() !== lastSpokenTextRef.current.trim().toLowerCase();
            const cooldownPassed = now - lastSpokenTimeRef.current > 4000;

            if (isDifferent && cooldownPassed) {
              lastSpokenTextRef.current = newDesc;
              lastSpokenTimeRef.current = now;
              speakText(newDesc, activeLanguage);
            }
          }
        }
      } catch (err) {
        console.warn('[SARTHI Vision] Live frame analysis error:', err.message);
        // Non-intrusive warning so the feed continues running smoothly
        setAnalysisError(err.message || 'Vision analysis temporarily unavailable.');
      } finally {
        isAnalyzingRef.current = false;
        setAnalyzing(false);
      }
    },
    [cameraActive, isAnalysisPaused, analysis, activeLanguage, user, announce, autoSpeak, speakText]
  );

  /**
   * Periodic automatic analysis timer (polls every 3 seconds)
   */
  useEffect(() => {
    if (cameraActive && !isAnalysisPaused) {
      analysisIntervalRef.current = setInterval(() => {
        analyzeCurrentFrame(false);
      }, 3000);
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [cameraActive, isAnalysisPaused, analyzeCurrentFrame]);

  /**
   * Translate active vision result on-the-fly when user changes language
   */
  const handleLanguageChange = async (newLangCode) => {
    setActiveLanguage(newLangCode);

    if (analysis) {
      setTranslatingLanguage(true);
      try {
        const res = await visionService.translateVision({
          visionData: analysis,
          targetLanguage: newLangCode,
        });

        if (res.success && res.translated) {
          const updatedAnalysis = {
            ...analysis,
            description: res.translated.description || analysis.description,
            documentHeading: res.translated.documentHeading || analysis.documentHeading,
            visibleText: res.translated.visibleText || analysis.visibleText,
            importantInformation: res.translated.importantInformation || analysis.importantInformation,
            warnings: res.translated.warnings || analysis.warnings,
          };
          setAnalysis(updatedAnalysis);

          const langInfo = getLanguageInfo(newLangCode);
          announce(`Language switched to ${langInfo.displayName}. ${updatedAnalysis.description}`);

          if (autoSpeak && updatedAnalysis.description) {
            speakText(updatedAnalysis.description, newLangCode);
          }
        }
      } catch (err) {
        console.warn('[SARTHI Vision] On-the-fly translation error:', err.message);
      } finally {
        setTranslatingLanguage(false);
      }
    }
  };

  /**
   * Listen for "Hey Sarthi" voice assistant commands dispatched globally
   */
  useEffect(() => {
    const handleVoiceAction = (e) => {
      const action = e.detail;
      if (!action) return;

      if (action.type === 'ANALYZE_CAMERA') {
        analyzeCurrentFrame(true);
      } else if (action.type === 'READ_VISIBLE_TEXT') {
        handleReadVisibleText();
      } else if (action.type === 'SWITCH_LANGUAGE' && action.payload?.language) {
        handleLanguageChange(action.payload.language);
      }
    };

    window.addEventListener('sarthi-vision-action', handleVoiceAction);
    return () => window.removeEventListener('sarthi-vision-action', handleVoiceAction);
  }, [analyzeCurrentFrame, analysis]);

  /**
   * Read visible document text aloud
   */
  const handleReadVisibleText = () => {
    if (!analysis) {
      speakAnnouncement('No active visual analysis to read yet.');
      return;
    }

    if (analysis.visibleText && analysis.visibleText.length > 0) {
      const textToRead = analysis.visibleText.join('. ');
      speakText(textToRead, activeLanguage);
    } else if (analysis.documentHeading) {
      speakText(analysis.documentHeading, activeLanguage);
    } else {
      speakAnnouncement('The text is not clear enough for me to read reliably.');
    }
  };

  /**
   * Read main summary aloud
   */
  const handleSpeakMainDescription = () => {
    if (!analysis?.description) {
      speakAnnouncement('No visual description available yet. Point your camera at an object or document.');
      return;
    }

    let speech = analysis.description;
    if (analysis.isDocument && analysis.documentHeading) {
      speech = `${analysis.documentHeading}. ${speech}`;
    }
    speakText(speech, activeLanguage);
  };

  /**
   * Handle optional file upload for users who want to analyze an existing photo
   */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const msg = 'Please choose a valid image file (JPEG, PNG, or WebP).';
      setAnalysisError(msg);
      speakAnnouncement(msg);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      setUploadedImagePreview(base64Data);
      stopCamera();
      setAnalyzing(true);
      setAnalysisError('');

      try {
        const response = await visionService.analyzeVision({
          file,
          language: activeLanguage,
          guestId: user ? null : `guest_${Date.now()}`,
          capturedViaCamera: false,
          fileName: file.name,
        });

        if (response.success && response.analysis) {
          setAnalysis(response.analysis);
          setCurrentSession(response.session);
          setAnalyzing(false);
          const speech = response.analysis.description || 'Image analyzed.';
          speakAnnouncement(speech, true);
        }
      } catch (err) {
        setAnalysisError(err.message || 'Failed to analyze uploaded photo.');
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Load verified sample circular document
   */
  const loadSampleDocument = async () => {
    setAnalyzing(true);
    setAnalysisError('');
    stopCamera();
    try {
      const response = await visionService.getVisionSample(activeLanguage);
      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
        setUploadedImagePreview(null);
        setCurrentSession({ _id: 'sample_session_scholarship', isSample: true });
        setAnalyzing(false);
        setQnaList([]);
        setFormFieldIndex(0);

        const speech = `Sample Document Loaded. ${response.analysis.description}`;
        speakAnnouncement(speech, true);
      }
    } catch (err) {
      setAnalysisError('Could not load sample document.');
      setAnalyzing(false);
    }
  };

  /**
   * Ask contextual question about scene
   */
  const handleAskQuestion = async (customQ = null) => {
    const q = (customQ || questionInput).trim();
    if (!q) return;

    setIsAsking(true);
    const userQItem = { question: q, answer: null, timestamp: new Date() };
    setQnaList((prev) => [...prev, userQItem]);
    setQuestionInput('');

    try {
      const response = await visionService.askVisionQuestion({
        sessionId: currentSession?._id,
        question: q,
        visionContext: analysis,
        language: activeLanguage,
      });

      if (response.success) {
        const answerText = response.answer;
        setQnaList((prev) =>
          prev.map((item) => (item.question === q && item.answer === null ? { ...item, answer: answerText } : item))
        );
        speakText(answerText, activeLanguage);
      }
    } catch (err) {
      const fallback =
        "I can't confidently determine that from this view. Please ensure the scene is centered and well-lit.";
      setQnaList((prev) =>
        prev.map((item) => (item.question === q && item.answer === null ? { ...item, answer: fallback } : item))
      );
      speakText(fallback, activeLanguage);
    } finally {
      setIsAsking(false);
    }
  };

  /**
   * Form Field Guide Step-by-Step
   */
  const fetchFormGuidance = useCallback(
    async (fieldIdx) => {
      if (!analysis?.detectedForm?.fields?.length) return;
      const fields = analysis.detectedForm.fields;
      if (fieldIdx < 0 || fieldIdx >= fields.length) return;

      setLoadingFormGuide(true);
      try {
        const response = await visionService.guideForm({
          sessionId: currentSession?._id,
          fields,
          currentFieldIndex: fieldIdx,
          language: activeLanguage,
        });

        if (response.success) {
          setFormGuidance(response);
          setFormFieldIndex(fieldIdx);
          const speech = `Field ${fieldIdx + 1} of ${fields.length}: ${response.currentField.label}. ${
            response.plainExplanation
          }. ${response.validationTip || ''}`;
          speakAnnouncement(speech, true);
        }
      } catch (err) {
        console.warn('Form guidance error:', err);
      } finally {
        setLoadingFormGuide(false);
      }
    },
    [analysis, currentSession, activeLanguage, speakAnnouncement]
  );

  return (
    <main id="main-content" className="min-h-screen bg-slate-950 text-slate-100 pb-20 transition-colors">
      {/* Hidden Live Region for Screen Readers */}
      <div ref={liveRegionRef} aria-live="polite" className="sr-only" />

      {/* Top Banner: Voice-First & Safety Notice */}
      <section className="bg-slate-900 border-b border-slate-800 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>👁 SARTHI Vision — Live AI Accessibility Vision Assistant</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setBlindMode(!blindMode)}
              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                blindMode
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              aria-pressed={blindMode}
              aria-label="Toggle Blind / Voice-First Mode"
            >
              {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Voice-First: {blindMode ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
              aria-label="View keyboard shortcuts"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>
          </div>
        </div>
      </section>

      {/* Accessibility Safety Disclaimer */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-[11px] sm:text-xs text-amber-200/90 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
        <span>
          <strong>Assistive Aid Notice:</strong> SARTHI Vision describes objects, scenes, and reads documents. It does not provide collision avoidance or navigation in physical spaces.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-6">
        {/* Main Live Camera + AI Description Hub (Large Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================
              LEFT COLUMN: LARGE LIVE CAMERA VIEWPORT (7 COLS)
              ======================================================== */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-black rounded-3xl border-2 border-slate-800 overflow-hidden relative shadow-2xl flex flex-col items-center justify-center min-h-[380px] sm:min-h-[480px] lg:min-h-[520px]">
              {/* Active Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover min-h-[380px] sm:min-h-[480px] lg:min-h-[520px] bg-black ${
                  cameraActive ? 'block' : 'hidden'
                }`}
                aria-label="Live camera feed for SARTHI Vision"
              />

              {/* Uploaded Snapshot Preview (If user chose to upload a file) */}
              {!cameraActive && uploadedImagePreview && (
                <div className="relative w-full h-full">
                  <img
                    src={uploadedImagePreview}
                    alt="Uploaded scene inspected by SARTHI Vision"
                    className="w-full max-h-[520px] object-contain bg-black"
                  />
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded-full text-xs text-amber-300 font-bold border border-amber-500/30">
                    Uploaded Photo Analysis
                  </div>
                </div>
              )}

              {/* Sample Document Demo Indicator */}
              {!cameraActive && !uploadedImagePreview && analysis && (
                <div className="p-8 text-center space-y-3">
                  <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Sample Scholarship Circular Active</h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      National Higher Education Grant Notice 2026. Point camera to return to live view.
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Paused / Permission Denied State */}
              {!cameraActive && !uploadedImagePreview && !analysis && (
                <div className="p-8 text-center space-y-4 max-w-md">
                  <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <VideoOff className="w-9 h-9" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-100 text-lg">
                      {cameraPermissionState === 'denied' ? 'Camera Access Disabled' : 'Camera is Currently Paused'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {cameraPermissionState === 'denied'
                        ? 'Camera access is needed so SARTHI can describe what is in front of you. Please allow camera permissions in your browser settings.'
                        : 'Start the live camera so SARTHI can continuously observe and describe what you hold up.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white font-extrabold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-brand-500/20 focus:ring-4 focus:ring-amber-400"
                    >
                      <Video className="w-4 h-4" />
                      <span>{cameraPermissionState === 'denied' ? 'Retry Camera Permission' : 'Start Live Camera'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={loadSampleDocument}
                      className="px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Try Sample</span>
                    </button>
                  </div>
                </div>
              )}

              {/* OVERLAY BADGES & CONTROLS ON LIVE CAMERA */}
              {cameraActive && (
                <>
                  {/* Top-Left Live Status Pill */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-extrabold text-emerald-300">Live Vision Active</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-[11px] text-slate-300 font-medium">
                      {analyzing ? '🔍 Analyzing Scene...' : sceneStatus === 'STABLE' ? '👁 Scene Stable' : 'Point at anything'}
                    </span>
                  </div>

                  {/* Top-Right Pause/Resume & Re-analyze Controls */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAnalysisPaused(!isAnalysisPaused)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all flex items-center gap-1.5 ${
                        isAnalysisPaused
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900/85 text-slate-200 border-slate-700 hover:bg-slate-800'
                      }`}
                      aria-label={isAnalysisPaused ? 'Resume Automatic Analysis' : 'Pause Automatic Analysis'}
                      title={isAnalysisPaused ? 'Resume Automatic AI Vision' : 'Pause Automatic AI Vision'}
                    >
                      {isAnalysisPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      <span>{isAnalysisPaused ? 'Resume AI' : 'Pause AI'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => analyzeCurrentFrame(true)}
                      disabled={analyzing}
                      className="p-2 bg-slate-900/85 hover:bg-slate-800 text-amber-400 rounded-full border border-slate-700 backdrop-blur-md focus:ring-4 focus:ring-amber-400"
                      aria-label="Force immediate scene analysis"
                      title="Inspect current camera view now"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Bottom Sub-bar */}
                  <div className="absolute inset-x-4 bottom-4 z-10 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/75 backdrop-blur px-3.5 py-1.5 rounded-xl border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      Automatic scene analysis every 3s
                    </span>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                    >
                      <VideoOff className="w-3.5 h-3.5" />
                      Turn off camera
                    </button>
                  </div>
                </>
              )}

              {/* Analysis Loading Spinner Overlay */}
              {analyzing && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none transition-all">
                  <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-sm font-bold text-white tracking-wide">Observing scene with SARTHI Vision...</p>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {cameraError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs font-medium flex items-center justify-between gap-3"
              >
                <span>{cameraError}</span>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              RIGHT COLUMN: SARTHI SEES (AI VISION ASSISTANT PANEL) (5 COLS)
              ======================================================== */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main AI Description Card */}
            <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border-2 border-slate-800 shadow-xl space-y-4">
              {/* Header: Title + Language Selector */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400" aria-hidden="true" />
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                    <span>👁 SARTHI Sees</span>
                  </h2>
                </div>

                {/* Regional Language Selector */}
                <div className="relative">
                  <label htmlFor="vision-lang-select" className="sr-only">
                    Select Vision Language
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-400" aria-hidden="true" />
                    <select
                      id="vision-lang-select"
                      value={activeLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      disabled={translatingLanguage}
                      className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                          {lang.nativeName} ({lang.englishName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary Visual Description Display */}
              <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
                {translatingLanguage ? (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-amber-300 font-bold">Translating into {currentLang.displayName}...</p>
                  </div>
                ) : analysis?.description ? (
                  <>
                    <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed font-sans">
                      "{analysis.description}"
                    </p>

                    {/* Confidence / Caution Badge */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {analysis.confidence === 'low' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Cautious interpretation: not completely certain
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                          <Check className="w-3 h-3" />
                          High Confidence
                        </span>
                      )}

                      {analysis.spatialLayout && (
                        <span className="text-[11px] text-slate-400 italic">
                          ({analysis.spatialLayout})
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <p className="text-sm font-medium">Hold an object, document, or label in front of the camera.</p>
                    <p className="text-xs text-slate-500">
                      SARTHI will automatically recognize it and describe it in plain language.
                    </p>
                  </div>
                )}
              </div>

              {/* Identified Object Tags */}
              {analysis?.objects && analysis.objects.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Identified Objects:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.objects.map((obj, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700"
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Detection Banner & Quick Read Button */}
              {analysis?.isDocument && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Document Detected</span>
                    </div>
                    {analysis.documentHeading && (
                      <span className="text-[11px] text-amber-200 truncate max-w-[180px] font-medium">
                        {analysis.documentHeading}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleReadVisibleText}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Read Document Text Aloud</span>
                  </button>
                </div>
              )}

              {/* Dynamic Listen Button + Speech Controls */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleSpeakMainDescription}
                  disabled={!analysis?.description}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 focus:ring-4 focus:ring-white transition-all"
                  aria-label={currentLang.listenLabel}
                >
                  <Volume2 className="w-5 h-5" />
                  <span>{currentLang.listenLabel}</span>
                </button>

                {/* Player Controls when Speaking or Paused */}
                {(isSpeaking || isPaused) && (
                  <div className="flex items-center justify-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                    {isPaused ? (
                      <button
                        type="button"
                        onClick={resumeSpeaking}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{currentLang.resumeLabel}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={pauseSpeaking}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>{currentLang.pauseLabel}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-rose-500/30"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>{currentLang.stopLabel}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Automatic Voice (Auto Speak) Setting Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <label htmlFor="auto-speak-toggle" className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auto Speak Observations</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Automatically narrates new observations aloud
                  </p>
                </div>

                <button
                  type="button"
                  id="auto-speak-toggle"
                  role="switch"
                  aria-checked={autoSpeak}
                  onClick={() => {
                    const next = !autoSpeak;
                    setAutoSpeak(next);
                    announce(`Auto speak observations turned ${next ? 'ON' : 'OFF'}`);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    autoSpeak ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoSpeak ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Secondary Navigation (Q&A, Form Guide, Upload) */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'qna' ? 'overview' : 'qna')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                    activeTab === 'qna'
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
                  <span>Ask Question</span>
                </button>

                {analysis?.detectedForm?.hasForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(activeTab === 'form' ? 'overview' : 'form');
                      if (!formGuidance) fetchFormGuidance(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      activeTab === 'form'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Smart Form Guide</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload File</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Upload photo from device"
                />
              </div>
            </div>

            {/* Q&A DRAWER TAB (When toggled) */}
            {activeTab === 'qna' && (
              <div className="bg-slate-900 p-5 rounded-3xl border-2 border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-brand-400" />
                    <span>Ask SARTHI about this scene</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {qnaList.map((item, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <p className="font-bold text-amber-300">Q: {item.question}</p>
                      <p className="text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        {item.answer || 'Thinking...'}
                      </p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="e.g. Is there any deadline or warning?"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !questionInput.trim()}
                    className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
                  >
                    {isAsking ? '...' : 'Ask'}
                  </button>
                </form>
              </div>
            )}

            {/* SMART FORM GUIDE DRAWER TAB (When toggled) */}
            {activeTab === 'form' && analysis?.detectedForm?.fields && (
              <div className="bg-slate-900 p-5 rounded-3xl border-2 border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Field {formFieldIndex + 1} of {analysis.detectedForm.fields.length}</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                {loadingFormGuide ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Loading field guidance...</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <p className="font-extrabold text-amber-300">
                        {analysis.detectedForm.fields[formFieldIndex]?.label}
                      </p>
                      <p className="text-slate-200">
                        {formGuidance?.plainExplanation ||
                          analysis.detectedForm.fields[formFieldIndex]?.explanation}
                      </p>
                      {formGuidance?.validationTip && (
                        <p className="text-[11px] text-amber-400/90 pt-1">
                          Tip: {formGuidance.validationTip}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        disabled={formFieldIndex === 0}
                        onClick={() => fetchFormGuidance(formFieldIndex - 1)}
                        className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg font-bold"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={formFieldIndex >= analysis.detectedForm.fields.length - 1}
                        onClick={() => fetchFormGuidance(formFieldIndex + 1)}
                        className="px-3 py-1.5 bg-brand-600 disabled:opacity-40 text-white rounded-lg font-bold"
                      >
                        Next Field
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard Shortcuts"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">SARTHI Vision Shortcuts</h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Toggle Camera Stream</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono">C</kbd>
              </div>
              <div className="flex justify-between">
                <span>Stop Speech Narration</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono">S</kbd>
              </div>
              <div className="flex justify-between">
                <span>Re-analyze Current View</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono">R</kbd>
              </div>
            </div>
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
