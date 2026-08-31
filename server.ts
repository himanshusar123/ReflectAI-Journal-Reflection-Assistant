import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Top-level payload ingestion middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. Calls will fail until provided.');
    }
    genAIClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return genAIClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

async function generateContentWithFallback(
  systemInstruction: string,
  contents: any[]
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        contents,
      });

      const responseText = response.text;
      if (responseText) {
        return { text: responseText, modelUsed: modelName };
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} attempt failed with status/code:`, err?.status || err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All Gemini fallback models exhausted. Last error: ${lastError?.message || lastError}`);
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post('/api/reflect', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = typeof body.mode === 'string' ? body.mode : 'deep_reflection';
    const mood = typeof body.mood === 'string' ? body.mood : 'neutral';
    const rawHistory = Array.isArray(body.history) ? body.history : [];

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const systemInstruction = `You are ReflectAI, an empathetic, highly perceptive, and structured personal reflection & journaling assistant.
Your goal is to help the user unpack their thoughts, gain clarity, celebrate milestones, and find constructive insights.

Current Reflection Mode: ${mode}
User's Stated Mood: ${mood}

Guidelines based on Mode:
- deep_reflection: Ask gentle, introspective questions, explore underlying patterns, and validate feelings without toxic positivity.
- action_planning: Help distill thoughts into clear, manageable next steps and brainstorm actionable pathways.
- cognitive_reframe: Offer alternative, constructive perspectives on cognitive distortions, self-doubt, or blockers.
- socratic: Respond with 2-3 deep, curiosity-driven inquiries that help the user uncover their own answers.
- gratitude: Celebrate positive moments, highlight strengths, and deepen appreciation.
- quick_summary: Provide a crisp 3-point synthesis with highlights and emotional valence.

Format your response in natural, inspiring markdown with:
1. Empathetic and perceptive conversational reply.
2. If helpful, a bulleted "Key Insights" or "Suggested Follow-ups" section.

Keep tone warm, grounded, and concise.`;

    // Construct conversation contents
    const contents: any[] = [];
    for (const msg of rawHistory.slice(-8)) {
      if (msg && typeof msg.content === 'string') {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const { text, modelUsed } = await generateContentWithFallback(systemInstruction, contents);

    // Extract quick insights if possible
    const insights: string[] = [];
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const item = line.replace(/^[-*]\s+/, '').trim();
        if (item.length > 5 && item.length < 150) {
          insights.push(item);
        }
      }
    }

    return res.json({
      reply: text,
      insights: insights.slice(0, 3),
      tags: [mode, mood],
      modelUsed
    });
  } catch (error: any) {
    console.error('Error in /api/reflect:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process reflection with Gemini AI.'
    });
  }
});

app.post('/api/digest', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (entries.length === 0) {
      return res.status(400).json({ error: 'At least one journal entry is required for digest.' });
    }

    const compiledText = entries.map((e, idx) => {
      const title = e.title || `Entry #${idx + 1}`;
      const date = e.createdAt || '';
      const mood = e.mood || 'neutral';
      const textSummary = e.messages?.map((m: any) => `${m.sender}: ${m.text}`).join('\n') || e.summary || '';
      return `### Entry ${idx + 1}: ${title} (${date}, Mood: ${mood})\n${textSummary.slice(0, 800)}`;
    }).join('\n\n---\n\n');

    const systemInstruction = `You are an expert reflection analyst. Analyze the user's recent journal entries and generate a comprehensive "Reflection Digest".
Highlight:
1. **Recurring Themes & Patterns**: What has captured their attention or focus?
2. **Emotional Trajectory**: How has their emotional state evolved?
3. **Key Wins & Milestones**: What progress or strength is evident?
4. **Actionable Suggestions for Growth**: 2-3 tailored ideas or prompts for future journaling.

Use clean, elegant markdown formatting.`;

    const contents = [{
      role: 'user',
      parts: [{ text: `Here are my recent journal entries to analyze:\n\n${compiledText}` }]
    }];

    const { text, modelUsed } = await generateContentWithFallback(systemInstruction, contents);

    return res.json({
      digest: text,
      entryCount: entries.length,
      modelUsed
    });
  } catch (error: any) {
    console.error('Error in /api/digest:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate reflection digest.'
    });
  }
});

// Vite middleware & server startup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI Server running on port ${PORT} (dev/prod)`);
  });
}

startServer();
