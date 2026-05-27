import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { questXpReward } from "@/lib/gamification";
import type { AgentAction } from "@/lib/agent-tools";
import {
  goalIdByTitle,
  type LifeQuestMcpContext,
} from "@/mcp/lifequest-context";

function actionResult(action: AgentAction, message: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ success: true, message, action }),
      },
    ],
  };
}

export function createLifeQuestMcpServer(ctx: LifeQuestMcpContext) {
  const server = new McpServer({
    name: "lifequest",
    version: "1.0.0",
  });

  const goalMap = goalIdByTitle(ctx.goals);

  server.registerTool(
    "create_north_star",
    {
      title: "Create north star (life goal)",
      description:
        "Create a LONG-TERM north star / life goal (months to years). Use when the user mentions: north star, life goal, dream, vision, 'I want to…' for a big life change, or any sustained outcome. Do NOT use for tasks they do today.",
      inputSchema: {
        title: z.string().describe("Short goal title"),
        category: z.enum([
          "health",
          "career",
          "relationships",
          "finance",
          "learning",
          "creativity",
          "mindfulness",
          "other",
        ]),
        priority: z.enum(["low", "medium", "high"]),
        whyItMatters: z
          .string()
          .describe("Why this matters to them emotionally"),
        deadline: z
          .string()
          .optional()
          .describe("YYYY-MM-DD if mentioned"),
        progress: z.number().min(0).max(100).optional(),
      },
    },
    async ({ title, category, priority, whyItMatters, deadline, progress }) => {
      const action: AgentAction = {
        type: "create_goal",
        title,
        category,
        priority,
        whyItMatters,
        deadline,
        progress: progress ?? 0,
      };
      return actionResult(
        action,
        `North star goal "${title}" will be added to the user's Goals.`
      );
    }
  );

  server.registerTool(
    "create_quest",
    {
      title: "Create short-term quest",
      description:
        "Create a SHORT-TERM quest (today or this week) with concrete steps. Use when they ask what to do now, want daily/weekly tasks, or need actionable steps toward a goal. NOT for north stars or life goals.",
      inputSchema: {
        title: z.string(),
        description: z.string(),
        type: z.enum(["daily", "weekly"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        estimatedMinutes: z.number(),
        goalTitle: z
          .string()
          .optional()
          .describe("Link to an existing goal by title"),
        actionSteps: z.array(z.string()).optional(),
        resourceUrl: z.string().optional(),
        resourceLabel: z.string().optional(),
      },
    },
    async (args) => {
      const action: AgentAction = {
        type: "create_quest",
        title: args.title,
        description: args.description,
        questType: args.type,
        difficulty: args.difficulty,
        estimatedMinutes: args.estimatedMinutes,
        xpReward: questXpReward(args.difficulty, args.type),
        goalId: args.goalTitle
          ? goalMap.get(args.goalTitle.toLowerCase())
          : undefined,
        actionSteps: args.actionSteps,
        resourceUrl: args.resourceUrl,
        resourceLabel: args.resourceLabel,
        suggestedByAI: true,
      };
      return actionResult(
        action,
        `Quest "${args.title}" will be added (+${action.xpReward} XP).`
      );
    }
  );

  server.registerTool(
    "list_goals",
    {
      description:
        "List the user's current north star / life goals. Call before creating quests if you need to link to a goal.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            ctx.goals.map((g) => ({
              id: g.id,
              title: g.title,
              category: g.category,
              priority: g.priority,
              progress: g.progress,
              whyItMatters: g.whyItMatters,
            }))
          ),
        },
      ],
    })
  );

  server.registerTool(
    "list_active_quests",
    {
      description: "List active short-term quests.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            ctx.quests
              .filter((q) => q.status === "active")
              .map((q) => ({
                title: q.title,
                type: q.type,
                difficulty: q.difficulty,
                goalId: q.goalId,
              }))
          ),
        },
      ],
    })
  );

  server.registerTool(
    "get_life_stats",
    {
      description: "Get user level, XP, and streak.",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            level: ctx.level,
            xp: ctx.xp,
            streak: ctx.streak,
            goalCount: ctx.goals.length,
            activeQuestCount: ctx.quests.filter((q) => q.status === "active")
              .length,
          }),
        },
      ],
    })
  );

  return server;
}
