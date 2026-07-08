"use client";

import { MetricsStrip } from "@/components/home/metrics-strip";
import { QuestsList } from "@/components/home/quests-list";
import { ChatPanel } from "@/components/home/chat-panel";

export function LifeQuestApp() {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      <header className="safe-top flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          LQ
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">LifeQuest</h1>
          <p className="text-[11px] text-muted-foreground">
            Goals &amp; quests from chat
          </p>
        </div>
      </header>

      <MetricsStrip />
      <QuestsList />
      <ChatPanel />
    </div>
  );
}
