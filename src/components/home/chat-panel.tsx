"use client";

import { useEffect, useRef, useState } from "react";
import { useLifeQuest } from "@/hooks/use-lifequest";
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard";
import type { AgentAction } from "@/lib/agent-tools";
import { cn } from "@/lib/utils";

const STARTERS = [
  "My north star is to get healthier",
  "Give me 2 quests for today",
  "I want to learn guitar this year",
];

export function ChatPanel() {
  const {
    goals,
    quests,
    streak,
    level,
    xp,
    chatHistory,
    addChatMessage,
    applyAgentResult,
    hydrated,
  } = useLifeQuest();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { keyboardInset } = useMobileKeyboard();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatHistory, loading]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    // Capture prior turns before adding the new user message (React state is async).
    const priorHistory = chatHistory.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    addChatMessage({ role: "user", content: message });
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          goals,
          quests,
          streak,
          level,
          xp,
          history: priorHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      applyAgentResult((data.actions ?? []) as AgentAction[], {
        content: data.content || "Here to help!",
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      const friendly = detail.includes("RATE_LIMIT")
        ? "Rate limit hit — wait a minute and try again."
        : detail.includes("NO_PROVIDER") || detail.includes("GROQ")
          ? "Add GROQ_API_KEY to enable full AI (local fallback still works)."
          : detail;
      addChatMessage({ role: "assistant", content: friendly });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {!hydrated ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : chatHistory.length === 0 ? (
          <div className="space-y-3 py-2">
            <p className="text-center text-sm text-muted-foreground">
              Tell me your north star or what to do today — I&apos;ll create
              goals &amp; quests.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" && "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] space-y-1",
                    msg.role === "user" && "text-right"
                  )}
                >
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-3 py-2 text-left text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {msg.content}
                  </div>
                  {msg.appliedActions?.map((a, i) => (
                    <span
                      key={i}
                      className="mr-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground"
                    >
                      {a.type === "create_goal"
                        ? "Goal"
                        : a.type === "update_quest"
                          ? "Updated"
                          : "Quest"}
                      : {a.title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-muted-foreground">Thinking…</p>
            )}
            <div ref={endRef} className="h-1" />
          </div>
        )}
      </div>

      <form
        className="flex shrink-0 gap-2 border-t border-border px-3 pt-3"
        style={{
          paddingBottom: `calc(0.75rem + ${keyboardInset}px + env(safe-area-inset-bottom, 0px))`,
        }}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          enterKeyHint="send"
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your Life Agent…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
