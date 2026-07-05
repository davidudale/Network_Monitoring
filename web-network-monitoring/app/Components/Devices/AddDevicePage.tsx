import AppShell from "../Layout/AppShell";
import DeviceForm from "./DeviceForm";

export default function AddDevicePage() {
  return (
    <AppShell
      title="Add Device"
      description="Register a new device for network monitoring."
    >
      <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <DeviceForm />
      </section>
    </AppShell>
  );
}
