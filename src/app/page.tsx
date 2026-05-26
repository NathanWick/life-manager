import { AppShell } from "@/components/layout/app-shell";
import { HashScroll } from "@/components/dashboard/hash-scroll";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default function HomePage() {
  return (
    <AppShell>
      <HashScroll />
      <DashboardHome />
    </AppShell>
  );
}
