import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  auth, 
  logoutUser, 
  getUserEntriesRef, 
  saveJournalEntry, 
  deleteJournalEntry, 
  togglePinEntry 
} from './firebase';
import { JournalEntry, ReflectionMode, MoodType } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { DigestModal } from './components/DigestModal';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';

function createBlankEntry(userId: string): JournalEntry {
  const id = 'entry-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const now = new Date().toISOString();
  return {
    id,
    userId,
    title: 'New Reflection',
    mood: 'neutral' as MoodType,
    mode: 'deep_reflection' as ReflectionMode,
    createdAt: now,
    updatedAt: now,
    messages: [],
    pinned: false,
  };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  
  // Modals
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        // Initialize with a blank entry for the user
        setSelectedEntry(createBlankEntry(currentUser.uid));
      } else {
        setSelectedEntry(null);
        setEntries([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore User Entries
  useEffect(() => {
    if (!user) return;

    setEntriesLoading(true);
    const q = query(getUserEntriesRef(user.uid), orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: JournalEntry[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as JournalEntry);
        });
        setEntries(fetched);
        setEntriesLoading(false);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        setEntriesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle New Entry
  const handleNewEntry = useCallback(() => {
    if (!user) return;
    const fresh = createBlankEntry(user.uid);
    setSelectedEntry(fresh);
    setSaveStatus('idle');
    setSaveErrorMessage(null);
  }, [user]);

  // Handle Save to Firestore
  const handleSaveToFirestore = async (entryToSave: JournalEntry) => {
    if (!user) return;
    setSaveStatus('saving');
    setSaveErrorMessage(null);

    try {
      await saveJournalEntry(user.uid, entryToSave);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err: any) {
      console.error('Save to Firestore failed:', err);
      setSaveStatus('error');
      setSaveErrorMessage(err?.message || 'Failed to save entry to Firestore.');
    }
  };

  // Handle Delete Entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteJournalEntry(user.uid, entryId);
      if (selectedEntry?.id === entryId) {
        handleNewEntry();
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      setSaveErrorMessage(err?.message || 'Failed to delete entry.');
    }
  };

  // Handle Toggle Pin
  const handleTogglePin = async (entryId: string, currentPinned: boolean) => {
    if (!user) return;
    try {
      await togglePinEntry(user.uid, entryId, currentPinned);
    } catch (err: any) {
      console.error('Pin toggle failed:', err);
    }
  };

  // Handle User Sign Out
  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Loading Screen while auth initializes
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Initializing ReflectAI...</span>
      </div>
    );
  }

  // Not signed in: Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenDigestModal={() => setIsDigestModalOpen(true)}
        entryCount={entries.length}
      />

      {/* Main App Body: Sidebar + Active Reflection Editor */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <HistorySidebar
          entries={entries}
          selectedEntryId={selectedEntry?.id || null}
          onSelectEntry={(entry) => setSelectedEntry(entry)}
          onDeleteEntry={handleDeleteEntry}
          onTogglePin={handleTogglePin}
          onNewEntry={handleNewEntry}
          loading={entriesLoading}
        />

        {selectedEntry && (
          <JournalEditor
            currentEntry={selectedEntry}
            onUpdateEntry={(updated) => setSelectedEntry(updated)}
            onSaveToFirestore={handleSaveToFirestore}
            saveStatus={saveStatus}
            errorMessage={saveErrorMessage}
          />
        )}
      </div>

      {/* Cross-Session Digest Modal */}
      <DigestModal
        entries={entries}
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
      />

      {/* Security & Isolation Inspector Modal */}
      <SecurityBadgeModal
        user={user}
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}
