"use client";

import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../Auth/firebase";
import DeviceForm from "./DeviceForm";
import { type Device } from "./types";

type DeviceEditorProps = {
  deviceId: string;
};

export default function DeviceEditor({ deviceId }: DeviceEditorProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "devices", deviceId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setErrorMessage("Device not found.");
          setIsLoading(false);
          return;
        }

        setDevice({
          id: snapshot.id,
          ...snapshot.data(),
        } as Device);
        setIsLoading(false);
      },
      () => {
        setErrorMessage("Could not load this device.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [deviceId]);

  if (isLoading) {
    return (
      <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading device...</p>
      </section>
    );
  }

  if (errorMessage || !device) {
    return (
      <section className="max-w-3xl rounded-lg border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm text-rose-700">{errorMessage}</p>
        <Link
          href="/devices"
          className="mt-4 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          Back to devices
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <DeviceForm mode="edit" device={device} />
    </section>
  );
}
