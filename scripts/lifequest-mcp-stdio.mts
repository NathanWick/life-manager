#!/usr/bin/env node
/**
 * LifeQuest MCP server (stdio) — for Cursor / Claude Desktop.
 * Tools: create_north_star, create_quest, list_goals, list_active_quests, get_life_stats
 *
 * Note: stdio mode has no browser localStorage; create_* tools return action JSON
 * for the host app to apply. In-app chat uses in-memory MCP with full user state.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "lifequest", version: "1.0.0" });

server.registerTool(
  "create_north_star",
  {
    description:
      "Create a long-term north star / life goal. Use when user wants a life direction, NOT a daily task.",
    inputSchema: {
      title: z.string(),
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
      whyItMatters: z.string(),
    },
  },
  async (args) => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          action: "create_north_star",
          payload: args,
        }),
      },
    ],
  })
);

server.registerTool(
  "create_quest",
  {
    description: "Create a short-term quest for today or this week.",
    inputSchema: {
      title: z.string(),
      description: z.string(),
      type: z.enum(["daily", "weekly"]),
      difficulty: z.enum(["easy", "medium", "hard"]),
      estimatedMinutes: z.number(),
    },
  },
  async (args) => ({
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ action: "create_quest", payload: args }),
      },
    ],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
