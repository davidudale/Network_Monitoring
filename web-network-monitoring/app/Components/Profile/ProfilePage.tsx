import AppShell from "../Layout/AppShell";
import ProfileSettings from "./ProfileSettings";

export default function ProfilePage() {
  return (
    <AppShell
      title="Profile"
      description="Manage administrator profile details."
    >
      <ProfileSettings />
    </AppShell>
  );
}
