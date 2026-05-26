# LifeQuest

A personal life manager dashboard that gamifies progress toward life goals — built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Lucide** icons.

## Features

- **Dashboard** — Life progress ring, level/XP, streaks, active quests, badges
- **Life Goals** — Add/edit goals with category, priority, deadline, why it matters, progress %
- **AI Life Agent** — Chat for personalized daily/weekly quest suggestions (OpenAI optional; smart local fallback included)
- **Quests** — Daily/weekly quests with difficulty, time estimate, XP rewards
- **Location awareness** — Browser geolocation for nearby quest suggestions
- **Gamification** — XP, levels, streaks, achievements
- **PWA** — Install on your phone from the browser
- **Persistence** — `localStorage` (goals, quests, XP, chat history)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel (view on your phone)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework preset: **Next.js** (auto-detected).
4. Click **Deploy** — no extra config required.
5. On your phone, open the `*.vercel.app` URL → browser menu → **Add to Home Screen** (iOS) or **Install app** (Android).

### Optional: OpenAI Life Agent

In Vercel project **Settings → Environment Variables**, add:

- `OPENAI_API_KEY` — your API key
- `OPENAI_MODEL` — e.g. `gpt-4o-mini` (optional)

Without a key, the agent uses an built-in encouraging fallback that reads your goals and location.

## Project structure

```
src/
  app/           # Routes: /, /goals, /quests, /agent, /api/chat
  components/    # UI sections
  hooks/         # LifeQuest store (localStorage)
  lib/           # Gamification, AI fallback, location
  types/         # Shared TypeScript types
public/
  manifest.json  # PWA manifest
  sw.js          # Service worker (production)
```

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Lucide React
- @ducanh2912/next-pwa

## License

MIT
