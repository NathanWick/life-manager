# LifeQuest

A minimal life dashboard: **metrics** + **active quests** + **AI chat**. Goals and quests are created through conversation and stored in localStorage.

## What's on screen

- **Metrics** — Level, XP, streak, life progress %
- **Quests** — Active quests with a Done button
- **Chat** — Talk to your Life Agent; it creates goals & quests via tool calls

No tabs, no forms, no extra pages.

## Setup

```bash
npm install
npm run dev
```

## AI

The Life Agent uses Groq, OpenRouter, or OpenAI (checked in that order):

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Preferred (free tier) |
| `GROQ_MODEL` | Override (default: `llama-3.1-8b-instant`) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OPENAI_API_KEY` | OpenAI |

Without a key, a local keyword fallback still creates goals/quests.

## Deploy

Import to [Vercel](https://vercel.com/new) → deploy. Optionally add `GROQ_API_KEY`.
