import React, { useState } from 'react';
import { 
  Search, 
  Pin, 
  Trash2, 
  Calendar, 
  Smile, 
  Sparkles, 
  ChevronRight,
  Flame,
  Filter,
  Bookmark
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types';

interface HistorySidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onTogglePin: (entryId: string, currentPinned: boolean) => void;
  onNewEntry: () => void;
  loading: boolean;
}

const MOOD_CONFIG: Record<MoodType, { label: string; color: string; bg: string }> = {
  peaceful: { label: 'Peaceful', color: 'text-teal-400', bg: 'bg-teal-950/40 border-teal-800/40' },
  grateful: { label: 'Grateful', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/40' },
  inspired: { label: 'Inspired', color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-800/40' },
  focused: { label: 'Focused', color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-800/40' },
  challenged: { label: 'Challenged', color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-800/40' },
  anxious: { label: 'Anxious', color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-800/40' },
  neutral: { label: 'Neutral', color: 'text-slate-400', bg: 'bg-slate-800/40 border-slate-700/40' },
};

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  onTogglePin,
  onNewEntry,
  loading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodType | 'all'>('all');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Filtered & Sorted Entries
  const filteredEntries = entries.filter((entry) => {
    // Search query check
    const matchesSearch = 
      !searchQuery ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.tags && entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    // Mood filter check
    const matchesMood = selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;

    return matchesSearch && matchesMood;
  }).sort((a, b) => {
    // Pinned first, then by updatedAt descending
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 h-[calc(100vh-4rem)]">
      {/* Search & Header Section */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Bookmark className="w-4 h-4 text-indigo-400" />
            <span>Reflection History</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {entries.length}
            </span>
          </div>

          <button
            id="btn-sidebar-new-entry"
            onClick={onNewEntry}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>+ New</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-history"
            type="text"
            placeholder="Search thoughts, tags, insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Mood Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setSelectedMoodFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedMoodFilter === 'all'
                ? 'bg-indigo-600 text-white font-medium'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {(Object.keys(MOOD_CONFIG) as MoodType[]).map((moodKey) => {
            const conf = MOOD_CONFIG[moodKey];
            const active = selectedMoodFilter === moodKey;
            return (
              <button
                key={moodKey}
                onClick={() => setSelectedMoodFilter(active ? 'all' : moodKey)}
                className={`px-2 py-1 rounded-md transition-colors whitespace-nowrap capitalize cursor-pointer ${
                  active
                    ? 'bg-slate-700 text-white font-medium ring-1 ring-indigo-500'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {conf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Syncing Firestore records...</span>
          </div>
        )}

        {!loading && filteredEntries.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 px-4">
            <Sparkles className="w-6 h-6 text-slate-600 mx-auto mb-2" />
            <p className="font-medium text-slate-400">
              {searchQuery ? 'No matching reflections found' : 'No reflections saved yet'}
            </p>
            <p className="mt-1 text-slate-500">
              {searchQuery ? 'Try another keyword or clear the filter.' : 'Write your first thought to start reflecting with Gemini.'}
            </p>
          </div>
        )}

        {!loading && filteredEntries.map((entry) => {
          const isSelected = entry.id === selectedEntryId;
          const moodInfo = MOOD_CONFIG[entry.mood] || MOOD_CONFIG.neutral;
          const previewText = entry.summary || entry.messages[0]?.text || 'Empty reflection';

          return (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer text-left ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm shadow-indigo-950'
                  : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Title + Pin/Delete Actions */}
              <div className="flex items-start justify-between gap-2">
                <h4 className={`text-xs font-semibold truncate flex-1 ${
                  isSelected ? 'text-indigo-200' : 'text-slate-200 group-hover:text-white'
                }`}>
                  {entry.title || 'Untitled Reflection'}
                </h4>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(entry.id, Boolean(entry.pinned));
                    }}
                    className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                      entry.pinned ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                    title={entry.pinned ? 'Unpin reflection' : 'Pin to top'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEntryToDelete(entry.id);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message preview */}
              <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {previewText}
              </p>

              {/* Footer: Mood Badge & Date */}
              <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px]">
                <span className={`px-2 py-0.5 rounded-full border ${moodInfo.bg} ${moodInfo.color} font-medium capitalize`}>
                  {moodInfo.label}
                </span>

                <div className="flex items-center gap-1 text-slate-500 font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full text-slate-200 space-y-4 shadow-xl">
            <h3 className="font-semibold text-sm text-white">Delete Reflection?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This will permanently remove this journal entry and all Gemini conversation history from your isolated Firestore collection.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(entryToDelete);
                  setEntryToDelete(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
