import AppShell from "../Layout/AppShell";
import DeviceList from "./DeviceList";

export default function DevicesPage() {
  return (
    <AppShell
      title="Devices"
      description="View and manage monitored network devices."
    >
      <DeviceList />
    </AppShell>
  );
}
