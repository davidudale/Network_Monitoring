"use client";

import Link from "next/link";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../Auth/firebase";
import { type DeviceStatus } from "../Devices/types";

type MonitoringLog = {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  ownerId: string;
  status: DeviceStatus;
  responseTime: number | null;
  checkedAt?: Timestamp;
};

const statusStyles = {
  online: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  offline: "bg-rose-100 text-rose-700",
};

function formatTimestamp(timestamp?: Timestamp) {
  if (!timestamp) {
    return "Pending timestamp";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp.toDate());
}

function formatResponseTime(responseTime: number | null) {
  return responseTime === null ? "Timeout" : `${responseTime}ms`;
}

export default function LogsTimeline() {
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const logsQuery = query(
      collection(db, "monitoringLogs"),
      where("ownerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const loadedLogs = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as MonitoringLog[];

        setLogs(
          loadedLogs
            .sort(
              (a, b) =>
                (b.checkedAt?.toMillis() ?? 0) -
                (a.checkedAt?.toMillis() ?? 0),
            )
            .slice(0, 100),
        );
        setIsLoading(false);
      },
      () => {
        setErrorMessage("Could not load logs.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading logs...</p>
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

  if (!logs.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No monitoring logs yet. Run the monitoring agent to record ping
          history.
        </p>
        <Link
          href="/devices/add"
          className="mt-4 inline-flex rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
        >
          Add device
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-950">
          Monitoring History
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Latest ping results recorded by the local monitoring agent.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Device",
                "IP Address",
                "Status",
                "Response Time",
                "Checked At",
                "Action",
              ].map((heading) => (
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
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-950">
                  {log.deviceName}
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-mono text-sm text-slate-600">
                  {log.ipAddress}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${
                      statusStyles[log.status]
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                  {formatResponseTime(log.responseTime)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                  {formatTimestamp(log.checkedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <Link
                    href={`/devices/${log.deviceId}/edit`}
                    className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
                  >
                    View device
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
