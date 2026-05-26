import { AppShell } from "@/components/layout/app-shell";
import { AiAgentChat } from "@/components/agent/ai-agent-chat";

export default function AgentPage() {
  return (
    <AppShell title="Agent" subtitle="AI Life Agent">
      <AiAgentChat />
    </AppShell>
  );
}
