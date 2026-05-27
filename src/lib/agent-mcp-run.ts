import {
  chatCompletion,
  ChatCompletionMessage,
  buildSystemPrompt,
  resolveAgentProvider,
} from "@/lib/agent-provider";
import { enrichQuestAction } from "@/lib/enrich-quest";
import type { AgentAction } from "@/lib/agent-tools";
import { generateFallbackReply } from "@/lib/ai-fallback";
import {
  createLifeQuestMcpClient,
  executeMcpToolCall,
  listMcpToolsAsOpenAI,
} from "@/mcp/mcp-bridge";
import { goalIdByTitle } from "@/mcp/lifequest-context";
import type { LifeGoal, Quest } from "@/types";
import type { AgentRunResult } from "@/lib/agent-run";

const MAX_TOOL_ROUNDS = 2;

export async function runLifeAgentViaMcp(input: {
  message: string;
  goals: LifeGoal[];
  quests: Quest[];
  streak: number;
  level: number;
  xp: number;
  location?: { latitude: number; longitude: number } | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AgentRunResult> {
  const provider = resolveAgentProvider();
  if (!provider) {
    return runLocalFallback(input);
  }

  const ctx = {
    goals: input.goals,
    quests: input.quests,
    streak: input.streak,
    level: input.level,
    xp: input.xp,
  };

  const client = await createLifeQuestMcpClient(ctx);
  const openaiTools = await listMcpToolsAsOpenAI(client);
  const goalMap = goalIdByTitle(input.goals);
  const allActions: AgentAction[] = [];

  const system = `Life Agent for LifeQuest. Level ${input.level}, streak ${input.streak}d.
Goals: ${JSON.stringify(input.goals.map((g) => ({ title: g.title, progress: g.progress })))}
Active quests: ${input.quests.filter((q) => q.status === "active").length}

Tools: create_north_star = long-term goal/north star. create_quest = today/this week task. list_goals, list_active_quests, get_life_stats.
User says north star → create_north_star. User wants tasks today → create_quest. Use tools; reply in 1-2 sentences.`;

  const messages: ChatCompletionMessage[] = [
    { role: "system", content: system },
    ...(input.history ?? []).slice(-4).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: input.message },
  ];

  let lastContent = "";
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const completion = await chatCompletion({
      messages,
      tools: openaiTools,
    });

    const msg = completion.message;
    if (msg.content) lastContent = msg.content;

    const toolCalls = msg.tool_calls ?? [];
    if (completion.finishReason !== "tool_calls" || toolCalls.length === 0) {
      break;
    }

    messages.push(msg);

    for (const tc of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        args = {};
      }

      const { toolMessage, action } = await executeMcpToolCall(
        client,
        tc.function.name,
        args,
        goalMap
      );

      if (action) allActions.push(action);

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: toolMessage,
      });
    }
  }

  const merged = dedupeActions(
    allActions.map((a) =>
      a.type === "create_quest" ? enrichQuestAction(a, input.goals) : a
    )
  );

  const providerLabel =
    provider.url.includes("groq.com")
      ? "groq"
      : provider.url.includes("openrouter")
        ? "openrouter"
        : "openai";

  return {
    content:
      lastContent.trim() ||
      summarize(merged) ||
      "How can I help with your north star or today's quests?",
    actions: merged,
    provider: `${providerLabel}+mcp`,
  };
}

function dedupeActions(actions: AgentAction[]): AgentAction[] {
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key =
      a.type === "create_goal" ? `g:${a.title}` : `q:${a.title}:${a.questType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarize(actions: AgentAction[]): string | null {
  if (!actions.length) return null;
  return (
    actions
      .map((a) =>
        a.type === "create_goal"
          ? `Added north star “${a.title}”`
          : `Added quest “${a.title}”`
      )
      .join(". ") + "."
  );
}

function runLocalFallback(input: {
  message: string;
  goals: LifeGoal[];
  streak: number;
  level: number;
}): AgentRunResult {
  const reply = generateFallbackReply({
    message: input.message,
    goals: input.goals,
    streak: input.streak,
    level: input.level,
    hasLocation: false,
  });
  const actions: AgentAction[] = [];
  for (const g of reply.suggestedGoals ?? []) {
    actions.push({ type: "create_goal", ...g });
  }
  for (const q of reply.suggestedQuests) {
    actions.push({
      type: "create_quest",
      title: q.title,
      description: q.description,
      questType: q.type,
      difficulty: q.difficulty,
      estimatedMinutes: q.estimatedMinutes,
      xpReward: q.xpReward,
      goalId: q.goalId,
      actionSteps: q.actionSteps,
      resourceUrl: q.resourceUrl,
      resourceLabel: q.resourceLabel,
      suggestedByAI: true,
    });
  }
  return {
    content:
      reply.content +
      "\n\n(Add GROQ_API_KEY on Vercel for full AI + MCP understanding.)",
    actions,
    provider: "local",
  };
}
