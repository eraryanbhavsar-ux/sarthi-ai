import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import api from '../services/api.js';
import { visionService } from '../services/visionService.js';
import backendHealth from '../services/backendHealth.js';
import { SUPPORTED_LANGUAGES, getLanguageInfo } from '../services/languageRegistry.js';
import {
  detectSceneChange,
  captureRepresentativeFrame,
  resetSceneDetector,
} from '../utils/sceneDetector.js';
import {
  ArrowLeft,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Square,
  Play,
  Pause,
  RotateCcw,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Upload,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { ttsManager } from '../services/voice/textToSpeechProvider.js';

/**
 * Prevent repeating similar observations during continuous camera scanning.
 * Compares significant content words and returns true only if the scene has substantively changed.
 */
function isSignificantlyDifferentScene(newDesc = '', oldDesc = '') {
  if (!oldDesc || !newDesc) return true;
  const cleanNew = newDesc.toLowerCase().trim();
  const cleanOld = oldDesc.toLowerCase().trim();
  if (cleanNew === cleanOld) return false;

  const extractWords = (str) =>
    str
      .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

  const wordsNew = extractWords(cleanNew);
  const wordsOld = new Set(extractWords(cleanOld));

  if (wordsNew.length === 0 || wordsOld.size === 0) return true;

  let overlap = 0;
  for (const w of wordsNew) {
    if (wordsOld.has(w)) overlap++;
  }

  const similarityRatio = overlap / Math.max(wordsNew.length, wordsOld.size);
  // If >=45% of substantive content words match, treat as the same scene (suppress repetitive chatter)
  return similarityRatio < 0.45;
}

/**
 * Diagnostic Error Categorization (Step 9)
 * Maps errors to clear, user-safe diagnostic categories and telemetry.
 */
export function categorizeVisionError(err, isServerWaking = false) {
  const isAbort =
    err?.name === 'AbortError' ||
    err?.code === 'ECONNABORTED' ||
    err?.message?.includes('aborted') ||
    err?.message?.includes('timeout') ||
    err?.error === 'VISION_TIMEOUT';

  if (isAbort) {
    return {
      category: 'Timeout',
      userMessage: isServerWaking
        ? 'Server is taking longer than expected to wake up.'
        : 'Analysis request timed out.',
    };
  }

  const status = err?.response?.status;
  if (status === 400) {
    return {
      category: 'HTTP 400',
      userMessage: 'Bad request. Frame data could not be parsed.',
    };
  }
  if (status === 401) {
    return {
      category: 'HTTP 401',
      userMessage: 'Authentication required to access vision service.',
    };
  }
  if (status === 403) {
    return {
      category: 'HTTP 403',
      userMessage: 'Access to vision service is forbidden.',
    };
  }
  if (status === 429) {
    return {
      category: 'HTTP 429',
      userMessage: 'Rate limit reached. Pausing momentarily before next scan.',
    };
  }
  if (status === 500) {
    return {
      category: 'HTTP 500',
      userMessage: 'AI server encountered an internal error. Retrying...',
    };
  }
  if (status === 502 || status === 503 || status === 504) {
    return {
      category: 'Backend unavailable',
      userMessage: 'Backend service is starting up or temporarily unavailable.',
    };
  }

  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('cors') || msg.includes('cross-origin')) {
    return {
      category: 'CORS error',
      userMessage: 'Cross-origin request blocked by browser policy.',
    };
  }

  if (
    err?.code === 'ERR_NETWORK' ||
    msg.includes('network error') ||
    msg.includes('failed to fetch') ||
    msg.includes('network request failed')
  ) {
    return {
      category: 'Network connection failure',
      userMessage: 'Network connection failed. Reconnecting to backend...',
    };
  }

  if (msg.includes('invalid image payload') || msg.includes('canvas frame empty')) {
    return {
      category: 'Invalid image payload',
      userMessage: 'Camera frame was unclear or invalid. Retrying on next clear frame.',
    };
  }

  return {
    category: status ? `HTTP ${status}` : 'Unknown error',
    userMessage: err?.message || 'Vision analysis temporarily unavailable.',
  };
}

/**
 * 8 Distinct Vision State Machine States:
 * IDLE -> CAMERA_STARTING -> CAMERA_READY -> CAPTURING -> ANALYZING -> RESULT -> RETRYING -> ERROR
 */
export const VISION_STATES = {
  IDLE: 'IDLE',
  CAMERA_STARTING: 'CAMERA_STARTING',
  CAMERA_READY: 'CAMERA_READY',
  CAPTURING: 'CAPTURING',
  ANALYZING: 'ANALYZING',
  RESULT: 'RESULT',
  RETRYING: 'RETRYING',
  ERROR: 'ERROR',
};

