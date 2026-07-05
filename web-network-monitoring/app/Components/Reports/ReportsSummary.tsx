"use client";

import { Download, Plus } from "lucide-react";
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

type CountRow = {
  label: string;
  count: number;
};

const statusStyles = {
  online: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  offline: "bg-rose-100 text-rose-700",
};

function countBy(devices: Device[], key: "type" | "location"): CountRow[] {
  const counts = devices.reduce<Record<string, number>>((accumulator, device) => {
    const label = device[key] || "Unknown";
    accumulator[label] = (accumulator[label] ?? 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function formatCsvValue(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatReportDate(date?: Device["createdAt"]) {
  return date ? date.toDate().toISOString() : "";
}

function downloadDeviceReport(devices: Device[]) {
  const headers = [
    "Device",
    "IP Address",
    "Type",
    "Location",
    "Description",
    "Status",
    "Created At",
    "Updated At",
  ];
  const rows = devices.map((device) => [
    device.name,
    device.ipAddress,
    device.type,
    device.location,
    device.description ?? "",
    device.status,
    formatReportDate(device.createdAt),
    formatReportDate(device.updatedAt),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(formatCsvValue).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `network-device-report-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsSummary() {
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

    const unsubscribe = onSnapshot(
      devicesQuery,
      (snapshot) => {
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
      () => {
        setErrorMessage("Could not load reports.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const report = useMemo(() => {
    const online = devices.filter((device) => device.status === "online").length;
    const warning = devices.filter(
      (device) => device.status === "warning",
    ).length;
    const offline = devices.filter(
      (device) => device.status === "offline",
    ).length;
    const attention = warning + offline;
    const healthScore = devices.length
      ? Math.round((online / devices.length) * 100)
      : 0;

    return {
      online,
      warning,
      offline,
      attention,
      healthScore,
      byType: countBy(devices, "type"),
      byLocation: countBy(devices, "location"),
    };
  }, [devices]);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading reports...</p>
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

  if (!devices.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No report data yet. Add devices to generate monitoring summaries.
        </p>
        <Link
          href="/devices/add"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add device
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Export Report
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Download the current device status report as a CSV file.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadDeviceReport(devices)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download CSV
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Devices", devices.length, "text-slate-950"],
          ["Health Score", `${report.healthScore}%`, "text-cyan-600"],
          ["Online", report.online, "text-emerald-600"],
          ["Needs Attention", report.attention, "text-amber-600"],
        ].map(([label, value, tone]) => (
          <article
            key={label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ReportBreakdown title="Devices by Type" rows={report.byType} />
        <ReportBreakdown title="Devices by Location" rows={report.byLocation} />
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Device Status Report
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Current state of every monitored device.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Device", "Type", "Location", "Description", "Status"].map((heading) => (
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
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-950">
                    {device.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                    {device.type}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                    {device.location}
                  </td>
                  <td className="max-w-xs px-4 py-4 text-sm text-slate-600">
                    {device.description || "No description"}
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
      </section>
    </div>
  );
}

function ReportBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: CountRow[];
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const percentage = total ? Math.round((row.count / total) * 100) : 0;

          return (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-700">{row.label}</span>
                <span className="text-slate-500">
                  {row.count} ({percentage}%)
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-600"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
