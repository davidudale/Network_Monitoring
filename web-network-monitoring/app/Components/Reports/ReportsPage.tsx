import AppShell from "../Layout/AppShell";
import ReportsSummary from "./ReportsSummary";

export default function ReportsPage() {
  return (
    <AppShell
      title="Reports"
      description="Generate and review network monitoring reports."
    >
      <ReportsSummary />
    </AppShell>
  );
}
