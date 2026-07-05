import AppShell from "../Layout/AppShell";
import DashboardOverview from "./DashboardOverview";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      description="Monitor network health, device status, and recent activity."
    >
      <DashboardOverview />
    </AppShell>
  );
}
