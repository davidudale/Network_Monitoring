import AppShell from "../Layout/AppShell";
import AlertsList from "./AlertsList";

export default function AlertsPage() {
  return (
    <AppShell
      title="Alerts"
      description="Review active and historical network alerts."
    >
      <AlertsList />
    </AppShell>
  );
}
