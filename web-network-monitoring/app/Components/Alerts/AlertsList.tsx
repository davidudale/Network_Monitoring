"use client";

import { CheckCheck, Eye } from "lucide-react";
import Link from "next/link";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../Auth/firebase";

type AlertStatus = "unread" | "read";
type AlertSeverity = "low" | "medium" | "high";

type MonitoringAlert = {
  id: string;
  alertId?: string;
  deviceId: string;
  deviceName: string;
  message: string;
  ownerId: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt?: Timestamp;
  readAt?: Timestamp;
  resolvedAt?: Timestamp;
};

const alertStyles: Record<
  AlertSeverity,
  { label: string; badge: string; border: string }
> = {
  high: {
    label: "High",
    badge: "bg-rose-100 text-rose-700",
    border: "border-rose-200",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
  },
  low: {
    label: "Low",
    badge: "bg-cyan-100 text-cyan-700",
    border: "border-cyan-200",
  },
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

export default function AlertsList() {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [readingAlertId, setReadingAlertId] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const alertsQuery = query(
      collection(db, "alerts"),
      where("ownerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        const loadedAlerts = snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          })) as MonitoringAlert[];

        setAlerts(
          loadedAlerts.sort(
            (a, b) =>
              (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
          ),
        );
        setIsLoading(false);
      },
      () => {
        setErrorMessage("Could not load alerts.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === "unread"),
    [alerts],
  );
  const highCount = activeAlerts.filter(
    (alert) => alert.severity === "high",
  ).length;
  const mediumCount = activeAlerts.filter(
    (alert) => alert.severity === "medium",
  ).length;

  async function handleMarkRead(alert: MonitoringAlert) {
    setErrorMessage("");
    setReadingAlertId(alert.id);

    try {
      await updateDoc(doc(db, "alerts", alert.id), {
        status: "read",
        readAt: serverTimestamp(),
      });
    } catch {
      setErrorMessage("Could not mark this alert as read.");
    } finally {
      setReadingAlertId("");
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading alerts...</p>
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
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Active Alerts", activeAlerts.length, "text-slate-950"],
          ["High", highCount, "text-rose-600"],
          ["Medium", mediumCount, "text-amber-600"],
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

      {activeAlerts.length ? (
        <section className="space-y-3">
          {activeAlerts.map((alert) => {
            const style = alertStyles[alert.severity];

            return (
              <article
                key={alert.id}
                className={`rounded-lg border bg-white p-5 shadow-sm ${style.border}`}
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-950">
                        {alert.deviceName}
                      </h2>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${style.badge}`}
                      >
                        {style.label}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-600">
                        {alert.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {alert.message}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      Created {formatTimestamp(alert.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                    {alert.status === "unread" ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(alert)}
                        disabled={readingAlertId === alert.id}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <CheckCheck className="h-4 w-4" aria-hidden="true" />
                        {readingAlertId === alert.id
                          ? "Marking..."
                          : "Mark read"}
                      </button>
                    ) : null}
                    <Link
                      href={`/devices/${alert.deviceId}/edit`}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Review Device
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">
            No active alerts
          </h2>
          <p className="mt-2 text-sm text-emerald-700">
            The monitoring agent has not reported any open alerts.
          </p>
        </section>
      )}
    </div>
  );
}
