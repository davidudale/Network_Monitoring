"use client";

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { auth, db } from "../Auth/firebase";
import { type Device, type DeviceStatus } from "./types";

const statusOptions: DeviceStatus[] = ["online", "warning", "offline"];
const firestoreTimeoutMs = 15000;

type DeviceFormProps = {
  device?: Device;
  mode?: "create" | "edit";
};

function getSaveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "firestore-timeout") {
    return "Firestore is taking too long to respond. Check your internet connection and Firebase rules.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    switch (error.code) {
      case "permission-denied":
        return "You do not have permission to save this device. Check Firestore rules.";
      case "unavailable":
        return "Firestore is currently unavailable. Check your connection and try again.";
      case "unauthenticated":
        return "Your session expired. Sign in again before saving.";
      default:
        return `Could not save this device. Firebase returned ${error.code}.`;
    }
  }

  return "Could not save this device. Please try again.";
}

async function withFirestoreTimeout<T>(operation: Promise<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("firestore-timeout"));
    }, firestoreTimeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default function DeviceForm({ device, mode = "create" }: DeviceFormProps) {
  const router = useRouter();
  const [name, setName] = useState(device?.name ?? "");
  const [ipAddress, setIpAddress] = useState(device?.ipAddress ?? "");
  const [type, setType] = useState(device?.type ?? "Router");
  const [location, setLocation] = useState(device?.location ?? "");
  const [description, setDescription] = useState(device?.description ?? "");
  const [status, setStatus] = useState<DeviceStatus>(device?.status ?? "online");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = mode === "edit";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const user = auth.currentUser;
    if (!user) {
      setErrorMessage("You need to sign in before saving a device.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && device) {
        await withFirestoreTimeout(
          updateDoc(doc(db, "devices", device.id), {
            name,
            ipAddress,
            type,
            location,
            description,
            status,
            updatedAt: serverTimestamp(),
          }),
        );
      } else {
        await withFirestoreTimeout(
          addDoc(collection(db, "devices"), {
            name,
            ipAddress,
            type,
            location,
            description,
            status,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          }),
        );
      }

      router.push("/devices");
    } catch (error) {
      console.error("Device save failed:", error);
      setErrorMessage(getSaveErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Device name
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            placeholder="Gateway-01"
          />
        </div>

        <div>
          <label
            htmlFor="ipAddress"
            className="text-sm font-medium text-slate-700"
          >
            IP address
          </label>
          <input
            id="ipAddress"
            value={ipAddress}
            onChange={(event) => setIpAddress(event.target.value)}
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            placeholder="192.168.1.1"
          />
        </div>

        <div>
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Device type
          </label>
          <select
            id="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          >
            <option>Router</option>
            <option>Switch</option>
            <option>Access Point</option>
            <option>Server</option>
            <option>Firewall</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="location"
            className="text-sm font-medium text-slate-700"
          >
            Location
          </label>
          <input
            id="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            required
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            placeholder="Main office"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="mt-2 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          placeholder="Describe the device role or monitoring notes"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Status</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {statusOptions.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm font-medium capitalize ${
                status === option
                  ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              {option}
              <input
                type="radio"
                name="status"
                value={option}
                checked={status === option}
                onChange={() => setStatus(option)}
                className="h-4 w-4 accent-cyan-700"
              />
            </label>
          ))}
        </div>
      </fieldset>

      {errorMessage ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting
          ? "Saving device..."
          : isEditing
            ? "Update device"
            : "Save device"}
      </button>
    </form>
  );
}
