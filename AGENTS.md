# LifeQuest

A gamified life-goal tracker built with Next.js 15 (App Router, Turbopack), TypeScript, Tailwind CSS v4, and shadcn/ui.

## Cursor Cloud specific instructions

### Running the app

- `npm run dev` starts the Next.js dev server on port 3000 (Turbopack).
- `npm run lint` runs ESLint (flat config, `eslint.config.mjs`).
- `npm run build` creates a production build (also uses Turbopack).
- No database or Docker required — all user data is in browser localStorage.

### AI Agent (chat feature)

The chat agent (`/api/chat`) uses Groq, OpenRouter, or OpenAI (checked in that order) via environment variables:

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq cloud LLM (preferred, free tier available) |
| `GROQ_MODEL` | Override model (default: `llama-3.1-8b-instant`) |
| `OPENROUTER_API_KEY` | OpenRouter LLM |
| `OPENAI_API_KEY` | OpenAI LLM |

**Without any API key**, the agent uses a local fallback (`src/lib/ai-fallback.ts`) that generates goals/quests from keywords. The app is fully functional without external services.

### Key gotchas

- The PWA service worker is disabled in development (`disable: process.env.NODE_ENV === "development"` in `next.config.ts`).
- The build emits a Turbopack/Webpack warning — this is harmless and expected.
- The `sonner` package provides toast notifications; ensure it's installed (`npm install` covers it).
