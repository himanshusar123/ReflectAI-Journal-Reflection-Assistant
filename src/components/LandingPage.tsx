import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  BrainCircuit, 
  BookHeart, 
  ArrowRight,
  Database,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { loginWithGoogle, loginAsGuest } from '../firebase';

interface LandingPageProps {
  onAuthSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(
        err?.message?.includes('popup')
          ? 'Popup was blocked or closed. You can also sign in via Guest Access below.'
          : err?.message || 'Failed to authenticate with Google.'
      );
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoadingGuest(true);
    setAuthError(null);
    try {
      await loginAsGuest();
    } catch (err: any) {
      console.error('Guest Sign In Error:', err);
      setAuthError(err?.message || 'Failed to sign in as guest.');
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Top Banner */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">ReflectAI</h1>
            <p className="text-xs text-slate-400">Intelligent Journal &amp; Private Reflection</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Firestore Rule Protected</span>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-medium mb-6">
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
          <span>Powered by Gemini 3.6 Flash &amp; Cloud Firestore</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-3xl leading-[1.15]">
          Your Private Haven for Thought, Growth &amp; Clarity.
        </h2>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          Experience a multi-turn reflection workspace. Converse with Gemini to brainstorm breakthroughs, dissect challenges, and distill actionable insights—stored exclusively under your authenticated Firestore profile.
        </p>

        {/* Error Alert */}
        {authError && (
          <div className="mt-6 max-w-md w-full p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Authentication Alert</p>
              <p className="mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            id="btn-google-login"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle || loadingGuest}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            {loadingGoogle ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign In with Google</span>
            <ArrowRight className="w-4 h-4 text-slate-700" />
          </button>

          <button
            id="btn-guest-login"
            onClick={handleGuestSignIn}
            disabled={loadingGoogle || loadingGuest}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-sm border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingGuest ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4 text-slate-400" />
            )}
            <span>Explore as Guest</span>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/70 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Strict Isolation</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Every journal entry is strictly scoped to your authenticated Firebase UID. Unauthenticated or foreign requests are blocked at the Firestore security rule boundary.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-950/70 border border-sky-800/50 flex items-center justify-center text-sky-400 mb-4">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Gemini 3.6 Flash Partner</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Multi-turn reflection modes including Socratic questioning, cognitive reframing, action-planning, and instant session synthesis.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Persistent Cloud History</h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Full history search, emotional valence tags, cross-session reflection digests, and reliable real-time Firestore synchronization.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>ReflectAI • Built with Google AI Studio, Gemini API &amp; Cloud Firestore</p>
      </footer>
    </div>
  );
};
