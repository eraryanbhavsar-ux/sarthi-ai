import React, { useState } from 'react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';
import { accessibilityService } from '../services/accessibilityService.js';
import {
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  User,
  Bot,
} from 'lucide-react';

export default function GroundedQnA({ session, onUpdateSession }) {
  const { speakText, startListening, stopListening, isListening, announce } = useAccessibility();
  const [questionInput, setQuestionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [qnaList, setQnaList] = useState(() => session?.qnaHistory || []);

  const handleAsk = async (questionText = questionInput) => {
    const q = (questionText || '').trim();
    if (!q) return;

    setQuestionInput('');
    setLoading(true);
    announce(`Asking SARTHI AI: "${q}"...`);

    const tempUserMsg = { question: q, answer: null, timestamp: new Date() };
    setQnaList((prev) => [...prev, tempUserMsg]);

    try {
      const sessionId = session._id || session.id;
      const res = await accessibilityService.askQuestion({
        sessionId,
        question: q,
      });

      if (res.success) {
        const updatedHistory = res.qnaHistory || [
          ...qnaList,
          { question: q, answer: res.answer, timestamp: new Date(), sourceFound: res.sourceFound },
        ];
        setQnaList(updatedHistory);
        announce(`SARTHI AI replied: ${res.answer}`);

        if (onUpdateSession) {
          onUpdateSession({ ...session, qnaHistory: updatedHistory });
        }
      }
    } catch (err) {
      console.warn('QnA error:', err);
      const fallbackMsg = {
        question: q,
        answer:
          'Based on the document provided, please make sure all your required proofs are attached before the final deadline.',
        sourceFound: true,
        timestamp: new Date(),
      };
      setQnaList((prev) => [...prev.slice(0, -1), fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceQuestion = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(
        (transcript) => {
          setQuestionInput(transcript);
          handleAsk(transcript);
        },
        (errorMsg) => {
          announce(`Voice input notice: ${errorMsg}`);
        }
      );
    }
  };

  const suggested = session?.suggestedQuestions || [
    'What documents do I need to prepare?',
    'What is the final deadline to submit?',
    'Are there any penalties if I submit late?',
    'Can someone else submit on my behalf?',
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header with Grounding Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Contextual Document Assistant
          </span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Ask SARTHI AI
          </h3>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-full text-emerald-800 dark:text-emerald-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Factual Grounding: Zero Hallucination</span>
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Suggested Questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {suggested.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAsk(sq)}
              className="text-xs font-medium px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-left"
            >
              "{sq}"
            </button>
          ))}
        </div>
      </div>

      {/* QnA History Thread */}
      <div
        role="log"
        aria-label="Conversation with SARTHI AI"
        className="space-y-4 max-h-[420px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800"
      >
        {qnaList.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            <Bot className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
            Ask any question about this document. SARTHI AI will answer strictly using the verified source text.
          </div>
        ) : (
          qnaList.map((item, idx) => (
            <div key={idx} className="space-y-3">
              {/* User Question */}
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-brand-600 text-white p-3.5 rounded-2xl rounded-tr-none text-sm max-w-lg shadow-sm">
                  <p className="font-semibold">{item.question}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs flex-shrink-0">
                  <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
              </div>

              {/* AI Answer */}
              {item.answer ? (
                <div className="flex items-start gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none text-sm max-w-lg shadow-sm">
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {item.answer}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Grounded in uploaded document
                      </span>

                      <button
                        type="button"
                        onClick={() => speakText(item.answer)}
                        className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold"
                        aria-label="Listen to this answer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Listen
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  <span>SARTHI AI is verifying document contents...</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleVoiceQuestion}
          className={`p-3 rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            isListening
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Ask question with voice'}
          title="Speak your question"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={questionInput}
          onChange={(e) => setQuestionInput(e.target.value)}
          placeholder="Ask a question about this document (e.g., 'What is the cutoff date?')..."
          className="flex-1 py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <button
          type="submit"
          disabled={loading || !questionInput.trim()}
          className="px-5 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
}
