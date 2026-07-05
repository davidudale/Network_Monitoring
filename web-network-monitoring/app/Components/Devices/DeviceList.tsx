"use client";

import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../Auth/firebase";
import { type Device, type DeviceStatus } from "./types";

const statusStyles = {
  online: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  offline: "bg-rose-100 text-rose-700",
};

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingDeviceId, setDeletingDeviceId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DeviceStatus>("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
        setErrorMessage("Could not load devices.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  async function handleDelete(device: Device) {
    const confirmed = window.confirm(
      `Delete ${device.name}? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingDeviceId(device.id);
    setErrorMessage("");

    try {
      await deleteDoc(doc(db, "devices", device.id));
    } catch {
      setErrorMessage("Could not delete this device.");
    } finally {
      setDeletingDeviceId("");
    }
  }

  const deviceTypes = useMemo(
    () =>
      Array.from(new Set(devices.map((device) => device.type))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [devices],
  );

  const summary = useMemo(() => {
    const online = devices.filter((device) => device.status === "online").length;
    const warning = devices.filter(
      (device) => device.status === "warning",
    ).length;
    const offline = devices.filter(
      (device) => device.status === "offline",
    ).length;

    return [
      { label: "Total", value: devices.length, tone: "text-slate-950" },
      { label: "Online", value: online, tone: "text-emerald-600" },
      { label: "Warning", value: warning, tone: "text-amber-600" },
      { label: "Offline", value: offline, tone: "text-rose-600" },
    ];
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesSearch =
        !normalizedSearch ||
        [device.name, device.ipAddress, device.type, device.location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter;
      const matchesType = typeFilter === "all" || device.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [devices, searchTerm, statusFilter, typeFilter]);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading devices...</p>
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
          No devices yet. Add your first monitored device to start building the
          inventory.
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
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        {summary.map((metric) => (
          <article
            key={metric.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {metric.label}
            </p>
            <p className={`mt-3 text-3xl font-semibold ${metric.tone}`}>
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
          <div>
            <label
              htmlFor="device-search"
              className="text-sm font-medium text-slate-700"
            >
              Search devices
            </label>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="device-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                placeholder="Name, IP, type, or location"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="text-sm font-medium text-slate-700"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | DeviceStatus)
              }
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="warning">Warning</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="type-filter"
              className="text-sm font-medium text-slate-700"
            >
              Type
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="all">All types</option>
              {deviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/devices/add"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add device
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {filteredDevices.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Name",
                    "IP Address",
                    "Type",
                    "Location",
                    "Description",
                    "Status",
                    "Actions",
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
                {filteredDevices.map((device) => (
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
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {device.location}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-sm text-slate-600">
                      <span className="line-clamp-2">
                        {device.description || "No description"}
                      </span>
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
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/devices/${device.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(device)}
                          disabled={deletingDeviceId === device.id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {deletingDeviceId === device.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-sm text-slate-600">
              No devices match the current filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-600 hover:text-cyan-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
