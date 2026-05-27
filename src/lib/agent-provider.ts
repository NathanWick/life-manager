import { AGENT_TOOLS } from "@/lib/agent-tools";
import type { OpenAITool } from "@/mcp/mcp-bridge";
import { LifeGoal, Quest } from "@/types";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatCompletionMessage {
  role: ChatRole;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

interface ProviderConfig {
  url: string;
  apiKey: string;
  model: string;
}

export function resolveAgentProvider(): ProviderConfig | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openRouterKey,
      model:
        process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  return null;
}

export function buildSystemPrompt(ctx: {
  goals: LifeGoal[];
  quests: Quest[];
  streak: number;
  level: number;
  location?: { latitude: number; longitude: number } | null;
}): string {
  const activeQuests = ctx.quests.filter((q) => q.status === "active");

  return `You are the Life Agent for LifeQuest — warm, concise, encouraging.

## Goals vs Quests (CRITICAL)
- **Goals** = LONG-TERM north stars (weeks to years). Tool: \`create_goal\`.
- **Quests** = SHORT-TERM actions (today/this week). Tool: \`create_quest\`.

## Natural language — NO FORMS
The user NEVER fills out a goal form. You MUST call \`create_goal\` whenever they describe:
- something they want in life ("I want to get fitter", "help me save money", "learn guitar")
- a new direction, dream, or long-term outcome
Infer title, category, priority, and whyItMatters from their words. Do NOT tell them to go to the Goals page or fill a form.

When they want something to do now, call \`create_quest\` with:
- actionSteps: 2-4 specific steps
- resourceUrl: YouTube search URL when a video helps (fitness, tutorials, meditation)
- resourceLabel: "Watch on YouTube"

Quests must be immediately doable (watch, do, write, call)—never "go fill out a form" or "define your north star in Goals".

If they mention **north star**, call \`create_goal\` — that IS their long-term goal.

Always use tools — never only suggest. Keep replies to 1-2 sentences.

## User state
Goals: ${JSON.stringify(
    ctx.goals.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      priority: g.priority,
      progress: g.progress,
      why: g.whyItMatters,
    }))
  )}
Active quests: ${JSON.stringify(
    activeQuests.map((q) => ({
      title: q.title,
      type: q.type,
      difficulty: q.difficulty,
      goalId: q.goalId,
    }))
  )}
Level: ${ctx.level}, Streak: ${ctx.streak} days
Location: ${ctx.location ? `${ctx.location.latitude}, ${ctx.location.longitude}` : "unknown"}`;
}

function groqFallbackModel(): string | null {
  if (!process.env.GROQ_API_KEY) return null;
  return process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";
}

async function requestCompletion(
  provider: ProviderConfig,
  body: Record<string, unknown>
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
  };

  if (provider.url.includes("openrouter.ai")) {
    headers["HTTP-Referer"] =
      process.env.OPENROUTER_REFERRER || "https://lifequest.app";
    headers["X-Title"] = "LifeQuest";
  }

  return fetch(provider.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export async function chatCompletion(params: {
  messages: ChatCompletionMessage[];
  tools?: boolean | OpenAITool[];
  modelOverride?: string;
}): Promise<{
  message: ChatCompletionMessage;
  finishReason: string;
}> {
  const provider = resolveAgentProvider();
  if (!provider) {
    throw new Error("NO_PROVIDER");
  }

  const model = params.modelOverride ?? provider.model;
  const body: Record<string, unknown> = {
    model,
    messages: params.messages,
    temperature: 0.5,
    max_tokens: 400,
  };

  if (params.tools) {
    body.tools = params.tools === true ? AGENT_TOOLS : params.tools;
    body.tool_choice = "auto";
  }

  let res = await requestCompletion(provider, body);

  if (res.status === 429 && provider.url.includes("groq.com")) {
    await new Promise((r) => setTimeout(r, 2500));
    res = await requestCompletion(provider, body);
  }

  if (res.status === 429 && provider.url.includes("groq.com")) {
    const fallback = groqFallbackModel();
    if (fallback && fallback !== model) {
      body.model = fallback;
      res = await requestCompletion(provider, body);
    }
  }

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429) {
      throw new Error(
        "RATE_LIMIT: Groq free tier limit hit. Wait 60 seconds and try again, or set GROQ_MODEL=llama-3.1-8b-instant in Vercel for higher limits."
      );
    }
    throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  return {
    message: choice?.message ?? { role: "assistant", content: "" },
    finishReason: choice?.finish_reason ?? "stop",
  };
}

export function getProviderLabel(): string {
  if (process.env.GROQ_API_KEY) return "Groq";
  if (process.env.OPENROUTER_API_KEY) return "OpenRouter";
  if (process.env.OPENAI_API_KEY) return "OpenAI";
  return "local";
}
