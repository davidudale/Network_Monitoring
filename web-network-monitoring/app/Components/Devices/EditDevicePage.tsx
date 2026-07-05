import AppShell from "../Layout/AppShell";
import DeviceEditor from "./DeviceEditor";

type EditDevicePageProps = {
  deviceId: string;
};

export default function EditDevicePage({ deviceId }: EditDevicePageProps) {
  return (
    <AppShell
      title="Edit Device"
      description="Update device details and monitoring status."
    >
      <DeviceEditor deviceId={deviceId} />
    </AppShell>
  );
}
