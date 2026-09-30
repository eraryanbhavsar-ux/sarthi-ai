import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import {
  Compass,
  ArrowRight,
  Upload,
  BrainCircuit,
  Volume2,
  Globe,
  CheckSquare,
  Sparkles,
  FileText,
  Eye,
  SlidersHorizontal,
  Sun,
  Moon,
  Zap,
  ShieldCheck,
  Award,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowDown,
} from 'lucide-react';

export default function LandingPage() {
  const {
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    readingMode,
    setReadingMode,
    simplifiedInterface,
    setSimplifiedInterface,
    speakText,
  } = useAccessibility();

  // Mobile tab toggle for comparison ('before' | 'after')
  const [activeTab, setActiveTab] = useState('after');

  const demoVoiceSample =
    "Here is what you need to do for the Scholarship: First, find your Aadhaar card and income certificate. Second, submit the online application before October 15th. Third, give a printed copy to your college office within seven days.";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <main id="main-content" className="flex-1">
        {/* ========================================================
            1. HERO SECTION (FITS CLEANLY IN FIRST VIEWPORT, NO NAVBAR CLIPPING)
            ======================================================== */}
        <section className="relative overflow-hidden pt-6 pb-10 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Kicker Tag / Pill */}
            <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-bold mb-4 shadow-xs">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600 dark:text-sky-400 stroke-[2.2]" aria-hidden="true" />
                <span className="font-extrabold tracking-tight">SARTHI</span>
              </div>
              <span className="text-slate-400 dark:text-slate-500 font-normal hidden sm:inline">&bull;</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">"Understand. Hear. Translate. Act."</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white max-w-3xl mx-auto leading-tight sm:leading-[1.12]">
              Make the Digital World <span className="text-brand-600 dark:text-sky-400">Understandable.</span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              SARTHI transforms complex digital information into simple, accessible, multilingual and actionable guidance.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/workspace"
                className="px-6 py-3 sm:px-8 sm:py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-lg shadow-brand-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 focus:outline-none focus:ring-4 focus:ring-amber-400"
              >
                <span>Try SARTHI</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </Link>

              <a
                href="#comparison-section"
                className="px-5 py-3 sm:px-7 sm:py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-colors focus:outline-none focus:ring-4 focus:ring-amber-400 shadow-xs"
              >
                See How It Works
              </a>
            </div>

            {/* Visual Value Proof Badges */}
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-y-2 gap-x-5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                <span>Zero Hallucinations (Strictly Document Grounded)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                <span>6+ Indian Regional Languages</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-sky-500 flex-shrink-0" aria-hidden="true" />
                <span>Audio Narration &amp; Voice Guidance</span>
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. SARTHI INCLUSION PIPELINE (REQUIREMENT 9 - NOT A GENERIC AI SITE)
            ======================================================== */}
        <section aria-label="SARTHI Core Inclusion Pipeline" className="py-8 sm:py-10 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Core Purpose & Architecture
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                From Confusion to Autonomous Action
              </h2>
            </div>

            {/* Visual Pipeline Flowchart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {[
                { step: '01', title: 'COMPLEX INFO', desc: 'Dense circulars, legal notices, medical forms', color: 'border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400' },
                { step: '02', title: 'SARTHI AI', desc: 'Multimodal OCR & semantic decomposition', color: 'border-brand-300 dark:border-brand-900/60 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300' },
                { step: '03', title: 'UNDERSTAND', desc: 'Plain-language, 6th grade reading level', color: 'border-sky-300 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300' },
                { step: '04', title: 'TRANSLATE / HEAR', desc: 'Mother tongue text + natural voice synthesis', color: 'border-indigo-300 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300' },
                { step: '05', title: 'KNOW WHAT TO DO', desc: 'Required credentials, deadlines & checklist', color: 'border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400' },
                { step: '06', title: 'ACT INDEPENDENTLY', desc: 'Submit and succeed without middlemen', color: 'border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`p-3 sm:p-3.5 rounded-xl border ${item.color} flex flex-col justify-between transition-transform hover:-translate-y-0.5`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black opacity-75 font-mono">STEP {item.step}</span>
                    {i < 5 && <ArrowRight className="w-3 h-3 opacity-60 hidden lg:block" aria-hidden="true" />}
                  </div>
                  <h3 className="font-black text-xs sm:text-sm tracking-tight leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            3. BEFORE VS. AFTER COMPARISON (COMPACT, BALANCED, NATURALLY SIZED)
            ======================================================== */}
        <section id="comparison-section" className="scroll-mt-24 py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Immediate Contrast
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
              Before vs. After SARTHI
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              See how an intimidating bureaucratic notice transforms into a compact, stress-free action plan.
            </p>

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl mt-4">
              <button
                type="button"
                onClick={() => setActiveTab('before')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'before'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Complex Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('after')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'after'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                SARTHI Transformation
              </button>
            </div>
          </div>

          {/* Two-column comparison on Desktop/Tablet, single column on Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            {/* LEFT CARD: COMPLEX INFORMATION */}
            <div
              className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-xs flex flex-col justify-between ${
                activeTab === 'after' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black uppercase text-red-700 dark:text-red-400 px-2.5 py-1 rounded bg-red-100 dark:bg-red-950/80">
                    Complex Information
                  </span>
                  <span className="text-[11px] text-red-600 dark:text-red-400/80 font-mono font-medium">
                    Dense &bull; High Cognitive Strain
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 font-mono leading-snug mb-3">
                  CIRCULAR NO. 44/ESW/2026: MANDATORY COMPLIANCE &amp; ELIGIBILITY GUIDELINES
                </h3>

                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed space-y-2.5 p-3.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-red-200 dark:border-red-900/50">
                  <p>
                    "Pursuant to statutory resolution, candidates seeking disbursement of educational concessions under the National Higher Education Scheme are hereby notified that the application window shall remain open strictly until 15th October 2026 at 23:59 IST. Under no circumstances shall tardy submissions or condonation requests be entertained by the Directorate."
                  </p>
                  <p>
                    "Every prospective claimant is obliged to produce and furnish verified duplicates of the following credentials: Valid Aadhaar Number, certified Annual Family Income Certificate (Form 16-B) from Tahsildar establishing aggregate household income not exceeding INR 3,50,000 per annum, and original Grade Statement with CGPA of at least 75%..."
                  </p>
                </div>
              </div>

              {/* Identified Obstacles */}
              <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-900/40 space-y-1.5 text-xs text-red-700 dark:text-red-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" aria-hidden="true" />
                  <span>Confusing legal jargon, long compound clauses, and bureaucratic threats</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" aria-hidden="true" />
                  <span>Buried strict deadline that is easy for stressed applicants to miss</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" aria-hidden="true" />
                  <span>No clear summary, audio readout, or regional language support</span>
                </div>
              </div>
            </div>

            {/* RIGHT CARD: SARTHI TRANSFORMATION */}
            <div
              className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-brand-300 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between ${
                activeTab === 'before' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-black uppercase text-brand-700 dark:text-sky-300 px-2.5 py-1 rounded bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800">
                    SARTHI Transformation
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Clear &bull; Actionable &bull; Empowering
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  "Here is what you need to do"
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  National Merit Higher Education Scholarship &amp; Fee Waiver
                </p>

                {/* 1. Simple Explanation */}
                <div className="p-3 bg-brand-50/70 dark:bg-slate-800/60 rounded-xl border border-brand-100 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 mb-3 leading-relaxed">
                  <span className="font-bold text-brand-700 dark:text-sky-400">Simple Explanation: </span>
                  You can get a 100% college tuition fee waiver if your annual family income is under ₹3.5 Lakh and your academic score is 75% or higher.
                </div>

                {/* 2. Documents Required & 3. Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                      Documents Required (3)
                    </span>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• Valid Aadhaar Card</li>
                      <li>• Tahsildar Income Proof (Form 16-B)</li>
                      <li>• College Marksheet (CGPA ≥ 75%)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40">
                    <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      Strict Deadline
                    </span>
                    <p className="text-amber-800 dark:text-amber-200 font-bold">
                      October 15, 2026 at 23:59 IST
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400/90 mt-1">
                      Portal closes strictly. Late submissions are not accepted.
                    </p>
                  </div>
                </div>

                {/* 4. Action Steps */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
                  <span className="font-bold text-xs text-slate-900 dark:text-white block mb-1.5">
                    Clear Action Steps:
                  </span>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-start gap-1.5">
                      <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                      <span>Gather and verify your 3 required documents.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                      <span>Submit your application on the portal before Oct 15.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
                      <span>Submit a printed physical copy to your college office within 7 days.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar (Listen, Translation, Open in Workspace) */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakText(demoVoiceSample)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-bold text-xs transition-colors shadow-xs"
                  aria-label="Listen to audio explanation"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Listen</span>
                </button>

                <button
                  type="button"
                  onClick={() => speakText("हे शिष्यवृत्तीचे अधिकृत सूचनापत्र असून १५ ऑक्टोबरच्या आत अर्ज करणे आवश्यक आहे.", "mr")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
                  aria-label="Listen to Marathi translation"
                >
                  <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>मराठी (Marathi)</span>
                </button>

                <Link
                  to="/workspace"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-black active:bg-slate-800 text-white font-bold text-xs ml-auto transition-colors shadow-xs"
                >
                  <span>Open in Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            4. LIVE ACCESSIBILITY SANDBOX (COMPACT JUDGE DEMO BAR)
            ======================================================== */}
        <section
          aria-label="Live Accessibility Demonstration Controls"
          className="py-8 bg-brand-50/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-brand-200 dark:border-brand-900 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                  Live Accessibility Sandbox
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Test inclusive design principles instantly across this page:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTextSize(textSize === 'normal' ? 'large' : textSize === 'large' ? 'xlarge' : 'normal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    textSize !== 'normal'
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-label="Toggle text size"
                >
                  Text: {textSize.toUpperCase()}
                </button>

                <button
                  type="button"
                  onClick={() => setHighContrast(highContrast === 'dark' ? 'light' : highContrast === 'light' ? 'none' : 'dark')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                    highContrast !== 'none'
                      ? 'bg-amber-400 text-black border-amber-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-label="Toggle high contrast"
                >
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  Contrast: {highContrast.toUpperCase()}
                </button>

                <button
                  type="button"
                  onClick={() => setReadingMode(!readingMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    readingMode
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-label="Toggle dyslexia reading mode"
                >
                  Dyslexia: {readingMode ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setSimplifiedInterface(!simplifiedInterface)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    simplifiedInterface
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-label="Toggle simplified UI"
                >
                  Simplified UI: {simplifiedInterface ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            5. REAL-WORLD ACCESSIBILITY SCENARIOS
            ======================================================== */}
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Universal Application
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-1">
              Real-World Accessibility Scenarios
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Empowering individuals to navigate high-stakes digital barriers independently with dignity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Government Forms & Schemes',
                desc: 'Scholarships, pension renewals, ration card applications, and identity updates translated into plain steps.',
                tag: 'Administrative',
              },
              {
                title: 'Hospital & Medical Instructions',
                desc: 'Discharge summaries, prescription schedules, and clinic referral letters read aloud in simple terms.',
                tag: 'Healthcare',
              },
              {
                title: 'Banking & Financial Notices',
                desc: 'KYC updates, loan EMI alerts, and account verifications without confusing financial jargon.',
                tag: 'Financial',
              },
              {
                title: 'Educational Guidelines',
                desc: 'Exam timetables, syllabus updates, admission criteria, and fee waiver deadlines.',
                tag: 'Education',
              },
              {
                title: 'Visual Screenshots & Signs',
                desc: 'Camera snaps of notices on public boards, warning signs, and webpage screenshots clearly explained.',
                tag: 'Visual Assistance',
              },
              {
                title: 'Multilingual Digital Services',
                desc: 'Bridging official notices available only in English into regional languages like Marathi and Hindi.',
                tag: 'Language Inclusion',
              },
            ].map((uc, i) => (
              <div
                key={i}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {uc.tag}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-2.5">
                  {uc.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {uc.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            6. FINAL CALL TO ACTION
            ======================================================== */}
        <section className="py-14 sm:py-16 bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready to experience truly accessible information?
            </h2>
            <p className="mt-3 text-base sm:text-lg text-sky-100 max-w-2xl mx-auto">
              Try SARTHI now. Upload any complex document, form, or screenshot, or run our verified scholarship sample.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/workspace"
                className="px-8 py-3.5 sm:py-4 bg-white text-brand-700 hover:bg-slate-100 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Launch Workspace
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
