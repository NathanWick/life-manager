"use client";

import { LifeQuestProvider } from "@/hooks/use-lifequest";

export function Providers({ children }: { children: React.ReactNode }) {
  return <LifeQuestProvider>{children}</LifeQuestProvider>;
}
