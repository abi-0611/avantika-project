export interface MemoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationMemory {
  messages: MemoryMessage[];
  enabled: boolean;
}

export interface SafetyResult {
  riskLevel: 'Safe' | 'Low' | 'Moderate' | 'High';
  category: string;
  explanation: string;
  suggestedResponse: string;
}

const memoryStore = new Map<string, ConversationMemory>();
const defaultMemoryEnabled = new Map<string, boolean>();

function memoryKey(uid: string, conversationId?: string) {
  return `${uid}:${conversationId || 'default'}`;
}

function getDefaultMemoryEnabled(uid: string) {
  return defaultMemoryEnabled.get(uid) ?? false;
}

function setDefaultMemoryEnabled(uid: string, enabled: boolean) {
  defaultMemoryEnabled.set(uid, enabled);
}

export function getMemory(uid: string, conversationId?: string): ConversationMemory {
  const key = memoryKey(uid, conversationId);
  if (!memoryStore.has(key)) memoryStore.set(key, { messages: [], enabled: getDefaultMemoryEnabled(uid) });
  return memoryStore.get(key)!;
}

export function toggleUserMemory(uid: string, enabled: boolean, conversationId?: string) {
  if (!conversationId) {
    // Treat as a global default, and apply to any existing conversations in memory.
    setDefaultMemoryEnabled(uid, enabled);
    for (const [key, mem] of memoryStore.entries()) {
      if (!key.startsWith(`${uid}:`)) continue;
      mem.enabled = enabled;
      if (!enabled) mem.messages = [];
    }
    return;
  }

  const mem = getMemory(uid, conversationId);
  mem.enabled = enabled;
  if (!enabled) mem.messages = [];
}

export function clearUserMemory(uid: string, conversationId?: string) {
  const mem = getMemory(uid, conversationId);
  mem.messages = [];
}

export function isMemoryEnabled(uid: string, conversationId?: string): boolean {
  return getMemory(uid, conversationId).enabled;
}

function addToMemory(uid: string, role: 'user' | 'assistant', content: string, conversationId?: string) {
  const mem = getMemory(uid, conversationId);
  const max = parseInt(process.env.MEMORY_MAX_MESSAGES || '20', 10);
  mem.messages.push({ role, content });
  if (mem.messages.length > max) mem.messages = mem.messages.slice(-max);
}

function normalizeRiskLevel(value: unknown): SafetyResult['riskLevel'] {
  if (value === 'Safe' || value === 'Low' || value === 'Moderate' || value === 'High') return value;
  return 'Safe';
}

function extractJSON(text: string): any {
  const trimmed = (text || '').trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // continue
    }
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const candidate = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through
    }
  }

  return null;
}

function buildSystemPrompt(history: string) {
  return `You are ShieldBot, a warm and friendly AI companion for children aged 8-16.

Your job:
1) Classify the safety risk level of the child's message
2) Write a real, natural reply as a helpful chatbot friend

RISK LEVEL RULES:
- High: self-harm, suicide, abuse, violence threats, crisis. Reply with empathy and always include: "Please call or text 988 (Suicide & Crisis Lifeline) anytime."
- Moderate: bullying, distress, inappropriate topics. Gentle redirection.
- Low: mild profanity / slightly off-topic.
- Safe: normal chat/homework.

Return ONLY JSON (no markdown):
{
  "riskLevel": "Safe" | "Low" | "Moderate" | "High",
  "category": "string",
  "explanation": "string",
  "suggestedResponse": "string"
}

${history ? `Conversation history (most recent last):\n${history}` : ''}`;
}

function buildRuleResult(rule: { keyword: string; category: string; riskLevel: string }): SafetyResult {
  const riskLevel = normalizeRiskLevel(rule.riskLevel);
  return {
    riskLevel,
    category: rule.category,
    explanation: `Flagged by keyword: ${rule.keyword}`,
    suggestedResponse:
      riskLevel === 'High'
        ? "I'm really concerned about you right now. You're not alone. Please call or text 988 (Suicide & Crisis Lifeline) anytime."
        : "I noticed something in your message. What's going on?",
  };
}

