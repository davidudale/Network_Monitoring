"use client";

import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import { auth, db } from "../Auth/firebase";

type UserProfile = {
  email: string;
  displayName: string;
  role: string;
};

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile>({
    email: "",
    displayName: "",
    role: "administrator",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const profileRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      profileRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          const fallbackProfile = {
            email: user.email ?? "",
            displayName: user.displayName ?? "",
            role: "administrator",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(profileRef, fallbackProfile);
          return;
        }

        const data = snapshot.data() as UserProfile;
        setProfile({
          email: data.email ?? user.email ?? "",
          displayName: data.displayName ?? "",
          role: data.role ?? "administrator",
        });
        setIsLoading(false);
      },
      () => {
        setErrorMessage("Could not load profile.");
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const user = auth.currentUser;
    if (!user) {
      setErrorMessage("You need to sign in before updating your profile.");
      return;
    }

    setIsSaving(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: user.email ?? profile.email,
          displayName: profile.displayName,
          role: profile.role,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setSuccessMessage("Profile updated.");
    } catch {
      setErrorMessage("Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading profile...</p>
      </section>
    );
  }

  return (
    <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
          />
        </div>

        <div>
          <label
            htmlFor="displayName"
            className="text-sm font-medium text-slate-700"
          >
            Display name
          </label>
          <input
            id="displayName"
            value={profile.displayName}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            placeholder="Administrator name"
          />
        </div>

        <div>
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Role
          </label>
          <input
            id="role"
            value={profile.role}
            disabled
            className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
          />
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}
