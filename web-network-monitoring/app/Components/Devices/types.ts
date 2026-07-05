import { type Timestamp } from "firebase/firestore";

export type DeviceStatus = "online" | "warning" | "offline";

export type Device = {
  id: string;
  name: string;
  ipAddress: string;
  type: string;
  location: string;
  description?: string;
  status: DeviceStatus;
  ownerId: string;
  responseTime?: number | null;
  lastChecked?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
