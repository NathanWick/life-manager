import { AppShell } from "@/components/layout/app-shell";
import { GoalsConstellation } from "@/components/goals/goals-constellation";

export default function GoalsPage() {
  return (
    <AppShell subtitle="Your north stars & goals">
      <GoalsConstellation />
    </AppShell>
  );
}
