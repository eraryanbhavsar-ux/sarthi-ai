import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
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

  const [demoTab, setDemoTab] = useState('after'); // 'before' | 'after'

  const demoVoiceSample =
    "Here is what you need to do for the Scholarship: First, find your Aadhaar card and income certificate. Second, submit the online application before October 15th. Third, give a printed copy to your college office within seven days.";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      <main id="main-content" className="flex-1">
        {/* ========================================================
            HERO SECTION
            ======================================================== */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 dark:bg-brand-950/80 border border-brand-300 dark:border-brand-800 text-brand-800 dark:text-brand-300 text-xs sm:text-sm font-bold mb-6">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>AI for Accessibility & Inclusion</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
              Make the Digital World <span className="text-brand-600 dark:text-sky-400">Understandable.</span>
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              SARTHI turns complex documents, images, instructions and digital information into simple, accessible, multilingual and actionable guidance.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/workspace"
                className="px-8 py-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-brand-600/30 hover:scale-105 transition-all flex items-center gap-2.5 focus:outline-none focus:ring-4 focus:ring-amber-400"
              >
                <span>Try SARTHI</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="#workflow-section"
                className="px-7 py-4 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-base transition-colors focus:outline-none focus:ring-4 focus:ring-amber-400"
              >
                See How It Works
              </a>
            </div>

            {/* Tagline Badge */}
            <p className="mt-6 text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Understand &bull; Hear &bull; Translate &bull; Act
            </p>
          </div>
        </section>

        {/* ========================================================
            ACCESSIBILITY PREVIEW DOCK (JUDGE WOW FACTOR)
            ======================================================== */}
        <section
          aria-label="Live Accessibility Demonstration Controls"
          className="py-10 bg-brand-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-brand-200 dark:border-brand-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  Live Accessibility Sandbox
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Test inclusive design principles instantly:
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
                >
                  <Moon className="w-3.5 h-3.5" />
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
                >
                  Dyslexia Mode: {readingMode ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setSimplifiedInterface(!simplifiedInterface)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    simplifiedInterface
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Simplified UI: {simplifiedInterface ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            BEFORE & AFTER INTERACTIVE SHOWCASE (10-SECOND VALUE PROPOSITION)
            ======================================================== */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Immediate Contrast
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-1">
              Before vs. After SARTHI
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base max-w-2xl mx-auto">
              See how SARTHI cuts through intimidating bureaucratic legalese and generates a stress-free action plan.
            </p>

            <div className="inline-flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl mt-6">
              <button
                type="button"
                onClick={() => setDemoTab('before')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  demoTab === 'before'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                1. Before (Intimidating Original)
              </button>
              <button
                type="button"
                onClick={() => setDemoTab('after')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  demoTab === 'after'
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                2. After (SARTHI Action Plan)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* BEFORE CARD */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                demoTab === 'before'
                  ? 'border-red-400 dark:border-red-700 bg-red-50/40 dark:bg-red-950/20 ring-4 ring-red-400/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase text-red-700 dark:text-red-400 px-3 py-1 rounded bg-red-100 dark:bg-red-950/60">
                  Original Bureaucratic Notice
                </span>
                <span className="text-xs text-slate-400 font-mono">Dense &bull; High Strain</span>
              </div>

              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono leading-tight mb-4">
                CIRCULAR NO. 44/ESW/2026: MANDATORY COMPLIANCE & ELIGIBILITY GUIDELINES
              </h3>

              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-mono leading-relaxed space-y-3 p-4 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 max-h-72 overflow-y-auto">
                <p>
                  "Pursuant to statutory resolution, candidates seeking disbursement of educational concessions under the National Higher Education Scheme are hereby notified that the application window shall remain open strictly until 15th October 2026 at 23:59 IST. Under no circumstances shall tardy submissions or condonation requests be entertained by the Directorate."
                </p>
                <p>
                  "Every prospective claimant is obliged to produce and furnish verified duplicates of the following credentials: Valid Aadhaar Number, certified Annual Family Income Certificate (Form 16-B) from Tahsildar establishing aggregate household income not exceeding INR 3,50,000 per annum, original Grade Statement with CGPA of at least 75%..."
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-red-600 dark:text-red-400 font-semibold">
                <span>⚠️ Complex clauses, difficult vocabulary, confusing deadlines</span>
              </div>
            </div>

            {/* AFTER CARD */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                demoTab === 'after'
                  ? 'border-brand-500 dark:border-sky-500 bg-brand-50/40 dark:bg-brand-950/20 ring-4 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase text-brand-700 dark:text-brand-300 px-3 py-1 rounded bg-brand-100 dark:bg-brand-950">
                  SARTHI Transformation
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Clear &bull; Actionable
                </span>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                "Here is what you need to do"
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                National Merit Higher Education Scholarship & Fee Waiver
              </p>

              {/* Action checklist preview */}
              <div className="space-y-2.5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</span>
                  <span>3 Documents Required (Aadhaar, Marksheet, Income Proof)</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</span>
                  <span>Submit before October 15, 2026 (Strict Deadline)</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</span>
                  <span>5 Clear, Sequential Step-by-Step Instructions</span>
                </div>
              </div>

              {/* Multi-modal actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => speakText(demoVoiceSample)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold text-xs hover:bg-sky-600"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>🔊 Listen</span>
                </button>

                <button
                  type="button"
                  onClick={() => speakText("हे शिष्यवृत्तीचे अधिकृत सूचनापत्र असून १५ ऑक्टोबरच्या आत अर्ज करणे आवश्यक आहे.", "mr")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-600"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 मराठी (Marathi)</span>
                </button>

                <Link
                  to="/workspace"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs hover:bg-black ml-auto"
                >
                  <span>Open in Workspace</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            VISUAL WORKFLOW (UPLOAD -> UNDERSTAND -> SIMPLIFY -> TRANSLATE -> HEAR -> ACT)
            ======================================================== */}
        <section id="workflow-section" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              The Inclusive Pipeline
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-1 mb-12">
              How SARTHI Works
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { step: '01', title: 'UPLOAD', desc: 'PDF, Image, or pasted text', icon: Upload },
                { step: '02', title: 'UNDERSTAND', desc: 'Gemini AI extracts facts & dates', icon: BrainCircuit },
                { step: '03', title: 'SIMPLIFY', desc: 'Plain language with zero jargon', icon: Sparkles },
                { step: '04', title: 'TRANSLATE', desc: 'Mother tongue (Hindi, Marathi)', icon: Globe },
                { step: '05', title: 'HEAR', desc: 'Text-to-Speech audio guidance', icon: Volume2 },
                { step: '06', title: 'ACT', desc: 'Checklist: "What do I need to do?"', icon: CheckSquare },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center group hover:border-brand-500 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 mb-1">
                      STEP {item.step}
                    </span>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================
            ACCESSIBILITY USE CASES
            ======================================================== */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Universal Application
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-1">
              Real-World Accessibility Scenarios
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base max-w-2xl mx-auto">
              Empowering individuals to navigate high-stakes digital barriers independently with dignity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {uc.tag}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                  {uc.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {uc.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            FINAL CALL TO ACTION
            ======================================================== */}
        <section className="py-20 bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to experience truly accessible information?
            </h2>
            <p className="mt-4 text-lg text-sky-100 max-w-2xl mx-auto">
              Try SARTHI now. Upload any complex document, form, or screenshot, or run our verified scholarship sample.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/workspace"
                className="px-8 py-4 bg-white text-brand-700 hover:bg-slate-100 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all"
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
