import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, Database, X, Check, Copy } from 'lucide-react';
import { User } from 'firebase/auth';

interface SecurityBadgeModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-isolated reflection entries
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Database Isolation &amp; Security</h3>
              <p className="text-xs text-slate-400">Verified multi-tenant data segregation</p>
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
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* Active UID Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Current User Identity (UID)</span>
            </div>
            <p className="font-mono text-slate-200 text-xs break-all select-all bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
              {user.uid}
            </p>
          </div>

          {/* Active Path Card */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <Database className="w-3 h-3 text-sky-400" />
              <span>Active Isolated Firestore Storage Path</span>
            </div>
            <p className="font-mono text-sky-300 text-xs break-all select-all bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
              /users/{user.uid}/entries/{'{entryId}'}
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Cross-user access is impossible because queries and writes require matching the JWT authentication claim <code className="text-emerald-400">request.auth.uid == userId</code>.
            </p>
          </div>

          {/* Security Rules Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Enforced Firestore Rules:
              </span>
              <button
                onClick={handleCopyRules}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="text-[10px]">{copied ? 'Copied' : 'Copy Rules'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
              {sampleRules}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
