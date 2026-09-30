import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { accessibilityService } from '../services/accessibilityService.js';
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Mic,
  Calendar,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Globe,
  Loader2,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { announce } = useAccessibility();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    documentsAnalyzed: 0,
    questionsAnswered: 0,
    actionsCompleted: 0,
    translationsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [sessionRes, statsRes] = await Promise.all([
          accessibilityService.getSessions(),
          accessibilityService.getUserStats(),
        ]);

        if (sessionRes.success) {
          setSessions(sessionRes.sessions || []);
        }

        if (statsRes.success) {
          setStats(statsRes.stats || {
            documentsAnalyzed: 0,
            questionsAnswered: 0,
            actionsCompleted: 0,
            translationsCount: 0,
          });
        }
      } catch (err) {
        console.warn('Dashboard fetch notice:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await accessibilityService.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id && s._id !== id));
      announce('Session deleted successfully.');
      setDeleteConfirmId(null);
    } catch (err) {
      console.warn('Delete session error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors">
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        {/* Welcome Header */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            SARTHI Command Center
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            How can we make this easier?
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">
            {isAuthenticated
              ? `Welcome back, ${user?.name}. Here is your accessibility overview and saved analyses.`
              : 'Welcome to your accessibility overview. Sign in anytime to preserve your sessions permanently.'}
          </p>
        </div>

        {/* ========================================================
            REAL USER METRICS & ANALYTICS
            ======================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <FileText className="w-4 h-4 text-brand-600" />
              Documents Analyzed
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats.documentsAnalyzed || sessions.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Files & notices processed</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Actions Completed
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats.actionsCompleted || 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Checklist items fulfilled</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Questions Answered
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats.questionsAnswered || 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Grounded Q&A answers</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
              <Globe className="w-4 h-4 text-purple-600" />
              Translations
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {stats.translationsCount || 0}
            </p>
            <p className="text-xs text-slate-400 mt-1">Regional language queries</p>
          </div>
        </div>

        {/* ========================================================
            QUICK LAUNCH CARDS (Upload Document, Upload Image, Paste Text, Voice)
            ======================================================== */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Start a New Accessibility Session
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {/* Card 1: Document */}
          <Link
            to="/workspace"
            className="group p-6 bg-white dark:bg-slate-900 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 border-2 border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-3xl shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Upload a Document
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                PDF notices, circulars, hospital discharge sheets, and application forms.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform">
              <span>Open in Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 2: Image */}
          <Link
            to="/workspace"
            className="group p-6 bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 border-2 border-slate-200 dark:border-slate-800 hover:border-sky-500 rounded-3xl shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Upload an Image
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Screenshots of websites, phone camera photos of notices, signs, or bills.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
              <span>Open in Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 3: Paste Text */}
          <Link
            to="/workspace"
            className="group p-6 bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-3xl shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Paste Text
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Copy text from emails, portals, or messages to get an instant action checklist.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Open in Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* ========================================================
            RECENT ACCESSIBILITY SESSIONS
            ======================================================== */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Recent Accessibility Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Re-open previously analyzed documents and track checklist progress
              </p>
            </div>

            <Link
              to="/workspace"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>New Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-brand-600 mb-2" />
              <p className="text-sm text-slate-500">Loading your sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                No sessions saved yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Start by uploading a document in the Workspace or test our pre-loaded scholarship demo.
              </p>
              <Link
                to="/workspace"
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow"
              >
                Go to Workspace
              </Link>
            </div>
          ) : (
            <div className="space-y-3" role="list">
              {sessions.map((sess) => {
                const sessId = sess.id || sess._id;
                return (
                  <div
                    key={sessId}
                    role="listitem"
                    onClick={() => navigate(`/workspace?session=${sessId}`)}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {sess.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                            {sess.contentType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {sess.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                          <span>
                            {sess.actionCount} action steps ({sess.completedActionCount} done)
                          </span>
                          <span>&bull;</span>
                          <span>
                            {sess.createdAt ? new Date(sess.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workspace?session=${sessId}`);
                        }}
                        className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span>Reopen</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {deleteConfirmId === sessId ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSession(sessId, e)}
                            className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(sessId);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete session"
                          aria-label={`Delete ${sess.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
