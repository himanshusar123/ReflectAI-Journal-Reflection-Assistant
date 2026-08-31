import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  BrainCircuit, 
  Save, 
  CheckCircle2, 
  Copy, 
  Check, 
  Lightbulb, 
  Compass, 
  HelpCircle,
  Heart,
  Target,
  RefreshCw,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { JournalEntry, ChatMessage, ReflectionMode, MoodType } from '../types';

interface JournalEditorProps {
  currentEntry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => void;
  onSaveToFirestore: (entry: JournalEntry) => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage?: string | null;
}

const MODES: Array<{ id: ReflectionMode; label: string; icon: React.ReactNode; desc: string }> = [
  { id: 'deep_reflection', label: 'Deep Reflection', icon: <Compass className="w-3.5 h-3.5" />, desc: 'Introspective exploration & pattern recognition' },
  { id: 'action_planning', label: 'Action Planning', icon: <Target className="w-3.5 h-3.5" />, desc: 'Distill thoughts into concrete next steps' },
  { id: 'cognitive_reframe', label: 'Cognitive Reframe', icon: <BrainCircuit className="w-3.5 h-3.5" />, desc: 'Overcome self-doubt & find constructive angles' },
  { id: 'socratic', label: 'Socratic Inquiry', icon: <HelpCircle className="w-3.5 h-3.5" />, desc: 'Deep questions to uncover your own solutions' },
  { id: 'gratitude', label: 'Gratitude & Wins', icon: <Heart className="w-3.5 h-3.5" />, desc: 'Celebrate strengths, wins, and appreciation' },
  { id: 'quick_summary', label: 'Quick Summary', icon: <Layers className="w-3.5 h-3.5" />, desc: 'Fast 3-point synthesis of your thoughts' },
];

const MOODS: Array<{ id: MoodType; label: string; emoji: string; color: string }> = [
  { id: 'peaceful', label: 'Peaceful', emoji: '🌿', color: 'hover:border-teal-500' },
  { id: 'grateful', label: 'Grateful', emoji: '✨', color: 'hover:border-amber-500' },
  { id: 'inspired', label: 'Inspired', emoji: '💡', color: 'hover:border-purple-500' },
  { id: 'focused', label: 'Focused', emoji: '🎯', color: 'hover:border-blue-500' },
  { id: 'challenged', label: 'Challenged', emoji: '⛰️', color: 'hover:border-rose-500' },
  { id: 'anxious', label: 'Anxious', emoji: '🌊', color: 'hover:border-orange-500' },
  { id: 'neutral', label: 'Neutral', emoji: '⚖️', color: 'hover:border-slate-500' },
];

