# LifeQuest

A minimal life dashboard: **4 metrics** + **AI chat**. Goals and quests are created through conversation (stored locally).

## What's on screen

- **Metrics** — Level, XP, streak, life progress %
- **Chat** — Talk to your Life Agent; it creates goals & quests via tool calls

No tabs, no forms, no extra pages.

## Setup

```bash
npm install
npm run dev
```

## AI + MCP

The Life Agent uses a **real LLM** (Groq/OpenAI/OpenRouter) with an in-app **MCP server** so it knows which tool to call:

| MCP tool | When to use |
|----------|-------------|
| `create_north_star` | Long-term life goal / north star |
| `create_quest` | Short-term task for today/this week |
| `list_goals` | Read current goals before linking quests |
| `list_active_quests` | Read active quests |
| `get_life_stats` | Level, XP, streak |

Add `GROQ_API_KEY` in Vercel or `.env.local` ([console.groq.com](https://console.groq.com/keys)).

Optional: run the MCP server for Cursor via `npm run mcp` (see `.cursor/mcp.json`).

## Deploy

Import to [Vercel](https://vercel.com/new) → deploy. Add `GROQ_API_KEY` in environment variables.
