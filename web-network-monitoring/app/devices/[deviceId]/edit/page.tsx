import EditDevicePage from "../../../Components/Devices/EditDevicePage";

type PageProps = {
  params: Promise<{
    deviceId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { deviceId } = await params;

  return <EditDevicePage deviceId={deviceId} />;
}