const PROMPT_SUGGESTIONS = [
  "What is occupying most of my mental bandwidth today?",
  "A breakthrough or small win I noticed recently is...",
  "I am feeling conflicted or hesitant about...",
  "What would this look like if it were effortless?",
  "What is one assumption I might be making that could be wrong?",
  "Three things that gave me genuine energy this week are..."
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  currentEntry,
  onUpdateEntry,
  onSaveToFirestore,
  saveStatus,
  errorMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentEntry.messages, isAiGenerating]);

  const handleTitleChange = (newTitle: string) => {
    const updated = {
      ...currentEntry,
      title: newTitle,
      updatedAt: new Date().toISOString()
    };
    onUpdateEntry(updated);
  };

  const handleMoodChange = (newMood: MoodType) => {
    const updated = {
      ...currentEntry,
      mood: newMood,
      updatedAt: new Date().toISOString()
    };
    onUpdateEntry(updated);
  };

  const handleModeChange = (newMode: ReflectionMode) => {
    const updated = {
      ...currentEntry,
      mode: newMode,
      updatedAt: new Date().toISOString()
    };
    onUpdateEntry(updated);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || isAiGenerating) return;

    setActionError(null);
    const userMsgId = 'msg-' + Date.now();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptToSend.trim(),
      timestamp: new Date().toISOString()
    };

    // Auto-generate title if this is the first message and title is default
    let updatedTitle = currentEntry.title;
    if (currentEntry.messages.length === 0 && (!currentEntry.title || currentEntry.title === 'New Reflection')) {
      updatedTitle = promptToSend.trim().slice(0, 45) + (promptToSend.trim().length > 45 ? '...' : '');
    }

    const updatedMessages = [...currentEntry.messages, newUserMessage];
    const entryWithUserMsg: JournalEntry = {
      ...currentEntry,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };

    onUpdateEntry(entryWithUserMsg);
    setInputText('');
    setIsAiGenerating(true);

    try {
      // Build history for backend
      const historyPayload = currentEntry.messages.map(m => ({
        role: (m.sender === 'gemini' ? 'model' : 'user') as 'model' | 'user',
        content: m.text
      }));

      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend.trim(),
          history: historyPayload,
          mode: currentEntry.mode,
          mood: currentEntry.mood,
          title: updatedTitle
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const geminiMsgId = 'msg-' + (Date.now() + 1);
      const newGeminiMessage: ChatMessage = {
        id: geminiMsgId,
        sender: 'gemini',
        text: data.reply,
        timestamp: new Date().toISOString(),
        insights: data.insights,
        tags: data.tags
      };

      const finalEntry: JournalEntry = {
        ...entryWithUserMsg,
        messages: [...entryWithUserMsg.messages, newGeminiMessage],
        summary: data.summary || entryWithUserMsg.summary,
        updatedAt: new Date().toISOString()
      };

      onUpdateEntry(finalEntry);
      // Auto-save to Firestore
      await onSaveToFirestore(finalEntry);
    } catch (err: any) {
      console.error('Error generating reflection:', err);
      setActionError(err?.message || 'Failed to converse with Gemini. Please try again.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSynthesize = async () => {
    if (currentEntry.messages.length === 0 || isSynthesizing) return;
    setIsSynthesizing(true);
    setActionError(null);

    try {
      const compiled = currentEntry.messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Please provide a concise, high-impact 3-bullet synthesis of this entire reflection session, highlighting key discoveries, emotional themes, and one concrete action prompt. Session transcript:\n\n${compiled}`,
          mode: 'quick_summary',
          mood: currentEntry.mood
        })
      });

      if (!res.ok) throw new Error('Synthesis failed');
      const data = await res.json();

      const updated: JournalEntry = {
        ...currentEntry,
        summary: data.reply,
        keyInsights: data.insights || currentEntry.keyInsights,
        updatedAt: new Date().toISOString()
      };

      onUpdateEntry(updated);
      await onSaveToFirestore(updated);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setActionError(err?.message || 'Failed to synthesize session.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Editor Top Control Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm p-4 space-y-3 shrink-0">
        {/* Row 1: Title + Save Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <input
            id="input-entry-title"
            type="text"
            value={currentEntry.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Reflection Title..."
            className="text-base sm:text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors w-full sm:max-w-md"
          />

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {/* Save Status */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-sky-400 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing to Firestore...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved in Firestore</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <button
                  onClick={() => onSaveToFirestore(currentEntry)}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-medium underline cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Retry Save</span>
                </button>
              )}
            </div>

            <button
              id="btn-manual-save"
              onClick={() => onSaveToFirestore(currentEntry)}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Manually trigger Firestore sync"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save</span>
            </button>

            {currentEntry.messages.length > 0 && (
              <button
                id="btn-synthesize-session"
                onClick={handleSynthesize}
                disabled={isSynthesizing}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-medium border border-indigo-700/50 transition-colors cursor-pointer disabled:opacity-50"
                title="Summarize key takeaways with Gemini"
              >
                {isSynthesizing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>Synthesize</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Reflection Mode & Mood Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/40 text-xs">
          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-slate-500 font-medium text-[11px] uppercase tracking-wider shrink-0">Mode:</span>
            {MODES.map((m) => {
              const active = currentEntry.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  title={m.desc}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mood Selector */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">Mood:</span>
            <div className="flex items-center gap-1">
              {MOODS.map((md) => {
                const active = currentEntry.mood === md.id;
                return (
                  <button
                    key={md.id}
                    onClick={() => handleMoodChange(md.id)}
                    title={md.label}
                    className={`px-2 py-0.5 rounded-md border text-xs transition-all cursor-pointer ${
                      active
                        ? 'bg-slate-800 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{md.emoji}</span>
                    <span className="hidden xl:inline ml-1 text-[11px]">{md.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {(actionError || errorMessage) && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError || errorMessage}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-white font-bold text-sm px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Conversation & Thoughts Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Welcome / Empty State */}
        {currentEntry.messages.length === 0 && (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/70 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mx-auto shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Begin Your Reflection</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Write freely about your day, challenges, decisions, or aspirations. Gemini will reflect, ask thoughtful questions, and help organize your thoughts.
              </p>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="text-left space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Prompt Starters:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPT_SUGGESTIONS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(promptText);
                      textareaRef.current?.focus();
                    }}
                    className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 text-left text-xs text-slate-300 hover:text-white transition-all cursor-pointer flex items-start gap-2 group"
                  >
                    <span className="text-indigo-400 font-mono text-[10px] mt-0.5">0{idx + 1}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Synthesis Banner if available */}
        {currentEntry.summary && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Session Synthesis &amp; Takeaways</span>
              </div>
              <button
                onClick={() => handleCopy(currentEntry.summary || '', 'synthesis-box')}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'synthesis-box' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span className="text-[10px]">{copiedId === 'synthesis-box' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed font-sans">
              <Markdown>{currentEntry.summary}</Markdown>
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        <div className="max-w-3xl mx-auto space-y-6">
          {currentEntry.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-left ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for Gemini */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative p-4 rounded-2xl max-w-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {/* Top Bar for Copy & Timestamp */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/10 text-[10px] opacity-75">
                    <span className="font-semibold uppercase tracking-wider">
                      {isUser ? 'You' : 'Gemini 3.6 Flash'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="prose prose-invert prose-xs sm:prose-sm max-w-none break-words">
                    <Markdown>{msg.text}</Markdown>
                  </div>

                  {/* Insights Pills if any */}
                  {msg.insights && msg.insights.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-semibold text-sky-400 uppercase tracking-wider">
                        Key Discoveries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.insights.map((ins, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-800/50 text-sky-300 text-[11px]"
                          >
                            {ins}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Generating Indicator */}
          {isAiGenerating && (
            <div className="flex gap-3 items-start justify-start max-w-3xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-2 rounded-tl-none">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-slate-400">Gemini is reflecting on your thoughts...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            ref={textareaRef}
            id="textarea-user-thought"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Express your thoughts, updates, or questions (Mode: ${currentEntry.mode.replace('_', ' ')})...`}
            rows={3}
            disabled={isAiGenerating}
            className="w-full pl-4 pr-24 py-3 bg-slate-950 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none transition-colors leading-relaxed"
          />

          <div className="absolute right-3 bottom-4 flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              ⌘ + Enter
            </span>
            <button
              id="btn-send-thought"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isAiGenerating}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send to Gemini"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
