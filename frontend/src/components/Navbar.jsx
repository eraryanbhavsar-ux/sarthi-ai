import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { useVoiceAssistant } from '../context/VoiceAssistantContext.jsx';
import {
  Sparkles,
  SlidersHorizontal,
  Globe,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  FileText,
  Volume2,
  Menu,
  X,
  Compass,
  Eye,
  Mic,
  MicOff,
} from 'lucide-react';
import LanguageCenterModal from './LanguageCenterModal.jsx';
import { getLanguageInfo } from '../services/languageRegistry.js';

export default function Navbar() {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const { activeLanguage, setActiveLanguage } = useAccessibility();
  const { isAssistantEnabled, toggleVoiceAssistant } = useVoiceAssistant();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);

  const currentLangInfo = getLanguageInfo(activeLanguage);
  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Tagline */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1"
            aria-label="SARTHI Home"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6 stroke-[2.2]" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                  SARTHI
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight -mt-0.5 hidden sm:block">
                Understand. Hear. Translate. Act.
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
            <Link
              to="/vision"
              className={`px-3.5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-1.5 ${
                isActive('/vision')
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>SARTHI Vision</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded font-black uppercase tracking-wider">
                Voice
              </span>
            </Link>

            <Link
              to="/workspace"
              className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${
                isActive('/workspace')
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Workspace
            </Link>

            <Link
              to="/dashboard"
              className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 ${
                isActive('/dashboard')
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </nav>

          {/* Right Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Accessible Language Center Button */}
            <button
              type="button"
              onClick={() => setLanguageModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              aria-label={`Open Language Center. Current language: ${currentLangInfo.displayName}`}
              title="Open SARTHI Language Center (11 Indian Languages)"
            >
              <Globe className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
              <span>{currentLangInfo.nativeName}</span>
              <span className="text-[10px] text-slate-400 font-medium">({currentLangInfo.code.toUpperCase()})</span>
            </button>

            {/* Quick Hey Sarthi Wake Word Toggle */}
            <button
              type="button"
              onClick={toggleVoiceAssistant}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isAssistantEnabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              aria-label={isAssistantEnabled ? 'Disable "Hey Sarthi" voice assistant' : 'Enable "Hey Sarthi" voice assistant'}
              title={isAssistantEnabled ? 'Hey Sarthi is active - say "Hey Sarthi", press ⌘K / ⌥V, or tap the mic' : 'Turn on "Hey Sarthi" voice assistant'}
            >
              <span className="relative flex h-2 w-2">
                {isAssistantEnabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isAssistantEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              </span>
              <Mic className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hey Sarthi: {isAssistantEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Auth States */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  aria-expanded={profileDropdownOpen}
                >
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name || 'Account'}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-600" />
                      Saved Sessions
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={demoLogin}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700 rounded-lg text-xs font-bold transition-colors"
                  title="One-click demo evaluation login"
                >
                  ⚡ Demo Account
                </button>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Quick Lang + Menu Button */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              type="button"
              onClick={() => setLanguageModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              aria-label={`Current language: ${currentLangInfo.displayName}. Open Language Center`}
            >
              <Globe className="w-3.5 h-3.5 text-brand-600" />
              <span>{currentLangInfo.code.toUpperCase()}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/vision"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between py-2 text-base font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              SARTHI Vision
            </span>
            <span className="text-xs px-2 py-0.5 bg-amber-500 text-slate-950 rounded font-bold uppercase">
              Voice
            </span>
          </Link>
          <Link
            to="/workspace"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800 dark:text-white px-3"
          >
            Workspace
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800 dark:text-white"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              toggleVoiceAssistant();
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-bold border transition-colors ${
              isAssistantEnabled
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Hey Sarthi Voice Assistant
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-black uppercase ${
              isAssistantEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {isAssistantEnabled ? 'Active' : 'Off'}
            </span>
          </button>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    demoLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-amber-500 text-black font-bold rounded-lg text-sm"
                >
                  ⚡ One-Click Demo Login
                </button>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-brand-600 text-white rounded-lg text-sm font-bold"
                >
                  Create Free Account
                </Link>
              </>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-red-600 font-semibold text-left"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Multilingual Regional Language Center Modal */}
      <LanguageCenterModal
        isOpen={languageModalOpen}
        onClose={() => setLanguageModalOpen(false)}
      />
    </header>
  );
}