export default function VisionPage() {
  const navigate = useNavigate();
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
    announce,
  } = useAccessibility();

  // State Machine State
  const [visionState, setVisionState] = useState(VISION_STATES.CAMERA_STARTING);

  // Camera & Stream State
  const [cameraStatus, setCameraStatus] = useState('REQUESTING'); // 'REQUESTING', 'ACTIVE', 'DENIED', 'UNAVAILABLE', 'ERROR', 'IDLE'
  const [cameraError, setCameraError] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [isAnalysisPaused, setIsAnalysisPaused] = useState(false);

  // Vision Analysis State
  const [analysis, setAnalysis] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [translatingLanguage, setTranslatingLanguage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [isServerWaking, setIsServerWaking] = useState(false);

  // Auto-speak new observations (Defaults to true for accessibility, with duplicate suppression)
  const [autoSpeak, setAutoSpeak] = useState(true);

  // UI Modal / Drawer States
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState('overview'); // 'overview' | 'qna' | 'form'
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Q&A State
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qnaList, setQnaList] = useState([]);

  // Smart Form State
  const [formFieldIndex, setFormFieldIndex] = useState(0);
  const [formGuidance, setFormGuidance] = useState(null);
  const [loadingFormGuide, setLoadingFormGuide] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const lastSpokenTimeRef = useRef(0);
  const lastAnalysisEndTimeRef = useRef(0);
  const fileInputRef = useRef(null);
  const liveRegionRef = useRef(null);

  // Safety & lifecycle refs for race conditions and fast frame scheduling
  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef(0);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const firstFrameTimerRef = useRef(null);

  // Stable callback refs for lifecycle safety
  const speakAnnouncementRef = useRef(speakAnnouncement);
  const speakTextRef = useRef(speakText);
  const announceRef = useRef(announce);
  const isSpeakingRef = useRef(isSpeaking);

  useEffect(() => {
    speakAnnouncementRef.current = speakAnnouncement;
    speakTextRef.current = speakText;
    announceRef.current = announce;
    isSpeakingRef.current = isSpeaking;
  }, [speakAnnouncement, speakText, announce, isSpeaking]);

  // Component Mount Lifecycle & Lightweight Backend Warmup (Section 13)
  useEffect(() => {
    isMountedRef.current = true;
    let isCancelled = false;
    // Non-blocking background warmup to initiate Render container spin-up if sleeping
    backendHealth.warmup();

    return () => {
      isMountedRef.current = false;
      isCancelled = true;
      if (firstFrameTimerRef.current) clearTimeout(firstFrameTimerRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const currentLang = getLanguageInfo(activeLanguage);
  const cameraActive = cameraStatus === 'ACTIVE';

  // Synchronize Voice Assistant Context with active Vision state
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
      currentSection: activeToolTab,
    }));

    return () => {
      setVoiceContext((prev) => ({
        ...prev,
        activePage: null,
        visionSessionId: null,
        visionContext: null,
      }));
    };
  }, [currentSession, analysis, activeToolTab, setVoiceContext]);

  /**
   * Start or restart camera stream
   */
  const startCamera = useCallback(() => {
    setCameraEnabled(true);
    setCameraError('');
    setAnalysisError('');
    setUploadedImagePreview(null);
    setVisionState(VISION_STATES.CAMERA_STARTING);
    retryCountRef.current = 0;
    setRetryTrigger((prev) => prev + 1);
  }, []);

  /**
   * Stop camera stream and free hardware tracks
   */
  const stopCamera = useCallback(() => {
    setCameraEnabled(false);
    setCameraStatus('IDLE');
    setVisionState(VISION_STATES.IDLE);
    retryCountRef.current = 0;
    if (firstFrameTimerRef.current) {
      clearTimeout(firstFrameTimerRef.current);
      firstFrameTimerRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isAnalyzingRef.current = false;
    lastAnalysisEndTimeRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    resetSceneDetector();
    speakAnnouncementRef.current('Camera stopped.');
  }, []);

  /**
   * Camera Hardware Lifecycle:
   * Preferred: environment facingMode.
   * Fallback: video: true.
   * NEVER depends on volatile state to avoid reconnection loop.
   */
  useEffect(() => {
    if (!cameraEnabled) {
      setCameraStatus('IDLE');
      setVisionState(VISION_STATES.IDLE);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    let isCancelled = false;
    let localStream = null;

    async function initCamera() {
      setCameraStatus('REQUESTING');
      setVisionState(VISION_STATES.CAMERA_STARTING);
      setCameraError('');

      // Check Secure Context (HTTPS or localhost)
      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.endsWith('.localhost'));

      const isSecure = typeof window !== 'undefined' && (window.isSecureContext || isLocalhost);

      if (!isSecure) {
        console.error('[SARTHI Vision] Insecure context: camera requires HTTPS or localhost');
        if (!isCancelled) {
          setCameraStatus('UNAVAILABLE');
          setVisionState(VISION_STATES.ERROR);
          setCameraError('Camera access requires a secure context (HTTPS or localhost).');
        }
        return;
      }

      // Check MediaDevices support
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        console.error('[SARTHI Vision] navigator.mediaDevices.getUserMedia unavailable');
        if (!isCancelled) {
          setCameraStatus('UNAVAILABLE');
          setVisionState(VISION_STATES.ERROR);
          setCameraError('Camera access is not supported in this browser or context.');
        }
        return;
      }

      console.log('[SARTHI Vision] Initializing camera. Requested facingMode:', facingMode);

      try {
        // Preferred facingMode constraint
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode === 'environment' ? 'environment' : 'user' },
            },
            audio: false,
          });
          console.log('[SARTHI Vision] Primary getUserMedia succeeded');
        } catch (primaryErr) {
          console.warn('[SARTHI Vision] Primary constraints failed, falling back to video: true', primaryErr);
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          console.log('[SARTHI Vision] Fallback getUserMedia succeeded');
        }

        if (isCancelled) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Clean up stale stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        streamRef.current = localStream;

        const videoEl = videoRef.current;
        if (!videoEl) {
          console.warn('[SARTHI Vision] videoRef.current is null');
          return;
        }

        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.autoplay = true;
        videoEl.srcObject = localStream;

        // Wait for loadedmetadata to verify videoWidth & videoHeight > 0
        await new Promise((resolve) => {
          if (videoEl.readyState >= 1 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
            resolve();
            return;
          }
          const onMetadata = () => {
            videoEl.removeEventListener('loadedmetadata', onMetadata);
            resolve();
          };
          videoEl.addEventListener('loadedmetadata', onMetadata);
          setTimeout(() => {
            videoEl.removeEventListener('loadedmetadata', onMetadata);
            resolve();
          }, 2500);
        });

        if (isCancelled) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Attempt video.play() safely
        try {
          await videoEl.play();
          console.log('[SARTHI Vision] video.play() started successfully');
        } catch (playErr) {
          console.warn('[SARTHI Vision] video.play() note:', playErr);
        }

        const width = videoEl.videoWidth || 0;
        const height = videoEl.videoHeight || 0;
        console.log(`[SARTHI Vision] Camera ready: ${width}x${height}, readyState: ${videoEl.readyState}`);

        if (!isCancelled) {
          setVideoDimensions({ width, height });
          setCameraStatus('ACTIVE');
          setVisionState(VISION_STATES.CAMERA_READY);
          resetSceneDetector();
          announceRef.current('Camera connected. SARTHI Vision is ready.');

          // Fast First Analysis (Section 7):
          // Immediately after camera is verified, schedule initial capture after brief 350ms settling
          if (firstFrameTimerRef.current) clearTimeout(firstFrameTimerRef.current);
          firstFrameTimerRef.current = setTimeout(() => {
            if (!isCancelled && isMountedRef.current) {
              analyzeCurrentFrame(true);
            }
          }, 350);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('[SARTHI Vision] Camera initialization error:', err);

        let status = 'ERROR';
        let msg = 'Unable to access camera on this device.';

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          status = 'DENIED';
          msg = 'Camera permission is blocked. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          status = 'UNAVAILABLE';
          msg = 'No camera found on this device. Please connect a camera or upload a photo.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          status = 'ERROR';
          msg = 'Camera is already in use by another application. Please close other camera apps and retry.';
        } else if (err.name === 'OverconstrainedError') {
          status = 'UNAVAILABLE';
          msg = 'Camera constraints could not be satisfied on this device.';
        }

        setCameraStatus(status);
        setVisionState(VISION_STATES.ERROR);
        setCameraError(msg);
        speakAnnouncementRef.current(msg);
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (firstFrameTimerRef.current) {
        clearTimeout(firstFrameTimerRef.current);
        firstFrameTimerRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      resetSceneDetector();
    };
  }, [cameraEnabled, facingMode, retryTrigger]);

  /**
   * Non-blocking TTS execution (Section 17):
   * Visual descriptions display immediately. TTS speaks asynchronously in background.
   */
  const triggerNonBlockingTTS = useCallback((text, lang) => {
    setTimeout(() => {
      try {
        const now = Date.now();
        // Prevent speech overlap: if already speaking, skip auto-speak
        if (isSpeakingRef.current || ttsManager.isSpeaking) {
          return;
        }

        // Cooldown check (6.5s) to avoid chatter
        const COOLDOWN_MS = 6500;
        if (now - lastSpokenTimeRef.current < COOLDOWN_MS) {
          return;
        }

        // Avoid repeating identical/similar descriptions
        if (!isSignificantlyDifferentScene(text, lastSpokenTextRef.current)) {
          return;
        }

        lastSpokenTextRef.current = text;
        lastSpokenTimeRef.current = now;
        speakTextRef.current(text, lang);
      } catch (ttsErr) {
        console.warn('[SARTHI Vision] Non-blocking TTS note:', ttsErr.message);
      }
    }, 50);
  }, []);

  /**
   * Frame Extraction & AI Analysis Pipeline (Phases 1-6, 14, 16-18, Cold-Start Handler):
   * 1. Validates video frame readiness (video.readyState >= 2 & videoWidth/videoHeight > 0)
   * 2. Checks backend readiness via backendHealth: surfaces waking state if Render container is booting
   * 3. Captures FRESH frame on canvas once server is ready (prevents stale frames)
   * 4. Logs sequential diagnostic telemetry ([Vision VISION-001], frame size, times)
   * 5. Enforces single in-flight request lock (isAnalyzingRef)
   * 6. Uses controlled timeout (40s on warm backend, 90s on cold start)
   * 7. Error transparency: displays precise failure reason instead of masking
   * 8. Displays result immediately; TTS executes asynchronously without blocking
   */
  const analyzeCurrentFrame = useCallback(
    async (force = false, isRetry = false) => {
      const videoEl = videoRef.current;
      if (!isMountedRef.current || !videoEl || cameraStatus !== 'ACTIVE' || isAnalysisPaused) {
        return;
      }

      // Request lock: never allow simultaneous requests (Phase 14 & Cold-Start protection)
      if (isAnalyzingRef.current) {
        return;
      }

      // Strict video frame readiness validation
      if (
        typeof videoEl.readyState !== 'number' ||
        videoEl.readyState < 2 || // HTMLMediaElement.HAVE_CURRENT_DATA
        !videoEl.videoWidth ||
        !videoEl.videoHeight ||
        videoEl.videoWidth <= 0 ||
        videoEl.videoHeight <= 0
      ) {
        console.warn('[SARTHI Vision] Video element not ready or zero dimensions. Skipping frame capture.');
        return;
      }

      // Scene change check (unless forced or retry)
      if (!force && !isRetry) {
        const { hasChanged } = detectSceneChange(videoEl, {
          lastFailed: Boolean(analysisError),
        });
        if (!hasChanged && analysis?.description) {
          return;
        }
      }

      // Sequential request ID formatting (e.g. VISION-001)
      const nextId = activeRequestIdRef.current + 1;
      const reqIdStr = 'VISION-' + String(nextId).padStart(3, '0');

      console.log(`[Vision ${reqIdStr}]\ncamera ready`);

      // Acquire lock & advance sequence
      isAnalyzingRef.current = true;
      const requestId = ++activeRequestIdRef.current;
      setVisionState(VISION_STATES.ANALYZING);
      setAnalysisError('');

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Step 1: Safe Backend Warmup Verification (handles Render free-tier cold starts)
        if (!backendHealth.isWarm()) {
          console.log(`[Vision ${reqIdStr}] Checking backend readiness...`);
          try {
            await backendHealth.ensureReady({
              onWakingStateChange: (waking) => {
                if (isMountedRef.current && requestId === activeRequestIdRef.current) {
                  setIsServerWaking(waking);
                  if (waking) {
                    announceRef.current('Waking up SARTHI Vision. The first analysis may take a little longer.');
                  }
                }
              },
              timeoutMs: 90000,
              signal: abortController.signal,
              maxRetries: 1,
            });
          } catch (healthErr) {
            if (!isMountedRef.current || requestId !== activeRequestIdRef.current) return;
            console.error(`[Vision ${reqIdStr}] Backend readiness check failed:`, healthErr.message);
            setIsServerWaking(false);
            setAnalysisError('Vision unavailable\nReason: Server is taking longer than expected to wake up. Please tap Try Again.');
            setVisionState(VISION_STATES.ERROR);
            announceRef.current('Server is taking longer to wake up. Please tap Try Again.');
            return;
          }
        }

        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
          return;
        }

        setIsServerWaking(false);

        // Step 2: Capture FRESH frame right now from active camera
        setVisionState(VISION_STATES.CAPTURING);
        const tCapture0 = performance.now();
        const frameData = captureRepresentativeFrame(videoEl, 1024, 0.75);
        const captureMs = performance.now() - tCapture0;

        // Verify image payload before sending
        if (!frameData || !frameData.base64 || frameData.base64.length < 200 || !frameData.sizeBytes) {
          console.error(`[Vision ${reqIdStr}]\nFAILED\n\nreason:\nInvalid image payload (canvas frame empty)\n\nbackend error:\nNone (client rejected)`);
          setAnalysisError('Vision unavailable\nReason: Invalid image payload');
          setVisionState(VISION_STATES.ERROR);
          return;
        }

        const kbSize = Math.round(frameData.sizeBytes / 1024);
        console.log(`[Vision ${reqIdStr}]\nframe:\n${frameData.width}x${frameData.height}\nsize:\n${kbSize} KB`);

        setVisionState(VISION_STATES.ANALYZING);
        console.log(`[Vision ${reqIdStr}]\nrequest started`);

        // Normal 40s timeout for Gemini inference on a verified warm backend
        const analysisTimeoutId = setTimeout(() => {
          abortController.abort();
        }, 40000);

        const requestStart = performance.now();

        try {
          const res = await visionService.analyzeVision({
            imageBase64: frameData.base64,
            language: activeLanguage,
            guestId: user ? null : `guest_${Date.now()}`,
            capturedViaCamera: true,
            fileName: 'sarthi_vision_frame.jpg',
            signal: abortController.signal,
            requestId: reqIdStr,
          });

          clearTimeout(analysisTimeoutId);

          if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
            console.log(`[Vision ${reqIdStr}] Discarding stale response`);
            return;
          }

          const totalSec = ((performance.now() - requestStart) / 1000).toFixed(1);
          console.log(`[Vision ${reqIdStr}]\ntotal:\n${totalSec}s`);

          if (res.error === 'VISION_TIMEOUT') {
            throw new Error('Gemini request timed out on backend');
          }

          if (res.success && res.analysis?.description) {
            backendHealth.markWarm();
            setAnalysis(res.analysis);
            setCurrentSession(res.session || null);
            setVisionState(VISION_STATES.RESULT);
            setAnalysisError('');

            const newDesc = res.analysis.description.trim();
            announceRef.current(`SARTHI Vision: ${newDesc}`);

            // Non-blocking TTS (never blocks description display)
            if (newDesc && autoSpeak) {
              triggerNonBlockingTTS(newDesc, activeLanguage);
            }
          } else {
            throw new Error(res.reason || res.error || res.message || 'Vision analysis failed');
          }
        } finally {
          clearTimeout(analysisTimeoutId);
        }
      } catch (err) {
        if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
          return;
        }

        const tElapsedSec = ((performance.now() - requestStart) / 1000).toFixed(2);
        const { category, userMessage } = categorizeVisionError(err, isServerWaking);

        console.error(`[Vision ${reqIdStr}]
request URL: ${api.defaults.baseURL}/vision/analyze
request ID: ${reqIdStr}
request started: ${new Date(Date.now() - Math.round(tElapsedSec * 1000)).toISOString()}
request completed: ${new Date().toISOString()}
HTTP status: ${err?.response?.status || 'None'}
elapsed time: ${tElapsedSec}s
error category: ${category}
backend error: ${err.message || 'None'}`);

        setAnalysisError(`Vision unavailable — Reason: ${userMessage}`);
        setVisionState(VISION_STATES.ERROR);
        announceRef.current(`Vision unavailable. ${userMessage}`);
      } finally {
        setIsServerWaking(false);
        if (requestId === activeRequestIdRef.current) {
          isAnalyzingRef.current = false;
          lastAnalysisEndTimeRef.current = Date.now();
          abortControllerRef.current = null;
        }
      }
    },
    [cameraStatus, isAnalysisPaused, analysis, activeLanguage, user, autoSpeak, triggerNonBlockingTTS, analysisError, isServerWaking]
  );

  /**
   * Continuous Controlled Scene Monitoring (Accessibility Live Visual Assistant):
   * No capture button. No manual analyze button.
   * Periodically checks if the scene has changed (luminance delta).
   * Enforces single in-flight request lock and a 3.5s cooldown between analyses.
   * Auto-recovers if previous attempt had an error.
   */
  useEffect(() => {
    if (!cameraActive || isAnalysisPaused) {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      return;
    }

    analysisIntervalRef.current = setInterval(() => {
      if (isAnalyzingRef.current) return;

      const now = Date.now();
      // 3.5s cooldown after previous analysis completed
      if (now - lastAnalysisEndTimeRef.current < 3500) {
        return;
      }

      const videoEl = videoRef.current;
      if (!videoEl || videoEl.readyState < 2) return;

      // Check scene change (or auto-retry if last failed)
      const { hasChanged } = detectSceneChange(videoEl, {
        lastFailed: Boolean(analysisError),
      });

      if (hasChanged) {
        analyzeCurrentFrame(false);
      }
    }, 1200);

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [cameraActive, isAnalysisPaused, analyzeCurrentFrame, analysisError]);

  /**
   * Translate active vision result on-the-fly when user changes language
   */
  const handleLanguageChange = async (newLangCode) => {
    setActiveLanguage(newLangCode);
    setShowLanguageModal(false);

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
          announceRef.current(`Language switched to ${langInfo.displayName}. ${updatedAnalysis.description}`);

          if (autoSpeak && updatedAnalysis.description) {
            speakTextRef.current(updatedAnalysis.description, newLangCode);
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
   * Contextual Voice Assistant ("Hey Sarthi") Command Listener
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
      speakAnnouncementRef.current('No active visual analysis to read yet.');
      return;
    }

    if (analysis.visibleText && analysis.visibleText.length > 0) {
      const textToRead = analysis.visibleText.join('. ');
      speakTextRef.current(textToRead, activeLanguage);
    } else if (analysis.documentHeading) {
      speakTextRef.current(analysis.documentHeading, activeLanguage);
    } else {
      speakAnnouncementRef.current('The text is not clear enough for me to read reliably.');
    }
  };

  /**
   * Speak main visual description
   */
  const handleSpeakMainDescription = () => {
    if (!analysis?.description) {
      speakAnnouncementRef.current('No visual description available yet. Point your camera at an object or document.');
      return;
    }

    let speech = analysis.description;
    if (analysis.isDocument && analysis.documentHeading) {
      speech = `${analysis.documentHeading}. ${speech}`;
    }
    speakTextRef.current(speech, activeLanguage);
  };

  /**
   * Optional Photo Upload (for users without camera or pre-taken photos)
   */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      const msg = 'Please choose a valid image file (JPEG, PNG, or WebP).';
      setAnalysisError(msg);
      speakAnnouncementRef.current(msg);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      setUploadedImagePreview(base64Data);
      stopCamera();
      setVisionState(VISION_STATES.ANALYZING);
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
          setVisionState(VISION_STATES.RESULT);
          const speech = response.analysis.description || 'Image analyzed.';
          speakAnnouncementRef.current(speech, true);
        }
      } catch (err) {
        setAnalysisError(err.message || 'Failed to analyze uploaded photo.');
        setVisionState(VISION_STATES.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Load verified sample circular document
   */
  const loadSampleDocument = async () => {
    setVisionState(VISION_STATES.ANALYZING);
    setAnalysisError('');
    stopCamera();
    try {
      const response = await visionService.getVisionSample(activeLanguage);
      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
        setUploadedImagePreview(null);
        setCurrentSession({ _id: 'sample_session_scholarship', isSample: true });
        setVisionState(VISION_STATES.RESULT);
        setQnaList([]);
        setFormFieldIndex(0);

        const speech = `Sample Document Loaded. ${response.analysis.description}`;
        speakAnnouncementRef.current(speech, true);
      }
    } catch (err) {
      setAnalysisError('Could not load sample document.');
      setVisionState(VISION_STATES.ERROR);
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
        speakTextRef.current(answerText, activeLanguage);
      }
    } catch (err) {
      const fallback =
        "I can't confidently determine that from this view. Please ensure the scene is centered and well-lit.";
      setQnaList((prev) =>
        prev.map((item) => (item.question === q && item.answer === null ? { ...item, answer: fallback } : item))
      );
      speakTextRef.current(fallback, activeLanguage);
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
          speakAnnouncementRef.current(speech, true);
        }
      } catch (err) {
        console.warn('Form guidance error:', err);
      } finally {
        setLoadingFormGuide(false);
      }
    },
    [analysis, currentSession, activeLanguage]
  );

  /**
   * Determine dynamic status text for the UPI scanner
   */
  const getStatusText = () => {
    if (visionState === VISION_STATES.CAMERA_STARTING) {
      return 'Starting camera...';
    }
    if (visionState === VISION_STATES.CAPTURING) {
      return 'Capturing frame...';
    }
    if (isServerWaking) {
      return 'Waking up SARTHI Vision... The first analysis may take a little longer.';
    }
    if (visionState === VISION_STATES.ANALYZING) {
      return 'Analyzing scene...';
    }
    if (visionState === VISION_STATES.ERROR && analysisError) {
      return analysisError.replace('\n', ' — ');
    }
    if (analysis?.description) {
      return 'Vision active — Point at anything to describe';
    }
    return 'Vision ready — Point your camera at something';
  };

  return (
    <main id="main-content" className="min-h-[calc(100vh-64px)] bg-black text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Hidden Live Region for Screen Readers */}
      <div ref={liveRegionRef} aria-live="polite" className="sr-only" />

      {/* ========================================================
          FULL SCREEN CAMERA VIEWPORT (Z-0)
          The <video> is ALWAYS rendered in DOM without 'hidden',
          ensuring videoWidth & videoHeight calculate reliably.
          ======================================================== */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
          cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Live camera feed for SARTHI Vision"
      />

      {/* Uploaded Snapshot Preview (If user selected a file instead of camera) */}
      {!cameraActive && uploadedImagePreview && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-950">
          <img
            src={uploadedImagePreview}
            alt="Uploaded scene inspected by SARTHI Vision"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Dark UPI-Style Camera Overlay Vignette (Z-5) */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none z-5" />

      {/* ========================================================
          TOP NAVIGATION & CONTROLS HEADER (Z-20)
          ======================================================== */}
      <header className="relative z-20 w-full px-4 sm:px-6 py-3.5 flex items-center justify-between bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all focus:ring-2 focus:ring-amber-400"
            aria-label="Back to SARTHI Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
              aria-hidden="true"
            />
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase">
              SARTHI VISION
            </h1>
          </div>
        </div>

        {/* Center/Right: Voice Mode, Camera Flip, Language Selector */}
        <div className="flex items-center gap-2">
          {/* Voice-First Accessibility Toggle */}
          <button
            type="button"
            onClick={() => setBlindMode(!blindMode)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all flex items-center gap-1.5 ${
              blindMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-300/50'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
            }`}
            aria-pressed={blindMode}
            aria-label={`Toggle Voice-First Mode (currently ${blindMode ? 'ON' : 'OFF'})`}
            title="Toggle Voice-First Accessibility Mode"
          >
            {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Voice-First</span>
          </button>

          {/* Camera Flip Button (Front / Rear) */}
          {cameraActive && (
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold backdrop-blur-md bg-slate-900/80 text-slate-200 border border-slate-700/80 hover:bg-slate-800 transition-all flex items-center gap-1.5 focus:ring-2 focus:ring-amber-400"
              aria-label={`Switch camera (currently ${facingMode === 'environment' ? 'back' : 'front'})`}
              title={`Switch camera to ${facingMode === 'environment' ? 'front' : 'rear'}`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
            </button>
          )}

          {/* UPI Scanner Language Selector Pill */}
          <button
            type="button"
            onClick={() => setShowLanguageModal(true)}
            disabled={translatingLanguage}
            className="px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/10 focus:ring-2 focus:ring-amber-400"
            aria-label={`Current language: ${currentLang.displayName}. Click to change language`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-extrabold">{currentLang.nativeName || 'English'}</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 backdrop-blur-md"
            aria-label="View keyboard shortcuts"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================
          CAMERA PERMISSION / HARDWARE ERROR STATE (Z-15)
          Displayed clearly if camera permission is denied or blocked.
          ======================================================== */}
      {!cameraActive && !uploadedImagePreview && (
        <div className="relative z-15 flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900/95 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            {cameraStatus === 'REQUESTING' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Starting Camera...</h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Connecting to live video stream for SARTHI Vision.
                  </p>
                </div>
              </>
            ) : cameraStatus === 'DENIED' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                  <VideoOff className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Camera Permission Blocked</h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Camera access is required for SARTHI Vision. Please allow camera access in your browser settings.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Enable Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={loadSampleDocument}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs"
                  >
                    Try Sample
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Camera Unavailable</h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {cameraError || 'Unable to access camera on this device. Please connect a camera or upload a photo.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          CENTER UPI-STYLE SCANNING AREA (Z-10)
          Four corner brackets + animated vertical scanning laser line
          NO capture button! Automatic scanning.
          ======================================================== */}
      {/* ========================================================
          CENTER UPI-STYLE SCANNING AREA (Z-10)
          Noticeably larger scan frame:
          Mobile: 85-90% width, 55-65% height
          Desktop: Controlled max width min(85vw, 850px)
          Thicker accessible corners + animated vertical laser
          ======================================================== */}
      {cameraActive && (
        <section
          aria-label="Scanner Region"
          className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 pointer-events-none"
        >
          {/* Centered Large Rectangular Scanning Frame with 4 Prominent Corner Brackets */}
          <div className="relative w-[88vw] max-w-[90%] sm:max-w-[650px] md:max-w-[780px] lg:max-w-[850px] h-[58vh] max-h-[62%] min-h-[320px] sm:min-h-[360px] md:min-h-[400px] rounded-3xl flex items-center justify-center">
            {/* Top-Left Corner Bracket (┌) */}
            <div
              className="absolute -top-1.5 -left-1.5 w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 border-t-[5px] border-l-[5px] border-amber-400 rounded-tl-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] shadow-[0_0_18px_rgba(251,191,36,0.65)]"
              aria-hidden="true"
            />

            {/* Top-Right Corner Bracket (┐) */}
            <div
              className="absolute -top-1.5 -right-1.5 w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 border-t-[5px] border-r-[5px] border-amber-400 rounded-tr-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] shadow-[0_0_18px_rgba(251,191,36,0.65)]"
              aria-hidden="true"
            />

            {/* Bottom-Left Corner Bracket (└) */}
            <div
              className="absolute -bottom-1.5 -left-1.5 w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 border-b-[5px] border-l-[5px] border-amber-400 rounded-bl-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] shadow-[0_0_18px_rgba(251,191,36,0.65)]"
              aria-hidden="true"
            />

            {/* Bottom-Right Corner Bracket (┘) */}
            <div
              className="absolute -bottom-1.5 -right-1.5 w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 border-b-[5px] border-r-[5px] border-amber-400 rounded-br-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] shadow-[0_0_18px_rgba(251,191,36,0.65)]"
              aria-hidden="true"
            />

            {/* Subtle animated scanning laser line moving vertically inside the large frame */}
            <div
              className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_#fbbf24] animate-scan-line pointer-events-none"
              aria-hidden="true"
            />

            {/* Gentle corner glow pulse */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none animate-pulse-glow" aria-hidden="true" />
          </div>

          {/* Dynamic Status Text Pill */}
          <div
            role="status"
            aria-live="polite"
            className="mt-4 px-4 py-2 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-xs sm:text-sm font-bold text-amber-300 shadow-xl flex items-center gap-2 pointer-events-auto"
          >
            {visionState === VISION_STATES.ANALYZING || visionState === VISION_STATES.CAPTURING ? (
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : visionState === VISION_STATES.RETRYING ? (
              <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-amber-200 rounded-full animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            <span>{getStatusText()}</span>
          </div>
        </section>
      )}

      {/* ========================================================
          BOTTOM SHEET / RESULT OVERLAY CARD (Z-20)
          Clean, polished card showing description, audio controls,
          identified objects, and document detection.
          ======================================================== */}
      <footer className="relative z-20 w-full px-4 pb-4 sm:pb-6 pt-2">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Transparent Error Banner with Try Again (Phase 3 & 20) */}
          {analysisError ? (
            <div className="bg-slate-950/95 backdrop-blur-xl border-2 border-rose-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-rose-100">
                    Vision analysis temporarily unavailable. Please try again.
                  </h3>
                  <div className="text-xs text-rose-300 font-mono bg-rose-950/60 border border-rose-800/40 rounded-xl p-3 whitespace-pre-line break-words">
                    {analysisError}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">
                  Camera feed active — auto-recovering on next scene...
                </span>
                <button
                  type="button"
                  onClick={() => analyzeCurrentFrame(true)}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0"
                  aria-label="Retry analysis now"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Result Card when Description is available */}
          {analysis?.description ? (
            <div className="bg-slate-950/92 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5 transition-all">
              {/* Header: Audio Status & Controls */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>SARTHI</span>
                    </h2>
                    <span className="text-[11px] text-amber-400/90 font-medium">
                      {isSpeaking ? '🔊 Speaking...' : isPaused ? '⏸ Paused' : 'Ready'}
                    </span>
                  </div>
                </div>

                {/* Speech & Audio Controls */}
                <div className="flex items-center gap-1.5">

                  <button
                    type="button"
                    onClick={handleSpeakMainDescription}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all focus:ring-2 focus:ring-amber-300"
                    aria-label={currentLang.listenLabel}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen</span>
                  </button>

                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      aria-label={currentLang.stopLabel}
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Natural Plain-Language Description */}
              <div className="space-y-2">
                <p className="text-base sm:text-lg font-bold text-slate-100 leading-snug font-sans">
                  "{analysis.description}"
                </p>

                {/* Spatial layout hint if available */}
                {analysis.spatialLayout && (
                  <p className="text-xs text-slate-400 italic">
                    Location: {analysis.spatialLayout}
                  </p>
                )}
              </div>

              {/* Document Detection Notice */}
              {analysis.isDocument && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-200 truncate">
                      {analysis.documentHeading || 'Document with readable text detected'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleReadVisibleText}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs shrink-0 flex items-center gap-1"
                  >
                    <span>Read Text</span>
                  </button>
                </div>
              )}

              {/* Identified Objects Tags & More Tools Button */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {analysis.objects?.slice(0, 4).map((obj, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[11px] font-semibold border border-slate-800"
                    >
                      {obj}
                    </span>
                  ))}
                </div>

                {/* Expand Secondary Tools Drawer (Ask Question, Form Guide) */}
                <button
                  type="button"
                  onClick={() => setShowToolsDrawer(true)}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>More Tools</span>
                </button>
              </div>
            </div>
          ) : isServerWaking ? (
            /* Dedicated Cold-Start Waking Banner (Reassures user, preserves camera feed) */
            <div className="bg-slate-950/95 backdrop-blur-xl border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-amber-100">
                    Waking up SARTHI Vision...
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    The first analysis may take a little longer while the server warms up.
                  </p>
                  <p className="text-[11px] text-amber-400/90 font-medium">
                    Camera preview remains active. A fresh frame will be captured automatically once ready.
                  </p>
                </div>
              </div>
            </div>
          ) : !analysisError ? (
            /* Continuous Monitoring Hint Bar (No capture button) */
            <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-slate-300 shadow-xl">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-200">Point camera at any object, document, or sign</span>
              </span>
              <button
                type="button"
                onClick={() => setShowToolsDrawer(true)}
                className="text-amber-400 hover:text-amber-300 font-bold shrink-0 text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors"
              >
                Options
              </button>
            </div>
          ) : null}
        </div>
      </footer>

      {/* ========================================================
          REGIONAL LANGUAGE SELECTOR MODAL
          Supports 11 Indian Regional Languages
          ======================================================== */}
      {showLanguageModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select Vision Language"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Select Vision Language</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
                aria-label="Close language selector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = activeLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                        : 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-black text-sm">{lang.nativeName}</p>
                      <p className="text-xs text-slate-400">{lang.englishName}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MORE TOOLS DRAWER (Q&A, SMART FORM GUIDE, FILE UPLOAD)
          Preserves all existing SARTHI features cleanly!
          ======================================================== */}
      {showToolsDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vision Tools & Features"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>SARTHI Vision Tools</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowToolsDrawer(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
                aria-label="Close tools"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feature Tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveToolTab('overview')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  activeToolTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveToolTab('qna')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  activeToolTab === 'qna'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                Ask Question
              </button>
              {analysis?.detectedForm?.hasForm && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolTab('form');
                    if (!formGuidance) fetchFormGuidance(0);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    activeToolTab === 'form'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  Form Guide
                </button>
              )}
            </div>

            {/* TAB: OVERVIEW & UTILITIES */}
            {activeToolTab === 'overview' && (
              <div className="space-y-3 text-xs">
                {/* Auto-Speak Toggle */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-200">Auto Speak Observations</p>
                    <p className="text-[11px] text-slate-400">Narrates new visual changes aloud</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoSpeak}
                    onClick={() => {
                      const next = !autoSpeak;
                      setAutoSpeak(next);
                      announceRef.current(`Auto speak turned ${next ? 'ON' : 'OFF'}`);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      autoSpeak ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        autoSpeak ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Upload Photo Button */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-200">Upload Photo</p>
                    <p className="text-[11px] text-slate-400">Inspect an existing image file</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>

                {/* Sample Document Button */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-200">Test Sample Document</p>
                    <p className="text-[11px] text-slate-400">Load sample scholarship notice</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      loadSampleDocument();
                      setShowToolsDrawer(false);
                    }}
                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Load Sample</span>
                  </button>
                </div>

                {/* Re-analyze current frame button */}
                {cameraActive && (
                  <button
                    type="button"
                    onClick={() => {
                      analyzeCurrentFrame(true);
                      setShowToolsDrawer(false);
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Vision Analysis</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB: Q&A */}
            {activeToolTab === 'qna' && (
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {qnaList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Ask any question about what SARTHI sees in this scene.
                    </p>
                  ) : (
                    qnaList.map((item, i) => (
                      <div key={i} className="text-xs space-y-1">
                        <p className="font-bold text-amber-300">Q: {item.question}</p>
                        <p className="text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          {item.answer || 'Thinking...'}
                        </p>
                      </div>
                    ))
                  )}
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
                    placeholder="e.g. What is the date or deadline?"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !questionInput.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-black"
                  >
                    {isAsking ? '...' : 'Ask'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: SMART FORM GUIDE */}
            {activeToolTab === 'form' && analysis?.detectedForm?.fields && (
              <div className="space-y-3 text-xs">
                {loadingFormGuide ? (
                  <p className="text-slate-400 py-4 text-center">Loading field guidance...</p>
                ) : (
                  <div className="space-y-2">
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

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        disabled={formFieldIndex === 0}
                        onClick={() => fetchFormGuidance(formFieldIndex - 1)}
                        className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg font-bold"
                      >
                        Previous
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Field {formFieldIndex + 1} of {analysis.detectedForm.fields.length}
                      </span>
                      <button
                        type="button"
                        disabled={formFieldIndex >= analysis.detectedForm.fields.length - 1}
                        onClick={() => fetchFormGuidance(formFieldIndex + 1)}
                        className="px-3 py-1.5 bg-amber-500 disabled:opacity-40 text-slate-950 rounded-lg font-black"
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
      )}

      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Upload photo from device"
      />

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
              <h3 className="text-base font-black text-white">SARTHI Vision Shortcuts</h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span>Toggle Camera Stream</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-amber-400">C</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Stop Speech Narration</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-amber-400">S</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Re-analyze Current View</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono text-amber-400">R</kbd>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
