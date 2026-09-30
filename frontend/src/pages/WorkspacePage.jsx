import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { accessibilityService } from '../services/accessibilityService.js';
import AccessibilitySummaryCard from '../components/AccessibilitySummaryCard.jsx';
import ActionChecklist from '../components/ActionChecklist.jsx';
import StepByStepCard from '../components/StepByStepCard.jsx';
import SimplerModeView from '../components/SimplerModeView.jsx';
import TranslationTab from '../components/TranslationTab.jsx';
import GroundedQnA from '../components/GroundedQnA.jsx';
import DocumentViewer from '../components/DocumentViewer.jsx';
import AudioPlayerDock from '../components/AudioPlayerDock.jsx';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Mic,
  MicOff,
  Sparkles,
  CheckSquare,
  Layers,
  Globe,
  Volume2,
  MessageSquare,
  FileSearch,
  Loader2,
  AlertCircle,
  FileUp,
  X,
  Play,
} from 'lucide-react';

export default function WorkspacePage() {
  const { announce, speakText, startListening, stopListening, isListening, activeLanguage } = useAccessibility();
  const location = useLocation();

  // Active state
  const [activeTab, setActiveTab] = useState('simple'); // 'simple' | 'actions' | 'steps' | 'translate' | 'listen' | 'qna' | 'original'
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'text' | 'mic'
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Analysis state
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [session, setSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const fileInputRef = useRef(null);

  // Check if routed with an existing session ID (from Dashboard)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session');
    if (sessionId) {
      loadExistingSession(sessionId);
    }
  }, [location.search]);

  const loadExistingSession = async (id) => {
    setLoading(true);
    setLoadingStage('Loading saved accessibility session...');
    announce('Loading your saved session...');
    try {
      const res = await accessibilityService.getSessionById(id);
      if (res.success && res.session) {
        setSession(res.session);
        setAnalysis(res.session);
        announce(`Loaded session: ${res.session.title}`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load saved session.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Your file exceeds the 10 MB limit. Please select a smaller document.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    } else {
      setFilePreview(null);
    }
    announce(`Selected file: ${file.name}`);
  };

  // Submit Content for AI Analysis
  const handleAnalyze = async (overrideFile = selectedFile, overrideText = pastedText) => {
    if (!overrideFile && !overrideText.trim()) {
      setErrorMessage('Please upload a file, paste text, or use your microphone.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    const stages = [
      'Uploading and reading content...',
      'Extracting information with SARTHI AI...',
      'Finding important deadlines & requirements...',
      'Creating plain-language explanation...',
      'Building action steps and accessibility modes...',
    ];

    let stageIdx = 0;
    setLoadingStage(stages[0]);
    announce(stages[0]);

    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setLoadingStage(stages[stageIdx]);
        announce(stages[stageIdx]);
      }
    }, 1200);

    try {
      const res = await accessibilityService.analyzeContent({
        file: overrideFile,
        text: overrideFile ? undefined : overrideText,
        language: activeLanguage,
      });

      clearInterval(stageInterval);

      if (res.success && res.session) {
        setSession(res.session);
        setAnalysis(res.analysis);
        announce(`Analysis complete for ${res.session.title}. Action checklist is ready.`);
      }
    } catch (err) {
      clearInterval(stageInterval);
      setErrorMessage(err.message || 'SARTHI AI is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  // Try realistic sample
  const handleLoadSample = async () => {
    setLoading(true);
    setLoadingStage('Loading National Scholarship & Fee Waiver sample...');
    announce('Loading demo scholarship document...');
    setErrorMessage('');

    try {
      const res = await accessibilityService.getSampleData();
      if (res.success) {
        setSession(res.session);
        setAnalysis(res.analysis);
        announce('Demo scholarship loaded. Action checklist and step-by-step guidance ready.');
      }
    } catch (err) {
      setErrorMessage('Could not load sample. Please check server connection.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  // Checklist update
  const handleToggleAction = async (actionId, completed) => {
    if (!session?._id && !session?.id) return;
    const sessionId = session._id || session.id;

    // Optimistic update
    const updatedActions = (session.requiredActions || []).map((act) =>
      act.id === actionId ? { ...act, completed } : act
    );
    setSession((prev) => ({ ...prev, requiredActions: updatedActions }));

    try {
      await accessibilityService.updateChecklist(sessionId, actionId, completed);
    } catch (err) {
      console.warn('Checklist sync warning:', err);
    }
  };

  // Voice Query on workspace input
  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(
        (transcript) => {
          setPastedText(transcript);
          setInputMode('text');
          announce(`Captured voice input: ${transcript}`);
        },
        (errorMsg) => {
          setErrorMessage(errorMsg);
        }
      );
    }
  };

  const currentNarrationText =
    analysis?.simpleExplanation ||
    session?.simpleExplanation ||
    analysis?.summary ||
    session?.summary ||
    '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 transition-colors">
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        {/* Workspace Title & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                AI Accessibility Command Center
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Accessibility Workspace
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={loading}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-xs sm:text-sm font-black transition-all shadow-sm flex items-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-amber-400"
              title="Loads realistic Scholarship Guidelines sample"
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>⚡ Try Sample (Scholarship Notice)</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            INPUT DOCK (Upload PDF, Upload Image, Paste Text, Microphone)
            ======================================================== */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-sm mb-8 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              How can SARTHI make this easier?
            </h2>

            {/* Input Mode Selector */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'upload'}
                onClick={() => setInputMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  inputMode === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'text'}
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  inputMode === 'text'
                    ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={inputMode === 'mic'}
                onClick={() => {
                  setInputMode('mic');
                  handleVoiceInput();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  inputMode === 'mic' || isListening
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Input</span>
              </button>
            </div>
          </div>

          {/* Mode 1: File Upload Area */}
          {inputMode === 'upload' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Upload PDF or Image Document"
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-colors focus:outline-none focus:ring-4 focus:ring-amber-400"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Document Preview"
                        className="max-h-40 rounded-xl mb-3 shadow-md object-contain border border-slate-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-3">
                        <FileUp className="w-8 h-8" />
                      </div>
                    )}
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click to choose another file
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-3">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Drag & Drop or <span className="text-brand-600 dark:text-brand-400 underline">Browse File</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports PDF documents, screenshots, and photos (PNG, JPG, WebP) up to 10 MB
                    </p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAnalyze()}
                    disabled={loading}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-amber-400"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Document Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Paste Text Area */}
          {inputMode === 'text' && (
            <div>
              <label htmlFor="pasted-content-box" className="sr-only">
                Paste official document text here
              </label>
              <textarea
                id="pasted-content-box"
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the difficult text, official circular, email, or notification here..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {pastedText.length} characters
                </span>
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={loading || pastedText.trim().length < 5}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-amber-400"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Text Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Voice Prompt Area */}
          {inputMode === 'mic' && (
            <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div
                onClick={handleVoiceInput}
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center cursor-pointer transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-xl animate-pulse scale-110'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
                role="button"
                aria-label={isListening ? 'Stop listening' : 'Start speaking'}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </div>

              <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-4">
                {isListening ? 'Listening for your voice...' : 'Speak your question or instruction'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Say something like: "What documents do I need for this scholarship?"
              </p>

              {pastedText && (
                <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto text-sm text-slate-800 dark:text-slate-200 font-medium">
                  "{pastedText}"
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3 text-red-800 dark:text-red-200 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            LOADING STATE OVERLAY / ACCESSIBLE STATUS
            ======================================================== */}
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="my-10 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center max-w-xl mx-auto"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              SARTHI AI Processing
            </h3>
            <p className="text-sm font-semibold text-brand-600 dark:text-sky-400 mt-2">
              {loadingStage || 'Analyzing digital content...'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Extracting facts, eliminating legalese, and structuring action steps.
            </p>
          </div>
        )}

        {/* ========================================================
            ANALYSIS RESULTS & SMART CONTENT MODES
            ======================================================== */}
        {session && !loading && (
          <div className="space-y-6">
            {/* Top Accessibility Summary Card */}
            <AccessibilitySummaryCard analysis={session} />

            {/* Smart Content Mode Tabs */}
            <div
              role="tablist"
              aria-label="Smart Accessibility Viewing Modes"
              className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              {[
                { id: 'simple', label: 'Simple Mode', icon: Sparkles },
                { id: 'actions', label: 'Actions ("What To Do")', icon: CheckSquare },
                { id: 'steps', label: 'Step-by-Step', icon: Layers },
                { id: 'translate', label: 'Translate', icon: Globe },
                { id: 'listen', label: 'Listen Aloud', icon: Volume2 },
                { id: 'qna', label: 'Ask SARTHI AI', icon: MessageSquare },
                { id: 'original', label: 'Original Content', icon: FileSearch },
              ].map((tab) => {
                const IconComp = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setActiveTab(tab.id);
                      announce(`Switched to ${tab.label}`);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB PANELS */}
            <div>
              {activeTab === 'simple' && (
                <SimplerModeView session={session} onUpdateSession={setSession} />
              )}

              {activeTab === 'actions' && (
                <ActionChecklist
                  actions={session.requiredActions || []}
                  onToggleAction={handleToggleAction}
                  sessionId={session._id || session.id}
                />
              )}

              {activeTab === 'steps' && (
                <StepByStepCard steps={session.steps || []} />
              )}

              {activeTab === 'translate' && (
                <TranslationTab session={session} onUpdateSession={setSession} />
              )}

              {activeTab === 'listen' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4" />
                        Auditory Accessibility Mode
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                        Voice Narration Center
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakText(currentNarrationText)}
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow flex items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Entire Explanation</span>
                    </button>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg">
                    {currentNarrationText}
                  </p>
                </div>
              )}

              {activeTab === 'qna' && (
                <GroundedQnA session={session} onUpdateSession={setSession} />
              )}

              {activeTab === 'original' && (
                <DocumentViewer
                  originalText={session.originalText}
                  fileMetadata={session.fileMetadata}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Audio Player Dock when audio is active */}
      <AudioPlayerDock
        textToRead={currentNarrationText}
        title={session?.title || 'Accessibility Explanation'}
      />
    </div>
  );
}
