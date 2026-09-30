import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { visionService } from '../services/visionService.js';
import {
  Camera,
  Video,
  VideoOff,
  Upload,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  HelpCircle,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Globe,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trash2,
  ListChecks,
  Eye,
  EyeOff,
  Info,
  Layers,
  ChevronRight,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react';

export default function VisionPage() {
  const { user } = useAuth();
  const {
    activeLanguage,
    setActiveLanguage,
    blindMode,
    setBlindMode,
    lowVisionMode,
    setLowVisionMode,
    speakAnnouncement,
    speakText,
    stopSpeaking,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    recognitionTranscript,
  } = useAccessibility();

  // Camera & Image State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Analysis & Session State
  const [currentSession, setCurrentSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'reader', 'qna', 'form', 'actions'

  // Q&A State
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qnaList, setQnaList] = useState([]);

  // Smart Form State
  const [formFieldIndex, setFormFieldIndex] = useState(0);
  const [formGuidance, setFormGuidance] = useState(null);
  const [loadingFormGuide, setLoadingFormGuide] = useState(false);

  // Voice Command Mode
  const [voiceCommandFeedback, setVoiceCommandFeedback] = useState('');

  // Keyboard Shortcuts Modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const liveRegionRef = useRef(null);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      speakAnnouncement('Camera activated. Point your camera at a document, sign, or object, and press Space or Capture.');
    } catch (err) {
      console.error('Camera access error:', err);
      const errMessage =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera permissions in your browser or upload an image instead.'
          : 'Unable to access camera. You can still upload a photo or use our sample document.';
      setCameraError(errMessage);
      speakAnnouncement(errMessage);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    speakAnnouncement('Camera stopped.');
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopSpeaking();
    };
  }, []);

  // Capture frame from video feed
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(base64Data);
    speakAnnouncement('Photo captured. Analyzing image with SARTHI Vision AI.');
    processImage({ imageBase64: base64Data, capturedViaCamera: true });
  };

  // Handle file upload
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
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
      speakAnnouncement(`Uploaded ${file.name}. Starting SARTHI Vision analysis.`);
      processImage({ file, capturedViaCamera: false, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  // Call Vision API backend
  const processImage = async ({ file, imageBase64, capturedViaCamera = false, fileName = 'snapshot.jpg' }) => {
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysis(null);
    setCurrentSession(null);
    setQnaList([]);
    setFormFieldIndex(0);
    setFormGuidance(null);

    try {
      const response = await visionService.analyzeVision({
        file,
        imageBase64,
        language: activeLanguage,
        guestId: user ? null : `guest_${Date.now()}`,
        capturedViaCamera,
        fileName,
      });

      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
        setCurrentSession(response.session);
        setAnalyzing(false);

        // Immediate Audio Description ("What am I looking at?")
        const immediateSpeech = `${response.analysis.description} ${
          response.analysis.isDocument ? 'This looks like an official document.' : ''
        }`;
        speakAnnouncement(immediateSpeech, true);
      } else {
        throw new Error(response.error || 'Failed to analyze image.');
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
      const errMsg = err.message || 'Vision analysis failed. Please try capturing or uploading again.';
      setAnalysisError(errMsg);
      setAnalyzing(false);
      speakAnnouncement(errMsg);
    }
  };

  // 1-Click Load Sample Document
  const loadSampleDocument = async () => {
    setAnalyzing(true);
    setAnalysisError('');
    stopCamera();
    try {
      const response = await visionService.getVisionSample(activeLanguage);
      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
        setCapturedImage(null); // Shows demo indicator
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

  // Primary Action: "What am I looking at?"
  const handleWhatAmILookingAt = () => {
    if (!analysis) {
      speakAnnouncement('Please capture or upload an image first.');
      return;
    }
    const readout = `${analysis.description} ${
      analysis.importantInformation?.length
        ? `Key highlights: ${analysis.importantInformation.slice(0, 3).join('. ')}.`
        : ''
    }`;
    speakAnnouncement(readout, true);
  };

  // Read Everything Aloud
  const handleReadEverything = () => {
    if (!analysis) return;
    if (analysis.visibleText && analysis.visibleText.length > 0) {
      const fullText = analysis.visibleText.join('. ');
      speakAnnouncement(`Reading all visible text: ${fullText}`, true);
    } else {
      speakAnnouncement('No text was clearly recognized in this image.', true);
    }
  };

  // Read Important Information
  const handleReadImportant = () => {
    if (!analysis?.importantInformation?.length) {
      speakAnnouncement('No critical warnings or deadline information detected.', true);
      return;
    }
    const text = analysis.importantInformation.join('. ');
    speakAnnouncement(`Important information: ${text}`, true);
  };

  // Read Deadlines
  const handleReadDeadlines = () => {
    if (!analysis) return;
    const deadlineKeywords = ['deadline', 'date', 'until', 'before', 'october', 'window', 'tardy'];
    const matching = (analysis.visibleText || []).filter((line) =>
      deadlineKeywords.some((k) => line.toLowerCase().includes(k))
    );
    if (matching.length > 0) {
      speakAnnouncement(`Deadlines and dates found: ${matching.join('. ')}`, true);
    } else {
      speakAnnouncement('No specific deadlines were detected in this image.', true);
    }
  };

  // Ask SARTHI contextual question
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
        speakAnnouncement(answerText, true);
      }
    } catch (err) {
      const fallback = "I can't confidently determine that from this image. Please ensure the document is centered and well-lit.";
      setQnaList((prev) =>
        prev.map((item) => (item.question === q && item.answer === null ? { ...item, answer: fallback } : item))
      );
      speakAnnouncement(fallback, true);
    } finally {
      setIsAsking(false);
    }
  };

  // Form Field Guide Step-by-Step
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
        console.error('Form guidance error:', err);
      } finally {
        setLoadingFormGuide(false);
      }
    },
    [analysis, currentSession, activeLanguage]
  );

  // Navigate form fields
  const nextFormField = () => {
    if (!analysis?.detectedForm?.fields) return;
    if (formFieldIndex < analysis.detectedForm.fields.length - 1) {
      fetchFormGuidance(formFieldIndex + 1);
    } else {
      speakAnnouncement('You have reached the last recognized field of this form.', true);
    }
  };

  const prevFormField = () => {
    if (formFieldIndex > 0) {
      fetchFormGuidance(formFieldIndex - 1);
    }
  };

  // Voice Command Trigger
  const handleVoiceCommandStart = () => {
    speakAnnouncement('Voice listening active. Speak your command now.');
    startListening((transcript) => {
      const lower = transcript.toLowerCase();
      setVoiceCommandFeedback(`Heard: "${transcript}"`);

      if (lower.includes('read everything') || lower.includes('read all')) {
        handleReadEverything();
      } else if (lower.includes('read deadline') || lower.includes('deadline')) {
        handleReadDeadlines();
      } else if (lower.includes('read important') || lower.includes('important')) {
        handleReadImportant();
      } else if (lower.includes('what is this') || lower.includes('what am i looking at')) {
        handleWhatAmILookingAt();
      } else if (lower.includes('what do i need to do') || lower.includes('what to do')) {
        setActiveTab('actions');
        handleAskQuestion('What do I need to do?');
      } else if (lower.includes('translate')) {
        setActiveLanguage('mr');
        speakAnnouncement('Switching language to Marathi. भाषा मराठी निवडली आहे.', true);
      } else if (lower.includes('stop')) {
        stopSpeaking();
      } else {
        // Treat as contextual question
        setActiveTab('qna');
        handleAskQuestion(transcript);
      }
    });
  };

  // Keyboard navigation & hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (cameraActive) {
          capturePhoto();
        } else if (isSpeaking) {
          stopSpeaking();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (cameraActive) {
          stopCamera();
        } else {
          startCamera();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        handleWhatAmILookingAt();
      } else if (e.key === 's' || e.key === 'S') {
        stopSpeaking();
      } else if (e.key === 'a' || e.key === 'A') {
        handleVoiceCommandStart();
      } else if (e.key === '?') {
        setShowShortcutsModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cameraActive, isSpeaking, analysis]);

  // Reset Session
  const handleResetSession = async () => {
    if (currentSession?._id && !currentSession?.isSample) {
      try {
        await visionService.deleteVisionSession(currentSession._id);
      } catch (e) {
        console.warn('Could not delete session from server:', e);
      }
    }
    stopSpeaking();
    setAnalysis(null);
    setCurrentSession(null);
    setCapturedImage(null);
    setQnaList([]);
    setFormGuidance(null);
    speakAnnouncement('Vision session reset. Ready for your next image or scan.');
  };

  return (
    <main id="main-content" className="min-h-screen bg-slate-900 text-slate-100 pb-24 transition-colors">
      {/* Universal Hidden Live Announcer */}
      <div ref={liveRegionRef} aria-live="assertive" className="sr-only" />

      {/* Top Banner: Voice-First & Safety Notice */}
      <section className="bg-slate-950 border-b border-slate-800 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            <span>SARTHI Vision — Voice-First Assistive Visual Engine</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setBlindMode(!blindMode)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                blindMode
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              aria-pressed={blindMode}
              aria-label="Toggle Blind / Voice-First Mode"
            >
              {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Blind / Voice-First Mode: {blindMode ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-xs"
              aria-label="View keyboard shortcuts"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shortcuts (?)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Safety Disclaimer Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-200/90 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
        <span>
          <strong>Accessibility Notice:</strong> SARTHI Vision is an assistive reading & description aid. It is not an
          autonomous navigation or medical diagnosis system. Verify critical legal & financial documents independently.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">SARTHI Vision</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black uppercase">
                Accessible AI
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Live camera analysis, voice descriptions, smart document reader, and plain-language form guidance.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg focus:ring-4 focus:ring-amber-400"
                aria-label="Stop audio speech narration"
              >
                <VolumeX className="w-4 h-4" />
                Stop Audio (S)
              </button>
            ) : (
              <button
                onClick={handleWhatAmILookingAt}
                disabled={!analysis}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 rounded-xl font-bold text-sm flex items-center gap-2 border border-amber-500/30 focus:ring-4 focus:ring-amber-400"
                aria-label="Speak current visual description"
              >
                <Volume2 className="w-4 h-4" />
                Speak Summary (R)
              </button>
            )}

            <button
              onClick={handleVoiceCommandStart}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all focus:ring-4 focus:ring-amber-400 ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              aria-label="Activate voice listening command"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening ? 'Listening...' : 'Voice Command (A)'}</span>
            </button>

            <button
              onClick={loadSampleDocument}
              className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-sm flex items-center gap-1.5 focus:ring-4 focus:ring-amber-400"
              title="Instantly test with a realistic scholarship circular"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>⚡ Try Sample Doc</span>
            </button>
          </div>
        </div>

        {/* Listening Voice Status Indicator */}
        {isListening && (
          <div
            role="status"
            className="p-4 rounded-xl bg-indigo-950 border-2 border-indigo-500 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-6 bg-indigo-400 rounded-full animate-bounce" />
                <span className="w-2 h-10 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-7 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Listening for voice command...</p>
                <p className="text-xs text-indigo-300">
                  {recognitionTranscript || 'Say: "What is this?", "Read deadline", or "What do I need to do?"'}
                </p>
              </div>
            </div>
            <button
              onClick={stopListening}
              className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Camera / Capture & Primary Visual Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Camera & Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden relative shadow-2xl flex flex-col items-center justify-center min-h-[360px]">
              {/* Active Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-auto max-h-[420px] object-cover bg-black ${cameraActive ? 'block' : 'hidden'}`}
                aria-label="Live camera feed"
              />

              {/* Hidden Canvas for High-Resolution Capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Captured Image Preview (When not streaming live) */}
              {!cameraActive && capturedImage && (
                <div className="relative w-full">
                  <img
                    src={capturedImage}
                    alt="Captured scene for accessibility inspection"
                    className="w-full max-h-[420px] object-contain bg-black"
                  />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded-full text-[11px] text-amber-300 font-semibold border border-amber-500/30">
                    Captured Snapshot
                  </div>
                </div>
              )}

              {/* Sample Document Demo Card (When sample is loaded) */}
              {!cameraActive && !capturedImage && analysis && (
                <div className="p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Sample Scholarship Circular Loaded</h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Directorate of Higher Education Circular No. 44/ESW/2026.
                    </p>
                  </div>
                </div>
              )}

              {/* Empty Placeholder */}
              {!cameraActive && !capturedImage && !analysis && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <Camera className="w-9 h-9" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-base">Camera is currently paused</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Start your camera to point at documents or signs, or upload a photo directly.
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div
                  role="alert"
                  className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs font-medium"
                >
                  {cameraError}
                </div>
              )}

              {/* Analysis Loading Overlay */}
              {analyzing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-base font-bold text-white">Analyzing with SARTHI Vision AI...</p>
                  <p className="text-xs text-amber-300 mt-1">
                    Detecting visible text, structure, objects, and accessibility details.
                  </p>
                </div>
              )}
            </div>

            {/* Primary Camera & Upload Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {cameraActive ? (
                <>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    disabled={analyzing}
                    className="vision-primary-control col-span-1 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 focus:ring-4 focus:ring-amber-300"
                    aria-label="Capture photo now (Spacebar)"
                  >
                    <Camera className="w-5 h-5" />
                    <span>CAPTURE (Space)</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="vision-primary-control col-span-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700 focus:ring-4 focus:ring-amber-400"
                    aria-label="Stop camera stream"
                  >
                    <VideoOff className="w-5 h-5 text-rose-400" />
                    <span>STOP CAMERA</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="vision-primary-control col-span-1 py-3.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 focus:ring-4 focus:ring-amber-400"
                    aria-label="Start live camera stream (Shortcut C)"
                  >
                    <Video className="w-5 h-5" />
                    <span>START CAMERA (C)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="vision-primary-control col-span-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm flex items-center justify-center gap-2 border border-slate-700 focus:ring-4 focus:ring-amber-400"
                    aria-label="Upload photo from device"
                  >
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span>UPLOAD PHOTO</span>
                  </button>
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-label="Select image file to analyze"
            />

            {/* "What Am I Looking At?" Big Button */}
            <button
              type="button"
              onClick={handleWhatAmILookingAt}
              disabled={!analysis || analyzing}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-lg flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 focus:ring-4 focus:ring-white border-2 border-amber-300"
              aria-label="What am I looking at? Immediate audio description"
            >
              <Volume2 className="w-6 h-6 stroke-[2.5]" />
              <span>"What Am I Looking At?"</span>
            </button>

            {/* Quick Document Navigation Mode (When Document is Detected) */}
            {analysis?.isDocument && (
              <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>Document Camera Mode Active</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleReadDeadlines}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg font-semibold border border-slate-700 flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Find Deadlines
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('actions');
                      handleAskQuestion('What documents do I need to prepare?');
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg font-semibold border border-slate-700 flex items-center gap-1.5"
                  >
                    <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                    Required Docs
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('reader');
                      handleReadImportant();
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg font-semibold border border-slate-700 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Read Important
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('form');
                      if (!formGuidance) fetchFormGuidance(0);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg font-semibold border border-slate-700 flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Form Guide
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Intelligent Structured Breakdown & Tabs (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tab Bar */}
            <div
              role="tablist"
              aria-label="SARTHI Vision Result Tabs"
              className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-xs sm:text-sm"
            >
              <button
                role="tab"
                aria-selected={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                Visual Description
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'reader'}
                onClick={() => setActiveTab('reader')}
                className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'reader'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Read Anything
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'qna'}
                onClick={() => setActiveTab('qna')}
                className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'qna'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Ask SARTHI ({qnaList.length})
              </button>

              {analysis?.detectedForm?.hasForm && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'form'}
                  onClick={() => {
                    setActiveTab('form');
                    if (!formGuidance) fetchFormGuidance(0);
                  }}
                  className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'form'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Form Assistant
                </button>
              )}

              <button
                role="tab"
                aria-selected={activeTab === 'actions'}
                onClick={() => setActiveTab('actions')}
                className={`px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'actions'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                What To Do
              </button>
            </div>

            {/* Error Message */}
            {analysisError && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-sm flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error Processing Image</p>
                  <p className="text-xs mt-0.5">{analysisError}</p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: OVERVIEW & DESCRIPTION */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Main Visual Description Card */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Visual Scene Description
                    </h2>
                    {analysis?.description && (
                      <button
                        onClick={() => speakAnnouncement(analysis.description, true)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 focus:ring-2 focus:ring-amber-400"
                        aria-label="Listen to visual description again"
                      >
                        <Volume2 className="w-4 h-4" />
                        Hear Again
                      </button>
                    )}
                  </div>

                  {analysis ? (
                    <p className="text-base sm:text-lg leading-relaxed text-slate-200 font-medium">
                      {analysis.description}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No image analyzed yet. Open your camera or click "⚡ Try Sample Doc" to generate an accessible description.
                    </p>
                  )}

                  {/* Spatial Layout Insight */}
                  {analysis?.spatialLayout && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Spatial Layout:
                      </p>
                      <p>{analysis.spatialLayout}</p>
                    </div>
                  )}

                  {/* Quick Action Buttons Under Description */}
                  {analysis && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => speakAnnouncement(`${analysis.description} ${analysis.spatialLayout || ''}`, true)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        [Hear More]
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('reader');
                          handleReadEverything();
                        }}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        [Read Text]
                      </button>
                      <button
                        onClick={() => setActiveTab('qna')}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                        [Ask a Question]
                      </button>
                      <button
                        onClick={() => {
                          setActiveLanguage('mr');
                          speakAnnouncement('Switching language to Marathi. भाषा मराठी निवडली आहे.', true);
                        }}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                      >
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        [Translate to Marathi]
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('actions');
                          handleAskQuestion('What do I need to do?');
                        }}
                        className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-amber-500/40"
                      >
                        <ListChecks className="w-3.5 h-3.5 text-amber-400" />
                        [What Do I Need To Do?]
                      </button>
                    </div>
                  )}
                </div>

                {/* Important Highlights & Objects Detected */}
                {analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Important Information */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Key Highlights
                        </h3>
                        <button
                          onClick={handleReadImportant}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" />
                          Listen
                        </button>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {(analysis.importantInformation || []).map((info, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{info}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Detected Objects & Elements */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h3 className="font-bold text-sky-400 text-sm flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        Recognized Objects
                      </h3>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(analysis.objects || []).map((obj, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Safety & Cautions Alert */}
                {analysis?.warnings && analysis.warnings.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 space-y-1.5">
                    <p className="font-bold text-rose-300 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Document Warnings & Strict Conditions:
                    </p>
                    <ul className="text-xs text-rose-200/90 space-y-1 pl-5 list-disc">
                      {analysis.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: READ ANYTHING */}
            {activeTab === 'reader' && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-400" />
                      Extracted Text Reader
                    </h2>
                    <p className="text-xs text-slate-400">
                      Accurate visible text extracted from the image. No fabrication.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReadEverything}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5"
                    >
                      <Volume2 className="w-4 h-4" />
                      Read Everything
                    </button>
                    <button
                      onClick={handleReadDeadlines}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <Calendar className="w-4 h-4 text-amber-400" />
                      Read Deadlines
                    </button>
                  </div>
                </div>

                {analysis?.visibleText && analysis.visibleText.length > 0 ? (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {analysis.visibleText.map((line, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 group hover:border-amber-500/40 transition-colors"
                      >
                        <p className="text-sm text-slate-200 font-mono leading-relaxed">{line}</p>
                        <button
                          onClick={() => speakAnnouncement(line, true)}
                          className="shrink-0 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 opacity-80 group-hover:opacity-100 transition-opacity"
                          title="Read this line aloud"
                          aria-label={`Read aloud: ${line}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No text extracted. Capture a document or try our sample scholarship circular.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: ASK SARTHI (CONTEXTUAL Q&A) */}
            {activeTab === 'qna' && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    Ask SARTHI About the Image
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ask any question. Answers are strictly grounded in what is visible.
                  </p>
                </div>

                {/* Quick Contextual Question Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'What is this?',
                    'What does this say?',
                    'What is important?',
                    'What do I need to do?',
                    'Read the deadline.',
                    'How many sections are there?',
                    'Translate this to Marathi.',
                  ].map((quickQ, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskQuestion(quickQ)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {quickQ}
                    </button>
                  ))}
                </div>

                {/* Q&A Chat Stream */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {qnaList.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      {/* User Question */}
                      <div className="flex justify-end">
                        <div className="bg-brand-600 text-white p-3 rounded-2xl rounded-tr-xs max-w-[85%] text-sm font-medium">
                          {item.question}
                        </div>
                      </div>

                      {/* SARTHI Response */}
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 text-slate-200 p-3.5 rounded-2xl rounded-tl-xs max-w-[90%] space-y-2">
                          <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              SARTHI AI
                            </span>
                            {item.answer && (
                              <button
                                onClick={() => speakAnnouncement(item.answer, true)}
                                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                <Volume2 className="w-3 h-3" />
                                Listen
                              </button>
                            )}
                          </div>
                          {item.answer ? (
                            <p className="text-sm leading-relaxed">{item.answer}</p>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              Thinking...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {qnaList.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No questions asked yet. Ask a question below by typing or speaking.
                    </div>
                  )}
                </div>

                {/* Question Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                  className="flex gap-2 pt-2 border-t border-slate-800"
                >
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask a question about this image..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceCommandStart}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700"
                    title="Speak question"
                    aria-label="Speak question via microphone"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    disabled={isAsking || !questionInput.trim()}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ask</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT 4: SMART FORM ASSISTANT */}
            {activeTab === 'form' && analysis?.detectedForm?.hasForm && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-400" />
                      Smart Form Assistant
                    </h2>
                    <p className="text-xs text-slate-400">
                      Step-by-step guidance through recognized form fields with plain language explanations.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                    Field {formFieldIndex + 1} of {analysis.detectedForm.fields?.length || 1}
                  </span>
                </div>

                {/* Active Field Guidance Card */}
                {formGuidance?.currentField ? (
                  <div className="p-5 rounded-xl bg-slate-900 border-2 border-amber-500/50 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                          {formGuidance.currentField.isRequired ? 'Mandatory Field' : 'Optional Field'}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {formGuidance.currentField.label || formGuidance.currentField.name}
                        </h3>
                      </div>
                      <button
                        onClick={() =>
                          speakAnnouncement(
                            `Field: ${formGuidance.currentField.label}. ${formGuidance.plainExplanation}. ${
                              formGuidance.validationTip || ''
                            }`,
                            true
                          )
                        }
                        className="p-2 rounded-lg bg-slate-800 text-amber-400"
                        title="Read field explanation"
                        aria-label="Read field explanation aloud"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Plain Language Explanation:</p>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        "{formGuidance.plainExplanation}"
                      </p>
                    </div>

                    {formGuidance.validationTip && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{formGuidance.validationTip}</span>
                      </div>
                    )}

                    {/* Step Through Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={prevFormField}
                        disabled={formFieldIndex === 0 || loadingFormGuide}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Previous Field
                      </button>

                      <button
                        type="button"
                        onClick={nextFormField}
                        disabled={
                          formFieldIndex >= (analysis.detectedForm.fields?.length || 1) - 1 || loadingFormGuide
                        }
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 rounded-lg text-sm font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                      >
                        <span>Next Field</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <button
                      onClick={() => fetchFormGuidance(0)}
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm"
                    >
                      Start Form Step-Through
                    </button>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 text-center">
                  SARTHI does not automatically enter or submit confidential personal information without your explicit command.
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: WHAT TO DO (ACTION STEPS) */}
            {activeTab === 'actions' && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-emerald-400" />
                      What Do I Need To Do?
                    </h2>
                    <p className="text-xs text-slate-400">
                      Concrete actionable next steps inferred from this document.
                    </p>
                  </div>
                  {analysis?.possibleActions && (
                    <button
                      onClick={() =>
                        speakAnnouncement(`Action steps: ${analysis.possibleActions.join('. ')}`, true)
                      }
                      className="px-3 py-1.5 bg-slate-800 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Read Actions
                    </button>
                  )}
                </div>

                {analysis?.possibleActions && analysis.possibleActions.length > 0 ? (
                  <div className="space-y-2.5">
                    {analysis.possibleActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-200 font-medium">{action}</p>
                        </div>
                        <button
                          onClick={() => speakAnnouncement(`Step ${idx + 1}: ${action}`, true)}
                          className="text-slate-400 hover:text-white"
                          aria-label={`Read aloud step ${idx + 1}`}
                        >
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No actions inferred. Upload a document or scholarship form.
                  </div>
                )}
              </div>
            )}

            {/* Session Management & Deletion Bar */}
            {currentSession && (
              <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Temporary Session Active (Private & Encrypted)
                </span>
                <button
                  onClick={handleResetSession}
                  className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                  aria-label="Delete vision session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Session
                </button>
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
          aria-labelledby="shortcuts-title"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 id="shortcuts-title" className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                SARTHI Vision Keyboard Hotkeys
              </h3>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close shortcuts dialog"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950">
                <span className="text-slate-300">Capture Photo</span>
                <kbd className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded font-mono font-bold text-xs border border-slate-700">
                  Space
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950">
                <span className="text-slate-300">Start / Stop Camera</span>
                <kbd className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded font-mono font-bold text-xs border border-slate-700">
                  C
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950">
                <span className="text-slate-300">What Am I Looking At?</span>
                <kbd className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded font-mono font-bold text-xs border border-slate-700">
                  R
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950">
                <span className="text-slate-300">Voice Command Trigger</span>
                <kbd className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded font-mono font-bold text-xs border border-slate-700">
                  A
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950">
                <span className="text-slate-300">Stop Audio Narration</span>
                <kbd className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded font-mono font-bold text-xs border border-slate-700">
                  S
                </kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