function buildParentalResult(keyword: string): SafetyResult {
  return {
    riskLevel: 'Moderate',
    category: 'Parental Override',
    explanation: `Flagged by parental filter: ${keyword}`,
    suggestedResponse: "This topic has been restricted by your guardian for your safety. Let's chat about something else!",
  };
}

async function callOllamaGenerate(body: any) {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ response: string } & Record<string, any>>;
}

export async function classifyRisk(
  text: string,
  uid?: string,
  conversationId?: string,
  rules?: Array<{ keyword: string; category: string; riskLevel: string }>,
  childSettings?: { blockedKeywords?: string[] | null; blockedTopics?: string[] | null } | null,
): Promise<SafetyResult> {
  // 1. Keyword rule check (no LLM)
  for (const rule of rules || []) {
    if (text.toLowerCase().includes(rule.keyword.toLowerCase())) {
      return buildRuleResult(rule);
    }
  }

  // 2. Parental filter check (no LLM)
  for (const kw of childSettings?.blockedKeywords || []) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      return buildParentalResult(kw);
    }
  }

  // 3. Build prompt with optional memory history
  const mem = uid ? getMemory(uid, conversationId) : { messages: [], enabled: false };
  const history =
    mem.enabled && mem.messages.length > 0
      ? mem.messages.map((m) => `${m.role}: ${m.content}`).join('\n')
      : '';

  const systemPrompt = buildSystemPrompt(history);

  // 4. Call Ollama
  const data = await callOllamaGenerate({
    model: process.env.OLLAMA_MODEL || 'llama3.2',
    prompt: `${systemPrompt}\n\nChild message: "${text}"`,
    stream: false,
    format: 'json',
  });

  const parsed = extractJSON(data.response) || {};

  const result: SafetyResult = {
    riskLevel: normalizeRiskLevel(parsed.riskLevel),
    category: typeof parsed.category === 'string' ? parsed.category : 'None',
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : 'Classified by LLM.',
    suggestedResponse:
      typeof parsed.suggestedResponse === 'string' && parsed.suggestedResponse.trim().length > 0
        ? parsed.suggestedResponse
        : "Hey! I'm ShieldBot. What's on your mind today?",
  };

  // 5. Store in memory if enabled
  if (uid && mem.enabled) {
    addToMemory(uid, 'user', text, conversationId);
    addToMemory(uid, 'assistant', result.suggestedResponse, conversationId);
  }

  return result;
}

export async function classifyImageRisk(
  base64Image: string,
  uid?: string,
  conversationId?: string,
  text?: string,
  childSettings?: { blockedKeywords?: string[] | null; blockedTopics?: string[] | null } | null,
): Promise<SafetyResult> {
  const messageText = text || '';

  // Parental filter check first
  for (const kw of childSettings?.blockedKeywords || []) {
    if (messageText.toLowerCase().includes(kw.toLowerCase())) {
      return buildParentalResult(kw);
    }
  }

  const mem = uid ? getMemory(uid, conversationId) : { messages: [], enabled: false };
  const history =
    mem.enabled && mem.messages.length > 0
      ? mem.messages.map((m) => `${m.role}: ${m.content}`).join('\n')
      : '';

  const systemPrompt = buildSystemPrompt(history);

  const cleanedBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const data = await callOllamaGenerate({
    model: process.env.OLLAMA_VISION_MODEL || 'llava',
    prompt: `${systemPrompt}\n\nChild message: "${messageText || 'No text provided'}"\n\nAnalyze the image too.`,
    images: [cleanedBase64],
    stream: false,
    format: 'json',
  });

  const parsed = extractJSON(data.response) || {};

  const result: SafetyResult = {
    riskLevel: normalizeRiskLevel(parsed.riskLevel),
    category: typeof parsed.category === 'string' ? parsed.category : 'None',
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : 'Classified by LLM (vision).',
    suggestedResponse:
      typeof parsed.suggestedResponse === 'string' && parsed.suggestedResponse.trim().length > 0
        ? parsed.suggestedResponse
        : "I can see you shared an image! What would you like to talk about?",
  };

  if (uid && mem.enabled) {
    addToMemory(uid, 'user', messageText || '[image]', conversationId);
    addToMemory(uid, 'assistant', result.suggestedResponse, conversationId);
  }

  return result;
}
