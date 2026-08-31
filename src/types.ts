export type ReflectionMode = 
  | 'deep_reflection' 
  | 'action_planning' 
  | 'cognitive_reframe' 
  | 'socratic' 
  | 'gratitude' 
  | 'quick_summary';

export type MoodType = 
  | 'peaceful' 
  | 'grateful' 
  | 'inspired' 
  | 'focused' 
  | 'challenged' 
  | 'anxious' 
  | 'neutral';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string; // ISO string
  insights?: string[];
  tags?: string[];
  actionItems?: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mood: MoodType;
  mode: ReflectionMode;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messages: ChatMessage[];
  summary?: string;
  keyInsights?: string[];
  tags?: string[];
  pinned?: boolean;
}

export interface ReflectionRequestPayload {
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  mode?: ReflectionMode;
  mood?: MoodType;
  title?: string;
}

export interface ReflectionResponsePayload {
  reply: string;
  summary?: string;
  insights?: string[];
  tags?: string[];
  actionItems?: string[];
  modelUsed?: string;
}
