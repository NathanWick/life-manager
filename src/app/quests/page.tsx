import { AppShell } from "@/components/layout/app-shell";
import { QuestsSection } from "@/components/quests/quests-section";

export default function QuestsPage() {
  return (
    <AppShell title="Quests">
      <QuestsSection />
    </AppShell>
  );
}
