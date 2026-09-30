import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                SARTHI
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 uppercase">
                AI
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Understand. Hear. Translate. Act.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md pt-1">
              Transforming complex digital documents, images, and services into accessible, plain-language, voice-guided, and actionable workflows for diverse human needs.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link to="/workspace" className="hover:text-brand-600 dark:hover:text-brand-400">
              Workspace
            </Link>
            <Link to="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400">
              Dashboard
            </Link>
            <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400">
              Sign In
            </Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Built according to WCAG 2.1 AA/AAA accessibility guidance</span>
          </div>

          <p className="text-center sm:text-right">
            Designed for dignity, independence, and inclusive digital access &copy; {new Date().getFullYear()} SARTHI.
          </p>
        </div>
      </div>
    </footer>
  );
}
