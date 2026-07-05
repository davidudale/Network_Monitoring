import AppShell from "../Layout/AppShell";
import LogsTimeline from "./LogsTimeline";

export default function LogsPage() {
  return (
    <AppShell
      title="Logs"
      description="Inspect network events, system activity, and device logs."
    >
      <LogsTimeline />
    </AppShell>
  );
}
