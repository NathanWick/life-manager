import { AppShell } from "@/components/layout/app-shell";
import { GoalsSection } from "@/components/goals/goals-section";

export default function GoalsPage() {
  return (
    <AppShell title="Goals">
      <GoalsSection />
    </AppShell>
  );
}
