"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { auth, db } from "../Auth/firebase";

function getAuthErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "The email or password is incorrect.";
      case "auth/email-already-in-use":
        return "An account already exists for this email.";
      case "auth/weak-password":
        return "Use a password with at least 6 characters.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/missing-email":
        return "Enter your email address first.";
      default:
        return "Authentication failed. Please try again.";
    }
  }

  return "Authentication failed. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      }
    });

    return unsubscribe;
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        await setDoc(doc(db, "users", credential.user.uid), {
          email: credential.user.email,
          displayName: "",
          role: "administrator",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("Enter your email address first.");
      return;
    }

    setIsSendingReset(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm font-medium text-cyan-700">
          Network Monitor
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-slate-950">
          {isRegistering ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isRegistering
            ? "Create an account to start monitoring your network."
            : "Sign in to access your network monitoring dashboard."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSuccessMessage("");
              }}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
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
            disabled={isSubmitting || isSendingReset}
            className="w-full rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? "Please wait..."
              : isRegistering
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="mt-5 space-y-3">
          {!isRegistering ? (
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isSubmitting || isSendingReset}
              className="w-full text-center text-sm font-medium text-slate-600 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingReset ? "Sending reset email..." : "Forgot password?"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setIsRegistering((current) => !current);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className="w-full text-center text-sm font-medium text-cyan-700 hover:text-cyan-800"
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        </div>
      </section>
    </main>
  );
}
