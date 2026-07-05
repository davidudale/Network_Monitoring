"use client";

import Link from "next/link";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../Auth/firebase";
import { type Device } from "../Devices/types";

const statusStyles = {
  online: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  offline: "bg-rose-100 text-rose-700",
};

export default function DashboardOverview() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const devicesQuery = query(
      collection(db, "devices"),
      where("ownerId", "==", user.uid),
    );

    const timeoutId = setTimeout(() => {
      setErrorMessage(
        "Dashboard data is taking too long to load. Check Firestore rules, indexes, and your internet connection.",
      );
      setIsLoading(false);
    }, 12000);

    const unsubscribe = onSnapshot(
      devicesQuery,
      (snapshot) => {
        clearTimeout(timeoutId);
        const loadedDevices = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as Device[];

        setDevices(
          loadedDevices.sort(
            (a, b) =>
              (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
          ),
        );
        setIsLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("Dashboard data load failed:", error);
        setErrorMessage(
          "Could not load dashboard data. Check Firestore rules and browser console details.",
        );
        setIsLoading(false);
      },
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const summary = useMemo(() => {
    const online = devices.filter((device) => device.status === "online").length;
    const warning = devices.filter(
      (device) => device.status === "warning",
    ).length;
    const offline = devices.filter(
      (device) => device.status === "offline",
    ).length;

    return [
      {
        label: "Total Devices",
        value: devices.length.toString(),
        tone: "text-slate-950",
      },
      {
        label: "Online",
        value: online.toString(),
        tone: "text-emerald-600",
      },
      {
        label: "Needs Attention",
        value: (warning + offline).toString(),
        tone: "text-amber-600",
      },
    ];
  }, [devices]);
  const recentDevices = useMemo(() => devices.slice(0, 5), [devices]);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading dashboard...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <p className="text-sm text-rose-700">{errorMessage}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {summary.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${metric.tone}`}>
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Recent Devices
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Latest devices added to your monitoring inventory.
            </p>
          </div>
          <Link
            href="/devices/add"
            className="rounded-md bg-cyan-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            Add device
          </Link>
        </div>

        {recentDevices.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Name", "IP Address", "Type", "Status"].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentDevices.map((device) => (
                  <tr key={device.id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-950">
                      {device.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-slate-600">
                      {device.ipAddress}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {device.type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                          statusStyles[device.status]
                        }`}
                      >
                        {device.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-sm text-slate-600">
              No devices yet. Add your first device to populate the dashboard.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
