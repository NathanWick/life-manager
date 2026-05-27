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

## AI (recommended)

Add `GROQ_API_KEY` in Vercel or `.env.local` ([console.groq.com](https://console.groq.com/keys)).

## Deploy

Import to [Vercel](https://vercel.com/new) → deploy. Add `GROQ_API_KEY` in environment variables.
