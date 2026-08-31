import React from 'react';
import { User } from 'firebase/auth';
import { 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  BookOpen, 
  BarChart3, 
  User as UserIcon,
  Plus
} from 'lucide-react';

interface NavbarProps {
  user: User;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenSecurityModal: () => void;
  onOpenDigestModal: () => void;
  entryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenSecurityModal,
  onOpenDigestModal,
  entryCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-white">ReflectAI</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Private AI Journal &amp; Reflection Workspace</p>
          </div>
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-new-entry-nav"
            onClick={onNewEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Reflection</span>
          </button>

          {entryCount > 0 && (
            <button
              id="btn-open-digest"
              onClick={onOpenDigestModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Generate multi-entry digest with Gemini"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Digest ({entryCount})</span>
            </button>
          )}

          <button
            id="btn-security-rules"
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Inspect Firestore Security Rules & Isolation"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline text-emerald-400 text-xs font-mono">Isolated DB</span>
          </button>
        </div>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="hidden xl:block text-left">
              <div className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                {user.displayName || (user.isAnonymous ? 'Guest User' : 'Authenticated User')}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                {user.email || (user.isAnonymous ? 'Anonymous Session' : user.uid.substring(0, 10) + '...')}
              </div>
            </div>
          </div>

          <button
            id="btn-signout"
            onClick={onSignOut}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-900/50 transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
