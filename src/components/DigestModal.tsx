import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  BarChart3, 
  Sparkles, 
  X, 
  RefreshCw, 
  Calendar, 
  Copy, 
  Check, 
  TrendingUp,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';
import { JournalEntry } from '../types';

interface DigestModalProps {
  entries: JournalEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export const DigestModal: React.FC<DigestModalProps> = ({
  entries,
  isOpen,
  onClose
}) => {
  const [digest, setDigest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateDigest = async () => {
    if (entries.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setDigest(data.digest);
      setModelUsed(data.modelUsed);
    } catch (err: any) {
      console.error('Digest generation error:', err);
      setError(err?.message || 'Failed to generate cross-entry reflection digest.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!digest) return;
    navigator.clipboard.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cross-Session AI Digest</h3>
              <p className="text-xs text-slate-400">Synthesizing trends across {entries.length} reflections</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!digest && !loading && (
            <div className="py-12 text-center space-y-4">
              <BrainCircuit className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-semibold text-slate-200">Ready to synthesize your reflection journey</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Gemini will analyze your {entries.length} stored entries to detect recurring themes, emotional shifts, and actionable growth opportunities.
                </p>
              </div>

              <button
                id="btn-generate-digest-submit"
                onClick={handleGenerateDigest}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Reflection Digest</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-300">Analyzing all reflection threads...</p>
              <p className="text-xs text-slate-500">Gemini 3.6 Flash is extracting emotional trajectory and patterns</p>
            </div>
          )}

          {digest && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Model: {modelUsed || 'gemini-3.6-flash'}</span>
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Digest'}</span>
                </button>
              </div>

              <div className="prose prose-invert prose-xs sm:prose-sm max-w-none text-slate-200">
                <Markdown>{digest}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            {entries.length} reflections in dataset
          </span>
          <div className="flex items-center gap-2">
            {digest && (
              <button
                onClick={handleGenerateDigest}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                Regenerate
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
